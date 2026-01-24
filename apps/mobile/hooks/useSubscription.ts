/**
 * Subscription Hook
 *
 * Manages user subscription tier and generation limits.
 * Integrates with RevenueCat for purchases and subscription management.
 * Story: 5-1 Free Tier Implementation, 5-3 In-App Purchase Integration
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLimitStatus } from '@/services/api';
import {
  presentPaywall,
  presentPaywallIfNeeded,
  presentCustomerCenter,
  getSubscriptionStatus,
  isPurchasesConfigured,
  PAYWALL_RESULT,
  PRO_ENTITLEMENT_ID,
} from '@/services/purchases';

export function useSubscription() {
  const queryClient = useQueryClient();
  const [isPaywallLoading, setIsPaywallLoading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: getLimitStatus,
    staleTime: 60000, // Consider stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
  }, [queryClient]);

  /**
   * Show the RevenueCat paywall
   * Returns true if user purchased/restored, false otherwise
   */
  const showPaywall = useCallback(async (offeringId?: string): Promise<boolean> => {
    setIsPaywallLoading(true);
    try {
      const { result } = await presentPaywall(
        offeringId ? { offeringIdentifier: offeringId } : undefined
      );

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        // Refresh subscription data from API
        invalidate();
        return true;
      }
      return false;
    } finally {
      setIsPaywallLoading(false);
    }
  }, [invalidate]);

  /**
   * Show paywall only if user doesn't have Pro entitlement
   * Useful for gating premium features
   */
  const showPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    setIsPaywallLoading(true);
    try {
      const { result } = await presentPaywallIfNeeded(PRO_ENTITLEMENT_ID);

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        invalidate();
        return true;
      }
      // NOT_PRESENTED means user already has entitlement
      return result === PAYWALL_RESULT.NOT_PRESENTED;
    } finally {
      setIsPaywallLoading(false);
    }
  }, [invalidate]);

  /**
   * Open Customer Center for subscription management
   */
  const openCustomerCenter = useCallback(async () => {
    await presentCustomerCenter({
      onRestoreCompleted: () => {
        invalidate();
      },
    });
  }, [invalidate]);

  /**
   * Check if RevenueCat SDK is configured
   */
  const isConfigured = isPurchasesConfigured();

  return {
    // Subscription status from API
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

    // RevenueCat paywall/purchase methods
    showPaywall,
    showPaywallIfNeeded,
    openCustomerCenter,
    isPaywallLoading,
    isPurchasesConfigured: isConfigured,
  };
}
