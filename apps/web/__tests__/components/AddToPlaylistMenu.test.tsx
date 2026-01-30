/**
 * Component Tests: AddToPlaylistMenu
 *
 * Tests for the playlist menu modal including loading, selection, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddToPlaylistMenu } from "@/components/library/AddToPlaylistMenu";

// Mock the API module
const mockGetPlaylists = vi.fn();
const mockCreatePlaylist = vi.fn();
const mockAddToPlaylist = vi.fn();

vi.mock("@/lib/api", () => ({
  getPlaylists: () => mockGetPlaylists(),
  createPlaylist: (name: string) => mockCreatePlaylist(name),
  addToPlaylist: (playlistId: string, audioId: string) => mockAddToPlaylist(playlistId, audioId),
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

describe("AddToPlaylistMenu", () => {
  const defaultProps = {
    audioId: "test-audio-123",
    audioTitle: "Test Audio Title",
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlaylists.mockResolvedValue([]);
  });

  describe("Rendering", () => {
    it("[P1] should not render when isOpen is false", () => {
      render(<AddToPlaylistMenu {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("[P1] should render dialog when isOpen is true", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("[P1] should show title in header", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("Add to Playlist")).toBeInTheDocument();
      });
    });

    it("[P2] should show audio title being added", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("Test Audio Title")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("[P1] should show loading spinner while fetching playlists", () => {
      mockGetPlaylists.mockReturnValue(new Promise(() => {})); // Never resolves
      render(<AddToPlaylistMenu {...defaultProps} />);
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("[P1] should hide loading spinner after playlists load", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("[P1] should show 'No playlists yet' when empty", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("No playlists yet")).toBeInTheDocument();
      });
    });

    it("[P1] should show 'Create New Playlist' button", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("Create New Playlist")).toBeInTheDocument();
      });
    });
  });

  describe("Playlist List", () => {
    it("[P1] should display existing playlists", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "My Favorites", itemCount: 5 },
        { id: "p2", name: "Work Podcasts", itemCount: 3 },
      ]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("My Favorites")).toBeInTheDocument();
        expect(screen.getByText("Work Podcasts")).toBeInTheDocument();
      });
    });

    it("[P2] should show item count for each playlist", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "My Favorites", itemCount: 5 },
      ]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("5 items")).toBeInTheDocument();
      });
    });

    it("[P2] should show singular 'item' for count of 1", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "Single", itemCount: 1 },
      ]);
      render(<AddToPlaylistMenu {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });
  });

  describe("Adding to Playlist", () => {
    it("[P1] should call addToPlaylist when playlist clicked", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "playlist-1", name: "My Playlist", itemCount: 0 },
      ]);
      mockAddToPlaylist.mockResolvedValue(undefined);

      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("My Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("My Playlist"));

      await waitFor(() => {
        expect(mockAddToPlaylist).toHaveBeenCalledWith("playlist-1", "test-audio-123");
      });
    });

    it("[P1] should call onSuccess and onClose after successful add", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "playlist-1", name: "My Playlist", itemCount: 0 },
      ]);
      mockAddToPlaylist.mockResolvedValue(undefined);

      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("My Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("My Playlist"));

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith("My Playlist");
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it("[P1] should show error message on failure", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "playlist-1", name: "My Playlist", itemCount: 0 },
      ]);
      const { ApiError } = await import("@/lib/api");
      mockAddToPlaylist.mockRejectedValue(new ApiError("Item already in playlist", "DUPLICATE", 409));

      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("My Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("My Playlist"));

      await waitFor(() => {
        expect(screen.getByText("Item already in playlist")).toBeInTheDocument();
      });
    });
  });

  describe("Create New Playlist", () => {
    it("[P1] should show create form when 'Create New Playlist' clicked", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Create New Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Create New Playlist"));

      expect(screen.getByPlaceholderText("Playlist name")).toBeInTheDocument();
      expect(screen.getByText("Create & Add")).toBeInTheDocument();
    });

    it("[P1] should call createPlaylist and addToPlaylist on submit", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      mockCreatePlaylist.mockResolvedValue({ id: "new-playlist", name: "New Playlist" });
      mockAddToPlaylist.mockResolvedValue(undefined);

      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Create New Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Create New Playlist"));

      const input = screen.getByPlaceholderText("Playlist name");
      fireEvent.change(input, { target: { value: "New Playlist" } });
      fireEvent.click(screen.getByText("Create & Add"));

      await waitFor(() => {
        expect(mockCreatePlaylist).toHaveBeenCalledWith("New Playlist");
        expect(mockAddToPlaylist).toHaveBeenCalledWith("new-playlist", "test-audio-123");
      });
    });

    it("[P2] should go back when Back button clicked", async () => {
      mockGetPlaylists.mockResolvedValue([]);
      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Create New Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Create New Playlist"));
      expect(screen.getByPlaceholderText("Playlist name")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Back"));

      expect(screen.queryByPlaceholderText("Playlist name")).not.toBeInTheDocument();
      expect(screen.getByText("Create New Playlist")).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("[P1] should call onClose when X button clicked", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText("Close")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Close"));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("[P1] should call onClose when backdrop clicked", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click backdrop (the outer div)
      const backdrop = screen.getByRole("dialog").parentElement;
      fireEvent.click(backdrop!);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("[P1] should call onClose when Escape pressed", async () => {
      render(<AddToPlaylistMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("[P1] should show error when audioId is empty", async () => {
      mockGetPlaylists.mockResolvedValue([
        { id: "playlist-1", name: "My Playlist", itemCount: 0 },
      ]);

      render(<AddToPlaylistMenu {...defaultProps} audioId="" />);

      await waitFor(() => {
        expect(screen.getByText("My Playlist")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("My Playlist"));

      await waitFor(() => {
        expect(screen.getByText("No audio selected")).toBeInTheDocument();
      });
      expect(mockAddToPlaylist).not.toHaveBeenCalled();
    });
  });
});
