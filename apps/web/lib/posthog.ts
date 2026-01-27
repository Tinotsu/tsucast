/**
 * PostHog Analytics for Web
 *
 * Client-side only — must be initialized inside useEffect, never at module level.
 * SSR on Cloudflare Workers via OpenNext could execute module-level code.
 */

import posthog from "posthog-js";

let initialized = false;

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key || typeof window === "undefined") {
    return;
  }

  if (initialized) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // Manual pageview tracking for App Router
    persistence: "localStorage",
    opt_out_capturing_by_default: true, // GDPR — tracking only after consent
  });

  initialized = true;
}

export function getPostHog() {
  if (!initialized) return null;
  return posthog;
}
