"use client";

import { X, Music } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { QueueItem } from "./QueueItem";

const DEFAULT_ARTIST = "tsucast";

export function QueuePanel() {
  const {
    track: currentTrack,
    queue,
    isQueueOpen,
    closeQueue,
    removeFromQueue,
    clearQueue,
    play,
  } = useAudioPlayer();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/50 backdrop-blur-sm lg:items-center">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-[var(--card)] shadow-xl lg:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2
            id="queue-title"
            className="text-lg font-semibold text-[var(--foreground)]"
          >
            Queue
          </h2>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-[var(--secondary)]"
                aria-label="Clear queue"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeQueue}
              className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              aria-label="Close queue"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Now Playing */}
        {currentTrack && (
          <div className="border-b border-[var(--border)] p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
              Now Playing
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <Music className="h-6 w-6 text-[var(--muted)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {currentTrack.artist || DEFAULT_ARTIST}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Up Next */}
        <div className="max-h-80 overflow-y-auto p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            Up Next ({queue.length})
          </p>

          {queue.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                Your queue is empty
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Add items from your library
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, index) => (
                <QueueItem
                  key={item.id}
                  track={item}
                  index={index}
                  onPlay={() => play(item)}
                  onRemove={() => removeFromQueue(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueuePanel;
