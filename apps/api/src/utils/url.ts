/**
 * URL Utilities
 *
 * Shared URL processing functions.
 */

import { createHash } from 'crypto';

/**
 * Normalize URL for caching
 * - Lowercase hostname
 * - Remove www prefix
 * - Remove trailing slashes (except root)
 * - Remove common tracking params
 * - Remove fragment
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());

    // Lowercase hostname and remove www
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Remove trailing slash (except root)
    if (parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    // Remove common tracking params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref',
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Remove fragment
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Generate SHA256 hash for URL + voice combination
 */
export function hashUrlWithVoice(url: string, voiceId: string): string {
  return createHash('sha256').update(`${url}:${voiceId}`).digest('hex');
}
