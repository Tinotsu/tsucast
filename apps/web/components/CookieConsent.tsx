"use client";

import { useState, useEffect } from "react";
import { getPostHog } from "@/lib/posthog";

const CONSENT_KEY = "analytics_consent";

/**
 * Minimal cookie consent banner for GDPR compliance.
 * Shows only if user has not made a choice. Accept enables PostHog tracking.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === null) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. private browsing)
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    try { localStorage.setItem(CONSENT_KEY, "true"); } catch { /* noop */ }
    getPostHog()?.opt_in_capturing();
    setVisible(false);
  };

  const handleDecline = () => {
    try { localStorage.setItem(CONSENT_KEY, "false"); } catch { /* noop */ }
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] bg-zinc-900 border-t border-zinc-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-zinc-300">
          We use cookies for product analytics to improve your experience.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-white text-black rounded font-medium hover:bg-zinc-200 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
