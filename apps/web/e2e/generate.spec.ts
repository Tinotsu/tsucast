/**
 * E2E Tests: Generate Flow
 *
 * Tests the critical "First Magic Moment" journey:
 * - URL input and validation
 * - Voice selection
 * - Audio generation
 * - Playback
 */

import { test, expect } from "@playwright/test";

// Test user credentials (use test account)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "testpassword123",
};

test.describe("Generate Flow", () => {
  // Skip auth tests if no test credentials
  test.skip(
    () => !process.env.TEST_USER_EMAIL,
    "Skipping - TEST_USER_EMAIL not set"
  );

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to dashboard or generate
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test.describe("URL Input", () => {
    test("should show generate form when authenticated", async ({ page }) => {
      await page.goto("/generate");

      // Form elements visible
      await expect(page.getByPlaceholder(/url|paste/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /generate/i })).toBeVisible();
    });

    test("should validate URL format", async ({ page }) => {
      await page.goto("/generate");

      // Enter invalid URL
      await page.getByPlaceholder(/url|paste/i).fill("not-a-url");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show validation error
      await expect(page.getByText(/valid url|invalid/i)).toBeVisible();
    });

    test("should accept valid URLs", async ({ page }) => {
      await page.goto("/generate");

      // Enter valid URL
      await page.getByPlaceholder(/url|paste/i).fill("https://paulgraham.com/wealth.html");

      // Should not show error
      await expect(page.getByText(/valid url|invalid/i)).not.toBeVisible();
    });
  });

  test.describe("Generation Process", () => {
    test("should show loading state during generation", async ({ page }) => {
      await page.goto("/generate");

      // Start generation
      await page.getByPlaceholder(/url|paste/i).fill("https://paulgraham.com/wealth.html");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show loading indicator
      await expect(page.getByText(/generating|processing|loading/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should disable form during generation", async ({ page }) => {
      await page.goto("/generate");

      // Start generation
      await page.getByPlaceholder(/url|paste/i).fill("https://paulgraham.com/wealth.html");
      await page.getByRole("button", { name: /generate/i }).click();

      // Input should be disabled
      await expect(page.getByPlaceholder(/url|paste/i)).toBeDisabled({ timeout: 5000 });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle parse errors gracefully", async ({ page, context }) => {
      // Mock API to return parse error
      await context.route("**/api/generate", (route) => {
        route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "PARSE_FAILED",
              message: "Could not extract content from this URL",
            },
          }),
        });
      });

      await page.goto("/generate");

      // Try to generate
      await page.getByPlaceholder(/url|paste/i).fill("https://example.com/bad-page");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show error message
      await expect(page.getByText(/could not|failed|error/i)).toBeVisible({ timeout: 10000 });

      // Should allow retry
      await expect(page.getByRole("button", { name: /try again|retry/i })).toBeVisible();
    });

    test("should handle network errors gracefully", async ({ page, context }) => {
      // Simulate network failure
      await context.route("**/api/generate", (route) => {
        route.abort("failed");
      });

      await page.goto("/generate");

      // Try to generate
      await page.getByPlaceholder(/url|paste/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show network error
      await expect(page.getByText(/network|connection|offline/i)).toBeVisible({ timeout: 10000 });
    });

    test("should handle rate limit (429) gracefully", async ({ page, context }) => {
      // Mock rate limit response
      await context.route("**/api/generate", (route) => {
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "RATE_LIMITED",
              message: "Daily limit exceeded",
            },
          }),
        });
      });

      await page.goto("/generate");

      // Try to generate
      await page.getByPlaceholder(/url|paste/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show rate limit message
      await expect(page.getByText(/limit|upgrade|tomorrow/i)).toBeVisible({ timeout: 10000 });
    });

    test("should handle server error (500) gracefully", async ({ page, context }) => {
      // Mock server error
      await context.route("**/api/generate", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              code: "INTERNAL_ERROR",
              message: "Internal server error",
            },
          }),
        });
      });

      await page.goto("/generate");

      // Try to generate
      await page.getByPlaceholder(/url|paste/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate/i }).click();

      // Should show generic error (not expose internals)
      await expect(page.getByText(/error|try again|something went wrong/i)).toBeVisible({
        timeout: 10000,
      });

      // App should still be functional
      await expect(page.getByRole("navigation")).toBeVisible();
    });
  });
});
