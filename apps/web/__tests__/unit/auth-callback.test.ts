/**
 * Unit Tests: auth/callback/route.ts
 *
 * Tests for OAuth callback error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    }),
}));

// Mock NextResponse.redirect
vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: string | URL) => ({
      type: "redirect",
      url: url.toString(),
    }),
  },
}));

describe("Auth Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("[P0] should redirect to login with error when OAuth returns error param", async () => {
    // GIVEN: Supabase redirects with error params
    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "https://tsucast.com/auth/callback?error=server_error&error_description=Unable+to+exchange+external+code"
    );

    // WHEN: Callback route is called
    const response = (await GET(request)) as any;

    // THEN: Redirects to login with error message
    expect(response.url).toContain("/login");
    expect(response.url).toContain("error=Unable+to+exchange+external+code");
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("[P0] should redirect to login when code exchange fails", async () => {
    // GIVEN: Code exchange returns an error
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "https://tsucast.com/auth/callback?code=invalid-code"
    );

    // WHEN: Callback route is called
    const response = (await GET(request)) as any;

    // THEN: Redirects to login with error
    expect(response.url).toContain("/login");
    expect(response.url).toContain("error=Invalid+code");
  });

  it("[P0] should redirect to login when code exchange throws", async () => {
    // GIVEN: Code exchange throws an exception
    mockExchangeCodeForSession.mockRejectedValue(new Error("Network error"));

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "https://tsucast.com/auth/callback?code=valid-code"
    );

    // WHEN: Callback route is called
    const response = (await GET(request)) as any;

    // THEN: Redirects to login with generic error
    expect(response.url).toContain("/login");
    expect(response.url).toContain("error=Authentication+failed");
  });

  it("[P0] should redirect to dashboard on successful code exchange", async () => {
    // GIVEN: Code exchange succeeds
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request(
      "https://tsucast.com/auth/callback?code=valid-code"
    );

    // WHEN: Callback route is called
    const response = (await GET(request)) as any;

    // THEN: Redirects to dashboard
    expect(response.url).toContain("/dashboard");
    expect(response.url).not.toContain("error=");
  });

  it("[P1] should redirect to dashboard when no code or error params", async () => {
    // GIVEN: No params at all
    const { GET } = await import("@/app/auth/callback/route");
    const request = new Request("https://tsucast.com/auth/callback");

    // WHEN: Callback route is called
    const response = (await GET(request)) as any;

    // THEN: Redirects to dashboard (no-op)
    expect(response.url).toContain("/dashboard");
  });
});
