-- Seed file for local development
-- Creates test users:
--   - admin@test.com / 12345678 (admin)
--   - test@test.com / 12345678 (regular user)
--
-- Applied automatically on: supabase db reset
-- Or manually with: supabase db seed

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Admin User: admin@test.com
-- =============================================================================
DELETE FROM auth.users WHERE email = 'admin@test.com';

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- Set admin privileges (profile created by trigger)
UPDATE public.user_profiles
SET is_admin = true, credits_balance = 1000
WHERE email = 'admin@test.com';

-- =============================================================================
-- Regular User: test@test.com
-- =============================================================================
DELETE FROM auth.users WHERE email = 'test@test.com';

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'test@test.com',
  crypt('12345678', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
);

-- Give regular user some credits for testing
UPDATE public.user_profiles
SET credits_balance = 100
WHERE email = 'test@test.com';

-- =============================================================================
-- Output confirmation
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Local test users created:';
  RAISE NOTICE '  Admin: admin@test.com / 12345678';
  RAISE NOTICE '  User:  test@test.com / 12345678';
  RAISE NOTICE '===========================================';
END $$;
