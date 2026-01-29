/**
 * GlobalMiniPlayer Component Tests
 *
 * Tests for the persistent mini player shown at bottom of screen.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlobalMiniPlayer } from "@/components/player/GlobalMiniPlayer";
import { AudioPlayerProvider } from "@/providers/AudioPlayerProvider";
import type { AudioState } from "@/services/audio-service";

// Mock the audio service
const mockState: AudioState = {
  isPlaying: false,
  isLoading: false,
  currentTime: 30,
  duration: 120,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  track: null,
  error: null,
  sleepTimer: {
    isActive: false,
    remainingSeconds: 0,
    endOfTrack: false,
  },
  queue: [],
};

const mockSubscribe = vi.fn((callback: (state: AudioState) => void) => {
  callback(mockState);
  return vi.fn();
});

vi.mock("@/services/audio-service", () => ({
  audioService: {
    getState: () => mockState,
    subscribe: (cb: (state: AudioState) => void) => mockSubscribe(cb),
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    togglePlayPause: vi.fn(),
    seek: vi.fn(),
    seekRelative: vi.fn(),
    skipForward: vi.fn(),
    skipBackward: vi.fn(),
    setPlaybackRate: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    stop: vi.fn(),
    setSleepTimer: vi.fn(),
    setSleepTimerEndOfTrack: vi.fn(),
    cancelSleepTimer: vi.fn(),
    addToQueue: vi.fn(),
    removeFromQueue: vi.fn(),
    clearQueue: vi.fn(),
    playNext: vi.fn(),
  },
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<AudioPlayerProvider>{ui}</AudioPlayerProvider>);
}

describe("GlobalMiniPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockState.track = null;
    mockState.isPlaying = false;
    mockState.isLoading = false;
    mockState.currentTime = 30;
    mockState.duration = 120;
    mockState.playbackRate = 1;
    mockState.isMuted = false;
  });

  describe("Visibility", () => {
    it("[P0] should not render when no track", () => {
      mockState.track = null;
      renderWithProvider(<GlobalMiniPlayer />);

      expect(screen.queryByRole("button", { name: /play/i })).toBeNull();
    });

    it("[P0] should render when track is present", () => {
      mockState.track = {
        id: "track-1",
        url: "https://example.com/audio.mp3",
        title: "Test Track Title",
      };

      renderWithProvider(<GlobalMiniPlayer />);

      expect(screen.getByText("Test Track Title")).toBeInTheDocument();
    });
  });

  describe("Playback Controls", () => {
    beforeEach(() => {
      mockState.track = {
        id: "track-1",
        url: "https://example.com/audio.mp3",
        title: "Test Track",
      };
    });

    it("[P0] should show play button when paused", () => {
      mockState.isPlaying = false;

      renderWithProvider(<GlobalMiniPlayer />);

      const playButtons = screen.getAllByRole("button", { name: /play/i });
      expect(playButtons.length).toBeGreaterThan(0);
    });

    it("[P0] should show pause button when playing", () => {
      mockState.isPlaying = true;

      renderWithProvider(<GlobalMiniPlayer />);

      expect(
        screen.getByRole("button", { name: /pause/i })
      ).toBeInTheDocument();
    });

    it("[P0] should show loading state", () => {
      mockState.isLoading = true;

      renderWithProvider(<GlobalMiniPlayer />);

      // Loading indicator (spinner) should be visible
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("[P1] should have close button", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      expect(
        screen.getByRole("button", { name: /close/i })
      ).toBeInTheDocument();
    });
  });

  describe("Progress Display", () => {
    beforeEach(() => {
      mockState.track = {
        id: "track-1",
        url: "https://example.com/audio.mp3",
        title: "Test Track",
      };
      mockState.currentTime = 30;
      mockState.duration = 120;
    });

    it("[P0] should display formatted time", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      // Should show "0:30 / 2:00"
      expect(screen.getByText(/0:30/)).toBeInTheDocument();
      expect(screen.getByText(/2:00/)).toBeInTheDocument();
    });

    it("[P0] should have seekable progress bar", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      const slider = screen.getByRole("slider", { name: /progress/i });
      expect(slider).toBeInTheDocument();
    });
  });

  describe("Open Full Player", () => {
    beforeEach(() => {
      mockState.track = {
        id: "track-1",
        url: "https://example.com/audio.mp3",
        title: "Test Track",
      };
    });

    it("[P1] should have open full player button", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      // There should be at least one button to open full player
      const openButtons = screen.getAllByRole("button", { name: /open full player/i });
      expect(openButtons.length).toBeGreaterThan(0);
    });

    it("[P1] should have clickable track info to open modal", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      // The track info area should be a button that opens the modal
      const trackInfoButtons = screen.getAllByRole("button", { name: /open full player/i });
      expect(trackInfoButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockState.track = {
        id: "track-1",
        url: "https://example.com/audio.mp3",
        title: "Test Track",
      };
    });

    it("[P0] should have accessible play/pause button", () => {
      mockState.isPlaying = false;
      renderWithProvider(<GlobalMiniPlayer />);

      // Get the main play button (first one, not any in expanded controls)
      const playButtons = screen.getAllByRole("button", { name: /play/i });
      expect(playButtons.length).toBeGreaterThan(0);
      expect(playButtons[0]).toHaveAttribute("aria-label");
    });

    it("[P0] should have accessible progress slider", () => {
      renderWithProvider(<GlobalMiniPlayer />);

      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-label");
      expect(slider).toHaveAttribute("aria-valuenow");
    });
  });
});
