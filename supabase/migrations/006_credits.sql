-- Migration: Add article credit pricing system
-- Credits model: 1 credit = 1 article (up to 20 min audio)
-- Time bank: leftover time from short articles rolls over

-- Add credit columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_bank_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

-- Create credit_transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund', 'adjustment')),
  credits INTEGER NOT NULL,
  time_bank_delta INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON public.credit_transactions(user_id, created_at DESC);

-- Index for admin queries by type
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON public.credit_transactions(type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert transactions (webhooks, API)
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions"
  ON public.credit_transactions
  FOR INSERT
  WITH CHECK (true);

-- Function to add credits to a user (used by webhooks)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Update user balance
  UPDATE public.user_profiles
  SET
    credits_balance = credits_balance + p_credits,
    credits_purchased = credits_purchased + p_credits,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, type, credits, description, metadata)
  VALUES (p_user_id, 'purchase', p_credits, p_description, p_metadata);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits for generation
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_time_bank_delta INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, new_time_bank INTEGER) AS $$
DECLARE
  current_balance INTEGER;
  current_time_bank INTEGER;
BEGIN
  -- Get current values with lock
  SELECT credits_balance, time_bank_minutes
  INTO current_balance, current_time_bank
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check sufficient credits
  IF current_balance < p_credits THEN
    RETURN QUERY SELECT false, current_balance, current_time_bank;
    RETURN;
  END IF;

  -- Update user balance
  UPDATE public.user_profiles
  SET
    credits_balance = credits_balance - p_credits,
    credits_used = credits_used + p_credits,
    time_bank_minutes = GREATEST(0, time_bank_minutes + p_time_bank_delta),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_balance, time_bank_minutes INTO new_balance, new_time_bank;

  -- Record transaction (negative credits for deduction)
  INSERT INTO public.credit_transactions (user_id, type, credits, time_bank_delta, description, metadata)
  VALUES (p_user_id, 'generation', -p_credits, p_time_bank_delta, p_description, p_metadata);

  RETURN QUERY SELECT true, new_balance, new_time_bank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use time bank only (for short articles covered by bank)
CREATE OR REPLACE FUNCTION public.use_time_bank(
  p_user_id UUID,
  p_minutes_used INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  new_time_bank INTEGER;
BEGIN
  -- Update time bank
  UPDATE public.user_profiles
  SET
    time_bank_minutes = GREATEST(0, time_bank_minutes - p_minutes_used),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING time_bank_minutes INTO new_time_bank;

  -- Record transaction (0 credits, negative time bank)
  INSERT INTO public.credit_transactions (user_id, type, credits, time_bank_delta, description, metadata)
  VALUES (p_user_id, 'generation', 0, -p_minutes_used, p_description, p_metadata);

  RETURN new_time_bank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refund credits
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Update user balance
  UPDATE public.user_profiles
  SET
    credits_balance = credits_balance + p_credits,
    credits_used = GREATEST(0, credits_used - p_credits),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING credits_balance INTO new_balance;

  -- Record transaction
  INSERT INTO public.credit_transactions (user_id, type, credits, description, metadata)
  VALUES (p_user_id, 'refund', p_credits, p_description, p_metadata);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.credit_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_time_bank TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credits TO authenticated;
