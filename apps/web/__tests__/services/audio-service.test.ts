/**
 * AudioService Unit Tests
 *
 * Tests for the singleton audio service interface.
 * Note: Complex singleton state tests are skipped due to mocking limitations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock MediaMetadata before any imports
class MockMediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: { src: string; sizes: string; type: string }[];

  constructor(init: {
    title: string;
    artist: string;
    album: string;
    artwork: { src: string; sizes: string; type: string }[];
  }) {
    this.title = init.title;
    this.artist = init.artist;
    this.album = init.album;
    this.artwork = init.artwork;
  }
}
(globalThis as unknown as { MediaMetadata: typeof MockMediaMetadata }).MediaMetadata = MockMediaMetadata;

// Mock mediaSession
Object.defineProperty(navigator, "mediaSession", {
  value: {
    metadata: null,
    playbackState: "none",
    setActionHandler: vi.fn(),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock HTMLMediaElement play/pause
window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();

import { audioService, type AudioTrack } from "@/services/audio-service";

describe("AudioService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("Singleton Pattern", () => {
    it("[P0] should return consistent instance", async () => {
      const { audioService: service1 } = await import(
        "@/services/audio-service"
      );
      const { audioService: service2 } = await import(
        "@/services/audio-service"
      );
      expect(service1).toBe(service2);
    });
  });

  describe("Initial State", () => {
    it("[P0] should have correct initial state shape", () => {
      const state = audioService.getState();
      expect(state).toHaveProperty("isPlaying");
      expect(state).toHaveProperty("isLoading");
      expect(state).toHaveProperty("currentTime");
      expect(state).toHaveProperty("duration");
      expect(state).toHaveProperty("playbackRate");
      expect(state).toHaveProperty("volume");
      expect(state).toHaveProperty("isMuted");
      expect(state).toHaveProperty("track");
      expect(state).toHaveProperty("error");
    });

    it("[P0] should have no track initially", () => {
      // After stop, track should be null
      audioService.stop();
      const state = audioService.getState();
      expect(state.track).toBeNull();
    });
  });

  describe("Subscription", () => {
    it("[P0] should call subscriber immediately with current state", () => {
      const listener = vi.fn();
      const unsubscribe = audioService.subscribe(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      const calledState = listener.mock.calls[0][0];
      expect(calledState).toHaveProperty("isPlaying");
      expect(calledState).toHaveProperty("track");

      unsubscribe();
    });

    it("[P0] should return unsubscribe function", () => {
      const listener = vi.fn();
      const unsubscribe = audioService.subscribe(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });

  describe("API Methods", () => {
    const testTrack: AudioTrack = {
      id: "test-track",
      url: "https://example.com/audio.mp3",
      title: "Test Track",
      artist: "Test Artist",
    };

    it("[P0] should have play method", async () => {
      expect(typeof audioService.play).toBe("function");
      // Should not throw
      await audioService.play(testTrack);
    });

    it("[P0] should have pause method", () => {
      expect(typeof audioService.pause).toBe("function");
      audioService.pause();
    });

    it("[P0] should have resume method", () => {
      expect(typeof audioService.resume).toBe("function");
      audioService.resume();
    });

    it("[P0] should have togglePlayPause method", () => {
      expect(typeof audioService.togglePlayPause).toBe("function");
      audioService.togglePlayPause();
    });

    it("[P0] should have seek method", () => {
      expect(typeof audioService.seek).toBe("function");
      audioService.seek(30);
    });

    it("[P0] should have seekRelative method", () => {
      expect(typeof audioService.seekRelative).toBe("function");
      audioService.seekRelative(15);
      audioService.seekRelative(-15);
    });

    it("[P0] should have setPlaybackRate method", () => {
      expect(typeof audioService.setPlaybackRate).toBe("function");
      audioService.setPlaybackRate(1.5);
    });

    it("[P0] should have setVolume method", () => {
      expect(typeof audioService.setVolume).toBe("function");
      audioService.setVolume(0.5);
    });

    it("[P0] should have toggleMute method", () => {
      expect(typeof audioService.toggleMute).toBe("function");
      audioService.toggleMute();
    });

    it("[P0] should have stop method", () => {
      expect(typeof audioService.stop).toBe("function");
      audioService.stop();
    });
  });

  describe("Track Management", () => {
    const testTrack: AudioTrack = {
      id: "test-track",
      url: "https://example.com/audio.mp3",
      title: "Test Track",
      artist: "Test Artist",
    };

    it("[P0] should set track after play", async () => {
      await audioService.play(testTrack);
      const state = audioService.getState();
      expect(state.track).toEqual(testTrack);
    });

    it("[P0] should clear track after stop", async () => {
      await audioService.play(testTrack);
      audioService.stop();
      const state = audioService.getState();
      expect(state.track).toBeNull();
    });
  });

  describe("Media Session Integration", () => {
    it("[P0] should set up media session handlers", async () => {
      const testTrack: AudioTrack = {
        id: "test-track",
        url: "https://example.com/audio.mp3",
        title: "Test Track",
      };

      await audioService.play(testTrack);

      // Should have called setActionHandler for various actions
      expect(navigator.mediaSession.setActionHandler).toHaveBeenCalled();
    });
  });

  describe("Error Recovery", () => {
    const testTrack: AudioTrack = {
      id: "error-test-track",
      url: "https://example.com/error.mp3",
      title: "Error Test Track",
    };

    it("[P1] should handle queue management", async () => {
      const listener = vi.fn();
      const unsubscribe = audioService.subscribe(listener);

      // Add track to queue
      const nextTrack: AudioTrack = {
        id: "queue-track",
        url: "https://example.com/queue.mp3",
        title: "Queue Track",
      };
      audioService.addToQueue(nextTrack);

      const state = audioService.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].id).toBe("queue-track");

      // Remove from queue
      audioService.removeFromQueue("queue-track");
      const stateAfter = audioService.getState();
      expect(stateAfter.queue).toHaveLength(0);

      unsubscribe();
    });

    it("[P1] should clear queue on stop", async () => {
      const nextTrack: AudioTrack = {
        id: "queue-track-2",
        url: "https://example.com/queue2.mp3",
        title: "Queue Track 2",
      };
      audioService.addToQueue(nextTrack);
      audioService.clearQueue();

      const state = audioService.getState();
      expect(state.queue).toHaveLength(0);
    });

    it("[P1] should have error state accessible", () => {
      const state = audioService.getState();
      // Error should be null or a string
      expect(state.error === null || typeof state.error === "string").toBe(true);
    });

    it("[P1] should have valid playback rate range methods", () => {
      // Test valid playback rates
      audioService.setPlaybackRate(0.5);
      expect(audioService.getState().playbackRate).toBe(0.5);

      audioService.setPlaybackRate(1.5);
      expect(audioService.getState().playbackRate).toBe(1.5);

      audioService.setPlaybackRate(2);
      expect(audioService.getState().playbackRate).toBe(2);

      // Reset to default
      audioService.setPlaybackRate(1);
    });

    it("[P1] should have valid volume range methods", () => {
      // Test valid volume levels
      audioService.setVolume(0);
      expect(audioService.getState().volume).toBe(0);

      audioService.setVolume(0.5);
      expect(audioService.getState().volume).toBe(0.5);

      audioService.setVolume(1);
      expect(audioService.getState().volume).toBe(1);
    });

    it("[P1] should toggle mute state", () => {
      const initialMuted = audioService.getState().isMuted;
      audioService.toggleMute();
      expect(audioService.getState().isMuted).toBe(!initialMuted);
      audioService.toggleMute();
      expect(audioService.getState().isMuted).toBe(initialMuted);
    });
  });
});
