-- Migration: Create user_library table for personal podcast library
-- Story 4-1: Library View

-- Create user_library table
CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES public.audio_cache(id) ON DELETE CASCADE,
  playback_position INTEGER DEFAULT 0,  -- seconds
  is_played BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, audio_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_added_at ON public.user_library(user_id, added_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own library
DROP POLICY IF EXISTS "Users can view own library" ON public.user_library;
CREATE POLICY "Users can view own library"
  ON public.user_library
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert to own library" ON public.user_library;
CREATE POLICY "Users can insert to own library"
  ON public.user_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own library" ON public.user_library;
CREATE POLICY "Users can update own library"
  ON public.user_library
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own library" ON public.user_library;
CREATE POLICY "Users can delete from own library"
  ON public.user_library
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything (for API server)
DROP POLICY IF EXISTS "Service role full access library" ON public.user_library;
CREATE POLICY "Service role full access library"
  ON public.user_library
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS user_library_updated_at ON public.user_library;
CREATE TRIGGER user_library_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_library TO authenticated;
GRANT ALL ON public.user_library TO service_role;
