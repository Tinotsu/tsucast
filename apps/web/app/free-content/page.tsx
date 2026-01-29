"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Play, Pause, Loader2 } from "lucide-react";
import { getFreeContent, type FreeContentItem } from "@/lib/api";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function AudioPlayer({ item }: { item: FreeContentItem }) {
  const { state, currentTrack, play, pause, togglePlay, seek } = useAudioPlayer();

  // Check if this item is currently playing
  const isThisTrack = currentTrack?.id === item.id;
  const isPlaying = isThisTrack && state.isPlaying;
  const isLoading = isThisTrack && state.isLoading;
  const currentTime = isThisTrack ? state.currentTime : 0;

  const handleTogglePlay = async () => {
    if (!item.audio_url) return;

    if (isThisTrack) {
      togglePlay();
    } else {
      // Play this track
      await play(item.audio_url, {
        id: item.id,
        title: item.title,
        artist: "tsucast",
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!item.duration_seconds || !isThisTrack) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * item.duration_seconds;
    seek(newTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!item.duration_seconds || !isThisTrack) return;

    const step = item.duration_seconds * 0.05; // 5% of duration
    if (e.key === "ArrowLeft") {
      seek(Math.max(0, currentTime - step));
    } else if (e.key === "ArrowRight") {
      seek(Math.min(item.duration_seconds, currentTime + step));
    }
  };

  const progress = item.duration_seconds
    ? (currentTime / item.duration_seconds) * 100
    : 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4">
        <button
          onClick={handleTogglePlay}
          disabled={!item.audio_url || isLoading}
          aria-label={isPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform hover:scale-105 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--foreground)] line-clamp-2">
            {item.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-[var(--muted)]">
            {item.duration_seconds && (
              <span>{formatDuration(item.duration_seconds)}</span>
            )}
            {item.word_count && (
              <span>{item.word_count.toLocaleString()} words</span>
            )}
          </div>

          {/* Progress bar - only show progress for current track */}
          <div
            className="mt-3 h-1 w-full cursor-pointer rounded-full bg-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2"
            onClick={handleSeek}
            onKeyDown={handleKeyDown}
            tabIndex={isThisTrack ? 0 : -1}
            role="slider"
            aria-label={`Seek ${item.title}`}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="pointer-events-none h-full rounded-full bg-[var(--foreground)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FreeContentPage() {
  const [items, setItems] = useState<FreeContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFreeContent();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--foreground)]">
            <Headphones className="h-8 w-8 text-[var(--background)]" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Free Samples
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
            Listen to these curated articles converted to audio. No account
            needed — just press play.
          </p>
        </div>

        {/* Content */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <Headphones className="mx-auto h-12 w-12 text-[var(--muted)]" />
              <p className="mt-4 text-[var(--muted)]">No free content available yet.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <AudioPlayer key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-[var(--foreground)] p-8 text-center">
          <h2 className="text-2xl font-bold text-[var(--background)]">
            Want to convert your own articles?
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Sign up for free and start listening to any article as a podcast.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-[var(--background)] px-6 py-3 font-semibold text-[var(--foreground)] transition-colors hover:opacity-90"
            >
              Get Started Free
            </Link>
            <Link
              href="https://tsucast.com/download"
              className="rounded-lg border border-[var(--border)] px-6 py-3 font-semibold text-[var(--background)] transition-colors hover:bg-[var(--background)]/10"
            >
              Download App
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
