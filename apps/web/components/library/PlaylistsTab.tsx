"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  type Playlist,
} from "@/lib/api";
import {
  ListMusic,
  Plus,
  Loader2,
  Trash2,
  MoreVertical,
  Clock,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoverImage } from "@/components/ui/CoverImage";
import { EditItemDialog } from "./EditItemDialog";
import { getRandomEmoji } from "@/lib/constants";

export function PlaylistsTab() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to load playlists:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load playlists");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      setPlaylists((prev) => [playlist, ...prev]);
      setNewPlaylistName("");
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePlaylist(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--foreground)]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{loadError}</p>
        <button
          onClick={loadPlaylists}
          className="mt-4 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--background)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Empty State */}
      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <ListMusic className="mx-auto mb-4 h-12 w-12 text-[var(--muted)]" />
          <h2 className="mb-2 text-lg font-bold text-[var(--foreground)]">
            No playlists yet
          </h2>
          <p className="mb-6 text-[var(--muted)]">
            Create your first playlist to organize your library
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-6 py-3 font-bold text-[var(--background)] transition-colors hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            Create Playlist
          </button>
        </div>
      ) : (
        /* Playlists Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group relative rounded-xl bg-[var(--card)] p-4 transition-colors hover:bg-[var(--secondary)]"
            >
              <Link href={`/playlist/${playlist.id}`} className="block">
                <div className="mb-4 flex h-24 w-full items-center justify-center rounded-lg bg-[var(--secondary)] group-hover:bg-[var(--card)]">
                  <CoverImage
                    cover={playlist.cover || getRandomEmoji(playlist.id)}
                    size={64}
                  />
                </div>
                <h3 className="mb-1 truncate font-bold text-[var(--foreground)]">
                  {playlist.name}
                </h3>
                <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                  <Clock className="h-3 w-3" />
                  {playlist.itemCount} {playlist.itemCount === 1 ? "item" : "items"}
                </p>
              </Link>

              {/* Menu Button */}
              <div className="absolute right-2 top-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === playlist.id ? null : playlist.id);
                  }}
                  className="rounded-full p-2 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                  aria-label="Playlist options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === playlist.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlaylist(playlist);
                        setMenuOpenId(null);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(playlist.id);
                      }}
                      disabled={deletingId === playlist.id}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[var(--secondary)]"
                    >
                      {deletingId === playlist.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">
              Create Playlist
            </h2>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                autoFocus
                maxLength={255}
                className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPlaylistName("");
                  }}
                  className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-4 py-2 font-bold text-[var(--background)] transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Playlist Dialog */}
      {editingPlaylist && (
        <EditItemDialog
          isOpen={!!editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSave={(data) => {
            setPlaylists((prev) =>
              prev.map((p) =>
                p.id === editingPlaylist.id
                  ? { ...p, name: data.title, cover: data.cover }
                  : p
              )
            );
          }}
          type="playlist"
          itemId={editingPlaylist.id}
          playlistId={editingPlaylist.id}
          initialTitle={editingPlaylist.name}
          initialCover={editingPlaylist.cover}
        />
      )}
    </div>
  );
}

export default PlaylistsTab;
