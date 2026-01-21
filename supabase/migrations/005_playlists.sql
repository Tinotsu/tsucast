-- Migration: 005_playlists.sql
-- Story: 4-3 Playlist Management
-- Description: Create playlists and playlist_items tables

-- Playlists table
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);

-- Playlist Items table (junction table with ordering)
CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playlist_id, audio_id)
);

CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_audio_id ON playlist_items(audio_id);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists
CREATE POLICY "Users can view own playlists"
  ON playlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for playlist_items
CREATE POLICY "Users can view own playlist items"
  ON playlist_items FOR SELECT
  USING (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));

CREATE POLICY "Users can add to own playlists"
  ON playlist_items FOR INSERT
  WITH CHECK (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own playlist items"
  ON playlist_items FOR UPDATE
  USING (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove from own playlists"
  ON playlist_items FOR DELETE
  USING (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
