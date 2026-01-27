/**
 * Unsubscribe Token Library
 *
 * HMAC-SHA256 signed tokens for stateless unsubscribe link verification.
 * Uses a dedicated UNSUBSCRIBE_SECRET (not RESEND_API_KEY) so rotating
 * the Resend key doesn't invalidate outstanding unsubscribe links.
 *
 * Token format: base64url(payload.hmac)
 * Payload: userId|sequenceId|expiryTimestamp
 * Expiry: 7 days
 */

import { createHmac } from 'crypto';

const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET env var is required for unsubscribe tokens');
  }
  return secret;
}

function hmacSign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/**
 * Generate a signed unsubscribe token.
 */
export function generateUnsubscribeToken(userId: string, sequenceId: string): string {
  const expiry = Date.now() + EXPIRY_MS;
  const payload = `${userId}|${sequenceId}|${expiry}`;
  const signature = hmacSign(payload);
  const raw = `${payload}.${signature}`;
  return Buffer.from(raw).toString('base64url');
}

/**
 * Verify and decode an unsubscribe token.
 * Returns null if invalid, tampered, or expired.
 */
export function verifyUnsubscribeToken(
  token: string,
): { userId: string; sequenceId: string } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString();
    const dotIndex = raw.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = raw.substring(0, dotIndex);
    const signature = raw.substring(dotIndex + 1);

    // Verify HMAC
    const expected = hmacSign(payload);
    if (signature !== expected) return null;

    // Parse payload
    const parts = payload.split('|');
    if (parts.length !== 3) return null;

    const [userId, sequenceId, expiryStr] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (isNaN(expiry) || Date.now() > expiry) return null;

    return { userId, sequenceId };
  } catch {
    return null;
  }
}
