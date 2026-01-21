/**
 * Subscription Hook
 *
 * Manages user subscription tier and generation limits.
 * Story: 5-1 Free Tier Implementation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLimitStatus } from '@/services/api';

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: getLimitStatus,
    staleTime: 60000, // Consider stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
  };

  return {
    tier: data?.tier || 'free',
    isPro: data?.tier === 'pro',
    used: data?.used ?? 0,
    limit: data?.limit ?? 3,
    remaining: data?.remaining ?? 3,
    resetAt: data?.resetAt ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
    invalidate,
  };
}
