/**
 * Unit Tests: lib/supabase/middleware.ts
 *
 * Tests for the updateSession middleware, focusing on timeout behavior
 * and cookie handling to prevent false logouts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockGetUser = vi.fn();
const mockCookiesSet = vi.fn();
const mockCookiesGetAll = vi.fn();

// Track cookies set on the response
let responseCookieOps: { type: "set" | "delete"; name: string }[];

// Capture the cookie options passed to createServerClient so tests can
// verify the middleware wires them correctly to request/response cookies.
let capturedCookieOptions: {
  getAll: () => any[];
  setAll: (cookies: { name: string; value: string; options?: any }[]) => void;
} | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: any) => {
    capturedCookieOptions = options?.cookies ?? null;
    return {
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
  },
}));

// Mock NextResponse and NextRequest
const mockRedirect = vi.fn();

vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: ({ request }: any) => {
        const cookies = {
          set: (name: string, value: string, options?: any) => {
            responseCookieOps.push({ type: "set", name });
          },
          delete: (name: string) => {
            responseCookieOps.push({ type: "delete", name });
          },
        };
        return { cookies, request };
      },
      redirect: (url: URL) => {
        mockRedirect(url);
        return { type: "redirect", url: url.toString() };
      },
    },
    NextRequest: class {
      nextUrl: URL & { clone: () => URL };
      cookies: {
        getAll: typeof mockCookiesGetAll;
        set: typeof mockCookiesSet;
      };
      constructor(url: string) {
        const parsed = new URL(url);
        // Add clone() to match Next.js NextURL behavior
        (parsed as any).clone = () => new URL(parsed.href);
        this.nextUrl = parsed as URL & { clone: () => URL };
        this.cookies = {
          getAll: mockCookiesGetAll,
          set: mockCookiesSet,
        };
      }
    },
  };
});

describe("Middleware: updateSession", () => {
  let updateSession: typeof import("@/lib/supabase/middleware").updateSession;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    responseCookieOps = [];
    capturedCookieOptions = null;
    mockCookiesGetAll.mockReturnValue([]);

    // Provide env vars
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const mod = await import("@/lib/supabase/middleware");
    updateSession = mod.updateSession;
  });

  describe("Timeout handling", () => {
    it("[P0] should NOT clear cookies when getUser times out", async () => {
      // GIVEN: User has auth cookies and getUser will be slow (simulating timeout)
      mockCookiesGetAll.mockReturnValue([
        { name: "sb-access-token", value: "tok" },
        { name: "sb-refresh-token", value: "ref" },
      ]);

      // getUser never resolves (will be beaten by the 5s timeout)
      mockGetUser.mockReturnValue(new Promise(() => {}));

      // WHEN: Middleware runs (use fake timers to trigger timeout)
      vi.useFakeTimers();
      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/home");

      const resultPromise = updateSession(request as any);
      // Advance past the 5s timeout
      vi.advanceTimersByTime(6000);
      const result = await resultPromise;
      vi.useRealTimers();

      // THEN: No cookies were deleted
      const deletions = responseCookieOps.filter((op) => op.type === "delete");
      expect(deletions).toHaveLength(0);
    });

    it("[P0] should NOT redirect to login on timeout for protected routes", async () => {
      // GIVEN: getUser times out on a protected route
      mockCookiesGetAll.mockReturnValue([
        { name: "sb-access-token", value: "tok" },
      ]);
      mockGetUser.mockReturnValue(new Promise(() => {}));

      vi.useFakeTimers();
      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/home");

      const resultPromise = updateSession(request as any);
      vi.advanceTimersByTime(6000);
      const result = await resultPromise;
      vi.useRealTimers();

      // THEN: Did NOT redirect to /login
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("[P0] should pass through on timeout (let client-side handle auth)", async () => {
      // GIVEN: getUser times out
      mockCookiesGetAll.mockReturnValue([]);
      mockGetUser.mockReturnValue(new Promise(() => {}));

      vi.useFakeTimers();
      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/library");

      const resultPromise = updateSession(request as any);
      vi.advanceTimersByTime(6000);
      const result = await resultPromise;
      vi.useRealTimers();

      // THEN: Returns a response (not a redirect)
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Real auth failure", () => {
    it("[P0] should clear cookies on real auth error", async () => {
      // GIVEN: User has stale cookies and getUser returns a real error
      mockCookiesGetAll.mockReturnValue([
        { name: "sb-access-token", value: "stale" },
        { name: "sb-refresh-token", value: "stale" },
      ]);
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Invalid JWT"),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: Cookies were deleted
      const deletions = responseCookieOps.filter((op) => op.type === "delete");
      expect(deletions.length).toBeGreaterThan(0);
    });

    it("[P0] should redirect to login on real auth failure for protected routes", async () => {
      // GIVEN: getUser returns a real error on a protected route
      mockCookiesGetAll.mockReturnValue([]);
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Invalid JWT"),
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/home");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: Redirected to /login
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/login");
      expect(redirectUrl.searchParams.get("redirect")).toBe("/home");
    });
  });

  describe("Successful auth", () => {
    it("[P1] should pass through when user is authenticated", async () => {
      // GIVEN: getUser returns a valid user
      mockCookiesGetAll.mockReturnValue([]);
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
        error: null,
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/home");

      // WHEN: Middleware runs
      const result = await updateSession(request as any);

      // THEN: Passes through without redirect
      expect(result).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("[P1] should redirect authenticated user from /login to /home", async () => {
      // GIVEN: User is authenticated and visits /login
      mockCookiesGetAll.mockReturnValue([]);
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@test.com" } },
        error: null,
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/login");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: Redirected to /home
      expect(mockRedirect).toHaveBeenCalled();
      const redirectUrl: URL = mockRedirect.mock.calls[0][0];
      expect(redirectUrl.pathname).toBe("/home");
    });
  });

  describe("Supabase unreachable", () => {
    it("[P1] should treat thrown errors like timeout (do not clear cookies)", async () => {
      // GIVEN: getUser throws (Supabase unreachable)
      mockCookiesGetAll.mockReturnValue([
        { name: "sb-access-token", value: "tok" },
      ]);
      mockGetUser.mockRejectedValue(new Error("fetch failed"));
      // Suppress expected console.error from middleware catch block
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/home");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: No cookies deleted, no redirect
      const deletions = responseCookieOps.filter((op) => op.type === "delete");
      expect(deletions).toHaveLength(0);
      expect(mockRedirect).not.toHaveBeenCalled();

      // AND: Error was logged (not silently swallowed)
      expect(consoleSpy).toHaveBeenCalledWith("Middleware auth check failed:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("Cookie callback wiring", () => {
    it("[P1] should pass cookie callbacks to createServerClient", async () => {
      // GIVEN: Middleware runs with any auth result
      mockCookiesGetAll.mockReturnValue([]);
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: createServerClient received getAll and setAll callbacks
      expect(capturedCookieOptions).not.toBeNull();
      expect(typeof capturedCookieOptions!.getAll).toBe("function");
      expect(typeof capturedCookieOptions!.setAll).toBe("function");
    });

    it("[P1] should wire getAll to request cookies", async () => {
      // GIVEN: Request has cookies
      const testCookies = [
        { name: "sb-access-token", value: "tok" },
        { name: "sb-refresh-token", value: "ref" },
      ];
      mockCookiesGetAll.mockReturnValue(testCookies);
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const { NextRequest } = await import("next/server");
      const request = new NextRequest("https://tsucast.com/");

      // WHEN: Middleware runs
      await updateSession(request as any);

      // THEN: getAll returns request cookies
      expect(capturedCookieOptions!.getAll()).toEqual(testCookies);
    });
  });
});
