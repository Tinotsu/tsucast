"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getLibrary, deleteLibraryItem, updatePlaybackPosition, ApiError, type LibraryItem } from "@/lib/api";
import { WebPlayer } from "@/components/app/WebPlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
}

function LibraryPageContent() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const positionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = useRef<number>(0);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const libraryItems = await getLibrary();
      setItems(libraryItems);
    } catch (err: unknown) {
      // Redirect to login on auth errors
      if (err instanceof ApiError && (err.code === "UNAUTHORIZED" || err.status === 401)) {
        router.push("/login?redirect=/library");
        return;
      }
      // For any other error (including connection refused), just show empty library
      console.error("Library load error:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/library");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // Only load library if authenticated
    if (!authLoading && isAuthenticated) {
      loadLibrary();
    }
  }, [authLoading, isAuthenticated, loadLibrary]);

  // Auto-select highlighted item from URL param
  useEffect(() => {
    if (highlightId && items.length > 0 && !selectedItem) {
      const item = items.find(i => i.audio_id === highlightId);
      if (item) {
        setSelectedItem(item);
      }
    }
  }, [highlightId, items, selectedItem]);

  // Debounced position save - only saves every 5 seconds to avoid excessive API calls
  const handlePositionChange = useCallback((position: number) => {
    if (!selectedItem) return;

    // Update local state immediately for responsive UI
    setItems(prev => prev.map(item =>
      item.audio_id === selectedItem.audio_id
        ? { ...item, playback_position: position }
        : item
    ));

    // Debounce API call - only save if position changed significantly (>5 seconds)
    const shouldSave = Math.abs(position - lastSavedPositionRef.current) >= 5;
    if (!shouldSave) return;

    // Clear any pending save
    if (positionSaveTimeoutRef.current) {
      clearTimeout(positionSaveTimeoutRef.current);
    }

    // Schedule save after 2 second debounce
    positionSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await updatePlaybackPosition(selectedItem.audio_id, position);
        lastSavedPositionRef.current = position;
      } catch (err) {
        console.error("Failed to save position:", err);
      }
    }, 2000);
  }, [selectedItem]);

  // Clean up timeout on unmount and save final position
  useEffect(() => {
    return () => {
      if (positionSaveTimeoutRef.current) {
        clearTimeout(positionSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async (audioId: string) => {
    setDeletingId(audioId);
    try {
      await deleteLibraryItem(audioId);
      setItems(prev => prev.filter((item) => item.audio_id !== audioId));
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

  // Show loading while checking auth or loading library
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
      </div>
    );
  }

  // Don't render content if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="mb-4 text-red-500">{error}</p>
        <button
          onClick={loadLibrary}
          className="rounded-lg bg-[#1a1a1a] px-6 py-2 font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Your Library
          </h1>
          <p className="mt-2 font-normal leading-relaxed text-[#737373]">
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Link
          href="/generate"
          className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          <PlusCircle className="h-4 w-4" />
          Add New
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e5e5e5] bg-white p-12 text-center">
          <Library className="mx-auto mb-4 h-12 w-12 text-[#737373]" />
          <h2 className="mb-2 text-lg font-bold text-[#1a1a1a]">
            Your library is empty
          </h2>
          <p className="mb-6 font-normal text-[#737373]">
            Generate your first podcast to get started
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-6 py-3 font-bold text-white hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
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
                    "group relative rounded-xl p-4 transition-all",
                    isSelected
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-white hover:bg-[#1a1a1a] hover:text-white"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Play Button */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-white text-[#1a1a1a]"
                          : "bg-[#1a1a1a] text-white group-hover:bg-white group-hover:text-[#1a1a1a]"
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
                      <h3 className={cn(
                        "line-clamp-2 font-bold",
                        isSelected ? "text-white" : "text-[#1a1a1a] group-hover:text-white"
                      )}>
                        {item.title}
                      </h3>
                      <div className={cn(
                        "mt-1 flex items-center gap-3 text-xs font-normal",
                        isSelected ? "text-white/70" : "text-[#737373] group-hover:text-white/70"
                      )}>
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
                        <div className={cn(
                          "mt-2 h-1 overflow-hidden rounded-full",
                          isSelected ? "bg-white/20" : "bg-[#e5e5e5] group-hover:bg-white/20"
                        )}>
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isSelected ? "bg-white" : "bg-[#1a1a1a] group-hover:bg-white"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Delete Button with Confirmation */}
                    {confirmingDeleteId === item.audio_id ? (
                      <div className="flex flex-shrink-0 items-center gap-1" role="group" aria-label="Confirm deletion">
                        <button
                          onClick={() => {
                            handleDelete(item.audio_id);
                            setConfirmingDeleteId(null);
                          }}
                          disabled={deletingId === item.audio_id}
                          aria-label="Confirm delete"
                          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white hover:bg-red-600"
                        >
                          {deletingId === item.audio_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            "Delete"
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(null)}
                          aria-label="Cancel delete"
                          className="rounded-lg bg-[#1a1a1a] px-2 py-1 text-xs font-bold text-white hover:bg-white hover:text-[#1a1a1a]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(item.audio_id)}
                        disabled={deletingId === item.audio_id}
                        aria-label={`Delete ${item.title}`}
                        className={cn(
                          "flex-shrink-0 rounded-lg p-2 transition-all hover:bg-red-500 hover:text-white",
                          isSelected ? "text-white" : "text-[#1a1a1a] group-hover:text-white",
                          deletingId === item.audio_id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        {deletingId === item.audio_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player */}
          <div className="sticky top-24">
            {selectedItem ? (
              <ErrorBoundary>
                <WebPlayer
                  audioUrl={selectedItem.audio_url}
                  title={selectedItem.title}
                  initialPosition={selectedItem.playback_position}
                  onPositionChange={handlePositionChange}
                />
              </ErrorBoundary>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#e5e5e5] bg-white">
                <div className="text-center text-[#737373]">
                  <Headphones className="mx-auto mb-2 h-8 w-8" />
                  <p className="font-normal">Select an item to play</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
