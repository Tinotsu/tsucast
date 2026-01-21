/**
 * Playlists Hook
 *
 * React Query hooks for playlist management.
 * Story: 4-3 Playlist Management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlaylists,
  getPlaylist,
  createPlaylist,
  renamePlaylist,
  deletePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  reorderPlaylistItems,
} from '@/services/api';

export interface Playlist {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  itemCount: number;
}

export interface PlaylistItem {
  id: string;
  position: number;
  added_at: string;
  audio: {
    id: string;
    title: string;
    audio_url: string;
    duration_seconds: number;
    original_url: string;
  };
}

export interface PlaylistWithItems extends Playlist {
  items: PlaylistItem[];
}

/**
 * Hook for managing playlists list
 */
export function usePlaylists() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
  });

  const createMutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renamePlaylist(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  return {
    playlists: (data?.playlists || []) as Playlist[],
    isLoading,
    error,
    refetch,
    createPlaylist: createMutation.mutateAsync,
    deletePlaylist: deleteMutation.mutateAsync,
    renamePlaylist: renameMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for managing a single playlist's items
 */
export function usePlaylistItems(playlistId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => getPlaylist(playlistId),
    enabled: !!playlistId,
  });

  const addMutation = useMutation({
    mutationFn: (audioId: string) => addToPlaylist(playlistId, audioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeFromPlaylist(playlistId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) => reorderPlaylistItems(playlistId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    },
  });

  return {
    playlist: data?.playlist as PlaylistWithItems | undefined,
    items: (data?.playlist?.items || []) as PlaylistItem[],
    isLoading,
    error,
    refetch,
    addItem: addMutation.mutateAsync,
    removeItem: removeMutation.mutateAsync,
    reorderItems: reorderMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
