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
  fishAudioId: string;
}

/**
 * Available voices for audio generation
 *
 * Note: Fish Audio IDs should be updated with actual voice IDs
 * Preview URLs point to R2 storage
 */
export const VOICES: Voice[] = [
  {
    id: 'alex',
    name: 'Alex',
    description: 'Clear, professional narrator',
    gender: 'male',
    style: 'Narration',
    previewUrl: 'https://audio.tsucast.app/voices/alex.mp3',
    fishAudioId: 'e58b0d7efca34eb38d5c4985e378abcb', // Example Fish Audio voice
  },
  {
    id: 'sarah',
    name: 'Sarah',
    description: 'Warm, engaging storyteller',
    gender: 'female',
    style: 'Storytelling',
    previewUrl: 'https://audio.tsucast.app/voices/sarah.mp3',
    fishAudioId: '7f92f8afb8ec43bf81429cc1c9199cb1', // Example Fish Audio voice
  },
  {
    id: 'james',
    name: 'James',
    description: 'Deep, authoritative voice',
    gender: 'male',
    style: 'Documentary',
    previewUrl: 'https://audio.tsucast.app/voices/james.mp3',
    fishAudioId: 'a0e99e7d4af24b5b8e8d9e0f0a1b2c3d', // Example Fish Audio voice
  },
  {
    id: 'emma',
    name: 'Emma',
    description: 'Friendly, conversational tone',
    gender: 'female',
    style: 'Conversational',
    previewUrl: 'https://audio.tsucast.app/voices/emma.mp3',
    fishAudioId: 'b1f00f8e5bg35c6c9f9e0f1g1b2c3d4e', // Example Fish Audio voice
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
