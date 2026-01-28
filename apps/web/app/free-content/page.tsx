"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Headphones, Play, Pause, Loader2 } from "lucide-react";
import { getFreeContent, type FreeContentItem } from "@/lib/api";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function AudioPlayer({ item }: { item: FreeContentItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audio.play().catch(() => {
        setIsPlaying(false);
        setIsLoading(false);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !item.duration_seconds) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * item.duration_seconds;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = item.duration_seconds
    ? (currentTime / item.duration_seconds) * 100
    : 0;

  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6 transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4">
        <button
          onClick={togglePlay}
          disabled={!item.audio_url || isLoading}
          aria-label={isPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition-transform hover:scale-105 disabled:opacity-50"
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
          <h3 className="font-semibold text-[#1a1a1a] line-clamp-2">
            {item.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-[#737373]">
            {item.duration_seconds && (
              <span>{formatDuration(item.duration_seconds)}</span>
            )}
            {item.word_count && (
              <span>{item.word_count.toLocaleString()} words</span>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="mt-3 h-1 w-full cursor-pointer rounded-full bg-[#e5e5e5]"
            onClick={handleSeek}
            role="slider"
            aria-label={`Seek ${item.title}`}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="pointer-events-none h-full rounded-full bg-[#1a1a1a] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {item.audio_url && (
        <audio ref={audioRef} src={item.audio_url} preload="metadata" />
      )}
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
    <div className="min-h-screen bg-[#fafafa]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1a1a]">
            <Headphones className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1a1a1a]">
            Free Samples
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#737373]">
            Listen to these curated articles converted to audio. No account
            needed — just press play.
          </p>
        </div>

        {/* Content */}
        <div className="mt-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#737373]" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-8 text-center">
              <Headphones className="mx-auto h-12 w-12 text-[#737373]" />
              <p className="mt-4 text-[#737373]">No free content available yet.</p>
              <p className="mt-1 text-sm text-[#999]">Check back soon!</p>
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
        <div className="mt-16 rounded-2xl bg-[#1a1a1a] p-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Want to convert your own articles?
          </h2>
          <p className="mt-2 text-[#999]">
            Sign up for free and start listening to any article as a podcast.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5]"
            >
              Get Started Free
            </Link>
            <Link
              href="https://tsucast.com/download"
              className="rounded-lg border border-[#333] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#333]"
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
