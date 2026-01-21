"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getLibrary, deleteLibraryItem, type LibraryItem } from "@/lib/api";
import { WebPlayer } from "@/components/app/WebPlayer";
import {
  Headphones,
  Play,
  Trash2,
  Loader2,
  Library,
  PlusCircle,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const libraryItems = await getLibrary();
      setItems(libraryItems);
    } catch (err: unknown) {
      // Redirect to login on auth errors
      if (err && typeof err === "object" && "status" in err && err.status === 401) {
        window.location.href = "/login?redirect=/library";
        return;
      }
      // For any other error (including connection refused), just show empty library
      console.error("Library load error:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (audioId: string) => {
    setDeletingId(audioId);
    try {
      await deleteLibraryItem(audioId);
      setItems(items.filter((item) => item.audio_id !== audioId));
      if (selectedItem?.audio_id === audioId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getProgress = (item: LibraryItem) => {
    if (item.is_played) return 100;
    if (item.duration === 0) return 0;
    return Math.round((item.playback_position / item.duration) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <button
          onClick={loadLibrary}
          className="rounded-lg bg-amber-500 px-6 py-2 font-medium text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Your Library
          </h1>
          <p className="mt-2 text-zinc-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Link
          href="/generate"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400"
        >
          <PlusCircle className="h-4 w-4" />
          Add New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-12 text-center">
          <Library className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h2 className="mb-2 text-lg font-semibold text-white">
            Your library is empty
          </h2>
          <p className="mb-6 text-zinc-400">
            Generate your first podcast to get started
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-medium text-black hover:bg-amber-400"
          >
            <PlusCircle className="h-5 w-5" />
            Generate Podcast
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Library List */}
          <div className="space-y-3">
            {items.map((item) => {
              const progress = getProgress(item);
              const isSelected = selectedItem?.audio_id === item.audio_id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-amber-500 bg-amber-500/5"
                      : "border-zinc-800 bg-zinc-900 hover:border-amber-500/50"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Play Button */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-amber-500 text-black"
                          : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black"
                      )}
                    >
                      {isSelected ? (
                        <Headphones className="h-5 w-5" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-medium text-white">
                        {item.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.duration)}
                        </span>
                        <span>{formatDate(item.created_at)}</span>
                        {item.is_played && (
                          <span className="flex items-center gap-1 text-green-500">
                            <Check className="h-3 w-3" />
                            Played
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {progress > 0 && progress < 100 && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(item.audio_id)}
                      disabled={deletingId === item.audio_id}
                      className="flex-shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                    >
                      {deletingId === item.audio_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player */}
          <div className="sticky top-24">
            {selectedItem ? (
              <WebPlayer
                audioUrl={selectedItem.audio_url}
                title={selectedItem.title}
                initialPosition={selectedItem.playback_position}
              />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900">
                <div className="text-center text-zinc-400">
                  <Headphones className="mx-auto mb-2 h-8 w-8" />
                  <p>Select an item to play</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
