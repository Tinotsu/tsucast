"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, Loader2, Volume2 } from "lucide-react";

interface VoiceSample {
  voiceId: string;
  name: string;
  audioUrl: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Fallback data if API unavailable
const FALLBACK_VOICES = [
  { voiceId: "af_sarah", name: "Sarah", audioUrl: "" },
  { voiceId: "am_adam", name: "Adam", audioUrl: "" },
  { voiceId: "am_michael", name: "Michael", audioUrl: "" },
];

/**
 * VoiceTester - Interactive voice selection and playback
 *
 * Displays voice chips that users can click to select, then play a sample
 * of that voice reading a quote.
 */
export function VoiceTester() {
  const [voices, setVoices] = useState<VoiceSample[]>(FALLBACK_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>("af_sarah");
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
      {/* Voice Chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {voices.map((voice) => (
          <button
            key={voice.voiceId}
            data-testid={`voice-chip-${voice.name.toLowerCase()}`}
            data-selected={selectedVoice === voice.voiceId}
            onClick={() => handleSelectVoice(voice.voiceId)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedVoice === voice.voiceId
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--foreground)]"
            }`}
          >
            {voice.name}
          </button>
        ))}
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
