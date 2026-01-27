"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { UrlInput } from "@/components/app/UrlInput";
import { VoiceSelector } from "@/components/app/VoiceSelector";
import { WebPlayer } from "@/components/app/WebPlayer";
import { generateAudio, previewCreditCost, ApiError, type CreditPreview } from "@/lib/api";
import { isValidUrl } from "@/lib/utils";
import { Loader2, AlertCircle, RotateCcw, Ticket, Zap } from "lucide-react";
import Link from "next/link";

interface GenerationResult {
  audioId: string;
  audioUrl: string;
  title: string;
  duration: number;
}

export default function GeneratePage() {
  const { isLoading, isAuthenticated } = useAuth();
  const { credits, timeBank, invalidateCredits, isLoading: creditsLoading } = useCredits();
  const router = useRouter();

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/generate");
    }
  }, [isLoading, isAuthenticated, router]);

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

    // Debounce the preview request
    const timer = setTimeout(loadPreview, 500);
    return () => clearTimeout(timer);
  }, [url, voiceId]);

  // useCallback MUST be before any conditional returns (React hooks rule)
  const handleCacheHit = useCallback((audioId: string, audioUrl: string, title?: string) => {
    setCachedResult({ audioId, audioUrl, title });
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  const hasCredits = credits > 0;

  // Determine if user can generate based on credit balance
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
      // Refresh credit balance after generation
      invalidateCredits();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "UNAUTHORIZED" || err.status === 401) {
          router.push("/login?redirect=/generate");
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

  // Determine button text
  const getButtonText = () => {
    if (isGenerating) return null; // Will show spinner
    if (preview?.isCached) return "Play Now (Free)";
    if (preview?.creditsNeeded === 0) return "Generate (Time Bank)";
    if (preview?.creditsNeeded) return `Generate (${preview.creditsNeeded} credit${preview.creditsNeeded > 1 ? "s" : ""})`;
    return "Generate Podcast";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Generate Podcast
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          Paste any article URL and convert it to audio
        </p>
      </div>

      {/* Credit Balance Banner */}
      <div className="mb-8 rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-[#737373]" />
              <div>
                <span className="text-sm font-bold text-[#1a1a1a]">
                  {creditsLoading ? "..." : `${credits} credits`}
                </span>
                {timeBank > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#737373]">
                    +{timeBank} min banked
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/upgrade"
              className="text-sm font-medium text-[#1a1a1a] underline hover:no-underline"
            >
              {credits === 0 ? "Buy Credits" : "Get More"}
            </Link>
          </div>
      </div>

      {/* No Credits Message */}
      {credits === 0 && (
        <div className="mb-8 rounded-xl border border-red-500 bg-white p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <h3 className="mb-2 font-bold text-red-400">
            No Credits Available
          </h3>
          <p className="mb-4 text-sm font-normal text-red-300">
            You need credits to generate podcasts. Purchase a credit pack to continue.
          </p>
          <Link
            href="/upgrade"
            className="inline-block rounded-lg bg-[#1a1a1a] px-6 py-2 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
          >
            Buy Credits
          </Link>
        </div>
      )}

      {/* Show player if we have a result */}
      {result && (
        <div className="mb-8">
          <WebPlayer
            audioUrl={result.audioUrl}
            title={result.title}
          />
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => {
                setResult(null);
                setUrl("");
                setPreview(null);
              }}
              className="rounded-lg border border-[#1a1a1a] px-6 py-2 font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
            >
              Generate Another
            </button>
            <Link
              href={`/library?highlight=${result.audioId}`}
              className="rounded-lg bg-[#1a1a1a] px-6 py-2 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
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
            <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
              {isLoadingPreview ? (
                <div className="flex items-center gap-2 text-sm font-normal text-[#737373]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing article...
                </div>
              ) : preview ? (
                <div className="space-y-3">
                  {preview.isCached ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-bold">Already generated - Play for free!</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#737373]">Estimated length</span>
                        <span className="font-normal text-[#1a1a1a]">~{preview.estimatedMinutes} min</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[#737373]">Credits needed</span>
                        <span className="font-normal text-[#1a1a1a]">
                          {preview.creditsNeeded === 0 ? (
                            <span className="text-green-400">Free (time bank)</span>
                          ) : (
                            `${preview.creditsNeeded} credit${preview.creditsNeeded > 1 ? "s" : ""}`
                          )}
                        </span>
                      </div>
                      {!preview.hasSufficientCredits && (
                        <div className="mt-2 rounded-lg border border-red-500 bg-white p-2 text-center text-sm text-red-400">
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
                <div className="text-sm font-normal text-[#737373]">
                  Enter a valid URL to see credit cost
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500 bg-white p-4">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="mt-3 flex items-center gap-2 rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {cachedResult ? (
            <button
              onClick={handlePlayCached}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-bold text-white transition-colors hover:bg-green-500"
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
                  ? "bg-green-600 text-white hover:bg-green-500"
                  : "bg-[#1a1a1a] text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
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
  );
}
