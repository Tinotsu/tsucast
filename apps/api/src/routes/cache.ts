import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { normalizeUrl, hashUrlWithVoice } from '../utils/url.js';
import { getSupabase } from '../lib/supabase.js';

const app = new Hono();

// Valid voice ID pattern - alphanumeric with optional hyphens/underscores, max 64 chars
const voiceIdSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]+$/, 'Voice ID must be alphanumeric')
  .max(64, 'Voice ID too long')
  .default('default');

/**
 * GET /api/cache/check
 *
 * Check if a URL has cached audio available.
 * This is a public endpoint - no auth required.
 *
 * Query params:
 * - url: The URL to check (will be hashed internally)
 * - voiceId: Optional voice ID (defaults to 'default')
 *
 * Returns:
 * - { cached: true, audioUrl, title, duration } if found
 * - { cached: false } if not found
 */
app.get('/check', async (c) => {
  const url = c.req.query('url');
  const voiceIdRaw = c.req.query('voiceId') || 'default';

  // Validate voiceId
  const voiceIdResult = voiceIdSchema.safeParse(voiceIdRaw);
  if (!voiceIdResult.success) {
    return c.json({ error: 'Invalid voiceId parameter' }, 400);
  }
  const voiceId = voiceIdResult.data;

  if (!url) {
    return c.json({ error: 'Missing url parameter' }, 400);
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return c.json({ error: 'Invalid URL format' }, 400);
  }

  // Normalize URL and create hash for lookup (must match generate route)
  const normalizedUrl = normalizeUrl(url);
  const urlHash = hashUrlWithVoice(normalizedUrl, voiceId);

  // Check if Supabase is configured
  const supabase = getSupabase();
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
