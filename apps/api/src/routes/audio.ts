/**
 * Audio Routes
 *
 * API endpoints for audio operations (copy, etc.)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { createApiError } from '../utils/errors.js';

const app = new Hono();

/**
 * POST /api/audio/copy
 * Create a user's copy of free content audio.
 * Used when a user wants to edit free content (they must own it first).
 */
const copyAudioSchema = z.object({
  audioId: z.string().uuid(),
  playlistItemId: z.string().uuid().optional(),
});

app.post('/copy', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: createApiError('UNAUTHORIZED', 'Authentication required') }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: createApiError('SERVICE_UNAVAILABLE', 'Database not configured') }, 503);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = copyAudioSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  const { audioId, playlistItemId } = parsed.data;

  // 1. Fetch the source audio from audio_cache
  const { data: sourceAudio, error: fetchError } = await client
    .from('audio_cache')
    .select('*')
    .eq('id', audioId)
    .single();

  if (fetchError || !sourceAudio) {
    return c.json({ error: createApiError('NOT_FOUND', 'Audio not found') }, 404);
  }

  // 2. Check if it's free content (created_by is null)
  if (sourceAudio.created_by !== null) {
    // Already owned by someone - check if it's the current user
    if (sourceAudio.created_by === userId) {
      return c.json({ error: createApiError('ALREADY_OWNED', 'You already own this audio') }, 400);
    }
    return c.json({ error: createApiError('NOT_FREE_CONTENT', 'Cannot copy audio owned by another user') }, 403);
  }

  // 3. Create a copy with the user as owner
  const { data: newAudio, error: insertError } = await client
    .from('audio_cache')
    .insert({
      url_hash: `user-copy:${userId}:${audioId}:${Date.now()}`,
      original_url: sourceAudio.original_url,
      normalized_url: sourceAudio.normalized_url,
      voice_id: sourceAudio.voice_id,
      title: sourceAudio.title,
      cover: sourceAudio.cover,
      audio_url: sourceAudio.audio_url,
      duration_seconds: sourceAudio.duration_seconds,
      word_count: sourceAudio.word_count,
      file_size_bytes: sourceAudio.file_size_bytes,
      status: sourceAudio.status,
      created_by: userId,
    })
    .select()
    .single();

  if (insertError || !newAudio) {
    logger.error({ error: insertError, audioId, userId }, 'Failed to create audio copy');
    return c.json({ error: createApiError('COPY_FAILED', 'Failed to create audio copy') }, 500);
  }

  // 4. If playlistItemId provided, update that item to point to the new audio
  if (playlistItemId) {
    // First verify the playlist item belongs to a playlist owned by this user
    const { data: playlistItem } = await client
      .from('playlist_items')
      .select('id, playlist_id, playlists!inner(user_id)')
      .eq('id', playlistItemId)
      .single();

    if (playlistItem) {
      // Check ownership via the joined playlists table
      const playlist = playlistItem.playlists as unknown as { user_id: string } | { user_id: string }[];
      const playlistOwner = Array.isArray(playlist) ? playlist[0]?.user_id : playlist?.user_id;

      if (playlistOwner === userId) {
        const { error: updateError } = await client
          .from('playlist_items')
          .update({ audio_id: newAudio.id })
          .eq('id', playlistItemId);

        if (updateError) {
          logger.error({ error: updateError, playlistItemId, newAudioId: newAudio.id }, 'Failed to update playlist item');
          // Don't fail the whole request - the copy was successful
        }
      }
    }
  }

  return c.json({
    newAudioId: newAudio.id,
    title: newAudio.title,
    cover: newAudio.cover,
  }, 201);
});

export default app;
