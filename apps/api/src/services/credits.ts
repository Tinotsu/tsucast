/**
 * Credit Service
 *
 * Handles article credit calculations and deductions.
 * Pricing model: 1 credit = 1 article (up to 20 min audio)
 * Time bank: leftover time from short articles rolls over
 *
 * Story: 10-1 Web Article Credit Pricing
 */

import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';

// Constants from pricing specification
const MIN_CHARGE_MINUTES = 3; // Minimum charge per article
const CREDIT_SIZE_MINUTES = 20; // Minutes per credit
const WORDS_PER_MINUTE = 150; // Estimated speech rate

export interface CreditBalance {
  credits: number;
  timeBank: number;
  totalPurchased: number;
  totalUsed: number;
}

export interface CreditCalculation {
  creditsNeeded: number;
  newTimeBank: number;
  effectiveDuration: number;
}

export interface CreditPreview {
  isCached: boolean;
  estimatedMinutes: number;
  creditsNeeded: number;
  currentCredits: number;
  currentTimeBank: number;
  hasSufficientCredits: boolean;
}

/**
 * Calculate credits needed for a given duration
 * Uses time bank first, then charges credits
 */
export function calculateCreditsNeeded(
  durationMinutes: number,
  currentTimeBank: number
): CreditCalculation {
  // Apply minimum charge
  const effectiveDuration = Math.max(durationMinutes, MIN_CHARGE_MINUTES);

  // Use time bank first
  const netDuration = effectiveDuration - currentTimeBank;

  if (netDuration <= 0) {
    // Fully covered by time bank
    return {
      creditsNeeded: 0,
      newTimeBank: currentTimeBank - effectiveDuration,
      effectiveDuration,
    };
  }

  // Calculate credits needed
  const creditsNeeded = Math.ceil(netDuration / CREDIT_SIZE_MINUTES);
  const timeProvided = creditsNeeded * CREDIT_SIZE_MINUTES;
  const newTimeBank = timeProvided - netDuration;

  return {
    creditsNeeded,
    newTimeBank,
    effectiveDuration,
  };
}

/**
 * Estimate audio duration from word count
 */
export function estimateDurationFromWords(wordCount: number): number {
  return Math.round(wordCount / WORDS_PER_MINUTE);
}

/**
 * Get user's credit balance
 */
export async function getUserCreditBalance(userId: string): Promise<CreditBalance | null> {
  const client = getSupabase();
  if (!client) {
    logger.warn('Supabase not configured, returning null balance');
    return null;
  }

  const { data, error } = await client
    .from('user_profiles')
    .select('credits_balance, time_bank_minutes, credits_purchased, credits_used')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error({ error, userId }, 'Failed to get credit balance');
    return null;
  }

  return {
    credits: data.credits_balance ?? 0,
    timeBank: data.time_bank_minutes ?? 0,
    totalPurchased: data.credits_purchased ?? 0,
    totalUsed: data.credits_used ?? 0,
  };
}

/**
 * Preview credit cost for an article
 * Checks cache first to determine if it's free
 */
export async function previewCreditCost(
  userId: string,
  urlHash: string,
  estimatedWordCount?: number
): Promise<CreditPreview> {
  const client = getSupabase();

  // Get user balance
  const balance = await getUserCreditBalance(userId);
  if (!balance) {
    return {
      isCached: false,
      estimatedMinutes: 0,
      creditsNeeded: 0,
      currentCredits: 0,
      currentTimeBank: 0,
      hasSufficientCredits: false,
    };
  }

  // Check if cached
  let isCached = false;
  let estimatedMinutes = 0;

  if (client) {
    const { data: cacheEntry } = await client
      .from('audio_cache')
      .select('status, duration_seconds, word_count')
      .eq('url_hash', urlHash)
      .single();

    if (cacheEntry?.status === 'ready') {
      isCached = true;
      estimatedMinutes = Math.round((cacheEntry.duration_seconds ?? 0) / 60);
    } else if (cacheEntry?.word_count) {
      estimatedMinutes = estimateDurationFromWords(cacheEntry.word_count);
    }
  }

  // Estimate from word count if not in cache
  if (!isCached && estimatedWordCount) {
    estimatedMinutes = estimateDurationFromWords(estimatedWordCount);
  }

  // Calculate credits needed (0 if cached)
  const calculation = isCached
    ? { creditsNeeded: 0, newTimeBank: balance.timeBank, effectiveDuration: estimatedMinutes }
    : calculateCreditsNeeded(estimatedMinutes, balance.timeBank);

  return {
    isCached,
    estimatedMinutes,
    creditsNeeded: calculation.creditsNeeded,
    currentCredits: balance.credits,
    currentTimeBank: balance.timeBank,
    hasSufficientCredits: isCached || balance.credits >= calculation.creditsNeeded,
  };
}

/**
 * Deduct credits for a generation
 * Returns updated balance or null if insufficient credits
 *
 * ISSUE 4 FIX: Consolidated to use atomic database operations only.
 * The RPC functions handle all balance checks with FOR UPDATE locks,
 * eliminating race conditions between check and deduction.
 */
export async function deductCredits(
  userId: string,
  durationMinutes: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditBalance | null> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  // Get current time bank for calculation (this is just for calculation, not for authorization)
  // The actual balance check happens atomically in the RPC
  const { data: profileData, error: profileError } = await client
    .from('user_profiles')
    .select('time_bank_minutes')
    .eq('id', userId)
    .single();

  if (profileError) {
    logger.error({ error: profileError, userId }, 'Failed to get user time bank');
    throw profileError;
  }

  const currentTimeBank = profileData?.time_bank_minutes ?? 0;

  // Calculate credits needed
  const calculation = calculateCreditsNeeded(durationMinutes, currentTimeBank);

  // Check if covered by time bank only
  if (calculation.creditsNeeded === 0) {
    // Use time bank function (atomic operation)
    const minutesToUse = currentTimeBank - calculation.newTimeBank;
    const { data, error } = await client.rpc('use_time_bank', {
      p_user_id: userId,
      p_minutes_used: minutesToUse,
      p_description: description,
      p_metadata: metadata ?? {},
    });

    if (error) {
      logger.error({ error, userId }, 'Failed to use time bank');
      throw error;
    }

    // Fetch updated balance after time bank usage
    const updatedBalance = await getUserCreditBalance(userId);
    return updatedBalance;
  }

  // Calculate time bank delta (how much it changes)
  const timeBankDelta = calculation.newTimeBank - currentTimeBank;

  // Deduct credits atomically - the RPC handles all balance checks with FOR UPDATE lock
  const { data, error } = await client.rpc('deduct_credits', {
    p_user_id: userId,
    p_credits: calculation.creditsNeeded,
    p_time_bank_delta: timeBankDelta,
    p_description: description,
    p_metadata: metadata ?? {},
  });

  if (error) {
    logger.error({ error, userId }, 'Failed to deduct credits');
    throw error;
  }

  const result = data?.[0];
  if (!result?.success) {
    logger.info(
      { userId, needed: calculation.creditsNeeded },
      'Credit deduction failed - insufficient balance (atomic check)'
    );
    return null;
  }

  // Fetch full balance to return accurate totals
  const updatedBalance = await getUserCreditBalance(userId);
  if (updatedBalance) {
    return updatedBalance;
  }

  // Fallback to RPC result if balance fetch fails
  return {
    credits: result.new_balance,
    timeBank: result.new_time_bank,
    totalPurchased: 0,
    totalUsed: 0,
  };
}

/**
 * Add credits after purchase
 */
export async function addCredits(
  userId: string,
  credits: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditBalance | null> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await client.rpc('add_credits', {
    p_user_id: userId,
    p_credits: credits,
    p_description: description,
    p_metadata: metadata ?? {},
  });

  if (error) {
    logger.error({ error, userId, credits }, 'Failed to add credits');
    throw error;
  }

  // Return updated balance
  return getUserCreditBalance(userId);
}

/**
 * Refund credits
 */
export async function refundCredits(
  userId: string,
  credits: number,
  description: string,
  metadata?: Record<string, unknown>
): Promise<CreditBalance | null> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await client.rpc('refund_credits', {
    p_user_id: userId,
    p_credits: credits,
    p_description: description,
    p_metadata: metadata ?? {},
  });

  if (error) {
    logger.error({ error, userId, credits }, 'Failed to refund credits');
    throw error;
  }

  // Return updated balance
  return getUserCreditBalance(userId);
}

// Credit pack definitions (matching pricing specification)
// Stripe price IDs are configured via env vars in checkout.ts (getStripePriceIds)
export const CREDIT_PACKS = {
  coffee: { credits: 15, priceUsd: 4.99 },
  kebab: { credits: 30, priceUsd: 8.99 },
  pizza: { credits: 60, priceUsd: 16.99 },
  feast: { credits: 150, priceUsd: 39.99 },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

/**
 * Get credit pack by ID
 */
export function getCreditPack(packId: string): (typeof CREDIT_PACKS)[CreditPackId] | null {
  if (packId in CREDIT_PACKS) {
    return CREDIT_PACKS[packId as CreditPackId];
  }
  return null;
}
