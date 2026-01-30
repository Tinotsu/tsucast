"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSample {
  voiceId: string;
  name: string;
  audioUrl: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Fallback data if API unavailable
const FALLBACK_VOICES = [
  { voiceId: "af_alloy", name: "Alloy", audioUrl: "https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_alloy.mp3" },
  { voiceId: "af_sarah", name: "Sarah", audioUrl: "https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_sarah.mp3" },
  { voiceId: "am_adam", name: "Adam", audioUrl: "https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_adam.mp3" },
];

/**
 * VoiceTester - Interactive voice selection and playback
 *
 * Displays voice chips that users can click to select, then play a sample
 * of that voice reading a quote.
 */
export function VoiceTester() {
  const [voices, setVoices] = useState<VoiceSample[]>(FALLBACK_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>("af_alloy");
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch voice samples
  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch(`${API_URL}/api/voices/samples`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
          setSelectedVoice(data.voices[0].voiceId);
        }
      } catch (err) {
        console.error("Failed to fetch voice samples:", err);
        // Keep fallback voices
      } finally {
        setIsLoadingVoices(false);
      }
    }
    fetchVoices();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSelectVoice = useCallback((voiceId: string) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setSelectedVoice(voiceId);
  }, []);

  const handlePlaySample = useCallback(async () => {
    const voice = voices.find((v) => v.voiceId === selectedVoice);
    if (!voice?.audioUrl) {
      console.log("No audio URL available for voice:", selectedVoice);
      return;
    }

    // If playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio and play
    setIsLoading(true);
    const audio = new Audio(voice.audioUrl);
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    try {
      await audio.play();
    } catch (err) {
      console.error("Playback failed:", err);
      setIsLoading(false);
    }
  }, [voices, selectedVoice, isPlaying]);

  const selectedVoiceData = voices.find((v) => v.voiceId === selectedVoice);
  const hasAudio = selectedVoiceData?.audioUrl;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      {/* Voice Chips - horizontal scroll with gradient fade */}
      <div className="relative mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {isLoadingVoices ? (
            // Loading skeleton
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-[var(--muted)]"
                />
              ))}
            </>
          ) : (
            voices.map((voice) => (
              <button
                key={voice.voiceId}
                data-testid={`voice-chip-${voice.name.toLowerCase()}`}
                data-selected={selectedVoice === voice.voiceId}
                onClick={() => handleSelectVoice(voice.voiceId)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  selectedVoice === voice.voiceId
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--foreground)]"
                )}
              >
                {voice.name}
              </button>
            ))
          )}
        </div>
        {/* Right fade indicator for scroll */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[var(--card)] to-transparent" />
      </div>

      {/* Sample quote */}
      <p className="mb-4 text-sm italic text-[var(--muted)]">
        &ldquo;The best way to predict the future is to invent it.&rdquo;
      </p>

      {/* Play button */}
      <button
        data-testid="voice-sample-play"
        onClick={handlePlaySample}
        disabled={isLoading || !hasAudio}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] py-3 font-medium text-[var(--background)] transition-all hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <>
            <Pause className="h-5 w-5" />
            <span data-testid="voice-sample-playing">Playing...</span>
          </>
        ) : hasAudio ? (
          <>
            <Play className="h-5 w-5" />
            Play Sample
          </>
        ) : (
          <>
            <Volume2 className="h-5 w-5" />
            Sample Coming Soon
          </>
        )}
      </button>
    </div>
  );
}
