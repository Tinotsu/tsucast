"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Settings, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Library", href: "/library", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-60 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-6">
        <Link href="/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <Logo size={24} className="text-[var(--foreground)]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            tsucast
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
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

      {/* Night Mode Toggle */}
      <div className="border-t border-[var(--border)] p-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
          {resolvedTheme === "dark" ? "Light Mode" : "Night Mode"}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
