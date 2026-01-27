"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import {
  Headphones,
  PlusCircle,
  Library,
  Settings,
  LogOut,
  User,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Generate", href: "/generate", icon: PlusCircle },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useCredits();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="tsucast home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
            <Headphones className="h-5 w-5 text-black" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold text-white">
            tsucast
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
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
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-amber-500"
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
            <div className="flex items-center gap-1 text-sm text-zinc-400">
              <Ticket className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span>{creditsLoading ? "..." : `${credits} credits`}</span>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Upgrade
            </Link>
          </div>

          {/* User menu */}
          <div className="group relative">
            <button
              aria-label="User menu"
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-500"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              role="menu"
              aria-label="User options"
              className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 py-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100"
            >
              <div className="border-b border-zinc-800 px-4 py-2">
                <p className="text-sm font-medium text-white">
                  {profile?.display_name || profile?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-zinc-400">
                  {profile?.email}
                </p>
              </div>
              <button
                onClick={() => void signOut()}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex border-t border-zinc-800 md:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium",
                isActive
                  ? "text-amber-500"
                  : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
