import { test, expect } from "../support/fixtures";

/**
 * Generate Flow Tests
 *
 * Tests the core product: converting URLs to podcasts.
 * Uses authenticated fixture for logged-in tests.
 */

test.describe("Generate Flow", () => {
  test("generate page shows URL input when authenticated", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto("/generate");

    // Verify generate page elements
    await expect(page.getByPlaceholder(/paste.*url|enter.*url/i)).toBeVisible();
  });

  test("shows voice selector on generate page", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto("/generate");

    // Voice selector should be visible
    await expect(page.getByText(/voice|select.*voice/i)).toBeVisible();
  });

  test("validates URL input before generation", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto("/generate");

    // Find and fill URL input with invalid URL
    const urlInput = page.getByPlaceholder(/paste.*url|enter.*url/i);
    await urlInput.fill("not-a-valid-url");

    // Try to generate
    const generateButton = page.getByRole("button", { name: /generate|convert/i });
    await generateButton.click();

    // Should show validation error
    await expect(page.getByText(/valid url|invalid/i)).toBeVisible();
  });

  test("shows remaining generations for free tier", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto("/generate");

    // Should show generation count/limit
    await expect(page.getByText(/remaining|left|generation/i)).toBeVisible();
  });
});
