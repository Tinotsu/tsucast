-- Migration: Audio Streams for HLS Streaming
-- Story: Streaming Audio Generation (HLS + Together.ai)
-- Created: 2026-01-28

-- Audio streams table - tracks chunked generation progress
CREATE TABLE audio_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to audio_cache entry (nullable - set after cache entry created)
  cache_id UUID REFERENCES audio_cache(id) ON DELETE CASCADE,

  -- URL hash for linking (since cache_id might not be available at creation)
  url_hash TEXT NOT NULL,

  -- Stream metadata
  total_chunks INTEGER NOT NULL,
  chunks_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed', 'partial')),

  -- HLS manifest
  manifest_url TEXT,

  -- Total duration (sum of all chunks)
  total_duration_seconds REAL,

  -- Error tracking
  failed_chunk INTEGER,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Stream chunks table - tracks individual chunk generation
CREATE TABLE audio_stream_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES audio_streams(id) ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  text_preview TEXT, -- First 100 chars for debugging

  -- Generated segment
  duration_seconds REAL,
  segment_url TEXT,
  segment_size_bytes INTEGER,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(stream_id, chunk_index)
);

-- Indexes for efficient queries
CREATE INDEX idx_audio_streams_cache_id ON audio_streams(cache_id);
CREATE INDEX idx_audio_streams_url_hash ON audio_streams(url_hash);
CREATE INDEX idx_audio_streams_status ON audio_streams(status);
CREATE INDEX idx_audio_streams_created_at ON audio_streams(created_at);
CREATE INDEX idx_audio_stream_chunks_stream_id ON audio_stream_chunks(stream_id);
CREATE INDEX idx_audio_stream_chunks_status ON audio_stream_chunks(status);

-- Updated at trigger for audio_streams
CREATE TRIGGER audio_streams_updated_at
  BEFORE UPDATE ON audio_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment chunks completed atomically
CREATE OR REPLACE FUNCTION increment_chunks_completed(p_stream_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE audio_streams
  SET
    chunks_completed = chunks_completed + 1,
    updated_at = now()
  WHERE id = p_stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate total duration from completed chunks
CREATE OR REPLACE FUNCTION update_stream_total_duration(p_stream_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE audio_streams
  SET
    total_duration_seconds = (
      SELECT COALESCE(SUM(duration_seconds), 0)
      FROM audio_stream_chunks
      WHERE stream_id = p_stream_id AND status = 'ready'
    ),
    updated_at = now()
  WHERE id = p_stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE audio_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_stream_chunks ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (API uses service role)
CREATE POLICY "Service role full access on audio_streams"
  ON audio_streams FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on audio_stream_chunks"
  ON audio_stream_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read streams (for status polling)
CREATE POLICY "Authenticated users can read streams"
  ON audio_streams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read stream chunks"
  ON audio_stream_chunks FOR SELECT
  TO authenticated
  USING (true);

-- Grant execute on functions to service_role
GRANT EXECUTE ON FUNCTION increment_chunks_completed(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_stream_total_duration(UUID) TO service_role;

COMMENT ON TABLE audio_streams IS 'Tracks HLS streaming audio generation with chunked processing';
COMMENT ON TABLE audio_stream_chunks IS 'Individual chunks within a streaming audio generation';
