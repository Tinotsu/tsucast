/**
 * useLibrary Hook
 *
 * React Query-based hook for library data fetching and mutations.
 * Story: 4-1 Library View
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLibrary, deleteFromLibrary } from '@/services/api';
import type { LibraryItem } from '@/services/api';

export type { LibraryItem };

export function useLibrary() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFromLibrary,
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['library'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<{ items: LibraryItem[] }>(['library']);

      // Optimistically update
      queryClient.setQueryData<{ items: LibraryItem[] }>(['library'], (old) => {
        if (!old) return { items: [] };
        return {
          items: old.items.filter((item) => item.id !== id),
        };
      });

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['library'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  return {
    items: data?.items || [],
    isLoading,
    error: error as Error | null,
    refetch,
    deleteItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
