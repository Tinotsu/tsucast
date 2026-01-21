/**
 * Page Tests: Settings Page
 *
 * Tests for the settings page including sign out and auth redirects.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";
import { createUserProfile, createProUser } from "../factories";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth - we'll override this per test
const mockSignOut = vi.fn();
let mockUseAuthReturn = {
  profile: null as ReturnType<typeof createUserProfile> | null,
  isPro: false,
  signOut: mockSignOut,
  isLoading: false,
  isAuthenticated: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthReturn,
}));

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthReturn = {
      profile: null,
      isPro: false,
      signOut: mockSignOut,
      isLoading: false,
      isAuthenticated: false,
    };
  });

  describe("Authentication Redirect", () => {
    it("[P1] should redirect to login when not authenticated", () => {
      // GIVEN: User is not authenticated
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        isLoading: false,
        isAuthenticated: false,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Should redirect to login with redirect param
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=/settings");
    });

    it("[P1] should not redirect while loading", () => {
      // GIVEN: Auth is still loading
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        isLoading: true,
        isAuthenticated: false,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Should not redirect yet (show loading)
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("[P1] should show content when authenticated", () => {
      // GIVEN: User is authenticated
      const profile = createUserProfile();
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Should show settings content
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Sign Out", () => {
    it("[P1] should render sign out button", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Sign out button is visible
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });

    it("[P1] should call signOut when clicking sign out button", async () => {
      // GIVEN: Authenticated user
      mockSignOut.mockResolvedValue(undefined);
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
        signOut: mockSignOut,
      };

      render(<SettingsPage />);

      // WHEN: Clicking sign out
      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      fireEvent.click(signOutButton);

      // THEN: signOut is called
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("[P1] should redirect to home after sign out", async () => {
      // GIVEN: Authenticated user
      mockSignOut.mockResolvedValue(undefined);
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
        signOut: mockSignOut,
      };

      render(<SettingsPage />);

      // WHEN: Clicking sign out
      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      fireEvent.click(signOutButton);

      // THEN: Redirects to home
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("[P2] should handle sign out error gracefully", async () => {
      // GIVEN: signOut fails
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockSignOut.mockRejectedValue(new Error("Sign out failed"));
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
        signOut: mockSignOut,
      };

      render(<SettingsPage />);

      // WHEN: Clicking sign out
      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      fireEvent.click(signOutButton);

      // THEN: Error is logged, page doesn't crash
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Profile Display", () => {
    it("[P1] should display user email", () => {
      // GIVEN: Authenticated user with profile
      const profile = createUserProfile({ email: "test@example.com" });
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Email is displayed
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("[P1] should display display name if available", () => {
      // GIVEN: User with display name
      const profile = createUserProfile({ display_name: "John Doe" });
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Display name is shown
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Subscription Status", () => {
    it("[P1] should show Free Plan for free users", () => {
      // GIVEN: Free user
      const profile = createUserProfile({ subscription_tier: "free" });
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Free Plan is shown
      expect(screen.getByText("Free Plan")).toBeInTheDocument();
    });

    it("[P1] should show Pro Plan for pro users", () => {
      // GIVEN: Pro user
      const profile = createProUser();
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isPro: true,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Pro Plan is shown
      expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    });

    it("[P1] should show Upgrade button for free users", () => {
      // GIVEN: Free user
      const profile = createUserProfile({ subscription_tier: "free" });
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Upgrade button is visible
      expect(screen.getByRole("link", { name: /upgrade/i })).toBeInTheDocument();
    });

    it("[P1] should not show Upgrade button for pro users", () => {
      // GIVEN: Pro user
      const profile = createProUser();
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isPro: true,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Upgrade button is not visible
      expect(screen.queryByRole("link", { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it("[P2] should show remaining generations for free users", () => {
      // GIVEN: Free user with 1 generation used
      const profile = createUserProfile({
        subscription_tier: "free",
        daily_generations: 1,
      });
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile,
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Shows remaining count
      expect(screen.getByText(/2 of 3 generations left today/i)).toBeInTheDocument();
    });
  });

  describe("Legal Links", () => {
    it("[P2] should show Privacy Policy link", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Privacy link exists
      expect(screen.getByRole("link", { name: /privacy policy/i })).toBeInTheDocument();
    });

    it("[P2] should show Terms of Service link", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Terms link exists
      expect(screen.getByRole("link", { name: /terms of service/i })).toBeInTheDocument();
    });
  });
});
