-- Migration: Create free_content table for admin-curated free sample content
-- Allows unauthenticated users to listen to curated content without credits

-- Create free_content table
CREATE TABLE IF NOT EXISTS public.free_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 500),
  voice_id TEXT NOT NULL DEFAULT 'am_adam',
  source_url TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  word_count INTEGER,
  file_size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial unique index: prevent duplicate URL+voice combinations (only when source_url is set)
CREATE UNIQUE INDEX idx_free_content_source_url_voice
  ON public.free_content(source_url, voice_id)
  WHERE source_url IS NOT NULL;

-- Index on status for filtered queries
CREATE INDEX IF NOT EXISTS idx_free_content_status ON public.free_content(status);

-- Enable Row Level Security
ALTER TABLE public.free_content ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read ready free content (public endpoint)
DROP POLICY IF EXISTS "Anyone can read ready free content" ON public.free_content;
CREATE POLICY "Anyone can read ready free content"
  ON public.free_content
  FOR SELECT
  USING (status = 'ready');

-- RLS Policy: Service role can do everything (for API server)
DROP POLICY IF EXISTS "Service role manages free content" ON public.free_content;
CREATE POLICY "Service role manages free content"
  ON public.free_content
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS free_content_updated_at ON public.free_content;
CREATE TRIGGER free_content_updated_at
  BEFORE UPDATE ON public.free_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT SELECT ON public.free_content TO anon;
GRANT ALL ON public.free_content TO service_role;
