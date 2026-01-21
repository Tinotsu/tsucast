import * as Crypto from 'expo-crypto';

/**
 * URL Normalization Utilities
 *
 * Normalizes URLs for consistent caching and deduplication.
 */

/**
 * Tracking parameters to remove from URLs
 */
const TRACKING_PARAMS = [
  // Google Analytics / Marketing
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  // Facebook
  'fbclid',
  'fb_action_ids',
  'fb_action_types',
  'fb_source',
  // Google Click ID
  'gclid',
  'gclsrc',
  // Microsoft/Bing
  'msclkid',
  // Mailchimp
  'mc_cid',
  'mc_eid',
  // Twitter
  'twclid',
  // Other common trackers
  'ref',
  'ref_src',
  'ref_url',
  'source',
  'campaign',
  '_ga',
  '_gl',
  'oly_anon_id',
  'oly_enc_id',
  'vero_id',
  '__s',
  'wickedid',
  'igshid',
];

/**
 * Normalize a URL for consistent caching
 *
 * Steps:
 * 1. Lowercase hostname
 * 2. Remove www prefix
 * 3. Remove trailing slash (except root)
 * 4. Remove tracking parameters
 * 5. Sort remaining query params
 * 6. Remove fragment/hash
 */
export function normalizeUrl(urlString: string): string {
  const trimmed = urlString.trim();

  try {
    const url = new URL(trimmed);

    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();

    // Remove www prefix
    url.hostname = url.hostname.replace(/^www\./, '');

    // Remove trailing slash (but keep root path as /)
    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }

    // Ensure at least root path
    if (!url.pathname) {
      url.pathname = '/';
    }

    // Remove tracking params
    TRACKING_PARAMS.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Sort remaining query params for consistency
    url.searchParams.sort();

    // Remove fragment/hash
    url.hash = '';

    return url.toString();
  } catch {
    // If URL parsing fails, return original trimmed string
    return trimmed;
  }
}

/**
 * Generate a SHA256 hash of a normalized URL for cache lookup
 */
export async function hashUrl(normalizedUrl: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizedUrl
  );
}

/**
 * Normalize and hash a URL in one step
 */
export async function normalizeAndHashUrl(
  urlString: string
): Promise<{ normalized: string; hash: string }> {
  const normalized = normalizeUrl(urlString);
  const hash = await hashUrl(normalized);
  return { normalized, hash };
}

/**
 * Extract the domain from a URL
 */
export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString.trim());
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Extract the path from a URL (for display purposes)
 */
export function extractPath(urlString: string): string | null {
  try {
    const url = new URL(urlString.trim());
    const path = url.pathname;
    // Return a shortened path for display
    if (path.length > 50) {
      return path.substring(0, 47) + '...';
    }
    return path;
  } catch {
    return null;
  }
}
