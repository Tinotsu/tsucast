/**
 * Component Tests: PostHog Initialization in Providers
 *
 * Tests for PostHog initialization timing and consent restoration
 * inside the Providers component.
 * Priority: P1 — Ensures PostHogProvider wraps children only after init
 *
 * Verifies:
 * - Children render even when PostHog is unavailable
 * - PostHogProvider wraps children after successful init
 * - Consent preference is restored from localStorage on mount
 * - localStorage failure during consent restore doesn't crash
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";

// Track mock state
let mockInitialized = false;
const mockOptInCapturing = vi.fn();
const mockPostHogInstance = { opt_in_capturing: mockOptInCapturing };

const mockInitPostHog = vi.fn(() => {
  mockInitialized = true;
});
const mockGetPostHog = vi.fn(() =>
  mockInitialized ? mockPostHogInstance : null
);

vi.mock("@/lib/posthog", () => ({
  initPostHog: () => mockInitPostHog(),
  getPostHog: () => mockGetPostHog(),
}));

// Mock PostHogIdentify and PostHogPageView to avoid their side effects
vi.mock("@/components/PostHogIdentify", () => ({
  PostHogIdentify: () => React.createElement("div", { "data-testid": "posthog-identify" }),
}));
vi.mock("@/components/PostHogPageView", () => ({
  PostHogPageView: () => React.createElement("div", { "data-testid": "posthog-pageview" }),
}));

// Mock posthog-js/react to detect whether PHProvider is used
const mockPHProvider = vi.fn(({ children }: { children: React.ReactNode }) =>
  React.createElement("div", { "data-testid": "ph-provider" }, children)
);
vi.mock("posthog-js/react", () => ({
  PostHogProvider: (props: { children: React.ReactNode }) =>
    mockPHProvider(props),
}));

// Mock Sentry (called at module level in Providers)
vi.mock("@/lib/sentry", () => ({
  initSentry: vi.fn(),
}));

// Must import AFTER mocks are set up
const { Providers } = await import("@/components/Providers");

describe("PostHog Initialization in Providers", () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialized = false;
    localStorage.clear();
    getItemSpy = vi.spyOn(Storage.prototype, "getItem");
  });

  afterEach(() => {
    getItemSpy.mockRestore();
  });

  describe("Children Rendering", () => {
    it("[P1] should render children even when PostHog is not available", () => {
      // GIVEN: PostHog init will NOT make client available
      mockGetPostHog.mockReturnValue(null);

      // WHEN: Rendering Providers with children
      render(
        <Providers>
          <div data-testid="child-content">Hello</div>
        </Providers>
      );

      // THEN: Children are rendered
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("[P1] should render PostHogIdentify and PostHogPageView", () => {
      // GIVEN: Default setup
      // WHEN: Rendering Providers
      render(
        <Providers>
          <div>App</div>
        </Providers>
      );

      // THEN: Side-effect components are rendered
      expect(screen.getByTestId("posthog-identify")).toBeInTheDocument();
      expect(screen.getByTestId("posthog-pageview")).toBeInTheDocument();
    });
  });

  describe("PostHog Init Timing", () => {
    it("[P1] should call initPostHog on mount", async () => {
      // GIVEN: Providers component
      // WHEN: Rendered
      await act(async () => {
        render(
          <Providers>
            <div>App</div>
          </Providers>
        );
      });

      // THEN: initPostHog was called
      expect(mockInitPostHog).toHaveBeenCalledOnce();
    });

    it("[P1] should wrap with PHProvider after init succeeds", async () => {
      // GIVEN: PostHog init will make client available
      mockInitPostHog.mockImplementation(() => {
        mockInitialized = true;
      });
      mockGetPostHog.mockImplementation(() =>
        mockInitialized ? mockPostHogInstance : null
      );

      // WHEN: Rendered and useEffect fires
      await act(async () => {
        render(
          <Providers>
            <div data-testid="child-content">App</div>
          </Providers>
        );
      });

      // THEN: PHProvider wraps children
      expect(mockPHProvider).toHaveBeenCalled();
      expect(screen.getByTestId("ph-provider")).toBeInTheDocument();
    });

    it("[P2] should NOT wrap with PHProvider when init returns no client", async () => {
      // GIVEN: PostHog init will NOT make client available (key unset)
      mockInitPostHog.mockImplementation(() => {
        // Don't set mockInitialized = true
      });
      mockGetPostHog.mockReturnValue(null);

      // WHEN: Rendered
      mockPHProvider.mockClear();
      await act(async () => {
        render(
          <Providers>
            <div data-testid="child-content">App</div>
          </Providers>
        );
      });

      // THEN: PHProvider is NOT used, but children still render
      expect(mockPHProvider).not.toHaveBeenCalled();
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  describe("Consent Restoration", () => {
    it("[P1] should call opt_in_capturing when prior consent is 'true'", async () => {
      // GIVEN: User previously consented
      localStorage.setItem("analytics_consent", "true");
      mockInitPostHog.mockImplementation(() => {
        mockInitialized = true;
      });
      mockGetPostHog.mockImplementation(() =>
        mockInitialized ? mockPostHogInstance : null
      );

      // WHEN: Providers mounts
      await act(async () => {
        render(
          <Providers>
            <div>App</div>
          </Providers>
        );
      });

      // THEN: opt_in_capturing is called
      expect(mockOptInCapturing).toHaveBeenCalledOnce();
    });

    it("[P1] should NOT call opt_in_capturing when prior consent is 'false'", async () => {
      // GIVEN: User previously declined
      localStorage.setItem("analytics_consent", "false");
      mockInitPostHog.mockImplementation(() => {
        mockInitialized = true;
      });

      // WHEN: Providers mounts
      await act(async () => {
        render(
          <Providers>
            <div>App</div>
          </Providers>
        );
      });

      // THEN: opt_in_capturing is NOT called
      expect(mockOptInCapturing).not.toHaveBeenCalled();
    });

    it("[P1] should NOT call opt_in_capturing when no prior consent", async () => {
      // GIVEN: No prior consent stored
      mockInitPostHog.mockImplementation(() => {
        mockInitialized = true;
      });

      // WHEN: Providers mounts
      await act(async () => {
        render(
          <Providers>
            <div>App</div>
          </Providers>
        );
      });

      // THEN: opt_in_capturing is NOT called (GDPR default: opted out)
      expect(mockOptInCapturing).not.toHaveBeenCalled();
    });

    it("[P2] should not crash if localStorage throws during consent check", async () => {
      // GIVEN: localStorage will throw
      getItemSpy.mockImplementation(() => {
        throw new DOMException("SecurityError");
      });
      mockInitPostHog.mockImplementation(() => {
        mockInitialized = true;
      });

      // WHEN: Providers mounts
      // THEN: No error thrown
      await act(async () => {
        expect(() =>
          render(
            <Providers>
              <div data-testid="child-content">App</div>
            </Providers>
          )
        ).not.toThrow();
      });

      // And children still render
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });
});
