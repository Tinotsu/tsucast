/**
 * IP-based Rate Limiter Middleware
 *
 * Simple in-memory rate limiter for public endpoints.
 * Prevents abuse of unauthenticated endpoints.
 *
 * Note: In production with multiple instances, use Redis instead.
 */

import type { Context, Next } from 'hono';
import { logger } from '../lib/logger.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (per-process)
const ipLimits = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipLimits.entries()) {
    if (entry.resetAt <= now) {
      ipLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP from request (handles proxies)
 */
function getClientIp(c: Context): string {
  // Check common proxy headers
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = c.req.header('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (may not be available in all environments)
  return c.req.header('cf-connecting-ip') || 'unknown';
}

/**
 * Creates IP rate limit middleware
 *
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns Hono middleware function
 */
export function ipRateLimit(limit: number = 60, windowMs: number = 60 * 1000) {
  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const now = Date.now();

    // Skip rate limiting for unknown IPs (shouldn't happen in production)
    if (ip === 'unknown') {
      return next();
    }

    let entry = ipLimits.get(ip);

    // Create new entry or reset if window expired
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      ipLimits.set(ip, entry);
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers
    const remaining = Math.max(0, limit - entry.count);
    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());

    // Check if over limit
    if (entry.count > limit) {
      logger.warn({ ip, count: entry.count, limit }, 'IP rate limit exceeded');

      c.header('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString());

      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
          },
        },
        429
      );
    }

    return next();
  };
}
