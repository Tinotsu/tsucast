-- Migration: Sync existing free content to audio_cache for playlist compatibility
-- This allows free content items to be added to playlists via the audio_id FK

-- Insert ready free content items into audio_cache (using same ID)
-- ON CONFLICT DO NOTHING to handle any that already exist
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
ON CONFLICT (id) DO NOTHING;

-- Also handle url_hash uniqueness - update if url_hash already exists
-- This uses a CTE to handle the case where we need to update existing rows
WITH to_sync AS (
  SELECT
    fc.id,
    'free-content:' || fc.id::text AS url_hash,
    COALESCE(fc.source_url, 'free-content:' || fc.id::text) AS original_url,
    COALESCE(fc.source_url, 'free-content:' || fc.id::text) AS normalized_url,
    fc.voice_id,
    fc.title,
    fc.audio_url,
    fc.duration_seconds,
    fc.word_count,
    fc.file_size_bytes,
    fc.created_at,
    fc.updated_at
  FROM public.free_content fc
  WHERE fc.status = 'ready'
    AND fc.audio_url IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.audio_cache ac WHERE ac.id = fc.id
    )
)
INSERT INTO public.audio_cache (
  id, url_hash, original_url, normalized_url, voice_id, title,
  audio_url, duration_seconds, word_count, file_size_bytes,
  status, created_at, updated_at
)
SELECT
  id, url_hash, original_url, normalized_url, voice_id, title,
  audio_url, duration_seconds, word_count, file_size_bytes,
  'ready', created_at, updated_at
FROM to_sync
ON CONFLICT (url_hash) DO UPDATE SET
  id = EXCLUDED.id,
  title = EXCLUDED.title,
  audio_url = EXCLUDED.audio_url,
  duration_seconds = EXCLUDED.duration_seconds,
  word_count = EXCLUDED.word_count,
  file_size_bytes = EXCLUDED.file_size_bytes,
  status = 'ready',
  updated_at = EXCLUDED.updated_at;
