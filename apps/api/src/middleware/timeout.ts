/**
 * Timeout Middleware
 *
 * Provides request timeout handling with abort signal support.
 * Story: 6-1 Error Handling & User Feedback (AC7)
 */

import type { Context, Next } from 'hono';

/**
 * Creates middleware that aborts requests after a timeout.
 *
 * @param ms - Timeout in milliseconds (default: 120000)
 * @returns Hono middleware function
 */
export function timeoutMiddleware(ms: number = 120000) {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);

    // Attach abort signal to context for downstream use
    c.set('abortSignal', controller.signal);

    try {
      await next();
    } catch (error) {
      // Handle AbortError from timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return c.json(
          {
            error: {
              code: 'TIMEOUT',
              message: 'Generation is taking too long. Please try again.',
            },
          },
          408
        );
      }
      // Re-throw other errors
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
