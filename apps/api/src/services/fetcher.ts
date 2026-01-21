/**
 * URL Fetcher Service
 *
 * Fetches HTML and PDF content from URLs with timeout, retry logic,
 * and paywall detection.
 */

import { logger } from '../lib/logger.js';
import { ErrorCodes, LIMITS } from '../utils/errors.js';

const USER_AGENT = 'Mozilla/5.0 (compatible; tsucast/1.0; +https://tsucast.app)';

/**
 * Common paywall indicators in HTML content
 */
const PAYWALL_INDICATORS = [
  'paywall',
  'subscribe to read',
  'subscribe to continue',
  'premium content',
  'members only',
  'subscription required',
  'sign in to read',
  'login to read',
  'register to read',
];

/**
 * Check if HTML content appears to be behind a paywall
 */
function detectPaywall(html: string): boolean {
  const lowerHtml = html.toLowerCase();

  // Short content with login/subscribe prompts is likely paywalled
  if (html.length < 3000) {
    for (const indicator of PAYWALL_INDICATORS) {
      if (lowerHtml.includes(indicator)) {
        return true;
      }
    }
  }

  // Check for common paywall meta tags
  if (
    lowerHtml.includes('meta name="paywall"') ||
    lowerHtml.includes('isAccessibleForFree": false') ||
    lowerHtml.includes('isPaidContent": true')
  ) {
    return true;
  }

  return false;
}

/**
 * Fetch HTML content from a URL
 */
export async function fetchUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    LIMITS.FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        logger.warn({ url, status: response.status }, 'Paywall detected (HTTP status)');
        throw new Error(ErrorCodes.PAYWALL_DETECTED);
      }

      if (response.status === 404) {
        throw new Error(ErrorCodes.FETCH_FAILED);
      }

      logger.error({ url, status: response.status }, 'Fetch failed');
      throw new Error(ErrorCodes.FETCH_FAILED);
    }

    const html = await response.text();

    // Detect paywall from content
    if (detectPaywall(html)) {
      logger.warn({ url }, 'Paywall detected (content analysis)');
      throw new Error(ErrorCodes.PAYWALL_DETECTED);
    }

    return html;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      // Re-throw known error codes
      if (
        error.message === ErrorCodes.PAYWALL_DETECTED ||
        error.message === ErrorCodes.FETCH_FAILED
      ) {
        throw error;
      }

      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        logger.error({ url }, 'Fetch timeout');
        throw new Error(ErrorCodes.TIMEOUT);
      }
    }

    logger.error({ url, error }, 'Fetch error');
    throw new Error(ErrorCodes.FETCH_FAILED);
  }
}

/**
 * Check if a URL points to a PDF file
 */
export function isPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

/**
 * Extract filename from URL or Content-Disposition header
 */
export function extractFilename(url: string, contentDisposition?: string): string {
  // Try Content-Disposition header first
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      return match[1].replace(/['"]/g, '');
    }
  }

  // Fall back to URL path
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart) {
      return decodeURIComponent(lastPart);
    }
  } catch {
    // Ignore URL parsing errors
  }

  return 'document.pdf';
}

/**
 * Fetch PDF content from a URL
 */
export async function fetchPdf(url: string): Promise<{ buffer: Buffer; filename: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    LIMITS.PDF_FETCH_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error({ url, status: response.status }, 'PDF fetch failed');
      throw new Error(ErrorCodes.FETCH_FAILED);
    }

    // Check Content-Length header if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > LIMITS.MAX_PDF_SIZE_BYTES) {
      logger.warn({ url, contentLength }, 'PDF too large');
      throw new Error(ErrorCodes.PDF_TOO_LARGE);
    }

    // Stream the response and check size while downloading
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    if (!response.body) {
      throw new Error(ErrorCodes.FETCH_FAILED);
    }

    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalSize += value.length;

      if (totalSize > LIMITS.MAX_PDF_SIZE_BYTES) {
        reader.cancel();
        logger.warn({ url, totalSize }, 'PDF too large (during download)');
        throw new Error(ErrorCodes.PDF_TOO_LARGE);
      }

      chunks.push(value);
    }

    const filename = extractFilename(
      url,
      response.headers.get('content-disposition') || undefined
    );

    return {
      buffer: Buffer.concat(chunks),
      filename,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      // Re-throw known error codes
      if (
        error.message === ErrorCodes.FETCH_FAILED ||
        error.message === ErrorCodes.PDF_TOO_LARGE
      ) {
        throw error;
      }

      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        logger.error({ url }, 'PDF fetch timeout');
        throw new Error(ErrorCodes.TIMEOUT);
      }
    }

    logger.error({ url, error }, 'PDF fetch error');
    throw new Error(ErrorCodes.FETCH_FAILED);
  }
}
