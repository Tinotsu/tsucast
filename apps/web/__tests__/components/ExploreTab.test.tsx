/**
 * Component Tests: ExploreTab
 *
 * Tests for the explore tab displaying free content with play and add-to-playlist features.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExploreTab } from "@/components/library/ExploreTab";

// Mock the API module
const mockGetFreeContent = vi.fn();

vi.mock("@/lib/api", () => ({
  getFreeContent: () => mockGetFreeContent(),
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
  addToPlaylist: vi.fn(),
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

// Mock useAudioPlayer hook
const mockPlay = vi.fn();
const mockPause = vi.fn();

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    play: mockPlay,
    pause: mockPause,
    track: null,
    isPlaying: false,
    isLoading: false,
  }),
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

describe("ExploreTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFreeContent.mockResolvedValue([]);
  });

  describe("Loading State", () => {
    it("[P1] should show loading spinner while fetching content", () => {
      // GIVEN: Content is being fetched
      mockGetFreeContent.mockReturnValue(new Promise(() => {})); // Never resolves

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Loading spinner is visible
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("[P1] should hide loading spinner after content loads", async () => {
      // GIVEN: Content fetch will resolve
      mockGetFreeContent.mockResolvedValue([]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Loading spinner disappears
      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("[P1] should show empty state when no content exists", async () => {
      // GIVEN: No free content exists
      mockGetFreeContent.mockResolvedValue([]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Empty state is shown
      await waitFor(() => {
        expect(screen.getByText("No free content available yet")).toBeInTheDocument();
        expect(screen.getByText("Check back soon for curated samples!")).toBeInTheDocument();
      });
    });
  });

  describe("Content List", () => {
    it("[P1] should display free content items", async () => {
      // GIVEN: Free content exists
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Introduction to AI", audio_url: "https://example.com/ai.mp3", duration_seconds: 300 },
        { id: "fc2", title: "Web Development Basics", audio_url: "https://example.com/web.mp3", duration_seconds: 600 },
      ]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Content items are displayed
      await waitFor(() => {
        expect(screen.getByText("Introduction to AI")).toBeInTheDocument();
        expect(screen.getByText("Web Development Basics")).toBeInTheDocument();
      });
    });

    it("[P2] should show duration for each item", async () => {
      // GIVEN: Content with duration
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Test Content", audio_url: "https://example.com/test.mp3", duration_seconds: 180 },
      ]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Duration is displayed
      await waitFor(() => {
        expect(screen.getByText("3 min")).toBeInTheDocument();
      });
    });

    it("[P1] should show 'Free to listen' label", async () => {
      // GIVEN: Free content exists
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Test Content", audio_url: "https://example.com/test.mp3", duration_seconds: 300 },
      ]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Free label is shown
      await waitFor(() => {
        expect(screen.getByText("Free to listen")).toBeInTheDocument();
      });
    });
  });

  describe("Play Functionality", () => {
    it("[P1] should call play when play button is clicked", async () => {
      // GIVEN: Content with audio
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Test Content", audio_url: "https://example.com/test.mp3", duration_seconds: 300 },
      ]);

      render(<ExploreTab />);
      await waitFor(() => {
        expect(screen.getByText("Test Content")).toBeInTheDocument();
      });

      // WHEN: Play button is clicked
      const playButton = screen.getByLabelText("Play Test Content");
      fireEvent.click(playButton);

      // THEN: Play is called with correct track data
      expect(mockPlay).toHaveBeenCalledWith({
        id: "fc1",
        url: "https://example.com/test.mp3",
        title: "Test Content",
        artist: "tsucast",
      });
    });

    it("[P2] should disable play button when no audio URL", async () => {
      // GIVEN: Content without audio
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "No Audio", audio_url: null, duration_seconds: null },
      ]);

      render(<ExploreTab />);
      await waitFor(() => {
        expect(screen.getByText("No Audio")).toBeInTheDocument();
      });

      // THEN: Play button is disabled
      const playButton = screen.getByLabelText("Play No Audio");
      expect(playButton).toBeDisabled();
    });
  });

  describe("Add to Playlist", () => {
    it("[P1] should show add to playlist button when authenticated", async () => {
      // GIVEN: Authenticated user and content exists
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Test Content", audio_url: "https://example.com/test.mp3", duration_seconds: 300 },
      ]);

      render(<ExploreTab />);
      await waitFor(() => {
        expect(screen.getByText("Test Content")).toBeInTheDocument();
      });

      // THEN: Add to playlist button exists
      expect(screen.getByLabelText("Add Test Content to playlist")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("[P1] should show error message when load fails", async () => {
      // GIVEN: API call fails
      mockGetFreeContent.mockRejectedValue(new Error("Network error"));

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Error message is shown
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it("[P2] should show generic error for non-Error failures", async () => {
      // GIVEN: API call fails with non-Error
      mockGetFreeContent.mockRejectedValue("Unknown failure");

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Generic error message is shown
      await waitFor(() => {
        expect(screen.getByText("Failed to load free content")).toBeInTheDocument();
      });
    });
  });

  describe("Header", () => {
    it("[P2] should display curated content description", async () => {
      // GIVEN: Content exists
      mockGetFreeContent.mockResolvedValue([
        { id: "fc1", title: "Test", audio_url: "https://example.com/test.mp3", duration_seconds: 300 },
      ]);

      // WHEN: Component is rendered
      render(<ExploreTab />);

      // THEN: Header description is shown
      await waitFor(() => {
        expect(screen.getByText("Curated articles to discover")).toBeInTheDocument();
      });
    });
  });
});
