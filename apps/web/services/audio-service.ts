/**
 * AudioService - Singleton managing a single persistent audio element
 *
 * This service ensures audio playback persists across page navigation.
 * The audio element is created once and never destroyed.
 */

export interface AudioTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  artwork?: string;
  duration?: number;
}

export interface SleepTimerState {
  isActive: boolean;
  remainingSeconds: number;
  endOfTrack: boolean;
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  track: AudioTrack | null;
  error: string | null;
  sleepTimer: SleepTimerState;
  queue: AudioTrack[];
}

type AudioEventListener = (state: AudioState) => void;

const POSITION_STORAGE_PREFIX = "tsucast-playback-position-";
const POSITION_SAVE_THROTTLE_MS = 5000;

class AudioService {
  private static instance: AudioService | null = null;
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioEventListener> = new Set();
  private currentTrack: AudioTrack | null = null;
  private lastPositionSave = 0;
  private error: string | null = null;

  // Sleep timer state
  private sleepTimerInterval: ReturnType<typeof setInterval> | null = null;
  private sleepTimerRemaining = 0;
  private sleepTimerEndOfTrack = false;

  // Queue state
  private queue: AudioTrack[] = [];

  private constructor() {
    if (typeof window !== "undefined") {
      this.initAudioElement();
    }
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private initAudioElement(): void {
    this.audio = document.createElement("audio");
    this.audio.preload = "metadata";

    // Event listeners
    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("loadedmetadata", this.handleLoadedMetadata);
    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("play", this.handlePlay);
    this.audio.addEventListener("pause", this.handlePause);
    this.audio.addEventListener("waiting", this.handleWaiting);
    this.audio.addEventListener("canplay", this.handleCanPlay);
    this.audio.addEventListener("error", this.handleError);
    this.audio.addEventListener("volumechange", this.handleVolumeChange);
    this.audio.addEventListener("ratechange", this.handleRateChange);
  }

  private handleTimeUpdate = (): void => {
    this.notifyListeners();
    this.throttledSavePosition();
  };

  private handleLoadedMetadata = (): void => {
    this.notifyListeners();
    if (this.currentTrack) {
      this.setupMediaSession(this.currentTrack);
    }
  };

  private handleEnded = (): void => {
    // If sleep timer is set to end of track, trigger it
    if (this.sleepTimerEndOfTrack) {
      this.triggerSleepTimerEnd();
      this.notifyListeners();
      this.clearSavedPosition();
      return;
    }

    this.clearSavedPosition();

    // Auto-advance to next track in queue
    if (this.queue.length > 0) {
      const nextTrack = this.queue.shift()!;
      this.play(nextTrack);
    } else {
      this.notifyListeners();
    }
  };

  private handlePlay = (): void => {
    this.error = null;
    this.notifyListeners();
    this.updateMediaSessionPlaybackState("playing");
  };

  private handlePause = (): void => {
    this.notifyListeners();
    this.updateMediaSessionPlaybackState("paused");
    this.savePosition();
  };

  private handleWaiting = (): void => {
    this.notifyListeners();
  };

  private handleCanPlay = (): void => {
    this.notifyListeners();
  };

  private handleError = (): void => {
    this.error = "Failed to load audio";
    this.notifyListeners();
  };

  private handleVolumeChange = (): void => {
    this.notifyListeners();
  };

  private handleRateChange = (): void => {
    this.notifyListeners();
  };

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  subscribe(listener: AudioEventListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AudioState {
    const sleepTimer: SleepTimerState = {
      isActive: this.sleepTimerInterval !== null || this.sleepTimerEndOfTrack,
      remainingSeconds: this.sleepTimerRemaining,
      endOfTrack: this.sleepTimerEndOfTrack,
    };

    if (!this.audio) {
      return {
        isPlaying: false,
        isLoading: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        volume: 1,
        isMuted: false,
        track: null,
        error: null,
        sleepTimer,
        queue: [...this.queue],
      };
    }

    return {
      isPlaying: !this.audio.paused && !this.audio.ended,
      isLoading: this.audio.readyState < 3 && !this.audio.paused,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration || 0,
      playbackRate: this.audio.playbackRate,
      volume: this.audio.volume,
      isMuted: this.audio.muted,
      track: this.currentTrack,
      error: this.error,
      sleepTimer,
      queue: [...this.queue],
    };
  }

  async play(track: AudioTrack): Promise<void> {
    if (!this.audio) return;

    // If same track, just resume
    if (this.currentTrack?.id === track.id && this.audio.src) {
      await this.audio.play();
      return;
    }

    // New track
    this.currentTrack = track;
    this.error = null;
    this.audio.src = track.url;

    // Restore saved position if available
    const savedPosition = this.getSavedPosition(track.id);
    if (savedPosition > 0) {
      this.audio.currentTime = savedPosition;
    }

    this.setupMediaSession(track);
    await this.audio.play();
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    this.audio?.play();
  }

  togglePlayPause(): void {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  seek(time: number): void {
    if (!this.audio) return;
    const clampedTime = Math.max(0, Math.min(time, this.audio.duration || 0));
    this.audio.currentTime = clampedTime;
    this.notifyListeners();
  }

  seekRelative(delta: number): void {
    if (!this.audio) return;
    this.seek(this.audio.currentTime + delta);
  }

  setPlaybackRate(rate: number): void {
    if (!this.audio) return;
    this.audio.playbackRate = rate;
  }

  setVolume(volume: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  toggleMute(): void {
    if (!this.audio) return;
    this.audio.muted = !this.audio.muted;
  }

  stop(): void {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = "";
    this.currentTrack = null;
    this.error = null;
    this.cancelSleepTimer();
    this.notifyListeners();
    this.clearMediaSession();
  }

  // Skip controls
  skipForward(seconds = 15): void {
    this.seekRelative(seconds);
  }

  skipBackward(seconds = 15): void {
    this.seekRelative(-seconds);
  }

  // Sleep timer
  setSleepTimer(minutes: number): void {
    this.cancelSleepTimer();
    this.sleepTimerEndOfTrack = false;
    this.sleepTimerRemaining = minutes * 60;

    this.sleepTimerInterval = setInterval(() => {
      this.sleepTimerRemaining--;
      this.notifyListeners();

      if (this.sleepTimerRemaining <= 0) {
        this.triggerSleepTimerEnd();
      }
    }, 1000);

    this.notifyListeners();
  }

  setSleepTimerEndOfTrack(): void {
    this.cancelSleepTimer();
    this.sleepTimerEndOfTrack = true;
    this.sleepTimerRemaining = 0;
    this.notifyListeners();
  }

  cancelSleepTimer(): void {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerRemaining = 0;
    this.sleepTimerEndOfTrack = false;
    this.notifyListeners();
  }

  private triggerSleepTimerEnd(): void {
    this.cancelSleepTimer();
    this.pause();
  }

  // Queue management
  addToQueue(track: AudioTrack): void {
    // Don't add duplicates
    if (!this.queue.some((t) => t.id === track.id)) {
      this.queue.push(track);
      this.notifyListeners();
    }
  }

  removeFromQueue(trackId: string): void {
    const index = this.queue.findIndex((t) => t.id === trackId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notifyListeners();
    }
  }

  clearQueue(): void {
    this.queue = [];
    this.notifyListeners();
  }

  playNext(): void {
    if (this.queue.length > 0) {
      const nextTrack = this.queue.shift()!;
      this.play(nextTrack);
    }
  }

  // Position persistence
  private throttledSavePosition(): void {
    const now = Date.now();
    if (now - this.lastPositionSave > POSITION_SAVE_THROTTLE_MS) {
      this.savePosition();
      this.lastPositionSave = now;
    }
  }

  private savePosition(): void {
    if (!this.currentTrack || !this.audio) return;
    try {
      const key = POSITION_STORAGE_PREFIX + this.currentTrack.id;
      localStorage.setItem(key, String(this.audio.currentTime));
    } catch {
      // localStorage unavailable
    }
  }

  private getSavedPosition(trackId: string): number {
    try {
      const key = POSITION_STORAGE_PREFIX + trackId;
      const saved = localStorage.getItem(key);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  }

  private clearSavedPosition(): void {
    if (!this.currentTrack) return;
    try {
      const key = POSITION_STORAGE_PREFIX + this.currentTrack.id;
      localStorage.removeItem(key);
    } catch {
      // localStorage unavailable
    }
  }

  // Media Session API for lock screen / browser controls
  private setupMediaSession(track: AudioTrack): void {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || "tsucast",
      album: "tsucast",
      artwork: track.artwork
        ? [{ src: track.artwork, sizes: "512x512", type: "image/png" }]
        : [],
    });

    navigator.mediaSession.setActionHandler("play", () => this.resume());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () =>
      this.seekRelative(-15)
    );
    navigator.mediaSession.setActionHandler("seekforward", () =>
      this.seekRelative(30)
    );
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
  }

  private updateMediaSessionPlaybackState(
    state: "playing" | "paused" | "none"
  ): void {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = state;
  }

  private clearMediaSession(): void {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  }

  // Update document title with playing indicator
  updateDocumentTitle(originalTitle: string): string {
    if (this.currentTrack && this.getState().isPlaying) {
      return `▶ ${this.currentTrack.title} | ${originalTitle}`;
    }
    return originalTitle;
  }
}

export const audioService = AudioService.getInstance();
export default audioService;
