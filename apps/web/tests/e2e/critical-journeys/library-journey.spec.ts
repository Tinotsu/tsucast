/**
 * ATDD E2E Tests: Library Journey
 *
 * Story: 7-3 Web Audio Generation & Playback (AC3: Library View)
 * Status: RED (Failing - Implementation requires verification)
 *
 * Acceptance Criteria Covered:
 * - AC3: Library View
 */

import { test, expect } from "@playwright/test";
import { authenticatedContext, mockLibraryResponse, mockEmptyLibrary } from "../support/fixtures/auth.fixture";

test.describe("Library Journey", () => {
  test.describe("AC3: Library View", () => {
    test("should display library page heading when authenticated", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);
      await context.route("**/api/library*", mockLibraryResponse);

      // WHEN: They navigate to library
      await page.goto("/library");

      // THEN: Library heading is visible
      await expect(
        page.getByRole("heading", { name: /library/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display empty state when library is empty", async ({
      page,
      context,
    }) => {
      // GIVEN: User has empty library
      await authenticatedContext(context);
      await context.route("**/api/library*", mockEmptyLibrary);

      await page.goto("/library");

      // THEN: Empty state message is shown
      await expect(
        page.getByText(/empty|no podcasts|get started/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display link to generate page when library is empty", async ({
      page,
      context,
    }) => {
      // GIVEN: User has empty library
      await authenticatedContext(context);
      await context.route("**/api/library*", mockEmptyLibrary);

      await page.goto("/library");

      // THEN: Link to generate page is visible
      await expect(
        page.getByRole("link", { name: /generate|add|create/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display library items with titles", async ({ page, context }) => {
      // GIVEN: User has items in library
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "First Article Title",
              audio_url: "https://example.com/audio1.mp3",
              duration: 300,
              playback_position: 0,
              is_played: false,
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              audio_id: "audio-2",
              title: "Second Article Title",
              audio_url: "https://example.com/audio2.mp3",
              duration: 600,
              playback_position: 300,
              is_played: false,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // THEN: Items are displayed
      await expect(page.getByText("First Article Title")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Second Article Title")).toBeVisible();
    });

    test("should display item count in library", async ({ page, context }) => {
      // GIVEN: User has 2 items
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "First Article",
              audio_url: "https://example.com/audio1.mp3",
              duration: 300,
              playback_position: 0,
              is_played: false,
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              audio_id: "audio-2",
              title: "Second Article",
              audio_url: "https://example.com/audio2.mp3",
              duration: 600,
              playback_position: 0,
              is_played: false,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // THEN: Item count is displayed
      await expect(page.getByText(/2 items/i)).toBeVisible({ timeout: 10000 });
    });

    test("should display duration for each item", async ({ page, context }) => {
      // GIVEN: User has items with duration
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "Five Minute Article",
              audio_url: "https://example.com/audio1.mp3",
              duration: 300, // 5 minutes
              playback_position: 0,
              is_played: false,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // THEN: Duration is displayed (5 min)
      await expect(page.getByText(/5 min/i)).toBeVisible({ timeout: 10000 });
    });

    test("should have play button for each item", async ({ page, context }) => {
      // GIVEN: User has items in library
      await authenticatedContext(context);
      await context.route("**/api/library*", mockLibraryResponse);

      await page.goto("/library");

      // Wait for items to load
      await page.waitForSelector("[data-testid='library-item'], button", {
        timeout: 10000,
      });

      // THEN: Play button is visible for items
      const playButtons = page.getByRole("button", { name: /play/i });
      await expect(playButtons.first()).toBeVisible();
    });

    test("should show player when item is selected", async ({ page, context }) => {
      // GIVEN: User has items in library
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "Test Article",
              audio_url: "https://example.com/audio1.mp3",
              duration: 300,
              playback_position: 0,
              is_played: false,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // WHEN: User clicks play on an item
      const playButton = page.getByRole("button", { name: /play/i }).first();
      await playButton.click();

      // THEN: Player is shown with the item
      await expect(
        page.locator("audio, [data-testid='web-player'], [data-testid='player']")
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show progress bar for partially played items", async ({
      page,
      context,
    }) => {
      // GIVEN: User has a partially played item
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "Partially Played Article",
              audio_url: "https://example.com/audio1.mp3",
              duration: 600,
              playback_position: 300, // 50% played
              is_played: false,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // Wait for items to load
      await expect(page.getByText("Partially Played Article")).toBeVisible({
        timeout: 10000,
      });

      // THEN: Progress bar is visible (should show 50% progress)
      // Look for any progress indicator
      const progressBar = page.locator(
        "[role='progressbar'], .bg-amber-500, [data-testid='progress-bar']"
      );
      await expect(progressBar.first()).toBeVisible();
    });

    test("should show 'Played' indicator for completed items", async ({
      page,
      context,
    }) => {
      // GIVEN: User has a completed item
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "1",
              audio_id: "audio-1",
              title: "Completed Article",
              audio_url: "https://example.com/audio1.mp3",
              duration: 300,
              playback_position: 300,
              is_played: true,
              created_at: new Date().toISOString(),
            },
          ]),
        });
      });

      await page.goto("/library");

      // THEN: Played indicator is visible
      await expect(page.getByText(/played|completed|done/i)).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("Library Actions", () => {
    test("should have delete button for items", async ({ page, context }) => {
      // GIVEN: User has items in library
      await authenticatedContext(context);
      await context.route("**/api/library*", mockLibraryResponse);

      await page.goto("/library");

      // Wait for library items to load (deterministic wait)
      const item = page.locator("[data-testid='library-item']").first();
      await expect(item).toBeVisible({ timeout: 10000 });

      // THEN: Delete button exists (hover to reveal if needed)
      await item.hover();

      // Look for delete/trash button - use combined selector
      const deleteButton = page.locator(
        "button[aria-label*='delete'], button[aria-label*='remove'], [data-testid='delete-button'], button:has(svg.lucide-trash)"
      ).first();
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
    });

    test("should remove item from list when deleted", async ({ page, context }) => {
      // GIVEN: User has items in library
      await authenticatedContext(context);

      let items = [
        {
          id: "1",
          audio_id: "audio-1",
          title: "Item to Delete",
          audio_url: "https://example.com/audio1.mp3",
          duration: 300,
          playback_position: 0,
          is_played: false,
          created_at: new Date().toISOString(),
        },
      ];

      await context.route("**/api/library*", (route) => {
        if (route.request().method() === "GET") {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(items),
          });
        } else if (route.request().method() === "DELETE") {
          items = [];
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        }
      });

      await page.goto("/library");

      // Wait for item to appear
      await expect(page.getByText("Item to Delete")).toBeVisible({ timeout: 10000 });

      // WHEN: User deletes item (hover to reveal, then click)
      const deleteButton = page.locator("button").filter({ has: page.locator("svg") }).last();
      await deleteButton.click();

      // THEN: Item is removed (or shows empty state)
      await expect(page.getByText("Item to Delete")).not.toBeVisible({ timeout: 10000 });
    });

    test("should have Add New button linking to generate page", async ({
      page,
      context,
    }) => {
      // GIVEN: User is on library page
      await authenticatedContext(context);
      await context.route("**/api/library*", mockLibraryResponse);

      await page.goto("/library");

      // THEN: Add New button links to generate
      const addButton = page.getByRole("link", { name: /add new|add|create/i });
      await expect(addButton).toBeVisible({ timeout: 10000 });
      await expect(addButton).toHaveAttribute("href", /\/generate/);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page, context }) => {
      // GIVEN: API fails
      await authenticatedContext(context);
      await context.route("**/api/library*", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/library");

      // THEN: Error state is shown OR empty state (graceful degradation)
      // The app should not crash
      await expect(page.locator("body")).toBeVisible();

      // Navigation should still work
      await expect(page.getByRole("navigation")).toBeVisible();
    });

    test("should redirect to login when session expires", async ({
      page,
      context,
    }) => {
      // GIVEN: Session has expired
      await context.route("**/auth/v1/user*", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "JWT expired" }),
        });
      });

      // WHEN: User tries to access library
      await page.goto("/library");

      // THEN: Redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });
});
