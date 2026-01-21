"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UrlInput } from "@/components/app/UrlInput";
import { VoiceSelector } from "@/components/app/VoiceSelector";
import { WebPlayer } from "@/components/app/WebPlayer";
import { generateAudio, ApiError } from "@/lib/api";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

interface GenerationResult {
  audioId: string;
  audioUrl: string;
  title: string;
  duration: number;
}

export default function GeneratePage() {
  const { profile, isPro, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [voiceId, setVoiceId] = useState("alloy");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [cachedResult, setCachedResult] = useState<{
    audioId: string;
    audioUrl: string;
  } | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/generate");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  const remainingGenerations = isPro
    ? null
    : 3 - (profile?.daily_generations || 0);
  const isAtLimit = !isPro && remainingGenerations !== null && remainingGenerations <= 0;

  const handleCacheHit = useCallback((audioId: string, audioUrl: string) => {
    setCachedResult({ audioId, audioUrl });
  }, []);

  const handleGenerate = async () => {
    if (!url || isGenerating || isAtLimit) return;

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
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "RATE_LIMITED") {
          setError("You've reached your daily limit. Upgrade to Pro for unlimited generations.");
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

  const isValidUrl = (testUrl: string) => {
    try {
      const parsed = new URL(testUrl);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const canGenerate = url && isValidUrl(url) && !isGenerating && !isAtLimit;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">
          Generate Podcast
        </h1>
        <p className="mt-2 text-zinc-400">
          Paste any article URL and convert it to audio
        </p>
      </div>

      {/* Limit Banner */}
      {!isPro && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-white">
                {remainingGenerations} of 3 generations left today
              </span>
            </div>
            <Link
              href="/upgrade"
              className="text-sm font-medium text-amber-500 hover:underline"
            >
              Upgrade
            </Link>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{
                width: `${((profile?.daily_generations || 0) / 3) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* At Limit Message */}
      {isAtLimit && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <h3 className="mb-2 font-semibold text-red-400">
            Daily Limit Reached
          </h3>
          <p className="mb-4 text-sm text-red-300">
            You&apos;ve used all your free generations today. Upgrade to Pro for
            unlimited access.
          </p>
          <Link
            href="/upgrade"
            className="inline-block rounded-lg bg-amber-500 px-6 py-2 font-semibold text-black hover:bg-amber-400"
          >
            Upgrade to Pro
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
              }}
              className="rounded-lg border border-zinc-800 px-6 py-2 font-medium text-zinc-400 hover:bg-zinc-800"
            >
              Generate Another
            </button>
            <Link
              href="/library"
              className="rounded-lg bg-amber-500 px-6 py-2 font-medium text-black hover:bg-amber-400"
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

          {error && (
            <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : cachedResult ? (
              "Play Cached Audio"
            ) : (
              "Generate Podcast"
            )}
          </button>

          {cachedResult && (
            <p className="text-center text-sm text-green-400">
              This article is already in our cache. Click to play instantly!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
