-- Migration: Add cover column to playlists
-- Cover can be an emoji or image URL. NULL shows random emoji.

ALTER TABLE public.playlists ADD COLUMN IF NOT EXISTS cover TEXT;
COMMENT ON COLUMN public.playlists.cover IS 'Cover emoji or image URL. NULL shows random emoji.';
