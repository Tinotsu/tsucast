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
