import PostHog from 'posthog-react-native';

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// Singleton PostHog client — no-op stub when key is not set (local dev)
export const posthogClient = posthogKey
  ? new PostHog(posthogKey, {
      host: posthogHost,
      // Disable automatic screen capture — we track events explicitly
      captureAppLifecycleEvents: false,
    })
  : null;

/**
 * Identify a user in PostHog with $set and $set_once properties.
 * Should only be called from a single top-level component (PostHogIdentify).
 */
export function identifyUser(
  userId: string,
  properties: {
    email?: string;
    createdAt?: string;
    platform?: string;
  },
) {
  if (!posthogClient) return;

  posthogClient.identify(userId, {
    $set: { email: properties.email ?? null },
    $set_once: {
      created_at: properties.createdAt ?? null,
      platform: properties.platform ?? null,
    },
  });
}

/**
 * Track a named event with optional properties.
 */
export function trackEvent(name: string, properties?: Record<string, string | number | boolean | null>) {
  if (!posthogClient) return;
  posthogClient.capture(name, properties);
}

/**
 * Reset PostHog identity on sign-out.
 * Should only be called from a single top-level component (PostHogIdentify).
 */
export function resetUser() {
  if (!posthogClient) return;
  posthogClient.reset();
}

/**
 * Flush buffered events — call when app goes to background
 * to ensure events are sent before the OS may kill the app.
 */
export async function flushPostHog() {
  if (!posthogClient) return;
  await posthogClient.flush();
}
