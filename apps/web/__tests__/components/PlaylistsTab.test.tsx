/**
 * Component Tests: PlaylistsTab
 *
 * Tests for the playlists management tab including loading, creation, and deletion.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlaylistsTab } from "@/components/library/PlaylistsTab";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the API module
const mockGetPlaylists = vi.fn();
const mockCreatePlaylist = vi.fn();
const mockDeletePlaylist = vi.fn();

vi.mock("@/lib/api", () => ({
  getPlaylists: () => mockGetPlaylists(),
  createPlaylist: (name: string) => mockCreatePlaylist(name),
  deletePlaylist: (id: string) => mockDeletePlaylist(id),
}));

describe("PlaylistsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlaylists.mockResolvedValue([]);
  });

  describe("Loading State", () => {
    it("[P1] should show loading spinner while fetching playlists", () => {
      // GIVEN: Playlists are being fetched
      mockGetPlaylists.mockReturnValue(new Promise(() => {})); // Never resolves

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Loading spinner is visible
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("[P1] should hide loading spinner after playlists load", async () => {
      // GIVEN: Playlists fetch will resolve
      mockGetPlaylists.mockResolvedValue([]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Loading spinner disappears
      await waitFor(() => {
        expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("[P1] should show empty state when no playlists exist", async () => {
      // GIVEN: No playlists exist
      mockGetPlaylists.mockResolvedValue([]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Empty state is shown
      await waitFor(() => {
        expect(screen.getByText("No playlists yet")).toBeInTheDocument();
        expect(screen.getByText("Create your first playlist to organize your library")).toBeInTheDocument();
      });
    });

    it("[P1] should show Create Playlist button in empty state", async () => {
      // GIVEN: No playlists exist
      mockGetPlaylists.mockResolvedValue([]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Create Playlist button is visible
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
    });
  });

  describe("Playlist List", () => {
    it("[P1] should display existing playlists", async () => {
      // GIVEN: Playlists exist
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "My Favorites", itemCount: 5 },
        { id: "p2", name: "Work Podcasts", itemCount: 3 },
      ]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Playlists are displayed
      await waitFor(() => {
        expect(screen.getByText("My Favorites")).toBeInTheDocument();
        expect(screen.getByText("Work Podcasts")).toBeInTheDocument();
      });
    });

    it("[P2] should show item count for each playlist", async () => {
      // GIVEN: Playlists with item counts
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "My Favorites", itemCount: 5 },
        { id: "p2", name: "Single Item", itemCount: 1 },
      ]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Item counts are displayed correctly
      await waitFor(() => {
        expect(screen.getByText("5 items")).toBeInTheDocument();
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });

    it("[P1] should link to playlist detail page", async () => {
      // GIVEN: A playlist exists
      mockGetPlaylists.mockResolvedValue([
        { id: "playlist-123", name: "Test Playlist", itemCount: 2 },
      ]);

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Link points to playlist detail
      await waitFor(() => {
        const link = screen.getByRole("link", { name: /Test Playlist/i });
        expect(link).toHaveAttribute("href", "/playlist/playlist-123");
      });
    });
  });

  describe("Create Playlist", () => {
    it("[P1] should open create modal when button clicked in empty state", async () => {
      // GIVEN: No playlists exist
      mockGetPlaylists.mockResolvedValue([]);

      // WHEN: Create Playlist button is clicked
      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Create Playlist"));

      // THEN: Create modal is shown
      expect(screen.getByPlaceholderText("Playlist name")).toBeInTheDocument();
      expect(screen.getByText("Create")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("[P1] should create playlist when form is submitted", async () => {
      // GIVEN: Create modal is open
      mockGetPlaylists.mockResolvedValue([]);
      mockCreatePlaylist.mockResolvedValue({ id: "new-1", name: "New Playlist", itemCount: 0 });

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Create Playlist"));

      // WHEN: User enters name and submits
      const input = screen.getByPlaceholderText("Playlist name");
      fireEvent.change(input, { target: { value: "New Playlist" } });
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      // THEN: API is called and playlist is added
      await waitFor(() => {
        expect(mockCreatePlaylist).toHaveBeenCalledWith("New Playlist");
      });
    });

    it("[P1] should disable create button when name is empty", async () => {
      // GIVEN: Create modal is open
      mockGetPlaylists.mockResolvedValue([]);

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Create Playlist"));

      // WHEN: No name is entered
      // THEN: Create button is disabled
      expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
    });

    it("[P2] should close modal when Cancel is clicked", async () => {
      // GIVEN: Create modal is open
      mockGetPlaylists.mockResolvedValue([]);

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Create Playlist"));
      expect(screen.getByPlaceholderText("Playlist name")).toBeInTheDocument();

      // WHEN: Cancel is clicked
      fireEvent.click(screen.getByText("Cancel"));

      // THEN: Modal is closed
      expect(screen.queryByPlaceholderText("Playlist name")).not.toBeInTheDocument();
    });

    it("[P2] should trim whitespace from playlist name", async () => {
      // GIVEN: Create modal is open
      mockGetPlaylists.mockResolvedValue([]);
      mockCreatePlaylist.mockResolvedValue({ id: "new-1", name: "Trimmed Name", itemCount: 0 });

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Create Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Create Playlist"));

      // WHEN: User enters name with whitespace
      const input = screen.getByPlaceholderText("Playlist name");
      fireEvent.change(input, { target: { value: "  Trimmed Name  " } });
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      // THEN: API is called with trimmed name
      await waitFor(() => {
        expect(mockCreatePlaylist).toHaveBeenCalledWith("Trimmed Name");
      });
    });
  });

  describe("Delete Playlist", () => {
    it("[P1] should show delete option in menu", async () => {
      // GIVEN: Playlists exist
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "Test Playlist", itemCount: 2 },
      ]);

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });

      // WHEN: Menu button is clicked
      fireEvent.click(screen.getByLabelText("Playlist options"));

      // THEN: Delete option is shown
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("[P1] should delete playlist when confirmed", async () => {
      // GIVEN: Playlists exist and menu is open
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "Test Playlist", itemCount: 2 },
      ]);
      mockDeletePlaylist.mockResolvedValue(undefined);

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Playlist options"));

      // WHEN: Delete is clicked
      fireEvent.click(screen.getByText("Delete"));

      // THEN: API is called and playlist is removed
      await waitFor(() => {
        expect(mockDeletePlaylist).toHaveBeenCalledWith("p1");
      });
    });

    it("[P2] should show loading state during delete", async () => {
      // GIVEN: Playlists exist
      mockGetPlaylists.mockResolvedValue([
        { id: "p1", name: "Test Playlist", itemCount: 2 },
      ]);
      mockDeletePlaylist.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Test Playlist")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Playlist options"));

      // WHEN: Delete is clicked
      fireEvent.click(screen.getByText("Delete"));

      // THEN: Loading spinner is shown in delete button
      await waitFor(() => {
        const deleteButton = screen.getByRole("button", { name: /Delete/i }).closest("button");
        expect(deleteButton?.querySelector(".animate-spin")).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("[P1] should show error message when load fails", async () => {
      // GIVEN: API call fails
      mockGetPlaylists.mockRejectedValue(new Error("Network error"));

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Error message is shown
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("[P1] should show retry button on error", async () => {
      // GIVEN: API call fails
      mockGetPlaylists.mockRejectedValue(new Error("Failed"));

      // WHEN: Component is rendered
      render(<PlaylistsTab />);

      // THEN: Retry button is shown
      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });
    });

    it("[P1] should retry loading when Retry is clicked", async () => {
      // GIVEN: Initial load fails
      mockGetPlaylists.mockRejectedValueOnce(new Error("Failed"));
      mockGetPlaylists.mockResolvedValueOnce([]);

      render(<PlaylistsTab />);
      await waitFor(() => {
        expect(screen.getByText("Retry")).toBeInTheDocument();
      });

      // WHEN: Retry is clicked
      fireEvent.click(screen.getByText("Retry"));

      // THEN: API is called again
      await waitFor(() => {
        expect(mockGetPlaylists).toHaveBeenCalledTimes(2);
      });
    });
  });
});
