/**
 * User Routes
 *
 * Handles user profile and subscription endpoints.
 * Story: 5-1 Free Tier Implementation
 */

import { Hono } from 'hono';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { getRateLimitStatus } from '../services/rate-limit.js';

const app = new Hono();

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

  try {
    const status = await getRateLimitStatus(userId, client);

    return c.json({
      tier: status.tier,
      used: status.used,
      limit: status.limit,
      remaining: status.remaining,
      resetAt: status.resetAt,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get rate limit status');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to get limit status' } }, 500);
  }
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
