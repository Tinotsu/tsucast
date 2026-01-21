import { Hono } from 'hono';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger.js';

const app = new Hono();

// Initialize Supabase client for cache lookups (singleton)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create singleton client if configured
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Create URL hash for cache lookup (matches generate route)
 */
function createUrlHash(url: string, voiceId: string): string {
  return createHash('sha256').update(`${url}:${voiceId}`).digest('hex');
}

/**
 * GET /api/cache/check
 *
 * Check if a URL has cached audio available.
 * This is a public endpoint - no auth required.
 *
 * Query params:
 * - url: The URL to check (will be hashed internally)
 * - voiceId: Optional voice ID (defaults to 'alloy')
 *
 * Returns:
 * - { cached: true, audioUrl, title, duration } if found
 * - { cached: false } if not found
 */
app.get('/check', async (c) => {
  const url = c.req.query('url');
  const voiceId = c.req.query('voiceId') || 'alloy';

  if (!url) {
    return c.json({ error: 'Missing url parameter' }, 400);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return c.json({ error: 'Invalid URL format' }, 400);
  }

  // Create hash for lookup
  const urlHash = createUrlHash(url, voiceId);

  // Check if Supabase is configured
  if (!supabase) {
    logger.warn('Supabase not configured, cache check disabled');
    return c.json({ cached: false });
  }

  try {

    // Query audio_cache table for this URL hash
    const { data: cached, error } = await supabase
      .from('audio_cache')
      .select('id, audio_url, title, duration_seconds, status')
      .eq('url_hash', urlHash)
      .single();

    if (error) {
      // Table doesn't exist or no row found - not an error, just not cached
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return c.json({ cached: false });
      }

      logger.error({ error, urlHash }, 'Cache check failed');
      return c.json({ cached: false });
    }

    // Only return as cached if status is 'ready'
    if (cached && cached.status === 'ready') {
      return c.json({
        cached: true,
        audioId: cached.id,
        audioUrl: cached.audio_url,
        title: cached.title,
        duration: cached.duration_seconds,
      });
    }

    return c.json({ cached: false });
  } catch (err) {
    logger.error({ err, urlHash }, 'Cache check error');
    return c.json({ cached: false });
  }
});

export default app;
