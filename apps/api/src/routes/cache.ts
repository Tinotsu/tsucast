import { Hono } from 'hono';
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
 * GET /api/cache/check
 *
 * Check if a URL (by hash) has cached audio available.
 * This is a public endpoint - no auth required.
 *
 * Query params:
 * - hash: SHA256 hash of normalized URL
 *
 * Returns:
 * - { cached: true, audioUrl, title, duration } if found
 * - { cached: false } if not found
 */
app.get('/check', async (c) => {
  const urlHash = c.req.query('hash');

  if (!urlHash) {
    return c.json({ error: 'Missing hash parameter' }, 400);
  }

  // Validate hash format (should be 64 character hex string for SHA256)
  if (!/^[a-f0-9]{64}$/i.test(urlHash)) {
    return c.json({ error: 'Invalid hash format' }, 400);
  }

  // Check if Supabase is configured
  if (!supabase) {
    logger.warn('Supabase not configured, cache check disabled');
    return c.json({ cached: false });
  }

  try {

    // Query audio_cache table for this URL hash
    const { data: cached, error } = await supabase
      .from('audio_cache')
      .select('audio_url, title, duration_seconds, status')
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
