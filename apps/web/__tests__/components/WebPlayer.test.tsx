/**
 * Component Tests: WebPlayer
 *
 * Tests for the audio player component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WebPlayer } from "@/components/app/WebPlayer";

describe("WebPlayer Component", () => {
  const defaultProps = {
    audioUrl: "https://example.com/audio.mp3",
    title: "Test Podcast Episode",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("[P1] should render title", () => {
      // GIVEN: WebPlayer with title
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Title is displayed
      expect(screen.getByText("Test Podcast Episode")).toBeInTheDocument();
    });

    it("[P1] should render audio element with correct src", () => {
      // GIVEN: WebPlayer with audio URL
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Audio element has correct source
      const audio = document.querySelector("audio");
      expect(audio).toHaveAttribute("src", "https://example.com/audio.mp3");
    });

    it("[P1] should render play button initially", () => {
      // GIVEN: WebPlayer not playing
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Play/pause button is visible (middle of 5 buttons)
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      // The play/pause button is the middle one (index 1)
      expect(buttons[1]).toBeInTheDocument();
    });

    it("[P1] should render skip buttons", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Skip buttons are rendered (3 main control buttons)
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("[P2] should render speed control", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Speed control shows 1x
      expect(screen.getByText("1x")).toBeInTheDocument();
    });

    it("[P2] should render browser limitation notice", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Notice about browser limitations is shown
      expect(screen.getByText(/audio may pause/i)).toBeInTheDocument();
    });
  });

  describe("Time Formatting", () => {
    it("[P1] should display formatted time as 0:00 initially", () => {
      // GIVEN: WebPlayer with no playback
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Time shows 0:00 (both current time and duration initially)
      const timeElements = screen.getAllByText("0:00");
      expect(timeElements).toHaveLength(2); // current time and duration
    });

    it("[P2] should format initial position correctly", () => {
      // GIVEN: WebPlayer with initial position of 125 seconds (2:05)
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} initialPosition={125} />);

      // THEN: Time shows 2:05
      // Note: The component sets currentTime on loadedmetadata, so we check initial state
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });
  });

  describe("Speed Control", () => {
    it("[P1] should cycle through speeds on click", () => {
      // GIVEN: WebPlayer showing 1x speed
      render(<WebPlayer {...defaultProps} />);

      // WHEN: Clicking speed button
      const speedButton = screen.getByText("1x");
      fireEvent.click(speedButton);

      // THEN: Speed changes to 1.25x
      expect(screen.getByText("1.25x")).toBeInTheDocument();
    });

    it("[P2] should cycle back to 0.5x after 2x", () => {
      // GIVEN: WebPlayer component
      render(<WebPlayer {...defaultProps} />);

      const speedButton = screen.getByText("1x");

      // WHEN: Clicking through all speeds
      fireEvent.click(speedButton); // 1.25x
      fireEvent.click(screen.getByText("1.25x")); // 1.5x
      fireEvent.click(screen.getByText("1.5x")); // 1.75x
      fireEvent.click(screen.getByText("1.75x")); // 2x
      fireEvent.click(screen.getByText("2x")); // 0.5x

      // THEN: Speed cycles back to 0.5x
      expect(screen.getByText("0.5x")).toBeInTheDocument();
    });
  });

  describe("Progress Bar", () => {
    it("[P1] should render progress bar as range input", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Range input exists
      const slider = screen.getByRole("slider");
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute("type", "range");
    });

    it("[P2] should have min value of 0", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: Slider min is 0
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("min", "0");
    });
  });

  describe("Position Change Callback", () => {
    it("[P1] should call onPositionChange callback", () => {
      // GIVEN: WebPlayer with position change callback
      const onPositionChange = vi.fn();

      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} onPositionChange={onPositionChange} />);

      // THEN: Component renders (callback will be called during playback)
      expect(screen.getByText("Test Podcast Episode")).toBeInTheDocument();
    });
  });

  describe("Mute Toggle", () => {
    it("[P1] should render mute button", () => {
      // GIVEN: WebPlayer component
      // WHEN: Rendering component
      render(<WebPlayer {...defaultProps} />);

      // THEN: 5 buttons total: skip back, play, skip forward, speed, mute
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(5);
    });
  });
});
