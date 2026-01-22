"use client";

import { useEffect } from "react";
import { Volume2, Check } from "lucide-react";

// MVP: Single default voice only
// TODO: Add multiple voices when Fish Audio voice IDs are configured
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
      <label className="block text-sm font-medium text-white">
        Voice
      </label>
      <div className="rounded-xl border border-amber-500 bg-amber-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-black">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-500">
              {DEFAULT_VOICE.name}
            </p>
            <p className="text-xs text-zinc-400">
              {DEFAULT_VOICE.gender === "female" ? "Female" : "Male"} • {DEFAULT_VOICE.accent}
            </p>
          </div>
          <Check className="h-4 w-4 text-amber-500" />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        More voices coming soon
      </p>
    </div>
  );
}
