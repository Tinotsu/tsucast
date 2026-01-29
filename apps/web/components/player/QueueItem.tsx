"use client";

import { Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ARTIST = "tsucast";

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface QueueItemTrack {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
}

interface QueueItemProps {
  track: QueueItemTrack;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}

export function QueueItem({ track, index, onPlay, onRemove }: QueueItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--secondary)]"
      )}
    >
      {/* Position */}
      <span className="w-6 text-center text-sm text-[var(--muted)]">
        {index + 1}
      </span>

      {/* Track info */}
      <button
        onClick={onPlay}
        className="min-w-0 flex-1 text-left"
        aria-label={`Play ${track.title}`}
      >
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {track.title}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {track.artist || DEFAULT_ARTIST} · {formatDuration(track.duration)}
        </p>
      </button>

      {/* Play button (visible on hover) */}
      <button
        onClick={onPlay}
        className="rounded-full p-2 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        aria-label={`Play ${track.title}`}
      >
        <Play className="h-4 w-4" />
      </button>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="rounded-full p-2 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--background)] hover:text-red-500"
        aria-label={`Remove ${track.title} from queue`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default QueueItem;
