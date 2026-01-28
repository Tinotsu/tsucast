/**
 * Unit Tests: lib/auth-events.ts
 *
 * Tests for the auth event bus used to bridge non-React fetchApi
 * to React useAuth for unauthorized event handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Reset module state between tests
let onAuthEvent: typeof import("@/lib/auth-events").onAuthEvent;
let emitAuthEvent: typeof import("@/lib/auth-events").emitAuthEvent;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("@/lib/auth-events");
  onAuthEvent = mod.onAuthEvent;
  emitAuthEvent = mod.emitAuthEvent;
});

describe("Auth Events", () => {
  it("[P1] should call listener when event is emitted", () => {
    const listener = vi.fn();
    onAuthEvent("unauthorized", listener);

    emitAuthEvent("unauthorized");

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("[P1] should call multiple listeners", () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    onAuthEvent("unauthorized", listener1);
    onAuthEvent("unauthorized", listener2);

    emitAuthEvent("unauthorized");

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
  });

  it("[P1] should not call listener after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onAuthEvent("unauthorized", listener);

    unsubscribe();
    emitAuthEvent("unauthorized");

    expect(listener).not.toHaveBeenCalled();
  });

  it("[P2] should not throw when emitting with no listeners", () => {
    expect(() => emitAuthEvent("unauthorized")).not.toThrow();
  });

  it("[P2] should handle subscribe-emit-unsubscribe-emit correctly", () => {
    const listener = vi.fn();
    const unsubscribe = onAuthEvent("unauthorized", listener);

    emitAuthEvent("unauthorized");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitAuthEvent("unauthorized");
    expect(listener).toHaveBeenCalledTimes(1); // still 1, not called again
  });
});
