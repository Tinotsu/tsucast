"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  AudioService,
  AudioState,
  TrackMetadata,
} from "@/services/audio-service";

interface AudioPlayerContextValue {
  // State
  state: AudioState;
  currentTrack: TrackMetadata | null;

  // Actions
  play: (url?: string, metadata?: TrackMetadata) => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  skip: (seconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  cyclePlaybackRate: () => void;
  toggleMute: () => void;

  // Position
  getSavedPosition: (trackId: string) => number;
  clearSavedPosition: (trackId: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const initialState: AudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  src: null,
  playbackRate: 1,
  isMuted: false,
  isLoading: false,
  error: null,
};

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(initialState);
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio service
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const audioService = AudioService.getInstance();

    // Sync initial state
    setState(audioService.getState());
    setCurrentTrack(audioService.getCurrentTrack());
    setIsInitialized(true);

    // Subscribe to state changes
    const unsubscribeState = audioService.on("statechange", (newState) => {
      setState(newState);
    });

    const unsubscribeTimeUpdate = audioService.on("timeupdate", (newState) => {
      setState((prev) => ({ ...prev, currentTime: newState.currentTime }));
    });

    const unsubscribeTrackChange = audioService.on("trackchange", () => {
      setCurrentTrack(audioService.getCurrentTrack());
    });

    return () => {
      unsubscribeState();
      unsubscribeTimeUpdate();
      unsubscribeTrackChange();
    };
  }, []);

  // Actions
  const play = useCallback(
    async (url?: string, metadata?: TrackMetadata): Promise<void> => {
      const audioService = AudioService.getInstance();
      await audioService.play(url, metadata);
    },
    []
  );

  const pause = useCallback((): void => {
    const audioService = AudioService.getInstance();
    audioService.pause();
  }, []);

  const togglePlay = useCallback((): void => {
    const audioService = AudioService.getInstance();
    audioService.togglePlay();
  }, []);

  const seek = useCallback((time: number): void => {
    const audioService = AudioService.getInstance();
    audioService.seek(time);
  }, []);

  const skip = useCallback((seconds: number): void => {
    const audioService = AudioService.getInstance();
    audioService.skip(seconds);
  }, []);

  const setPlaybackRate = useCallback((rate: number): void => {
    const audioService = AudioService.getInstance();
    audioService.setPlaybackRate(rate);
  }, []);

  const cyclePlaybackRate = useCallback((): void => {
    const audioService = AudioService.getInstance();
    audioService.cyclePlaybackRate();
  }, []);

  const toggleMute = useCallback((): void => {
    const audioService = AudioService.getInstance();
    audioService.toggleMute();
  }, []);

  const getSavedPosition = useCallback((trackId: string): number => {
    const audioService = AudioService.getInstance();
    return audioService.getSavedPosition(trackId);
  }, []);

  const clearSavedPosition = useCallback((trackId: string): void => {
    const audioService = AudioService.getInstance();
    audioService.clearSavedPosition(trackId);
  }, []);

  const value: AudioPlayerContextValue = {
    state,
    currentTrack,
    play,
    pause,
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    cyclePlaybackRate,
    toggleMute,
    getSavedPosition,
    clearSavedPosition,
  };

  // Don't render anything server-side that depends on audio
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextValue {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider"
    );
  }

  return context;
}

// Optional hook for components that may be outside provider
export function useAudioPlayerOptional(): AudioPlayerContextValue | null {
  return useContext(AudioPlayerContext);
}
