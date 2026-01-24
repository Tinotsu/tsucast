import { test, expect } from "../support/fixtures";

/**
 * Authentication Flow Tests
 *
 * Tests login, signup, and logout flows.
 * Requires test user configured in environment.
 */

test.describe("Authentication", () => {
  test("can login with valid credentials", async ({ page, testUser }) => {
    await page.goto("/login");

    // Fill login form
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Should redirect to app after login
    await expect(page).toHaveURL(/\/(dashboard|generate)/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
  });

  test("unauthenticated user is redirected from protected routes", async ({ page }) => {
    // Try to access protected route
    await page.goto("/generate");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
