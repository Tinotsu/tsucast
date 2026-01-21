/**
 * User Routes
 *
 * Handles user profile and subscription endpoints.
 * Story: 5-1 Free Tier Implementation
 */

import { Hono } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger.js';

const app = new Hono();

// Initialize Supabase client (lazy loaded)
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) {
    return supabase;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Extract user ID from Supabase JWT token
 */
async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const client = getSupabase();
  if (!client) {
    return null;
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user.id;
  } catch {
    return null;
  }
}

const FREE_TIER_LIMIT = 3;

// Get user's limit status
app.get('/limit', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  logger.info({ userId }, 'Getting limit status');

  const { data: profile, error } = await client
    .from('user_profiles')
    .select('subscription_tier, daily_generations, daily_generations_reset_at')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error({ error, userId }, 'Failed to get user profile');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to get profile' } }, 500);
  }

  // Check if reset needed (new day)
  const now = new Date();
  const resetAt = profile?.daily_generations_reset_at
    ? new Date(profile.daily_generations_reset_at)
    : null;

  let generations = profile?.daily_generations || 0;

  // If reset_at is in the past or doesn't exist, reset counter
  if (!resetAt || resetAt <= now) {
    generations = 0;

    // Calculate next midnight UTC
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    await client
      .from('user_profiles')
      .update({
        daily_generations: 0,
        daily_generations_reset_at: tomorrow.toISOString(),
      })
      .eq('id', userId);
  }

  const isPro = profile?.subscription_tier === 'pro';

  return c.json({
    tier: profile?.subscription_tier || 'free',
    used: isPro ? 0 : generations,
    limit: isPro ? null : FREE_TIER_LIMIT,
    remaining: isPro ? null : Math.max(0, FREE_TIER_LIMIT - generations),
    resetAt: isPro ? null : profile?.daily_generations_reset_at,
  });
});

// Get user profile
app.get('/profile', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  const { data: profile, error } = await client
    .from('user_profiles')
    .select('id, email, subscription_tier, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error({ error, userId }, 'Failed to get user profile');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to get profile' } }, 500);
  }

  return c.json({ profile });
});

/**
 * Delete user account and all associated data
 * Required by App Store guidelines (Apple policy since June 2022)
 */
app.delete('/account', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  logger.info({ userId }, 'Deleting user account');

  try {
    // Delete in order respecting foreign key constraints:
    // 1. playlist_items (references playlists)
    // 2. playlists (references user_id)
    // 3. user_library (references user_id)
    // 4. user_profiles (references auth.users)
    // 5. auth.users (via admin API)

    // Get user's playlists first
    const { data: playlists } = await client
      .from('playlists')
      .select('id')
      .eq('user_id', userId);

    // Delete playlist items for user's playlists
    if (playlists && playlists.length > 0) {
      const playlistIds = playlists.map(p => p.id);
      await client
        .from('playlist_items')
        .delete()
        .in('playlist_id', playlistIds);
    }

    // Delete playlists
    await client
      .from('playlists')
      .delete()
      .eq('user_id', userId);

    // Delete library items
    await client
      .from('user_library')
      .delete()
      .eq('user_id', userId);

    // Delete user profile
    await client
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    // Delete auth user (this is irreversible)
    const { error } = await client.auth.admin.deleteUser(userId);

    if (error) {
      logger.error({ error, userId }, 'Failed to delete auth user');
      throw error;
    }

    logger.info({ userId }, 'User account deleted successfully');
    return c.json({ success: true });
  } catch (error) {
    logger.error({ error, userId }, 'Account deletion failed');
    return c.json({
      error: {
        code: 'DELETION_FAILED',
        message: 'Failed to delete account. Please try again.'
      }
    }, 500);
  }
});

export default app;
