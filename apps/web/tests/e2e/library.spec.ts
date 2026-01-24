import { test, expect } from "../support/fixtures";

/**
 * Library Tests
 *
 * Tests the user's podcast library.
 * Uses authenticated fixture.
 */

test.describe("Library", () => {
  test("library page loads when authenticated", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.goto("/library");

    // Should show library heading or empty state
    await expect(
      page.getByRole("heading", { name: /library/i }).or(page.getByText(/no podcasts|empty|get started/i))
    ).toBeVisible();
  });

  test("can navigate to library from navigation", async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Start from generate page
    await page.goto("/generate");

    // Click library link in navigation
    await page.getByRole("link", { name: /library/i }).click();

    // Should navigate to library
    await expect(page).toHaveURL(/\/library/);
  });
});
