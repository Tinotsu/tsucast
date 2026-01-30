/**
 * Voice Routes
 *
 * Public endpoints for voice information and samples.
 */

import { Hono } from 'hono';

const app = new Hono();

// Voice sample metadata - all 19 American English voices
// Audio files are hosted in R2 under /voices/ prefix
const VOICE_SAMPLES = [
  // Female voices (af_)
  { voiceId: 'af_alloy', name: 'Alloy', description: 'Balanced, versatile voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_alloy.mp3' },
  { voiceId: 'af_aoede', name: 'Aoede', description: 'Melodic, musical voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_aoede.mp3' },
  { voiceId: 'af_bella', name: 'Bella', description: 'Conversational, warm voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_bella.mp3' },
  { voiceId: 'af_heart', name: 'Heart', description: 'Warm, caring voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_heart.mp3' },
  { voiceId: 'af_jessica', name: 'Jessica', description: 'Professional, clear voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_jessica.mp3' },
  { voiceId: 'af_kore', name: 'Kore', description: 'Youthful, energetic voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_kore.mp3' },
  { voiceId: 'af_nicole', name: 'Nicole', description: 'Friendly, approachable voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_nicole.mp3' },
  { voiceId: 'af_nova', name: 'Nova', description: 'Energetic, dynamic voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_nova.mp3' },
  { voiceId: 'af_river', name: 'River', description: 'Calm, soothing voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_river.mp3' },
  { voiceId: 'af_sarah', name: 'Sarah', description: 'Clear, articulate voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_sarah.mp3' },
  { voiceId: 'af_sky', name: 'Sky', description: 'Bright, cheerful voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/af_sky.mp3' },
  // Male voices (am_)
  { voiceId: 'am_adam', name: 'Adam', description: 'Warm, narration voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_adam.mp3' },
  { voiceId: 'am_echo', name: 'Echo', description: 'Resonant, deep voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_echo.mp3' },
  { voiceId: 'am_eric', name: 'Eric', description: 'Authoritative, confident voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_eric.mp3' },
  { voiceId: 'am_fenrir', name: 'Fenrir', description: 'Deep, powerful voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_fenrir.mp3' },
  { voiceId: 'am_liam', name: 'Liam', description: 'Casual, friendly voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_liam.mp3' },
  { voiceId: 'am_michael', name: 'Michael', description: 'Documentary-style voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_michael.mp3' },
  { voiceId: 'am_onyx', name: 'Onyx', description: 'Rich, sophisticated voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_onyx.mp3' },
  { voiceId: 'am_puck', name: 'Puck', description: 'Playful, expressive voice', audioUrl: 'https://pub-ae747fb86c1a43208efa2aa425b2b9e5.r2.dev/voices/am_puck.mp3' },
];

/**
 * GET /samples — Public. Returns voice sample metadata for the landing page.
 */
app.get('/samples', (c) => {
  return c.json({ voices: VOICE_SAMPLES });
});

export default app;
