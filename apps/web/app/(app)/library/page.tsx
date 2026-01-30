"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getLibrary, deleteLibraryItem, updatePlaybackPosition, editLibraryItem, ApiError, type LibraryItem } from "@/lib/api";
import { WebPlayer } from "@/components/app/WebPlayer";
import { ExploreTab } from "@/components/library/ExploreTab";
import { PlaylistsTab } from "@/components/library/PlaylistsTab";
import { EditItemDialog } from "@/components/library/EditItemDialog";
import { AddToPlaylistMenu } from "@/components/library/AddToPlaylistMenu";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CoverImage } from "@/components/ui/CoverImage";
import {
  Headphones,
  Play,
  Trash2,
  Loader2,
  Library,
  PlusCircle,
  Check,
  Clock,
  Compass,
  List,
  ListMusic,
  ListPlus,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "all" | "playlists" | "explore";

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
      </div>
    }>
      <LibraryPageContent />
    </Suspense>
  );
}

function LibraryPageContent() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const { addToQueue } = useAudioPlayer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === "explore" ? "explore" : tabParam === "playlists" ? "playlists" : "all"
  );
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [queuedItemId, setQueuedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [playlistItem, setPlaylistItem] = useState<LibraryItem | null>(null);
  const positionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = useRef<number>(0);

  const handleAddToQueue = useCallback((item: LibraryItem) => {
    addToQueue({
      id: item.audio_id,
      url: item.audio_url,
      title: item.title,
      duration: item.duration,
    });
    // Show brief feedback
    setQueuedItemId(item.audio_id);
    setTimeout(() => setQueuedItemId(null), 1500);
  }, [addToQueue]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "explore" || tab === "playlists") {
      url.searchParams.set("tab", tab);
    } else {
      url.searchParams.delete("tab");
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

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
      // Show error message for other errors
      console.error("Library load error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load library";
      setError(errorMessage);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Only redirect to login if on authenticated tabs and not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && (activeTab === "all" || activeTab === "playlists")) {
      router.push("/login?redirect=/library");
    }
  }, [authLoading, isAuthenticated, activeTab, router]);

  // Load library when on "all" tab and authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && activeTab === "all") {
      loadLibrary();
    } else if (activeTab === "explore" || activeTab === "playlists") {
      // No library loading needed for explore/playlists tabs
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, activeTab, loadLibrary]);

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

  const handleEditSave = useCallback(async (updates: { title?: string; cover?: string | null }) => {
    if (!editingItem) return;
    await editLibraryItem(editingItem.audio_id, updates);
    // Update local state with the new values
    setItems(prev => prev.map(item =>
      item.audio_id === editingItem.audio_id
        ? {
            ...item,
            title: updates.title ?? item.title,
            cover: updates.cover !== undefined ? updates.cover : item.cover,
          }
        : item
    ));
  }, [editingItem]);

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

  // Show loading while checking auth (except for explore tab)
  if (authLoading && (activeTab === "all" || activeTab === "playlists")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
      </div>
    );
  }

  // For authenticated tabs, don't render if not authenticated (redirect is happening)
  if (!isAuthenticated && (activeTab === "all" || activeTab === "playlists") && !authLoading) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Library
        </h1>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-[var(--border)]">
        <button
          onClick={() => handleTabChange("all")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "all"
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <List className="h-4 w-4" />
          All
        </button>
        <button
          onClick={() => handleTabChange("playlists")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "playlists"
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <ListMusic className="h-4 w-4" />
          Playlists
        </button>
        <button
          onClick={() => handleTabChange("explore")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "explore"
              ? "border-[var(--foreground)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <Compass className="h-4 w-4" />
          Explore
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "explore" ? (
        <ExploreTab />
      ) : activeTab === "playlists" ? (
        <PlaylistsTab />
      ) : (
        <>
          {error && (
            <div className="mb-8 rounded-lg bg-[var(--card)] border border-[var(--destructive)] p-4 text-center">
              <p className="mb-2 text-[var(--destructive)]">{error}</p>
              <button
                onClick={loadLibrary}
                className="rounded-lg bg-[var(--foreground)] px-6 py-2 font-bold text-[var(--background)]"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
              <Library className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
              <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">
                Your library is empty
              </h2>
              <p className="mb-6 font-normal text-[var(--muted)]">
                Generate your first podcast to get started
              </p>
              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-6 py-3 font-bold text-[var(--background)] transition-colors hover:opacity-80"
              >
                <PlusCircle className="h-5 w-5" />
                Generate Podcast
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Library List */}
              <div className="space-y-3">
                <p className="mb-4 text-sm text-[var(--muted)]">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
                {items.map((item) => {
                  const progress = getProgress(item);
                  const isSelected = selectedItem?.audio_id === item.audio_id;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative rounded-xl p-4 transition-all",
                        isSelected
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "bg-[var(--card)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                      )}
                    >
                      <div className="flex gap-4">
                        {/* Cover Image + Play Button */}
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="relative flex-shrink-0"
                        >
                          <CoverImage cover={item.cover ?? null} size={48} className="rounded-lg" />
                          <div className={cn(
                            "absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100",
                            isSelected && "opacity-100 bg-black/50"
                          )}>
                            {isSelected ? (
                              <Headphones className="h-5 w-5 text-white" />
                            ) : (
                              <Play className="ml-0.5 h-5 w-5 text-white" />
                            )}
                          </div>
                        </button>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "line-clamp-2 font-bold",
                            isSelected ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]"
                          )}>
                            {item.title}
                          </h3>
                          <div className={cn(
                            "mt-1 flex items-center gap-3 text-xs font-normal",
                            isSelected ? "opacity-70" : "text-[var(--muted)] group-hover:opacity-70 group-hover:text-[var(--background)]"
                          )}>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(item.duration)}
                            </span>
                            <span>{formatDate(item.created_at)}</span>
                            {item.is_played && (
                              <span className="flex items-center gap-1 text-[var(--success)]">
                                <Check className="h-3 w-3" />
                                Played
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {progress > 0 && progress < 100 && (
                            <div className={cn(
                              "mt-2 h-1 overflow-hidden rounded-full",
                              isSelected ? "bg-[var(--background)]/20" : "bg-[var(--border)] group-hover:bg-[var(--background)]/20"
                            )}>
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isSelected ? "bg-[var(--background)]" : "bg-[var(--foreground)] group-hover:bg-[var(--background)]"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {/* Edit Button (only for items user created) */}
                          {item.created_by === user?.id && (
                            <button
                              onClick={() => setEditingItem(item)}
                              aria-label={`Edit ${item.title}`}
                              className={cn(
                                "rounded-lg p-2 transition-all",
                                isSelected ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
                                "opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)]"
                              )}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}

                          {/* Add to Queue Button */}
                          <button
                            onClick={() => handleAddToQueue(item)}
                            aria-label={queuedItemId === item.audio_id ? "Added to queue" : `Add ${item.title} to queue`}
                            className={cn(
                              "rounded-lg p-2 transition-all",
                              isSelected ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
                              queuedItemId === item.audio_id
                                ? "opacity-100 text-[var(--success)]"
                                : "opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)]"
                            )}
                          >
                            {queuedItemId === item.audio_id ? (
                              <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <ListPlus className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>

                          {/* Add to Playlist Button */}
                          <button
                            onClick={() => setPlaylistItem(item)}
                            aria-label={`Add ${item.title} to playlist`}
                            className={cn(
                              "rounded-lg p-2 transition-all",
                              isSelected ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
                              "opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)]"
                            )}
                          >
                            <ListMusic className="h-4 w-4" aria-hidden="true" />
                          </button>

                          {/* Delete Button with Confirmation */}
                          {confirmingDeleteId === item.audio_id ? (
                            <div className="flex items-center gap-1" role="group" aria-label="Confirm deletion">
                              <button
                                onClick={() => {
                                  handleDelete(item.audio_id);
                                  setConfirmingDeleteId(null);
                                }}
                                disabled={deletingId === item.audio_id}
                                aria-label="Confirm delete"
                                className="rounded-lg bg-[var(--destructive)] px-2 py-1 text-xs font-bold text-white hover:opacity-90"
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
                                className="rounded-lg bg-[var(--foreground)] px-2 py-1 text-xs font-bold text-[var(--background)] hover:opacity-80"
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
                                "rounded-lg p-2 transition-all hover:bg-[var(--destructive)] hover:text-white",
                                isSelected ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
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
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]">
                    <div className="text-center text-[var(--muted)]">
                      <Headphones className="mx-auto mb-2 h-8 w-8" />
                      <p className="font-normal">Select an item to play</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Item Dialog */}
      <EditItemDialog
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleEditSave}
        initialTitle={editingItem?.title ?? ""}
        initialCover={editingItem?.cover ?? null}
      />

      {/* Add to Playlist Menu */}
      <AddToPlaylistMenu
        audioId={playlistItem?.audio_id || ""}
        audioTitle={playlistItem?.title}
        isOpen={playlistItem !== null}
        onClose={() => setPlaylistItem(null)}
      />
    </div>
  );
}
