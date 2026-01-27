/**
 * Text-to-Speech Service
 *
 * Integrates with Fish Audio API for TTS generation.
 * Story: 3-2 Streaming Audio Generation
 */

import { logger } from '../lib/logger.js';
import { ErrorCodes } from '../utils/errors.js';

const FISH_AUDIO_API_URL = 'https://api.fish.audio/v1/tts';
const TTS_TIMEOUT_MS = 120000; // 2 minutes for long articles

// Default Fish Audio voice ID - set via env var FISH_AUDIO_DEFAULT_VOICE_ID
// MVP: Single voice only until multiple voices are configured
const getDefaultVoiceId = () => process.env.FISH_AUDIO_DEFAULT_VOICE_ID || '';

export interface TtsOptions {
  text: string;
  voiceId: string;
  signal?: AbortSignal;
}

export interface TtsResult {
  audioBuffer: Buffer;
  durationSeconds: number;
}

/**
 * Generate speech from text using Fish Audio API
 */
export async function generateSpeech(options: TtsOptions): Promise<TtsResult> {
  const { text, voiceId, signal } = options;

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    logger.error('FISH_AUDIO_API_KEY not configured');
    throw new Error(ErrorCodes.TTS_FAILED);
  }

  // Map "default" to actual Fish Audio voice ID
  const fishAudioVoiceId = voiceId === 'default' ? getDefaultVoiceId() : voiceId;
  if (!fishAudioVoiceId) {
    logger.error('FISH_AUDIO_DEFAULT_VOICE_ID not configured');
    throw new Error(ErrorCodes.TTS_FAILED);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  // Combine with external signal if provided
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    logger.info({ voiceId, fishAudioVoiceId, textLength: text.length }, 'Starting TTS generation');

    const requestBody = {
      text,
      reference_id: fishAudioVoiceId,
      format: 'mp3',
      mp3_bitrate: 64,
    };

    logger.info({ requestBody: { ...requestBody, text: `${text.substring(0, 100)}...` } }, 'Fish Audio request');

    const response = await fetch(FISH_AUDIO_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'model': 's1',
      },
      body: JSON.stringify(requestBody),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error(
        { status: response.status, statusText: response.statusText, error: errorText, headers: Object.fromEntries(response.headers) },
        'Fish Audio API error'
      );
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    logger.info('Fish Audio response received, reading buffer...');

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration from file size (MP3 at 64kbps)
    // 64 kbps = 8 KB/s, so duration = size / 8000
    const durationSeconds = Math.round(audioBuffer.length / 8000);

    logger.info(
      { durationSeconds, fileSizeBytes: audioBuffer.length },
      'TTS generation complete'
    );

    return { audioBuffer, durationSeconds };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('TTS generation timeout');
        throw new Error(ErrorCodes.TIMEOUT);
      }

      if (error.message === ErrorCodes.TTS_FAILED) {
        throw error;
      }
    }

    logger.error({ error }, 'TTS generation error');
    throw new Error(ErrorCodes.TTS_FAILED);
  }
}
