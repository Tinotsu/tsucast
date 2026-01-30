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
import { parseHtmlContent, Chapter } from '../services/parser.js';
import { parsePdfContent, isImageOnlyPdf } from '../services/pdfParser.js';
import { generateSpeech } from '../services/tts.js';
import { uploadAudio, uploadTranscript, isStorageConfigured } from '../services/storage.js';
import type { TtsToken } from '../services/tts.js';
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
import { getPostHog } from '../lib/posthog.js';
import { getUserFromToken } from '../middleware/auth.js';
import {
  previewCreditCost,
  deductCredits,
  estimateDurationFromWords,
  getUserCreditBalance,
} from '../services/credits.js';

const app = new Hono();

const generateSchema = z.object({
  url: z.string().url(),
  voiceId: z.string(),
});

// Transcript JSON schema (v1)
interface TranscriptWord {
  text: string;
  start_ts: number;
  end_ts: number;
}

interface TranscriptChapter {
  title: string;
  start_ts: number;
  word_index: number;
}

interface TranscriptJson {
  version: number;
  title: string;
  words: TranscriptWord[];
  chapters: TranscriptChapter[];
}

/**
 * Build transcript JSON from TTS tokens and chapter markers
 * Maps chapter charIndex to word timestamps using cumulative character counting
 */
function buildTranscript(
  title: string,
  tokens: TtsToken[],
  chapters: Chapter[],
  textContent: string
): TranscriptJson {
  // Build words array from tokens
  const words: TranscriptWord[] = tokens.map((token) => ({
    text: token.text,
    start_ts: token.start_ts,
    end_ts: token.end_ts,
  }));

  // Map chapters from charIndex to word_index and start_ts
  // Algorithm: accumulate character positions to find which word corresponds to each chapter
  const transcriptChapters: TranscriptChapter[] = [];

  if (chapters.length > 0 && words.length > 0) {
    // Build cumulative character count for each word
    // Each word is followed by a space (except the last)
    let cumChars = 0;
    const wordCharPositions: number[] = [];

    for (let i = 0; i < words.length; i++) {
      wordCharPositions.push(cumChars);
      cumChars += words[i].text.length + 1; // +1 for space
    }

    // For each chapter, find the word whose cumulative position is closest
    for (const chapter of chapters) {
      // Find first word where cumChars >= chapter.charIndex
      let wordIndex = 0;
      for (let i = 0; i < wordCharPositions.length; i++) {
        if (wordCharPositions[i] >= chapter.charIndex) {
          wordIndex = i;
          break;
        }
        // If we reach the end, use the last word
        if (i === wordCharPositions.length - 1) {
          wordIndex = i;
        }
      }

      transcriptChapters.push({
        title: chapter.title,
        start_ts: words[wordIndex].start_ts,
        word_index: wordIndex,
      });
    }
  }

  return {
    version: 1,
    title,
    words,
    chapters: transcriptChapters,
  };
}


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
      transcriptUrl: entry.transcript_url,
    });
  }

  return c.json({ status: entry.status }, 202);
});

/**
 * Preview credit cost before generation
 * Returns estimated duration, credits needed, and whether it's cached
 */
app.post('/preview', async (c) => {
  try {
    const body = await c.req.json();
    const { url, voiceId } = body;

    if (!url) {
      return c.json({ error: createApiError(ErrorCodes.INVALID_URL, 'URL is required') }, 400);
    }

    // Require authentication
    const userId = await getUserFromToken(c.req.header('Authorization'));
    if (!userId) {
      return c.json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      }, 401);
    }

    // Normalize URL and generate hash
    const normalizedUrl = normalizeUrl(url);
    const urlHash = hashUrlWithVoice(normalizedUrl, voiceId || 'default');

    // Check cache and estimate credits
    const preview = await previewCreditCost(userId, urlHash);

    // If not cached, try to estimate from URL (quick fetch for word count)
    if (!preview.isCached && preview.estimatedMinutes === 0) {
      try {
        const isPdf = isPdfUrl(url);
        let wordCount = 0;

        if (isPdf) {
          const { buffer, filename } = await fetchPdf(url);
          const pdfResult = await parsePdfContent(buffer, filename);
          wordCount = pdfResult.wordCount;
        } else {
          const html = await fetchUrl(url);
          const htmlResult = await parseHtmlContent(html, url);
          wordCount = htmlResult.wordCount;
        }

        const estimatedMinutes = estimateDurationFromWords(wordCount);
        const balance = await getUserCreditBalance(userId);

        // Recalculate with actual word count
        const { calculateCreditsNeeded } = await import('../services/credits.js');
        const calculation = calculateCreditsNeeded(
          estimatedMinutes,
          balance?.timeBank ?? 0
        );

        return c.json({
          isCached: false,
          estimatedMinutes,
          wordCount,
          creditsNeeded: calculation.creditsNeeded,
          currentCredits: balance?.credits ?? 0,
          currentTimeBank: balance?.timeBank ?? 0,
          hasSufficientCredits: (balance?.credits ?? 0) >= calculation.creditsNeeded,
        });
      } catch (error) {
        // If fetch fails, return preview with unknown duration
        logger.warn({ url, error }, 'Failed to estimate article length');
        return c.json({
          isCached: false,
          estimatedMinutes: 0,
          creditsNeeded: 1, // Assume at least 1 credit
          currentCredits: preview.currentCredits,
          currentTimeBank: preview.currentTimeBank,
          hasSufficientCredits: preview.currentCredits >= 1,
          estimationFailed: true,
        });
      }
    }

    return c.json(preview);
  } catch (error) {
    logger.error({ error }, 'Preview failed');
    return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 500);
  }
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

      // Check if user has credits
      const userCredits = await getUserCreditBalance(userId);
      const hasCredits = userCredits && userCredits.credits > 0;

      if (!hasCredits) {
        logger.info({ userId }, 'Insufficient credits');
        return c.json({ error: createApiError(ErrorCodes.INSUFFICIENT_CREDITS) }, 402);
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
    let cover: string | undefined;
    let chapters: Chapter[] = [];

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
        // PDFs don't have og:image or chapters - these stay empty
      } else {
        logger.info({ url }, 'Extracting HTML content');
        const html = await fetchUrl(url);
        const htmlResult = await parseHtmlContent(html, url);

        title = htmlResult.title;
        textContent = htmlResult.textContent;
        wordCount = htmlResult.wordCount;
        cover = htmlResult.image; // og:image extracted by parser
        chapters = htmlResult.chapters; // chapters extracted from headings
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
    if (!process.env.KOKORO_API_URL) {
      logger.warn('Kokoro TTS not configured - returning extraction only');
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

      if (userId) {
        getPostHog()?.capture({
          distinctId: userId,
          event: 'article_generation_failed',
          properties: { url_hash: urlHash, error_code: errorMsg },
        });
      }

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

    // Build and upload transcript if tokens are available
    let transcriptUrl: string | null = null;
    if (ttsResult.tokens && ttsResult.tokens.length > 0) {
      try {
        const transcript = buildTranscript(
          title,
          ttsResult.tokens,
          chapters,
          textContent
        );
        const transcriptJson = JSON.stringify(transcript);
        const transcriptResult = await uploadTranscript(transcriptJson, { urlHash });
        transcriptUrl = transcriptResult.url;
        logger.info({ urlHash, wordCount: transcript.words.length, chapterCount: transcript.chapters.length }, 'Transcript uploaded');
      } catch (error) {
        // Transcript upload failure is non-fatal - log and continue
        logger.error({ error, urlHash }, 'Transcript upload failed - continuing without transcript');
        // transcriptUrl remains null
      }
    } else {
      logger.info({ urlHash }, 'No tokens available - skipping transcript generation');
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
        cover: cover || null,
        transcriptUrl,
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

    // Deduct credits
    let creditBalance = null;
    const durationMinutes = Math.round(ttsResult.durationSeconds / 60);

    if (supabase && userId) {
      try {
        creditBalance = await deductCredits(
          userId,
          durationMinutes,
          `Generated: ${title}`,
          { url, wordCount, durationMinutes, cacheEntryId }
        );

        if (!creditBalance) {
          // TOCTOU: credits were drained between initial check and deduction
          logger.warn({ userId }, 'Credit deduction failed - insufficient credits (TOCTOU)');
          return c.json({ error: createApiError(ErrorCodes.INSUFFICIENT_CREDITS) }, 402);
        }

        logger.info(
          { userId, newBalance: creditBalance.credits },
          'Credits deducted'
        );
      } catch (error) {
        // DB error during deduction — do not serve audio URL
        logger.error({ userId, error }, 'Credit deduction threw an error');
        return c.json({ error: createApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to process credits. Please try again.') }, 500);
      }
    }

    logger.info(
      { url, title, audioUrl: uploadResult.url, duration: ttsResult.durationSeconds },
      'Generation complete'
    );

    // Analytics: track successful generation
    if (userId) {
      getPostHog()?.capture({
        distinctId: userId,
        event: 'article_generated',
        properties: {
          url_hash: urlHash,
          duration_seconds: ttsResult.durationSeconds,
          word_count: wordCount,
          voice_id: voiceId,
          cached: false,
        },
      });

      // Track credits_depleted if balance dropped to zero
      if (creditBalance && creditBalance.credits === 0) {
        getPostHog()?.capture({
          distinctId: userId,
          event: 'credits_depleted',
        });
      }
    }

    return c.json({
      status: 'ready',
      audioUrl: uploadResult.url,
      transcriptUrl,
      title,
      duration: ttsResult.durationSeconds,
      wordCount,
      contentType: isPdf ? 'pdf' : 'html',
      credits: creditBalance ? {
        balance: creditBalance.credits,
        timeBank: creditBalance.timeBank,
      } : undefined,
    });
  } catch (error) {
    logger.error({ error }, 'Generation failed');
    return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 500);
  }
});

export default app;
