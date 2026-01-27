"use client";

import { useEffect } from "react";
import { Volume2, Check } from "lucide-react";

// MVP: Single default voice only
// TODO: Add multiple voices when Kokoro voices are configured
const DEFAULT_VOICE = {
  id: "default",
  name: "Default",
  gender: "female" as const,
  accent: "American",
};

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VoiceSelector({ value, onChange, disabled }: VoiceSelectorProps) {
  // Auto-select default voice if not already selected
  // Must be in useEffect to avoid calling onChange during render
  useEffect(() => {
    if (value !== DEFAULT_VOICE.id) {
      onChange(DEFAULT_VOICE.id);
    }
  }, [value, onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium tracking-tight text-[#1a1a1a]">
        Voice
      </label>
      <div className="rounded-xl bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-white">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium tracking-tight text-[#1a1a1a]">
              {DEFAULT_VOICE.name}
            </p>
            <p className="text-xs font-normal leading-relaxed text-[#737373]">
              {DEFAULT_VOICE.gender === "female" ? "Female" : "Male"} • {DEFAULT_VOICE.accent}
            </p>
          </div>
          <Check className="h-4 w-4 text-[#1a1a1a]" />
        </div>
      </div>
      <p className="text-xs font-normal leading-relaxed text-[#737373]">
        More voices coming soon
      </p>
    </div>
  );
}
