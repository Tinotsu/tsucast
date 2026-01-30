/**
 * Player Store
 *
 * Zustand store for audio player state management.
 * Story: 3-3 Player Screen & Controls
 */

import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  audioUrl: string;
  duration?: number;
  wordCount?: number;
  sourceUrl?: string;
  artwork?: string;
  transcriptUrl?: string;
}

interface PlayerState {
  // Current track info
  currentTrack: Track | null;
  currentLibraryId: string | null;

  // Playback state
  isPlaying: boolean;
  isLoading: boolean;

  // Position tracking
  position: number;
  duration: number;
  buffered: number;

  // Playback settings
  playbackSpeed: number;

  // Sleep timer
  sleepTimerEndTime: number | null;

  // Queue
  queue: Track[];

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setCurrentLibraryId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSleepTimer: (endTime: number | null) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  reset: () => void;
}

const initialState = {
  currentTrack: null,
  currentLibraryId: null,
  isPlaying: false,
  isLoading: false,
  position: 0,
  duration: 0,
  buffered: 0,
  playbackSpeed: 1.0,
  sleepTimerEndTime: null,
  queue: [],
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setCurrentLibraryId: (id) => set({ currentLibraryId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setSleepTimer: (endTime) => set({ sleepTimerEndTime: endTime }),
  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (trackId) =>
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== trackId),
    })),
  clearQueue: () => set({ queue: [] }),
  reset: () => set(initialState),
}));
