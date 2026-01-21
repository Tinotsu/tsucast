/**
 * tsucast VPS API Client
 *
 * Handles all communication with the VPS backend API.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Cache check result from the API
 */
export interface CacheResult {
  cached: boolean;
  audioUrl?: string;
  title?: string;
  duration?: number;
}

/**
 * Check if a URL has cached audio available
 *
 * @param urlHash - SHA256 hash of the normalized URL
 * @returns Cache result with audio info if cached
 */
export async function checkCache(urlHash: string): Promise<CacheResult> {
  try {
    const response = await fetch(
      `${API_URL}/api/cache/check?hash=${encodeURIComponent(urlHash)}`
    );

    if (!response.ok) {
      if (__DEV__) {
        console.warn('Cache check failed:', response.status);
      }
      return { cached: false };
    }

    return await response.json();
  } catch (error) {
    if (__DEV__) {
      console.error('Cache check error:', error);
    }
    return { cached: false };
  }
}

/**
 * Get auth token from Supabase (if user is logged in)
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Import dynamically to avoid circular dependencies
    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Report an extraction failure
 *
 * @param url - The URL that failed extraction
 * @param errorType - The error code (e.g., 'PARSE_FAILED')
 * @param errorMessage - Human-readable error message
 * @param notes - Optional additional context from user
 */
export async function reportExtractionFailure(
  url: string,
  errorType: string,
  errorMessage: string,
  notes?: string
): Promise<void> {
  try {
    const token = await getAuthToken();

    await fetch(`${API_URL}/api/report/extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        url,
        errorType,
        errorMessage,
        notes,
      }),
    });
    // Silently succeed or fail - don't throw errors to the UI
  } catch (error) {
    // Silent failure - reporting errors should never frustrate the user
    if (__DEV__) {
      console.warn('Failed to submit report:', error);
    }
  }
}
