'use client';

import { useEffect } from 'react';
import { captureException } from '@/lib/sentry';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-xl font-semibold text-white">
        Something went wrong
      </h2>
      <p className="mb-8 max-w-md text-[var(--muted-foreground)]">
        An unexpected error occurred. Try again or go back to the home page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--secondary)]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
