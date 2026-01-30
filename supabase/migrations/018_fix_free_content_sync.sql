-- Migration: Fix free content sync to audio_cache
-- The previous migration had a bug - ON CONFLICT can't update primary key

-- Simple approach: Insert with the free_content.id as both id and part of url_hash
-- This ensures the ID matches exactly
INSERT INTO public.audio_cache (
  id,
  url_hash,
  original_url,
  normalized_url,
  voice_id,
  title,
  audio_url,
  duration_seconds,
  word_count,
  file_size_bytes,
  status,
  created_at,
  updated_at
)
SELECT
  fc.id,
  'free-content:' || fc.id::text,
  COALESCE(fc.source_url, 'free-content:' || fc.id::text),
  COALESCE(fc.source_url, 'free-content:' || fc.id::text),
  fc.voice_id,
  fc.title,
  fc.audio_url,
  fc.duration_seconds,
  fc.word_count,
  fc.file_size_bytes,
  'ready',
  fc.created_at,
  fc.updated_at
FROM public.free_content fc
WHERE fc.status = 'ready'
  AND fc.audio_url IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  url_hash = EXCLUDED.url_hash,
  title = EXCLUDED.title,
  audio_url = EXCLUDED.audio_url,
  duration_seconds = EXCLUDED.duration_seconds,
  word_count = EXCLUDED.word_count,
  file_size_bytes = EXCLUDED.file_size_bytes,
  status = 'ready',
  updated_at = EXCLUDED.updated_at;
