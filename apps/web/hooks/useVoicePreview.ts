"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioPlayer } from '@/providers/AudioPlayerProvider';
import type { Voice } from '@/lib/voices';

export function useVoicePreview() {
  const { pause: pauseGlobalPlayer } = useAudioPlayer();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playPreview = useCallback(async (voice: Voice) => {
    // Pause any global audio (podcast playback)
    pauseGlobalPlayer();

    // Stop current preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Toggle off if same voice
    if (playingId === voice.id) {
      setPlayingId(null);
      return;
    }

    // Play new preview
    const audio = new Audio(voice.previewUrl);
    audioRef.current = audio;

    audio.onplay = () => setPlayingId(voice.id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      console.error('Failed to load voice preview:', voice.id);
      setPlayingId(null);
    };

    try {
      await audio.play();
    } catch (err) {
      console.error('Playback failed:', err);
      setPlayingId(null);
    }
  }, [playingId, pauseGlobalPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
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
