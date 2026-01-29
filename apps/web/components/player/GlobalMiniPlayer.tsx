"use client";

import { Play, Pause, X, ChevronUp, Loader2 } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { PlayerModal } from "./PlayerModal";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalMiniPlayer() {
  const {
    track,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlayPause,
    seek,
    stop,
    openModal,
  } = useAudioPlayer();

  // Don't render if no track
  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    seek(percentage * duration);
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 right-0 z-50 h-16 border-t border-[var(--border)] bg-[var(--card)] shadow-lg transition-all",
          // Position above BottomNav on mobile, at bottom on desktop
          "bottom-16 lg:bottom-0 lg:left-60"
        )}
      >
        {/* Progress bar (clickable) */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-pointer bg-[var(--border)]"
          onClick={handleProgressClick}
          role="slider"
          aria-label="Playback progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-[var(--foreground)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Compact view */}
        <div className="flex h-16 items-center gap-3 px-4">
          {/* Play/Pause button */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-colors hover:opacity-80 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>

          {/* Track info - clickable to open modal */}
          <button
            onClick={openModal}
            className="flex-1 min-w-0 text-left"
            aria-label="Open full player"
          >
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {track.title}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </button>

          {/* Expand button - opens full modal */}
          <button
            onClick={openModal}
            aria-label="Expand player"
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <ChevronUp className="h-5 w-5" />
          </button>

          {/* Close button */}
          <button
            onClick={stop}
            aria-label="Close player"
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Full Player Modal */}
      <PlayerModal />
    </>
  );
}

export default GlobalMiniPlayer;
