-- Migration: Prevent privilege escalation via direct column updates
-- Fixes: Users could SET is_admin = true on their own profile
--
-- Migration 001 granted ALL on user_profiles to authenticated/anon at TABLE level.
-- Column-level REVOKEs do NOT override table-level GRANTs in PostgreSQL.
-- We must REVOKE the blanket UPDATE, then re-GRANT UPDATE only on safe columns.
--
-- service_role bypasses RLS and is unaffected by these grants,
-- so API server operations and SECURITY DEFINER functions remain unaffected.

-- 1. Revoke the blanket UPDATE privilege from migration 001
REVOKE UPDATE ON public.user_profiles FROM authenticated, anon;

-- 2. Re-grant UPDATE only on columns users are allowed to modify
GRANT UPDATE (display_name, updated_at) ON public.user_profiles TO authenticated;

-- 3. Also restrict INSERT — anon/authenticated should not insert directly
--    (profile creation is handled by the SECURITY DEFINER trigger on auth.users)
REVOKE INSERT ON public.user_profiles FROM authenticated, anon;

-- 4. Restrict DELETE — users should not delete their own profiles directly
REVOKE DELETE ON public.user_profiles FROM authenticated, anon;

-- 5. RPC function for counting distinct active users (used by admin metrics)
CREATE OR REPLACE FUNCTION public.count_active_users_today(since TIMESTAMPTZ)
RETURNS TABLE(count BIGINT) AS $$
  SELECT COUNT(DISTINCT user_id) AS count
  FROM public.credit_transactions
  WHERE type = 'generation' AND created_at >= since;
$$ LANGUAGE sql SECURITY DEFINER;
