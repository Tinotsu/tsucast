/**
 * Webhooks Route
 *
 * Handles webhooks from external services.
 * Story: 5-3 In-App Purchase Integration, 8-1 MVP Launch Blockers
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger.js';

const webhooks = new Hono();

// Initialize Supabase client (lazy loaded)
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase(): ReturnType<typeof createClient> | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
}

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

  if (authHeader !== expectedAuth) {
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
    case 'UNCANCELLATION':
      // User subscribed or renewed - upgrade to pro
      logger.info({ appUserId, eventType }, 'Upgrading user to pro');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', appUserId);
      break;

    case 'CANCELLATION':
    case 'EXPIRATION':
      // Subscription ended - downgrade to free
      logger.info({ appUserId, eventType }, 'Downgrading user to free');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', appUserId);
      break;

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
