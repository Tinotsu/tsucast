"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPlaylists,
  createPlaylist,
  addToPlaylist,
  type Playlist,
} from "@/lib/api";
import {
  X,
  ListMusic,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToPlaylistMenuProps {
  audioId: string;
  audioTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistMenu({
  audioId,
  audioTitle,
  isOpen,
  onClose,
}: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [addedToIds, setAddedToIds] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } catch (err) {
      console.error("Failed to load playlists:", err);
      setError("Failed to load playlists");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      setAddedToIds(new Set());
      setShowCreateForm(false);
      setNewPlaylistName("");
    }
  }, [isOpen, loadPlaylists]);

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToId(playlistId);
    setError(null);
    try {
      await addToPlaylist(playlistId, audioId);
      setAddedToIds((prev) => new Set(prev).add(playlistId));
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === playlistId ? { ...p, itemCount: p.itemCount + 1 } : p
        )
      );
    } catch (err) {
      console.error("Failed to add to playlist:", err);
      setError("Failed to add to playlist");
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      await addToPlaylist(playlist.id, audioId);
      setPlaylists((prev) => [{ ...playlist, itemCount: 1 }, ...prev]);
      setAddedToIds((prev) => new Set(prev).add(playlist.id));
      setNewPlaylistName("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Failed to create playlist:", err);
      setError("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="relative w-full sm:max-w-md bg-[var(--card)] rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Add to Playlist
            </h2>
            {audioTitle && (
              <p className="text-sm text-[var(--muted)] truncate max-w-[250px]">
                {audioTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Create New Playlist */}
          {showCreateForm ? (
            <form onSubmit={handleCreateAndAdd} className="mb-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                autoFocus
                maxLength={255}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPlaylistName("");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--secondary)] transition-colors mb-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--foreground)] text-[var(--background)]">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-medium text-[var(--foreground)]">
                Create New Playlist
              </span>
            </button>
          )}

          {/* Playlists List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <ListMusic className="mx-auto mb-2 h-8 w-8 text-[var(--muted)]" />
              <p className="text-[var(--muted)]">No playlists yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => {
                const isAdded = addedToIds.has(playlist.id);
                const isAdding = addingToId === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => !isAdded && handleAddToPlaylist(playlist.id)}
                    disabled={isAdding || isAdded}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                      isAdded
                        ? "bg-green-500/10"
                        : "hover:bg-[var(--secondary)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isAdded
                          ? "bg-green-500 text-white"
                          : "bg-[var(--secondary)] text-[var(--muted)]"
                      )}
                    >
                      {isAdding ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isAdded ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <ListMusic className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className={cn(
                          "font-medium truncate",
                          isAdded
                            ? "text-green-600 dark:text-green-400"
                            : "text-[var(--foreground)]"
                        )}
                      >
                        {playlist.name}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {playlist.itemCount}{" "}
                        {playlist.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    {isAdded && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer safe area for mobile */}
        <div className="h-4 sm:hidden" />
      </div>
    </div>
  );
}

export default AddToPlaylistMenu;
