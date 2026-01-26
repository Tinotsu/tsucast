/**
 * Page Tests: Generate Page
 *
 * Tests for the generate page including auth and generation flow.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GeneratePage from "@/app/(app)/generate/page";
import { createUserProfile, createProUser, createGenerateResponse } from "../factories";

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
  isPro: false,
  isLoading: false,
  isAuthenticated: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuthReturn,
}));

// Mock useCredits hook
const mockInvalidateCredits = vi.fn();
let mockUseCreditsReturn = {
  credits: 5,
  timeBank: 0,
  isLoading: false,
  error: null,
  invalidateCredits: mockInvalidateCredits,
};

vi.mock("@/hooks/useCredits", () => ({
  useCredits: () => mockUseCreditsReturn,
}));

// Mock API
const mockGenerateAudio = vi.fn();
const mockPreviewCreditCost = vi.fn();
vi.mock("@/lib/api", () => ({
  generateAudio: (req: unknown) => mockGenerateAudio(req),
  previewCreditCost: (url: string, voiceId?: string) => mockPreviewCreditCost(url, voiceId),
  ApiError: class ApiError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
    }
  },
}));

// Mock child components
vi.mock("@/components/app/UrlInput", () => ({
  UrlInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
  }) => (
    <input
      data-testid="url-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Enter URL"
    />
  ),
}));

vi.mock("@/components/app/VoiceSelector", () => ({
  VoiceSelector: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select
      data-testid="voice-selector"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="default">Alloy</option>
      <option value="echo">Echo</option>
    </select>
  ),
}));

vi.mock("@/components/app/WebPlayer", () => ({
  WebPlayer: ({ title }: { title: string }) => (
    <div data-testid="web-player">{title}</div>
  ),
}));

describe("Generate Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthReturn = {
      profile: null,
      isPro: false,
      isLoading: false,
      isAuthenticated: false,
    };
    mockUseCreditsReturn = {
      credits: 5,
      timeBank: 0,
      isLoading: false,
      error: null,
      invalidateCredits: mockInvalidateCredits,
    };
    // Default preview response
    mockPreviewCreditCost.mockResolvedValue({
      isCached: false,
      estimatedMinutes: 10,
      creditsNeeded: 1,
      currentCredits: 5,
      currentTimeBank: 0,
      hasSufficientCredits: true,
    });
  });

  describe("Authentication Redirect", () => {
    it("[P1] should redirect to login when not authenticated", () => {
      // GIVEN: User is not authenticated
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        isLoading: false,
        isAuthenticated: false,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Should redirect to login
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=/generate");
    });

    it("[P1] should not redirect while loading", () => {
      // GIVEN: Auth is loading
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        isLoading: true,
        isAuthenticated: false,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("[P1] should show form when authenticated", () => {
      // GIVEN: User is authenticated
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Form is visible
      expect(screen.getByRole("heading", { name: "Generate Podcast" })).toBeInTheDocument();
      expect(screen.getByTestId("url-input")).toBeInTheDocument();
    });
  });

  describe("Generation Limit (Free Users)", () => {
    it("[P1] should show remaining generations for free users", () => {
      // GIVEN: Free user with 1 generation used
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile({ daily_generations: 1 }),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Shows credit balance (now using credit system instead of daily generations)
      expect(screen.getByText(/5 credits/i)).toBeInTheDocument();
    });

    it("[P1] should show no credits message when at limit", () => {
      // GIVEN: Free user with no credits
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile({ daily_generations: 3 }),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      // Set credits to 0 to simulate no credits available
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 0,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Shows no credits message
      expect(screen.getByText("No Credits Available")).toBeInTheDocument();
    });

    it("[P1] should disable generate button when at limit with no credits", () => {
      // GIVEN: Free user with no credits and at daily limit
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile({ daily_generations: 3 }),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 0,
      };
      mockPreviewCreditCost.mockResolvedValue({
        isCached: false,
        estimatedMinutes: 10,
        creditsNeeded: 1,
        currentCredits: 0,
        currentTimeBank: 0,
        hasSufficientCredits: false,
      });

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Generate button is disabled (no credits)
      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      expect(generateButton).toBeDisabled();
    });

    it("[P1] should show Buy Credits link when at limit", () => {
      // GIVEN: Free user with no credits
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile({ daily_generations: 3 }),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockUseCreditsReturn = {
        ...mockUseCreditsReturn,
        credits: 0,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: Buy Credits links are visible (may appear multiple times)
      const buyCreditsLinks = screen.getAllByRole("link", { name: /buy credits/i });
      expect(buyCreditsLinks.length).toBeGreaterThan(0);
    });
  });

  describe("Generation Limit (Pro Users)", () => {
    it("[P1] should not show credit banner for pro users", () => {
      // GIVEN: Pro user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createProUser(),
        isPro: true,
        isLoading: false,
        isAuthenticated: true,
      };

      // WHEN: Rendering generate page
      render(<GeneratePage />);

      // THEN: No credit banner for pro users
      expect(screen.queryByText(/\d+ credits/i)).not.toBeInTheDocument();
    });
  });

  describe("Generation Flow", () => {
    it("[P1] should call generateAudio with URL and voice", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockResolvedValue(createGenerateResponse());

      render(<GeneratePage />);

      // WHEN: Entering URL and clicking generate
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // THEN: generateAudio is called with correct params
      await waitFor(() => {
        expect(mockGenerateAudio).toHaveBeenCalledWith({
          url: "https://example.com/article",
          voiceId: "default",
        });
      });
    });

    it("[P1] should show player after successful generation", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      const response = createGenerateResponse({ title: "Generated Article" });
      mockGenerateAudio.mockResolvedValue(response);

      render(<GeneratePage />);

      // WHEN: Generating successfully
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // THEN: Player is shown
      await waitFor(() => {
        expect(screen.getByTestId("web-player")).toBeInTheDocument();
      });
    });

    it("[P1] should show loading state during generation", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createGenerateResponse()), 1000))
      );

      render(<GeneratePage />);

      // WHEN: Starting generation
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // THEN: Shows generating state
      await waitFor(() => {
        expect(screen.getByText(/generating/i)).toBeInTheDocument();
      });
    });

    it("[P2] should disable input during generation", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createGenerateResponse()), 1000))
      );

      render(<GeneratePage />);

      // WHEN: Starting generation
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // THEN: Input is disabled
      await waitFor(() => {
        expect(screen.getByTestId("url-input")).toBeDisabled();
      });
    });
  });

  describe("Error Handling", () => {
    it("[P1] should show rate limit error", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };

      // Import ApiError to create proper instance
      const { ApiError } = await import("@/lib/api");
      mockGenerateAudio.mockRejectedValue(
        new ApiError("Rate limited", "RATE_LIMITED", 429)
      );

      render(<GeneratePage />);

      // WHEN: Generation fails with rate limit
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate/i });
      fireEvent.click(generateButton);

      // THEN: Shows rate limit message (now credits-based)
      await waitFor(() => {
        expect(screen.getByText(/reached your limit.*Buy credits/i)).toBeInTheDocument();
      });
    });

    it("[P1] should show generic error for other failures", async () => {
      // GIVEN: Authenticated user
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockRejectedValue(new Error("Network error"));

      render(<GeneratePage />);

      // WHEN: Generation fails
      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // THEN: Shows generic error
      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Post-Generation Actions", () => {
    it("[P1] should show Generate Another button after success", async () => {
      // GIVEN: Authenticated user with successful generation
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockResolvedValue(createGenerateResponse());

      render(<GeneratePage />);

      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // WHEN: Generation completes
      await waitFor(() => {
        expect(screen.getByTestId("web-player")).toBeInTheDocument();
      });

      // THEN: Generate Another button is visible
      expect(screen.getByRole("button", { name: /generate another/i })).toBeInTheDocument();
    });

    it("[P1] should show View in Library link after success", async () => {
      // GIVEN: Authenticated user with successful generation
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockResolvedValue(createGenerateResponse());

      render(<GeneratePage />);

      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      // WHEN: Generation completes
      await waitFor(() => {
        expect(screen.getByTestId("web-player")).toBeInTheDocument();
      });

      // THEN: View in Library link is visible
      expect(screen.getByRole("link", { name: /view in library/i })).toBeInTheDocument();
    });

    it("[P2] should reset form when Generate Another is clicked", async () => {
      // GIVEN: Authenticated user with successful generation
      mockUseAuthReturn = {
        ...mockUseAuthReturn,
        profile: createUserProfile(),
        isPro: false,
        isLoading: false,
        isAuthenticated: true,
      };
      mockGenerateAudio.mockResolvedValue(createGenerateResponse());

      render(<GeneratePage />);

      const urlInput = screen.getByTestId("url-input");
      fireEvent.change(urlInput, { target: { value: "https://example.com/article" } });

      const generateButton = screen.getByRole("button", { name: /generate podcast/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByTestId("web-player")).toBeInTheDocument();
      });

      // WHEN: Clicking Generate Another
      fireEvent.click(screen.getByRole("button", { name: /generate another/i }));

      // THEN: Form is shown again with empty URL
      await waitFor(() => {
        expect(screen.getByTestId("url-input")).toHaveValue("");
      });
      expect(screen.queryByTestId("web-player")).not.toBeInTheDocument();
    });
  });
});
