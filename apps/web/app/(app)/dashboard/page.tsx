"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { getLibrary } from "@/lib/api";
import { PlusCircle, Library, Headphones, ArrowRight, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { credits, timeBank, isLoading: creditsLoading } = useCredits();
  const [libraryCount, setLibraryCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

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

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadLibraryCount();
    }
  }, [authLoading, isAuthenticated, loadLibraryCount]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-white">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-2 text-zinc-400">
          Ready to turn some articles into podcasts?
        </p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <PlusCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">
                Credits
              </p>
              <p className="text-xl font-bold text-white">
                {creditsLoading ? "..." : credits}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Headphones className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">
                Time Bank
              </p>
              <p className="text-xl font-bold text-white">
                {creditsLoading ? "..." : `${timeBank} min`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Library className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">
                Library Items
              </p>
              <p className="text-xl font-bold text-white">
                {isLoadingCount ? (
                  <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
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
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/generate"
          className="group rounded-2xl border border-zinc-800 bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-black transition-all hover:shadow-lg"
        >
          <PlusCircle className="mb-4 h-8 w-8" />
          <h2 className="mb-2 text-xl font-bold">Generate New</h2>
          <p className="mb-4 text-black/70">
            Paste a URL and convert it to a podcast in seconds.
          </p>
          <span className="inline-flex items-center gap-2 font-medium">
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          href="/library"
          className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-8 transition-all hover:shadow-lg"
        >
          <Library className="mb-4 h-8 w-8 text-amber-500" />
          <h2 className="mb-2 text-xl font-bold text-white">
            Your Library
          </h2>
          <p className="mb-4 text-zinc-400">
            Browse and play your previously generated podcasts.
          </p>
          <span className="inline-flex items-center gap-2 font-medium text-amber-500">
            View library
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      {/* Credits Banner (for users with no credits) */}
      {credits === 0 && (
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-white">
                Need more credits?
              </h3>
              <p className="text-sm text-zinc-400">
                Purchase a credit pack to generate more articles.
              </p>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-amber-500 px-6 py-2 font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
