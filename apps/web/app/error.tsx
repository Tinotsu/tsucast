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
      <h2 className="mb-2 text-xl font-bold tracking-tight text-[#1a1a1a]">
        Something went wrong
      </h2>
      <p className="mb-8 max-w-md font-normal leading-relaxed text-[#737373]">
        An unexpected error occurred. Try again or go back to the home page.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
