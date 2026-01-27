'use client';

import { useEffect } from 'react';
import { initSentry, captureException } from '@/lib/sentry';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // global-error replaces the root layout, so Providers (which normally inits Sentry)
    // is not mounted. Init here as a fallback to ensure errors are still captured.
    initSentry();
    captureException(error);
  }, [error]);

  // global-error.tsx must provide its own <html> and <body> tags (Next.js requirement),
  // which means the root layout (and its CSS/Tailwind imports) are NOT available.
  // Inline styles are required here — Tailwind classes would not work.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            tsucast
          </h1>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: '#1a1a1a',
              letterSpacing: '-0.025em',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#737373',
              fontWeight: 400,
              marginBottom: '2rem',
              maxWidth: '400px',
              lineHeight: '1.625',
            }}
          >
            An unexpected error occurred. Try refreshing the page.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: 'transparent',
                color: '#1a1a1a',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
