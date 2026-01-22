/**
 * ATDD E2E Tests: Generate Journey (First Magic Moment)
 *
 * Story: 7-3 Web Audio Generation & Playback
 * Status: RED (Failing - Implementation requires verification)
 *
 * Acceptance Criteria Covered:
 * - AC1: URL Input & Generation
 * - AC2: Audio Playback
 */

import { test, expect } from "@playwright/test";
import { authenticatedContext, mockGenerateResponse, mockLibraryResponse } from "../support/fixtures/auth.fixture";

test.describe("Generate Journey - First Magic Moment", () => {
  test.describe("AC1: URL Input & Generation", () => {
    test("should display URL input field when authenticated", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);

      // WHEN: They navigate to generate page
      await page.goto("/generate");

      // THEN: URL input is visible
      await expect(
        page.getByPlaceholder(/url|paste|article/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("should display voice selector when authenticated", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);
      await page.goto("/generate");

      // THEN: Voice selector is visible
      await expect(
        page.locator("[data-testid='voice-selector'], select, [role='combobox']").first()
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show generate button", async ({ page, context }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);
      await page.goto("/generate");

      // THEN: Generate button is visible
      await expect(
        page.getByRole("button", { name: /generate|create/i })
      ).toBeVisible({ timeout: 10000 });
    });

    test("should disable generate button when URL is empty", async ({
      page,
      context,
    }) => {
      // GIVEN: User is on generate page with empty URL
      await authenticatedContext(context);
      await page.goto("/generate");

      // THEN: Generate button is disabled
      const generateButton = page.getByRole("button", { name: /generate|create/i });
      await expect(generateButton).toBeDisabled({ timeout: 10000 });
    });

    test("should validate URL format before generation", async ({
      page,
      context,
    }) => {
      // GIVEN: User is on generate page
      await authenticatedContext(context);
      await page.goto("/generate");

      // WHEN: They enter invalid URL
      await page.getByPlaceholder(/url|paste|article/i).fill("not-a-valid-url");

      // THEN: Generate button should be disabled (invalid URL)
      const generateButton = page.getByRole("button", { name: /generate|create/i });
      await expect(generateButton).toBeDisabled();
    });

    test("should enable generate button when valid URL is entered", async ({
      page,
      context,
    }) => {
      // GIVEN: User is on generate page
      await authenticatedContext(context);
      await page.goto("/generate");

      // WHEN: They enter valid URL
      await page.getByPlaceholder(/url|paste|article/i).fill("https://paulgraham.com/wealth.html");

      // THEN: Generate button should be enabled
      const generateButton = page.getByRole("button", { name: /generate|create/i });
      await expect(generateButton).toBeEnabled({ timeout: 5000 });
    });

    test("should show loading state during generation", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);

      // Mock slow API response
      await context.route("**/api/generate*", async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        await mockGenerateResponse(route);
      });

      await page.goto("/generate");

      // WHEN: They start generation
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // THEN: Loading state is shown
      await expect(page.getByText(/generating|loading|processing/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("should show player after successful generation", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);
      await context.route("**/api/generate*", mockGenerateResponse);

      await page.goto("/generate");

      // WHEN: They generate audio
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // THEN: Player is displayed with audio
      await expect(
        page.locator("audio, [data-testid='web-player'], [data-testid='player']")
      ).toBeVisible({ timeout: 15000 });
    });

    test("should show error message when generation fails", async ({
      page,
      context,
    }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);

      // Mock API error
      await context.route("**/api/generate*", (route) => {
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

      // WHEN: They try to generate
      await page.getByPlaceholder(/url|paste|article/i).fill("https://bad-url.com/page");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // THEN: Error message is shown
      await expect(
        page.getByText(/could not|failed|error|unable/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("AC2: Audio Playback", () => {
    test("should have play/pause button in player", async ({ page, context }) => {
      // GIVEN: User has generated audio
      await authenticatedContext(context);
      await context.route("**/api/generate*", mockGenerateResponse);

      await page.goto("/generate");
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // Wait for player to appear
      await page.waitForSelector("audio, [data-testid='web-player']", {
        timeout: 15000,
      });

      // THEN: Play button is visible
      await expect(
        page.getByRole("button", { name: /play|pause/i }).first()
      ).toBeVisible();
    });

    test("should have progress/seek bar in player", async ({ page, context }) => {
      // GIVEN: User has generated audio
      await authenticatedContext(context);
      await context.route("**/api/generate*", mockGenerateResponse);

      await page.goto("/generate");
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // Wait for player
      await page.waitForSelector("audio, [data-testid='web-player']", {
        timeout: 15000,
      });

      // THEN: Progress bar/slider is visible
      await expect(
        page.locator("[role='slider'], input[type='range'], [data-testid='progress-bar']").first()
      ).toBeVisible();
    });

    test("should display article title in player", async ({ page, context }) => {
      // GIVEN: User has generated audio
      await authenticatedContext(context);
      await context.route("**/api/generate*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            audioId: "test-audio-id",
            audioUrl: "https://example.com/audio.mp3",
            title: "Test Article Title",
            duration: 300,
          }),
        });
      });

      await page.goto("/generate");
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // Wait for player
      await page.waitForSelector("audio, [data-testid='web-player']", {
        timeout: 15000,
      });

      // THEN: Title is displayed
      await expect(page.getByText("Test Article Title")).toBeVisible();
    });

    test("should show 'View in Library' link after generation", async ({
      page,
      context,
    }) => {
      // GIVEN: User has generated audio
      await authenticatedContext(context);
      await context.route("**/api/generate*", mockGenerateResponse);

      await page.goto("/generate");
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // Wait for generation to complete
      await page.waitForSelector("audio, [data-testid='web-player']", {
        timeout: 15000,
      });

      // THEN: Library link is visible
      await expect(
        page.getByRole("link", { name: /library/i })
      ).toBeVisible();
    });

    test("should show 'Generate Another' button after generation", async ({
      page,
      context,
    }) => {
      // GIVEN: User has generated audio
      await authenticatedContext(context);
      await context.route("**/api/generate*", mockGenerateResponse);

      await page.goto("/generate");
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // Wait for generation to complete
      await page.waitForSelector("audio, [data-testid='web-player']", {
        timeout: 15000,
      });

      // THEN: Generate Another button is visible
      await expect(
        page.getByRole("button", { name: /generate another/i })
      ).toBeVisible();
    });
  });

  test.describe("Free User Limits", () => {
    test("should display remaining generations for free users", async ({
      page,
      context,
    }) => {
      // GIVEN: Free user with 1 generation used
      await authenticatedContext(context, { daily_generations: 1, is_pro: false });
      await page.goto("/generate");

      // THEN: Shows remaining count
      await expect(
        page.getByText(/2 of 3|generations.*left/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("should show upgrade prompt when at limit", async ({ page, context }) => {
      // GIVEN: Free user at limit
      await authenticatedContext(context, { daily_generations: 3, is_pro: false });
      await page.goto("/generate");

      // THEN: Shows limit reached and upgrade prompt
      await expect(page.getByText(/limit|reached/i)).toBeVisible({ timeout: 10000 });
      await expect(
        page.getByRole("link", { name: /upgrade/i })
      ).toBeVisible();
    });

    test("should disable generate button when at limit", async ({
      page,
      context,
    }) => {
      // GIVEN: Free user at limit
      await authenticatedContext(context, { daily_generations: 3, is_pro: false });
      await page.goto("/generate");

      // Fill in URL
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");

      // THEN: Generate button is disabled
      const generateButton = page.getByRole("button", { name: /generate/i });
      await expect(generateButton).toBeDisabled();
    });

    test("should not show limit banner for pro users", async ({
      page,
      context,
    }) => {
      // GIVEN: Pro user
      await authenticatedContext(context, { daily_generations: 0, is_pro: true });
      await page.goto("/generate");

      // THEN: No limit banner
      await expect(
        page.getByText(/generations.*left/i)
      ).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Error Recovery", () => {
    test("should handle rate limit (429) gracefully", async ({ page, context }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);

      // Mock rate limit
      await context.route("**/api/generate*", (route) => {
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

      // WHEN: They try to generate
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // THEN: Shows limit message
      await expect(
        page.getByText(/limit|upgrade|pro/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("should handle network errors gracefully", async ({ page, context }) => {
      // GIVEN: User is authenticated
      await authenticatedContext(context);

      // Mock network failure
      await context.route("**/api/generate*", (route) => {
        route.abort("failed");
      });

      await page.goto("/generate");

      // WHEN: Network fails during generation
      await page.getByPlaceholder(/url|paste|article/i).fill("https://example.com/article");
      await page.getByRole("button", { name: /generate|create/i }).click();

      // THEN: Error is shown (app doesn't crash)
      await expect(
        page.getByText(/error|failed|try again/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
