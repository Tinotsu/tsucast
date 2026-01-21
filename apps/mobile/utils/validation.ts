/**
 * URL Validation Utilities
 *
 * Validates URLs for the tsucast content ingestion flow.
 */

/**
 * Check if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if URL points to a PDF file
 */
export function isPdfUrl(text: string): boolean {
  if (!isValidUrl(text)) {
    return false;
  }

  try {
    const url = new URL(text.trim());
    return url.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return false;
  }
}

/**
 * Get the content type based on URL extension
 * Used to show appropriate UI indicators (e.g., PDF badge)
 */
export function getUrlType(url: string): 'html' | 'pdf' {
  return isPdfUrl(url) ? 'pdf' : 'html';
}

/**
 * Get user-friendly error message for invalid URLs
 */
export function getUrlValidationError(text: string): string | null {
  if (!text || !text.trim()) {
    return null; // Empty input is not an error, just incomplete
  }

  const trimmed = text.trim();

  // Check if it looks like a URL attempt
  if (trimmed.includes(' ')) {
    return 'URLs cannot contain spaces';
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Please enter an HTTP or HTTPS URL';
    }

    return null; // Valid URL
  } catch {
    // Not a valid URL format
    if (trimmed.includes('.') && !trimmed.includes('://')) {
      return 'URL must start with http:// or https://';
    }

    return 'Please enter a valid URL';
  }
}

/**
 * Supported content types for extraction
 */
export const SUPPORTED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'application/pdf',
] as const;

/**
 * Common domains that work well with tsucast
 */
export const KNOWN_SUPPORTED_DOMAINS = [
  'medium.com',
  'substack.com',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'bbc.com',
  'cnn.com',
  'reuters.com',
  'techcrunch.com',
  'wired.com',
  'arstechnica.com',
  'theverge.com',
  'engadget.com',
  'mashable.com',
  'huffpost.com',
  'forbes.com',
  'businessinsider.com',
  'bloomberg.com',
  'wsj.com',
  'economist.com',
  'newyorker.com',
  'theatlantic.com',
  'vox.com',
  'axios.com',
  'politico.com',
] as const;
