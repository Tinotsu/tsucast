/**
 * PostHog Server-Side Analytics
 *
 * Follows lib/sentry.ts singleton pattern.
 * No-op when POSTHOG_PROJECT_KEY is not set (local dev).
 */

import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

export function initPostHog(): void {
  const key = process.env.POSTHOG_PROJECT_KEY;
  const host = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!key) {
    return;
  }

  client = new PostHog(key, { host });
}

export function getPostHog(): PostHog | null {
  return client;
}

export async function shutdownPostHog(): Promise<void> {
  if (client) {
    await client.shutdown();
  }
}
