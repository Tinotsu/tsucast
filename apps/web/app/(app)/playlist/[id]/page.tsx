"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getPlaylist,
  removeFromPlaylist,
  renamePlaylist,
  deletePlaylist,
  type PlaylistWithItems,
} from "@/lib/api";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import {
  ArrowLeft,
  Play,
  Trash2,
  Loader2,
  Clock,
  Pencil,
  ListMusic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverImage } from "@/components/ui/CoverImage";
import { EditItemDialog } from "@/components/library/EditItemDialog";
import { getRandomEmoji } from "@/lib/constants";
import { editPlaylist, copyAudio } from "@/lib/api";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaylistPage() {
  const router = useRouter();
  const params = useParams();
  const playlistId = params.id as string;

  const { play, addToQueue } = useAudioPlayer();

  const [playlist, setPlaylist] = useState<PlaylistWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPlaylistEdit, setShowPlaylistEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<PlaylistWithItems["items"][0] | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState<PlaylistWithItems["items"][0] | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlaylist(playlistId);
      setPlaylist(data);
      setEditName(data.name);
    } catch (err) {
      console.error("Failed to load playlist:", err);
      setError("Failed to load playlist");
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const handlePlayAll = () => {
    if (!playlist || playlist.items.length === 0) return;

    // Play the first item
    const firstItem = playlist.items[0];
    play({
      id: firstItem.audio.id,
      url: firstItem.audio.audio_url,
      title: firstItem.audio.title,
      duration: firstItem.audio.duration_seconds,
      transcriptUrl: firstItem.audio.transcript_url || undefined,
    });

    // Add rest to queue
    playlist.items.slice(1).forEach((item) => {
      addToQueue({
        id: item.audio.id,
        url: item.audio.audio_url,
        title: item.audio.title,
        duration: item.audio.duration_seconds,
        transcriptUrl: item.audio.transcript_url || undefined,
      });
    });
  };

  const handlePlayItem = (item: PlaylistWithItems["items"][0]) => {
    play({
      id: item.audio.id,
      url: item.audio.audio_url,
      title: item.audio.title,
      duration: item.audio.duration_seconds,
      transcriptUrl: item.audio.transcript_url || undefined,
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!playlist) return;
    setRemovingItemId(itemId);
    try {
      await removeFromPlaylist(playlist.id, itemId);
      setPlaylist((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
          : null
      );
    } catch (err) {
      console.error("Failed to remove item:", err);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist || !editName.trim()) return;

    setIsSaving(true);
    try {
      await renamePlaylist(playlist.id, editName.trim());
      setPlaylist((prev) => (prev ? { ...prev, name: editName.trim() } : null));
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to rename playlist:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!playlist) return;
    setIsDeleting(true);
    try {
      await deletePlaylist(playlist.id);
      router.push("/library?tab=playlists");
    } catch (err) {
      console.error("Failed to delete playlist:", err);
      setIsDeleting(false);
    }
  };

  const handleCopyAndEdit = async (item: PlaylistWithItems["items"][0]) => {
    if (!playlist) return;
    setIsCopying(true);
    try {
      const result = await copyAudio(item.audio.id, item.id);
      // Update the item in the playlist with the new audio
      setPlaylist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  audio: {
                    ...i.audio,
                    id: result.newAudioId,
                    title: result.title,
                    cover: result.cover,
                    isEditable: true,
                  },
                }
              : i
          ),
        };
      });
      setShowCopyConfirm(null);
      // Open edit dialog with the updated item
      const updatedItem = {
        ...item,
        audio: {
          ...item.audio,
          id: result.newAudioId,
          title: result.title,
          cover: result.cover,
          isEditable: true,
        },
      };
      setEditingItem(updatedItem);
    } catch (err) {
      console.error("Failed to copy audio:", err);
    } finally {
      setIsCopying(false);
    }
  };

  const handleEditClick = (item: PlaylistWithItems["items"][0]) => {
    if (item.audio.isEditable) {
      setEditingItem(item);
    } else {
      setShowCopyConfirm(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <p className="mb-4 text-[var(--muted)]">{error || "Playlist not found"}</p>
          <Link
            href="/library?tab=playlists"
            className="text-[var(--foreground)] underline"
          >
            Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.items.reduce(
    (sum, item) => sum + (item.audio.duration_seconds || 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/library?tab=playlists"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Playlists
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        {/* Cover Image */}
        <button
          onClick={() => setShowPlaylistEdit(true)}
          className="group relative flex-shrink-0"
        >
          <CoverImage
            cover={playlist.cover || getRandomEmoji(playlist.id)}
            size={120}
            className="transition-opacity group-hover:opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Pencil className="h-6 w-6 text-white" />
          </div>
        </button>

        <div className="flex flex-1 items-start justify-between gap-4">
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleRename} className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  maxLength={255}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-2xl font-bold text-[var(--foreground)] focus:border-[var(--foreground)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!editName.trim() || isSaving}
                  className="rounded-lg bg-[var(--foreground)] px-4 py-2 font-bold text-[var(--background)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(playlist.name);
                  }}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 font-bold text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
                    {playlist.name}
                  </h1>
                  <button
                    onClick={() => setShowPlaylistEdit(true)}
                    className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    aria-label="Edit playlist"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-4 text-sm text-[var(--muted)]">
                  <span>
                    {playlist.items.length}{" "}
                    {playlist.items.length === 1 ? "item" : "items"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.floor(totalDuration / 60)} min total
                  </span>
                </p>
              </>
            )}
          </div>

        <div className="flex items-center gap-2">
          {playlist.items.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-6 py-3 font-bold text-[var(--background)] transition-colors hover:opacity-90"
            >
              <Play className="h-5 w-5" />
              Play All
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-[var(--border)] p-3 text-[var(--muted)] transition-colors hover:border-red-500 hover:text-red-500"
            aria-label="Delete playlist"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        </div>
      </div>

      {/* Items List */}
      {playlist.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <ListMusic className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
          <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">
            This playlist is empty
          </h2>
          <p className="text-[var(--muted)]">
            Add items from your library to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {playlist.items.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-xl bg-[var(--card)] p-4 transition-all hover:bg-[var(--foreground)] hover:text-[var(--background)]"
            >
              <div className="flex gap-4">
                {/* Position */}
                <span className="flex w-6 items-center justify-center text-sm text-[var(--muted)] group-hover:text-[var(--background)] group-hover:opacity-70">
                  {index + 1}
                </span>

                {/* Play Button */}
                <button
                  onClick={() => handlePlayItem(item)}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition-colors group-hover:bg-[var(--background)] group-hover:text-[var(--foreground)]"
                >
                  <Play className="ml-0.5 h-5 w-5" />
                </button>

                {/* Track Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-[var(--foreground)] group-hover:text-[var(--background)]">
                    {item.audio.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)] group-hover:text-[var(--background)] group-hover:opacity-70">
                    <Clock className="h-3 w-3" />
                    {formatDuration(item.audio.duration_seconds)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="rounded-lg p-2 text-[var(--foreground)] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[var(--background)] hover:bg-[var(--secondary)]"
                    aria-label={`Edit ${item.audio.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={removingItemId === item.id}
                    className="rounded-lg p-2 text-[var(--foreground)] opacity-0 transition-all group-hover:opacity-100 group-hover:text-[var(--background)] hover:bg-[var(--destructive)] hover:text-white"
                    aria-label={`Remove ${item.audio.title}`}
                  >
                    {removingItemId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
              Delete Playlist?
            </h2>
            <p className="mb-6 text-[var(--muted)]">
              Are you sure you want to delete "{playlist.name}"? This cannot be
              undone. Items will remain in your library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Confirmation Modal */}
      {showCopyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
              Create Your Copy?
            </h2>
            <p className="mb-6 text-[var(--muted)]">
              This is shared content. To edit it, we'll create your own copy that you can customize.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCopyConfirm(null)}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCopyAndEdit(showCopyConfirm)}
                disabled={isCopying}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-4 py-2 font-bold text-[var(--background)] transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isCopying && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Playlist Dialog */}
      {showPlaylistEdit && (
        <EditItemDialog
          isOpen={showPlaylistEdit}
          onClose={() => setShowPlaylistEdit(false)}
          onSave={(data) => {
            setPlaylist((prev) =>
              prev ? { ...prev, name: data.title, cover: data.cover } : prev
            );
          }}
          type="playlist"
          itemId={playlist.id}
          playlistId={playlist.id}
          initialTitle={playlist.name}
          initialCover={playlist.cover}
        />
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
        <EditItemDialog
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(data) => {
            setPlaylist((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                items: prev.items.map((item) =>
                  item.id === editingItem.id
                    ? {
                        ...item,
                        audio: { ...item.audio, title: data.title, cover: data.cover },
                      }
                    : item
                ),
              };
            });
          }}
          type="podcast"
          itemId={editingItem.audio.id}
          initialTitle={editingItem.audio.title}
          initialCover={editingItem.audio.cover}
        />
      )}
    </div>
  );
}
