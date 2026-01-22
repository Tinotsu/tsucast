/**
 * E2E Tests: Authentication Flows
 *
 * Tests critical auth journeys:
 * - Login/logout flow
 * - Protected route redirection
 * - Auth persistence
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Flow", () => {
    test("should redirect unauthenticated users to login", async ({ page }) => {
      // GIVEN: User is not logged in
      // WHEN: Navigating to protected route
      await page.goto("/generate");

      // THEN: Should redirect to login with redirect param
      await expect(page).toHaveURL(/\/login\?redirect=.*generate/);
    });

    test("should show login form with email and password fields", async ({ page }) => {
      // WHEN: Navigating to login page
      await page.goto("/login");

      // THEN: Login form is visible
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should show validation errors for invalid input", async ({ page }) => {
      // GIVEN: On login page
      await page.goto("/login");

      // WHEN: Submitting with invalid email
      await page.getByLabel(/email/i).fill("invalid-email");
      await page.getByLabel(/password/i).fill("short");
      await page.getByRole("button", { name: /sign in/i }).click();

      // THEN: Shows validation errors
      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test("should show error message for invalid credentials", async ({ page }) => {
      // GIVEN: On login page
      await page.goto("/login");

      // WHEN: Submitting with wrong credentials
      await page.getByLabel(/email/i).fill("wrong@example.com");
      await page.getByLabel(/password/i).fill("wrongpassword123");
      await page.getByRole("button", { name: /sign in/i }).click();

      // THEN: Shows error message (not exposing if email exists)
      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Signup Flow", () => {
    test("should show signup form", async ({ page }) => {
      // WHEN: Navigating to signup page
      await page.goto("/signup");

      // THEN: Signup form is visible
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign up|create account/i })).toBeVisible();
    });

    test("should validate password requirements", async ({ page }) => {
      // GIVEN: On signup page
      await page.goto("/signup");

      // WHEN: Entering weak password
      await page.getByLabel(/email/i).fill("test@example.com");
      await page.getByLabel(/password/i).fill("weak");
      await page.getByRole("button", { name: /sign up|create account/i }).click();

      // THEN: Shows password requirements
      await expect(page.getByText(/password|characters|requirements/i)).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("should protect /generate route", async ({ page }) => {
      await page.goto("/generate");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should protect /library route", async ({ page }) => {
      await page.goto("/library");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should protect /settings route", async ({ page }) => {
      await page.goto("/settings");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should allow access to landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });
});
