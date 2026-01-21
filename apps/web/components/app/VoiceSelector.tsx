"use client";

import { useState } from "react";
import { Volume2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  accent: string;
  previewUrl?: string;
}

const voices: Voice[] = [
  {
    id: "alloy",
    name: "Alloy",
    gender: "female",
    accent: "American",
  },
  {
    id: "echo",
    name: "Echo",
    gender: "male",
    accent: "American",
  },
  {
    id: "fable",
    name: "Fable",
    gender: "male",
    accent: "British",
  },
  {
    id: "onyx",
    name: "Onyx",
    gender: "male",
    accent: "American",
  },
  {
    id: "nova",
    name: "Nova",
    gender: "female",
    accent: "American",
  },
];

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ value, onChange, disabled }: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const handlePreview = async (voice: Voice) => {
    if (!voice.previewUrl) return;

    setPlayingVoice(voice.id);
    const audio = new Audio(voice.previewUrl);
    audio.onended = () => setPlayingVoice(null);
    audio.play();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white">
        Select Voice
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {voices.map((voice) => {
          const isSelected = value === voice.id;
          const isPlaying = playingVoice === voice.id;

          return (
            <button
              key={voice.id}
              type="button"
              onClick={() => onChange(voice.id)}
              disabled={disabled}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-zinc-800 bg-zinc-900 hover:border-amber-500/50"
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3">
                  <Check className="h-4 w-4 text-amber-500" />
                </div>
              )}

              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isSelected
                    ? "bg-amber-500 text-black"
                    : "bg-amber-500/10 text-amber-500"
                )}
              >
                <Volume2 className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    isSelected
                      ? "text-amber-500"
                      : "text-white"
                  )}
                >
                  {voice.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {voice.gender === "female" ? "Female" : "Male"} • {voice.accent}
                </p>
              </div>

              {voice.previewUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(voice);
                  }}
                  disabled={disabled || isPlaying}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-500"
                >
                  {isPlaying ? (
                    <span className="h-4 w-4 animate-pulse">...</span>
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
