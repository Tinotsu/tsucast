/**
 * Integration Tests: Generate Preview API
 *
 * Story: 10-1 Web Article Credit Pricing
 * Tests the /api/generate/preview endpoint for credit cost estimation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import generateRoutes from "../../src/routes/generate.js";

// Mock auth middleware
vi.mock("../../src/middleware/auth.js", () => ({
  getUserFromToken: vi.fn(),
}));

// Mock IP rate limiter - always allow
vi.mock("../../src/middleware/ip-rate-limit.js", () => ({
  ipRateLimit: () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set("rateLimit", { limited: false });
    await next();
  },
}));

// Mock fetcher
vi.mock("../../src/services/fetcher.js", () => ({
  fetchUrl: vi.fn(),
  isPdfUrl: vi.fn().mockReturnValue(false),
  fetchPdf: vi.fn(),
}));

// Mock parser
vi.mock("../../src/services/parser.js", () => ({
  parseHtmlContent: vi.fn(),
}));

// Mock PDF parser
vi.mock("../../src/services/pdfParser.js", () => ({
  parsePdfContent: vi.fn(),
  isImageOnlyPdf: vi.fn().mockReturnValue(false),
}));

// Mock credits service
vi.mock("../../src/services/credits.js", () => ({
  previewCreditCost: vi.fn(),
  deductCredits: vi.fn(),
  estimateDurationFromWords: vi.fn((words) => Math.ceil(words / 150)),
  getUserCreditBalance: vi.fn(),
  calculateCreditsNeeded: vi.fn((duration, timeBank) => {
    const effectiveDuration = Math.max(3, duration);
    const netDuration = Math.max(0, effectiveDuration - timeBank);
    const creditsNeeded = Math.ceil(netDuration / 20);
    return {
      creditsNeeded,
      newTimeBank: creditsNeeded > 0 ? creditsNeeded * 20 - netDuration : timeBank - effectiveDuration,
      effectiveDuration,
    };
  }),
}));

// Mock cache service
vi.mock("../../src/services/cache.js", () => ({
  getCacheEntry: vi.fn(),
  claimCacheEntry: vi.fn(),
  updateCacheReady: vi.fn(),
  updateCacheFailed: vi.fn(),
  getCacheEntryById: vi.fn(),
  isCacheConfigured: vi.fn().mockReturnValue(true),
  isStaleEntry: vi.fn(),
  deleteCacheEntry: vi.fn(),
}));

// Mock rate limit service
vi.mock("../../src/services/rate-limit.js", () => ({
  checkRateLimit: vi.fn(),
  incrementGenerationCount: vi.fn(),
}));

// Mock TTS service
vi.mock("../../src/services/tts.js", () => ({
  generateSpeech: vi.fn(),
}));

// Mock storage service
vi.mock("../../src/services/storage.js", () => ({
  uploadAudio: vi.fn(),
  isStorageConfigured: vi.fn().mockReturnValue(true),
}));

// Mock Supabase
vi.mock("../../src/lib/supabase.js", () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

describe("Generate Preview API", () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    app = new Hono();
    app.route("/generate", generateRoutes);
  });

  describe("POST /generate/preview", () => {
    it("[P0] should return 401 without authentication", async () => {
      // GIVEN: No auth token
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce(null);

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/article" }),
      });

      // THEN: Returns 401
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("[P0] should return 400 for missing URL", async () => {
      // GIVEN: Authenticated user with no URL
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      // WHEN: Requesting preview without URL
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({}),
      });

      // THEN: Returns 400
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_URL");
    });

    it("[P0] should return cached=true for already generated article", async () => {
      // GIVEN: Authenticated user with cached article
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: true,
        estimatedMinutes: 10,
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 0,
        hasSufficientCredits: true,
      });

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/cached-article" }),
      });

      // THEN: Returns cached=true, 0 credits needed
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isCached).toBe(true);
      expect(body.creditsNeeded).toBe(0);
    });

    it("[P0] should return correct credit estimate for new article", async () => {
      // GIVEN: Authenticated user with uncached article
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost, getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: false,
        estimatedMinutes: 0, // Will trigger content fetch
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 0,
        hasSufficientCredits: true,
      });

      // Mock the fetch to get word count
      const { fetchUrl } = await import("../../src/services/fetcher.js");
      vi.mocked(fetchUrl).mockResolvedValueOnce("<html><body><article>Test content with many words</article></body></html>");

      const { parseHtmlContent } = await import("../../src/services/parser.js");
      vi.mocked(parseHtmlContent).mockResolvedValueOnce({
        title: "Test Article",
        textContent: "Lorem ipsum...",
        wordCount: 1500, // 10 min estimated
      });

      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 5,
        timeBank: 0,
        totalPurchased: 10,
        totalUsed: 5,
      });

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/new-article" }),
      });

      // THEN: Returns credit estimate
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isCached).toBe(false);
      expect(body.estimatedMinutes).toBe(10);
      expect(body.wordCount).toBe(1500);
      expect(body.creditsNeeded).toBe(1); // 10 min = 1 credit
      expect(body.hasSufficientCredits).toBe(true);
    });

    it("[P1] should indicate insufficient credits", async () => {
      // GIVEN: User with 0 credits
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost, getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: false,
        estimatedMinutes: 0,
        creditsNeeded: 0,
        currentCredits: 0,
        currentTimeBank: 0,
        hasSufficientCredits: false,
      });

      const { fetchUrl } = await import("../../src/services/fetcher.js");
      vi.mocked(fetchUrl).mockResolvedValueOnce("<html><body><article>Content</article></body></html>");

      const { parseHtmlContent } = await import("../../src/services/parser.js");
      vi.mocked(parseHtmlContent).mockResolvedValueOnce({
        title: "Test",
        textContent: "Content...",
        wordCount: 300,
      });

      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 0,
        timeBank: 0,
        totalPurchased: 0,
        totalUsed: 0,
      });

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/article" }),
      });

      // THEN: Returns hasSufficientCredits=false
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasSufficientCredits).toBe(false);
    });

    it("[P1] should account for time bank in estimate", async () => {
      // GIVEN: User with time bank
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost, getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: false,
        estimatedMinutes: 0,
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 15, // 15 min banked
        hasSufficientCredits: true,
      });

      const { fetchUrl } = await import("../../src/services/fetcher.js");
      vi.mocked(fetchUrl).mockResolvedValueOnce("<html><body><article>Content</article></body></html>");

      const { parseHtmlContent } = await import("../../src/services/parser.js");
      vi.mocked(parseHtmlContent).mockResolvedValueOnce({
        title: "Short Article",
        textContent: "Content...",
        wordCount: 750, // 5 min
      });

      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 5,
        timeBank: 15,
        totalPurchased: 10,
        totalUsed: 5,
      });

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/short-article" }),
      });

      // THEN: 5 min article with 15 min bank = 0 credits needed
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.creditsNeeded).toBe(0);
      expect(body.currentTimeBank).toBe(15);
    });

    it("[P1] should handle fetch failure gracefully", async () => {
      // GIVEN: Article that fails to fetch
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: false,
        estimatedMinutes: 0,
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 0,
        hasSufficientCredits: true,
      });

      const { fetchUrl } = await import("../../src/services/fetcher.js");
      vi.mocked(fetchUrl).mockRejectedValueOnce(new Error("Network error"));

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/unreachable" }),
      });

      // THEN: Returns estimate with estimationFailed flag
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.estimationFailed).toBe(true);
      expect(body.creditsNeeded).toBe(1); // Default minimum
    });

    it("[P2] should handle long articles correctly", async () => {
      // GIVEN: Very long article
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost, getUserCreditBalance } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: false,
        estimatedMinutes: 0,
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 0,
        hasSufficientCredits: true,
      });

      const { fetchUrl } = await import("../../src/services/fetcher.js");
      vi.mocked(fetchUrl).mockResolvedValueOnce("<html><body><article>Long content</article></body></html>");

      const { parseHtmlContent } = await import("../../src/services/parser.js");
      vi.mocked(parseHtmlContent).mockResolvedValueOnce({
        title: "Long Article",
        textContent: "Very long content...",
        wordCount: 9000, // 60 min
      });

      vi.mocked(getUserCreditBalance).mockResolvedValueOnce({
        credits: 5,
        timeBank: 0,
        totalPurchased: 10,
        totalUsed: 5,
      });

      // WHEN: Requesting preview
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({ url: "https://example.com/long-article" }),
      });

      // THEN: Returns multiple credits needed
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.estimatedMinutes).toBe(60);
      expect(body.creditsNeeded).toBe(3); // 60 min = 3 credits
      expect(body.hasSufficientCredits).toBe(true); // User has 5 credits
    });

    it("[P2] should accept voice ID parameter", async () => {
      // GIVEN: Request with specific voice
      const { getUserFromToken } = await import("../../src/middleware/auth.js");
      vi.mocked(getUserFromToken).mockResolvedValueOnce("user-123");

      const { previewCreditCost } = await import("../../src/services/credits.js");
      vi.mocked(previewCreditCost).mockResolvedValueOnce({
        isCached: true,
        estimatedMinutes: 10,
        creditsNeeded: 0,
        currentCredits: 5,
        currentTimeBank: 0,
        hasSufficientCredits: true,
      });

      // WHEN: Requesting preview with voiceId
      const res = await app.request("/generate/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          url: "https://example.com/article",
          voiceId: "echo",
        }),
      });

      // THEN: Request succeeds with voice parameter
      expect(res.status).toBe(200);
    });
  });
});
