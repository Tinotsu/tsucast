/**
 * Sentry Error Tracking
 *
 * Initializes Sentry for error reporting in the API server.
 * If SENTRY_DSN is not set, all exports are no-ops (safe for local dev).
 */

import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
    tracesSampleRate: 0,
  });

  initialized = true;
}

export function captureException(error: unknown): void {
  if (initialized) {
    Sentry.captureException(error);
  }
}

export function captureMessage(message: string): void {
  if (initialized) {
    Sentry.captureMessage(message);
  }
}

export async function flush(timeoutMs: number = 2000): Promise<void> {
  if (initialized) {
    await Sentry.flush(timeoutMs);
  }
}
