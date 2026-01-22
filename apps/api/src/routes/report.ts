/**
 * Report Routes
 *
 * API endpoints for extraction failure reporting.
 * Story: 2-4 Extraction Error Reporting
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { normalizeUrl } from '../utils/url.js';

const app = new Hono();

// Request schema
const reportSchema = z.object({
  url: z.string().url(),
  errorType: z.string().min(1),
  errorMessage: z.string().optional(),
  notes: z.string().optional(),
});


/**
 * POST /api/report/extraction
 *
 * Submit a report when content extraction fails.
 * Auth is optional - anonymous reports are accepted.
 */
app.post('/extraction', async (c) => {
  // Validate request body
  const body = await c.req.json().catch(() => ({}));
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        message: 'Invalid report data',
      },
      400
    );
  }

  const { url, errorType, errorMessage, notes } = parsed.data;

  // Get centralized Supabase client
  const supabase = getSupabase();

  // Check if Supabase is configured
  if (!supabase) {
    logger.warn('Supabase not configured, report not stored');
    // Still return success to not frustrate user
    return c.json({
      success: true,
      message: "Thanks! We'll work on improving this.",
    });
  }

  // Try to get user from auth header (optional)
  let userId: string | null = null;
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    } catch {
      // Auth failed, proceed as anonymous
    }
  }

  // Normalize URL for deduplication
  const normalizedUrl = normalizeUrl(url);

  // Get user agent
  const userAgent = c.req.header('User-Agent') || null;

  try {
    // Insert report
    const { error } = await supabase.from('extraction_reports').insert({
      url,
      normalized_url: normalizedUrl,
      error_type: errorType,
      error_message: errorMessage || null,
      user_id: userId,
      user_agent: userAgent,
      notes: notes || null,
    });

    if (error) {
      logger.error({ error, url, errorType }, 'Failed to insert report');
      // Don't expose error to user
    } else {
      logger.info({ url, errorType, userId: userId || 'anonymous' }, 'Report submitted');
    }

    // Always return success to user (silent failure)
    return c.json({
      success: true,
      message: "Thanks! We'll work on improving this.",
    });
  } catch (err) {
    logger.error({ err, url }, 'Report submission error');

    // Still return success - don't frustrate the user
    return c.json({
      success: true,
      message: "Thanks! We'll work on improving this.",
    });
  }
});

export default app;
