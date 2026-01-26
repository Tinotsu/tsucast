/**
 * useCredits Hook
 *
 * React Query-based hook for credit balance fetching and management.
 * Story: 10-2 Mobile Article Credit Pricing
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCredits } from '@/services/api';
import type { CreditBalance } from '@/services/api';

export type { CreditBalance };

export function useCredits() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['credits'],
    queryFn: getCredits,
    staleTime: 30000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['credits'] });
  }, [queryClient]);

  return {
    credits: data?.credits ?? 0,
    timeBank: data?.timeBank ?? 0,
    totalPurchased: data?.totalPurchased ?? 0,
    totalUsed: data?.totalUsed ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate,
  };
}
