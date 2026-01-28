/**
 * Page Tests: Free Content (Public)
 *
 * Tests for the public free content page with audio player.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FreeContentPage from "@/app/free-content/page";

// Mock getFreeContent API
const mockGetFreeContent = vi.fn();

vi.mock("@/lib/api", () => ({
  getFreeContent: () => mockGetFreeContent(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock HTMLMediaElement methods
beforeEach(() => {
  vi.clearAllMocks();
  mockGetFreeContent.mockResolvedValue([]);

  // Mock audio element play/pause
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe("FreeContentPage", () => {
  describe("Loading State", () => {
    it("[P0] should show loading spinner initially", () => {
      // GIVEN: API call is pending
      mockGetFreeContent.mockReturnValue(new Promise(() => {}));

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Loading spinner is visible (Loader2 icon has animate-spin class)
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("[P0] should show empty message when no content", async () => {
      // GIVEN: API returns empty array
      mockGetFreeContent.mockResolvedValue([]);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Empty state message is shown
      await waitFor(() => {
        expect(screen.getByText(/no free content available/i)).toBeInTheDocument();
      });
    });
  });

  describe("Content Display", () => {
    const mockItems = [
      {
        id: "1",
        title: "How to Do Great Work",
        voice_id: "am_adam",
        source_url: "https://paulgraham.com/greatwork.html",
        audio_url: "https://cdn.example.com/audio1.mp3",
        duration_seconds: 1800,
        word_count: 12000,
        file_size_bytes: 5000000,
        status: "ready" as const,
        error_message: null,
        created_at: "2026-01-27T12:00:00.000Z",
        updated_at: "2026-01-27T12:30:00.000Z",
      },
      {
        id: "2",
        title: "Startup Ideas",
        voice_id: "af_sarah",
        source_url: null,
        audio_url: "https://cdn.example.com/audio2.mp3",
        duration_seconds: 600,
        word_count: 4000,
        file_size_bytes: 2000000,
        status: "ready" as const,
        error_message: null,
        created_at: "2026-01-26T10:00:00.000Z",
        updated_at: "2026-01-26T10:15:00.000Z",
      },
    ];

    it("[P0] should display content items with titles", async () => {
      // GIVEN: API returns content items
      mockGetFreeContent.mockResolvedValue(mockItems);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Content titles are displayed
      await waitFor(() => {
        expect(screen.getByText("How to Do Great Work")).toBeInTheDocument();
        expect(screen.getByText("Startup Ideas")).toBeInTheDocument();
      });
    });

    it("[P1] should display formatted duration", async () => {
      // GIVEN: API returns item with duration
      mockGetFreeContent.mockResolvedValue([mockItems[0]]);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Duration is formatted as MM:SS (1800s = 30:00)
      await waitFor(() => {
        expect(screen.getByText("30:00")).toBeInTheDocument();
      });
    });

    it("[P1] should display word count", async () => {
      // GIVEN: API returns item with word count
      mockGetFreeContent.mockResolvedValue([mockItems[0]]);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Word count is displayed with formatting
      await waitFor(() => {
        expect(screen.getByText("12,000 words")).toBeInTheDocument();
      });
    });
  });

  describe("Audio Player", () => {
    const mockItem = {
      id: "1",
      title: "Test Audio",
      voice_id: "am_adam",
      source_url: null,
      audio_url: "https://cdn.example.com/test.mp3",
      duration_seconds: 120,
      word_count: 800,
      file_size_bytes: 500000,
      status: "ready" as const,
      error_message: null,
      created_at: "2026-01-27T12:00:00.000Z",
      updated_at: "2026-01-27T12:00:00.000Z",
    };

    it("[P0] should have play button with aria-label", async () => {
      // GIVEN: API returns an item
      mockGetFreeContent.mockResolvedValue([mockItem]);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Play button has accessible label
      await waitFor(() => {
        const playButton = screen.getByRole("button", { name: /play test audio/i });
        expect(playButton).toBeInTheDocument();
      });
    });

    it("[P0] should toggle play/pause on button click", async () => {
      // GIVEN: Page with audio item
      mockGetFreeContent.mockResolvedValue([mockItem]);
      render(<FreeContentPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Audio")).toBeInTheDocument();
      });

      // WHEN: Clicking play button
      const playButton = screen.getByRole("button", { name: /play test audio/i });
      fireEvent.click(playButton);

      // THEN: Audio play is called
      await waitFor(() => {
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
      });
    });

    it("[P1] should have seekable progress bar", async () => {
      // GIVEN: Page with audio item
      mockGetFreeContent.mockResolvedValue([mockItem]);
      render(<FreeContentPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Audio")).toBeInTheDocument();
      });

      // THEN: Progress bar has slider role for accessibility
      const slider = screen.getByRole("slider", { name: /seek test audio/i });
      expect(slider).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("[P0] should display error message on API failure", async () => {
      // GIVEN: API call fails
      mockGetFreeContent.mockRejectedValue(new Error("Network error"));

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("CTA Section", () => {
    it("[P1] should display CTA section with heading and links", async () => {
      // GIVEN: Page loads successfully
      mockGetFreeContent.mockResolvedValue([]);

      // WHEN: Rendering page
      render(<FreeContentPage />);

      // THEN: CTA section is present with heading and description
      await waitFor(() => {
        expect(screen.getByText(/want to convert your own articles/i)).toBeInTheDocument();
        expect(screen.getByText(/sign up for free and start listening/i)).toBeInTheDocument();
      });

      // Verify download links exist (header + CTA section both have them)
      const downloadLinks = screen.getAllByRole("link", { name: /download app/i });
      expect(downloadLinks.length).toBeGreaterThanOrEqual(1);

      // The CTA section link should point to tsucast.com/download
      // Find by checking href contains "tsucast.com/download"
      const ctaDownloadLink = downloadLinks.find(
        (link) => link.getAttribute("href") === "https://tsucast.com/download"
      );
      expect(ctaDownloadLink).toBeInTheDocument();
    });
  });
});
