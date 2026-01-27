"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileWarning,
  Shield,
  Headphones,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reports", href: "/admin/reports", icon: FileWarning },
  { name: "Moderation", href: "/admin/moderation", icon: Shield },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#e5e5e5] bg-white">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-[#e5e5e5] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1a1a]">
          <Headphones className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-[#1a1a1a]">
            tsucast
          </span>
          <span className="ml-1 rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1a1a1a] text-white"
                      : "text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to App */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#e5e5e5] p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </aside>
  );
}
