import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-6xl font-bold tracking-tight text-[#1a1a1a]">404</h1>
      <h2 className="mb-2 text-xl font-bold tracking-tight text-[#1a1a1a]">
        Page not found
      </h2>
      <p className="mb-8 max-w-md font-normal leading-relaxed text-[#737373]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#1a1a1a] px-6 py-2.5 text-sm font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
      >
        Go Home
      </Link>
    </div>
  );
}
