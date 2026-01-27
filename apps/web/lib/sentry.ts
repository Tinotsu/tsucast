/**
 * Sentry Browser SDK for Web App
 *
 * Client-side only error tracking.
 * @sentry/nextjs is incompatible with opennextjs-cloudflare,
 * so we use @sentry/browser as a fallback.
 *
 * Server component errors are caught by error boundaries
 * and reported client-side when the error page renders.
 */

import * as Sentry from '@sentry/browser';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || typeof window === 'undefined') {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
  });

  initialized = true;
}

export function captureException(error: unknown): void {
  if (initialized) {
    Sentry.captureException(error);
  }
}
