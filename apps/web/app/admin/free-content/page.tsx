"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminFreeContent,
  createAdminFreeContent,
  updateAdminFreeContent,
  deleteAdminFreeContent,
  type FreeContentItem,
} from "@/lib/admin-api";
import {
  Headphones,
  Loader2,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", color: "bg-gray-400 text-white", icon: Clock },
  processing: { label: "Processing", color: "bg-yellow-500 text-[#1a1a1a]", icon: Loader2 },
  ready: { label: "Ready", color: "bg-green-500 text-white", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500 text-white", icon: XCircle },
};

const voiceOptions = [
  { value: "am_adam", label: "Adam" },
  { value: "af_sarah", label: "Sarah" },
  { value: "am_michael", label: "Michael" },
  { value: "af_bella", label: "Bella" },
];

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFreeContentPage() {
  const [items, setItems] = useState<FreeContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("am_adam");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Polling state - track multiple processing items
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await getAdminFreeContent();
      setItems(data.items);
      return data.items;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load free content");
      return [];
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadItems();
      setIsLoading(false);
    };
    init();
  }, [loadItems]);

  // Polling for processing items
  useEffect(() => {
    if (processingIds.size === 0) return;

    let pollCount = 0;
    const maxPolls = 60; // 5 minutes at 5-second intervals

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        setProcessingIds(new Set());
        return;
      }

      try {
        const freshItems = await loadItems();
        const stillProcessing = new Set<string>();
        for (const id of processingIds) {
          const target = freshItems.find((i) => i.id === id);
          if (target && (target.status === "processing" || target.status === "pending")) {
            stillProcessing.add(id);
          }
        }
        if (stillProcessing.size < processingIds.size) {
          setProcessingIds(stillProcessing);
        }
        if (stillProcessing.size === 0) {
          clearInterval(interval);
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [processingIds, loadItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: { title: string; text?: string; url?: string; voiceId: string } = {
        title,
        voiceId,
      };
      if (inputMode === "url") {
        payload.url = url;
      } else {
        payload.text = text;
      }

      const result = await createAdminFreeContent(payload);
      setItems((prev) => [result.item, ...prev]);
      setProcessingIds((prev) => new Set([...prev, result.item.id]));

      // Reset form
      setTitle("");
      setUrl("");
      setText("");
      setVoiceId("am_adam");
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create free content");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: FreeContentItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;

    setIsSavingEdit(true);
    try {
      const result = await updateAdminFreeContent(editingId, { title: editTitle.trim() });
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? result.item : i))
      );
      setEditingId(null);
      setEditTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this free content item?")) return;

    try {
      await deleteAdminFreeContent(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setProcessingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Free Content
          </h1>
          <p className="mt-2 font-normal leading-relaxed text-[#737373]">
            Curate free sample content for unauthenticated users
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#333]"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Add Content"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500 p-4 text-white">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[#e5e5e5] bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">Generate Free Content</h2>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., How to Do Great Work by Paul Graham"
                maxLength={500}
                required
                className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>

            {/* Input Mode Toggle */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                Source
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    inputMode === "url"
                      ? "bg-[#1a1a1a] text-white"
                      : "border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#f5f5f5]"
                  )}
                >
                  Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium",
                    inputMode === "text"
                      ? "bg-[#1a1a1a] text-white"
                      : "border border-[#e5e5e5] text-[#1a1a1a] hover:bg-[#f5f5f5]"
                  )}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {/* URL or Text Input */}
            {inputMode === "url" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                  Article URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://paulgraham.com/greatwork.html"
                  required={inputMode === "url"}
                  className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                  Article Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the full article text here..."
                  rows={8}
                  required={inputMode === "text"}
                  className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
                />
              </div>
            )}

            {/* Voice Select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                Voice
              </label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
              >
                {voiceOptions.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Headphones className="h-4 w-4" />
                  Generate Free Content
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Content List */}
      <div className="rounded-2xl border border-[#e5e5e5] bg-white">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Headphones className="mb-4 h-12 w-12 text-[#737373]" />
            <p className="font-normal text-[#737373]">No free content yet</p>
            <p className="mt-1 text-sm text-[#999]">
              Click &quot;Add Content&quot; to generate your first free sample
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_100px_80px_100px_120px_80px] gap-4 px-4 py-3 text-xs font-medium text-[#737373]">
              <span>Title</span>
              <span>Voice</span>
              <span>Status</span>
              <span>Duration</span>
              <span>Created</span>
              <span>Actions</span>
            </div>

            {items.map((item) => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;
              const isProcessing = item.status === "processing" || item.status === "pending";
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_100px_80px_100px_120px_80px] items-center gap-4 px-4 py-3 text-sm"
                >
                  {/* Title + URL */}
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                        className="w-full rounded border border-[#1a1a1a] px-2 py-1 text-sm font-medium text-[#1a1a1a] focus:outline-none"
                      />
                    ) : (
                      <p className="truncate font-medium text-[#1a1a1a]">{item.title}</p>
                    )}
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#737373] hover:text-[#1a1a1a]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{item.source_url}</span>
                      </a>
                    )}
                    {item.status === "failed" && item.error_message && (
                      <p className="mt-1 text-xs text-red-500">{item.error_message}</p>
                    )}
                  </div>

                  {/* Voice */}
                  <span className="text-[#737373]">
                    {voiceOptions.find((v) => v.value === item.voice_id)?.label || item.voice_id}
                  </span>

                  {/* Status */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                      status.color
                    )}
                  >
                    <StatusIcon className={cn("h-3 w-3", isProcessing && "animate-spin")} />
                    {processingIds.has(item.id) && isProcessing
                      ? "Processing..."
                      : status.label}
                  </span>

                  {/* Duration */}
                  <span className="text-[#737373]">
                    {item.status === "ready" ? (
                      item.audio_url ? (
                        <a
                          href={item.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1a1a1a] hover:underline"
                        >
                          {formatDuration(item.duration_seconds)}
                        </a>
                      ) : (
                        formatDuration(item.duration_seconds)
                      )
                    ) : (
                      "-"
                    )}
                  </span>

                  {/* Created */}
                  <span className="text-xs text-[#737373]">
                    {formatDate(item.created_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
                          title="Save"
                        >
                          {isSavingEdit ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSavingEdit}
                          className="rounded p-1 text-[#737373] hover:bg-[#f5f5f5] disabled:opacity-50"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="rounded p-1 text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                          title="Edit title"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded p-1 text-[#737373] hover:bg-red-50 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Polling timeout notice */}
      {processingIds.size > 0 && items.some((i) => processingIds.has(i.id) && i.status === "processing") && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Generation in progress. The page is polling for updates automatically.
          </span>
        </div>
      )}
    </div>
  );
}
