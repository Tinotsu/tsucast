"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import {
  Home,
  Library,
  Settings,
  LogOut,
  User,
  Ticket,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="tsucast home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <Logo size={24} className="text-[var(--foreground)]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            tsucast
          </span>
        </Link>

        {/* Desktop Navigation - hidden since sidebar handles it on desktop */}
        <nav className="hidden items-center gap-1 lg:hidden" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--foreground)] hover:bg-[var(--secondary)]"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Credit balance + upgrade */}
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-1 text-sm text-[var(--muted)]">
              <Ticket className="h-4 w-4" aria-hidden="true" />
              <span className="font-normal">{creditsLoading ? "..." : `${credits} credits`}</span>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--background)] transition-colors hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>

          {/* User menu */}
          <div className="group relative">
            <button
              aria-label="User menu"
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg p-2 text-[var(--foreground)] hover:bg-[var(--secondary)]"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              role="menu"
              aria-label="User options"
              className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-lg transition-all group-hover:visible group-hover:opacity-100 opacity-0"
            >
              <div className="border-b border-[var(--border)] px-4 py-2">
                <p className="text-sm font-medium tracking-tight text-[var(--foreground)]">
                  {profile?.display_name || profile?.email?.split("@")[0]}
                </p>
                <p className="text-xs font-normal leading-relaxed text-[var(--muted)]">
                  {profile?.email}
                </p>
              </div>
              <button
                onClick={() => void signOut()}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-normal text-[var(--foreground)] hover:bg-[var(--secondary)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
