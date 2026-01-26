"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCreditBalance, type CreditBalance } from "@/lib/api";
import { useAuth } from "./useAuth";

/**
 * Hook to fetch and manage user credit balance
 * Used by credit pricing system
 */
export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<CreditBalance>({
    queryKey: ["credits", user?.id],
    queryFn: getCreditBalance,
    enabled: !!user,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const invalidateCredits = () => {
    queryClient.invalidateQueries({ queryKey: ["credits"] });
  };

  return {
    credits: data?.credits ?? 0,
    timeBank: data?.timeBank ?? 0,
    totalPurchased: data?.totalPurchased ?? 0,
    totalUsed: data?.totalUsed ?? 0,
    isLoading,
    error,
    refetch,
    invalidateCredits,
  };
}
