/**
 * Streaming Generation Route
 *
 * POST /api/stream - Start streaming generation (returns HLS manifest after first chunk)
 * GET /api/stream/:id - Get stream status
 *
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { normalizeUrl, hashUrlWithVoice } from '../utils/url.js';
import { getUserFromToken } from '../middleware/auth.js';
import { getSupabase } from '../lib/supabase.js';
import { ErrorCodes, createApiError, LIMITS } from '../utils/errors.js';
import { fetchUrl, isPdfUrl, fetchPdf } from '../services/fetcher.js';
import { parseHtmlContent } from '../services/parser.js';
import { parsePdfContent, isImageOnlyPdf } from '../services/pdfParser.js';
import { shouldUseStreaming, countWords } from '../services/chunker.js';
import { startStreamGeneration } from '../services/streaming.js';
import { getStreamState, getStreamByUrlHash } from '../services/stream-state.js';
import { isTogetherConfigured } from '../services/tts-together.js';
import { isStorageConfigured } from '../services/storage.js';
import {
  claimCacheEntry,
  getCacheEntry,
  updateCacheReady,
  updateCacheFailed,
  isStaleEntry,
  deleteCacheEntry,
} from '../services/cache.js';
import {
  getUserCreditBalance,
  deductCredits,
  estimateDurationFromWords,
  calculateCreditsNeeded,
} from '../services/credits.js';
import { getPostHog } from '../lib/posthog.js';

const app = new Hono();

const streamSchema = z.object({
  url: z.string().url(),
  voiceId: z.string().default('default'),
});

/**
 * Start streaming generation
 *
 * Returns HLS manifest URL after first chunk is ready (~5-10 seconds)
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = streamSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: createApiError(ErrorCodes.INVALID_URL, 'Invalid request body') },
        400
      );
    }

    const { url, voiceId } = parsed.data;

    // Check configuration
    if (!isTogetherConfigured()) {
      logger.error('Together.ai TTS not configured');
      return c.json(
        { error: createApiError(ErrorCodes.TTS_FAILED, 'TTS service not configured') },
        503
      );
    }

    if (!isStorageConfigured()) {
      logger.error('R2 storage not configured');
      return c.json(
        { error: createApiError(ErrorCodes.INTERNAL_ERROR, 'Storage not configured') },
        503
      );
    }

    // Auth required
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        401
      );
    }

    // Check credits
    const balance = await getUserCreditBalance(userId);
    if (!balance || balance.credits < 1) {
      return c.json({ error: createApiError(ErrorCodes.INSUFFICIENT_CREDITS) }, 402);
    }

    logger.info({ url, voiceId, userId }, 'Starting streaming generation');

    // Normalize and hash
    const normalizedUrl = normalizeUrl(url);
    const urlHash = hashUrlWithVoice(normalizedUrl, voiceId);

    // Check cache first
    const existing = await getCacheEntry(urlHash);
    if (existing) {
      if (existing.status === 'ready' && existing.audio_url) {
        logger.info({ urlHash }, 'Cache hit');

        // Add to user's library
        const supabase = getSupabase();
        if (supabase) {
          await supabase
            .from('user_library')
            .upsert(
              { user_id: userId, audio_id: existing.id },
              { onConflict: 'user_id,audio_id' }
            );
        }

        return c.json({
          status: 'ready',
          audioUrl: existing.audio_url,
          title: existing.title,
          duration: existing.duration_seconds,
          wordCount: existing.word_count,
          cached: true,
          streaming: false,
        });
      }

      if (existing.status === 'processing') {
        // Check for existing stream
        const existingStream = await getStreamByUrlHash(urlHash);
        if (existingStream && existingStream.manifestUrl) {
          return c.json({
            status: 'streaming',
            streamId: existingStream.id,
            manifestUrl: existingStream.manifestUrl,
            totalChunks: existingStream.totalChunks,
            chunksCompleted: existingStream.chunksCompleted,
            progress: existingStream.totalChunks > 0
              ? existingStream.chunksCompleted / existingStream.totalChunks
              : 0,
          });
        }

        // Check if stale
        if (isStaleEntry(existing)) {
          logger.info({ urlHash }, 'Stale processing entry - cleaning up');
          await deleteCacheEntry(urlHash);
        } else {
          return c.json(
            {
              status: 'processing',
              cacheId: existing.id,
              message: 'Generation in progress',
            },
            202
          );
        }
      }

      if (existing.status === 'failed') {
        logger.info({ urlHash }, 'Previous attempt failed - retrying');
        await deleteCacheEntry(urlHash);
      }
    }

    // Claim cache entry
    const claimed = await claimCacheEntry({
      urlHash,
      originalUrl: url,
      normalizedUrl,
      voiceId,
      userId,
    });

    if (!claimed) {
      const entry = await getCacheEntry(urlHash);
      return c.json(
        {
          status: 'processing',
          cacheId: entry?.id,
          message: 'Generation in progress',
        },
        202
      );
    }

    // Extract content
    let title: string;
    let textContent: string;
    let wordCount: number;

    try {
      if (isPdfUrl(url)) {
        logger.info({ url }, 'Extracting PDF content');
        const { buffer, filename } = await fetchPdf(url);
        const pdfResult = await parsePdfContent(buffer, filename);

        if (isImageOnlyPdf(pdfResult)) {
          await updateCacheFailed(urlHash, 'Image-only PDF');
          return c.json({ error: createApiError(ErrorCodes.IMAGE_ONLY_PDF) }, 422);
        }

        title = pdfResult.title;
        textContent = pdfResult.textContent;
        wordCount = pdfResult.wordCount;
      } else {
        logger.info({ url }, 'Extracting HTML content');
        const html = await fetchUrl(url);
        const htmlResult = await parseHtmlContent(html, url);

        title = htmlResult.title;
        textContent = htmlResult.textContent;
        wordCount = htmlResult.wordCount;
      }
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'FETCH_FAILED';
      await updateCacheFailed(urlHash, errorCode);

      if (errorCode === ErrorCodes.PAYWALL_DETECTED) {
        return c.json({ error: createApiError(ErrorCodes.PAYWALL_DETECTED) }, 422);
      }
      if (errorCode === ErrorCodes.TIMEOUT) {
        return c.json({ error: createApiError(ErrorCodes.TIMEOUT) }, 408);
      }

      return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 422);
    }

    // Validate word count
    if (wordCount > LIMITS.MAX_WORD_COUNT) {
      await updateCacheFailed(urlHash, 'Article too long');
      return c.json(
        {
          error: createApiError(
            ErrorCodes.ARTICLE_TOO_LONG,
            `Article is too long (${wordCount.toLocaleString()} words, max ${LIMITS.MAX_WORD_COUNT.toLocaleString()})`
          ),
        },
        422
      );
    }

    logger.info({ url, title, wordCount }, 'Content extracted');

    // Deduct credits upfront (estimate)
    const estimatedMinutes = estimateDurationFromWords(wordCount);
    const creditCalc = calculateCreditsNeeded(estimatedMinutes, balance.timeBank);

    const newBalance = await deductCredits(
      userId,
      estimatedMinutes,
      `Generating: ${title}`,
      { url, wordCount, streaming: true }
    );

    if (!newBalance) {
      await updateCacheFailed(urlHash, 'Insufficient credits');
      return c.json({ error: createApiError(ErrorCodes.INSUFFICIENT_CREDITS) }, 402);
    }

    // Check if should use streaming (>=500 words)
    if (!shouldUseStreaming(wordCount)) {
      logger.info({ wordCount }, 'Article too short for streaming - using sync generation');

      // For short articles, just use sync generation
      // Import dynamically to avoid circular dependency
      const { generateSpeechTogether } = await import('../services/tts-together.js');
      const { uploadAudio } = await import('../services/storage.js');

      try {
        const ttsResult = await generateSpeechTogether({
          text: textContent,
          voiceId,
        });

        const uploadResult = await uploadAudio(ttsResult.audioBuffer, { urlHash });

        await updateCacheReady({
          urlHash,
          title,
          audioUrl: uploadResult.url,
          durationSeconds: ttsResult.durationSeconds,
          wordCount,
          fileSizeBytes: uploadResult.size,
        });

        // Add to library
        const supabase = getSupabase();
        const cacheEntry = await getCacheEntry(urlHash);
        if (supabase && cacheEntry) {
          await supabase
            .from('user_library')
            .upsert(
              { user_id: userId, audio_id: cacheEntry.id },
              { onConflict: 'user_id,audio_id' }
            );
        }

        // Analytics
        getPostHog()?.capture({
          distinctId: userId,
          event: 'article_generated',
          properties: {
            url_hash: urlHash,
            duration_seconds: ttsResult.durationSeconds,
            word_count: wordCount,
            voice_id: voiceId,
            streaming: false,
          },
        });

        return c.json({
          status: 'ready',
          audioUrl: uploadResult.url,
          title,
          duration: ttsResult.durationSeconds,
          wordCount,
          streaming: false,
          credits: {
            balance: newBalance.credits,
            timeBank: newBalance.timeBank,
          },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'TTS failed';
        await updateCacheFailed(urlHash, errorMsg);
        return c.json({ error: createApiError(ErrorCodes.TTS_FAILED) }, 500);
      }
    }

    // Start streaming generation (long articles)
    try {
      const result = await startStreamGeneration({
        urlHash,
        cacheId: claimed.id,
        text: textContent,
        title,
        voiceId,
        userId,
      });

      logger.info(
        { streamId: result.streamId, manifestUrl: result.manifestUrl },
        'Stream started'
      );

      // Analytics
      getPostHog()?.capture({
        distinctId: userId,
        event: 'stream_started',
        properties: {
          url_hash: urlHash,
          stream_id: result.streamId,
          total_chunks: result.totalChunks,
          estimated_duration: result.estimatedDuration,
          word_count: wordCount,
          voice_id: voiceId,
        },
      });

      return c.json({
        status: 'streaming',
        streamId: result.streamId,
        manifestUrl: result.manifestUrl,
        title,
        wordCount,
        totalChunks: result.totalChunks,
        estimatedDuration: result.estimatedDuration,
        firstChunkDuration: result.firstChunkDuration,
        credits: {
          balance: newBalance.credits,
          timeBank: newBalance.timeBank,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Stream generation failed';
      await updateCacheFailed(urlHash, errorMsg);

      getPostHog()?.capture({
        distinctId: userId,
        event: 'stream_failed',
        properties: { url_hash: urlHash, error: errorMsg },
      });

      if (errorMsg === ErrorCodes.TIMEOUT) {
        return c.json({ error: createApiError(ErrorCodes.TIMEOUT) }, 408);
      }

      return c.json({ error: createApiError(ErrorCodes.TTS_FAILED) }, 500);
    }
  } catch (error) {
    logger.error({ error }, 'Stream generation failed');
    return c.json({ error: createApiError(ErrorCodes.INTERNAL_ERROR) }, 500);
  }
});

/**
 * Get stream status
 */
app.get('/:id', async (c) => {
  const streamId = c.req.param('id');

  const state = await getStreamState(streamId);

  if (!state) {
    return c.json(
      { error: createApiError('NOT_FOUND', 'Stream not found') },
      404
    );
  }

  const progress =
    state.totalChunks > 0 ? state.chunksCompleted / state.totalChunks : 0;

  return c.json({
    status: state.status,
    manifestUrl: state.manifestUrl,
    totalChunks: state.totalChunks,
    chunksCompleted: state.chunksCompleted,
    progress,
    totalDuration: state.totalDurationSeconds,
    error:
      state.status === 'failed'
        ? {
            chunk: state.failedChunk,
            message: state.errorMessage,
          }
        : undefined,
  });
});

export default app;
