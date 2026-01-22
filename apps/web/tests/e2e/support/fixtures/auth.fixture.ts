/**
 * ATDD Test Fixtures for Authentication and API Mocking
 *
 * These fixtures provide reusable helpers for E2E tests that need
 * authenticated contexts and mocked API responses.
 */

import { BrowserContext, Route } from "@playwright/test";

/**
 * User profile options for authenticated context
 */
interface UserProfile {
  daily_generations?: number;
  is_pro?: boolean;
  email?: string;
}

/**
 * Mock Supabase session data
 */
const createMockSession = (email: string = "test@example.com") => ({
  access_token: "mock-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-refresh-token",
  user: {
    id: "mock-user-id",
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
});

/**
 * Sets up authenticated context by mocking Supabase auth endpoints
 * and setting auth cookies/storage
 */
export async function authenticatedContext(
  context: BrowserContext,
  profile: UserProfile = {}
): Promise<void> {
  const { daily_generations = 0, is_pro = false, email = "test@example.com" } = profile;

  const session = createMockSession(email);

  // Mock Supabase auth user endpoint
  await context.route("**/auth/v1/user*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(session.user),
    });
  });

  // Mock Supabase session endpoint
  await context.route("**/auth/v1/token*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(session),
    });
  });

  // Mock user profile/metadata endpoint
  await context.route("**/rest/v1/user_profiles*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "mock-user-id",
        email,
        daily_generations,
        is_pro,
        created_at: new Date().toISOString(),
      }),
    });
  });

  // Mock usage/limits endpoint
  await context.route("**/api/usage*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        daily_generations,
        daily_limit: is_pro ? 999 : 3,
        is_pro,
        remaining: is_pro ? 999 : Math.max(0, 3 - daily_generations),
      }),
    });
  });

  // Set auth cookies to simulate logged-in state
  await context.addCookies([
    {
      name: "sb-access-token",
      value: session.access_token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
    {
      name: "sb-refresh-token",
      value: session.refresh_token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  // Also set localStorage for client-side auth state
  await context.addInitScript((sessionData) => {
    const storageKey = "sb-localhost-auth-token";
    localStorage.setItem(storageKey, JSON.stringify(sessionData));
  }, session);
}

/**
 * Mock successful generate API response
 */
export async function mockGenerateResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      audioId: "mock-audio-id",
      audioUrl: "https://example.com/mock-audio.mp3",
      title: "Mock Generated Article",
      duration: 300,
    }),
  });
}

/**
 * Mock library response with sample items
 */
export async function mockLibraryResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([
      {
        id: "1",
        audio_id: "audio-1",
        title: "Sample Article One",
        audio_url: "https://example.com/audio1.mp3",
        duration: 300,
        playback_position: 0,
        is_played: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        audio_id: "audio-2",
        title: "Sample Article Two",
        audio_url: "https://example.com/audio2.mp3",
        duration: 600,
        playback_position: 150,
        is_played: false,
        created_at: new Date().toISOString(),
      },
    ]),
  });
}

/**
 * Mock empty library response
 */
export async function mockEmptyLibrary(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify([]),
  });
}

/**
 * Mock failed login response
 */
export async function mockFailedLogin(route: Route): Promise<void> {
  await route.fulfill({
    status: 400,
    contentType: "application/json",
    body: JSON.stringify({
      error: "invalid_grant",
      error_description: "Invalid login credentials",
    }),
  });
}

/**
 * Mock rate limit response
 */
export async function mockRateLimitResponse(route: Route): Promise<void> {
  await route.fulfill({
    status: 429,
    contentType: "application/json",
    body: JSON.stringify({
      error: {
        code: "RATE_LIMITED",
        message: "Daily limit exceeded. Upgrade to Pro for unlimited generations.",
      },
    }),
  });
}

/**
 * Mock generation error response
 */
export async function mockGenerateError(
  route: Route,
  code: string = "PARSE_FAILED",
  message: string = "Could not extract content from this URL"
): Promise<void> {
  await route.fulfill({
    status: 422,
    contentType: "application/json",
    body: JSON.stringify({
      error: {
        code,
        message,
      },
    }),
  });
}
