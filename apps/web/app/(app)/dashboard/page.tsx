"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { getLibrary, generateAudio, previewCreditCost, ApiError, type CreditPreview } from "@/lib/api";
import { UrlInput } from "@/components/app/UrlInput";
import { VoiceSelector } from "@/components/app/VoiceSelector";
import { WebPlayer } from "@/components/app/WebPlayer";
import { isValidUrl } from "@/lib/utils";
import { PlusCircle, Headphones, Library, Loader2, AlertCircle, RotateCcw, Ticket, Zap } from "lucide-react";

interface GenerationResult {
  audioId: string;
  audioUrl: string;
  title: string;
  duration: number;
}

export default function DashboardPage() {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { credits, timeBank, invalidateCredits, isLoading: creditsLoading } = useCredits();
  const router = useRouter();

  const [libraryCount, setLibraryCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  // Generation state
  const [url, setUrl] = useState("");
  const [voiceId, setVoiceId] = useState("default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [cachedResult, setCachedResult] = useState<{
    audioId: string;
    audioUrl: string;
    title?: string;
  } | null>(null);

  // Credit preview state
  const [preview, setPreview] = useState<CreditPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const loadLibraryCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const items = await getLibrary();
      setLibraryCount(items.length);
    } catch {
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

  // Load credit preview when URL changes
  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setPreview(null);
      return;
    }

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const p = await previewCreditCost(url, voiceId);
        setPreview(p);
      } catch (err) {
        console.error("Failed to load preview:", err);
        setPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    const timer = setTimeout(loadPreview, 500);
    return () => clearTimeout(timer);
  }, [url, voiceId]);

  const handleCacheHit = useCallback((audioId: string, audioUrl: string, title?: string) => {
    setCachedResult({ audioId, audioUrl, title });
  }, []);

  const hasCredits = credits > 0;
  const canAfford = preview
    ? preview.isCached || preview.hasSufficientCredits
    : hasCredits;

  const handleGenerate = async () => {
    if (!url || isGenerating || !canAfford) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setCachedResult(null);

    try {
      const response = await generateAudio({ url, voiceId });
      setResult({
        audioId: response.audioId,
        audioUrl: response.audioUrl,
        title: response.title,
        duration: response.duration,
      });
      invalidateCredits();
      loadLibraryCount();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "UNAUTHORIZED" || err.status === 401) {
          router.push("/login?redirect=/dashboard");
          return;
        } else if (err.code === "INSUFFICIENT_CREDITS") {
          setError("Insufficient credits. Purchase a credit pack to continue.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = url && isValidUrl(url) && !isGenerating && canAfford;

  const handlePlayCached = () => {
    if (!cachedResult) return;
    setResult({
      audioId: cachedResult.audioId,
      audioUrl: cachedResult.audioUrl,
      title: cachedResult.title || "Cached Audio",
      duration: 0,
    });
  };

  const getButtonText = () => {
    if (isGenerating) return null;
    if (preview?.isCached) return "Play Now (Free)";
    if (preview?.creditsNeeded === 0) return "Generate (Time Bank)";
    if (preview?.creditsNeeded) return `Generate (${preview.creditsNeeded} credit${preview.creditsNeeded > 1 ? "s" : ""})`;
    return "Generate Podcast";
  };

  const resetForm = () => {
    setResult(null);
    setUrl("");
    setPreview(null);
    setCachedResult(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[var(--muted)]">
          Ready to turn some articles into podcasts?
        </p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]">
              <PlusCircle className="h-5 w-5 text-[var(--background)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Credits</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {creditsLoading ? "..." : credits}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]">
              <Headphones className="h-5 w-5 text-[var(--background)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Time Bank</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {creditsLoading ? "..." : `${timeBank} min`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--foreground)]">
              <Library className="h-5 w-5 text-[var(--background)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Library Items</p>
              <p className="text-xl font-bold text-[var(--foreground)]">
                {isLoadingCount ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--foreground)]" />
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

      {/* Generation Section */}
      <div className="rounded-2xl bg-[var(--card)] p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-bold text-[var(--foreground)]">
          Generate Podcast
        </h2>

        {/* No Credits Message */}
        {credits === 0 && !result && (
          <div className="mb-6 rounded-xl border border-[var(--destructive)] bg-[var(--card)] p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--destructive)]" />
            <h3 className="mb-2 font-bold text-[var(--destructive)]">
              No Credits Available
            </h3>
            <p className="mb-4 text-sm font-normal text-[var(--muted)]">
              You need credits to generate podcasts. Purchase a credit pack to continue.
            </p>
            <Link
              href="/upgrade"
              className="inline-block rounded-lg bg-[var(--foreground)] px-6 py-2 font-bold text-[var(--background)] hover:opacity-80"
            >
              Buy Credits
            </Link>
          </div>
        )}

        {/* Show player if we have a result */}
        {result && (
          <div className="mb-6">
            <WebPlayer audioUrl={result.audioUrl} title={result.title} />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={resetForm}
                className="rounded-lg border border-[var(--border)] px-6 py-2 font-bold text-[var(--foreground)] hover:bg-[var(--secondary)]"
              >
                Generate Another
              </button>
              <Link
                href={`/library?highlight=${result.audioId}`}
                className="rounded-lg bg-[var(--foreground)] px-6 py-2 text-center font-bold text-[var(--background)] hover:opacity-80"
              >
                View in Library
              </Link>
            </div>
          </div>
        )}

        {/* Generation Form */}
        {!result && (
          <div className="space-y-6">
            <UrlInput
              value={url}
              onChange={setUrl}
              onCacheHit={handleCacheHit}
              disabled={isGenerating}
            />

            <VoiceSelector
              value={voiceId}
              onChange={setVoiceId}
              disabled={isGenerating}
            />

            {/* Credit Preview */}
            {url && isValidUrl(url) && !cachedResult && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                {isLoadingPreview ? (
                  <div className="flex items-center gap-2 text-sm font-normal text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing article...
                  </div>
                ) : preview ? (
                  <div className="space-y-3">
                    {preview.isCached ? (
                      <div className="flex items-center gap-2 text-[var(--success)]">
                        <Zap className="h-4 w-4" />
                        <span className="text-sm font-bold">Already generated - Play for free!</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--muted)]">Estimated length</span>
                          <span className="font-normal text-[var(--foreground)]">~{preview.estimatedMinutes} min</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--muted)]">Credits needed</span>
                          <span className="font-normal text-[var(--foreground)]">
                            {preview.creditsNeeded === 0 ? (
                              <span className="text-[var(--success)]">Free (time bank)</span>
                            ) : (
                              `${preview.creditsNeeded} credit${preview.creditsNeeded > 1 ? "s" : ""}`
                            )}
                          </span>
                        </div>
                        {!preview.hasSufficientCredits && (
                          <div className="mt-2 rounded-lg border border-[var(--destructive)] p-2 text-center text-sm text-[var(--destructive)]">
                            Not enough credits.{" "}
                            <Link href="/upgrade" className="font-bold underline">
                              Buy more
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-normal text-[var(--muted)]">
                    Enter a valid URL to see credit cost
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-[var(--destructive)] bg-[var(--card)] p-4">
                <p className="text-sm text-[var(--destructive)]">{error}</p>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--destructive)] px-4 py-2 text-sm font-bold text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            )}

            {cachedResult ? (
              <button
                onClick={handlePlayCached}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--success)] py-4 font-bold text-white transition-colors hover:opacity-90"
              >
                <Zap className="h-5 w-5" />
                Play Cached Audio (Free)
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  preview?.isCached
                    ? "bg-[var(--success)] text-white hover:opacity-90"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-80"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  getButtonText()
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Credits Banner (for users with no credits) */}
      {credits === 0 && result && (
        <div className="mt-8 rounded-2xl bg-[var(--card)] p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-[var(--foreground)]">Need more credits?</h3>
              <p className="text-sm font-normal text-[var(--muted)]">
                Purchase a credit pack to generate more articles.
              </p>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[var(--foreground)] px-6 py-2 font-bold text-[var(--background)] hover:opacity-80"
            >
              Buy Credits
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
