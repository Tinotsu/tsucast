import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Legal Pages and Account Management
 *
 * Story 9-2: Terms of Service Page
 * Story 9-3: Privacy Policy Page
 * Story 9-1: Account Deletion Flow
 * Story 9-8: E2E Test Coverage Expansion
 */

test.describe("Legal Pages", () => {
  test.describe("Terms of Service Page", () => {
    test("should be accessible without authentication", async ({ page }) => {
      // GIVEN: Visitor is not logged in
      // WHEN: They navigate to terms page
      await page.goto("/terms");

      // THEN: Page loads without redirect
      await expect(page).toHaveURL("/terms");
      await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
    });

    test("should display all required sections", async ({ page }) => {
      await page.goto("/terms");

      // Verify key legal sections are present
      await expect(page.getByText(/acceptance of terms/i)).toBeVisible();
      await expect(page.getByText(/description of service/i)).toBeVisible();
      await expect(page.getByText(/user accounts/i)).toBeVisible();
      await expect(page.getByText(/acceptable use/i)).toBeVisible();
      await expect(page.getByText(/intellectual property/i)).toBeVisible();
      await expect(page.getByText(/limitation of liability/i)).toBeVisible();
      await expect(page.getByText(/termination/i)).toBeVisible();
      await expect(page.getByText(/changes to terms/i)).toBeVisible();
    });

    test("should show last updated date", async ({ page }) => {
      await page.goto("/terms");

      // Verify last updated date is visible
      await expect(page.getByText(/last updated/i)).toBeVisible();
    });

    test("should link to Privacy Policy", async ({ page }) => {
      await page.goto("/terms");

      // Find and click privacy policy link
      const privacyLink = page.getByRole("link", { name: /privacy policy/i });
      await expect(privacyLink).toBeVisible();
      await privacyLink.click();

      // Should navigate to privacy page
      await expect(page).toHaveURL("/privacy");
    });

    test("should have responsive layout", async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/terms");

      // Content should still be visible and readable
      await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
      await expect(page.getByText(/acceptance of terms/i)).toBeVisible();
    });
  });

  test.describe("Privacy Policy Page", () => {
    test("should be accessible without authentication", async ({ page }) => {
      // GIVEN: Visitor is not logged in
      // WHEN: They navigate to privacy page
      await page.goto("/privacy");

      // THEN: Page loads without redirect
      await expect(page).toHaveURL("/privacy");
      await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
    });

    test("should display GDPR compliance sections", async ({ page }) => {
      await page.goto("/privacy");

      // Verify GDPR-required sections
      await expect(page.getByText(/data we collect/i)).toBeVisible();
      await expect(page.getByText(/how we use your data/i)).toBeVisible();
      await expect(page.getByText(/data storage/i)).toBeVisible();
      await expect(page.getByText(/your rights/i)).toBeVisible();
    });

    test("should document data collection practices", async ({ page }) => {
      await page.goto("/privacy");

      // Verify data collection disclosure
      await expect(page.getByText(/account information/i)).toBeVisible();
      await expect(page.getByText(/usage data/i)).toBeVisible();
    });

    test("should include user rights section", async ({ page }) => {
      await page.goto("/privacy");

      // GDPR/CCPA rights
      await expect(page.getByText(/access/i)).toBeVisible();
      await expect(page.getByText(/deletion/i)).toBeVisible();
      await expect(page.getByText(/portability/i)).toBeVisible();
    });

    test("should include cookie policy", async ({ page }) => {
      await page.goto("/privacy");

      await expect(page.getByText(/cookie/i)).toBeVisible();
    });

    test("should document third-party services", async ({ page }) => {
      await page.goto("/privacy");

      // Third-party disclosure
      await expect(page.getByText(/supabase/i)).toBeVisible();
      await expect(page.getByText(/fish audio/i)).toBeVisible();
    });

    test("should link to Terms of Service", async ({ page }) => {
      await page.goto("/privacy");

      const termsLink = page.getByRole("link", { name: /terms of service/i });
      await expect(termsLink).toBeVisible();
      await termsLink.click();

      await expect(page).toHaveURL("/terms");
    });

    test("should include contact information", async ({ page }) => {
      await page.goto("/privacy");

      await expect(page.getByText(/contact/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /privacy@tsucast/i })).toBeVisible();
    });
  });

  test.describe("Footer Links", () => {
    test("should have working legal links in footer from landing page", async ({ page }) => {
      await page.goto("/");

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Check footer links exist
      const footerPrivacy = page.locator("footer").getByRole("link", { name: /privacy/i });
      const footerTerms = page.locator("footer").getByRole("link", { name: /terms/i });

      await expect(footerPrivacy).toBeVisible();
      await expect(footerTerms).toBeVisible();

      // Test privacy link
      await footerPrivacy.click();
      await expect(page).toHaveURL("/privacy");
    });

    test("should have working terms link in footer", async ({ page }) => {
      await page.goto("/");

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      const footerTerms = page.locator("footer").getByRole("link", { name: /terms/i });
      await expect(footerTerms).toBeVisible();

      await footerTerms.click();
      await expect(page).toHaveURL("/terms");
    });
  });
});

test.describe("Account Deletion Flow", () => {
  test("should show delete account button in settings", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Verify delete account button is visible
    await expect(page.getByRole("button", { name: /delete account/i })).toBeVisible();
  });

  test("should show confirmation dialog when clicking delete", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Click delete account
    await page.getByRole("button", { name: /delete account/i }).click();

    // Verify confirmation dialog appears
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
    await expect(page.getByText(/type delete to confirm/i)).toBeVisible();
    await expect(page.getByPlaceholder(/type delete/i)).toBeVisible();
  });

  test("should require typing DELETE to confirm", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open delete dialog
    await page.getByRole("button", { name: /delete account/i }).click();

    // Find the delete confirmation button in the dialog
    const deleteButton = page.locator('[class*="bg-red-600"]').getByText(/delete account/i);

    // Should be disabled initially
    await expect(deleteButton).toBeDisabled();

    // Type wrong text
    await page.getByPlaceholder(/type delete/i).fill("wrong");
    await expect(deleteButton).toBeDisabled();

    // Type correct text
    await page.getByPlaceholder(/type delete/i).fill("DELETE");
    await expect(deleteButton).toBeEnabled();
  });

  test("should allow canceling deletion", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open delete dialog
    await page.getByRole("button", { name: /delete account/i }).click();
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();

    // Click cancel
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should close
    await expect(page.getByText(/cannot be undone/i)).not.toBeVisible();
  });

  test("should redirect to home after successful deletion", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    // Mock successful deletion
    await context.route("**/api/user/account*", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      }
    });

    // Mock logout
    await context.route("**/auth/v1/logout*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open delete dialog and confirm
    await page.getByRole("button", { name: /delete account/i }).click();
    await page.getByPlaceholder(/type delete/i).fill("DELETE");

    // Click the delete button in dialog
    const deleteButton = page.locator('[class*="bg-red-600"]').getByText(/delete account/i);
    await deleteButton.click();

    // Should redirect to home with deleted param
    await expect(page).toHaveURL(/\/\?deleted=true/, { timeout: 10000 });
  });

  test("should show error message on deletion failure", async ({ page, context }) => {
    // Mock authenticated state
    await context.route("**/auth/v1/user*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
        }),
      });
    });

    await context.route("**/api/user/profile*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          email: "test@example.com",
          daily_generations: 0,
          subscription_tier: "free",
        }),
      });
    });

    // Mock deletion failure
    await context.route("**/api/user/account*", (route) => {
      if (route.request().method() === "DELETE") {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: "Server error" } }),
        });
      }
    });

    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Open delete dialog and confirm
    await page.getByRole("button", { name: /delete account/i }).click();
    await page.getByPlaceholder(/type delete/i).fill("DELETE");

    const deleteButton = page.locator('[class*="bg-red-600"]').getByText(/delete account/i);
    await deleteButton.click();

    // Should show error message
    await expect(page.getByText(/failed|error/i)).toBeVisible({ timeout: 10000 });

    // Dialog should still be open
    await expect(page.getByText(/cannot be undone/i)).toBeVisible();
  });
});
