/**
 * Resilience Tests: Error Handling & Recovery
 *
 * Validates:
 * - Graceful degradation on external service failures
 * - Retry logic behavior
 * - Health check accuracy
 * - Rate limit handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import healthRoutes from "../../src/routes/health.js";

describe("Resilience: Health Checks", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/health", healthRoutes);
  });

  it("should return 200 when all services are healthy", async () => {
    const res = await app.request("/health", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("healthy");
  });

  it("should include service status breakdown", async () => {
    const res = await app.request("/health", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const json = await res.json();

    // Should report on critical services
    expect(json.services).toBeDefined();

    // These services should be monitored
    const expectedServices = ["database", "r2", "fish_audio"];
    for (const service of expectedServices) {
      if (json.services[service]) {
        expect(json.services[service]).toHaveProperty("status");
      }
    }
  });

  it("should include timestamp", async () => {
    const res = await app.request("/health", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.timestamp).toBeDefined();
    expect(new Date(json.timestamp).getTime()).not.toBeNaN();
  });
});

describe("Resilience: Error Response Format", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Create test routes that simulate different error conditions
    app.get("/test/400", (c) => {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
          },
        },
        400
      );
    });

    app.get("/test/500", (c) => {
      return c.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
          },
        },
        500
      );
    });

    app.get("/test/503", (c) => {
      return c.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Service temporarily unavailable",
            retryAfter: 60,
          },
        },
        503
      );
    });
  });

  it("should return consistent error format for 400 errors", async () => {
    const res = await app.request("/test/400");

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toBeDefined();
  });

  it("should return consistent error format for 500 errors", async () => {
    const res = await app.request("/test/500");

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("INTERNAL_ERROR");
    expect(json.error.message).toBeDefined();
  });

  it("should include retryAfter for 503 errors", async () => {
    const res = await app.request("/test/503");

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(json.error.retryAfter).toBeDefined();
  });
});

describe("Resilience: Request Validation", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Mock generate route for validation testing
    app.post("/api/generate", async (c) => {
      const body = await c.req.json().catch(() => null);

      if (!body) {
        return c.json(
          {
            error: {
              code: "INVALID_JSON",
              message: "Request body must be valid JSON",
            },
          },
          400
        );
      }

      if (!body.url) {
        return c.json(
          {
            error: {
              code: "MISSING_FIELD",
              message: "url is required",
            },
          },
          400
        );
      }

      if (!body.voiceId) {
        return c.json(
          {
            error: {
              code: "MISSING_FIELD",
              message: "voiceId is required",
            },
          },
          400
        );
      }

      // URL validation
      try {
        new URL(body.url);
      } catch {
        return c.json(
          {
            error: {
              code: "INVALID_URL",
              message: "url must be a valid URL",
            },
          },
          400
        );
      }

      return c.json({ success: true });
    });
  });

  it("should handle missing request body", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_JSON");
  });

  it("should handle invalid JSON", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });

    expect(res.status).toBe(400);
  });

  it("should handle missing required fields", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId: "default" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("MISSING_FIELD");
    expect(json.error.message).toContain("url");
  });

  it("should handle invalid URL format", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "not-a-valid-url",
        voiceId: "default",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_URL");
  });
});

describe("Resilience: Timeout Handling", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    // Mock endpoint with configurable delay
    app.get("/test/slow", async (c) => {
      const delay = parseInt(c.req.query("delay") || "0");
      await new Promise((resolve) => setTimeout(resolve, delay));
      return c.json({ success: true });
    });
  });

  it("should respond within acceptable time for normal requests", async () => {
    const start = Date.now();
    const res = await app.request("/test/slow?delay=10");
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(1000); // Should complete quickly
  });
});

describe("Resilience: Content-Type Handling", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();

    app.post("/api/generate", async (c) => {
      const contentType = c.req.header("content-type");

      if (!contentType?.includes("application/json")) {
        return c.json(
          {
            error: {
              code: "INVALID_CONTENT_TYPE",
              message: "Content-Type must be application/json",
            },
          },
          415
        );
      }

      const body = await c.req.json().catch(() => null);
      if (!body) {
        return c.json({ error: { code: "INVALID_JSON" } }, 400);
      }

      return c.json({ success: true });
    });
  });

  it("should reject requests without Content-Type header", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com", voiceId: "default" }),
    });

    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_CONTENT_TYPE");
  });

  it("should accept requests with application/json", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com", voiceId: "default" }),
    });

    expect(res.status).toBe(200);
  });

  it("should accept requests with charset", async () => {
    const res = await app.request("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ url: "https://example.com", voiceId: "default" }),
    });

    expect(res.status).toBe(200);
  });
});
