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
  pending: "bg-yellow-500 text-[#1a1a1a]",
  approved: "bg-green-500 text-white",
  removed: "bg-red-500 text-white",
  warned: "bg-orange-500 text-white",
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
        <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
          Content Moderation
        </h1>
        <p className="mt-2 font-normal leading-relaxed text-[#737373]">
          Review and moderate flagged content
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-8 sm:grid-cols-4">
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500">
              <Flag className="h-5 w-5 text-[#1a1a1a]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {pendingCount}
              </p>
              <p className="text-xs font-normal text-[#737373]">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {flags.filter((f) => f.status === "approved").length}
              </p>
              <p className="text-xs font-normal text-[#737373]">Approved</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
              <X className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {flags.filter((f) => f.status === "removed").length}
              </p>
              <p className="text-xs font-normal text-[#737373]">Removed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a1a]">
                {flags.filter((f) => f.status === "warned").length}
              </p>
              <p className="text-xs font-normal text-[#737373]">Warned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Flags List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[#e5e5e5] bg-white">
            {flags.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <Shield className="mb-4 h-12 w-12 text-green-500" />
                <p className="font-bold text-[#1a1a1a]">
                  All clear!
                </p>
                <p className="text-sm font-normal text-[#737373]">
                  No content flags to review
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#e5e5e5]">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    onClick={() => setSelectedFlag(flag)}
                    className={cn(
                      "cursor-pointer p-4 transition-colors hover:bg-[#1a1a1a] hover:text-white",
                      selectedFlag?.id === flag.id &&
                        "bg-[#1a1a1a] text-white"
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">
                          {flag.title}
                        </p>
                        <p className="text-sm">
                          {flag.reason}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-bold",
                          statusColors[flag.status]
                        )}
                      >
                        {flag.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
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
            <div className="rounded-2xl border border-[#e5e5e5] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-[#1a1a1a]">
                  Flag Details
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-bold",
                    statusColors[selectedFlag.status]
                  )}
                >
                  {selectedFlag.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-normal text-[#737373]">
                    Title
                  </p>
                  <p className="text-sm text-[#1a1a1a]">
                    {selectedFlag.title}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-normal text-[#737373]">
                    URL
                  </p>
                  <a
                    href={selectedFlag.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#1a1a1a] underline hover:text-white hover:bg-[#1a1a1a]"
                  >
                    {selectedFlag.url}
                  </a>
                </div>

                <div>
                  <p className="mb-1 text-xs font-normal text-[#737373]">
                    Reason
                  </p>
                  <p className="text-sm text-[#1a1a1a]">
                    {selectedFlag.reason}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-normal text-[#737373]">
                    Reported By
                  </p>
                  <p className="text-sm text-[#1a1a1a]">
                    {selectedFlag.reportedBy}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {selectedFlag.status === "pending" && (
                <div className="mt-6 border-t border-[#e5e5e5] pt-6">
                  <p className="mb-3 text-xs font-normal text-[#737373]">
                    Actions
                  </p>
                  <div className="space-y-2">
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-2 text-sm font-bold text-white hover:bg-green-600">
                      <Check className="h-4 w-4" />
                      Approve Content
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2 text-sm font-bold text-white hover:bg-orange-600">
                      <AlertTriangle className="h-4 w-4" />
                      Warn User
                    </button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600">
                      <X className="h-4 w-4" />
                      Remove Content
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#e5e5e5] bg-white">
              <p className="font-normal text-[#737373]">
                Select a flag to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
