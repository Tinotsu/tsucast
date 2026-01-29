"use client";

import { Play, Pause, X, Loader2 } from "lucide-react";
import { useAudioPlayerOptional } from "@/providers/AudioPlayerProvider";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface GlobalMiniPlayerProps {
  className?: string;
}

export function GlobalMiniPlayer({ className }: GlobalMiniPlayerProps) {
  const audioPlayer = useAudioPlayerOptional();
  const pathname = usePathname();
  const router = useRouter();

  // Don't render if no audio context or no track loaded
  if (!audioPlayer || !audioPlayer.currentTrack || !audioPlayer.state.src) {
    return null;
  }

  const { state, currentTrack, togglePlay, pause } = audioPlayer;

  // Don't show mini player on landing page
  if (pathname === "/") {
    return null;
  }

  // Don't show if currently on player page (if we had one)
  // For now, always show on authenticated routes

  const progress =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    pause();
    // Optionally clear the track - for now just pause
  };

  const handleClick = () => {
    // Navigate to library item if we have an ID
    if (currentTrack.id) {
      router.push(`/library?item=${currentTrack.id}`);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg",
        "safe-area-bottom",
        className
      )}
    >
      {/* Progress bar at top */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-full bg-[#1a1a1a] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          disabled={state.isLoading}
          aria-label={state.isPlaying ? "Pause" : "Play"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-[#1a1a1a] text-white transition-colors",
            "hover:bg-gray-800 disabled:opacity-50"
          )}
        >
          {state.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : state.isPlaying ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" aria-hidden="true" />
          )}
        </button>

        {/* Track info - clickable */}
        <button
          onClick={handleClick}
          className="flex min-w-0 flex-1 flex-col text-left"
        >
          <span className="truncate text-sm font-medium text-[#1a1a1a]">
            {currentTrack.title}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close player"
          className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
