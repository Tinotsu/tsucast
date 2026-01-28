"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { getLibrary, getFreeContent, type FreeContentItem } from "@/lib/api";
import { PlusCircle, Library, Headphones, ArrowRight, Loader2, Play, Pause } from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Global ref to track currently playing audio for mutual exclusivity
let currentlyPlayingAudio: HTMLAudioElement | null = null;

function FreeSampleCard({ item }: { item: FreeContentItem }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentlyPlayingAudio === audio) {
        currentlyPlayingAudio = null;
      }
    };
    const handlePause = () => {
      if (currentlyPlayingAudio !== audio) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      if (currentlyPlayingAudio === audio) {
        currentlyPlayingAudio = null;
      }
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      currentlyPlayingAudio = null;
      setIsPlaying(false);
    } else {
      // Pause any currently playing audio first
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
      }
      audio.play().catch(() => setIsPlaying(false));
      currentlyPlayingAudio = audio;
      setIsPlaying(true);
    }
  };

  const progress = item.duration_seconds
    ? (currentTime / item.duration_seconds) * 100
    : 0;

  return (
    <div className="flex-shrink-0 w-72 max-w-full rounded-2xl border border-[#e5e5e5] bg-white p-4">
      <div className="flex items-start gap-3">
        <button
          onClick={togglePlay}
          disabled={!item.audio_url}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition-transform hover:scale-105 disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1a1a1a] text-sm line-clamp-2">
            {item.title}
          </h4>
          {item.duration_seconds && (
            <p className="mt-1 text-xs text-[#737373]">
              {formatDuration(item.duration_seconds)}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full rounded-full bg-[#e5e5e5]">
        <div
          className="h-full rounded-full bg-[#1a1a1a] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {item.audio_url && (
        <audio ref={audioRef} src={item.audio_url} preload="metadata" />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { credits, timeBank, isLoading: creditsLoading } = useCredits();
  const [libraryCount, setLibraryCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [freeContent, setFreeContent] = useState<FreeContentItem[]>([]);
  const [isLoadingFreeContent, setIsLoadingFreeContent] = useState(true);

  const loadLibraryCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const items = await getLibrary();
      setLibraryCount(items.length);
    } catch {
      // Silently fail - will show dash
      setLibraryCount(null);
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  const loadFreeContent = useCallback(async () => {
    setIsLoadingFreeContent(true);
    try {
      const items = await getFreeContent();
      // Only show first 3 items
      setFreeContent(items.slice(0, 3));
    } catch {
      // Silently fail
      setFreeContent([]);
    } finally {
      setIsLoadingFreeContent(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadLibraryCount();
    }
    // Load free content regardless of auth (it's public)
    loadFreeContent();
  }, [authLoading, isAuthenticated, loadLibraryCount, loadFreeContent]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          Ready to turn some articles into podcasts?
        </p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a]">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#737373]">
                Credits
              </p>
              <p className="text-xl font-bold text-[#1a1a1a]">
                {creditsLoading ? "..." : credits}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a]">
              <Headphones className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#737373]">
                Time Bank
              </p>
              <p className="text-xl font-bold text-[#1a1a1a]">
                {creditsLoading ? "..." : `${timeBank} min`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a]">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#737373]">
                Library Items
              </p>
              <p className="text-xl font-bold text-[#1a1a1a]">
                {isLoadingCount ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#1a1a1a]" />
                ) : libraryCount !== null ? (
                  libraryCount
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-8 sm:grid-cols-2">
        <Link
          href="/generate"
          className="group rounded-2xl border border-[#1a1a1a] bg-[#1a1a1a] p-8 text-white transition-all hover:bg-white hover:text-[#1a1a1a]"
        >
          <PlusCircle className="mb-4 h-8 w-8" />
          <h2 className="mb-2 text-xl font-bold">Generate New</h2>
          <p className="mb-4 font-normal opacity-80">
            Paste a URL and convert it to a podcast in seconds.
          </p>
          <span className="inline-flex items-center gap-2 font-bold">
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/library"
          className="group rounded-2xl border border-[#e5e5e5] bg-white p-8 transition-all hover:border-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
        >
          <Library className="mb-4 h-8 w-8 text-[#1a1a1a] group-hover:text-white" />
          <h2 className="mb-2 text-xl font-bold text-[#1a1a1a] group-hover:text-white">
            Your Library
          </h2>
          <p className="mb-4 font-normal text-[#737373] group-hover:text-white">
            Browse and play your previously generated podcasts.
          </p>
          <span className="inline-flex items-center gap-2 font-bold text-[#1a1a1a] group-hover:text-white">
            View library
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      {/* Free Samples Section */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Free Samples</h2>
            <p className="mt-1 text-sm text-[#737373]">
              Listen to curated articles converted to audio
            </p>
          </div>
          <Link
            href="/free-content"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#1a1a1a] transition-colors hover:text-[#737373]"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoadingFreeContent ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#737373]" />
          </div>
        ) : freeContent.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6 text-center">
            <Headphones className="mx-auto h-8 w-8 text-[#737373]" />
            <p className="mt-2 text-sm text-[#737373]">
              No free samples available yet.
            </p>
          </div>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
            role="list"
            aria-label="Free audio samples"
          >
            {freeContent.map((item) => (
              <FreeSampleCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Credits Banner (for users with no credits) */}
      {credits === 0 && (
        <div className="mt-12 rounded-2xl bg-white p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-[#1a1a1a]">
                Need more credits?
              </h3>
              <p className="text-sm font-normal text-[#737373]">
                Purchase a credit pack to generate more articles.
              </p>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[#1a1a1a] px-6 py-2 font-bold text-white transition-colors hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
