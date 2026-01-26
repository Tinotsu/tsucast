/**
 * Integration Tests: User Credits API
 *
 * Story: 10-1 Web Article Credit Pricing
 * Tests the /api/user/credits endpoint.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import userRoutes from "../../src/routes/user.js";

// Mock auth middleware
vi.mock("../../src/middleware/auth.js", () => ({
  getUserFromToken: vi.fn(),
}));

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  auth: {
    admin: {
      deleteUser: vi.fn(),
    },
  },
};

vi.mock("../../src/lib/supabase.js", () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
}));

// Mock credits service
vi.mock("../../src/services/credits.js", () => ({
  getUserCreditBalance: vi.fn(),
}));

// Mock rate limit service
vi.mock("../../src/services/rate-limit.js", () => ({
  getRateLimitStatus: vi.fn().mockResolvedValue({
    tier: "free",
    used: 0,
    limit: 3,
    remaining: 3,
    resetAt: null,
  }),
}));

// Mock RevenueCat service
vi.mock("../../src/services/revenuecat.js", () => ({
  isRevenueCatConfigured: vi.fn().mockReturnValue(false),
  getSubscriptionDetails: vi.fn(),
  deleteSubscriber: vi.fn(),
}));

describe("User Credits API", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    app = new Hono();
    app.route("/user", userRoutes);
  });

  describe("GET /user/credits", () => {
    it("[P0] should return 401 without authentication", async () => {
      // GIVEN: No auth token
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce(null);

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer invalid-token" },
      });

      // THEN: Returns 401
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("[P0] should return credit balance for authenticated user", async () => {
      // GIVEN: Authenticated user with credits
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 5,
        timeBank: 10,
        totalPurchased: 20,
        totalUsed: 15,
      });

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });

      // THEN: Returns credit balance
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.credits).toBe(5);
      expect(body.timeBank).toBe(10);
      expect(body.totalPurchased).toBe(20);
      expect(body.totalUsed).toBe(15);
    });

    it("[P1] should return zeros for user without credit history", async () => {
      // GIVEN: Authenticated user without credit history
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("new-user");

      const { getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(getUserCreditBalance).mockResolvedValueOnce(null);

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });

      // THEN: Returns zeros
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.credits).toBe(0);
      expect(body.timeBank).toBe(0);
      expect(body.totalPurchased).toBe(0);
      expect(body.totalUsed).toBe(0);
    });

    it("[P1] should return 500 on database error", async () => {
      // GIVEN: Authenticated user
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(getUserCreditBalance).mockRejectedValueOnce(new Error("DB error"));

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });

      // THEN: Returns 500
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("FETCH_FAILED");
    });

    it("[P2] should handle large credit values", async () => {
      // GIVEN: Authenticated user with many credits
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("whale-user");

      const { getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 1000,
        timeBank: 500,
        totalPurchased: 5000,
        totalUsed: 4000,
      });

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });

      // THEN: Returns large values correctly
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.credits).toBe(1000);
      expect(body.timeBank).toBe(500);
    });

    it("[P2] should handle zero time bank correctly", async () => {
      // GIVEN: User with credits but no time bank
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 3,
        timeBank: 0,
        totalPurchased: 3,
        totalUsed: 0,
      });

      // WHEN: Getting credits
      const res = await app.request("/user/credits", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });

      // THEN: Returns correct values
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.credits).toBe(3);
      expect(body.timeBank).toBe(0);
    });
  });
});
