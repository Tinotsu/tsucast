"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPlaylists,
  createPlaylist,
  addToPlaylist,
  type Playlist,
  ApiError,
} from "@/lib/api";
import {
  X,
  ListPlus,
  Plus,
  Loader2,
  ListMusic,
} from "lucide-react";

interface AddToPlaylistMenuProps {
  audioId: string;
  audioTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistName: string) => void;
}

export function AddToPlaylistMenu({
  audioId,
  audioTitle,
  isOpen,
  onClose,
  onSuccess,
}: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
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
      setShowCreateNew(false);
      setNewPlaylistName("");
    }
  }, [isOpen, loadPlaylists]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleAddToPlaylist = async (playlist: Playlist) => {
    // Guard against empty audioId
    if (!audioId) {
      setError("No audio selected");
      return;
    }

    setAddingToId(playlist.id);
    setError(null);
    try {
      await addToPlaylist(playlist.id, audioId);
      onSuccess?.(playlist.name);
      onClose();
    } catch (err) {
      console.error("Failed to add to playlist:", err);
      // Show specific error message from server (e.g., "Item already in playlist")
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to add to playlist");
      }
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    // Guard against empty audioId
    if (!audioId) {
      setError("No audio selected");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      await addToPlaylist(playlist.id, audioId);
      onSuccess?.(playlist.name);
      onClose();
    } catch (err) {
      console.error("Failed to create playlist:", err);
      // Show specific error message from server
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create playlist");
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl bg-[var(--card)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-playlist-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-[var(--foreground)]" />
            <h2 id="add-to-playlist-title" className="font-bold text-[var(--foreground)]">Add to Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item being added */}
        {audioTitle && (
          <div className="border-b border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
            Adding: <span className="font-medium text-[var(--foreground)]">{audioTitle}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
            </div>
          ) : showCreateNew ? (
            <form onSubmit={handleCreateAndAdd} className="space-y-4">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                autoFocus
                maxLength={255}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--foreground)] focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateNew(false)}
                  className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--foreground)] px-4 py-2 font-bold text-[var(--background)] transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {/* Create New Playlist Button */}
              <button
                onClick={() => setShowCreateNew(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--secondary)] p-4 text-left transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--foreground)] text-[var(--background)]">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="font-medium">Create New Playlist</span>
              </button>

              {/* Existing Playlists */}
              {playlists.length === 0 ? (
                <div className="py-8 text-center text-[var(--muted)]">
                  <ListMusic className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No playlists yet</p>
                </div>
              ) : (
                playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist)}
                    disabled={addingToId !== null}
                    className="flex w-full items-center gap-3 rounded-xl bg-[var(--card)] p-4 text-left transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--secondary)]">
                      <ListMusic className="h-5 w-5 text-[var(--muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-[var(--foreground)]">
                        {playlist.name}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {playlist.itemCount} {playlist.itemCount === 1 ? "item" : "items"}
                      </p>
                    </div>
                    {addingToId === playlist.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />
                    ) : (
                      <Plus className="h-5 w-5 text-[var(--muted)]" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddToPlaylistMenu;
