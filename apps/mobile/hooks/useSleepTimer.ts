/**
 * Sleep Timer Hook
 *
 * Manages sleep timer countdown and auto-pause.
 * Story: 3-6 Sleep Timer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import TrackPlayer, { Event } from 'react-native-track-player';

export const TIMER_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of article', minutes: -1 },
  { label: 'Off', minutes: 0 },
] as const;

export function useSleepTimer() {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [endOfArticle, setEndOfArticle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Gentle fade out and pause
  const fadeOutAndPause = useCallback(async () => {
    const steps = 5;
    const stepDuration = 400; // 2 seconds total fade

    try {
      for (let i = steps; i > 0; i--) {
        await TrackPlayer.setVolume(i / steps);
        await new Promise((r) => setTimeout(r, stepDuration));
      }

      await TrackPlayer.pause();
      await TrackPlayer.setVolume(1); // Reset for next play
    } catch (error) {
      // If fade fails, just pause
      await TrackPlayer.pause();
      await TrackPlayer.setVolume(1);
    }
  }, []);

  // Track whether timer is active
  const isTimerActive = remainingSeconds !== null && remainingSeconds > 0;

  // Countdown timer effect
  useEffect(() => {
    if (!isTimerActive) {
      clearTimer();
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          // Timer complete - fade out and pause
          fadeOutAndPause();
          clearTimer();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerActive]);

  // End of article handler
  useEffect(() => {
    if (!endOfArticle) return;

    const handleQueueEnded = () => {
      fadeOutAndPause();
      setEndOfArticle(false);
    };

    const subscription = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      handleQueueEnded
    );

    return () => {
      subscription.remove();
    };
  }, [endOfArticle, fadeOutAndPause]);

  /**
   * Set the sleep timer
   * @param minutes - Number of minutes, or -1 for end of article
   */
  const setTimer = useCallback(
    (minutes: number) => {
      // Cancel any existing timer
      clearTimer();

      if (minutes === -1) {
        // End of article mode
        setEndOfArticle(true);
        setRemainingSeconds(null);
      } else if (minutes === 0) {
        // Cancel timer
        setEndOfArticle(false);
        setRemainingSeconds(null);
      } else {
        // Set countdown timer
        setEndOfArticle(false);
        setRemainingSeconds(minutes * 60);
      }
    },
    [clearTimer]
  );

  /**
   * Cancel the active timer
   */
  const cancelTimer = useCallback(() => {
    clearTimer();
    setRemainingSeconds(null);
    setEndOfArticle(false);
  }, [clearTimer]);

  return {
    remainingSeconds,
    endOfArticle,
    setTimer,
    cancelTimer,
    isActive: remainingSeconds !== null || endOfArticle,
  };
}
