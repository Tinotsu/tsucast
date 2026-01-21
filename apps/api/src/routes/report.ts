/**
 * Report Routes
 *
 * API endpoints for extraction failure reporting.
 * Story: 2-4 Extraction Error Reporting
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

const app = new Hono();

// Initialize Supabase client (singleton)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Request schema
const reportSchema = z.object({
  url: z.string().url(),
  errorType: z.string().min(1),
  errorMessage: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Normalize URL for deduplication (simple version for server-side)
 */
function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());

    // Lowercase hostname and remove www
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Remove trailing slash (except root)
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    // Remove common tracking params
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Remove fragment
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return null;
  }
}

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

  // Try to get user from auth header (optional)
  let userId: string | null = null;
  const authHeader = c.req.header('Authorization');

  if (supabase && authHeader?.startsWith('Bearer ')) {
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

  // Check if Supabase is configured
  if (!supabase) {
    logger.warn('Supabase not configured, report not stored');
    // Still return success to not frustrate user
    return c.json({
      success: true,
      message: "Thanks! We'll work on improving this.",
    });
  }

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
