import Link from "next/link";
import { Headphones, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
            <Headphones className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">
            tsucast
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-amber-500"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-amber-500"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-amber-500"
          >
            Sign In
          </Link>
          <Link
            href="https://apps.apple.com/app/tsucast"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
          >
            Download App
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
