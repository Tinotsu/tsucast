/**
 * Together.ai Kokoro TTS Client
 *
 * Provides TTS via Together.ai's Kokoro API for streaming audio generation.
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { logger } from '../lib/logger.js';
import { ErrorCodes } from '../utils/errors.js';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/audio/speech';
const TTS_TIMEOUT_MS = 60000; // 60s per chunk (plenty of margin)

// Map our voice IDs to Together.ai Kokoro voices
const VOICE_MAP: Record<string, string> = {
  default: 'af_alloy',
  am_adam: 'am_adam',
  af_sarah: 'af_sarah',
  am_michael: 'am_michael',
  af_bella: 'af_bella',
  // Together.ai has 50+ Kokoro voices - add more as needed
};

export interface TogetherTtsOptions {
  text: string;
  voiceId: string;
  signal?: AbortSignal;
}

export interface TogetherTtsResult {
  audioBuffer: Buffer;
  durationSeconds: number;
}

/**
 * Check if Together.ai TTS is configured
 */
export function isTogetherConfigured(): boolean {
  return !!process.env.TOGETHER_API_KEY;
}

/**
 * Generate speech using Together.ai Kokoro API
 * Returns complete audio buffer for a single chunk
 */
export async function generateSpeechTogether(
  options: TogetherTtsOptions
): Promise<TogetherTtsResult> {
  const { text, voiceId, signal } = options;

  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    logger.error('TOGETHER_API_KEY not configured');
    throw new Error(ErrorCodes.TTS_FAILED);
  }

  const voice = VOICE_MAP[voiceId] || VOICE_MAP['default'];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    logger.info(
      { voiceId: voice, textLength: text.length, textPreview: text.substring(0, 50) },
      'Starting Together.ai TTS'
    );

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'hexgrad/Kokoro-82M',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error(
        { status: response.status, statusText: response.statusText, error: errorText },
        'Together.ai API error'
      );
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    // Response is binary audio
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Estimate duration from file size
    // Together.ai returns MP3, typically around 128kbps
    // 128 kbps = 16 KB/s, so duration = size / 16000
    // Use floor to avoid overcharging
    const durationSeconds = Math.max(1, Math.floor(audioBuffer.length / 16000));

    logger.info(
      { durationSeconds, fileSizeBytes: audioBuffer.length, voice },
      'Together.ai TTS complete'
    );

    return { audioBuffer, durationSeconds };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('Together.ai TTS timeout');
        throw new Error(ErrorCodes.TIMEOUT);
      }
      if (error.message === ErrorCodes.TTS_FAILED || error.message === ErrorCodes.TIMEOUT) {
        throw error;
      }
    }

    logger.error({ error }, 'Together.ai TTS error');
    throw new Error(ErrorCodes.TTS_FAILED);
  }
}
