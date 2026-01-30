/**
 * Page Tests: Library Page
 *
 * Tests for the library page including item management and auth.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import LibraryPage from "@/app/(app)/library/page";
import { createLibraryItem, createLibraryItems } from "../factories";

// Mock router
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the API module
const mockGetLibrary = vi.fn();
const mockDeleteLibraryItem = vi.fn();

vi.mock("@/lib/api", () => ({
  getLibrary: () => mockGetLibrary(),
  deleteLibraryItem: (id: string) => mockDeleteLibraryItem(id),
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

// Mock useAuth to simulate authenticated user
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useAudioPlayer for queue and play functionality
const mockAddToQueue = vi.fn();
const mockPlay = vi.fn();
let mockCurrentTrack: { id: string } | null = null;

vi.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => ({
    addToQueue: mockAddToQueue,
    play: mockPlay,
    track: mockCurrentTrack,
    isPlaying: false,
    queue: [],
  }),
}));

describe("Library Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentTrack = null;
    // Default: authenticated user
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: "test-user-id" },
    });
  });

  describe("Loading State", () => {
    it("[P1] should show loading spinner initially", () => {
      // GIVEN: Auth is still loading
      mockUseAuth.mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        user: null,
      });

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Loading spinner is visible
      // The Loader2 component renders with animate-spin class
      const loadingElement = document.querySelector(".animate-spin");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("Authentication", () => {
    it("[P1] should redirect to login on 401 error", async () => {
      // GIVEN: API returns 401 ApiError
      // Import the mocked ApiError class
      const { ApiError } = await import("@/lib/api");
      const error = new ApiError("Unauthorized", "UNAUTHORIZED", 401);
      mockGetLibrary.mockRejectedValue(error);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=/library");
      });
    });

    it("[P2] should show empty library on other errors (not redirect)", async () => {
      // GIVEN: API returns non-401 error
      mockGetLibrary.mockRejectedValue(new Error("Connection refused"));

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Should show empty library, not redirect
      await waitFor(() => {
        expect(screen.getByText("Your library is empty")).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining("/login"));
    });
  });

  describe("Empty State", () => {
    it("[P1] should show empty state when no items", async () => {
      // GIVEN: Library is empty
      mockGetLibrary.mockResolvedValue([]);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Empty state message is shown
      await waitFor(() => {
        expect(screen.getByText("Your library is empty")).toBeInTheDocument();
      });
      expect(screen.getByText("Generate your first podcast to get started")).toBeInTheDocument();
    });

    it("[P1] should show Generate Podcast button in empty state", async () => {
      // GIVEN: Library is empty
      mockGetLibrary.mockResolvedValue([]);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Generate button is visible
      await waitFor(() => {
        expect(screen.getByRole("link", { name: /generate podcast/i })).toBeInTheDocument();
      });
    });
  });

  describe("Library Items", () => {
    it("[P1] should display library items", async () => {
      // GIVEN: Library has items
      const items = [
        createLibraryItem({ title: "Article One" }),
        createLibraryItem({ title: "Article Two" }),
      ];
      mockGetLibrary.mockResolvedValue(items);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Items are displayed
      await waitFor(() => {
        expect(screen.getByText("Article One")).toBeInTheDocument();
        expect(screen.getByText("Article Two")).toBeInTheDocument();
      });
    });

    it("[P1] should show item count", async () => {
      // GIVEN: Library has 3 items
      const items = createLibraryItems(3);
      mockGetLibrary.mockResolvedValue(items);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Shows "3 items"
      await waitFor(() => {
        expect(screen.getByText("3 items")).toBeInTheDocument();
      });
    });

    it("[P2] should show singular 'item' for 1 item", async () => {
      // GIVEN: Library has 1 item
      const items = [createLibraryItem()];
      mockGetLibrary.mockResolvedValue(items);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Shows "1 item" (singular)
      await waitFor(() => {
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });
    });
  });

  describe("Item Playback", () => {
    it("[P1] should call play when item is clicked", async () => {
      // GIVEN: Library with items
      const item = createLibraryItem({ title: "Test Article", audio_id: "test-123", audio_url: "https://example.com/audio.mp3", duration: 300 });
      mockGetLibrary.mockResolvedValue([item]);

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("Test Article")).toBeInTheDocument();
      });

      // WHEN: Clicking on item play button
      const playButtons = screen.getAllByRole("button");
      const playButton = playButtons.find((btn) =>
        btn.className.includes("rounded-xl")
      );
      fireEvent.click(playButton!);

      // THEN: play is called with correct track info
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalledWith({
          id: "test-123",
          url: "https://example.com/audio.mp3",
          title: "Test Article",
          duration: 300,
        });
      });
    });
  });

  describe("Delete Item", () => {
    it("[P1] should show confirmation when delete clicked", async () => {
      // GIVEN: Library with items
      const item = createLibraryItem({ audio_id: "audio-123" });
      mockGetLibrary.mockResolvedValue([item]);
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });

      // WHEN: Clicking delete button (trash icon)
      const deleteButton = screen.getByRole("button", { name: /^delete /i });
      fireEvent.click(deleteButton);

      // THEN: Confirmation buttons appear
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel delete/i })).toBeInTheDocument();
      });
    });

    it("[P1] should call deleteLibraryItem when delete confirmed", async () => {
      // GIVEN: Library with items
      const item = createLibraryItem({ audio_id: "audio-123" });
      mockGetLibrary.mockResolvedValue([item]);
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });

      // WHEN: Clicking delete button then confirming
      const deleteButton = screen.getByRole("button", { name: /^delete /i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

      // THEN: deleteLibraryItem is called with correct ID
      await waitFor(() => {
        expect(mockDeleteLibraryItem).toHaveBeenCalledWith("audio-123");
      });
    });

    it("[P1] should remove item from list after delete", async () => {
      // GIVEN: Library with one item
      const item = createLibraryItem({ title: "Item to Delete", audio_id: "del-123" });
      mockGetLibrary.mockResolvedValue([item]);
      mockDeleteLibraryItem.mockResolvedValue(undefined);

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("Item to Delete")).toBeInTheDocument();
      });

      // WHEN: Deleting the item (click trash, then confirm)
      const deleteButton = screen.getByRole("button", { name: /^delete /i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

      // THEN: Item is removed from display
      await waitFor(() => {
        expect(screen.queryByText("Item to Delete")).not.toBeInTheDocument();
      });
    });

    it("[P2] should cancel delete when cancel clicked", async () => {
      // GIVEN: Library with items showing confirmation
      const item = createLibraryItem({ audio_id: "audio-123" });
      mockGetLibrary.mockResolvedValue([item]);

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      });

      // Click delete to show confirmation
      const deleteButton = screen.getByRole("button", { name: /^delete /i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel delete/i })).toBeInTheDocument();
      });

      // WHEN: Clicking cancel
      fireEvent.click(screen.getByRole("button", { name: /cancel delete/i }));

      // THEN: Confirmation disappears and item still there
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /cancel delete/i })).not.toBeInTheDocument();
      });
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(mockDeleteLibraryItem).not.toHaveBeenCalled();
    });

    it("[P2] should call delete API when currently playing item is confirmed for deletion", async () => {
      // GIVEN: Library with one item that's currently playing
      const item = createLibraryItem({ title: "Playing Item", audio_id: "sel-123" });
      mockGetLibrary.mockResolvedValue([item]);
      mockDeleteLibraryItem.mockResolvedValue(undefined);
      mockCurrentTrack = { id: "sel-123" };

      render(<LibraryPage />);

      await waitFor(() => {
        expect(screen.getByText("Playing Item")).toBeInTheDocument();
      });

      // WHEN: Deleting the playing item (click trash, then confirm)
      const deleteButton = screen.getByRole("button", { name: /^delete /i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /confirm delete/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

      // THEN: Delete API should be called with the correct ID
      await waitFor(() => {
        expect(mockDeleteLibraryItem).toHaveBeenCalledWith("sel-123");
      });
    });
  });

  describe("Progress Display", () => {
    it("[P2] should show 'Played' badge for completed items", async () => {
      // GIVEN: Item that's been played
      const item = createLibraryItem({ is_played: true });
      mockGetLibrary.mockResolvedValue([item]);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Played badge is shown
      await waitFor(() => {
        expect(screen.getByText("Played")).toBeInTheDocument();
      });
    });

    it("[P2] should show progress bar for partially played items", async () => {
      // GIVEN: Item that's partially played
      const item = createLibraryItem({
        duration: 100,
        playback_position: 50,
        is_played: false,
      });
      mockGetLibrary.mockResolvedValue([item]);

      // WHEN: Rendering library page
      render(<LibraryPage />);

      // THEN: Progress bar is visible
      await waitFor(() => {
        const progressBar = document.querySelector('[style*="width: 50%"]');
        expect(progressBar).toBeInTheDocument();
      });
    });
  });
});
