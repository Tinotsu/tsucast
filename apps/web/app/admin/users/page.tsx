"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, type AdminUser, type PaginatedResponse } from "@/lib/admin-api";
import {
  Search,
  Loader2,
  Crown,
  User,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(page, 20, search || undefined);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Mock data for development
  const mockUsers: AdminUser[] = [
    {
      id: "1",
      email: "user1@example.com",
      display_name: "John Doe",
      subscription_tier: "pro",
      daily_generations: 2,
      is_admin: false,
      created_at: new Date().toISOString(),
      last_sign_in: new Date().toISOString(),
      total_generations: 150,
    },
    {
      id: "2",
      email: "user2@example.com",
      display_name: null,
      subscription_tier: "free",
      daily_generations: 3,
      is_admin: false,
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      last_sign_in: new Date(Date.now() - 86400000).toISOString(),
      total_generations: 25,
    },
  ];

  const displayUsers = users?.items || mockUsers;
  const totalPages = users?.totalPages || 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          User Management
        </h1>
        <p className="mt-2 text-zinc-400">
          View and manage registered users
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-12 pr-4 text-white placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Plan</th>
                        <th className="px-6 py-4 font-medium">Generations</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayUsers.map((user) => (
                        <tr
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={cn(
                            "cursor-pointer border-b border-zinc-800 transition-colors hover:bg-amber-500/5",
                            selectedUser?.id === user.id &&
                              "bg-amber-500/10"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                                <User className="h-5 w-5 text-amber-500" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {user.display_name ||
                                    user.email.split("@")[0]}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                                user.subscription_tier === "pro"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-zinc-800 text-zinc-400"
                              )}
                            >
                              {user.subscription_tier === "pro" && (
                                <Crown className="h-3 w-3" />
                              )}
                              {user.subscription_tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white">
                            {user.total_generations}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {formatDate(user.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
                  <p className="text-sm text-zinc-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-zinc-800 p-2 text-zinc-400 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-zinc-800 p-2 text-zinc-400 disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Detail */}
        <div>
          {selectedUser ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <User className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {selectedUser.display_name ||
                      selectedUser.email.split("@")[0]}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      selectedUser.subscription_tier === "pro"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-zinc-800 text-zinc-400"
                    )}
                  >
                    {selectedUser.subscription_tier === "pro" && (
                      <Crown className="h-3 w-3" />
                    )}
                    {selectedUser.subscription_tier}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">
                    Joined {formatDate(selectedUser.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Headphones className="h-4 w-4 text-zinc-400" />
                  <span className="text-white">
                    {selectedUser.total_generations} total generations
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-6">
                <h4 className="mb-3 text-sm font-medium text-zinc-400">
                  Today&apos;s Usage
                </h4>
                <div className="rounded-lg bg-amber-500/5 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-zinc-400">
                      Generations
                    </span>
                    <span className="font-medium text-white">
                      {selectedUser.daily_generations} /{" "}
                      {selectedUser.subscription_tier === "pro" ? "∞" : "3"}
                    </span>
                  </div>
                  {selectedUser.subscription_tier === "free" && (
                    <div className="h-2 overflow-hidden rounded-full bg-amber-500/20">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${(selectedUser.daily_generations / 3) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900">
              <p className="text-zinc-400">
                Select a user to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
