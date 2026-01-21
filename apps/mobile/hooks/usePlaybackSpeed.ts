/**
 * Playback Speed Hook
 *
 * Manages playback speed with persistence.
 * Story: 3-5 Playback Speed Control
 */

import { useState, useEffect, useCallback } from 'react';
import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from '@/stores/playerStore';

const SPEED_PREFERENCE_KEY = 'playback_speed';
const DEFAULT_SPEED = 1;

export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

export function usePlaybackSpeed() {
  const { playbackSpeed, setPlaybackSpeed } = usePlayerStore();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved speed on mount
  useEffect(() => {
    async function loadSavedSpeed() {
      try {
        const stored = await AsyncStorage.getItem(SPEED_PREFERENCE_KEY);
        if (stored) {
          const savedSpeed = parseFloat(stored);
          if (SPEED_OPTIONS.includes(savedSpeed as SpeedOption)) {
            setPlaybackSpeed(savedSpeed);
            await TrackPlayer.setRate(savedSpeed);
          }
        }
      } catch (error) {
        console.warn('Failed to load playback speed:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSavedSpeed();
  }, [setPlaybackSpeed]);

  /**
   * Set playback speed and persist
   */
  const setSpeed = useCallback(
    async (newSpeed: number) => {
      try {
        // Update store
        setPlaybackSpeed(newSpeed);

        // Apply to player
        await TrackPlayer.setRate(newSpeed);

        // Persist
        await AsyncStorage.setItem(SPEED_PREFERENCE_KEY, newSpeed.toString());
      } catch (error) {
        console.warn('Failed to set playback speed:', error);
      }
    },
    [setPlaybackSpeed]
  );

  /**
   * Cycle to next speed option
   */
  const cycleSpeed = useCallback(async () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed as SpeedOption);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    await setSpeed(SPEED_OPTIONS[nextIndex]);
  }, [playbackSpeed, setSpeed]);

  return {
    speed: playbackSpeed,
    setSpeed,
    cycleSpeed,
    isLoaded,
    speedOptions: SPEED_OPTIONS,
  };
}
