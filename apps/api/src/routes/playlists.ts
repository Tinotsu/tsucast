/**
 * Playlist Routes
 *
 * API endpoints for playlist management.
 * Story: 4-3 Playlist Management
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { getSupabase } from '../lib/supabase.js';
import { getUserFromToken } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

// Validation schemas
const playlistNameSchema = z.string()
  .trim()
  .min(1, 'Playlist name is required')
  .max(255, 'Playlist name too long (max 255 characters)');

const playlists = new Hono();

/**
 * GET /api/playlists
 * Get all playlists for the authenticated user
 */
playlists.get('/', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  const { data, error } = await client
    .from('playlists')
    .select(`
      id,
      name,
      created_at,
      updated_at,
      playlist_items(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error, userId }, 'Failed to fetch playlists');
    return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch playlists' } }, 500);
  }

  // Transform the count structure
  const playlistsWithCount = data?.map((playlist) => ({
    ...playlist,
    itemCount: playlist.playlist_items?.[0]?.count || 0,
  }));

  return c.json({ playlists: playlistsWithCount });
});

/**
 * POST /api/playlists
 * Create a new playlist
 */
playlists.post('/', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }

  const body = await c.req.json();
  const nameResult = playlistNameSchema.safeParse(body?.name);

  if (!nameResult.success) {
    const message = nameResult.error.errors[0]?.message || 'Invalid playlist name';
    return c.json({ error: { code: 'INVALID_INPUT', message } }, 400);
  }

  const { data, error } = await client
    .from('playlists')
    .insert({ user_id: userId, name: nameResult.data })
    .select()
    .single();

  if (error) {
    logger.error({ error, userId }, 'Failed to create playlist');
    return c.json({ error: { code: 'CREATE_FAILED', message: 'Failed to create playlist' } }, 500);
  }

  return c.json({ playlist: data }, 201);
});

/**
 * GET /api/playlists/:id
 * Get a single playlist with its items
 */
playlists.get('/:id', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');

  const { data: playlist, error: playlistError } = await client
    .from('playlists')
    .select('id, name, created_at, updated_at')
    .eq('id', playlistId)
    .eq('user_id', userId)
    .single();

  if (playlistError || !playlist) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Playlist not found' } }, 404);
  }

  const { data: items } = await client
    .from('playlist_items')
    .select(`
      id,
      position,
      added_at,
      audio:audio_cache (
        id,
        title,
        audio_url,
        duration_seconds,
        original_url
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  return c.json({ playlist: { ...playlist, items: items || [] } });
});

/**
 * PATCH /api/playlists/:id
 * Rename a playlist
 */
playlists.patch('/:id', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');
  const body = await c.req.json();
  const nameResult = playlistNameSchema.safeParse(body?.name);

  if (!nameResult.success) {
    const message = nameResult.error.errors[0]?.message || 'Invalid playlist name';
    return c.json({ error: { code: 'INVALID_INPUT', message } }, 400);
  }

  const { error } = await client
    .from('playlists')
    .update({ name: nameResult.data })
    .eq('id', playlistId)
    .eq('user_id', userId);

  if (error) {
    logger.error({ error, userId, playlistId }, 'Failed to update playlist');
    return c.json({ error: { code: 'UPDATE_FAILED', message: 'Failed to update playlist' } }, 500);
  }

  return c.json({ success: true });
});

/**
 * DELETE /api/playlists/:id
 * Delete a playlist (items remain in library)
 */
playlists.delete('/:id', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');

  const { error } = await client
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', userId);

  if (error) {
    logger.error({ error, userId, playlistId }, 'Failed to delete playlist');
    return c.json({ error: { code: 'DELETE_FAILED', message: 'Failed to delete playlist' } }, 500);
  }

  return c.json({ success: true });
});

/**
 * POST /api/playlists/:id/items
 * Add an audio item to a playlist
 */
playlists.post('/:id/items', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');
  const body = await c.req.json();
  const { audioId } = body;

  if (!audioId) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'Audio ID is required' } }, 400);
  }

  // Verify playlist belongs to user
  const { data: playlist } = await client
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', userId)
    .single();

  if (!playlist) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Playlist not found' } }, 404);
  }

  // Check if audioId exists in audio_cache
  const { data: audioExists } = await client
    .from('audio_cache')
    .select('id')
    .eq('id', audioId)
    .single();

  // If not in audio_cache, check if it's free content and sync it
  if (!audioExists) {
    const { data: freeContent } = await client
      .from('free_content')
      .select('id, title, voice_id, source_url, audio_url, duration_seconds, word_count, file_size_bytes')
      .eq('id', audioId)
      .eq('status', 'ready')
      .single();

    if (freeContent && freeContent.audio_url) {
      // Sync free content to audio_cache
      const { error: syncError } = await client
        .from('audio_cache')
        .upsert({
          id: freeContent.id,
          url_hash: `free-content:${freeContent.id}`,
          original_url: freeContent.source_url || `free-content:${freeContent.id}`,
          normalized_url: freeContent.source_url || `free-content:${freeContent.id}`,
          voice_id: freeContent.voice_id,
          title: freeContent.title,
          audio_url: freeContent.audio_url,
          duration_seconds: freeContent.duration_seconds,
          word_count: freeContent.word_count,
          file_size_bytes: freeContent.file_size_bytes,
          status: 'ready',
        }, { onConflict: 'id' });

      if (syncError) {
        logger.error({ syncError, audioId }, 'Failed to sync free content to audio_cache');
        return c.json({ error: { code: 'SYNC_FAILED', message: 'Failed to prepare audio for playlist' } }, 500);
      }
    } else {
      return c.json({ error: { code: 'NOT_FOUND', message: 'Audio not found' } }, 404);
    }
  }

  // Get next position
  const { data: existing } = await client
    .from('playlist_items')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { error } = await client
    .from('playlist_items')
    .insert({
      playlist_id: playlistId,
      audio_id: audioId,
      position: nextPosition,
    });

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: { code: 'DUPLICATE', message: 'Item already in playlist' } }, 409);
    }
    logger.error({ error, userId, playlistId, audioId }, 'Failed to add to playlist');
    return c.json({ error: { code: 'ADD_FAILED', message: 'Failed to add to playlist' } }, 500);
  }

  return c.json({ success: true }, 201);
});

/**
 * DELETE /api/playlists/:id/items/:itemId
 * Remove an item from a playlist
 */
playlists.delete('/:id/items/:itemId', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');
  const itemId = c.req.param('itemId');

  // Verify playlist belongs to user
  const { data: playlist } = await client
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', userId)
    .single();

  if (!playlist) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Playlist not found' } }, 404);
  }

  const { error } = await client
    .from('playlist_items')
    .delete()
    .eq('id', itemId)
    .eq('playlist_id', playlistId);

  if (error) {
    logger.error({ error, userId, playlistId, itemId }, 'Failed to remove from playlist');
    return c.json({ error: { code: 'REMOVE_FAILED', message: 'Failed to remove from playlist' } }, 500);
  }

  return c.json({ success: true });
});

/**
 * PUT /api/playlists/:id/reorder
 * Reorder items in a playlist
 */
playlists.put('/:id/reorder', async (c) => {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Database not configured' } }, 503);
  }
  const playlistId = c.req.param('id');
  const body = await c.req.json();
  const { itemIds } = body;

  if (!Array.isArray(itemIds)) {
    return c.json({ error: { code: 'INVALID_INPUT', message: 'Item IDs array is required' } }, 400);
  }

  // Verify playlist belongs to user
  const { data: playlist } = await client
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', userId)
    .single();

  if (!playlist) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Playlist not found' } }, 404);
  }

  // Fetch existing items to get audio_id for upsert (needed for batch update)
  const { data: existingItems, error: fetchError } = await client
    .from('playlist_items')
    .select('id, audio_id')
    .eq('playlist_id', playlistId)
    .in('id', itemIds);

  if (fetchError) {
    logger.error({ error: fetchError, playlistId }, 'Failed to fetch playlist items for reorder');
    return c.json({ error: { code: 'REORDER_FAILED', message: 'Failed to reorder playlist' } }, 500);
  }

  // Create a map for quick lookup
  const itemMap = new Map(existingItems?.map((item) => [item.id, item.audio_id]) || []);

  // Validate all itemIds exist in playlist
  const missingIds = itemIds.filter((id: string) => !itemMap.has(id));
  if (missingIds.length > 0) {
    return c.json({
      error: { code: 'INVALID_INPUT', message: 'Some item IDs not found in playlist' },
      missingItems: missingIds,
    }, 400);
  }

  // Build batch upsert data with new positions
  const upsertData = itemIds.map((id: string, index: number) => ({
    id,
    playlist_id: playlistId,
    audio_id: itemMap.get(id),
    position: index,
  }));

  // Single batch upsert - much more efficient than N individual updates
  const { error: upsertError } = await client
    .from('playlist_items')
    .upsert(upsertData, { onConflict: 'id' });

  if (upsertError) {
    logger.error({ error: upsertError, playlistId }, 'Failed to reorder playlist items');
    return c.json({ error: { code: 'REORDER_FAILED', message: 'Failed to reorder playlist' } }, 500);
  }

  return c.json({ success: true });
});

export default playlists;
