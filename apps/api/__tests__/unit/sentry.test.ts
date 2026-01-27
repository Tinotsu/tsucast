/**
 * Sentry Module Tests
 *
 * Tests for src/lib/sentry.ts
 * Verifies Sentry initialization is skipped without DSN and
 * that captureException/captureMessage are no-ops when not initialized.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @sentry/node before importing sentry module
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));

describe('Sentry Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should skip initialization when SENTRY_DSN is not set', async () => {
    const Sentry = await import('@sentry/node');
    const { initSentry } = await import('../../src/lib/sentry.js');

    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('should initialize Sentry when SENTRY_DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
    process.env.NODE_ENV = 'production';

    const Sentry = await import('@sentry/node');
    const { initSentry } = await import('../../src/lib/sentry.js');

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://test@sentry.io/123',
        environment: 'production',
        tracesSampleRate: 0,
      })
    );
  });

  it('should not call Sentry.captureException when not initialized', async () => {
    const Sentry = await import('@sentry/node');
    const { captureException } = await import('../../src/lib/sentry.js');

    captureException(new Error('test'));

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('should call Sentry.captureException when initialized', async () => {
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';

    const Sentry = await import('@sentry/node');
    const { initSentry, captureException } = await import('../../src/lib/sentry.js');

    initSentry();
    const error = new Error('test error');
    captureException(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('should not call Sentry.flush when not initialized', async () => {
    const Sentry = await import('@sentry/node');
    const { flush } = await import('../../src/lib/sentry.js');

    await flush();

    expect(Sentry.flush).not.toHaveBeenCalled();
  });
});
