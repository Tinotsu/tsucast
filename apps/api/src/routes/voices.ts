/**
 * Voice Routes
 *
 * Public endpoints for voice information and samples.
 */

import { Hono } from 'hono';

const app = new Hono();

// Voice sample metadata
// Audio files are hosted in R2 under /voice-samples/ prefix
const VOICE_SAMPLES = [
  {
    voiceId: 'am_adam',
    name: 'Adam',
    description: 'Warm, engaging male voice',
    audioUrl: 'https://static.tsucast.app/voice-samples/am_adam.mp3',
  },
  {
    voiceId: 'af_sarah',
    name: 'Sarah',
    description: 'Clear, professional female voice',
    audioUrl: 'https://static.tsucast.app/voice-samples/af_sarah.mp3',
  },
  {
    voiceId: 'am_michael',
    name: 'Michael',
    description: 'Deep, authoritative male voice',
    audioUrl: 'https://static.tsucast.app/voice-samples/am_michael.mp3',
  },
  {
    voiceId: 'af_bella',
    name: 'Bella',
    description: 'Friendly, conversational female voice',
    audioUrl: 'https://static.tsucast.app/voice-samples/af_bella.mp3',
  },
];

/**
 * GET /samples — Public. Returns voice sample metadata for the landing page.
 */
app.get('/samples', (c) => {
  return c.json({ samples: VOICE_SAMPLES });
});

export default app;
