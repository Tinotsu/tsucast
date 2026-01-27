/**
 * Component Tests: CookieConsent
 *
 * Tests for the GDPR cookie consent banner.
 * Priority: P1 — Legal compliance (GDPR opt-in before tracking)
 *
 * Verifies:
 * - Banner visibility based on prior consent
 * - Accept enables PostHog tracking
 * - Decline stores preference without enabling tracking
 * - localStorage failures don't crash the component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieConsent } from "@/components/CookieConsent";

// Mock PostHog
const mockOptInCapturing = vi.fn();
const mockGetPostHog = vi.fn();

vi.mock("@/lib/posthog", () => ({
  getPostHog: (...args: unknown[]) => mockGetPostHog(...args),
}));

describe("CookieConsent Component", () => {
  let getItemSpy: ReturnType<typeof vi.spyOn<Storage, "getItem">>;
  let setItemSpy: ReturnType<typeof vi.spyOn<Storage, "setItem">>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: PostHog client is available
    mockGetPostHog.mockReturnValue({ opt_in_capturing: mockOptInCapturing });
    // Reset localStorage
    localStorage.clear();
    getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  describe("Banner Visibility", () => {
    it("[P1] should show banner when no prior consent stored", () => {
      // GIVEN: No analytics_consent in localStorage
      // WHEN: Rendering CookieConsent
      render(<CookieConsent />);

      // THEN: Banner is visible with accept/decline buttons
      expect(
        screen.getByText(/cookies for product analytics/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /accept/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /decline/i })
      ).toBeInTheDocument();
    });

    it("[P1] should hide banner when consent was previously accepted", () => {
      // GIVEN: User previously accepted
      localStorage.setItem("analytics_consent", "true");

      // WHEN: Rendering CookieConsent
      render(<CookieConsent />);

      // THEN: Banner is not visible
      expect(
        screen.queryByText(/cookies for product analytics/i)
      ).not.toBeInTheDocument();
    });

    it("[P1] should hide banner when consent was previously declined", () => {
      // GIVEN: User previously declined
      localStorage.setItem("analytics_consent", "false");

      // WHEN: Rendering CookieConsent
      render(<CookieConsent />);

      // THEN: Banner is not visible
      expect(
        screen.queryByText(/cookies for product analytics/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Accept Flow", () => {
    it("[P1] should enable PostHog tracking on accept", () => {
      // GIVEN: Banner is visible (no prior consent)
      render(<CookieConsent />);

      // WHEN: User clicks Accept
      fireEvent.click(screen.getByRole("button", { name: /accept/i }));

      // THEN: PostHog opt_in_capturing is called
      expect(mockOptInCapturing).toHaveBeenCalledOnce();
    });

    it("[P1] should store consent preference on accept", () => {
      // GIVEN: Banner is visible
      render(<CookieConsent />);

      // WHEN: User clicks Accept
      fireEvent.click(screen.getByRole("button", { name: /accept/i }));

      // THEN: Consent stored in localStorage
      expect(setItemSpy).toHaveBeenCalledWith("analytics_consent", "true");
    });

    it("[P1] should hide banner after accept", () => {
      // GIVEN: Banner is visible
      render(<CookieConsent />);

      // WHEN: User clicks Accept
      fireEvent.click(screen.getByRole("button", { name: /accept/i }));

      // THEN: Banner disappears
      expect(
        screen.queryByText(/cookies for product analytics/i)
      ).not.toBeInTheDocument();
    });

    it("[P2] should not crash if PostHog client is null on accept", () => {
      // GIVEN: PostHog not initialized
      mockGetPostHog.mockReturnValue(null);
      render(<CookieConsent />);

      // WHEN: User clicks Accept
      // THEN: No error thrown
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /accept/i }));
      }).not.toThrow();

      // And consent is still stored
      expect(setItemSpy).toHaveBeenCalledWith("analytics_consent", "true");
    });
  });

  describe("Decline Flow", () => {
    it("[P1] should NOT enable PostHog tracking on decline", () => {
      // GIVEN: Banner is visible
      render(<CookieConsent />);

      // WHEN: User clicks Decline
      fireEvent.click(screen.getByRole("button", { name: /decline/i }));

      // THEN: opt_in_capturing is NOT called
      expect(mockOptInCapturing).not.toHaveBeenCalled();
    });

    it("[P1] should store decline preference", () => {
      // GIVEN: Banner is visible
      render(<CookieConsent />);

      // WHEN: User clicks Decline
      fireEvent.click(screen.getByRole("button", { name: /decline/i }));

      // THEN: Decline stored in localStorage
      expect(setItemSpy).toHaveBeenCalledWith("analytics_consent", "false");
    });

    it("[P1] should hide banner after decline", () => {
      // GIVEN: Banner is visible
      render(<CookieConsent />);

      // WHEN: User clicks Decline
      fireEvent.click(screen.getByRole("button", { name: /decline/i }));

      // THEN: Banner disappears
      expect(
        screen.queryByText(/cookies for product analytics/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("localStorage Resilience", () => {
    it("[P1] should not crash when localStorage.getItem throws", () => {
      // GIVEN: localStorage is unavailable (e.g., private browsing)
      getItemSpy.mockImplementation(() => {
        throw new DOMException("localStorage is not available");
      });

      // WHEN: Rendering CookieConsent
      // THEN: No error thrown (banner stays hidden as fallback)
      expect(() => render(<CookieConsent />)).not.toThrow();
    });

    it("[P2] should not crash when localStorage.setItem throws on accept", () => {
      // GIVEN: Banner visible, but localStorage.setItem will fail
      render(<CookieConsent />);
      setItemSpy.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      // WHEN: User clicks Accept
      // THEN: No error thrown, PostHog still gets opt-in
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /accept/i }));
      }).not.toThrow();
      expect(mockOptInCapturing).toHaveBeenCalledOnce();
    });

    it("[P2] should not crash when localStorage.setItem throws on decline", () => {
      // GIVEN: Banner visible, but localStorage.setItem will fail
      render(<CookieConsent />);
      setItemSpy.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      // WHEN: User clicks Decline
      // THEN: No error thrown
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /decline/i }));
      }).not.toThrow();
    });
  });
});
