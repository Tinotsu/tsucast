/**
 * Position Saving Hook
 *
 * Automatically saves playback position to server.
 * Story: 4-2 Playback Progress Tracking
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import { updatePlaybackPosition } from '@/services/api';
import { usePlayerStore } from '@/stores/playerStore';

const SAVE_DEBOUNCE_MS = 2000; // Debounce saves by 2 seconds
const POSITION_CHANGE_THRESHOLD = 5; // Only save if position changed by > 5 seconds

export function usePositionSaving() {
  const { position } = useProgress(1000); // Update every second
  const { currentLibraryId, isPlaying } = usePlayerStore();
  const lastSavedPosition = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  /**
   * Save position to server
   */
  const savePosition = useCallback(async (pos: number, markAsPlayed = false) => {
    if (!currentLibraryId || isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      await updatePlaybackPosition(
        currentLibraryId,
        Math.floor(pos),
        markAsPlayed ? true : undefined
      );
      lastSavedPosition.current = pos;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save position:', error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [currentLibraryId]);

  /**
   * Save position during playback (debounced)
   */
  useEffect(() => {
    if (!currentLibraryId || !isPlaying) return;

    // Only save if position changed significantly
    if (Math.abs(position - lastSavedPosition.current) > POSITION_CHANGE_THRESHOLD) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce the save
      saveTimeoutRef.current = setTimeout(() => {
        savePosition(position);
      }, SAVE_DEBOUNCE_MS);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [position, currentLibraryId, isPlaying, savePosition]);

  /**
   * Save position on app background
   */
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' && currentLibraryId) {
        const currentPosition = await TrackPlayer.getProgress();
        await savePosition(currentPosition.position);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [currentLibraryId, savePosition]);

  /**
   * Save position immediately (for pause)
   */
  const saveOnPause = useCallback(async () => {
    if (!currentLibraryId) return;

    const { position: currentPosition } = await TrackPlayer.getProgress();
    await savePosition(currentPosition);
  }, [currentLibraryId, savePosition]);

  /**
   * Mark track as played (for completion)
   */
  const markAsPlayed = useCallback(async () => {
    if (!currentLibraryId) return;

    const { duration } = await TrackPlayer.getProgress();
    await savePosition(duration, true);
  }, [currentLibraryId, savePosition]);

  return {
    saveOnPause,
    markAsPlayed,
  };
}
