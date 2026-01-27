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
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="tsucast home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1a1a]">
            <Headphones className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
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
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
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
            <div className="flex items-center gap-1 text-sm text-[#737373]">
              <Ticket className="h-4 w-4 text-[#737373]" aria-hidden="true" />
              <span className="font-normal">{creditsLoading ? "..." : `${credits} credits`}</span>
            </div>
            <Link
              href="/upgrade"
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
            >
              Upgrade
            </Link>
          </div>

          {/* User menu */}
          <div className="group relative">
            <button
              aria-label="User menu"
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg p-2 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </button>
            <div
              role="menu"
              aria-label="User options"
              className="invisible absolute right-0 top-full mt-2 w-48 rounded-xl border border-[#e5e5e5] bg-white py-2 shadow-lg transition-all group-hover:visible group-hover:opacity-100 opacity-0"
            >
              <div className="border-b border-[#e5e5e5] px-4 py-2">
                <p className="text-sm font-medium tracking-tight text-[#1a1a1a]">
                  {profile?.display_name || profile?.email?.split("@")[0]}
                </p>
                <p className="text-xs font-normal leading-relaxed text-[#737373]">
                  {profile?.email}
                </p>
              </div>
              <button
                onClick={() => void signOut()}
                role="menuitem"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-normal text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex border-t border-[#e5e5e5] md:hidden" aria-label="Mobile navigation">
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
                  ? "text-[#1a1a1a]"
                  : "text-[#737373]"
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
