"use client";

import { useState, useEffect } from "react";
import { Play, Pause, ChevronUp, Loader2, FileAudio, Headphones } from "lucide-react";
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
    lastTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    togglePlayPause,
    playLastTrack,
    seek,
    openModal,
  } = useAudioPlayer();
  const [artworkError, setArtworkError] = useState(false);

  // The track to display (current or last played)
  const displayTrack = track || lastTrack;

  // Reset artwork error when track changes
  useEffect(() => {
    setArtworkError(false);
  }, [displayTrack?.id]);

  // Always show the player bar
  const progress = track && duration > 0 ? (currentTime / duration) * 100 : 0;
  const hasActiveTrack = !!track;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !hasActiveTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    seek(percentage * duration);
  };

  const handlePlayClick = async () => {
    if (hasActiveTrack) {
      togglePlayPause();
    } else if (lastTrack) {
      await playLastTrack();
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed left-0 right-0 z-50 h-16 border-t border-[var(--border)] bg-[var(--card)] shadow-lg transition-all",
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
          {/* Thumbnail */}
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--secondary)]">
            {displayTrack?.artwork && !artworkError ? (
              <img
                src={displayTrack.artwork}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setArtworkError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {displayTrack ? (
                  <FileAudio className="h-5 w-5 text-[var(--muted)]" />
                ) : (
                  <Headphones className="h-5 w-5 text-[var(--muted)]" />
                )}
              </div>
            )}
          </div>

          {/* Play/Pause button */}
          <button
            onClick={handlePlayClick}
            disabled={isLoading || (!hasActiveTrack && !lastTrack)}
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
            onClick={hasActiveTrack ? openModal : handlePlayClick}
            disabled={!displayTrack}
            className="flex-1 min-w-0 text-left disabled:opacity-50"
            aria-label={hasActiveTrack ? "Open full player" : "Play last track"}
          >
            {displayTrack ? (
              <>
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {displayTrack.title}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {hasActiveTrack ? (
                    `${formatTime(currentTime)} / ${formatTime(duration)}`
                  ) : (
                    "Tap to resume"
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--muted)]">
                  No audio playing
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Select a podcast to listen
                </p>
              </>
            )}
          </button>

          {/* Expand button - opens full modal (only when track is active) */}
          {hasActiveTrack && (
            <button
              onClick={openModal}
              aria-label="Expand player"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Full Player Modal */}
      <PlayerModal />
    </>
  );
}

export default GlobalMiniPlayer;
