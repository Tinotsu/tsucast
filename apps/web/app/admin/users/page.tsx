"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, type AdminUser, type PaginatedResponse } from "@/lib/admin-api";
import {
  Search,
  Loader2,
  Ticket,
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
  }, [page]);

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

  const displayUsers = users?.items || [];
  const totalPages = users?.totalPages || 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          User Management
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          View and manage registered users
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1a1a1a]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full rounded-xl border border-[#e5e5e5] bg-white py-3 pl-12 pr-4 text-[#1a1a1a] placeholder:text-[#a3a3a3] focus:border-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]"
          />
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500 p-4 text-white">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[#e5e5e5] bg-white">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
              </div>
            ) : displayUsers.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <User className="mb-4 h-12 w-12 text-[#1a1a1a]" />
                <p className="font-normal text-[#737373]">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e5e5e5] text-left text-sm text-[#1a1a1a]">
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Credits</th>
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
                            "cursor-pointer border-b border-[#e5e5e5] transition-colors hover:bg-[#1a1a1a] hover:text-white",
                            selectedUser?.id === user.id &&
                              "bg-[#1a1a1a] text-white"
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a]">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-bold">
                                  {user.display_name ||
                                    user.email.split("@")[0]}
                                </p>
                                <p className="text-xs">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold",
                                user.credits_balance > 0
                                  ? "bg-[#1a1a1a] text-white"
                                  : "bg-white text-[#1a1a1a] border border-[#e5e5e5]"
                              )}
                            >
                              <Ticket className="h-3 w-3" />
                              {user.credits_balance}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.total_generations}
                          </td>
                          <td className="px-6 py-4">
                            {formatDate(user.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-[#e5e5e5] px-6 py-4">
                  <p className="text-sm font-normal text-[#737373]">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-[#e5e5e5] p-2 text-[#1a1a1a] disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-[#e5e5e5] p-2 text-[#1a1a1a] disabled:opacity-50"
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
            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1a1a1a]">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a]">
                    {selectedUser.display_name ||
                      selectedUser.email.split("@")[0]}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                      selectedUser.credits_balance > 0
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-white text-[#1a1a1a] border border-[#e5e5e5]"
                    )}
                  >
                    <Ticket className="h-3 w-3" />
                    {selectedUser.credits_balance} credits
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#1a1a1a]" />
                  <span className="text-[#1a1a1a]">
                    {selectedUser.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[#1a1a1a]" />
                  <span className="text-[#1a1a1a]">
                    Joined {formatDate(selectedUser.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Headphones className="h-4 w-4 text-[#1a1a1a]" />
                  <span className="text-[#1a1a1a]">
                    {selectedUser.total_generations} total generations
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-[#e5e5e5] pt-6">
                <h4 className="mb-3 text-sm font-medium text-[#1a1a1a]">
                  Credits
                </h4>
                <div className="rounded-lg border border-[#e5e5e5] bg-white p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-normal text-[#737373]">
                      Balance
                    </span>
                    <span className="font-bold text-[#1a1a1a]">
                      {selectedUser.credits_balance} credits
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-normal text-[#737373]">
                      Time Bank
                    </span>
                    <span className="font-bold text-[#1a1a1a]">
                      {selectedUser.time_bank_minutes} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#e5e5e5] bg-white">
              <p className="font-normal text-[#737373]">
                Select a user to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
