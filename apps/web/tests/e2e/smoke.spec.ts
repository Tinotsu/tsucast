import { test, expect } from "../support/fixtures";

/**
 * Smoke Tests - Critical path verification
 *
 * These tests verify the most important user flows work.
 * Run before every deployment.
 */

test.describe("Smoke Tests", () => {
  test("landing page loads and shows key elements", async ({ page }) => {
    await page.goto("/");

    // Verify page loads
    await expect(page).toHaveTitle(/tsucast/i);

    // Check for key CTA elements (mobile-first product)
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /download/i }).first()).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");

    // Verify login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/signup");

    // Verify signup form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();

    // Legal links present (App Store requirement)
    await expect(page.getByRole("link", { name: /terms/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy/i })).toBeVisible();
  });
});
