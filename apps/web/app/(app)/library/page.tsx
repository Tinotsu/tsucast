"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getLibrary, deleteLibraryItem, ApiError, type LibraryItem } from "@/lib/api";
import { ExploreTab } from "@/components/library/ExploreTab";
import { PlaylistsTab } from "@/components/library/PlaylistsTab";
import { AddToPlaylistMenu } from "@/components/library/AddToPlaylistMenu";
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
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { play, track, isPlaying } = useAudioPlayer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const tabParam = searchParams.get("tab") as TabType | null;

  // Use URL param directly to determine initial tab (avoids hydration mismatch)
  const urlTab = tabParam === "explore" ? "explore" : tabParam === "playlists" ? "playlists" : "all";
  const [activeTab, setActiveTab] = useState<TabType>(urlTab);

  // Sync state with URL param when it changes
  // Note: activeTab is intentionally excluded - we only want to sync FROM URL TO state,
  // not create a circular dependency where state changes trigger this effect
  useEffect(() => {
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]); // eslint-disable-line react-hooks/exhaustive-deps -- activeTab excluded to prevent circular sync
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [addingToPlaylistItem, setAddingToPlaylistItem] = useState<LibraryItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup success message timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handlePlay = useCallback((item: LibraryItem) => {
    play({
      id: item.audio_id,
      url: item.audio_url,
      title: item.title,
      duration: item.duration,
    });
  }, [play]);

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
  // Use urlTab directly to avoid race condition with state initialization
  useEffect(() => {
    if (!authLoading && !isAuthenticated && (urlTab === "all" || urlTab === "playlists")) {
      router.push("/login?redirect=/library");
    }
  }, [authLoading, isAuthenticated, urlTab, router]);

  // Load library when on "all" tab and authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && activeTab === "all") {
      loadLibrary();
    } else if (activeTab === "explore" || activeTab === "playlists") {
      // No library loading needed for explore/playlists tabs
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, activeTab, loadLibrary]);

  // Auto-play highlighted item from URL param
  useEffect(() => {
    if (highlightId && items.length > 0) {
      const item = items.find(i => i.audio_id === highlightId);
      if (item) {
        handlePlay(item);
      }
    }
  }, [highlightId, items, handlePlay]);

  const handleDelete = async (audioId: string) => {
    setDeletingId(audioId);
    try {
      await deleteLibraryItem(audioId);
      setItems(prev => prev.filter((item) => item.audio_id !== audioId));
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

  // Show loading while checking auth (except for explore tab)
  if (authLoading && (urlTab === "all" || urlTab === "playlists")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
      </div>
    );
  }

  // For authenticated tabs, don't render if not authenticated (redirect is happening)
  if (!isAuthenticated && (urlTab === "all" || urlTab === "playlists") && !authLoading) {
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
            <div className="space-y-3">
              <p className="mb-4 text-sm text-[var(--muted)]">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
                {items.map((item) => {
                  const progress = getProgress(item);
                  const isCurrentTrack = track?.id === item.audio_id;
                  const isThisPlaying = isCurrentTrack && isPlaying;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group relative rounded-xl p-4 transition-all",
                        isThisPlaying
                          ? "bg-[var(--foreground)] text-[var(--background)]"
                          : "bg-[var(--card)] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                      )}
                    >
                      <div className="flex gap-4">
                        {/* Play Button */}
                        <button
                          onClick={() => handlePlay(item)}
                          aria-label={isThisPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
                          className={cn(
                            "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                            isThisPlaying
                              ? "bg-[var(--background)] text-[var(--foreground)]"
                              : "bg-[var(--foreground)] text-[var(--background)] group-hover:bg-[var(--background)] group-hover:text-[var(--foreground)]"
                          )}
                        >
                          {isThisPlaying ? (
                            <Headphones className="h-5 w-5" />
                          ) : (
                            <Play className="ml-0.5 h-5 w-5" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <h3 className={cn(
                            "line-clamp-2 font-bold",
                            isThisPlaying ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]"
                          )}>
                            {item.title}
                          </h3>
                          <div className={cn(
                            "mt-1 flex items-center gap-3 text-xs font-normal",
                            isThisPlaying ? "opacity-70" : "text-[var(--muted)] group-hover:opacity-70 group-hover:text-[var(--background)]"
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
                              isThisPlaying ? "bg-[var(--background)]/20" : "bg-[var(--border)] group-hover:bg-[var(--background)]/20"
                            )}>
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  isThisPlaying ? "bg-[var(--background)]" : "bg-[var(--foreground)] group-hover:bg-[var(--background)]"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {/* Add to Playlist Button */}
                          <button
                            onClick={() => setAddingToPlaylistItem(item)}
                            aria-label={`Add ${item.title} to playlist`}
                            className={cn(
                              "rounded-lg p-2 transition-all",
                              isThisPlaying ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
                              "opacity-0 group-hover:opacity-100 hover:bg-[var(--secondary)]"
                            )}
                          >
                            <ListPlus className="h-4 w-4" aria-hidden="true" />
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
                                isThisPlaying ? "text-[var(--background)]" : "text-[var(--foreground)] group-hover:text-[var(--background)]",
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
          )}
        </>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Add to Playlist Menu */}
      <AddToPlaylistMenu
        audioId={addingToPlaylistItem?.audio_id ?? ""}
        audioTitle={addingToPlaylistItem?.title}
        isOpen={addingToPlaylistItem !== null}
        onClose={() => setAddingToPlaylistItem(null)}
        onSuccess={(playlistName) => {
          setSuccessMessage(`Added to "${playlistName}"`);
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}
