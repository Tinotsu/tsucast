/**
 * Error Handling Integration Tests
 *
 * Tests that app.onError returns standardized INTERNAL_ERROR response.
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';

// Mock logger
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

// Mock sentry
vi.mock('../../src/lib/sentry.js', () => ({
  initSentry: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn().mockResolvedValue(undefined),
}));

describe('Error Handler', () => {
  it('should return standardized INTERNAL_ERROR response on unhandled error', async () => {
    const { createApiError, ErrorCodes } = await import('../../src/utils/errors.js');

    const app = new Hono();

    // Route that throws
    app.get('/throws', () => {
      throw new Error('Unexpected failure');
    });

    // Replicate the error handler from index.ts
    app.onError((err, c) => {
      return c.json({ error: createApiError(ErrorCodes.INTERNAL_ERROR) }, 500);
    });

    const res = await app.request('/throws');

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Something went wrong. Please try again.');
  });
});
