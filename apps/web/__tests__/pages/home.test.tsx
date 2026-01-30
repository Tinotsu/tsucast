/**
 * Page Tests: Home Page
 *
 * Tests for the home page including generation form.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/(app)/home/page";
import { AudioPlayerProvider } from "@/providers/AudioPlayerProvider";
import { createUserProfile } from "../factories";

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement) {
  return render(<AudioPlayerProvider>{ui}</AudioPlayerProvider>);
}

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

// Mock API functions
vi.mock("@/lib/api", () => ({
  getLibrary: vi.fn().mockResolvedValue([]),
  generateAudio: vi.fn(),
  previewCreditCost: vi.fn(),
  checkCache: vi.fn().mockResolvedValue({ cached: false }),
  ApiError: class ApiError extends Error {
    code?: string;
    status?: number;
  },
}));

describe("Home Page", () => {
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


  describe("Credits Banner", () => {
    it("[P1] should show no credits message when credits are 0", () => {
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

      // WHEN: Rendering home page
      renderWithProviders(<HomePage />);

      // THEN: No credits message is shown
      expect(screen.getByText("No Credits Available")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /buy credits/i })).toBeInTheDocument();
    });

    it("[P1] should not show no credits message when user has credits", () => {
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

      // WHEN: Rendering home page
      renderWithProviders(<HomePage />);

      // THEN: No credits message is not shown
      expect(screen.queryByText("No Credits Available")).not.toBeInTheDocument();
    });
  });

  describe("Generation Form", () => {
    it("[P1] should show URL input and generate button", () => {
      // GIVEN: Authenticated user with credits
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering home page
      renderWithProviders(<HomePage />);

      // THEN: Generation form elements are present
      expect(screen.getByRole("heading", { name: /generate podcast/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("https://example.com/article")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /generate podcast/i })).toBeInTheDocument();
    });
  });
});
