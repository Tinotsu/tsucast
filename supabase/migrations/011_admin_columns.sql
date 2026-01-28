-- Add admin flag to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Add display name to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Partial index for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin) WHERE is_admin = true;
