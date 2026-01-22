import { test as base, expect, Page } from "@playwright/test";

/**
 * Extended Playwright fixtures for tsucast E2E tests
 *
 * Provides:
 * - authenticatedPage: Pre-authenticated browser context
 * - testUser: Test user credentials
 */

export interface TestUser {
  email: string;
  password: string;
}

type TestFixtures = {
  testUser: TestUser;
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  // Test user credentials (from environment or defaults)
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: process.env.TEST_USER_EMAIL || "test@example.com",
      password: process.env.TEST_USER_PASSWORD || "testpassword123",
    };
    await use(user);
  },

  // Pre-authenticated page fixture
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to login
    await page.goto("/login");

    // Fill login form
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Wait for redirect to dashboard/generate
    await page.waitForURL(/\/(dashboard|generate)/);

    await use(page);
  },
});

export { expect };
