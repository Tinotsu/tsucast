/**
 * Rate Limit Service
 *
 * Centralized rate limiting logic for free tier users.
 * Handles daily generation limits with automatic reset at midnight UTC.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { FREE_TIER_LIMIT } from '../utils/constants.js';

export interface RateLimitStatus {
  allowed: boolean;
  tier: 'free' | 'pro';
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

// Zod schema for validating user profile from database
const userProfileSchema = z.object({
  subscription_tier: z.enum(['free', 'pro']).default('free'),
  daily_generations: z.number().default(0),
  daily_generations_reset_at: z.string().nullable().default(null),
});

type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Parse and validate user profile from database response.
 * Returns null if data is invalid or missing.
 */
function parseUserProfile(data: unknown): UserProfile | null {
  const result = userProfileSchema.safeParse(data);
  if (!result.success) {
    logger.warn({ error: result.error }, 'Invalid user profile data');
    return null;
  }
  return result.data;
}

/**
 * Check if the daily counter needs to be reset (new day in UTC).
 * If reset is needed, updates the database and returns reset values.
 */
async function checkAndResetIfNeeded(
  userId: string,
  profile: UserProfile | null,
  supabase: SupabaseClient
): Promise<{ generations: number; resetAt: string | null }> {
  const now = new Date();
  const resetAt = profile?.daily_generations_reset_at
    ? new Date(profile.daily_generations_reset_at)
    : null;

  let generations = profile?.daily_generations || 0;

  // Check if reset needed (reset_at is in the past or doesn't exist)
  if (!resetAt || resetAt <= now) {
    generations = 0;

    // Calculate next midnight UTC
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const newResetAt = tomorrow.toISOString();

    const { error: resetError } = await supabase
      .from('user_profiles')
      .update({
        daily_generations: 0,
        daily_generations_reset_at: newResetAt,
      })
      .eq('id', userId);

    if (resetError) {
      logger.error({ error: resetError, userId }, 'Failed to reset daily generations');
    }

    return { generations: 0, resetAt: newResetAt };
  }

  return { generations, resetAt: profile?.daily_generations_reset_at || null };
}

/**
 * Get the current rate limit status for a user.
 * Automatically resets the counter if it's a new day.
 */
export async function getRateLimitStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<RateLimitStatus> {
  const { data } = await supabase
    .from('user_profiles')
    .select('subscription_tier, daily_generations, daily_generations_reset_at')
    .eq('id', userId)
    .single();

  const profile = parseUserProfile(data);

  // Pro users have no limit
  if (profile?.subscription_tier === 'pro') {
    return {
      allowed: true,
      tier: 'pro',
      used: 0,
      limit: null,
      remaining: null,
      resetAt: null,
    };
  }

  const { generations, resetAt } = await checkAndResetIfNeeded(userId, profile, supabase);

  return {
    allowed: generations < FREE_TIER_LIMIT,
    tier: 'free',
    used: generations,
    limit: FREE_TIER_LIMIT,
    remaining: Math.max(0, FREE_TIER_LIMIT - generations),
    resetAt,
  };
}

/**
 * Check if a user is allowed to generate (for quick checks).
 * Returns simplified result for generation flow.
 */
export async function checkRateLimit(
  userId: string,
  supabase: SupabaseClient
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
  isPro: boolean;
}> {
  const status = await getRateLimitStatus(userId, supabase);

  return {
    allowed: status.allowed,
    remaining: status.remaining ?? -1,
    resetAt: status.resetAt,
    isPro: status.tier === 'pro',
  };
}

/**
 * Increment the generation counter after a successful generation.
 * Should only be called for free tier users after generation succeeds.
 */
export async function incrementGenerationCount(
  userId: string,
  supabase: SupabaseClient
): Promise<number> {
  // Get current count
  const { data } = await supabase
    .from('user_profiles')
    .select('daily_generations')
    .eq('id', userId)
    .single();

  // Safely parse the daily_generations field
  const dailyGenerations = z.number().default(0).safeParse(data?.daily_generations);
  const currentCount = dailyGenerations.success ? dailyGenerations.data : 0;
  const newCount = currentCount + 1;

  // Increment counter
  const { error } = await supabase
    .from('user_profiles')
    .update({ daily_generations: newCount })
    .eq('id', userId);

  if (error) {
    logger.error({ error, userId }, 'Failed to increment generation count');
  }

  return Math.max(0, FREE_TIER_LIMIT - newCount);
}
