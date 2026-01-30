"use client";

import { Play, Pause, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Voice } from "@/lib/voices";

interface VoiceCardProps {
  voice: Voice;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreview: () => void;
  disabled?: boolean;
}

export function VoiceCard({
  voice,
  isSelected,
  isPlaying,
  onSelect,
  onPreview,
  disabled = false,
}: VoiceCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select if clicking the preview area
    const target = e.target as HTMLElement;
    if (target.closest('[data-preview]')) {
      return;
    }
    if (!disabled) {
      onSelect();
    }
  };

  return (
    <div
      role="button"
      aria-pressed={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onSelect();
        }
      }}
      className={cn(
        "relative shrink-0 w-32 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
        isSelected
          ? "bg-[var(--foreground)] border-[var(--foreground)]"
          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--foreground)]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Voice Name */}
      <p
        className={cn(
          "font-semibold",
          isSelected ? "text-[var(--background)]" : "text-[var(--foreground)]"
        )}
      >
        {voice.name}
      </p>

      {/* Voice Style */}
      <p
        className={cn(
          "text-xs mt-1",
          isSelected ? "text-[var(--background)]/80" : "text-[var(--muted)]"
        )}
      >
        {voice.style}
      </p>

      {/* Preview Button */}
      <button
        data-preview
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        disabled={disabled}
        className={cn(
          "mt-3 flex items-center gap-1 text-xs",
          isSelected
            ? "text-[var(--background)]"
            : "text-[var(--foreground)] hover:opacity-80"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span>{isPlaying ? "Stop" : "Preview"}</span>
      </button>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check className="h-4 w-4 text-[var(--background)]" />
        </div>
      )}
    </div>
  );
}
