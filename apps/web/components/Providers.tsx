"use client";

import { Suspense, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { initSentry } from "@/lib/sentry";
import { initPostHog, getPostHog } from "@/lib/posthog";
import { PostHogIdentify } from "@/components/PostHogIdentify";
import { PostHogPageView } from "@/components/PostHogPageView";

// Initialize Sentry eagerly at app bootstrap so it's ready before any errors occur
initSentry();

const CONSENT_KEY = "analytics_consent";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry auth errors — they won't resolve on retry
              if (error instanceof Error && "status" in error) {
                const status = (error as { status: number }).status;
                if (status === 0 || status === 401 || status === 403) return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  const [posthogReady, setPosthogReady] = useState(false);

  // Initialize PostHog inside useEffect to avoid SSR execution
  useEffect(() => {
    initPostHog();

    // Restore consent preference
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent === "true") {
        getPostHog()?.opt_in_capturing();
      }
    } catch {
      // localStorage unavailable (e.g. private browsing)
    }

    setPosthogReady(getPostHog() !== null);
  }, []);

  const posthogClient = posthogReady ? getPostHog() : null;
  const inner = (
    <QueryClientProvider client={queryClient}>
      <PostHogIdentify />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </QueryClientProvider>
  );

  return posthogClient ? (
    <PHProvider client={posthogClient}>{inner}</PHProvider>
  ) : (
    inner
  );
}
