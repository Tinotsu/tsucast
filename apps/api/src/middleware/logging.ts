/**
 * Structured Logging Middleware
 *
 * Provides structured JSON logging for all API requests.
 * Story: 6-1 Error Handling & User Feedback (AC8)
 *
 * Features:
 * - Request ID generation and propagation
 * - Duration tracking
 * - User ID extraction (when authenticated)
 * - Sensitive data redaction
 */

import type { Context, Next } from 'hono';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.js';

/**
 * Logging middleware that records request/response details in structured format.
 *
 * Logs include:
 * - request_id: Unique identifier for request tracing
 * - user_id: Authenticated user ID (if available)
 * - method: HTTP method
 * - path: Request path
 * - status_code: Response status
 * - duration_ms: Request duration
 *
 * Sensitive data is automatically redacted:
 * - Authorization headers
 * - Tokens
 * - Passwords
 */
export async function loggingMiddleware(c: Context, next: Next) {
  const requestId = randomUUID();
  const startTime = Date.now();

  // Set request ID in context for downstream use
  c.set('requestId', requestId);

  // Add request ID to response headers for debugging
  c.header('X-Request-ID', requestId);

  // Log incoming request
  logger.info({
    request_id: requestId,
    type: 'request',
    method: c.req.method,
    path: c.req.path,
    query: redactSensitive(Object.fromEntries(new URL(c.req.url).searchParams)),
    user_agent: c.req.header('user-agent'),
  });

  await next();

  const duration = Date.now() - startTime;

  // Extract user ID if authenticated
  const user = c.get('user') as { id?: string } | undefined;

  // Log response
  logger.info({
    request_id: requestId,
    type: 'response',
    method: c.req.method,
    path: c.req.path,
    status_code: c.res.status,
    duration_ms: duration,
    user_id: user?.id || 'anonymous',
  });
}

/**
 * Redact sensitive fields from an object.
 * Returns a new object with sensitive values replaced with '[REDACTED]'.
 */
function redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password',
    'token',
    'authorization',
    'api_key',
    'apiKey',
    'secret',
    'credential',
    'access_token',
    'refresh_token',
  ];

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}
