"use client";

import { useEffect, useState } from "react";
import {
  getExtractionReports,
  updateReportStatus,
  type ExtractionReport,
  type PaginatedResponse,
} from "@/lib/admin-api";
import {
  FileWarning,
  Loader2,
  Check,
  X,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-400",
  fixed: "bg-green-500/10 text-green-400",
  wont_fix: "bg-red-500/10 text-red-400",
  duplicate: "bg-zinc-800 text-zinc-400",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<PaginatedResponse<ExtractionReport> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<ExtractionReport | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getExtractionReports(page, 20, statusFilter || undefined);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    reportId: string,
    status: "fixed" | "wont_fix" | "duplicate"
  ) => {
    setIsUpdating(true);
    try {
      await updateReportStatus(reportId, status);
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, status });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  // Mock data for development
  const mockReports: ExtractionReport[] = [
    {
      id: "1",
      url: "https://example.com/article-that-failed",
      normalized_url: "https://example.com/article-that-failed",
      error_type: "PAYWALL",
      error_message: "Article appears to be behind a paywall",
      user_id: "user1",
      user_email: "user1@example.com",
      status: "pending",
      report_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "2",
      url: "https://example.org/another-article",
      normalized_url: "https://example.org/another-article",
      error_type: "PARSE_ERROR",
      error_message: "Failed to extract article content",
      user_id: "user2",
      user_email: "user2@example.com",
      status: "fixed",
      report_count: 1,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const displayReports = reports?.items || mockReports;
  const totalPages = reports?.totalPages || 1;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Extraction Reports
        </h1>
        <p className="mt-2 text-zinc-400">
          Review and manage reported URL extraction failures
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="fixed">Fixed</option>
            <option value="wont_fix">Won&apos;t Fix</option>
            <option value="duplicate">Duplicate</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports List */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : displayReports.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <FileWarning className="mb-4 h-12 w-12 text-zinc-400" />
                <p className="text-zinc-400">No reports found</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-zinc-800">
                  {displayReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={cn(
                        "cursor-pointer p-4 transition-colors hover:bg-amber-500/5",
                        selectedReport?.id === report.id &&
                          "bg-amber-500/10"
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {report.url}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {report.error_type} • {report.report_count} reports
                          </p>
                        </div>
                        <span
                          className={cn(
                            "ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                            statusColors[report.status]
                          )}
                        >
                          {report.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Reported {formatDate(report.created_at)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
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

        {/* Report Detail */}
        <div>
          {selectedReport ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">
                  Report Details
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    statusColors[selectedReport.status]
                  )}
                >
                  {selectedReport.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    URL
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate text-sm text-white">
                      {selectedReport.url}
                    </p>
                    <button
                      onClick={() => copyUrl(selectedReport.url)}
                      className="p-1 text-zinc-400 hover:text-amber-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={selectedReport.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-400 hover:text-amber-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Error Type
                  </p>
                  <p className="text-sm font-medium text-red-400">
                    {selectedReport.error_type}
                  </p>
                </div>

                {selectedReport.error_message && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-zinc-400">
                      Error Message
                    </p>
                    <p className="text-sm text-white">
                      {selectedReport.error_message}
                    </p>
                  </div>
                )}

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Reported By
                  </p>
                  <p className="text-sm text-white">
                    {selectedReport.user_email}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-400">
                    Report Count
                  </p>
                  <p className="text-sm text-white">
                    {selectedReport.report_count} user(s) reported this URL
                  </p>
                </div>
              </div>

              {/* Actions */}
              {selectedReport.status === "pending" && (
                <div className="mt-6 border-t border-zinc-800 pt-6">
                  <p className="mb-3 text-xs font-medium text-zinc-400">
                    Update Status
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedReport.id, "fixed")
                      }
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Fixed
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedReport.id, "wont_fix")
                      }
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Won&apos;t Fix
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedReport.id, "duplicate")
                      }
                      disabled={isUpdating}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-sm font-medium text-zinc-400 hover:bg-amber-500/5 disabled:opacity-50"
                    >
                      <Copy className="h-4 w-4" />
                      Dupe
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900">
              <p className="text-zinc-400">
                Select a report to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
