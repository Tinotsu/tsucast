import { test, expect } from "../support/fixtures";

/**
 * E2E Tests: Upgrade Page (Credit Purchase)
 *
 * Story: 10-1 Web Article Credit Pricing
 * Tests the upgrade page UI and purchase flow.
 */

test.describe("Upgrade Page", () => {
  test.describe("Public Access", () => {
    test("[P1] should display all credit packs", async ({ page }) => {
      // GIVEN: User navigates to upgrade page
      await page.goto("/upgrade");

      // THEN: All 4 credit packs are visible (Candy removed)
      await expect(page.getByText("Coffee")).toBeVisible();
      await expect(page.getByText("Kebab")).toBeVisible();
      await expect(page.getByText("Pizza")).toBeVisible();
      await expect(page.getByText("Feast")).toBeVisible();
    });

    test("[P1] should show pricing for each pack", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Prices are displayed
      await expect(page.getByText("$4.99")).toBeVisible();
      await expect(page.getByText("$8.99")).toBeVisible();
      await expect(page.getByText("$16.99")).toBeVisible();
      await expect(page.getByText("$39.99")).toBeVisible();
    });

    test("[P1] should highlight recommended pack", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Coffee pack is marked as Popular
      await expect(page.getByText("Popular")).toBeVisible();
    });

    test("[P1] should highlight best value pack", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Feast pack is marked as Best Value
      await expect(page.getByText("Best Value")).toBeVisible();
    });

    test("[P1] should show benefits section", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Benefits are listed
      await expect(page.getByText("Credits never expire")).toBeVisible();
      await expect(page.getByText("No subscription required")).toBeVisible();
      await expect(page.getByText("Short articles bank leftover time")).toBeVisible();
      await expect(page.getByText("7-day money back guarantee")).toBeVisible();
    });

    test("[P1] should show how credits work section", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Explanation is visible
      await expect(page.getByText("How credits work")).toBeVisible();
      await expect(page.getByText(/1 credit = 1 article/i)).toBeVisible();
    });

    test("[P2] should show sign in prompt for unauthenticated users", async ({ page }) => {
      // GIVEN: Unauthenticated user on upgrade page
      await page.goto("/upgrade");

      // THEN: Sign in prompt is visible
      await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    });

    test("[P2] should have back navigation", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Back button is present
      await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    });
  });

  test.describe("Authenticated Access", () => {
    test("[P1] should show credit balance when logged in", async ({ authenticatedPage }) => {
      // GIVEN: Authenticated user
      await authenticatedPage.goto("/upgrade");

      // THEN: Credit balance is displayed
      await expect(authenticatedPage.getByText(/\d+ credits/i)).toBeVisible();
    });

    test("[P1] Buy Now buttons should be visible for all packs", async ({ authenticatedPage }) => {
      // GIVEN: Authenticated user on upgrade page
      await authenticatedPage.goto("/upgrade");

      // THEN: All Buy Now buttons are visible
      const buyButtons = authenticatedPage.getByRole("button", { name: /buy now/i });
      await expect(buyButtons).toHaveCount(4);
    });

    test("[P1] should not show sign in prompt when logged in", async ({ authenticatedPage }) => {
      // GIVEN: Authenticated user on upgrade page
      await authenticatedPage.goto("/upgrade");

      // THEN: Sign in prompt is NOT visible
      await expect(
        authenticatedPage.getByText("Sign in to purchase credits")
      ).not.toBeVisible();
    });
  });

  test.describe("Purchase Flow", () => {
    test.skip("[P0] should redirect unauthenticated user to login on purchase attempt", async ({ page }) => {
      // GIVEN: Unauthenticated user on upgrade page
      await page.goto("/upgrade");

      // WHEN: Clicking Buy Now on any pack
      const buyButton = page.getByRole("button", { name: /buy now/i }).first();
      await buyButton.click();

      // THEN: Redirected to login with redirect back to upgrade
      await expect(page).toHaveURL(/\/login\?redirect=.*upgrade/);
    });

    // Note: Actual Stripe checkout flow can't be fully tested in E2E
    // without mocking Stripe or using test mode webhooks
    test.skip("[P0] should show loading state during checkout redirect", async ({ authenticatedPage }) => {
      // GIVEN: Authenticated user on upgrade page
      await authenticatedPage.goto("/upgrade");

      // Mock the API to delay response
      await authenticatedPage.route("**/api/checkout/credits", async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ checkoutUrl: "https://checkout.stripe.com/test", sessionId: "cs_test" }),
        });
      });

      // WHEN: Clicking Buy Now
      const buyButton = authenticatedPage.getByRole("button", { name: /buy now/i }).first();
      await buyButton.click();

      // THEN: Button shows loading state
      await expect(authenticatedPage.getByText(/redirecting/i)).toBeVisible();
    });

    test("[P1] should display error on checkout failure", async ({ authenticatedPage }) => {
      // GIVEN: Authenticated user on upgrade page
      await authenticatedPage.goto("/upgrade");

      // Mock API to fail
      await authenticatedPage.route("**/api/checkout/credits", async (route) => {
        await route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Server error" } }),
        });
      });

      // WHEN: Clicking Buy Now
      const buyButton = authenticatedPage.getByRole("button", { name: /buy now/i }).first();
      await buyButton.click();

      // THEN: Error message is displayed
      await expect(
        authenticatedPage.getByText(/failed to start checkout/i)
      ).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("[P2] should have proper heading hierarchy", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Main heading exists
      await expect(
        page.getByRole("heading", { name: /turn articles into podcasts/i })
      ).toBeVisible();
    });

    test("[P2] should have descriptive button labels", async ({ page }) => {
      // GIVEN: User on upgrade page
      await page.goto("/upgrade");

      // THEN: Buttons have clear labels
      const buttons = page.getByRole("button", { name: /buy now/i });
      await expect(buttons.first()).toBeVisible();
    });
  });
});
