-- Migration: Create audio_cache table for URL-based audio caching
-- Used by the cache check endpoint to return pre-generated audio

-- Create audio_cache table
CREATE TABLE IF NOT EXISTS public.audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  title TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on url_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_audio_cache_url_hash ON public.audio_cache(url_hash);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_audio_cache_status ON public.audio_cache(status);

-- Enable Row Level Security
ALTER TABLE public.audio_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read ready cache entries (public endpoint)
DROP POLICY IF EXISTS "Anyone can read ready cache" ON public.audio_cache;
CREATE POLICY "Anyone can read ready cache"
  ON public.audio_cache
  FOR SELECT
  USING (status = 'ready');

-- RLS Policy: Service role can do everything (for API server)
DROP POLICY IF EXISTS "Service role full access" ON public.audio_cache;
CREATE POLICY "Service role full access"
  ON public.audio_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS audio_cache_updated_at ON public.audio_cache;
CREATE TRIGGER audio_cache_updated_at
  BEFORE UPDATE ON public.audio_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT SELECT ON public.audio_cache TO anon;
GRANT ALL ON public.audio_cache TO service_role;
