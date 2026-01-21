import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { fetchUrl, isPdfUrl, fetchPdf } from '../services/fetcher.js';
import { parseHtmlContent } from '../services/parser.js';
import { parsePdfContent, isImageOnlyPdf } from '../services/pdfParser.js';
import {
  ErrorCodes,
  createApiError,
  LIMITS,
} from '../utils/errors.js';

const app = new Hono();

const generateSchema = z.object({
  url: z.string().url(),
  voiceId: z.string(),
});

// Check if audio exists in cache (legacy endpoint - use /api/cache/check instead)
app.get('/cache', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }

  // TODO: Implement cache lookup in Supabase
  // For now, return not cached
  return c.json({
    cached: false,
    url,
  });
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

    logger.info({ url, voiceId }, 'Starting content extraction');

    // Detect content type based on URL
    const isPdf = isPdfUrl(url);
    let title: string;
    let textContent: string;
    let wordCount: number;

    try {
      if (isPdf) {
        // PDF extraction flow
        logger.info({ url }, 'Detected PDF URL, fetching PDF');
        const { buffer, filename } = await fetchPdf(url);
        const pdfResult = await parsePdfContent(buffer, filename);

        // Check for image-only PDF
        if (isImageOnlyPdf(pdfResult)) {
          logger.warn({ url, wordCount: pdfResult.wordCount, pageCount: pdfResult.pageCount }, 'Image-only PDF detected');
          return c.json(
            { error: createApiError(ErrorCodes.IMAGE_ONLY_PDF) },
            422
          );
        }

        title = pdfResult.title;
        textContent = pdfResult.textContent;
        wordCount = pdfResult.wordCount;
      } else {
        // HTML extraction flow
        logger.info({ url }, 'Fetching HTML content');
        const html = await fetchUrl(url);
        const htmlResult = await parseHtmlContent(html, url);

        title = htmlResult.title;
        textContent = htmlResult.textContent;
        wordCount = htmlResult.wordCount;
      }
    } catch (error) {
      // Handle known extraction errors
      if (error instanceof Error) {
        const errorCode = error.message;

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
      }

      // Unknown error
      logger.error({ url, error }, 'Unexpected extraction error');
      return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 422);
    }

    // Validate word count
    if (wordCount > LIMITS.MAX_WORD_COUNT) {
      logger.warn({ url, wordCount }, 'Article exceeds word count limit');
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

    logger.info(
      { url, title, wordCount, isPdf },
      'Content extraction successful'
    );

    // TODO (Story 3.2): Implement TTS generation pipeline:
    // 1. Generate audio with Fish Audio API
    // 2. Upload to Cloudflare R2
    // 3. Cache in Supabase
    // 4. Return streaming audio URL

    return c.json({
      title,
      wordCount,
      contentType: isPdf ? 'pdf' : 'html',
      // textContent included for debugging/testing (remove in production)
      textPreview: textContent.substring(0, 500) + '...',
      // audioUrl will be added in Story 3.2
    });
  } catch (error) {
    logger.error({ error }, 'Generation failed');
    return c.json({ error: createApiError(ErrorCodes.FETCH_FAILED) }, 500);
  }
});

export default app;
