/**
 * Audio Cache Service
 *
 * Handles audio cache operations in Supabase.
 * Story: 3-2 Streaming Audio Generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger.js';

// Initialize Supabase client (lazy loaded)
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) {
    return supabase;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

export interface CacheEntry {
  id: string;
  url_hash: string;
  original_url: string;
  normalized_url: string;
  voice_id: string;
  title: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  file_size_bytes: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_by: string | null;
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
      duration_seconds: params.durationSeconds,
      word_count: params.wordCount,
      file_size_bytes: params.fileSizeBytes,
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
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
