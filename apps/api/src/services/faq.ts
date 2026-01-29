/**
 * FAQ Service
 *
 * Manages FAQ items for the landing page.
 */

import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFaqInput {
  question: string;
  answer: string;
  position?: number;
  published?: boolean;
}

export interface UpdateFaqInput {
  question?: string;
  answer?: string;
  position?: number;
  published?: boolean;
}

/**
 * Get all published FAQ items ordered by position (public endpoint).
 */
export async function getPublicFaqItems(): Promise<FaqItem[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .eq('published', true)
    .order('position', { ascending: true });

  if (error) {
    logger.error({ error }, 'Failed to get public FAQ items');
    throw error;
  }

  return (data ?? []) as FaqItem[];
}

/**
 * Get all FAQ items (admin view - includes unpublished).
 */
export async function listFaqItems(): Promise<FaqItem[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    logger.error({ error }, 'Failed to list FAQ items');
    throw error;
  }

  return (data ?? []) as FaqItem[];
}

/**
 * Create a new FAQ item.
 */
export async function createFaqItem(input: CreateFaqInput): Promise<FaqItem> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  // If no position specified, add to end
  let position = input.position;
  if (position === undefined) {
    const { count } = await supabase
      .from('faq_items')
      .select('*', { count: 'exact', head: true });
    position = count ?? 0;
  }

  const { data, error } = await supabase
    .from('faq_items')
    .insert({
      question: input.question,
      answer: input.answer,
      position,
      published: input.published ?? true,
    })
    .select()
    .single();

  if (error) {
    logger.error({ error }, 'Failed to create FAQ item');
    throw error;
  }

  return data as FaqItem;
}

/**
 * Update an existing FAQ item.
 */
export async function updateFaqItem(id: string, input: UpdateFaqInput): Promise<FaqItem | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const updates: Record<string, unknown> = {};
  if (input.question !== undefined) updates.question = input.question;
  if (input.answer !== undefined) updates.answer = input.answer;
  if (input.position !== undefined) updates.position = input.position;
  if (input.published !== undefined) updates.published = input.published;

  if (Object.keys(updates).length === 0) {
    // Nothing to update, fetch and return current
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .eq('id', id)
      .single();
    return data as FaqItem | null;
  }

  const { data, error } = await supabase
    .from('faq_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error({ id, error }, 'Failed to update FAQ item');
    throw error;
  }

  return data as FaqItem;
}

/**
 * Delete a FAQ item.
 */
export async function deleteFaqItem(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const { error, count } = await supabase
    .from('faq_items')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    logger.error({ id, error }, 'Failed to delete FAQ item');
    throw error;
  }

  return (count ?? 0) > 0;
}

/**
 * Reorder FAQ items by updating positions.
 * Accepts an array of { id, position } pairs.
 */
export async function reorderFaqItems(items: { id: string; position: number }[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  // Update each item's position
  const updates = items.map(({ id, position }) =>
    supabase
      .from('faq_items')
      .update({ position })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const hasError = results.some(r => r.error);

  if (hasError) {
    logger.error({ items }, 'Failed to reorder FAQ items');
    return false;
  }

  return true;
}
