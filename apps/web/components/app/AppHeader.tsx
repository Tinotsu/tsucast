"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Headphones,
  PlusCircle,
  Library,
  Settings,
  LogOut,
  User,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Generate", href: "/generate", icon: PlusCircle },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppHeader() {
  const pathname = usePathname();
  const { profile, signOut, isPro } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
            <Headphones className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">
            tsucast
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-amber-500"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Subscription badge */}
          {isPro ? (
            <div className="hidden items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500 sm:flex">
              <Crown className="h-4 w-4" />
              Pro
            </div>
          ) : (
            <Link
              href="/upgrade"
              className="hidden rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 sm:block"
            >
              Upgrade
            </Link>
          )}

          {/* User menu */}
          <div className="group relative">
            <button className="flex items-center gap-2 rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-500">
              <User className="h-5 w-5" />
            </button>
            <div className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 py-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              <div className="border-b border-zinc-800 px-4 py-2">
                <p className="text-sm font-medium text-white">
                  {profile?.display_name || profile?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-zinc-400">
                  {profile?.email}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex border-t border-zinc-800 md:hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium",
                isActive
                  ? "text-amber-500"
                  : "text-zinc-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
