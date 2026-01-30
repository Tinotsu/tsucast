"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Moon,
  ListMusic,
  ListPlus,
  Loader2,
  FileAudio,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { SleepTimerMenu } from "./SleepTimerMenu";
import { QueuePanel } from "./QueuePanel";
import { AddToPlaylistMenu } from "@/components/library/AddToPlaylistMenu";
import { cn } from "@/lib/utils";

const DEFAULT_ARTIST = "tsucast";
const SWIPE_THRESHOLD = 100; // pixels to trigger close

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function PlayerModal() {
  const {
    track,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    playbackRate,
    sleepTimer,
    queue,
    isModalOpen,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    setPlaybackRate,
    closeModal,
    openQueue,
  } = useAudioPlayer();

  const [mounted, setMounted] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [swipeY, setSwipeY] = useState(0);
  const touchStartY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset closing state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setIsClosing(false);
      setSwipeY(0);
    }
  }, [isModalOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeModal();
      setIsClosing(false);
    }, 200); // Match animation duration
  }, [closeModal]);

  // Touch handlers for swipe-down gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    // Only allow downward swipe
    if (deltaY > 0) {
      setSwipeY(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeY > SWIPE_THRESHOLD) {
      handleClose();
    }
    setSwipeY(0);
  }, [swipeY, handleClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  if (!mounted || !isModalOpen || !track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    seek(percentage * duration);
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const cycleSpeed = () => {
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackRate(speeds[nextIndex]);
  };

  const modalContent = (
    <div
      ref={modalRef}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-[var(--background)] transition-transform duration-200 ease-out",
        isClosing ? "translate-y-full" : "translate-y-0",
        !isClosing && "animate-slide-up"
      )}
      style={{ transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4">
        <div className="w-10" /> {/* Spacer for centering */}
        <span className="text-sm font-medium text-[var(--muted)]">
          Now Playing
        </span>
        <button
          onClick={handleClose}
          aria-label="Close player"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Artwork */}
        <div className="mb-8 flex h-64 w-64 items-center justify-center rounded-2xl bg-[var(--secondary)]">
          <FileAudio className="h-24 w-24 text-[var(--muted)]" />
        </div>

        {/* Title and source */}
        <div className="mb-8 text-center">
          <h2
            id="player-modal-title"
            className="mb-2 text-xl font-bold text-[var(--foreground)]"
          >
            {track.title}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {track.artist || DEFAULT_ARTIST}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 w-full max-w-md">
          <div
            className="h-2 cursor-pointer rounded-full bg-[var(--secondary)]"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Playback progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--foreground)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport controls */}
        <div className="mb-8 flex items-center gap-6">
          <button
            onClick={() => skipBackward(15)}
            aria-label="Skip back 15 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            <SkipBack className="h-8 w-8" />
            <span className="absolute mt-8 text-[10px] font-medium">15</span>
          </button>

          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </button>

          <button
            onClick={() => skipForward(15)}
            aria-label="Skip forward 15 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            <SkipForward className="h-8 w-8" />
            <span className="absolute mt-8 text-[10px] font-medium">15</span>
          </button>
        </div>

        {/* Extra controls */}
        <div className="flex items-center gap-4">
          {/* Speed */}
          <button
            onClick={cycleSpeed}
            aria-label={`Playback speed ${playbackRate}x`}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              playbackRate !== 1
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            )}
          >
            {playbackRate}x
          </button>

          {/* Add to Playlist */}
          <button
            onClick={() => setShowPlaylistMenu(true)}
            aria-label="Add to playlist"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ListPlus className="h-4 w-4" />
          </button>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => setShowSleepMenu(!showSleepMenu)}
              aria-label="Sleep timer"
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                sleepTimer.isActive
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <Moon className="h-4 w-4" />
              {sleepTimer.isActive && !sleepTimer.endOfTrack && (
                <span>{formatTime(sleepTimer.remainingSeconds)}</span>
              )}
              {sleepTimer.isActive && sleepTimer.endOfTrack && (
                <span>End</span>
              )}
            </button>
            {showSleepMenu && (
              <SleepTimerMenu onClose={() => setShowSleepMenu(false)} />
            )}
          </div>

          {/* Queue */}
          <button
            onClick={openQueue}
            aria-label="View queue"
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              queue.length > 0
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            )}
          >
            <ListMusic className="h-4 w-4" />
            {queue.length > 0 && (
              <span className="text-xs">{queue.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Queue Panel */}
      <QueuePanel />

      {/* Add to Playlist Menu */}
      <AddToPlaylistMenu
        audioId={track?.id || ""}
        audioTitle={track?.title}
        isOpen={showPlaylistMenu}
        onClose={() => setShowPlaylistMenu(false)}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default PlayerModal;
