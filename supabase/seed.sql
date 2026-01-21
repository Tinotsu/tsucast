-- Seed file for local development
-- Creates a test user: test@test.com / 12345678
--
-- Run with: npx supabase db seed
-- Or: psql -f supabase/seed.sql

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete existing test user if exists (for re-seeding)
DELETE FROM auth.users WHERE email = 'test@test.com';

-- Insert test user into auth.users
-- Using Supabase's expected password format with crypt()
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

-- Update the user_profiles to give pro access (created by trigger)
UPDATE public.user_profiles
SET subscription_tier = 'pro'
WHERE email = 'test@test.com';

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Test user created: test@test.com / 12345678';
END $$;
