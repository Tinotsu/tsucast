/**
 * Generate Route
 *
 * Handles content extraction and TTS generation.
 * Stories: 2-2, 2-3, 3-2
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { normalizeUrl, hashUrlWithVoice } from '../utils/url.js';
import { ipRateLimit } from '../middleware/ip-rate-limit.js';
import { fetchUrl, isPdfUrl, fetchPdf } from '../services/fetcher.js';
import { parseHtmlContent } from '../services/parser.js';
import { parsePdfContent, isImageOnlyPdf } from '../services/pdfParser.js';
import { generateSpeech } from '../services/tts.js';
import { uploadAudio, isStorageConfigured } from '../services/storage.js';
import {
  getCacheEntry,
  claimCacheEntry,
  updateCacheReady,
  updateCacheFailed,
  getCacheEntryById,
  isCacheConfigured,
  isStaleEntry,
  deleteCacheEntry,
} from '../services/cache.js';
import { ErrorCodes, createApiError, LIMITS } from '../utils/errors.js';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { checkRateLimit, incrementGenerationCount } from '../services/rate-limit.js';

const app = new Hono();

const generateSchema = z.object({
  url: z.string().url(),
  voiceId: z.string(),
});


// Check if audio exists in cache (legacy endpoint - use /api/cache/check instead)
// Rate limited: 120 requests/minute per IP
app.get('/cache', ipRateLimit(120, 60 * 1000), async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }

  return c.json({ cached: false, url });
});

// Get generation status (for polling)
// Rate limited: 60 requests/minute per IP (polling endpoint)
app.get('/status/:id', ipRateLimit(60, 60 * 1000), async (c) => {
  const id = c.req.param('id');

  const entry = await getCacheEntryById(id);

  if (!entry) {
    return c.json(
      { error: createApiError('NOT_FOUND', 'Cache entry not found') },
      404
    );
  }

  if (entry.status === 'processing') {
    return c.json({ status: 'processing' }, 202);
  }

  if (entry.status === 'failed') {
    return c.json({
      status: 'failed',
      error: { message: entry.error_message || 'Generation failed' },
    });
  }

  if (entry.status === 'ready') {
    return c.json({
      status: 'ready',
      audioUrl: entry.audio_url,
      title: entry.title,
      duration: entry.duration_seconds,
      wordCount: entry.word_count,
    });
  }

  return c.json({ status: entry.status }, 202);
});

// Generate audio from URL
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: createApiError(ErrorCodes.INVALID_URL, 'Invalid request body') },
        400
      );
    }

    const { url, voiceId } = parsed.data;

    // Authentication check - require login to generate
    const supabase = getSupabase();
    let userId: string | null = null;
    let rateLimit: { allowed: boolean; remaining: number; resetAt: string | null; isPro: boolean } | null = null;

    if (supabase) {
      userId = await getUserFromToken(c.req.header('Authorization'));

      if (!userId) {
        logger.info('Unauthenticated request to generate');
        return c.json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Please sign in to generate audio.',
          },
        }, 401);
      }

      rateLimit = await checkRateLimit(userId, supabase);

      if (!rateLimit.allowed) {
        logger.info({ userId }, 'Rate limit exceeded');
        return c.json({
          error: {
            code: 'RATE_LIMITED',
            message: "You've reached your daily limit of 3 articles. Upgrade to Pro for unlimited access.",
          },
          remaining: 0,
          resetAt: rateLimit.resetAt,
        }, 429);
      }
    }

    logger.info({ url, voiceId, userId }, 'Starting generation');

    // Normalize URL and generate hash
    const normalizedUrl = normalizeUrl(url);
    const urlHash = hashUrlWithVoice(normalizedUrl, voiceId);

    // Check cache first
    if (isCacheConfigured()) {
      const existing = await getCacheEntry(urlHash);

      if (existing) {
        if (existing.status === 'ready' && existing.audio_url) {
          logger.info({ urlHash }, 'Cache hit - returning cached audio');

          // Add to user's library on cache hit too
          if (supabase && userId) {
            const { error: libraryError } = await supabase
              .from('user_library')
              .upsert(
                { user_id: userId, audio_id: existing.id },
                { onConflict: 'user_id,audio_id' }
              );

            if (libraryError) {
              logger.error({ error: libraryError, userId, cacheEntryId: existing.id }, 'Failed to add to library');
            } else {
              logger.info({ userId, cacheEntryId: existing.id }, 'Added to user library (cache hit)');
            }
          }

          return c.json({
            status: 'ready',
            audioUrl: existing.audio_url,
            title: existing.title,
            duration: existing.duration_seconds,
            wordCount: existing.word_count,
            cached: true,
          });
        }

        if (existing.status === 'processing') {
          // Check if entry is stale (stuck for > 5 minutes)
          if (isStaleEntry(existing)) {
            logger.info({ urlHash, updatedAt: existing.updated_at }, 'Stale processing entry detected - cleaning up');
            await deleteCacheEntry(urlHash);
            // Continue to create new entry below
          } else {
            logger.info({ urlHash }, 'Generation in progress - return polling response');
            return c.json(
              {
                status: 'processing',
                cacheId: existing.id,
                message: 'Audio is being generated. Poll /api/generate/status/:id for updates.',
              },
              202
            );
          }
        }

        if (existing.status === 'failed') {
          // Previous attempt failed - delete and retry
          logger.info({ urlHash }, 'Previous attempt failed - deleting and retrying');
          await deleteCacheEntry(urlHash);
        }
      }

      // Claim the cache entry
      const claimed = await claimCacheEntry({
        urlHash,
        originalUrl: url,
        normalizedUrl,
        voiceId,
      });

      if (!claimed) {
        // Another request claimed it - return polling response
        const entry = await getCacheEntry(urlHash);
        if (entry) {
          return c.json(
            {
              status: 'processing',
              cacheId: entry.id,
              message: 'Audio is being generated. Poll /api/generate/status/:id for updates.',
            },
            202
          );
        }
      }
    }

    // Extract content
    const isPdf = isPdfUrl(url);
    let title: string;
    let textContent: string;
    let wordCount: number;

    try {
      if (isPdf) {
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
      if (errorCode === ErrorCodes.PARSE_FAILED) {
        return c.json({ error: createApiError(ErrorCodes.PARSE_FAILED) }, 422);
      }
      if (errorCode === ErrorCodes.FETCH_FAILED) {
        return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 422);
      }
      if (errorCode === ErrorCodes.PDF_TOO_LARGE) {
        return c.json({ error: createApiError(ErrorCodes.PDF_TOO_LARGE) }, 422);
      }
      if (errorCode === ErrorCodes.PDF_PASSWORD_PROTECTED) {
        return c.json({ error: createApiError(ErrorCodes.PDF_PASSWORD_PROTECTED) }, 422);
      }
      if (errorCode === ErrorCodes.TIMEOUT) {
        return c.json({ error: createApiError(ErrorCodes.TIMEOUT) }, 408);
      }

      logger.error({ url, error }, 'Extraction failed');
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

    logger.info({ url, title, wordCount }, 'Content extracted successfully');

    // Check if TTS is configured
    if (!process.env.FISH_AUDIO_API_KEY) {
      logger.warn('Fish Audio API key not configured - returning extraction only');
      return c.json({
        status: 'extraction_only',
        title,
        wordCount,
        contentType: isPdf ? 'pdf' : 'html',
        message: 'TTS not configured - content extracted but audio not generated',
      });
    }

    // Check if storage is configured
    if (!isStorageConfigured()) {
      logger.warn('R2 storage not configured - returning extraction only');
      return c.json({
        status: 'extraction_only',
        title,
        wordCount,
        contentType: isPdf ? 'pdf' : 'html',
        message: 'Storage not configured - content extracted but audio not generated',
      });
    }

    // Generate TTS
    let ttsResult;
    try {
      ttsResult = await generateSpeech({
        text: textContent,
        voiceId,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'TTS failed';
      await updateCacheFailed(urlHash, errorMsg);

      if (errorMsg === ErrorCodes.TIMEOUT) {
        return c.json({ error: createApiError(ErrorCodes.TIMEOUT) }, 408);
      }

      return c.json({ error: createApiError(ErrorCodes.TTS_FAILED) }, 500);
    }

    // Upload to R2
    let uploadResult;
    try {
      uploadResult = await uploadAudio(ttsResult.audioBuffer, { urlHash });
    } catch (error) {
      await updateCacheFailed(urlHash, 'Upload failed');
      logger.error({ error }, 'R2 upload failed');
      return c.json({ error: createApiError(ErrorCodes.TTS_FAILED) }, 500);
    }

    // Update cache with success
    let cacheEntryId: string | null = null;
    if (isCacheConfigured()) {
      await updateCacheReady({
        urlHash,
        title,
        audioUrl: uploadResult.url,
        durationSeconds: ttsResult.durationSeconds,
        wordCount,
        fileSizeBytes: uploadResult.size,
      });

      // Get the cache entry ID to add to user's library
      const cacheEntry = await getCacheEntry(urlHash);
      cacheEntryId = cacheEntry?.id || null;
    }

    // Add to user's library
    if (supabase && userId && cacheEntryId) {
      const { error: libraryError } = await supabase
        .from('user_library')
        .upsert(
          { user_id: userId, audio_id: cacheEntryId },
          { onConflict: 'user_id,audio_id' }
        );

      if (libraryError) {
        logger.error({ error: libraryError, userId, cacheEntryId }, 'Failed to add to library');
      } else {
        logger.info({ userId, cacheEntryId }, 'Added to user library');
      }
    }

    // Increment generation counter for free users
    if (supabase && userId && rateLimit && !rateLimit.isPro) {
      await incrementGenerationCount(userId, supabase);
    }

    logger.info(
      { url, title, audioUrl: uploadResult.url, duration: ttsResult.durationSeconds },
      'Generation complete'
    );

    // Calculate remaining after this generation
    const newRemaining = rateLimit && !rateLimit.isPro
      ? Math.max(0, rateLimit.remaining - 1)
      : null;

    return c.json({
      status: 'ready',
      audioUrl: uploadResult.url,
      title,
      duration: ttsResult.durationSeconds,
      wordCount,
      contentType: isPdf ? 'pdf' : 'html',
      remaining: newRemaining,
    });
  } catch (error) {
    logger.error({ error }, 'Generation failed');
    return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 500);
  }
});

export default app;
