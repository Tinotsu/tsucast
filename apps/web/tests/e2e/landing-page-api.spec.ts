import { test, expect } from "@playwright/test";

/**
 * Landing Page API Tests - P0/P1 (ATDD)
 *
 * Tests for the API endpoints required by the landing page.
 *
 * Risk Coverage:
 * - R-003: Featured content API returns empty/error (Score: 6)
 * - R-006: FAQ admin unauthorized access (Score: 3)
 *
 * Run: npm run test:e2e -- landing-page-api.spec.ts
 */

test.describe("Landing Page API - Featured Content", () => {
  test("API-FEAT-001: GET /api/free-content/featured returns 200", async ({
    request,
  }) => {
    // WHEN: Requesting featured content
    const response = await request.get("/api/free-content/featured");

    // THEN: Response is successful
    expect(response.status()).toBe(200);

    // AND: Response has item property (may be null if none featured)
    const data = await response.json();
    expect(data).toHaveProperty("item");
  });

  test("API-FEAT-002: GET /api/free-content/featured returns item or null", async ({
    request,
  }) => {
    // WHEN: Requesting featured content
    const response = await request.get("/api/free-content/featured");

    // THEN: Response is 200
    expect(response.status()).toBe(200);

    // AND: item is either null or has required fields
    const data = await response.json();
    if (data.item !== null) {
      expect(data.item).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        audio_url: expect.any(String),
      });
    }
  });
});

test.describe("Landing Page API - FAQ", () => {
  test("API-FAQ-001: GET /api/faq returns published FAQ items", async ({
    request,
  }) => {
    // WHEN: Requesting FAQ list
    const response = await request.get("/api/faq");

    // THEN: Response is successful
    expect(response.status()).toBe(200);

    // AND: Response has items array
    const data = await response.json();
    expect(data).toHaveProperty("items");
    expect(Array.isArray(data.items)).toBe(true);

    // AND: Each item has required fields
    if (data.items.length > 0) {
      expect(data.items[0]).toMatchObject({
        id: expect.any(String),
        question: expect.any(String),
        answer: expect.any(String),
        position: expect.any(Number),
      });
    }
  });

  test("API-FAQ-002: GET /api/faq returns items ordered by position", async ({
    request,
  }) => {
    // WHEN: Requesting FAQ list
    const response = await request.get("/api/faq");
    const { items } = await response.json();

    // THEN: Items are sorted by position ascending
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        expect(items[i].position).toBeGreaterThanOrEqual(items[i - 1].position);
      }
    }
  });

  test("API-FAQ-003: GET /api/faq excludes unpublished items", async ({
    request,
  }) => {
    // WHEN: Requesting public FAQ list
    const response = await request.get("/api/faq");
    const { items } = await response.json();

    // THEN: No items with published=false are returned
    for (const item of items) {
      expect(item.published).not.toBe(false);
    }
  });
});

test.describe("Landing Page API - Voice Samples", () => {
  test("API-VOICE-001: GET /api/voices/samples returns voice sample URLs", async ({
    request,
  }) => {
    // WHEN: Requesting voice samples
    const response = await request.get("/api/voices/samples");

    // THEN: Response is successful
    expect(response.status()).toBe(200);

    // AND: Response contains samples array
    const data = await response.json();
    expect(data).toHaveProperty("samples");
    expect(Array.isArray(data.samples)).toBe(true);

    // AND: Each sample has voice ID and audio URL
    if (data.samples.length > 0) {
      expect(data.samples[0]).toMatchObject({
        voiceId: expect.any(String),
        audioUrl: expect.any(String),
        name: expect.any(String),
      });
    }
  });

  test("API-VOICE-002: Voice samples include Adam, Sarah, Michael", async ({
    request,
  }) => {
    // WHEN: Requesting voice samples
    const response = await request.get("/api/voices/samples");
    const { samples } = await response.json();

    // THEN: Response includes expected voices
    const voiceIds = samples.map((v: { voiceId: string }) => v.voiceId);
    expect(voiceIds).toContain("am_adam");
    expect(voiceIds).toContain("af_sarah");
    expect(voiceIds).toContain("am_michael");
  });
});

test.describe("Landing Page API - Admin FAQ (P3)", () => {
  test("API-ADMIN-006: Unauthorized user cannot access admin FAQ endpoint", async ({
    request,
  }) => {
    // WHEN: Unauthenticated user tries to access admin FAQ
    const response = await request.get("/api/faq/admin");

    // THEN: Access is denied
    expect(response.status()).toBe(401);
  });

  test("API-ADMIN-001: POST /api/faq/admin creates FAQ item (auth required)", async ({
    request,
  }) => {
    // WHEN: Unauthenticated user tries to create FAQ
    const response = await request.post("/api/faq/admin", {
      data: {
        question: "Test question?",
        answer: "Test answer.",
        position: 0,
      },
    });

    // THEN: Access is denied (must be admin)
    expect(response.status()).toBe(401);
  });

  test("API-ADMIN-005: Featured toggle requires admin auth", async ({
    request,
  }) => {
    // WHEN: Unauthenticated user tries to toggle featured
    const response = await request.put(
      "/api/free-content/admin/00000000-0000-0000-0000-000000000000/featured",
      { data: { featured: true } }
    );

    // THEN: Access is denied
    expect(response.status()).toBe(401);
  });
});
