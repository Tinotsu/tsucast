/**
 * Library Routes
 *
 * Handles user library CRUD operations.
 * Story: 4-1 Library View, 4-2 Playback Progress Tracking
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';

const app = new Hono();

// Schema validation
const addToLibrarySchema = z.object({
  audioId: z.string().uuid(),
});

const updatePositionSchema = z.object({
  position: z.number().int().min(0),
  isPlayed: z.boolean().optional(),
});

// Get user's library
app.get('/', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  logger.info({ userId }, 'Fetching library');

  const { data, error } = await client
    .from('user_library')
    .select(`
      id,
      playback_position,
      is_played,
      added_at,
      audio:audio_cache (
        id,
        title,
        audio_url,
        duration_seconds,
        word_count,
        original_url
      )
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) {
    logger.error({ error, userId }, 'Failed to fetch library');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to load library' } }, 500);
  }

  // Flatten the nested audio data for client consumption
  type AudioData = {
    id: string;
    title: string;
    audio_url: string;
    duration_seconds: number;
    word_count: number;
    original_url: string;
  };

  const items = (data || []).map((item) => {
    // Supabase returns relations as arrays, get first element
    const audioRaw = item.audio as AudioData | AudioData[] | null;
    const audio = Array.isArray(audioRaw) ? audioRaw[0] : audioRaw;

    return {
      id: item.id,
      audio_id: audio?.id || '',
      title: audio?.title || 'Untitled',
      url: audio?.original_url || '',
      audio_url: audio?.audio_url || '',
      duration: audio?.duration_seconds || 0,
      playback_position: item.playback_position,
      is_played: item.is_played,
      created_at: item.added_at,
    };
  });

  return c.json({ items });
});

// Add item to library
app.post('/', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const body = await c.req.json();
  const parsed = addToLibrarySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: { code: 'INVALID_REQUEST', message: 'audioId is required' } }, 400);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  const { audioId } = parsed.data;
  logger.info({ userId, audioId }, 'Adding to library');

  const { data, error } = await client
    .from('user_library')
    .upsert(
      { user_id: userId, audio_id: audioId },
      { onConflict: 'user_id,audio_id' }
    )
    .select()
    .single();

  if (error) {
    logger.error({ error, userId, audioId }, 'Failed to add to library');
    return c.json({ error: { code: 'ADD_FAILED', message: 'Failed to add to library' } }, 500);
  }

  return c.json({ success: true, item: data });
});

// Update playback position
app.patch('/:id/position', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const id = c.req.param('id');
  const body = await c.req.json();
  const parsed = updatePositionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: { code: 'INVALID_REQUEST', message: 'position must be a non-negative integer' } }, 400);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  const { position, isPlayed } = parsed.data;
  logger.info({ userId, id, position }, 'Updating playback position');

  // First verify the item exists and belongs to the user
  const { data: existingItem, error: fetchError } = await client
    .from('user_library')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existingItem) {
    logger.warn({ userId, id }, 'Library item not found or unauthorized');
    return c.json({ error: { code: 'NOT_FOUND', message: 'Library item not found' } }, 404);
  }

  const updateData: Record<string, unknown> = { playback_position: position };
  if (isPlayed !== undefined) {
    updateData.is_played = isPlayed;
  }

  const { error } = await client
    .from('user_library')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error({ error, userId, id }, 'Failed to update position');
    return c.json({ error: { code: 'UPDATE_FAILED', message: 'Failed to update position' } }, 500);
  }

  return c.json({ success: true });
});

// Delete from library
app.delete('/:id', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const id = c.req.param('id');

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  logger.info({ userId, id }, 'Deleting from library');

  const { error } = await client
    .from('user_library')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error({ error, userId, id }, 'Failed to delete from library');
    return c.json({ error: { code: 'DELETE_FAILED', message: 'Failed to delete' } }, 500);
  }

  return c.json({ success: true });
});

export default app;
