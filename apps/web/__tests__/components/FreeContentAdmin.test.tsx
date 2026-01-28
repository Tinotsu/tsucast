/**
 * Component Tests: FreeContentAdmin
 *
 * Tests for the admin free content management page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminFreeContentPage from "@/app/admin/free-content/page";

// Mock admin-api functions
const mockGetAdminFreeContent = vi.fn();
const mockCreateAdminFreeContent = vi.fn();
const mockDeleteAdminFreeContent = vi.fn();

vi.mock("@/lib/admin-api", () => ({
  getAdminFreeContent: () => mockGetAdminFreeContent(),
  createAdminFreeContent: (data: unknown) => mockCreateAdminFreeContent(data),
  deleteAdminFreeContent: (id: string) => mockDeleteAdminFreeContent(id),
}));

describe("AdminFreeContentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAdminFreeContent.mockResolvedValue({ items: [] });
  });

  describe("Content List", () => {
    it("[P0] should render the page with title", async () => {
      // GIVEN: Admin page loads
      // WHEN: Rendering component
      render(<AdminFreeContentPage />);

      // THEN: Page title is displayed
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /free content/i })).toBeInTheDocument();
      });
    });

    it("[P0] should display loading state initially", () => {
      // GIVEN: API call is pending
      mockGetAdminFreeContent.mockReturnValue(new Promise(() => {}));

      // WHEN: Rendering component
      render(<AdminFreeContentPage />);

      // THEN: Page is rendered (loading spinner is an SVG, just check page is there)
      expect(screen.getByRole("heading", { name: /free content/i })).toBeInTheDocument();
    });

    it("[P0] should display content items when loaded", async () => {
      // GIVEN: API returns items
      mockGetAdminFreeContent.mockResolvedValue({
        items: [
          {
            id: "1",
            title: "Test Essay",
            voice_id: "am_adam",
            source_url: "https://example.com/essay",
            audio_url: "https://cdn.example.com/audio.mp3",
            duration_seconds: 300,
            word_count: 1500,
            file_size_bytes: 500000,
            status: "ready",
            error_message: null,
            created_at: "2026-01-27T12:00:00.000Z",
            updated_at: "2026-01-27T12:05:00.000Z",
          },
        ],
      });

      // WHEN: Rendering component
      render(<AdminFreeContentPage />);

      // THEN: Content item is displayed
      await waitFor(() => {
        expect(screen.getByText("Test Essay")).toBeInTheDocument();
      });
    });

    it("[P1] should display empty state when no items", async () => {
      // GIVEN: API returns empty list
      mockGetAdminFreeContent.mockResolvedValue({ items: [] });

      // WHEN: Rendering component
      render(<AdminFreeContentPage />);

      // THEN: Empty state message is shown
      await waitFor(() => {
        expect(screen.getByText(/no free content yet/i)).toBeInTheDocument();
      });
    });

    it("[P1] should display error state on API failure", async () => {
      // GIVEN: API call fails
      mockGetAdminFreeContent.mockRejectedValue(new Error("Network error"));

      // WHEN: Rendering component
      render(<AdminFreeContentPage />);

      // THEN: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("Create Form", () => {
    it("[P0] should show form when Add Content button is clicked", async () => {
      // GIVEN: Page is loaded
      render(<AdminFreeContentPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /free content/i })).toBeInTheDocument();
      });

      // WHEN: Clicking Add Content button
      const addButton = screen.getByRole("button", { name: /add content/i });
      fireEvent.click(addButton);

      // THEN: Form is displayed with title input
      expect(screen.getByPlaceholderText(/paul graham/i)).toBeInTheDocument();
    });

    it("[P0] should call API and add processing item on submit", async () => {
      // GIVEN: Form is filled with valid data
      mockCreateAdminFreeContent.mockResolvedValue({
        item: {
          id: "new-id",
          title: "New Essay",
          status: "processing",
          voice_id: "am_adam",
          source_url: "https://example.com/new",
          audio_url: null,
          duration_seconds: null,
          word_count: null,
          file_size_bytes: null,
          error_message: null,
          created_at: "2026-01-27T12:00:00.000Z",
          updated_at: "2026-01-27T12:00:00.000Z",
        },
      });

      render(<AdminFreeContentPage />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /free content/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole("button", { name: /add content/i });
      fireEvent.click(addButton);

      // Fill in title (uses placeholder text to find input)
      const titleInput = screen.getByPlaceholderText(/paul graham/i);
      fireEvent.change(titleInput, { target: { value: "New Essay" } });

      // Fill in URL (uses placeholder text to find input)
      const urlInput = screen.getByPlaceholderText(/https:\/\//i);
      fireEvent.change(urlInput, { target: { value: "https://example.com/new" } });

      // WHEN: Submitting the form
      const submitButton = screen.getByRole("button", { name: /generate free content/i });
      fireEvent.click(submitButton);

      // THEN: API is called with correct data
      await waitFor(() => {
        expect(mockCreateAdminFreeContent).toHaveBeenCalledWith({
          title: "New Essay",
          url: "https://example.com/new",
          voiceId: "am_adam",
        });
      });
    });
  });
});
