/**
 * E2E Tests: Library Flow
 *
 * Tests library functionality:
 * - View library items
 * - Play from library
 * - Delete items
 */

import { test, expect } from "@playwright/test";

// Test user credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "testpassword123",
};

test.describe("Library", () => {
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
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test.describe("Library View", () => {
    test("should show library page when authenticated", async ({ page }) => {
      await page.goto("/library");

      // Library page visible
      await expect(page.getByRole("heading", { name: /library/i })).toBeVisible();
    });

    test("should show empty state when no items", async ({ page, context }) => {
      // Mock empty library
      await context.route("**/api/library**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
      });

      await page.goto("/library");

      // Should show empty state
      await expect(page.getByText(/no podcasts|empty|get started/i)).toBeVisible();
    });

    test("should display library items", async ({ page, context }) => {
      // Mock library with items
      await context.route("**/api/library**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "1",
                title: "Test Article 1",
                sourceUrl: "https://example.com/1",
                duration: 300,
                createdAt: new Date().toISOString(),
              },
              {
                id: "2",
                title: "Test Article 2",
                sourceUrl: "https://example.com/2",
                duration: 600,
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await page.goto("/library");

      // Should show items
      await expect(page.getByText("Test Article 1")).toBeVisible();
      await expect(page.getByText("Test Article 2")).toBeVisible();
    });
  });

  test.describe("Library Actions", () => {
    test("should navigate to player when clicking play", async ({ page, context }) => {
      // Mock library with one item
      await context.route("**/api/library**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "test-id",
                title: "Test Article",
                sourceUrl: "https://example.com/1",
                duration: 300,
                audioUrl: "https://example.com/audio.mp3",
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await page.goto("/library");

      // Click play on the item
      await page.getByRole("button", { name: /play/i }).first().click();

      // Should show player or navigate to play page
      await expect(page.locator('[data-testid="player"], audio')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page, context }) => {
      // Mock API error
      await context.route("**/api/library**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/library");

      // Should show error state
      await expect(page.getByText(/error|failed|try again/i)).toBeVisible({ timeout: 10000 });

      // App should still be navigable
      await expect(page.getByRole("navigation")).toBeVisible();
    });
  });
});
