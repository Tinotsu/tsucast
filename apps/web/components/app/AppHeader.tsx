"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useTheme } from "@/hooks/useTheme";
import {
  Home,
  Library,
  Settings,
  LogOut,
  User,
  Ticket,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Burger menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Centered Logo */}
          <Link href="/home" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2" aria-label="tsucast home">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)]">
              <Logo size={24} className="text-[var(--foreground)]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              tsucast
            </span>
          </Link>

          {/* User menu button */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)]"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-64 bg-[var(--card)] border-r border-[var(--border)] shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
              <span className="text-lg font-bold text-[var(--foreground)]">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--secondary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/home" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[var(--secondary)] text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {/* Theme toggle in drawer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--border)] p-4">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5" aria-hidden="true" />
                )}
                {resolvedTheme === "dark" ? "Light Mode" : "Night Mode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User menu dropdown */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setUserMenuOpen(false)}
          />
          {/* Dropdown */}
          <div
            role="menu"
            aria-label="User options"
            className="absolute right-4 top-[72px] w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-lg"
          >
            <div className="border-b border-[var(--border)] px-4 py-3">
              <p className="text-sm font-medium tracking-tight text-[var(--foreground)]">
                {profile?.display_name || profile?.email?.split("@")[0]}
              </p>
              <p className="text-xs font-normal leading-relaxed text-[var(--muted)]">
                {profile?.email}
              </p>
            </div>
            <div className="border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Ticket className="h-4 w-4" aria-hidden="true" />
                <span className="font-normal">{creditsLoading ? "..." : `${credits} credits`}</span>
              </div>
            </div>
            <Link
              href="/upgrade"
              onClick={() => setUserMenuOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
            >
              <Ticket className="h-4 w-4" aria-hidden="true" />
              Buy Credits
            </Link>
            <button
              onClick={() => {
                setUserMenuOpen(false);
                void signOut();
              }}
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-normal text-[var(--foreground)] hover:bg-[var(--secondary)]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
