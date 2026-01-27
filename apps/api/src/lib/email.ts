/**
 * Resend Email Client
 *
 * Follows lib/sentry.ts singleton pattern.
 * No-op when RESEND_API_KEY is not set (local dev).
 */

import { Resend } from 'resend';
import { logger } from './logger.js';

let client: Resend | null = null;

const fromAddress = process.env.EMAIL_FROM || 'noreply@tsucast.com';

export function initEmail(): void {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return;
  }
  client = new Resend(apiKey);
}

export function getEmailClient(): Resend | null {
  return client;
}

/**
 * Send an email via Resend. No-op if RESEND_API_KEY is not set.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (!client) {
    logger.info({ to, subject }, 'Email skipped (Resend not configured)');
    return;
  }

  logger.info({ to, subject }, 'Sending email');

  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    logger.error({ error, to, subject }, 'Resend send failed');
    throw new Error(`Email send failed: ${error.message}`);
  }

  logger.info({ to, subject }, 'Email sent successfully');
}

/**
 * Escape HTML entities in a string to prevent XSS in email templates.
 * Used on all template variable values before insertion into HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
