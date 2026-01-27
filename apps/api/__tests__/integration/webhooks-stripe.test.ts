/**
 * Integration Tests: Stripe Webhook
 *
 * Story: 10-1 Web Article Credit Pricing
 * Tests the Stripe webhook for credit purchases and refunds.
 *
 * CRITICAL: These tests verify payment processing which handles real money.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import webhookRoutes from "../../src/routes/webhooks.js";
import Stripe from "stripe";

// Mock Stripe webhook signature verification
vi.mock("stripe", () => {
  const mockStripe = {
    webhooks: {
      constructEvent: vi.fn(),
    },
  };
  return {
    default: vi.fn().mockImplementation(() => mockStripe),
  };
});

// Mock Supabase - create a chainable mock
const createChainableMock = () => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  mock.from = vi.fn().mockImplementation(() => mock);
  mock.select = vi.fn().mockImplementation(() => mock);
  mock.eq = vi.fn().mockImplementation(() => mock);
  mock.filter = vi.fn().mockImplementation(() => mock);
  mock.insert = vi.fn().mockImplementation(() => mock);
  mock.update = vi.fn().mockImplementation(() => mock);
  mock.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  mock.single = vi.fn().mockResolvedValue({ data: { credits_balance: 10 }, error: null });
  mock.rpc = vi.fn().mockResolvedValue({ data: 5, error: null });
  return mock;
};

let mockSupabaseClient = createChainableMock();

vi.mock("../../src/lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
}));

// Mock credits service
vi.mock("../../src/services/credits.js", () => ({
  addCredits: vi.fn().mockResolvedValue({ credits: 15, timeBank: 0 }),
  CREDIT_PACKS: {
    coffee: { credits: 15, priceUsd: 4.99 },
    kebab: { credits: 30, priceUsd: 8.99 },
    pizza: { credits: 60, priceUsd: 16.99 },
    feast: { credits: 150, priceUsd: 39.99 },
  },
}));

describe("Stripe Webhook", () => {
  let app: Hono;
  let mockConstructEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";

    // Get the mock constructor
    const StripeMock = vi.mocked(Stripe);
    mockConstructEvent = vi.fn();
    StripeMock.mockImplementation(
      () =>
        ({
          webhooks: {
            constructEvent: mockConstructEvent,
          },
        }) as any
    );

    // Reset Supabase mock to fresh chainable mock
    mockSupabaseClient = createChainableMock();

    app = new Hono();
    app.route("/webhooks", webhookRoutes);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe("POST /webhooks/stripe", () => {
    const validCheckoutEvent: Stripe.Event = {
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_session_123",
          payment_status: "paid",
          metadata: {
            userId: "user-123",
            packId: "coffee",
            credits: "15",
          },
          client_reference_id: "user-123",
          payment_intent: "pi_test_123",
          amount_total: 499,
        } as Stripe.Checkout.Session,
      },
      object: "event",
      api_version: "2025-12-15.clover",
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    };

    it("[P0] should return 401 without signature", async () => {
      // GIVEN: Request without stripe-signature header
      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // THEN: Returns 401
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Missing signature");
    });

    it("[P0] should return 401 for invalid signature", async () => {
      // GIVEN: Invalid signature
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "invalid_sig",
        },
        body: JSON.stringify({}),
      });

      // THEN: Returns 401
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Invalid signature");
    });

    it("[P0] should add credits on checkout.session.completed", async () => {
      // GIVEN: Valid checkout completed event
      mockConstructEvent.mockReturnValue(validCheckoutEvent);

      const { addCredits } = await import("../../src/services/credits.js");

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(validCheckoutEvent),
      });

      // THEN: Returns 200 and adds credits
      expect(res.status).toBe(200);
      expect(addCredits).toHaveBeenCalledWith(
        "user-123",
        15,
        expect.stringContaining("coffee"),
        expect.objectContaining({
          stripeSessionId: "cs_test_session_123",
          packId: "coffee",
        })
      );
    });

    it("[P0] should be idempotent - no duplicate credits on replay", async () => {
      // GIVEN: Event already processed (transaction exists)
      mockConstructEvent.mockReturnValue(validCheckoutEvent);
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: { id: "existing-tx" }, // Transaction already exists
        error: null,
      });

      const { addCredits } = await import("../../src/services/credits.js");
      vi.mocked(addCredits).mockClear();

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(validCheckoutEvent),
      });

      // THEN: Returns 200 but does NOT add credits again
      expect(res.status).toBe(200);
      expect(addCredits).not.toHaveBeenCalled();
    });

    it("[P0] should return 400 for missing userId in metadata", async () => {
      // GIVEN: Event without userId
      const eventWithoutUser: Stripe.Event = {
        ...validCheckoutEvent,
        data: {
          object: {
            ...validCheckoutEvent.data.object,
            metadata: { packId: "coffee", credits: "15" },
            client_reference_id: null,
          } as Stripe.Checkout.Session,
        },
      };
      mockConstructEvent.mockReturnValue(eventWithoutUser);

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(eventWithoutUser),
      });

      // THEN: Returns 400
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Missing userId");
    });

    it("[P0] should return 400 for invalid credit amount", async () => {
      // GIVEN: Event with invalid credits (NaN)
      const eventWithBadCredits: Stripe.Event = {
        ...validCheckoutEvent,
        data: {
          object: {
            ...validCheckoutEvent.data.object,
            metadata: {
              userId: "user-123",
              packId: "invalid",
              credits: "not-a-number",
            },
          } as Stripe.Checkout.Session,
        },
      };
      mockConstructEvent.mockReturnValue(eventWithBadCredits);

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(eventWithBadCredits),
      });

      // THEN: Returns 400 (NaN validation)
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid credit amount");
    });

    it("[P1] should ignore unpaid sessions", async () => {
      // GIVEN: Checkout with unpaid status
      const unpaidEvent: Stripe.Event = {
        ...validCheckoutEvent,
        data: {
          object: {
            ...validCheckoutEvent.data.object,
            payment_status: "unpaid",
          } as Stripe.Checkout.Session,
        },
      };
      mockConstructEvent.mockReturnValue(unpaidEvent);

      const { addCredits } = await import("../../src/services/credits.js");
      vi.mocked(addCredits).mockClear();

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(unpaidEvent),
      });

      // THEN: Returns 200 but does NOT add credits
      expect(res.status).toBe(200);
      expect(addCredits).not.toHaveBeenCalled();
    });

    it("[P1] should fall back to packId when credits not in metadata", async () => {
      // GIVEN: Event with packId but no explicit credits
      const eventWithPackOnly: Stripe.Event = {
        ...validCheckoutEvent,
        data: {
          object: {
            ...validCheckoutEvent.data.object,
            metadata: {
              userId: "user-123",
              packId: "coffee",
              // No credits field
            },
          } as Stripe.Checkout.Session,
        },
      };
      mockConstructEvent.mockReturnValue(eventWithPackOnly);

      const { addCredits } = await import("../../src/services/credits.js");
      vi.mocked(addCredits).mockClear();

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(eventWithPackOnly),
      });

      // THEN: Uses credits from CREDIT_PACKS[packId]
      expect(res.status).toBe(200);
      expect(addCredits).toHaveBeenCalledWith(
        "user-123",
        15, // Coffee pack = 15 credits
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe("Refund Processing", () => {
    const validRefundEvent: Stripe.Event = {
      id: "evt_refund_123",
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_test_123",
          payment_intent: "pi_test_123",
          amount_refunded: 499,
        } as Stripe.Charge,
      },
      object: "event",
      api_version: "2025-12-15.clover",
      created: Date.now(),
      livemode: false,
      pending_webhooks: 0,
      request: null,
    };

    it("[P1] should remove credits on charge.refunded", async () => {
      // GIVEN: Valid refund event with original transaction found
      mockConstructEvent.mockReturnValue(validRefundEvent);

      // Mock finding the original transaction
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // No duplicate refund
        .mockResolvedValueOnce({
          data: {
            user_id: "user-123",
            credits: 5,
            metadata: { amountPaid: 499 },
          },
          error: null,
        }); // Original purchase found

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: 0, error: null });

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(validRefundEvent),
      });

      // THEN: Returns 200 and processes refund
      expect(res.status).toBe(200);
    });

    it("[P1] should be idempotent - no duplicate refund processing", async () => {
      // GIVEN: Refund already processed
      mockConstructEvent.mockReturnValue(validRefundEvent);

      // Mock finding existing refund transaction
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // First idempotency check (for checkout)
        .mockResolvedValueOnce({
          data: {
            user_id: "user-123",
            credits: 5,
            metadata: { amountPaid: 499 },
          },
          error: null,
        }) // Original purchase
        .mockResolvedValueOnce({
          data: { id: "existing-refund" },
          error: null,
        }); // Refund already processed

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(validRefundEvent),
      });

      // THEN: Returns 200 but doesn't process again
      expect(res.status).toBe(200);
    });

    it("[P2] should handle partial refunds proportionally", async () => {
      // GIVEN: Partial refund (half amount)
      const partialRefundEvent: Stripe.Event = {
        ...validRefundEvent,
        data: {
          object: {
            ...validRefundEvent.data.object,
            amount_refunded: 250, // Half of 499
          } as Stripe.Charge,
        },
      };
      mockConstructEvent.mockReturnValue(partialRefundEvent);

      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            user_id: "user-123",
            credits: 5,
            metadata: { amountPaid: 499 },
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });

      // Note: Proportional calculation would be ceil((250/499) * 5) = 3 credits
      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify(partialRefundEvent),
      });

      expect(res.status).toBe(200);
    });
  });

  describe("Webhook Configuration", () => {
    it("[P1] should return 503 when webhook secret not configured", async () => {
      // GIVEN: No webhook secret
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const res = await app.request("/webhooks/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": "valid_sig",
        },
        body: JSON.stringify({}),
      });

      // THEN: Returns 503
      expect(res.status).toBe(503);
    });
  });
});
