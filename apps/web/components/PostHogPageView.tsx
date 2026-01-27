"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/posthog";

/**
 * Tracks page views manually for Next.js App Router.
 * capture_pageview is set to false — auto-capture doesn't work reliably
 * with client-side navigation in the App Router.
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ph = getPostHog();
    if (!ph || !pathname) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
