/**
 * AudioService - Singleton for global audio management
 *
 * This service creates a single <audio> element that persists across route changes,
 * enabling seamless playback like SoundCloud or Spotify Web.
 *
 * Key features:
 * - Singleton pattern - audio element never unmounts
 * - Media Session API integration for lock screen controls
 * - localStorage persistence for playback position
 * - Event-based state updates for React integration
 */

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  src: string | null;
  playbackRate: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist?: string;
  artwork?: string;
}

type AudioEventType =
  | "statechange"
  | "timeupdate"
  | "ended"
  | "error"
  | "trackchange";

type AudioEventCallback = (state: AudioState) => void;

const POSITION_STORAGE_PREFIX = "playback-position-";
const LAST_TRACK_KEY = "last-played-track";
const POSITION_SAVE_INTERVAL = 5000; // Save position every 5 seconds

class AudioServiceClass {
  private static instance: AudioServiceClass | null = null;

  private audio: HTMLAudioElement | null = null;
  private currentTrack: TrackMetadata | null = null;
  private listeners: Map<AudioEventType, Set<AudioEventCallback>> = new Map();
  private positionSaveInterval: ReturnType<typeof setInterval> | null = null;

  private state: AudioState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    src: null,
    playbackRate: 1,
    isMuted: false,
    isLoading: false,
    error: null,
  };

  private constructor() {
    // Only initialize in browser
    if (typeof window !== "undefined") {
      this.initAudioElement();
      this.initMediaSession();
      this.restoreLastTrack();
    }
  }

  static getInstance(): AudioServiceClass {
    if (!AudioServiceClass.instance) {
      AudioServiceClass.instance = new AudioServiceClass();
    }
    return AudioServiceClass.instance;
  }

  private initAudioElement(): void {
    this.audio = document.createElement("audio");
    this.audio.preload = "metadata";

    // Attach to DOM to ensure it persists (hidden)
    this.audio.style.display = "none";
    document.body.appendChild(this.audio);

    // Event listeners
    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("loadedmetadata", this.handleLoadedMetadata);
    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("error", this.handleError);
    this.audio.addEventListener("play", this.handlePlay);
    this.audio.addEventListener("pause", this.handlePause);
    this.audio.addEventListener("waiting", this.handleWaiting);
    this.audio.addEventListener("canplay", this.handleCanPlay);

    // Start position saving interval
    this.positionSaveInterval = setInterval(() => {
      if (this.state.isPlaying && this.currentTrack) {
        this.persistPosition(this.currentTrack.id);
      }
    }, POSITION_SAVE_INTERVAL);
  }

  private initMediaSession(): void {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => this.play());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      this.skip(-(details.seekOffset || 15));
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      this.skip(details.seekOffset || 30);
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        this.seek(details.seekTime);
      }
    });
  }

  private updateMediaSessionMetadata(): void {
    if (!("mediaSession" in navigator) || !this.currentTrack) return;

    const artwork = this.currentTrack.artwork
      ? [{ src: this.currentTrack.artwork, sizes: "512x512", type: "image/png" }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentTrack.title,
      artist: this.currentTrack.artist || "tsucast",
      album: "tsucast",
      artwork,
    });
  }

  private updateMediaSessionPlaybackState(): void {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.playbackState = this.state.isPlaying
      ? "playing"
      : "paused";
  }

  private updateDocumentTitle(): void {
    if (!this.currentTrack) return;

    const baseTitle = "tsucast";
    if (this.state.isPlaying) {
      document.title = `▶ ${this.currentTrack.title} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }

  // Event handlers
  private handleTimeUpdate = (): void => {
    if (!this.audio) return;
    this.state.currentTime = this.audio.currentTime;
    this.emit("timeupdate", this.state);
  };

  private handleLoadedMetadata = (): void => {
    if (!this.audio) return;
    this.state.duration = this.audio.duration;
    this.state.isLoading = false;
    this.emitStateChange();
  };

  private handleEnded = (): void => {
    this.state.isPlaying = false;
    this.updateMediaSessionPlaybackState();
    this.updateDocumentTitle();
    this.emit("ended", this.state);
    this.emitStateChange();
  };

  private handleError = (): void => {
    this.state.error = "Failed to load audio";
    this.state.isLoading = false;
    this.emit("error", this.state);
    this.emitStateChange();
  };

  private handlePlay = (): void => {
    this.state.isPlaying = true;
    this.state.error = null;
    this.updateMediaSessionPlaybackState();
    this.updateDocumentTitle();
    this.emitStateChange();
  };

  private handlePause = (): void => {
    this.state.isPlaying = false;
    this.updateMediaSessionPlaybackState();
    this.updateDocumentTitle();
    this.emitStateChange();
  };

  private handleWaiting = (): void => {
    this.state.isLoading = true;
    this.emitStateChange();
  };

  private handleCanPlay = (): void => {
    this.state.isLoading = false;
    this.emitStateChange();
  };

  // Event emitter
  on(event: AudioEventType, callback: AudioEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: AudioEventType, state: AudioState): void {
    this.listeners.get(event)?.forEach((callback) => callback(state));
  }

  private emitStateChange(): void {
    this.emit("statechange", this.state);
  }

  // Public API
  async loadTrack(url: string, metadata: TrackMetadata): Promise<void> {
    if (!this.audio) return;

    this.currentTrack = metadata;
    this.state.src = url;
    this.state.isLoading = true;
    this.state.error = null;
    this.state.currentTime = 0;
    this.state.duration = 0;

    this.audio.src = url;
    this.audio.load();

    // Restore position if available
    const savedPosition = this.getSavedPosition(metadata.id);
    if (savedPosition > 0) {
      this.audio.currentTime = savedPosition;
      this.state.currentTime = savedPosition;
    }

    this.updateMediaSessionMetadata();
    this.saveLastTrack();
    this.emit("trackchange", this.state);
    this.emitStateChange();
  }

  async play(url?: string, metadata?: TrackMetadata): Promise<void> {
    if (!this.audio) return;

    // If URL provided, load new track
    if (url && metadata) {
      await this.loadTrack(url, metadata);
    }

    try {
      await this.audio.play();
    } catch (error) {
      // Handle autoplay policy errors
      console.error("Playback failed:", error);
      this.state.error = "Playback failed. Please try again.";
      this.emitStateChange();
    }
  }

  pause(): void {
    if (!this.audio) return;
    this.audio.pause();

    // Save position on pause
    if (this.currentTrack) {
      this.persistPosition(this.currentTrack.id);
    }
  }

  togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(time: number): void {
    if (!this.audio) return;
    const newTime = Math.max(0, Math.min(this.state.duration, time));
    this.audio.currentTime = newTime;
    this.state.currentTime = newTime;
    this.emitStateChange();
  }

  skip(seconds: number): void {
    this.seek(this.state.currentTime + seconds);
  }

  setPlaybackRate(rate: number): void {
    if (!this.audio) return;
    this.audio.playbackRate = rate;
    this.state.playbackRate = rate;
    this.emitStateChange();
  }

  cyclePlaybackRate(): void {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(this.state.playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.setPlaybackRate(speeds[nextIndex]);
  }

  setMuted(muted: boolean): void {
    if (!this.audio) return;
    this.audio.muted = muted;
    this.state.isMuted = muted;
    this.emitStateChange();
  }

  toggleMute(): void {
    this.setMuted(!this.state.isMuted);
  }

  getState(): AudioState {
    return { ...this.state };
  }

  getCurrentTrack(): TrackMetadata | null {
    return this.currentTrack;
  }

  // Position persistence
  persistPosition(trackId: string): void {
    if (this.state.currentTime <= 0) return;

    try {
      localStorage.setItem(
        `${POSITION_STORAGE_PREFIX}${trackId}`,
        JSON.stringify({
          position: this.state.currentTime,
          timestamp: Date.now(),
        })
      );
    } catch {
      // localStorage unavailable
    }
  }

  getSavedPosition(trackId: string): number {
    try {
      const saved = localStorage.getItem(`${POSITION_STORAGE_PREFIX}${trackId}`);
      if (saved) {
        const { position } = JSON.parse(saved);
        return position;
      }
    } catch {
      // localStorage unavailable or invalid data
    }
    return 0;
  }

  clearSavedPosition(trackId: string): void {
    try {
      localStorage.removeItem(`${POSITION_STORAGE_PREFIX}${trackId}`);
    } catch {
      // localStorage unavailable
    }
  }

  // Last track persistence
  private saveLastTrack(): void {
    if (!this.currentTrack || !this.state.src) return;

    try {
      localStorage.setItem(
        LAST_TRACK_KEY,
        JSON.stringify({
          url: this.state.src,
          metadata: this.currentTrack,
        })
      );
    } catch {
      // localStorage unavailable
    }
  }

  private restoreLastTrack(): void {
    try {
      const saved = localStorage.getItem(LAST_TRACK_KEY);
      if (saved) {
        const { url, metadata } = JSON.parse(saved);
        // Load but don't auto-play
        this.loadTrack(url, metadata);
      }
    } catch {
      // localStorage unavailable or invalid data
    }
  }

  // Cleanup (rarely needed, but good practice)
  destroy(): void {
    if (this.positionSaveInterval) {
      clearInterval(this.positionSaveInterval);
    }

    if (this.audio) {
      this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
      this.audio.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
      this.audio.removeEventListener("ended", this.handleEnded);
      this.audio.removeEventListener("error", this.handleError);
      this.audio.removeEventListener("play", this.handlePlay);
      this.audio.removeEventListener("pause", this.handlePause);
      this.audio.removeEventListener("waiting", this.handleWaiting);
      this.audio.removeEventListener("canplay", this.handleCanPlay);

      this.audio.pause();
      this.audio.remove();
    }

    AudioServiceClass.instance = null;
  }
}

// Export singleton getter
export const AudioService = {
  getInstance: () => AudioServiceClass.getInstance(),
};

// Export type for use in other files
export type { AudioServiceClass };
