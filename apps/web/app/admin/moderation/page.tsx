"use client";

import { useState } from "react";
import { Shield, Flag, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentFlag {
  id: string;
  audioId: string;
  title: string;
  url: string;
  reason: string;
  reportedBy: string;
  status: "pending" | "approved" | "removed" | "warned";
  createdAt: string;
}

const mockFlags: ContentFlag[] = [
  {
    id: "1",
    audioId: "audio1",
    title: "Article about controversial topic",
    url: "https://example.com/article1",
    reason: "Inappropriate content",
    reportedBy: "user1@example.com",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    audioId: "audio2",
    title: "Another flagged article",
    url: "https://example.com/article2",
    reason: "Copyright violation",
    reportedBy: "user2@example.com",
    status: "approved",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  removed: "bg-red-500/10 text-red-400",
  warned: "bg-orange-500/10 text-orange-400",
};

export default function AdminModerationPage() {
  const [flags] = useState<ContentFlag[]>(mockFlags);
  const [selectedFlag, setSelectedFlag] = useState<ContentFlag | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pendingCount = flags.filter((f) => f.status === "pending").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Content Moderation
        </h1>
        <p className="mt-2 text-zinc-400">
          Review and moderate flagged content
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Flag className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {pendingCount}
              </p>
              <p className="text-xs text-zinc-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {flags.filter((f) => f.status === "approved").length}
              </p>
              <p className="text-xs text-zinc-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {flags.filter((f) => f.status === "removed").length}
              </p>
              <p className="text-xs text-zinc-400">Removed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {flags.filter((f) => f.status === "warned").length}
              </p>
              <p className="text-xs text-zinc-400">Warned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Flags List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            {flags.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Shield className="mb-4 h-12 w-12 text-green-500" />
                <p className="font-medium text-white">
                  All clear!
                </p>
                <p className="text-sm text-zinc-400">
                  No content flags to review
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    onClick={() => setSelectedFlag(flag)}
                    className={cn(
                      "cursor-pointer p-4 transition-colors hover:bg-amber-500/5",
                      selectedFlag?.id === flag.id &&
                        "bg-amber-500/10"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {flag.title}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {flag.reason}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                          statusColors[flag.status]
                        )}
                      >
                        {flag.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>Reported by {flag.reportedBy}</span>
                      <span>{formatDate(flag.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flag Detail */}
        <div>
          {selectedFlag ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  Flag Details
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    statusColors[selectedFlag.status]
                  )}
                >
                  {selectedFlag.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Title
                  </p>
                  <p className="text-sm text-white">
                    {selectedFlag.title}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    URL
                  </p>
                  <a
                    href={selectedFlag.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-500 hover:underline"
                  >
                    {selectedFlag.url}
                  </a>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Reason
                  </p>
                  <p className="text-sm text-white">
                    {selectedFlag.reason}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Reported By
                  </p>
                  <p className="text-sm text-white">
                    {selectedFlag.reportedBy}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {selectedFlag.status === "pending" && (
                <div className="mt-6 border-t border-zinc-800 pt-6">
                  <p className="mb-3 text-xs font-medium text-zinc-400">
                    Actions
                  </p>
                  <div className="space-y-2">
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600">
                      <Check className="h-4 w-4" />
                      Approve Content
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      Warn User
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600">
                      <X className="h-4 w-4" />
                      Remove Content
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900">
              <p className="text-zinc-400">
                Select a flag to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
