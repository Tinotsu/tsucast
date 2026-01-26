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

/**
 * Library item from the API
 */
export interface LibraryItem {
  id: string;
  playback_position: number;
  is_played: boolean;
  added_at: string;
  audio: {
    id: string;
    title: string | null;
    audio_url: string | null;
    duration_seconds: number | null;
    word_count: number | null;
    original_url: string;
  };
}

/**
 * Get user's library
 */
export async function getLibrary(): Promise<{ items: LibraryItem[] }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/library`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to load library');
  }

  return response.json();
}

/**
 * Add item to library
 */
export async function addToLibrary(audioId: string): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/library`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ audioId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to add to library');
  }
}

/**
 * Delete item from library
 */
export async function deleteFromLibrary(id: string): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/library/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to delete');
  }
}

/**
 * Update playback position
 */
export async function updatePlaybackPosition(
  id: string,
  position: number,
  isPlayed?: boolean
): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/library/${id}/position`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ position, ...(isPlayed !== undefined && { isPlayed }) }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to update position');
  }
}

/**
 * Subscription/limit status from the API
 */
export interface LimitStatus {
  tier: 'free' | 'pro';
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

/**
 * Get user's subscription and limit status
 */
export async function getLimitStatus(): Promise<LimitStatus> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/user/limit`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to get limit status');
  }

  return response.json();
}

// ============================================================
// Playlist API Functions
// Story: 4-3 Playlist Management
// ============================================================

/**
 * Get all playlists for the authenticated user
 */
export async function getPlaylists(): Promise<{ playlists: Array<{
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  itemCount: number;
}> }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to fetch playlists');
  }

  return response.json();
}

/**
 * Get a single playlist with its items
 */
export async function getPlaylist(playlistId: string): Promise<{ playlist: {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    position: number;
    added_at: string;
    audio: {
      id: string;
      title: string;
      audio_url: string;
      duration_seconds: number;
      original_url: string;
    };
  }>;
} }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to fetch playlist');
  }

  return response.json();
}

/**
 * Create a new playlist
 */
export async function createPlaylist(name: string): Promise<{ playlist: {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
} }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to create playlist');
  }

  return response.json();
}

/**
 * Rename a playlist
 */
export async function renamePlaylist(playlistId: string, name: string): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to rename playlist');
  }

  return response.json();
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(playlistId: string): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to delete playlist');
  }

  return response.json();
}

/**
 * Add an audio item to a playlist
 */
export async function addToPlaylist(playlistId: string, audioId: string): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ audioId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to add to playlist');
  }

  return response.json();
}

/**
 * Remove an item from a playlist
 */
export async function removeFromPlaylist(playlistId: string, itemId: string): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to remove from playlist');
  }

  return response.json();
}

/**
 * Reorder items in a playlist
 */
export async function reorderPlaylistItems(playlistId: string, itemIds: string[]): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/playlists/${playlistId}/reorder`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemIds }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to reorder playlist');
  }

  return response.json();
}

// ============================================================
// Credit System API Functions
// Story: 10-2 Mobile Article Credit Pricing
// ============================================================

/**
 * Credit balance from the API
 */
export interface CreditBalance {
  credits: number;
  timeBank: number;
  totalPurchased: number;
  totalUsed: number;
}

/**
 * Get user's credit balance
 */
export async function getCredits(): Promise<CreditBalance> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/user/credits`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to get credit balance');
  }

  return response.json();
}

/**
 * Generation preview result
 */
export interface GenerationPreview {
  isCached: boolean;
  estimatedMinutes: number;
  creditsNeeded: number;
  currentCredits: number;
  currentTimeBank: number;
  hasSufficientCredits: boolean;
}

/**
 * Preview credit cost before generation
 * Returns estimated duration, credits needed, and whether it's cached
 */
export async function previewGeneration(
  url: string,
  voiceId?: string
): Promise<GenerationPreview> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/generate/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, voiceId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to preview generation');
  }

  return response.json();
}

// ============================================================
// User Account API Functions
// Story: 8-1 MVP Launch Blockers
// ============================================================

/**
 * Delete user account and all associated data
 * Required by App Store guidelines (Apple policy since June 2022)
 */
export async function deleteAccount(): Promise<{ success: boolean }> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/user/account`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Failed to delete account');
  }

  return response.json();
}
