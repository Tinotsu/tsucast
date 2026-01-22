/**
 * Webhooks Route
 *
 * Handles webhooks from external services.
 * Story: 5-3 In-App Purchase Integration, 8-1 MVP Launch Blockers
 */

import { Hono } from 'hono';
import { timingSafeEqual } from 'crypto';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Returns true if strings are equal, false otherwise.
 */
function secureCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // timingSafeEqual requires equal length buffers
    if (bufA.length !== bufB.length) {
      // Still do a comparison to maintain constant time
      const padded = Buffer.alloc(bufA.length);
      timingSafeEqual(bufA, padded);
      return false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

const webhooks = new Hono();

/**
 * RevenueCat Webhook
 *
 * Handles subscription events from RevenueCat.
 * Updates user_profiles.subscription_tier based on events.
 *
 * Authentication: RevenueCat uses Bearer token authentication.
 * Configure REVENUECAT_WEBHOOK_AUTH_KEY in environment variables
 * and set it as the Authorization header value in RevenueCat dashboard.
 *
 * See: https://www.revenuecat.com/docs/webhooks
 */
webhooks.post('/revenuecat', async (c) => {
  const webhookAuthKey = process.env.REVENUECAT_WEBHOOK_AUTH_KEY;

  // If webhook auth key not configured, return early
  if (!webhookAuthKey) {
    logger.warn('RevenueCat webhook received but auth key not configured');
    return c.json({ error: 'Webhook not configured' }, 503);
  }

  // Verify Bearer token authentication
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    logger.warn('RevenueCat webhook missing Authorization header');
    return c.json({ error: 'Missing authorization' }, 401);
  }

  // RevenueCat sends: Authorization: Bearer <your_auth_key>
  const expectedAuth = `Bearer ${webhookAuthKey}`;

  // Use timing-safe comparison to prevent timing attacks
  if (!secureCompare(authHeader, expectedAuth)) {
    logger.warn('RevenueCat webhook invalid authorization');
    return c.json({ error: 'Invalid authorization' }, 401);
  }

  // Parse event
  let event;
  try {
    event = await c.req.json();
  } catch (error) {
    logger.error({ error }, 'Failed to parse RevenueCat webhook body');
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const eventType = event?.event?.type;
  const appUserId = event?.event?.app_user_id;

  if (!eventType || !appUserId) {
    logger.warn({ event }, 'RevenueCat webhook missing event type or user ID');
    return c.json({ error: 'Missing required fields' }, 400);
  }

  logger.info({ eventType, appUserId }, 'Processing RevenueCat event');

  const supabase = getSupabase();
  if (!supabase) {
    logger.error('Supabase not configured for webhook processing');
    return c.json({ error: 'Database not configured' }, 503);
  }

  // Handle subscription events
  // See: https://www.revenuecat.com/docs/webhooks#event-types
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION': {
      // User subscribed or renewed - upgrade to pro
      logger.info({ appUserId, eventType }, 'Upgrading user to pro');
      const { error: upgradeError } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', appUserId);
      if (upgradeError) {
        logger.error({ error: upgradeError, appUserId }, 'Failed to upgrade user to pro');
      }
      break;
    }

    case 'CANCELLATION':
    case 'EXPIRATION': {
      // Subscription ended - downgrade to free
      logger.info({ appUserId, eventType }, 'Downgrading user to free');
      const { error: downgradeError } = await supabase
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', appUserId);
      if (downgradeError) {
        logger.error({ error: downgradeError, appUserId }, 'Failed to downgrade user to free');
      }
      break;
    }

    case 'BILLING_ISSUE':
      // Billing issue detected - log but don't immediately downgrade
      // RevenueCat handles grace periods automatically
      logger.warn({ appUserId, eventType }, 'Billing issue detected');
      break;

    case 'SUBSCRIBER_ALIAS':
    case 'TRANSFER':
      // User identity changed - log for debugging
      logger.info({ appUserId, eventType, event }, 'User identity event');
      break;

    default:
      // Unknown event type - log but don't error
      logger.warn({ eventType, appUserId }, 'Unknown RevenueCat event type');
  }

  return c.json({ received: true });
});

export default webhooks;
