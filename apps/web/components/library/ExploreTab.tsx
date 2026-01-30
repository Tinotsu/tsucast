"use client";

import { useEffect, useState, useRef } from "react";
import { Headphones, Play, Pause, Loader2, Clock, ListPlus } from "lucide-react";
import { getFreeContent, type FreeContentItem } from "@/lib/api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AddToPlaylistMenu } from "@/components/library/AddToPlaylistMenu";
import { useAuth } from "@/hooks/useAuth";
import type { AudioTrack } from "@/services/audio-service";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  return `${mins} min`;
}

interface ExploreItemProps {
  item: FreeContentItem;
  onAddToPlaylist: (item: FreeContentItem) => void;
  isAuthenticated: boolean;
}

function ExploreItem({ item, onAddToPlaylist, isAuthenticated }: ExploreItemProps) {
  const { play, pause, track, isPlaying, isLoading } = useAudioPlayer();

  const isCurrentTrack = track?.id === item.id;
  const isThisPlaying = isCurrentTrack && isPlaying;
  const isThisLoading = isCurrentTrack && isLoading;

  const handleTogglePlay = async () => {
    if (!item.audio_url) return;

    if (isThisPlaying) {
      pause();
      return;
    }

    const audioTrack: AudioTrack = {
      id: item.id,
      url: item.audio_url,
      title: item.title,
      artist: "tsucast",
    };

    await play(audioTrack);
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl p-4 transition-all",
        isThisPlaying
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "bg-[var(--card)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
      )}
    >
      <div className="flex gap-4">
        {/* Play Button */}
        <button
          onClick={handleTogglePlay}
          disabled={!item.audio_url || isThisLoading}
          aria-label={isThisPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
          className={cn(
            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
            isThisPlaying
              ? "bg-[var(--background)] text-[var(--foreground)]"
              : "bg-[var(--foreground)] text-[var(--background)] group-hover:bg-[var(--background)] group-hover:text-[var(--foreground)]"
          )}
        >
          {isThisLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isThisPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "line-clamp-2 font-bold",
              isThisPlaying
                ? "text-[var(--background)]"
                : "text-[var(--foreground)] group-hover:text-[var(--background)]"
            )}
          >
            {item.title}
          </h3>
          <div
            className={cn(
              "mt-1 flex items-center gap-3 text-xs font-normal",
              isThisPlaying
                ? "opacity-70"
                : "text-[var(--muted)] group-hover:opacity-70 group-hover:text-[var(--background)]"
            )}
          >
            {item.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(item.duration_seconds)}
              </span>
            )}
            <span>Free to listen</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isAuthenticated && (
          <div className="flex flex-shrink-0 items-center">
            <button
              onClick={() => onAddToPlaylist(item)}
              aria-label={`Add ${item.title} to playlist`}
              className={cn(
                "rounded-lg p-2 transition-all opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)]",
                isThisPlaying
                  ? "text-[var(--background)]"
                  : "text-[var(--foreground)] group-hover:text-[var(--background)]"
              )}
            >
              <ListPlus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ExploreTab() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FreeContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToPlaylistItem, setAddingToPlaylistItem] = useState<FreeContentItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup success message timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getFreeContent();
        if (!cancelled) setItems(data);
      } catch (err) {
        console.error("ExploreTab load error:", err);
        if (!cancelled) {
          let errorMessage = "Failed to load free content";
          if (err instanceof Error) {
            if (err.message.includes("fetch") || err.message.includes("network")) {
              errorMessage = "Network error. Please check your connection and try again.";
            } else {
              errorMessage = err.message;
            }
          }
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--destructive)] bg-[var(--card)] p-8 text-center">
        <p className="text-[var(--destructive)]">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <Headphones className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
        <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">
          No free content available yet
        </h2>
        <p className="font-normal text-[var(--muted)]">Check back soon for curated samples!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[var(--muted)]">Curated articles to discover</p>
      </div>

      {/* Items - single column to match All tab */}
      <div className="space-y-3">
        {items.map((item) => (
          <ExploreItem
            key={item.id}
            item={item}
            onAddToPlaylist={setAddingToPlaylistItem}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Add to Playlist Menu */}
      <AddToPlaylistMenu
        audioId={addingToPlaylistItem?.id ?? ""}
        audioTitle={addingToPlaylistItem?.title}
        isOpen={addingToPlaylistItem !== null}
        onClose={() => setAddingToPlaylistItem(null)}
        onSuccess={(playlistName) => {
          setSuccessMessage(`Added to "${playlistName}"`);
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}

export default ExploreTab;
