"use client";

import { VOICES } from "@/lib/voices";
import { useVoicePreview } from "@/hooks/useVoicePreview";
import { VoiceCard } from "./VoiceCard";

interface VoiceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoaded?: boolean;
}

export function VoiceSelector({
  value,
  onChange,
  disabled,
  isLoaded = true,
}: VoiceSelectorProps) {
  const { playPreview, playingId } = useVoicePreview();

  // Show skeleton while loading
  if (!isLoaded) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-16 bg-[var(--muted)] rounded animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-32 h-24 bg-[var(--card)] rounded-xl animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium tracking-tight text-[var(--foreground)]">
        Voice
      </label>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {VOICES.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            isSelected={value === voice.id}
            isPlaying={playingId === voice.id}
            onSelect={() => onChange(voice.id)}
            onPreview={() => playPreview(voice)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
