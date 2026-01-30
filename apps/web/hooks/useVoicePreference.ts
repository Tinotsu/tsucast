"use client";

import { useState, useEffect } from 'react';
import { DEFAULT_VOICE_ID, getVoiceById, getDefaultVoice, type Voice } from '@/lib/voices';

const VOICE_PREFERENCE_KEY = 'tsucast_selected_voice_id';

export function useVoicePreference() {
  const [selectedVoiceId, setSelectedVoiceIdState] = useState(DEFAULT_VOICE_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedVoice = (): string => {
      try {
        const stored = localStorage.getItem(VOICE_PREFERENCE_KEY);
        if (!stored) return DEFAULT_VOICE_ID;

        // Migration: "default" was used in MVP, map to new default
        if (stored === 'default') {
          localStorage.setItem(VOICE_PREFERENCE_KEY, DEFAULT_VOICE_ID);
          return DEFAULT_VOICE_ID;
        }

        // Validate voice still exists
        const voice = getVoiceById(stored);
        if (voice) return stored;

        // Invalid voice, reset to default
        return DEFAULT_VOICE_ID;
      } catch {
        return DEFAULT_VOICE_ID;
      }
    };

    const voiceId = loadSavedVoice();
    setSelectedVoiceIdState(voiceId);
    setIsLoaded(true);
  }, []);

  const setSelectedVoiceId = (voiceId: string) => {
    setSelectedVoiceIdState(voiceId);
    try {
      localStorage.setItem(VOICE_PREFERENCE_KEY, voiceId);
    } catch {
      // localStorage unavailable, continue without persistence
    }
  };

  const selectedVoice: Voice = getVoiceById(selectedVoiceId) || getDefaultVoice();

  return {
    selectedVoiceId,
    selectedVoice,
    setSelectedVoiceId,
    isLoaded,
  };
}
