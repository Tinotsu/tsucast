/**
 * ATDD E2E Tests: Authentication Journey
 *
 * Story: 7-2 Web Authentication Flow
 * Status: RED (Failing - Implementation incomplete)
 *
 * Acceptance Criteria Covered:
 * - AC1: Login Form
 * - AC2: Session Establishment
 * - AC3: Account Creation
 * - AC4: Logout
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication Journey", () => {
  test.describe("AC1: Login Form", () => {
    test("should display email/password login form when visiting login page", async ({
      page,
    }) => {
      // GIVEN: Visitor is on web app
      // WHEN: They navigate to login page
      await page.goto("/login");

      // THEN: They see email/password login form
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should display social login options (Google)", async ({ page }) => {
      // GIVEN: Visitor is on login page
      await page.goto("/login");

      // THEN: They see Google login option
      await expect(
        page.getByRole("button", { name: /continue with google/i })
      ).toBeVisible();
    });

    test("should display social login options (Apple)", async ({ page }) => {
      // GIVEN: Visitor is on login page
      await page.goto("/login");

      // THEN: They see Apple login option
      await expect(
        page.getByRole("button", { name: /continue with apple/i })
      ).toBeVisible();
    });

    test("should have link to signup page", async ({ page }) => {
      // GIVEN: Visitor is on login page
      await page.goto("/login");

      // THEN: They see link to create account
      await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
    });
  });

  test.describe("AC2: Session Establishment", () => {
    test("should redirect to dashboard after successful login", async ({
      page,
      context,
    }) => {
      // GIVEN: User has valid credentials
      // Mock the Supabase auth response
      await context.route("**/auth/v1/token*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "mock-refresh-token",
            user: {
              id: "test-user-id",
              email: "test@example.com",
              created_at: new Date().toISOString(),
            },
          }),
        });
      });

      await page.goto("/login");

      // WHEN: User submits valid credentials
      await page.getByLabel(/email/i).fill("test@example.com");
      await page.getByLabel(/password/i).fill("validpassword123");
      await page.getByRole("button", { name: /sign in/i }).click();

      // THEN: They are redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test("should show error message for invalid credentials", async ({
      page,
      context,
    }) => {
      // GIVEN: User has invalid credentials
      // Mock the Supabase auth error response
      await context.route("**/auth/v1/token*", (route) => {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: "invalid_grant",
            error_description: "Invalid login credentials",
          }),
        });
      });

      await page.goto("/login");

      // WHEN: User submits invalid credentials
      await page.getByLabel(/email/i).fill("wrong@example.com");
      await page.getByLabel(/password/i).fill("wrongpassword");
      await page.getByRole("button", { name: /sign in/i }).click();

      // THEN: Error message is displayed
      await expect(
        page.getByText(/invalid|incorrect|error/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test("should persist session and allow access to protected routes", async ({
      page,
      context,
    }) => {
      // GIVEN: User is logged in (mock auth state)
      await context.route("**/auth/v1/user*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-user-id",
            email: "test@example.com",
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          }),
        });
      });

      // Mock user profile endpoint
      await context.route("**/api/user/profile*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-user-id",
            email: "test@example.com",
            daily_generations: 0,
            is_pro: false,
          }),
        });
      });

      // WHEN: User navigates to protected route
      await page.goto("/generate");

      // THEN: They can access the page (not redirected to login)
      await expect(page.getByRole("heading", { name: /generate/i })).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe("AC3: Account Creation", () => {
    test("should display signup form with all required fields", async ({
      page,
    }) => {
      // GIVEN: Visitor wants to create account
      // WHEN: They navigate to signup page
      await page.goto("/signup");

      // THEN: They see email, password, and confirm password fields
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/^password$/i)).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create account/i })
      ).toBeVisible();
    });

    test("should show error when passwords do not match", async ({ page }) => {
      // GIVEN: User is on signup page
      await page.goto("/signup");

      // WHEN: They enter mismatched passwords
      await page.getByLabel(/email/i).fill("new@example.com");
      await page.getByLabel(/^password$/i).fill("password123");
      await page.getByLabel(/confirm password/i).fill("different123");
      await page.getByRole("button", { name: /create account/i }).click();

      // THEN: Error message about password mismatch is shown
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });

    test("should show error when password is too short", async ({ page }) => {
      // GIVEN: User is on signup page
      await page.goto("/signup");

      // WHEN: They enter a password that's too short
      await page.getByLabel(/email/i).fill("new@example.com");
      await page.getByLabel(/^password$/i).fill("short");
      await page.getByLabel(/confirm password/i).fill("short");
      await page.getByRole("button", { name: /create account/i }).click();

      // THEN: Error message about password length is shown
      await expect(
        page.getByText(/password|8 characters|too short/i)
      ).toBeVisible();
    });

    test("should create account and redirect to dashboard on success", async ({
      page,
      context,
    }) => {
      // GIVEN: Valid signup data
      // Mock successful signup
      await context.route("**/auth/v1/signup*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "mock-refresh-token",
            user: {
              id: "new-user-id",
              email: "new@example.com",
              created_at: new Date().toISOString(),
            },
          }),
        });
      });

      await page.goto("/signup");

      // WHEN: User completes signup form
      await page.getByLabel(/email/i).fill("new@example.com");
      await page.getByLabel(/^password$/i).fill("validpassword123");
      await page.getByLabel(/confirm password/i).fill("validpassword123");
      await page.getByRole("button", { name: /create account/i }).click();

      // THEN: They are redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe("AC4: Logout", () => {
    test("should clear session and redirect to landing page on logout", async ({
      page,
      context,
    }) => {
      // GIVEN: User is logged in
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
            is_pro: false,
          }),
        });
      });

      // Mock logout
      await context.route("**/auth/v1/logout*", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      });

      await page.goto("/dashboard");

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // WHEN: User clicks logout (find button in nav or user menu)
      const logoutButton = page.getByRole("button", { name: /logout|sign out/i }).or(
        page.locator("[data-testid='logout-button']")
      );
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      await logoutButton.click();

      // THEN: They are redirected to landing page or login
      await expect(page).toHaveURL(/^\/$|\/login/, { timeout: 10000 });
    });

    test("should not allow access to protected routes after logout", async ({
      page,
      context,
    }) => {
      // GIVEN: User is not authenticated (simulating post-logout)
      await context.route("**/auth/v1/user*", (route) => {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Not authenticated" }),
        });
      });

      // WHEN: They try to access protected route
      await page.goto("/generate");

      // THEN: They are redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });
});
