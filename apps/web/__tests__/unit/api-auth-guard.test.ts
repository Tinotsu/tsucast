/**
 * Unit Tests: lib/api.ts — Auth Guard Behavior
 *
 * Tests for the null-token guard that prevents unauthenticated
 * requests from being sent (which would trigger 401 cascades),
 * and for 401 → emitAuthEvent("unauthorized") behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// --- Controllable auth mock ---

let mockToken: string | null = null;

vi.mock("@/lib/auth-token", () => ({
  getAccessTokenFromCookie: vi.fn(() => mockToken),
}));

// Track auth events
const emittedEvents: string[] = [];
vi.mock("@/lib/auth-events", () => ({
  emitAuthEvent: (event: string) => {
    emittedEvents.push(event);
  },
}));

describe("API Auth Guard", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    emittedEvents.length = 0;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.resetModules();
    mockToken = null;
  });

  describe("Null-token guard (fetchApi)", () => {
    it("[P0] should throw AUTH_TOKEN_UNAVAILABLE when no token for non-public endpoint", async () => {
      // GIVEN: getSession returns no session (null token)
      mockToken = null;
      global.fetch = vi.fn();

      const { getLibrary } = await import("@/lib/api");

      // WHEN: Calling a non-public endpoint
      // THEN: Throws AUTH_TOKEN_UNAVAILABLE without making a fetch call
      const err: any = await getLibrary().catch((e) => e);
      expect(err.code).toBe("AUTH_TOKEN_UNAVAILABLE");
      expect(err.status).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("[P0] should allow public endpoints without token", async () => {
      // GIVEN: No session, but endpoint is public
      mockToken = null;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cached: false }),
      });

      const { checkCache } = await import("@/lib/api");

      // WHEN: Calling a public endpoint (cache check)
      const result = await checkCache("https://example.com");

      // THEN: Request goes through without token
      expect(global.fetch).toHaveBeenCalled();
      expect(result.cached).toBe(false);
    });

    it("[P1] should include auth header when token is available", async () => {
      // GIVEN: getSession returns a valid session
      mockToken = "my-jwt-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      const { getLibrary } = await import("@/lib/api");

      // WHEN: Calling an authenticated endpoint
      await getLibrary();

      // THEN: Authorization header is set
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-jwt-token",
          }),
        })
      );
    });
  });

  describe("Null-token guard (generateAudio)", () => {
    it("[P0] should throw AUTH_TOKEN_UNAVAILABLE when no token for generate", async () => {
      // GIVEN: No session
      mockToken = null;
      global.fetch = vi.fn();

      const { generateAudio } = await import("@/lib/api");

      // WHEN: Calling generateAudio
      // THEN: Throws without making fetch
      const err: any = await generateAudio({ url: "https://example.com/article" }).catch((e) => e);
      expect(err.code).toBe("AUTH_TOKEN_UNAVAILABLE");
      expect(err.status).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("401 → emitAuthEvent", () => {
    it("[P0] should emit unauthorized event on 401 from fetchApi", async () => {
      // GIVEN: Authenticated user, API returns 401
      mockToken = "expired-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: "UNAUTHORIZED", message: "Token expired" },
          }),
      });

      const { getLibrary } = await import("@/lib/api");

      // WHEN: API returns 401
      await expect(getLibrary()).rejects.toThrow();

      // THEN: Unauthorized event was emitted
      expect(emittedEvents).toContain("unauthorized");
    });

    it("[P0] should emit unauthorized event on non-JSON 401", async () => {
      // GIVEN: API returns 401 with non-JSON body (e.g., nginx error page)
      mockToken = "expired-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.reject(new SyntaxError("Unexpected token <")),
      });

      const { getLibrary } = await import("@/lib/api");

      // WHEN: API returns non-JSON 401
      await expect(getLibrary()).rejects.toThrow();

      // THEN: Unauthorized event was still emitted
      expect(emittedEvents).toContain("unauthorized");
    });

    it("[P0] should emit unauthorized event on 401 from generateAudio", async () => {
      // GIVEN: Authenticated, generate returns 401
      mockToken = "expired-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { code: "UNAUTHORIZED", message: "Token expired" },
          }),
      });

      const { generateAudio } = await import("@/lib/api");

      // WHEN: generateAudio gets 401
      await expect(
        generateAudio({ url: "https://example.com/article" })
      ).rejects.toThrow();

      // THEN: Unauthorized event was emitted
      expect(emittedEvents).toContain("unauthorized");
    });

    it("[P1] should NOT emit unauthorized event on 402 or other errors", async () => {
      // GIVEN: API returns 402
      mockToken = "valid-token";
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        json: () =>
          Promise.resolve({
            error: { code: "INSUFFICIENT_CREDITS", message: "No credits" },
          }),
      });

      const { getLibrary } = await import("@/lib/api");

      // WHEN: API returns 402
      await expect(getLibrary()).rejects.toThrow();

      // THEN: No unauthorized event
      expect(emittedEvents).not.toContain("unauthorized");
    });
  });
});
