"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { editPlaylist, editAudio } from "@/lib/api";
import { PRESET_EMOJIS } from "@/lib/constants";
import { CoverImage } from "@/components/ui/CoverImage";

interface EditItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; cover: string | null }) => void;
  type: "podcast" | "playlist";
  itemId: string;
  initialTitle: string;
  initialCover: string | null;
  playlistId?: string; // Required when type is "playlist"
}

export function EditItemDialog({
  isOpen,
  onClose,
  onSave,
  type,
  itemId,
  initialTitle,
  initialCover,
  playlistId,
}: EditItemDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [cover, setCover] = useState(initialCover || "");
  const [coverMode, setCoverMode] = useState<"emoji" | "url">(
    initialCover?.startsWith("http") ? "url" : "emoji"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCover(initialCover || "");
      setCoverMode(initialCover?.startsWith("http") ? "url" : "emoji");
      setError(null);
    }
  }, [isOpen, initialTitle, initialCover]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const coverValue = cover.trim() === "" ? null : cover.trim();

      if (type === "playlist" && playlistId) {
        await editPlaylist(playlistId, { name: title.trim(), cover: coverValue });
      } else {
        await editAudio(itemId, { title: title.trim(), cover: coverValue });
      }

      onSave({ title: title.trim(), cover: coverValue });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setCover(emoji);
  };

  if (!isOpen) return null;

  const dialogTitle = type === "playlist" ? "Edit Playlist" : "Edit Podcast";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{dialogTitle}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-[var(--secondary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Preview */}
          <div className="flex justify-center">
            <CoverImage cover={cover || null} size={80} />
          </div>

          {/* Cover Mode Toggle */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Cover
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCoverMode("emoji")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  coverMode === "emoji"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                }`}
              >
                Emoji
              </button>
              <button
                type="button"
                onClick={() => setCoverMode("url")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  coverMode === "url"
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                }`}
              >
                Image URL
              </button>
            </div>
          </div>

          {/* Emoji Grid or URL Input */}
          {coverMode === "emoji" ? (
            <div className="grid grid-cols-6 gap-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl hover:bg-[var(--secondary)] ${
                    cover === emoji
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "bg-[var(--background)]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCover("")}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs text-[var(--muted)] hover:bg-[var(--secondary)] ${
                  cover === "" ? "ring-2 ring-[var(--foreground)]" : ""
                }`}
              >
                None
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          )}

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--background)] hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
