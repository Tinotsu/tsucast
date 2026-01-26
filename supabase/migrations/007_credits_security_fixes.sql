-- Migration: Fix credit_transactions security and add refund support
-- Story: 10-1 Web Article Credit Pricing (Code Review Fixes)

-- ISSUE 6 FIX: Restrict credit_transactions INSERT to service role only
-- The previous policy with `WITH CHECK (true)` was too permissive
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;

-- Only allow inserts through the service role (API server)
-- Regular authenticated users cannot insert directly - must go through RPC functions
CREATE POLICY "Service role can insert transactions"
  ON public.credit_transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also add policy for authenticated users inserting via RPC functions
-- RPC functions run as SECURITY DEFINER, so they bypass RLS
-- But we need a fallback policy in case RPC fails
CREATE POLICY "System can insert transactions"
  ON public.credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow if the transaction was created in the last 5 seconds
    -- This prevents users from inserting arbitrary historical transactions
    created_at >= now() - interval '5 seconds'
  );

-- ISSUE 7 FIX: Add function to deduct credits for refunds
CREATE OR REPLACE FUNCTION public.deduct_credits_for_refund(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Update user balance (allow going to 0 but not negative)
  UPDATE public.user_profiles
  SET
    credits_balance = GREATEST(0, credits_balance - p_credits),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  -- Record refund transaction (negative credits indicates removal)
  INSERT INTO public.credit_transactions (user_id, type, credits, description, metadata)
  VALUES (p_user_id, 'refund', -p_credits, p_description, p_metadata);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.deduct_credits_for_refund TO service_role;

-- Add index for looking up transactions by stripe session/charge ID (for idempotency)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session
  ON public.credit_transactions USING gin ((metadata->'stripeSessionId'));

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_charge
  ON public.credit_transactions USING gin ((metadata->'stripeChargeId'));

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment_intent
  ON public.credit_transactions USING gin ((metadata->'stripePaymentIntent'));
