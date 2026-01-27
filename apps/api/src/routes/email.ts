/**
 * Email Routes
 *
 * Handles unsubscribe endpoints (both authenticated JSON API and public token-based HTML).
 * Also handles Resend bounce/complaint webhooks.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { Webhook } from 'svix';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { ipRateLimit } from '../middleware/ip-rate-limit.js';
import { verifyUnsubscribeToken } from '../lib/unsubscribe-token.js';
import { unsubscribeUser } from '../services/email-sequences.js';
import { createApiError } from '../utils/errors.js';
import { escapeHtml } from '../lib/email.js';

const email = new Hono();

// --- Authenticated unsubscribe (JSON API) ---

const unsubscribeBodySchema = z.object({
  sequenceId: z.string().uuid(),
});

email.post('/unsubscribe', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const body = await c.req.json();
  const parsed = unsubscribeBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('INVALID_INPUT', 'Invalid sequenceId') }, 400);
  }

  const success = await unsubscribeUser(userId, parsed.data.sequenceId);
  if (!success) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'No enrollment found' } }, 404);
  }

  return c.json({ success: true });
});

// --- Public token-based unsubscribe (HTML pages) ---

const tokenQuerySchema = z.object({
  token: z.string().min(1),
});

// Rate limit public unsubscribe endpoints: 20 requests per minute per IP
const unsubscribeRateLimit = ipRateLimit(20, 60 * 1000);

// Step 1: Show confirmation page (prevents Gmail link prefetch from unsubscribing)
email.get('/unsubscribe', unsubscribeRateLimit, async (c) => {
  const query = tokenQuerySchema.safeParse({ token: c.req.query('token') });
  if (!query.success) {
    return c.html(errorPage('Invalid unsubscribe link.'), 400);
  }

  const result = verifyUnsubscribeToken(query.data.token);
  if (!result) {
    return c.html(errorPage('This unsubscribe link is invalid or has expired.'), 400);
  }

  return c.html(confirmationPage(query.data.token));
});

// Step 2: Process unsubscribe after user confirms
email.post('/unsubscribe/confirm', unsubscribeRateLimit, async (c) => {
  let token: string;

  // Accept form-encoded or JSON
  const contentType = c.req.header('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await c.req.parseBody();
    token = String(formData.token || '');
  } else {
    const body = await c.req.json();
    token = String(body.token || '');
  }

  if (!token) {
    return c.html(errorPage('Missing token.'), 400);
  }

  const result = verifyUnsubscribeToken(token);
  if (!result) {
    return c.html(errorPage('This unsubscribe link is invalid or has expired.'), 400);
  }

  const success = await unsubscribeUser(result.userId, result.sequenceId);
  if (!success) {
    return c.html(errorPage('Could not process your unsubscribe request. Please try again.'), 500);
  }

  return c.html(successPage());
});

// --- Resend webhook (bounce/complaint handling) ---

email.post('/webhook', async (c) => {
  const signingSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!signingSecret) {
    logger.warn('Resend webhook received but RESEND_WEBHOOK_SECRET not configured');
    return c.json({ error: 'Webhook not configured' }, 503);
  }

  // Verify Svix signature
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('Resend webhook missing Svix headers');
    return c.json({ error: 'Missing signature headers' }, 401);
  }

  const rawBody = await c.req.text();

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(signingSecret);
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>;
  } catch (err) {
    logger.warn({ error: err }, 'Resend webhook signature verification failed');
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown> | undefined;
  const toEmails = (data?.to as string[]) || [];

  logger.info({ eventType, to: toEmails }, 'Processing Resend webhook');

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: 'Database not configured' }, 503);
  }

  if (eventType === 'email.bounced' || eventType === 'email.complained') {
    for (const emailAddr of toEmails) {
      // Look up user by email
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', emailAddr)
        .maybeSingle();

      if (!profile) {
        logger.warn({ email: emailAddr }, 'Bounce/complaint for unknown email');
        continue;
      }

      // Pause (bounce) or unsubscribe (complaint) all their sequence enrollments
      const updates: Record<string, unknown> = { paused: true };
      if (eventType === 'email.complained') {
        updates.unsubscribed = true;
      }

      await supabase
        .from('user_email_state')
        .update(updates)
        .eq('user_id', profile.id);

      logger.info(
        { userId: profile.id, email: emailAddr, eventType },
        'User email state updated after bounce/complaint',
      );
    }
  }

  return c.json({ received: true });
});

// --- HTML page helpers ---

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>tsucast - Unsubscribe</title>
<style>body{font-family:sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center;color:#1a1a1a}h1{font-size:1.5rem}p{color:#666}</style></head>
<body><h1>Oops</h1><p>${escapeHtmlInline(message)}</p><p><a href="https://tsucast.app">Go to tsucast</a></p></body></html>`;
}

function confirmationPage(token: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>tsucast - Confirm Unsubscribe</title>
<style>body{font-family:sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center;color:#1a1a1a}h1{font-size:1.5rem}p{color:#666}button{margin-top:20px;padding:12px 24px;background:#000;color:#fff;border:none;border-radius:6px;font-size:1rem;cursor:pointer}button:hover{background:#333}</style></head>
<body><h1>Unsubscribe</h1><p>Are you sure you want to unsubscribe from these emails?</p>
<form method="POST" action="/api/email/unsubscribe/confirm"><input type="hidden" name="token" value="${escapeHtmlInline(token)}"><button type="submit">Confirm Unsubscribe</button></form></body></html>`;
}

function successPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>tsucast - Unsubscribed</title>
<style>body{font-family:sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center;color:#1a1a1a}h1{font-size:1.5rem}p{color:#666}</style></head>
<body><h1>Unsubscribed</h1><p>You have been successfully unsubscribed. You will no longer receive these emails.</p><p><a href="https://tsucast.app">Go to tsucast</a></p></body></html>`;
}

// Re-use escapeHtml from lib/email.ts (imported at top) as escapeHtmlInline
const escapeHtmlInline = escapeHtml;

export default email;
