/**
 * User Routes
 *
 * Handles user profile and subscription endpoints.
 * Story: 5-1 Free Tier Implementation, 5-3 In-App Purchase Integration
 */

import { Hono } from 'hono';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { getRateLimitStatus } from '../services/rate-limit.js';
import { getSubscriptionDetails, isRevenueCatConfigured, deleteSubscriber } from '../services/revenuecat.js';
import { getUserCreditBalance } from '../services/credits.js';
import { enrollUser } from '../services/email-sequences.js';

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

// Get subscription status from RevenueCat and sync with database
app.get('/subscription', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  logger.info({ userId }, 'Getting subscription status');

  try {
    // Get current profile
    const { data: profile } = await client
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    // If RevenueCat is configured, verify subscription status
    let revenueCatDetails = null;
    if (isRevenueCatConfigured()) {
      revenueCatDetails = await getSubscriptionDetails(userId);

      // Sync subscription tier if RevenueCat shows different status
      if (revenueCatDetails) {
        const currentTier = profile?.subscription_tier || 'free';
        const expectedTier = revenueCatDetails.isPro ? 'pro' : 'free';

        if (currentTier !== expectedTier) {
          logger.info({ userId, currentTier, expectedTier }, 'Syncing subscription tier from RevenueCat');
          await client
            .from('user_profiles')
            .update({ subscription_tier: expectedTier })
            .eq('id', userId);
        }
      }
    }

    // Get fresh rate limit status after potential sync
    const status = await getRateLimitStatus(userId, client);

    return c.json({
      tier: status.tier,
      isPro: status.tier === 'pro',
      used: status.used,
      limit: status.limit,
      remaining: status.remaining,
      resetAt: status.resetAt,
      // RevenueCat details (if available)
      subscription: revenueCatDetails ? {
        expiresAt: revenueCatDetails.expiresAt,
        productId: revenueCatDetails.productId,
        managementUrl: revenueCatDetails.managementUrl,
        store: revenueCatDetails.store,
      } : null,
    });
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get subscription status');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to get subscription status' } }, 500);
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

  // Auto-enroll in onboarding sequence (idempotent — no-ops if already enrolled)
  enrollUser(userId, 'onboarding').catch((err) => {
    logger.error({ error: err, userId }, 'Failed to auto-enroll user in onboarding sequence');
  });

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
    // Step 0: Clean up RevenueCat subscriber data (disassociate from user ID)
    // Note: This does NOT cancel subscriptions - users must do that via App Store/Play Store
    await deleteSubscriber(userId);

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

    // Delete email state
    await client
      .from('user_email_state')
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

/**
 * Get user's credit balance
 * Used by web app for article credit pricing
 */
app.get('/credits', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  logger.info({ userId }, 'Getting credit balance');

  try {
    const balance = await getUserCreditBalance(userId);

    if (!balance) {
      // Return zeros for users without credits yet
      return c.json({
        credits: 0,
        timeBank: 0,
        totalPurchased: 0,
        totalUsed: 0,
      });
    }

    return c.json(balance);
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get credit balance');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to get credit balance' } }, 500);
  }
});

export default app;
