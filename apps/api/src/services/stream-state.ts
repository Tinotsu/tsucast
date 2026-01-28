/**
 * Stream State Service
 *
 * Manages audio_streams and audio_stream_chunks tables.
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { getSupabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export interface CreateStreamParams {
  urlHash: string;
  cacheId?: string; // Optional - may not have cache entry yet
  totalChunks: number;
  chunks: Array<{ index: number; wordCount: number; textPreview?: string }>;
}

export interface StreamState {
  id: string;
  urlHash: string;
  cacheId: string | null;
  totalChunks: number;
  chunksCompleted: number;
  status: 'processing' | 'ready' | 'failed' | 'partial';
  manifestUrl: string | null;
  totalDurationSeconds: number | null;
  failedChunk: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ChunkState {
  id: string;
  streamId: string;
  chunkIndex: number;
  wordCount: number;
  durationSeconds: number | null;
  segmentUrl: string | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  errorMessage: string | null;
}

/**
 * Create a new stream with chunks
 */
export async function createStream(params: CreateStreamParams): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Create stream record
  const { data: stream, error: streamError } = await supabase
    .from('audio_streams')
    .insert({
      url_hash: params.urlHash,
      cache_id: params.cacheId || null,
      total_chunks: params.totalChunks,
      chunks_completed: 0,
      status: 'processing',
    })
    .select('id')
    .single();

  if (streamError || !stream) {
    logger.error({ error: streamError }, 'Failed to create stream');
    throw new Error('Failed to create stream');
  }

  // Create chunk records
  const chunkRecords = params.chunks.map((c) => ({
    stream_id: stream.id,
    chunk_index: c.index,
    word_count: c.wordCount,
    text_preview: c.textPreview || null,
    status: 'pending',
  }));

  const { error: chunksError } = await supabase
    .from('audio_stream_chunks')
    .insert(chunkRecords);

  if (chunksError) {
    logger.error({ error: chunksError }, 'Failed to create chunk records');
    // Clean up the stream record
    await supabase.from('audio_streams').delete().eq('id', stream.id);
    throw new Error('Failed to create chunk records');
  }

  logger.info(
    { streamId: stream.id, totalChunks: params.totalChunks },
    'Stream created'
  );

  return stream.id;
}

/**
 * Mark chunk as processing (started)
 */
export async function startChunk(
  streamId: string,
  chunkIndex: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  await supabase
    .from('audio_stream_chunks')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('stream_id', streamId)
    .eq('chunk_index', chunkIndex);
}

/**
 * Mark chunk as completed with segment info
 */
export async function completeChunk(
  streamId: string,
  chunkIndex: number,
  segmentUrl: string,
  durationSeconds: number,
  segmentSizeBytes: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Update chunk
  const { error: chunkError } = await supabase
    .from('audio_stream_chunks')
    .update({
      status: 'ready',
      segment_url: segmentUrl,
      duration_seconds: durationSeconds,
      segment_size_bytes: segmentSizeBytes,
      completed_at: new Date().toISOString(),
    })
    .eq('stream_id', streamId)
    .eq('chunk_index', chunkIndex);

  if (chunkError) {
    logger.error({ error: chunkError }, 'Failed to update chunk');
    throw chunkError;
  }

  // Increment completed count using RPC
  const { error: rpcError } = await supabase.rpc('increment_chunks_completed', {
    p_stream_id: streamId,
  });

  if (rpcError) {
    logger.error({ error: rpcError }, 'Failed to increment chunks_completed');
    // Non-fatal - continue anyway
  }
}

/**
 * Mark chunk as failed
 */
export async function failChunk(
  streamId: string,
  chunkIndex: number,
  errorMessage: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  // Update chunk
  await supabase
    .from('audio_stream_chunks')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('stream_id', streamId)
    .eq('chunk_index', chunkIndex);

  // Mark stream as failed
  await supabase
    .from('audio_streams')
    .update({
      status: 'failed',
      failed_chunk: chunkIndex,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', streamId);

  logger.warn(
    { streamId, chunkIndex, errorMessage },
    'Chunk failed'
  );
}

/**
 * Mark stream as complete
 */
export async function completeStream(
  streamId: string,
  manifestUrl: string,
  totalDurationSeconds: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  await supabase
    .from('audio_streams')
    .update({
      status: 'ready',
      manifest_url: manifestUrl,
      total_duration_seconds: totalDurationSeconds,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', streamId);

  logger.info({ streamId, manifestUrl, totalDurationSeconds }, 'Stream completed');
}

/**
 * Update stream manifest URL (called after each chunk)
 */
export async function updateStreamManifest(
  streamId: string,
  manifestUrl: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from('audio_streams')
    .update({
      manifest_url: manifestUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', streamId);
}

/**
 * Link stream to cache entry
 */
export async function linkStreamToCache(
  streamId: string,
  cacheId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase
    .from('audio_streams')
    .update({ cache_id: cacheId })
    .eq('id', streamId);
}

/**
 * Get stream state by ID
 */
export async function getStreamState(streamId: string): Promise<StreamState | null> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('audio_streams')
    .select('*')
    .eq('id', streamId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    urlHash: data.url_hash,
    cacheId: data.cache_id,
    totalChunks: data.total_chunks,
    chunksCompleted: data.chunks_completed,
    status: data.status,
    manifestUrl: data.manifest_url,
    totalDurationSeconds: data.total_duration_seconds,
    failedChunk: data.failed_chunk,
    errorMessage: data.error_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}

/**
 * Get stream state by URL hash
 */
export async function getStreamByUrlHash(urlHash: string): Promise<StreamState | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('audio_streams')
    .select('*')
    .eq('url_hash', urlHash)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    urlHash: data.url_hash,
    cacheId: data.cache_id,
    totalChunks: data.total_chunks,
    chunksCompleted: data.chunks_completed,
    status: data.status,
    manifestUrl: data.manifest_url,
    totalDurationSeconds: data.total_duration_seconds,
    failedChunk: data.failed_chunk,
    errorMessage: data.error_message,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}

/**
 * Get completed chunks for a stream
 */
export async function getCompletedChunks(streamId: string): Promise<ChunkState[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data, error } = await supabase
    .from('audio_stream_chunks')
    .select('*')
    .eq('stream_id', streamId)
    .eq('status', 'ready')
    .order('chunk_index');

  if (error) {
    logger.error({ error }, 'Failed to get completed chunks');
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    streamId: c.stream_id,
    chunkIndex: c.chunk_index,
    wordCount: c.word_count,
    durationSeconds: c.duration_seconds,
    segmentUrl: c.segment_url,
    status: c.status,
    errorMessage: c.error_message,
  }));
}

/**
 * Get all chunks for a stream (any status)
 */
export async function getAllChunks(streamId: string): Promise<ChunkState[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Database not configured');
  }

  const { data } = await supabase
    .from('audio_stream_chunks')
    .select('*')
    .eq('stream_id', streamId)
    .order('chunk_index');

  return (data || []).map((c) => ({
    id: c.id,
    streamId: c.stream_id,
    chunkIndex: c.chunk_index,
    wordCount: c.word_count,
    durationSeconds: c.duration_seconds,
    segmentUrl: c.segment_url,
    status: c.status,
    errorMessage: c.error_message,
  }));
}
