import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold text-white">404</h1>
      <h2 className="mb-2 text-xl font-semibold text-white">
        Page not found
      </h2>
      <p className="mb-8 max-w-md text-[var(--muted-foreground)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
      >
        Go Home
      </Link>
    </div>
  );
}
