"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { cn } from "@/lib/utils";

interface SleepTimerMenuProps {
  onClose: () => void;
}

const timerOptions = [
  { label: "15 minutes", minutes: 15 },
  { label: "30 minutes", minutes: 30 },
  { label: "45 minutes", minutes: 45 },
  { label: "1 hour", minutes: 60 },
  { label: "End of article", minutes: -1 }, // Special value for end of track
];

function isOptionActive(
  option: { minutes: number },
  sleepTimer: { isActive: boolean; endOfTrack: boolean; remainingSeconds: number }
): boolean {
  // "End of article" option
  if (option.minutes === -1) {
    return sleepTimer.endOfTrack;
  }
  // Timed options
  if (!sleepTimer.isActive || sleepTimer.endOfTrack) {
    return false;
  }
  const remainingMinutes = Math.ceil(sleepTimer.remainingSeconds / 60);
  return remainingMinutes === option.minutes;
}

export function SleepTimerMenu({ onClose }: SleepTimerMenuProps) {
  const { sleepTimer, setSleepTimer, setSleepTimerEndOfTrack, cancelSleepTimer } =
    useAudioPlayer();

  const handleSelect = (minutes: number) => {
    if (minutes === -1) {
      setSleepTimerEndOfTrack();
    } else {
      setSleepTimer(minutes);
    }
    onClose();
  };

  const handleCancel = () => {
    cancelSleepTimer();
    onClose();
  };

  return (
    <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-lg">
      <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        Sleep Timer
      </div>
      {timerOptions.map((option) => (
        <button
          key={option.minutes}
          onClick={() => handleSelect(option.minutes)}
          className={cn(
            "flex w-full items-center px-4 py-2 text-sm transition-colors hover:bg-[var(--secondary)]",
            isOptionActive(option, sleepTimer) && "text-[var(--foreground)] font-medium"
          )}
        >
          {option.label}
        </button>
      ))}
      {sleepTimer.isActive && (
        <>
          <div className="my-1 border-t border-[var(--border)]" />
          <button
            onClick={handleCancel}
            className="flex w-full items-center px-4 py-2 text-sm text-red-500 transition-colors hover:bg-[var(--secondary)]"
          >
            Cancel Timer
          </button>
        </>
      )}
    </div>
  );
}

export default SleepTimerMenu;
