/**
 * Email Sequence Service
 *
 * Manages onboarding drip sequences and transactional emails.
 * Uses Supabase tables for state, Resend for delivery.
 */

import { logger } from '../lib/logger.js';
import { getSupabase } from '../lib/supabase.js';
import { sendEmail, escapeHtml } from '../lib/email.js';
import { generateUnsubscribeToken } from '../lib/unsubscribe-token.js';

const MAX_SEND_FAILURES = 3;
const QUEUE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const AUTO_ENROLL_LIMIT = 200;

let warnedMissingBaseUrl = false;

function getBaseUrl(): string {
  if (!process.env.WEB_URL && !warnedMissingBaseUrl) {
    logger.warn('WEB_URL not set — unsubscribe links will use fallback https://tsucast.app');
    warnedMissingBaseUrl = true;
  }
  return process.env.WEB_URL || 'https://tsucast.app';
}

/**
 * Render template by replacing {{variable}} placeholders with HTML-escaped values.
 */
function renderTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value !== undefined ? escapeHtml(value) : `{{${key}}}`;
  });
}

/**
 * Render plain text template (no HTML escaping needed).
 */
function renderTextTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value !== undefined ? value : `{{${key}}}`;
  });
}

/**
 * Enroll a user in a sequence. Idempotent (ON CONFLICT DO NOTHING).
 * Sends the welcome email (step 1, delay_hours=0) immediately to avoid
 * waiting up to 59 minutes for the next queue run.
 */
export async function enrollUser(userId: string, sequenceSlug: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Check if user has an email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!profile?.email) {
    logger.warn({ userId, sequenceSlug }, 'Cannot enroll user without email');
    return;
  }

  // Look up the sequence
  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('slug', sequenceSlug)
    .single();

  if (!sequence) {
    logger.warn({ sequenceSlug }, 'Sequence not found');
    return;
  }

  // Look up the first step (step_order = 1, delay_hours = 0) for immediate send
  const { data: firstStep } = await supabase
    .from('email_sequence_steps')
    .select('id, step_order, delay_hours, template_id')
    .eq('sequence_id', sequence.id)
    .eq('step_order', 1)
    .single();

  const sendImmediately = firstStep && firstStep.delay_hours === 0;

  // Insert enrollment. If first step is immediate, start at step 1 (already sent).
  const { error: insertError } = await supabase
    .from('user_email_state')
    .insert({
      user_id: userId,
      sequence_id: sequence.id,
      current_step: sendImmediately ? 1 : 0,
      last_sent_at: sendImmediately ? new Date().toISOString() : null,
    });

  // Check for unique constraint conflict (user already enrolled)
  if (insertError) {
    if (insertError.code === '23505') {
      // Already enrolled — skip silently
      return;
    }
    logger.error({ error: insertError, userId, sequenceSlug }, 'Failed to enroll user');
    return;
  }

  // Send welcome email immediately if step 1 has delay_hours = 0
  if (sendImmediately && firstStep) {
    try {
      await sendStepEmail(userId, profile.email, sequence.id, firstStep.template_id, {});
    } catch (emailError) {
      // Don't roll back enrollment — user proceeds to step 2 normally
      logger.error({ error: emailError, userId }, 'Failed to send welcome email during enrollment');
    }
  }

  logger.info({ userId, sequenceSlug }, 'User enrolled in sequence');
}

/**
 * Send a single step email to a user.
 */
async function sendStepEmail(
  userId: string,
  userEmail: string,
  sequenceId: string,
  templateId: string,
  extraVariables: Record<string, string>,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: template } = await supabase
    .from('email_templates')
    .select('subject, html_body, text_body')
    .eq('id', templateId)
    .single();

  if (!template) {
    logger.error({ templateId }, 'Email template not found');
    return;
  }

  // Build variables
  const unsubscribeToken = generateUnsubscribeToken(userId, sequenceId);
  const unsubscribeUrl = `${getBaseUrl()}/api/email/unsubscribe?token=${unsubscribeToken}`;
  const name = userEmail.split('@')[0]; // Simple fallback

  const variables: Record<string, string> = {
    name,
    unsubscribeUrl,
    ...extraVariables,
  };

  const subject = renderTextTemplate(template.subject, variables);
  const html = renderTemplate(template.html_body, variables);
  const text = renderTextTemplate(template.text_body, variables);

  await sendEmail(userEmail, subject, html, text);
}

/**
 * Process the email queue: auto-enroll new users, then send due emails.
 *
 * Concurrency is guarded by the JS-level emailQueueRunning flag in index.ts.
 * This function should not be called concurrently.
 */
export async function processEmailQueue(): Promise<void> {
  const doWork = async () => {
    await autoEnrollNewUsers();
    await processQueueRun();
  };

  // Timeout guard: ensure function returns within 5 minutes
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Email queue timeout after 5 minutes')), QUEUE_TIMEOUT_MS);
  });

  try {
    await Promise.race([doWork(), timeout]);
  } catch (error) {
    logger.error({ error }, 'Email queue error');
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Auto-enroll users who don't have an onboarding sequence enrollment.
 * Uses two batch queries instead of per-user lookups to avoid N+1.
 */
async function autoEnrollNewUsers(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Find the onboarding sequence
  const { data: sequence } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('slug', 'onboarding')
    .eq('is_active', true)
    .single();

  if (!sequence) return;

  // Batch query 1: Get IDs of users already enrolled in this sequence
  const { data: enrolled } = await supabase
    .from('user_email_state')
    .select('user_id')
    .eq('sequence_id', sequence.id);

  const enrolledIds = new Set((enrolled ?? []).map((e) => e.user_id));

  // Batch query 2: Get users with email, ordered by created_at
  const { data: candidates, error } = await supabase
    .from('user_profiles')
    .select('id, email')
    .not('email', 'is', null)
    .order('created_at', { ascending: true })
    .limit(AUTO_ENROLL_LIMIT);

  if (error || !candidates) {
    if (error) logger.error({ error }, 'Failed to query candidate users for auto-enrollment');
    return;
  }

  // Enroll only users not already in the set
  for (const user of candidates) {
    if (!enrolledIds.has(user.id)) {
      await enrollUser(user.id, 'onboarding');
    }
  }
}

/**
 * Process due emails in the queue.
 */
async function processQueueRun(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Find all active, non-completed, non-unsubscribed, non-paused enrollments
  const { data: states, error } = await supabase
    .from('user_email_state')
    .select(`
      id,
      user_id,
      sequence_id,
      current_step,
      enrolled_at,
      send_failures
    `)
    .is('completed_at', null)
    .eq('unsubscribed', false)
    .eq('paused', false);

  if (error || !states) {
    if (error) logger.error({ error }, 'Failed to query email queue');
    return;
  }

  for (const state of states) {
    try {
      await processStateRow(state);
    } catch (error) {
      logger.error(
        { error, userId: state.user_id, stateId: state.id },
        'Failed to process email queue row',
      );

      // Increment send_failures
      const newFailures = (state.send_failures || 0) + 1;
      const updates: Record<string, unknown> = { send_failures: newFailures };
      if (newFailures >= MAX_SEND_FAILURES) {
        updates.paused = true;
        logger.warn({ userId: state.user_id, stateId: state.id }, 'User paused after 3 consecutive send failures');
      }

      await supabase
        .from('user_email_state')
        .update(updates)
        .eq('id', state.id);

      // Continue to next user — do NOT abort the queue
    }
  }
}

interface QueueState {
  id: string;
  user_id: string;
  sequence_id: string;
  current_step: number;
  enrolled_at: string;
  send_failures: number;
}

async function processStateRow(state: QueueState): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const nextStepOrder = state.current_step + 1;

  // Find the next step in this sequence
  const { data: step } = await supabase
    .from('email_sequence_steps')
    .select('id, step_order, delay_hours, template_id')
    .eq('sequence_id', state.sequence_id)
    .eq('step_order', nextStepOrder)
    .single();

  if (!step) {
    // No more steps — mark completed
    await supabase
      .from('user_email_state')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', state.id);
    return;
  }

  // Check if delay has elapsed (absolute from enrollment)
  const enrolledAt = new Date(state.enrolled_at).getTime();
  const dueAt = enrolledAt + step.delay_hours * 60 * 60 * 1000;

  if (Date.now() < dueAt) {
    // Not due yet
    return;
  }

  // Get user email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', state.user_id)
    .single();

  if (!profile?.email) {
    logger.warn({ userId: state.user_id }, 'User has no email — skipping');
    return;
  }

  // Send the email
  await sendStepEmail(state.user_id, profile.email, state.sequence_id, step.template_id, {});

  // Get max step in this sequence to determine if we're done
  const { data: maxStepRow } = await supabase
    .from('email_sequence_steps')
    .select('step_order')
    .eq('sequence_id', state.sequence_id)
    .order('step_order', { ascending: false })
    .limit(1)
    .single();

  const isLastStep = maxStepRow && step.step_order >= maxStepRow.step_order;

  // Update state
  await supabase
    .from('user_email_state')
    .update({
      current_step: step.step_order,
      last_sent_at: new Date().toISOString(),
      send_failures: 0, // Reset on success
      ...(isLastStep ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', state.id);

  logger.info(
    { userId: state.user_id, stepOrder: step.step_order, isLastStep },
    'Email sent for sequence step',
  );
}

/**
 * Unsubscribe a user from a sequence.
 */
export async function unsubscribeUser(userId: string, sequenceId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error, count } = await supabase
    .from('user_email_state')
    .update({ unsubscribed: true }, { count: 'exact' })
    .eq('user_id', userId)
    .eq('sequence_id', sequenceId);

  if (error) {
    logger.error({ error, userId, sequenceId }, 'Failed to unsubscribe user');
    return false;
  }

  if (count === 0) {
    logger.warn({ userId, sequenceId }, 'No enrollment found to unsubscribe');
    return false;
  }

  logger.info({ userId, sequenceId, count }, 'User unsubscribed');
  return true;
}

/**
 * Send a one-off transactional email (e.g., purchase confirmation).
 * Not tied to a sequence — no state tracking.
 */
export async function sendTransactionalEmail(
  userId: string,
  templateSlug: string,
  variables: Record<string, string>,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  // Get user email
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!profile?.email) {
    logger.warn({ userId, templateSlug }, 'Cannot send transactional email — user has no email');
    return;
  }

  // Get template
  const { data: template } = await supabase
    .from('email_templates')
    .select('subject, html_body, text_body')
    .eq('slug', templateSlug)
    .single();

  if (!template) {
    logger.error({ templateSlug }, 'Transactional email template not found');
    return;
  }

  const name = profile.email.split('@')[0];
  const allVars: Record<string, string> = { name, ...variables };

  const subject = renderTextTemplate(template.subject, allVars);
  const html = renderTemplate(template.html_body, allVars);
  const text = renderTextTemplate(template.text_body, allVars);

  await sendEmail(profile.email, subject, html, text);
}
