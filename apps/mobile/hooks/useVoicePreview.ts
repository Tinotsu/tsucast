/**
 * Voice Preview Hook
 *
 * Handles playing voice preview samples.
 * Story: 3-1 Voice Selection & Preview
 */

import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import type { Voice } from '../constants/voices';

export function useVoicePreview() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  /**
   * Play a voice preview sample
   */
  const playPreview = async (voice: Voice) => {
    try {
      // Stop any currently playing preview
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If same voice was playing, just stop (toggle behavior)
      if (playingId === voice.id) {
        setPlayingId(null);
        return;
      }

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Load and play the preview
      const { sound } = await Audio.Sound.createAsync(
        { uri: voice.previewUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingId(voice.id);

      // Auto-stop when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to play voice preview:', error);
      }
      setPlayingId(null);
    }
  };

  /**
   * Stop any playing preview
   */
  const stopPreview = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore errors during cleanup
      }
      soundRef.current = null;
    }
    setPlayingId(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    playPreview,
    stopPreview,
    playingId,
    isPlaying: playingId !== null,
  };
}
