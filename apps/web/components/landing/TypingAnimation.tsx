"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";

type Phase = "typing" | "processing" | "ready" | "reset";

const URL_TO_TYPE = "https://paulgraham.com/think.html";
const TYPING_DURATION = 2000; // 2 seconds
const PROCESSING_DURATION = 1500; // 1.5 seconds
const READY_DURATION = 2000; // 2 seconds
const RESET_DURATION = 500; // 0.5 seconds

/**
 * Typing Animation Component
 *
 * Demonstrates the core flow in a continuous loop:
 * 1. Typing: URL types character by character
 * 2. Processing: Progress bar animates
 * 3. Ready: Checkmark appears
 * 4. Reset: Fade out and loop
 */
export function TypingAnimation() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    // Guard for SSR/test environments
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) {
      // Skip animation for reduced motion - show ready state
      setPhase("ready");
      setTypedChars(URL_TO_TYPE.length);
      setProgress(100);
      return;
    }

    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    switch (phase) {
      case "typing":
        // Reset state
        setTypedChars(0);
        setProgress(0);

        // Type characters one by one
        const charDelay = TYPING_DURATION / URL_TO_TYPE.length;
        let charIndex = 0;

        interval = setInterval(() => {
          charIndex++;
          setTypedChars(charIndex);

          if (charIndex >= URL_TO_TYPE.length) {
            clearInterval(interval);
            timeout = setTimeout(() => setPhase("processing"), 200);
          }
        }, charDelay);
        break;

      case "processing":
        // Animate progress bar
        let progressValue = 0;
        const progressStep = 100 / (PROCESSING_DURATION / 50);

        interval = setInterval(() => {
          progressValue += progressStep;
          setProgress(Math.min(100, progressValue));

          if (progressValue >= 100) {
            clearInterval(interval);
            timeout = setTimeout(() => setPhase("ready"), 100);
          }
        }, 50);
        break;

      case "ready":
        timeout = setTimeout(() => setPhase("reset"), READY_DURATION);
        break;

      case "reset":
        timeout = setTimeout(() => setPhase("typing"), RESET_DURATION);
        break;
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [phase, prefersReducedMotion]);

  return (
    <div
      data-testid="typing-animation"
      className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg"
    >
      {/* Input field with typed URL */}
      <div className="mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <span
            className="font-mono text-sm text-[var(--foreground)] truncate"
            aria-label="URL being typed"
          >
            {URL_TO_TYPE.slice(0, typedChars)}
          </span>
          {phase === "typing" && (
            <span className="animate-pulse text-[var(--foreground)]">|</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full bg-[var(--foreground)] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Status text */}
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        {phase === "typing" && (
          <span className="text-[var(--muted)]">Paste any URL...</span>
        )}
        {phase === "processing" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[var(--foreground)]" />
            <span className="text-[var(--foreground)]">Processing...</span>
          </>
        )}
        {(phase === "ready" || phase === "reset") && (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-green-600">Ready to play</span>
          </>
        )}
      </div>
    </div>
  );
}
