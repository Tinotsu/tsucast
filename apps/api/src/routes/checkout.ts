/**
 * Checkout Routes
 *
 * Handles Stripe checkout for credit purchases.
 * Story: 10-1 Web Article Credit Pricing
 */

import { Hono } from 'hono';
import Stripe from 'stripe';
import { logger } from '../lib/logger.js';
import { getUserFromToken } from '../middleware/auth.js';
import { CREDIT_PACKS, type CreditPackId } from '../services/credits.js';

const app = new Hono();

// ISSUE 2 FIX: In-memory rate limiter for checkout (per user)
// Limit: 10 checkout attempts per user per hour
const checkoutAttempts = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of checkoutAttempts.entries()) {
    if (entry.resetAt <= now) {
      checkoutAttempts.delete(userId);
    }
  }
}, 10 * 60 * 1000);

const CHECKOUT_RATE_LIMIT = 10; // max attempts per window
const CHECKOUT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkCheckoutRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = checkoutAttempts.get(userId);

  // Create new entry or reset if window expired
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + CHECKOUT_WINDOW_MS };
    checkoutAttempts.set(userId, entry);
  }

  // Increment counter
  entry.count++;

  const remaining = Math.max(0, CHECKOUT_RATE_LIMIT - entry.count);
  return {
    allowed: entry.count <= CHECKOUT_RATE_LIMIT,
    remaining,
  };
}

// Initialize Stripe (lazy)
let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripe;
}

// Stripe price IDs — read lazily so env vars can be set after module load
function getStripePriceIds(): Record<CreditPackId, string> {
  return {
    coffee: process.env.STRIPE_PRICE_COFFEE || '',
    kebab: process.env.STRIPE_PRICE_KEBAB || '',
    pizza: process.env.STRIPE_PRICE_PIZZA || '',
    feast: process.env.STRIPE_PRICE_FEAST || '',
  };
}

/**
 * Create a Stripe checkout session for credit purchase
 */
app.post('/credits', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  // ISSUE 2 FIX: Check rate limit before creating checkout session
  const rateLimit = checkCheckoutRateLimit(userId);
  c.header('X-RateLimit-Limit', CHECKOUT_RATE_LIMIT.toString());
  c.header('X-RateLimit-Remaining', rateLimit.remaining.toString());

  if (!rateLimit.allowed) {
    logger.warn({ userId }, 'Checkout rate limit exceeded');
    return c.json({
      error: { code: 'RATE_LIMITED', message: 'Too many checkout attempts. Please try again later.' },
    }, 429);
  }

  const stripeClient = getStripe();
  if (!stripeClient) {
    logger.warn('Stripe not configured');
    return c.json({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Payments not configured' },
    }, 503);
  }

  const body = await c.req.json();
  const { packId } = body as { packId: string };

  // Validate pack ID
  if (!packId || !(packId in CREDIT_PACKS)) {
    return c.json({
      error: { code: 'INVALID_REQUEST', message: 'Invalid credit pack' },
    }, 400);
  }

  const pack = CREDIT_PACKS[packId as CreditPackId];
  const priceId = getStripePriceIds()[packId as CreditPackId];

  if (!priceId) {
    logger.error({ packId }, 'Stripe price ID not configured for pack');
    return c.json({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'This pack is not available' },
    }, 503);
  }

  logger.info({ userId, packId, credits: pack.credits }, 'Creating checkout session');

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.WEB_URL || 'http://localhost:3000'}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEB_URL || 'http://localhost:3000'}/upgrade`,
      client_reference_id: userId,
      metadata: {
        userId,
        packId,
        credits: pack.credits.toString(),
      },
    });

    logger.info({ userId, sessionId: session.id }, 'Checkout session created');

    return c.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error({ error, userId, packId }, 'Failed to create checkout session');
    return c.json({
      error: { code: 'CHECKOUT_FAILED', message: 'Failed to create checkout session' },
    }, 500);
  }
});

/**
 * Get checkout session status (for success page)
 * ISSUE 3 FIX: Requires authentication and verifies session ownership
 */
app.get('/session/:sessionId', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const sessionId = c.req.param('sessionId');

  const stripeClient = getStripe();
  if (!stripeClient) {
    return c.json({
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Payments not configured' },
    }, 503);
  }

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    // ISSUE 3 FIX: Verify the session belongs to the authenticated user
    const sessionUserId = session.metadata?.userId || session.client_reference_id;
    if (sessionUserId !== userId) {
      logger.warn({ userId, sessionUserId, sessionId }, 'User attempted to access another user\'s checkout session');
      return c.json({
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      }, 403);
    }

    return c.json({
      status: session.payment_status,
      credits: session.metadata?.credits ? parseInt(session.metadata.credits, 10) : null,
      packId: session.metadata?.packId || null,
    });
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to retrieve checkout session');
    return c.json({
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    }, 404);
  }
});

export default app;
