-- Migration: Add cover column to audio_cache and free_content tables
-- Stores either an emoji OR an image URL for podcast cover art

-- Add cover column to audio_cache
ALTER TABLE public.audio_cache ADD COLUMN IF NOT EXISTS cover TEXT;

-- Add cover column to free_content
ALTER TABLE public.free_content ADD COLUMN IF NOT EXISTS cover TEXT;

-- RLS policy: Users can update their own audio_cache entries (title, cover)
-- This complements the existing SELECT and service_role policies
DROP POLICY IF EXISTS "Users can update own audio_cache" ON public.audio_cache;
CREATE POLICY "Users can update own audio_cache"
  ON public.audio_cache
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Comment for documentation
COMMENT ON COLUMN public.audio_cache.cover IS 'Cover image URL or emoji. NULL shows default icon.';
COMMENT ON COLUMN public.free_content.cover IS 'Cover image URL or emoji. NULL shows default icon.';
