-- Migration: Add deduct_credits_for_refund RPC + missing index on user_profiles.created_at
-- Fixes code review issues #2 (race condition in refund fallback) and #4 (missing index)

-- =============================================================================
-- 1. Index on user_profiles.created_at for auto-enrollment query performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at
  ON public.user_profiles (created_at);

-- =============================================================================
-- 2. Atomic credit deduction RPC for refunds
--    Prevents race condition when two refund webhooks fire concurrently.
--    Uses a single UPDATE with greatest(0, balance - credits) to avoid negatives.
-- =============================================================================

DROP FUNCTION IF EXISTS public.deduct_credits_for_refund(UUID, INTEGER, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.deduct_credits_for_refund(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomically deduct credits (floor at zero)
  UPDATE public.user_profiles
    SET credits_balance = GREATEST(0, credits_balance - p_credits)
    WHERE id = p_user_id;

  -- Record the refund transaction
  INSERT INTO public.credit_transactions (user_id, type, credits, description, metadata)
    VALUES (p_user_id, 'refund', -p_credits, p_description, p_metadata);
END;
$$;
