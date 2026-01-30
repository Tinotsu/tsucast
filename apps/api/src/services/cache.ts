/**
 * Audio Cache Service
 *
 * Handles audio cache operations in Supabase.
 * Story: 3-2 Streaming Audio Generation
 */

import { logger } from '../lib/logger.js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface CacheEntry {
  id: string;
  url_hash: string;
  original_url: string;
  normalized_url: string;
  voice_id: string;
  title: string | null;
  audio_url: string | null;
  transcript_url: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  file_size_bytes: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_by: string | null;
  cover: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a URL+voice combination is cached
 */
export async function getCacheEntry(urlHash: string): Promise<CacheEntry | null> {
  const client = getSupabase();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('audio_cache')
    .select('*')
    .eq('url_hash', urlHash)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      // Not a "not found" error
      logger.error({ error, urlHash }, 'Cache lookup failed');
    }
    return null;
  }

  return data as CacheEntry;
}

/**
 * Claim a cache entry for generation (atomic insert)
 * Returns null if entry already exists
 */
export async function claimCacheEntry(params: {
  urlHash: string;
  originalUrl: string;
  normalizedUrl: string;
  voiceId: string;
  userId?: string;
}): Promise<CacheEntry | null> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await client
    .from('audio_cache')
    .insert({
      url_hash: params.urlHash,
      original_url: params.originalUrl,
      normalized_url: params.normalizedUrl,
      voice_id: params.voiceId,
      status: 'processing',
      created_by: params.userId || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - entry exists
      return null;
    }
    logger.error({ error }, 'Failed to claim cache entry');
    throw error;
  }

  return data as CacheEntry;
}

/**
 * Update cache entry with completed audio
 */
export async function updateCacheReady(params: {
  urlHash: string;
  title: string;
  audioUrl: string;
  durationSeconds: number;
  wordCount: number;
  fileSizeBytes: number;
  cover?: string | null;
  transcriptUrl?: string | null;
}): Promise<void> {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase not configured');
  }

  const { error } = await client
    .from('audio_cache')
    .update({
      status: 'ready',
      title: params.title,
      audio_url: params.audioUrl,
      transcript_url: params.transcriptUrl ?? null,
      duration_seconds: params.durationSeconds,
      word_count: params.wordCount,
      file_size_bytes: params.fileSizeBytes,
      cover: params.cover ?? null,
    })
    .eq('url_hash', params.urlHash);

  if (error) {
    logger.error({ error }, 'Failed to update cache entry');
    throw error;
  }
}

/**
 * Mark cache entry as failed
 */
export async function updateCacheFailed(
  urlHash: string,
  errorMessage: string
): Promise<void> {
  const client = getSupabase();
  if (!client) {
    return;
  }

  const { error } = await client
    .from('audio_cache')
    .update({
      status: 'failed',
      error_message: errorMessage,
    })
    .eq('url_hash', urlHash);

  if (error) {
    logger.error({ error }, 'Failed to mark cache as failed');
  }
}

/**
 * Get cache entry by ID (for polling)
 */
export async function getCacheEntryById(id: string): Promise<CacheEntry | null> {
  const client = getSupabase();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from('audio_cache')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as CacheEntry;
}

/**
 * Check if cache service is configured
 */
export function isCacheConfigured(): boolean {
  return isSupabaseConfigured();
}

/**
 * Check if a cache entry is stale (stuck in processing for too long)
 * Default timeout: 5 minutes
 */
export function isStaleEntry(entry: CacheEntry, timeoutMs: number = 5 * 60 * 1000): boolean {
  if (entry.status !== 'processing') {
    return false;
  }

  const updatedAt = new Date(entry.updated_at).getTime();
  const now = Date.now();

  return now - updatedAt > timeoutMs;
}

/**
 * Delete a cache entry by url_hash (for cleaning up stale entries)
 */
export async function deleteCacheEntry(urlHash: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) {
    return false;
  }

  const { error } = await client
    .from('audio_cache')
    .delete()
    .eq('url_hash', urlHash);

  if (error) {
    logger.error({ error, urlHash }, 'Failed to delete cache entry');
    return false;
  }

  logger.info({ urlHash }, 'Deleted stale cache entry');
  return true;
}
