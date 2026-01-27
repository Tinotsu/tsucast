"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPostHog } from "@/lib/posthog";

/**
 * Side-effect-only component that identifies/resets PostHog user based on auth state.
 * Mirrors the mobile PostHogIdentify pattern. Rendered once at top level.
 */
export function PostHogIdentify() {
  const { user } = useAuth();

  useEffect(() => {
    const ph = getPostHog();
    if (!ph) return;

    if (user?.id) {
      ph.identify(user.id, {
        $set: { email: user.email },
        $set_once: {
          created_at: user.created_at,
          platform: "web",
        },
      });
    } else {
      ph.reset();
    }
  }, [user?.id]);

  return null;
}
