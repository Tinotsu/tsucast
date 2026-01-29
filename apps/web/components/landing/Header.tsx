"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/hooks/useTheme";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <Logo size={24} className="text-[var(--foreground)]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            tsucast
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          data-testid="desktop-nav"
          className="hidden items-center gap-6 md:flex"
        >
          <Link
            href="#pricing"
            data-testid="nav-pricing"
            className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--muted)]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--muted)]"
          >
            Sign In
          </Link>

          {/* Night Mode Toggle */}
          <button
            data-testid="night-mode-toggle"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            aria-label={
              mounted
                ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
                : "Toggle theme"
            }
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Night Mode Toggle (Mobile) */}
          <button
            data-testid="night-mode-toggle-mobile"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            aria-label={
              mounted
                ? `Switch to ${theme === "light" ? "dark" : "light"} mode`
                : "Toggle theme"
            }
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          data-testid="mobile-menu"
          className="border-t border-[var(--border)] bg-[var(--background)] md:hidden"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <Link
                href="#pricing"
                data-testid="mobile-nav-pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[var(--foreground)] transition-colors hover:text-[var(--muted)]"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[var(--foreground)] transition-colors hover:text-[var(--muted)]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--foreground)] px-4 py-2 text-base font-bold text-[var(--background)] transition-colors hover:opacity-90"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
