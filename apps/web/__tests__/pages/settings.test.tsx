/**
 * Page Tests: Settings Page
 *
 * Tests for the settings page including sign out and auth redirects.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/(app)/settings/page";
import { createUserProfile } from "../factories";

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
  signOut: mockSignOut,
  isLoading: false,
  isAuthenticated: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthReturn,
}));

// Mock useCredits
let mockUseCreditsReturn = {
  credits: 5,
  timeBank: 0,
  totalPurchased: 10,
  totalUsed: 5,
  isLoading: false,
  error: null,
  invalidateCredits: vi.fn(),
};

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => mockUseCreditsReturn,
}));

// Mock useTheme
vi.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "system",
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthReturn = {
      profile: null,
      signOut: mockSignOut,
      isLoading: false,
      isAuthenticated: false,
    };
    mockUseCreditsReturn = {
      credits: 5,
      timeBank: 0,
      totalPurchased: 10,
      totalUsed: 5,
      isLoading: false,
      error: null,
      invalidateCredits: vi.fn(),
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

  describe("Credits Display", () => {
    it("[P1] should show credit balance", () => {
      // GIVEN: Authenticated user with credits
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 5,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Credits are shown
      expect(screen.getByText(/5 credits available/i)).toBeInTheDocument();
    });

    it("[P1] should show time bank when available", () => {
      // GIVEN: User with time bank minutes
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 3,
        timeBank: 12,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Time bank is shown
      expect(screen.getByText(/12 min banked/i)).toBeInTheDocument();
    });

    it("[P1] should show Buy more credits link", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Buy more credits link is visible
      expect(screen.getByRole("link", { name: /buy more credits/i })).toBeInTheDocument();
    });

    it("[P1] should show Credits heading", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering settings page
      render(<SettingsPage />);

      // THEN: Credits section heading is shown
      expect(screen.getByText("Credits")).toBeInTheDocument();
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
