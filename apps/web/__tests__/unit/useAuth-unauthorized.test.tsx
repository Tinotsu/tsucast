/**
 * Unit Tests: hooks/useAuth.ts — Unauthorized Event Handler
 *
 * Tests the auth event bus integration in useAuth that handles
 * forced sign-out when fetchApi receives 401 responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// --- Controllable mocks ---

const mockPush = vi.fn();
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockGetSession = vi.fn().mockResolvedValue({
  data: { session: { access_token: "tok", user: { id: "u1", email: "a@b.com" } } },
  error: null,
});
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});

// Override the global mock from setup.tsx for this file
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: mockSignOut,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "u1", email: "a@b.com", credits_balance: 5, is_admin: false },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/cookies", () => ({
  clearAuthCookies: vi.fn(),
}));

describe("useAuth: unauthorized event handler", () => {
  let emitAuthEvent: typeof import("@/lib/auth-events").emitAuthEvent;
  let useAuth: typeof import("@/hooks/useAuth").useAuth;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Fresh module imports to reset event bus state
    vi.resetModules();
    const authEvents = await import("@/lib/auth-events");
    emitAuthEvent = authEvents.emitAuthEvent;
    const authHook = await import("@/hooks/useAuth");
    useAuth = authHook.useAuth;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("[P0] should sign out and redirect to /login on unauthorized event", async () => {
    // GIVEN: useAuth is mounted with an authenticated user
    const { result } = renderHook(() => useAuth());

    // Wait for initial auth to settle
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // WHEN: An unauthorized event is emitted (simulating 401 from fetchApi)
    act(() => {
      emitAuthEvent("unauthorized");
    });

    // THEN: User state is cleared
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();

    // AND: signOut was called
    expect(mockSignOut).toHaveBeenCalled();

    // AND: Router navigated to /login
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("[P0] should debounce multiple simultaneous unauthorized events", async () => {
    // GIVEN: useAuth is mounted
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // WHEN: Multiple unauthorized events fire simultaneously
    act(() => {
      emitAuthEvent("unauthorized");
      emitAuthEvent("unauthorized");
      emitAuthEvent("unauthorized");
    });

    // THEN: signOut is called only once (debounce guard)
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("[P1] should allow sign-out again after debounce window resets", async () => {
    // GIVEN: useAuth is mounted
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // First unauthorized event
    act(() => {
      emitAuthEvent("unauthorized");
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // WHEN: Debounce window passes (2 seconds)
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // Re-mock getSession to simulate re-authentication
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok2", user: { id: "u1", email: "a@b.com" } } },
      error: null,
    });

    // AND: Another unauthorized event fires
    act(() => {
      emitAuthEvent("unauthorized");
    });

    // THEN: signOut fires again
    expect(mockSignOut).toHaveBeenCalledTimes(2);
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("[P1] should unsubscribe from auth events on unmount", async () => {
    // GIVEN: useAuth is mounted
    const { unmount } = renderHook(() => useAuth());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // WHEN: Component unmounts
    unmount();

    // AND: An unauthorized event fires after unmount
    act(() => {
      emitAuthEvent("unauthorized");
    });

    // THEN: signOut was NOT called (listener was cleaned up)
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("[P2] should clear auth cookies on unauthorized event", async () => {
    const { clearAuthCookies } = await import("@/lib/cookies");

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // WHEN: Unauthorized event fires
    act(() => {
      emitAuthEvent("unauthorized");
    });

    // THEN: Cookies are cleared
    expect(clearAuthCookies).toHaveBeenCalled();
  });
});
