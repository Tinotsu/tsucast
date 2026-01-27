/**
 * Webhooks Route
 *
 * Handles webhooks from external services.
 * Story: 5-3 In-App Purchase Integration, 8-1 MVP Launch Blockers
 */

import { Hono } from 'hono';
import { timingSafeEqual } from 'crypto';
import Stripe from 'stripe';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { addCredits, CREDIT_PACKS, type CreditPackId } from '../services/credits.js';

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

/**
 * Stripe Webhook
 *
 * Handles payment events from Stripe.
 * Adds credits to user account on successful payment.
 *
 * Authentication: Stripe uses webhook signature verification.
 * Configure STRIPE_WEBHOOK_SECRET in environment variables.
 *
 * See: https://stripe.com/docs/webhooks
 */
webhooks.post('/stripe', async (c) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeSecretKey) {
    logger.warn('Stripe webhook received but not configured');
    return c.json({ error: 'Webhook not configured' }, 503);
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
  });

  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    logger.warn('Stripe webhook missing signature');
    return c.json({ error: 'Missing signature' }, 401);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn({ error: message }, 'Stripe webhook signature verification failed');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  logger.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe event');

  const supabase = getSupabase();
  if (!supabase) {
    logger.error('Supabase not configured for Stripe webhook processing');
    return c.json({ error: 'Database not configured' }, 503);
  }

  // Handle checkout session completed (successful payment)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process paid sessions
    if (session.payment_status !== 'paid') {
      logger.info({ sessionId: session.id, status: session.payment_status }, 'Ignoring unpaid session');
      return c.json({ received: true });
    }

    const userId = session.metadata?.userId || session.client_reference_id;
    const packId = session.metadata?.packId as string | undefined;
    const creditsFromMeta = session.metadata?.credits;

    if (!userId) {
      logger.error({ sessionId: session.id }, 'Stripe webhook missing userId');
      return c.json({ error: 'Missing userId' }, 400);
    }

    // ISSUE 1 FIX: Check idempotency - was this session already processed?
    const { data: existingTx } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('type', 'purchase')
      .filter('metadata->>stripeSessionId', 'eq', session.id)
      .maybeSingle();

    if (existingTx) {
      logger.info({ sessionId: session.id }, 'Stripe session already processed, skipping duplicate');
      return c.json({ received: true });
    }

    // Determine credits to add
    let credits = 0;
    if (creditsFromMeta) {
      credits = parseInt(creditsFromMeta, 10);
    } else if (packId && packId in CREDIT_PACKS) {
      credits = CREDIT_PACKS[packId as CreditPackId].credits;
    } else if (packId) {
      logger.warn({ packId, sessionId: session.id }, 'Unknown credit pack ID in webhook — may be legacy session');
    }

    // ISSUE 5 FIX: Validate credit amount properly (NaN check)
    if (Number.isNaN(credits) || credits <= 0) {
      logger.error({ sessionId: session.id, packId, creditsFromMeta }, 'Invalid credit amount');
      return c.json({ error: 'Invalid credit amount' }, 400);
    }

    try {
      const balance = await addCredits(
        userId,
        credits,
        `Purchased ${packId || 'credits'} pack`,
        {
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          stripeChargeId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          packId,
          amountPaid: session.amount_total,
        }
      );

      logger.info(
        { userId, credits, newBalance: balance?.credits, sessionId: session.id },
        'Credits added successfully'
      );
    } catch (error) {
      logger.error({ error, userId, credits, sessionId: session.id }, 'Failed to add credits');
      // Return 500 to have Stripe retry - idempotency check above prevents duplicates
      return c.json({ error: 'Failed to add credits' }, 500);
    }
  }

  // ISSUE 7 FIX: Handle refund automatically
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;

    logger.info({ chargeId: charge.id, paymentIntent: charge.payment_intent }, 'Processing refund event');

    // Find the original transaction by payment intent
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    if (!paymentIntentId) {
      logger.warn({ chargeId: charge.id }, 'Refund event missing payment intent');
      return c.json({ received: true });
    }

    // Look up the original purchase transaction
    const { data: originalTx } = await supabase
      .from('credit_transactions')
      .select('user_id, credits, metadata')
      .eq('type', 'purchase')
      .filter('metadata->>stripePaymentIntent', 'eq', paymentIntentId)
      .maybeSingle();

    if (!originalTx) {
      logger.warn({ paymentIntentId }, 'Could not find original transaction for refund');
      return c.json({ received: true });
    }

    // Check if refund was already processed
    const { data: existingRefund } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('type', 'refund')
      .filter('metadata->>stripeChargeId', 'eq', charge.id)
      .maybeSingle();

    if (existingRefund) {
      logger.info({ chargeId: charge.id }, 'Refund already processed, skipping duplicate');
      return c.json({ received: true });
    }

    // Calculate credits to remove (proportional to refund amount if partial)
    const originalAmount = (originalTx.metadata as Record<string, unknown>)?.amountPaid as number || 0;
    const refundedAmount = charge.amount_refunded;
    const originalCredits = originalTx.credits;

    let creditsToRemove = originalCredits;
    if (originalAmount > 0 && refundedAmount < originalAmount) {
      // Partial refund - proportional credit removal
      creditsToRemove = Math.ceil((refundedAmount / originalAmount) * originalCredits);
    }

    if (creditsToRemove > 0) {
      try {
        // TODO: Create `deduct_credits_for_refund` RPC in Supabase to make this atomic.
        // The fallback path below has a race condition (read-then-update) if two
        // refund webhooks fire concurrently for the same user.
        const { error: refundError } = await supabase.rpc('deduct_credits_for_refund', {
          p_user_id: originalTx.user_id,
          p_credits: creditsToRemove,
          p_description: `Refund for charge ${charge.id}`,
          p_metadata: {
            stripeChargeId: charge.id,
            stripePaymentIntent: paymentIntentId,
            originalCredits,
            refundedAmount,
          },
        });

        if (refundError) {
          // If RPC function doesn't exist yet, fall back to manual update
          logger.warn({ error: refundError }, 'deduct_credits_for_refund RPC failed, using manual update');

          // Get current balance first
          const { data: currentProfile } = await supabase
            .from('user_profiles')
            .select('credits_balance')
            .eq('id', originalTx.user_id)
            .single();

          const currentBalance = currentProfile?.credits_balance ?? 0;
          const newBalance = Math.max(0, currentBalance - creditsToRemove);

          await supabase
            .from('user_profiles')
            .update({ credits_balance: newBalance })
            .eq('id', originalTx.user_id);

          // Record the refund transaction
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: originalTx.user_id,
              type: 'refund',
              credits: -creditsToRemove,
              description: `Refund for charge ${charge.id}`,
              metadata: {
                stripeChargeId: charge.id,
                stripePaymentIntent: paymentIntentId,
                originalCredits,
                refundedAmount,
              },
            });
        }

        logger.info(
          { userId: originalTx.user_id, creditsRemoved: creditsToRemove, chargeId: charge.id },
          'Credits removed for refund'
        );
      } catch (error) {
        logger.error({ error, chargeId: charge.id }, 'Failed to process refund credit removal');
      }
    }
  }

  return c.json({ received: true });
});

export default webhooks;
