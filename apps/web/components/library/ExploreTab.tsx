"use client";

import { useEffect, useState } from "react";
import { Headphones, Play, Pause, Loader2 } from "lucide-react";
import { getFreeContent, type FreeContentItem } from "@/lib/api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import type { AudioTrack } from "@/services/audio-service";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function ExploreItem({ item }: { item: FreeContentItem }) {
  const { play, pause, track, isPlaying, isLoading } = useAudioPlayer();

  const isCurrentTrack = track?.id === item.id;
  const isThisPlaying = isCurrentTrack && isPlaying;
  const isThisLoading = isCurrentTrack && isLoading;

  const handleTogglePlay = async () => {
    if (!item.audio_url) return;

    // If this track is playing, pause it
    if (isThisPlaying) {
      pause();
      return;
    }

    // Otherwise play this track
    const audioTrack: AudioTrack = {
      id: item.id,
      url: item.audio_url,
      title: item.title,
      artist: "tsucast",
    };

    await play(audioTrack);
  };

  return (
    <div className="rounded-xl bg-[var(--card)] p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <button
          onClick={handleTogglePlay}
          disabled={!item.audio_url || isThisLoading}
          aria-label={isThisPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition-transform hover:scale-105 disabled:opacity-50"
        >
          {isThisLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isThisPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--foreground)] line-clamp-2">{item.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted)]">
            {item.duration_seconds && (
              <span>{formatDuration(item.duration_seconds)} • Free to listen</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExploreTab() {
  const [items, setItems] = useState<FreeContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getFreeContent();
        if (!cancelled) setItems(data);
      } catch (err) {
        console.error("ExploreTab load error:", err);
        if (!cancelled) {
          // Provide more context based on error type
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
        <p className="text-[var(--muted)]">
          Curated articles to discover
        </p>
      </div>

      {/* Items */}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <ExploreItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default ExploreTab;
