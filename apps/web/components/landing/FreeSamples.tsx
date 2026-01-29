"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Loader2 } from "lucide-react";

interface FreeContent {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  source_url?: string;
  featured?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * FreeSamples - Displays non-featured free content for visitors to try
 */
export function FreeSamples() {
  const [samples, setSamples] = useState<FreeContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch free content
  useEffect(() => {
    async function fetchSamples() {
      try {
        const res = await fetch(`${API_URL}/api/free-content`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // Filter out featured content, limit to 3
        const nonFeatured = (data.items || [])
          .filter((c: FreeContent) => !c.featured)
          .slice(0, 3);
        setSamples(nonFeatured);
      } catch {
        setError("Failed to load samples");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSamples();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlay = useCallback(
    async (sample: FreeContent) => {
      // If same track playing, pause it
      if (playingId === sample.id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio and play
      setLoadingId(sample.id);
      const audio = new Audio(sample.audio_url);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlayingId(sample.id);
        setLoadingId(null);
      };
      audio.onpause = () => {
        if (playingId === sample.id) {
          setPlayingId(null);
        }
      };
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setLoadingId(null);
        setPlayingId(null);
      };

      try {
        await audio.play();
      } catch {
        setLoadingId(null);
      }
    },
    [playingId]
  );

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // Don't render if no samples
  if (isLoading) {
    return (
      <section
        data-testid="free-samples-section"
        className="bg-[var(--background)] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
          </div>
        </div>
      </section>
    );
  }

  if (error || samples.length === 0) {
    return null; // Don't show section if no samples
  }

  return (
    <section
      data-testid="free-samples-section"
      className="bg-[var(--background)] py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Try These Free
        </h2>

        {/* Sample Cards - horizontal scroll on mobile */}
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {samples.map((sample, index) => {
            const isPlaying = playingId === sample.id;
            const isLoadingSample = loadingId === sample.id;

            return (
              <div
                key={sample.id}
                data-testid="free-sample-card"
                className="group min-w-[280px] flex-shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--foreground)] sm:min-w-0"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Title */}
                <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[var(--foreground)]">
                  {sample.title}
                </h3>

                {/* Duration */}
                <p className="mb-4 text-sm text-[var(--muted)]">
                  {formatDuration(sample.duration_seconds)}
                </p>

                {/* Play Button */}
                <button
                  data-testid={isPlaying ? "free-sample-pause" : "free-sample-play"}
                  onClick={() => handlePlay(sample)}
                  disabled={isLoadingSample}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] py-3 font-medium text-[var(--background)] transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {isLoadingSample ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <>
                      <Pause className="h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Play
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
