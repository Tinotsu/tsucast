"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause } from "lucide-react";

interface FeaturedContent {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  source_url?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * HeroAudioPlayer - Compact audio player for featured content in hero section
 */
export function HeroAudioPlayer() {
  const [content, setContent] = useState<FeaturedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch featured content
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchFeatured() {
      try {
        const res = await fetch(`${API_URL}/api/free-content/featured`, {
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!abortController.signal.aborted) {
          setContent(data.item || null);
        }
      } catch {
        if (!abortController.signal.aborted) {
          setError("Failed to load featured content");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }
    fetchFeatured();

    return () => abortController.abort();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!content?.audio_url) return;

    const audio = new Audio(content.audio_url);
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => setAudioError(true);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [content?.audio_url]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || duration === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = Math.max(0, Math.min(duration, newTime));
    },
    [duration]
  );

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Loading state
  if (isLoading) {
    return (
      <div
        data-testid="hero-audio-player"
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[var(--border)] animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-[var(--border)] animate-pulse" />
            <div className="h-1.5 w-full rounded bg-[var(--border)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error or no content fallback
  if (error || !content || audioError) {
    return (
      <div
        data-testid="hero-audio-fallback"
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      >
        <p className="text-center text-sm text-[var(--muted)]">
          {error || audioError ? "Audio unavailable" : "Try it yourself - paste any article URL!"}
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="hero-audio-player"
      className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          data-testid={isPlaying ? "hero-audio-pause" : "hero-audio-play"}
          onClick={togglePlay}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform hover:scale-105"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>

        {/* Content info and progress */}
        <div className="flex-1 min-w-0">
          <p
            data-testid="hero-audio-title"
            className="truncate text-sm font-medium text-[var(--foreground)]"
          >
            {content.title}
          </p>

          {/* Progress bar */}
          <div
            data-testid="hero-audio-progress"
            onClick={handleProgressClick}
            className="mt-1.5 cursor-pointer rounded-full bg-[var(--border)] h-1.5 overflow-hidden"
            role="progressbar"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            <div
              className="h-full bg-[var(--foreground)] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Time display */}
          <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || content.duration_seconds)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
