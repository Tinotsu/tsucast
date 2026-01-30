/**
 * Voice Configuration for Web
 *
 * Note: Web uses a simplified interface where `id` IS the kokoroVoiceId.
 * This differs from mobile which has separate `id` and `kokoroVoiceId` fields.
 */

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
  style: string;
  previewUrl: string;
}

export const VOICES: Voice[] = [
  { id: 'af_alloy', name: 'Alloy', description: 'Balanced, versatile voice', gender: 'female', style: 'Balanced', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_alloy.mp3' },
  { id: 'af_aoede', name: 'Aoede', description: 'Melodic, musical voice', gender: 'female', style: 'Melodic', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_aoede.mp3' },
  { id: 'af_bella', name: 'Bella', description: 'Conversational, warm voice', gender: 'female', style: 'Conversational', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_bella.mp3' },
  { id: 'af_heart', name: 'Heart', description: 'Warm, caring voice', gender: 'female', style: 'Warm', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_heart.mp3' },
  { id: 'af_jessica', name: 'Jessica', description: 'Professional, clear voice', gender: 'female', style: 'Professional', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_jessica.mp3' },
  { id: 'af_kore', name: 'Kore', description: 'Youthful, energetic voice', gender: 'female', style: 'Youthful', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_kore.mp3' },
  { id: 'af_nicole', name: 'Nicole', description: 'Friendly, approachable voice', gender: 'female', style: 'Friendly', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_nicole.mp3' },
  { id: 'af_nova', name: 'Nova', description: 'Energetic, dynamic voice', gender: 'female', style: 'Energetic', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_nova.mp3' },
  { id: 'af_river', name: 'River', description: 'Calm, soothing voice', gender: 'female', style: 'Calm', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_river.mp3' },
  { id: 'af_sarah', name: 'Sarah', description: 'Clear, articulate voice', gender: 'female', style: 'Clear', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_sarah.mp3' },
  { id: 'af_sky', name: 'Sky', description: 'Bright, cheerful voice', gender: 'female', style: 'Bright', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_sky.mp3' },
  { id: 'am_adam', name: 'Adam', description: 'Warm, narration voice', gender: 'male', style: 'Narration', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_adam.mp3' },
  { id: 'am_echo', name: 'Echo', description: 'Resonant, deep voice', gender: 'male', style: 'Resonant', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_echo.mp3' },
  { id: 'am_eric', name: 'Eric', description: 'Authoritative, confident voice', gender: 'male', style: 'Authoritative', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_eric.mp3' },
  { id: 'am_fenrir', name: 'Fenrir', description: 'Deep, powerful voice', gender: 'male', style: 'Deep', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_fenrir.mp3' },
  { id: 'am_liam', name: 'Liam', description: 'Casual, friendly voice', gender: 'male', style: 'Casual', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_liam.mp3' },
  { id: 'am_michael', name: 'Michael', description: 'Documentary-style voice', gender: 'male', style: 'Documentary', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_michael.mp3' },
  { id: 'am_onyx', name: 'Onyx', description: 'Rich, sophisticated voice', gender: 'male', style: 'Rich', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_onyx.mp3' },
  { id: 'am_puck', name: 'Puck', description: 'Playful, expressive voice', gender: 'male', style: 'Playful', previewUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_puck.mp3' },
];

export const DEFAULT_VOICE_ID = 'af_alloy';

export function getVoiceById(id: string): Voice | undefined {
  return VOICES.find((v) => v.id === id);
}

export function getDefaultVoice(): Voice {
  return VOICES.find((v) => v.id === DEFAULT_VOICE_ID) || VOICES[0];
}
