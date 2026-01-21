/**
 * Voice Preference Hook
 *
 * Persists user's voice selection across sessions.
 * Story: 3-1 Voice Selection & Preview
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_VOICE_ID, getVoiceById, getDefaultVoice } from '../constants/voices';
import type { Voice } from '../constants/voices';

const VOICE_PREFERENCE_KEY = '@tsucast/selected_voice_id';

export function useVoicePreference() {
  const [selectedVoiceId, setSelectedVoiceIdState] = useState(DEFAULT_VOICE_ID);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    loadSavedVoice();
  }, []);

  const loadSavedVoice = async () => {
    try {
      const stored = await AsyncStorage.getItem(VOICE_PREFERENCE_KEY);
      if (stored) {
        // Verify the voice still exists
        const voice = getVoiceById(stored);
        if (voice) {
          setSelectedVoiceIdState(stored);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load voice preference:', error);
      }
    } finally {
      setIsLoaded(true);
    }
  };

  /**
   * Set and persist selected voice
   */
  const setSelectedVoiceId = async (voiceId: string) => {
    setSelectedVoiceIdState(voiceId);
    try {
      await AsyncStorage.setItem(VOICE_PREFERENCE_KEY, voiceId);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to save voice preference:', error);
      }
    }
  };

  /**
   * Get the full Voice object for the selected voice
   */
  const selectedVoice: Voice = getVoiceById(selectedVoiceId) || getDefaultVoice();

  return {
    selectedVoiceId,
    selectedVoice,
    setSelectedVoiceId,
    isLoaded,
  };
}
