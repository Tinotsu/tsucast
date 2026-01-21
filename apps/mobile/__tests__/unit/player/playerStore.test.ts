/**
 * Player Store Tests
 *
 * Tests for the Zustand player store.
 * Story: 3-3 Player Screen & Controls
 */

import { usePlayerStore, Track } from '../../../stores/playerStore';

describe('playerStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      buffered: 0,
      playbackSpeed: 1.0,
      sleepTimerEndTime: null,
      queue: [],
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = usePlayerStore.getState();

      expect(state.currentTrack).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.position).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.buffered).toBe(0);
      expect(state.playbackSpeed).toBe(1.0);
      expect(state.sleepTimerEndTime).toBeNull();
      expect(state.queue).toEqual([]);
    });
  });

  describe('setCurrentTrack', () => {
    it('should set current track', () => {
      const track: Track = {
        id: 'track-1',
        title: 'Test Track',
        audioUrl: 'https://example.com/audio.mp3',
        duration: 120,
      };

      usePlayerStore.getState().setCurrentTrack(track);

      expect(usePlayerStore.getState().currentTrack).toEqual(track);
    });

    it('should clear current track when set to null', () => {
      const track: Track = {
        id: 'track-1',
        title: 'Test Track',
        audioUrl: 'https://example.com/audio.mp3',
      };

      usePlayerStore.getState().setCurrentTrack(track);
      usePlayerStore.getState().setCurrentTrack(null);

      expect(usePlayerStore.getState().currentTrack).toBeNull();
    });
  });

  describe('playback state', () => {
    it('should set isPlaying', () => {
      usePlayerStore.getState().setIsPlaying(true);
      expect(usePlayerStore.getState().isPlaying).toBe(true);

      usePlayerStore.getState().setIsPlaying(false);
      expect(usePlayerStore.getState().isPlaying).toBe(false);
    });

    it('should set isLoading', () => {
      usePlayerStore.getState().setIsLoading(true);
      expect(usePlayerStore.getState().isLoading).toBe(true);

      usePlayerStore.getState().setIsLoading(false);
      expect(usePlayerStore.getState().isLoading).toBe(false);
    });
  });

  describe('position tracking', () => {
    it('should set position', () => {
      usePlayerStore.getState().setPosition(60);
      expect(usePlayerStore.getState().position).toBe(60);
    });

    it('should set duration', () => {
      usePlayerStore.getState().setDuration(120);
      expect(usePlayerStore.getState().duration).toBe(120);
    });

    it('should set buffered', () => {
      usePlayerStore.getState().setBuffered(90);
      expect(usePlayerStore.getState().buffered).toBe(90);
    });
  });

  describe('playback speed', () => {
    it('should set playback speed', () => {
      usePlayerStore.getState().setPlaybackSpeed(1.5);
      expect(usePlayerStore.getState().playbackSpeed).toBe(1.5);
    });

    it('should accept all valid speed values', () => {
      const validSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

      validSpeeds.forEach((speed) => {
        usePlayerStore.getState().setPlaybackSpeed(speed);
        expect(usePlayerStore.getState().playbackSpeed).toBe(speed);
      });
    });
  });

  describe('sleep timer', () => {
    it('should set sleep timer end time', () => {
      const endTime = Date.now() + 15 * 60 * 1000;
      usePlayerStore.getState().setSleepTimer(endTime);
      expect(usePlayerStore.getState().sleepTimerEndTime).toBe(endTime);
    });

    it('should clear sleep timer when set to null', () => {
      const endTime = Date.now() + 15 * 60 * 1000;
      usePlayerStore.getState().setSleepTimer(endTime);
      usePlayerStore.getState().setSleepTimer(null);
      expect(usePlayerStore.getState().sleepTimerEndTime).toBeNull();
    });
  });

  describe('queue management', () => {
    it('should add track to queue', () => {
      const track: Track = {
        id: 'track-1',
        title: 'Test Track',
        audioUrl: 'https://example.com/audio.mp3',
      };

      usePlayerStore.getState().addToQueue(track);
      expect(usePlayerStore.getState().queue).toHaveLength(1);
      expect(usePlayerStore.getState().queue[0]).toEqual(track);
    });

    it('should remove track from queue', () => {
      const track1: Track = {
        id: 'track-1',
        title: 'Track 1',
        audioUrl: 'https://example.com/audio1.mp3',
      };
      const track2: Track = {
        id: 'track-2',
        title: 'Track 2',
        audioUrl: 'https://example.com/audio2.mp3',
      };

      usePlayerStore.getState().addToQueue(track1);
      usePlayerStore.getState().addToQueue(track2);
      usePlayerStore.getState().removeFromQueue('track-1');

      expect(usePlayerStore.getState().queue).toHaveLength(1);
      expect(usePlayerStore.getState().queue[0].id).toBe('track-2');
    });

    it('should clear queue', () => {
      const track: Track = {
        id: 'track-1',
        title: 'Test Track',
        audioUrl: 'https://example.com/audio.mp3',
      };

      usePlayerStore.getState().addToQueue(track);
      usePlayerStore.getState().clearQueue();

      expect(usePlayerStore.getState().queue).toEqual([]);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set various state values
      usePlayerStore.getState().setCurrentTrack({
        id: 'track-1',
        title: 'Test',
        audioUrl: 'https://example.com/audio.mp3',
      });
      usePlayerStore.getState().setIsPlaying(true);
      usePlayerStore.getState().setPosition(60);
      usePlayerStore.getState().setPlaybackSpeed(1.5);

      // Reset
      usePlayerStore.getState().reset();

      // Verify all values are back to initial
      const state = usePlayerStore.getState();
      expect(state.currentTrack).toBeNull();
      expect(state.isPlaying).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.position).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.playbackSpeed).toBe(1.0);
    });
  });
});
