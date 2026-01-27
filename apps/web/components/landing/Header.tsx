import Link from "next/link";
import { Headphones, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black">
            <Headphones className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
            tsucast
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-[#1a1a1a] transition-colors hover:text-[#1a1a1a]"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-[#1a1a1a] transition-colors hover:text-[#1a1a1a]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#1a1a1a] transition-colors hover:text-[#1a1a1a]"
          >
            Sign In
          </Link>
          <Link
            href="https://apps.apple.com/app/tsucast"
            className="rounded-lg bg-black px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1a1a1a]"
          >
            Download App
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-[#1a1a1a] hover:bg-[#f5f5f5] md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
