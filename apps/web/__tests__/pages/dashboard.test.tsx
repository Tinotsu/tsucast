/**
 * Page Tests: Dashboard Page
 *
 * Tests for the dashboard page including stats display and credits banner.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(app)/dashboard/page";
import { createUserProfile } from "../factories";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth
let mockUseAuthReturn = {
  profile: null as ReturnType<typeof createUserProfile> | null,
  signOut: vi.fn(),
  isLoading: false,
  isAuthenticated: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthReturn,
}));

// Mock useCredits
let mockUseCreditsReturn = {
  credits: 5,
  timeBank: 10,
  totalPurchased: 10,
  totalUsed: 5,
  isLoading: false,
  error: null,
  invalidateCredits: vi.fn(),
};

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => mockUseCreditsReturn,
}));

// Mock getLibrary
vi.mock("@/lib/api", () => ({
  getLibrary: vi.fn().mockResolvedValue([]),
}));

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthReturn = {
      profile: null,
      signOut: vi.fn(),
      isLoading: false,
      isAuthenticated: false,
    };
    mockUseCreditsReturn = {
      credits: 5,
      timeBank: 10,
      totalPurchased: 10,
      totalUsed: 5,
      isLoading: false,
      error: null,
      invalidateCredits: vi.fn(),
    };
  });

  describe("Stats Display", () => {
    it("[P1] should show credit count", () => {
      // GIVEN: Authenticated user with 5 credits
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

      // WHEN: Rendering dashboard
      render(<DashboardPage />);

      // THEN: Credits stat is shown
      expect(screen.getByText("Credits")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("[P1] should show time bank", () => {
      // GIVEN: Authenticated user with time bank
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        timeBank: 10,
      };

      // WHEN: Rendering dashboard
      render(<DashboardPage />);

      // THEN: Time Bank stat is shown
      expect(screen.getByText("Time Bank")).toBeInTheDocument();
      expect(screen.getByText("10 min")).toBeInTheDocument();
    });
  });

  describe("Credits Banner", () => {
    it("[P1] should show banner when credits are 0", () => {
      // GIVEN: User with no credits
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 0,
      };

      // WHEN: Rendering dashboard
      render(<DashboardPage />);

      // THEN: Credits banner is shown
      expect(screen.getByText("Need more credits?")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /buy credits/i })).toBeInTheDocument();
    });

    it("[P1] should not show banner when user has credits", () => {
      // GIVEN: User with credits
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

      // WHEN: Rendering dashboard
      render(<DashboardPage />);

      // THEN: Credits banner is not shown
      expect(screen.queryByText("Need more credits?")).not.toBeInTheDocument();
    });
  });

  describe("Quick Actions", () => {
    it("[P1] should show generate and library links", () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering dashboard
      render(<DashboardPage />);

      // THEN: Quick action links are present
      expect(screen.getByText("Generate New")).toBeInTheDocument();
      expect(screen.getByText("Your Library")).toBeInTheDocument();
    });
  });
});
