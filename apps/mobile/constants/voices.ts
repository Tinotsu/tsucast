/**
 * Voice Configuration
 *
 * Defines available voices for TTS generation.
 * Story: 3-1 Voice Selection & Preview
 */

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  style: string;
  previewUrl: string;
  kokoroVoiceId: string;
}

/**
 * Available voices for audio generation
 *
 * Kokoro voice IDs map to built-in Kokoro TTS voices.
 * Preview URLs point to R2 storage.
 */
export const VOICES: Voice[] = [
  {
    id: 'alex',
    name: 'Alex',
    description: 'Clear, professional narrator',
    gender: 'male',
    style: 'Narration',
    previewUrl: 'https://audio.tsucast.app/voices/alex.mp3',
    kokoroVoiceId: 'am_adam',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    description: 'Warm, engaging storyteller',
    gender: 'female',
    style: 'Storytelling',
    previewUrl: 'https://audio.tsucast.app/voices/sarah.mp3',
    kokoroVoiceId: 'af_sarah',
  },
  {
    id: 'james',
    name: 'James',
    description: 'Deep, authoritative voice',
    gender: 'male',
    style: 'Documentary',
    previewUrl: 'https://audio.tsucast.app/voices/james.mp3',
    kokoroVoiceId: 'am_michael',
  },
  {
    id: 'emma',
    name: 'Emma',
    description: 'Friendly, conversational tone',
    gender: 'female',
    style: 'Conversational',
    previewUrl: 'https://audio.tsucast.app/voices/emma.mp3',
    kokoroVoiceId: 'af_bella',
  },
];

export const DEFAULT_VOICE_ID = 'alex';

/**
 * Get voice by ID
 */
export function getVoiceById(id: string): Voice | undefined {
  return VOICES.find((v) => v.id === id);
}

/**
 * Get default voice
 */
export function getDefaultVoice(): Voice {
  return VOICES.find((v) => v.id === DEFAULT_VOICE_ID) || VOICES[0];
}
