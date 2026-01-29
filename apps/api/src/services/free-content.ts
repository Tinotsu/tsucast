/**
 * Free Content Service
 *
 * Manages admin-curated free content that anyone can listen to without auth or credits.
 */

import { generateSpeech } from './tts.js';
import { uploadAudio } from './storage.js';
import { fetchUrl } from './fetcher.js';
import { parseHtmlContent } from './parser.js';
import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { LIMITS } from '../utils/errors.js';

// Concurrency limit for background TTS generation
const MAX_CONCURRENT_GENERATIONS = 3;
let activeGenerations = 0;

export interface FreeContentItem {
  id: string;
  title: string;
  voice_id: string;
  source_url: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  word_count: number | null;
  file_size_bytes: number | null;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateFreeContentInput {
  title: string;
  text?: string;
  url?: string;
  voiceId?: string;
}

/**
 * Create a free content item and kick off async TTS generation.
 * Returns the row immediately with status 'processing'.
 * Throws only for duplicate content (Postgres error code 23505).
 */
export async function createFreeContent(input: CreateFreeContentInput): Promise<FreeContentItem> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const voiceId = input.voiceId ?? 'am_adam';

  const { data: row, error } = await supabase
    .from('free_content')
    .insert({
      title: input.title,
      voice_id: voiceId,
      source_url: input.url ?? null,
      status: 'processing',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const dupError = new Error('Content with this URL and voice already exists');
      (dupError as Error & { code: string }).code = 'DUPLICATE_CONTENT';
      throw dupError;
    }
    logger.error({ error }, 'Failed to insert free content row');
    throw error;
  }

  // Fire-and-forget with concurrency guard
  if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
    logger.warn({ contentId: row.id, activeGenerations }, 'Too many concurrent generations, marking as failed');
    updateFailed(supabase, row.id, 'Server busy — too many concurrent generations. Please retry.').catch(() => {});
  } else {
    activeGenerations++;
    processGeneration(row.id, { text: input.text, url: input.url, voiceId })
      .catch(err => logger.error({ contentId: row.id, err }, 'Unhandled error in free content generation'))
      .finally(() => { activeGenerations--; });
  }

  return row as FreeContentItem;
}

/**
 * Async pipeline that does the heavy work: fetch/extract text, generate TTS, upload to R2.
 * NEVER throws — updates the row to 'failed' on any error.
 */
async function processGeneration(
  contentId: string,
  opts: { text?: string; url?: string; voiceId: string }
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    logger.error({ contentId }, 'Supabase not configured during generation');
    return;
  }

  let text = opts.text;
  let wordCount: number;

  try {
    // Step 1: Get text content
    if (opts.url) {
      const html = await fetchUrl(opts.url);
      const parsed = await parseHtmlContent(html, opts.url);
      text = parsed.textContent;
    }

    if (!text) {
      await updateFailed(supabase, contentId, 'No text content available');
      return;
    }

    // Step 2: Validate word count
    wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount > LIMITS.MAX_WORD_COUNT) {
      await updateFailed(supabase, contentId, `Text exceeds ${LIMITS.MAX_WORD_COUNT.toLocaleString()} word limit (${wordCount.toLocaleString()} words)`);
      return;
    }

    // Step 3: Generate speech
    const { audioBuffer, durationSeconds } = await generateSpeech({
      text,
      voiceId: opts.voiceId,
    });

    // Step 4: Upload to R2
    const uploadResult = await uploadAudio(audioBuffer, {
      urlHash: contentId,
      keyPrefix: 'free-content',
    });

    // Step 5: Update row to ready
    const { error: updateError } = await supabase
      .from('free_content')
      .update({
        status: 'ready',
        audio_url: uploadResult.url,
        duration_seconds: durationSeconds,
        word_count: wordCount,
        file_size_bytes: uploadResult.size,
      })
      .eq('id', contentId);

    if (updateError) {
      logger.error({ contentId, error: updateError }, 'Failed to update free content to ready');
    } else {
      logger.info({ contentId, durationSeconds, wordCount }, 'Free content generation complete');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ contentId, error }, 'Free content generation failed');
    await updateFailed(supabase, contentId, message);
  }
}

async function updateFailed(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  contentId: string,
  errorMessage: string
): Promise<void> {
  const { error } = await supabase
    .from('free_content')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', contentId);

  if (error) {
    logger.error({ contentId, error }, 'Failed to update free content to failed status');
  }
}

/**
 * List all free content items (admin view — all statuses).
 */
export async function listFreeContent(): Promise<FreeContentItem[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('free_content')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error }, 'Failed to list free content');
    throw error;
  }

  return (data ?? []) as FreeContentItem[];
}

/**
 * Get public free content (only ready items).
 */
export async function getPublicFreeContent(): Promise<FreeContentItem[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('free_content')
    .select('*')
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error }, 'Failed to get public free content');
    throw error;
  }

  return (data ?? []) as FreeContentItem[];
}

/**
 * Update a free content item's title.
 * Returns the updated item or null if not found.
 */
export async function updateFreeContent(
  id: string,
  updates: { title: string }
): Promise<FreeContentItem | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('free_content')
    .update({ title: updates.title })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    logger.error({ id, error }, 'Failed to update free content');
    throw error;
  }

  return data as FreeContentItem;
}

/**
 * Delete a free content item by ID.
 * Does NOT delete from R2 (audio files are cheap, can be cleaned up later).
 */
export async function deleteFreeContent(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error, count } = await supabase
    .from('free_content')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    logger.error({ id, error }, 'Failed to delete free content');
    throw error;
  }

  return (count ?? 0) > 0;
}
