"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  audioService,
  type AudioState,
  type AudioTrack,
} from "@/services/audio-service";

interface AudioPlayerContextValue extends AudioState {
  play: (track: AudioTrack) => Promise<void>;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  stop: () => void;
  // Sleep timer
  setSleepTimer: (minutes: number) => void;
  setSleepTimerEndOfTrack: () => void;
  cancelSleepTimer: () => void;
  // Queue management
  addToQueue: (track: AudioTrack) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  // Modal state
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  // Queue panel state
  isQueueOpen: boolean;
  openQueue: () => void;
  closeQueue: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(() => audioService.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  useEffect(() => {
    // Subscribe to audio service state changes
    const unsubscribe = audioService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update document title when playing
  useEffect(() => {
    if (typeof document === "undefined") return;

    const baseTitle = "tsucast";
    if (state.isPlaying && state.track) {
      document.title = `▶ ${state.track.title} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [state.isPlaying, state.track]);

  // Keyboard shortcuts for modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      } else if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        audioService.togglePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const play = useCallback(async (track: AudioTrack) => {
    await audioService.play(track);
  }, []);

  const pause = useCallback(() => {
    audioService.pause();
  }, []);

  const resume = useCallback(() => {
    audioService.resume();
  }, []);

  const togglePlayPause = useCallback(() => {
    audioService.togglePlayPause();
  }, []);

  const seek = useCallback((time: number) => {
    audioService.seek(time);
  }, []);

  const seekRelative = useCallback((delta: number) => {
    audioService.seekRelative(delta);
  }, []);

  const skipForward = useCallback((seconds = 15) => {
    audioService.skipForward(seconds);
  }, []);

  const skipBackward = useCallback((seconds = 15) => {
    audioService.skipBackward(seconds);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    audioService.setPlaybackRate(rate);
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioService.setVolume(volume);
  }, []);

  const toggleMute = useCallback(() => {
    audioService.toggleMute();
  }, []);

  const stop = useCallback(() => {
    audioService.stop();
  }, []);

  // Sleep timer methods
  const setSleepTimer = useCallback((minutes: number) => {
    audioService.setSleepTimer(minutes);
  }, []);

  const setSleepTimerEndOfTrack = useCallback(() => {
    audioService.setSleepTimerEndOfTrack();
  }, []);

  const cancelSleepTimer = useCallback(() => {
    audioService.cancelSleepTimer();
  }, []);

  // Queue methods
  const addToQueue = useCallback((track: AudioTrack) => {
    audioService.addToQueue(track);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    audioService.removeFromQueue(trackId);
  }, []);

  const clearQueue = useCallback(() => {
    audioService.clearQueue();
  }, []);

  const playNext = useCallback(() => {
    audioService.playNext();
  }, []);

  // Modal methods
  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Queue panel methods
  const openQueue = useCallback(() => {
    setIsQueueOpen(true);
  }, []);

  const closeQueue = useCallback(() => {
    setIsQueueOpen(false);
  }, []);

  const value: AudioPlayerContextValue = {
    ...state,
    play,
    pause,
    resume,
    togglePlayPause,
    seek,
    seekRelative,
    skipForward,
    skipBackward,
    setPlaybackRate,
    setVolume,
    toggleMute,
    stop,
    setSleepTimer,
    setSleepTimerEndOfTrack,
    cancelSleepTimer,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    isModalOpen,
    openModal,
    closeModal,
    isQueueOpen,
    openQueue,
    closeQueue,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}

export { AudioPlayerContext };
