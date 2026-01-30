/**
 * Page Tests: Playlist Detail Page
 *
 * Tests for the playlist detail page including play, rename, and delete functionality.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlaylistPage from "@/app/(app)/playlist/[id]/page";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockParams = { id: "test-playlist-id" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
  useParams: () => mockParams,
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the API module
const mockGetPlaylist = vi.fn();
const mockRemoveFromPlaylist = vi.fn();
const mockRenamePlaylist = vi.fn();
const mockDeletePlaylist = vi.fn();

vi.mock("@/lib/api", () => ({
  getPlaylist: (id: string) => mockGetPlaylist(id),
  removeFromPlaylist: (playlistId: string, itemId: string) => mockRemoveFromPlaylist(playlistId, itemId),
  renamePlaylist: (id: string, name: string) => mockRenamePlaylist(id, name),
  deletePlaylist: (id: string) => mockDeletePlaylist(id),
}));

// Mock useAudioPlayer hook
const mockPlay = vi.fn();
const mockAddToQueue = vi.fn();

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    play: mockPlay,
    addToQueue: mockAddToQueue,
  }),
}));

const createMockPlaylist = (overrides = {}) => ({
  id: "test-playlist-id",
  name: "Test Playlist",
  items: [
    {
      id: "item-1",
      position: 0,
      audio: {
        id: "audio-1",
        title: "First Track",
        audio_url: "https://example.com/track1.mp3",
        duration_seconds: 300,
      },
    },
    {
      id: "item-2",
      position: 1,
      audio: {
        id: "audio-2",
        title: "Second Track",
        audio_url: "https://example.com/track2.mp3",
        duration_seconds: 600,
      },
    },
  ],
  ...overrides,
});

describe("Playlist Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlaylist.mockResolvedValue(createMockPlaylist());
  });

  describe("Loading State", () => {
    it("[P1] should show loading spinner while fetching playlist", () => {
      // GIVEN: Playlist is being fetched
      mockGetPlaylist.mockReturnValue(new Promise(() => {})); // Never resolves

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Loading spinner is visible
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Playlist Display", () => {
    it("[P1] should display playlist name", async () => {
      // GIVEN: Playlist exists
      mockGetPlaylist.mockResolvedValue(createMockPlaylist({ name: "My Favorites" }));

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Playlist name is displayed
      await waitFor(() => {
        expect(screen.getByText("My Favorites")).toBeInTheDocument();
      });
    });

    it("[P1] should display playlist items", async () => {
      // GIVEN: Playlist has items
      render(<PlaylistPage />);

      // THEN: Items are displayed
      await waitFor(() => {
        expect(screen.getByText("First Track")).toBeInTheDocument();
        expect(screen.getByText("Second Track")).toBeInTheDocument();
      });
    });

    it("[P2] should display item count", async () => {
      // GIVEN: Playlist has 2 items
      render(<PlaylistPage />);

      // THEN: Item count is shown
      await waitFor(() => {
        expect(screen.getByText("2 items")).toBeInTheDocument();
      });
    });

    it("[P2] should show singular 'item' for single item playlist", async () => {
      // GIVEN: Playlist has 1 item
      mockGetPlaylist.mockResolvedValue(createMockPlaylist({
        items: [{
          id: "item-1",
          position: 0,
          audio: {
            id: "audio-1",
            title: "Only Track",
            audio_url: "https://example.com/track.mp3",
            duration_seconds: 300,
          },
        }],
      }));

      render(<PlaylistPage />);

      // THEN: Shows "1 item"
      await waitFor(() => {
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });

    it("[P2] should display total duration", async () => {
      // GIVEN: Playlist has items totaling 900 seconds (15 min)
      render(<PlaylistPage />);

      // THEN: Total duration is shown
      await waitFor(() => {
        expect(screen.getByText("15 min total")).toBeInTheDocument();
      });
    });
  });

  describe("Play Functionality", () => {
    it("[P1] should play first track and queue rest when Play All clicked", async () => {
      // GIVEN: Playlist has multiple items
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Play All")).toBeInTheDocument();
      });

      // WHEN: Play All is clicked
      fireEvent.click(screen.getByText("Play All"));

      // THEN: First track plays, rest queued
      expect(mockPlay).toHaveBeenCalledWith({
        id: "audio-1",
        url: "https://example.com/track1.mp3",
        title: "First Track",
        duration: 300,
      });
      expect(mockAddToQueue).toHaveBeenCalledWith({
        id: "audio-2",
        url: "https://example.com/track2.mp3",
        title: "Second Track",
        duration: 600,
      });
    });

    it("[P1] should play individual track when play button clicked", async () => {
      // GIVEN: Playlist is loaded
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("First Track")).toBeInTheDocument();
      });

      // WHEN: Play button for first track is clicked (within item row, not Play All)
      // Find the track row containing "First Track" and click its play button
      const firstTrackRow = screen.getByText("First Track").closest("div.group");
      const playButton = firstTrackRow?.querySelector("button");
      fireEvent.click(playButton!);

      // THEN: That specific track plays
      expect(mockPlay).toHaveBeenCalledWith({
        id: "audio-1",
        url: "https://example.com/track1.mp3",
        title: "First Track",
        duration: 300,
      });
    });
  });

  describe("Rename Playlist", () => {
    it("[P1] should show edit mode when edit button clicked", async () => {
      // GIVEN: Playlist is loaded
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });

      // WHEN: Edit button is clicked
      fireEvent.click(screen.getByLabelText("Edit playlist name"));

      // THEN: Input field appears
      const input = screen.getByDisplayValue("Test Playlist");
      expect(input.tagName).toBe("INPUT");
    });

    it("[P1] should save new name when submitted", async () => {
      // GIVEN: Edit mode is active
      mockRenamePlaylist.mockResolvedValue(undefined);

      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Edit playlist name"));

      // WHEN: Name is changed and saved
      const input = screen.getByDisplayValue("Test Playlist");
      fireEvent.change(input, { target: { value: "Renamed Playlist" } });
      fireEvent.click(screen.getByText("Save"));

      // THEN: API is called
      await waitFor(() => {
        expect(mockRenamePlaylist).toHaveBeenCalledWith("test-playlist-id", "Renamed Playlist");
      });
    });

    it("[P2] should cancel edit when Cancel clicked", async () => {
      // GIVEN: Edit mode is active
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Edit playlist name"));

      const input = screen.getByDisplayValue("Test Playlist");
      fireEvent.change(input, { target: { value: "Changed Name" } });

      // WHEN: Cancel is clicked
      fireEvent.click(screen.getByText("Cancel"));

      // THEN: Original name is restored
      expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("Changed Name")).not.toBeInTheDocument();
    });
  });

  describe("Delete Playlist", () => {
    it("[P1] should show delete confirmation modal", async () => {
      // GIVEN: Playlist is loaded
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });

      // WHEN: Delete button is clicked
      fireEvent.click(screen.getByLabelText("Delete playlist"));

      // THEN: Confirmation modal appears
      expect(screen.getByText("Delete Playlist?")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it("[P1] should delete and redirect when confirmed", async () => {
      // GIVEN: Delete confirmation is showing
      mockDeletePlaylist.mockResolvedValue(undefined);

      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Delete playlist"));

      // WHEN: Delete is confirmed
      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[deleteButtons.length - 1]); // Click the modal's Delete button

      // THEN: API is called and redirects to playlists
      await waitFor(() => {
        expect(mockDeletePlaylist).toHaveBeenCalledWith("test-playlist-id");
        expect(mockPush).toHaveBeenCalledWith("/library?tab=playlists");
      });
    });

    it("[P2] should close modal when Cancel clicked", async () => {
      // GIVEN: Delete confirmation is showing
      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Delete playlist"));
      expect(screen.getByText("Delete Playlist?")).toBeInTheDocument();

      // WHEN: Cancel is clicked
      const cancelButtons = screen.getAllByText("Cancel");
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      // THEN: Modal closes
      expect(screen.queryByText("Delete Playlist?")).not.toBeInTheDocument();
    });
  });

  describe("Remove Item from Playlist", () => {
    it("[P1] should remove item when remove button clicked", async () => {
      // GIVEN: Playlist with items is loaded
      mockRemoveFromPlaylist.mockResolvedValue(undefined);

      render(<PlaylistPage />);
      await waitFor(() => {
        expect(screen.getByText("First Track")).toBeInTheDocument();
      });

      // WHEN: Remove button is clicked for first item
      const removeButton = screen.getByLabelText("Remove First Track");
      fireEvent.click(removeButton);

      // THEN: API is called
      await waitFor(() => {
        expect(mockRemoveFromPlaylist).toHaveBeenCalledWith("test-playlist-id", "item-1");
      });
    });
  });

  describe("Empty Playlist", () => {
    it("[P1] should show empty state when playlist has no items", async () => {
      // GIVEN: Empty playlist
      mockGetPlaylist.mockResolvedValue(createMockPlaylist({ items: [] }));

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Empty state is shown
      await waitFor(() => {
        expect(screen.getByText("This playlist is empty")).toBeInTheDocument();
        expect(screen.getByText("Add items from your library to get started")).toBeInTheDocument();
      });
    });

    it("[P2] should not show Play All button for empty playlist", async () => {
      // GIVEN: Empty playlist
      mockGetPlaylist.mockResolvedValue(createMockPlaylist({ items: [] }));

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Play All button is not visible
      await waitFor(() => {
        expect(screen.getByText("This playlist is empty")).toBeInTheDocument();
      });
      expect(screen.queryByText("Play All")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("[P1] should show error message when load fails", async () => {
      // GIVEN: API call fails
      mockGetPlaylist.mockRejectedValue(new Error("Network error"));

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Error message is shown
      await waitFor(() => {
        expect(screen.getByText("Failed to load playlist")).toBeInTheDocument();
      });
    });

    it("[P1] should show back link on error", async () => {
      // GIVEN: API call fails
      mockGetPlaylist.mockRejectedValue(new Error("Not found"));

      // WHEN: Page is rendered
      render(<PlaylistPage />);

      // THEN: Back link is shown
      await waitFor(() => {
        const backLink = screen.getByText("Back to Playlists");
        expect(backLink).toHaveAttribute("href", "/library?tab=playlists");
      });
    });
  });

  describe("Navigation", () => {
    it("[P2] should have back link to playlists tab", async () => {
      // GIVEN: Playlist is loaded
      render(<PlaylistPage />);

      // THEN: Back link points to playlists
      await waitFor(() => {
        const backLinks = screen.getAllByText("Back to Playlists");
        expect(backLinks[0]).toHaveAttribute("href", "/library?tab=playlists");
      });
    });
  });
});
