/**
 * Text-to-Speech Service
 *
 * Primary: Together.ai Kokoro (fast, always warm)
 * Fallback: Kokoro on RunPod Serverless (slower, cold starts)
 *
 * Story: 3-2 Streaming Audio Generation
 */

import { logger } from '../lib/logger.js';
import { ErrorCodes } from '../utils/errors.js';
import { generateSpeechTogether, isTogetherConfigured } from './tts-together.js';

const TTS_TIMEOUT_MS = 180000; // 3 minutes — accounts for RunPod cold starts (10-60s) + generation

// Default Kokoro voice ID — matches mobile DEFAULT_VOICE_ID ('alex' → 'am_adam')
const DEFAULT_KOKORO_VOICE = 'am_adam';

// Valid Kokoro voice IDs — reject unknown IDs before sending to RunPod
// Includes all 19 American English voices + mobile friendly ID aliases
const VALID_KOKORO_VOICES = new Set([
  // Mobile friendly IDs (backward compatibility)
  'alex', 'sarah', 'james', 'emma',
  // Female voices (af_)
  'af_alloy', 'af_aoede', 'af_bella', 'af_heart', 'af_jessica',
  'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
  // Male voices (am_)
  'am_adam', 'am_echo', 'am_eric', 'am_fenrir',
  'am_liam', 'am_michael', 'am_onyx', 'am_puck',
]);

export interface TtsOptions {
  text: string;
  voiceId: string;
  signal?: AbortSignal;
}

export interface TtsToken {
  text: string;
  start_ts: number;
  end_ts: number;
}

export interface TtsResult {
  audioBuffer: Buffer;
  durationSeconds: number;
  tokens?: TtsToken[];
}

interface RunPodResponse {
  id: string;
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS' | 'IN_QUEUE';
  output?: {
    audio_base64: string;
    tokens?: Array<{ text: string; start_ts: number; end_ts: number }>;
  };
  error?: string;
  executionTime?: number;
}

/**
 * Generate speech from text
 *
 * Uses Together.ai as primary (fast), falls back to RunPod if not configured
 */
export async function generateSpeech(options: TtsOptions): Promise<TtsResult> {
  // Try Together.ai first (faster, no cold starts)
  if (isTogetherConfigured()) {
    try {
      logger.info({ textLength: options.text.length }, 'Using Together.ai TTS');
      return await generateSpeechTogether(options);
    } catch (error) {
      logger.warn({ error }, 'Together.ai TTS failed, falling back to RunPod');
      // Fall through to RunPod
    }
  }

  // Fallback to RunPod
  return generateSpeechRunPod(options);
}

/**
 * Generate speech using Kokoro TTS on RunPod Serverless (fallback)
 */
async function generateSpeechRunPod(options: TtsOptions): Promise<TtsResult> {
  const { text, voiceId, signal } = options;

  const apiUrl = process.env.KOKORO_API_URL;
  const apiKey = process.env.KOKORO_API_KEY;
  if (!apiUrl || !apiKey) {
    logger.error('KOKORO_API_URL or KOKORO_API_KEY not configured');
    throw new Error(ErrorCodes.TTS_FAILED);
  }

  // Map "default" to Kokoro voice ID
  const kokoroVoiceId = voiceId === 'default' ? DEFAULT_KOKORO_VOICE : voiceId;

  if (!VALID_KOKORO_VOICES.has(kokoroVoiceId)) {
    logger.error({ voiceId, kokoroVoiceId }, 'Invalid Kokoro voice ID');
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
    logger.info({ voiceId, kokoroVoiceId, textLength: text.length }, 'Starting TTS generation (RunPod)');

    const requestBody = {
      input: {
        text,
        voice_id: kokoroVoiceId,
        output_format: 'mp3',
        mp3_bitrate: 64,
      },
    };

    logger.info({ textPreview: text.substring(0, 100), voiceId: kokoroVoiceId }, 'Kokoro RunPod request');

    const response = await fetch(`${apiUrl}/runsync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: combinedSignal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error(
        { status: response.status, statusText: response.statusText, error: errorText },
        'Kokoro RunPod API error'
      );
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    const result = (await response.json()) as RunPodResponse;

    if (result.status === 'FAILED') {
      logger.error({ jobId: result.id, error: result.error }, 'Kokoro TTS job failed');
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    if (result.status !== 'COMPLETED') {
      logger.error({ jobId: result.id, status: result.status }, 'Kokoro TTS unexpected job status');
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    if (!result.output?.audio_base64) {
      logger.error({ jobId: result.id }, 'Kokoro TTS response missing audio data');
      throw new Error(ErrorCodes.TTS_FAILED);
    }

    const audioBuffer = Buffer.from(result.output.audio_base64, 'base64');

    // Estimate duration from file size (MP3 at 64kbps)
    // 64 kbps = 8 KB/s, so duration ≈ size / 8000
    // Floor to avoid overcharging — MP3 headers inflate size slightly
    const durationSeconds = Math.floor(audioBuffer.length / 8000);

    // Extract tokens if available (for transcript feature)
    const tokens = result.output.tokens;

    logger.info(
      {
        durationSeconds,
        fileSizeBytes: audioBuffer.length,
        executionTime: result.executionTime,
        jobId: result.id,
        tokenCount: tokens?.length ?? 0,
      },
      'TTS generation complete (RunPod)'
    );

    return { audioBuffer, durationSeconds, tokens };
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
