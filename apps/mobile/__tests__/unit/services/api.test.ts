/**
 * API Service Logic Tests
 *
 * Tests for API client logic - request/response handling patterns
 * Priority: P0 (Critical - core API functionality)
 *
 * Note: These tests validate the API request/response patterns
 * without importing the actual api.ts module (which has Expo dependencies).
 * Integration tests with the real API are done via E2E tests.
 */

// Test configuration
const API_URL = 'http://localhost:3000';

// Recreate core API logic for testing (matching services/api.ts)
interface CacheResult {
  cached: boolean;
  audioUrl?: string;
  title?: string;
  duration?: number;
}

interface LibraryItem {
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

interface LimitStatus {
  tier: 'free' | 'pro';
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Ensure __DEV__ is defined
(global as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

// Recreate API functions for testing (same logic as services/api.ts)
async function checkCache(urlHash: string): Promise<CacheResult> {
  try {
    const response = await fetch(
      `${API_URL}/api/cache/check?hash=${encodeURIComponent(urlHash)}`
    );

    if (!response.ok) {
      return { cached: false };
    }

    return await response.json();
  } catch {
    return { cached: false };
  }
}

async function getLibrary(token: string): Promise<{ items: LibraryItem[] }> {
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

async function addToLibrary(token: string, audioId: string): Promise<void> {
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

async function deleteFromLibrary(token: string, id: string): Promise<void> {
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

async function updatePlaybackPosition(
  token: string,
  id: string,
  position: number,
  isPlayed?: boolean
): Promise<void> {
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

async function getLimitStatus(token: string): Promise<LimitStatus> {
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

async function createPlaylist(token: string, name: string): Promise<{ playlist: { id: string; name: string } }> {
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

async function deletePlaylist(token: string, playlistId: string): Promise<void> {
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
}

async function addToPlaylist(token: string, playlistId: string, audioId: string): Promise<void> {
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
}

async function removeFromPlaylist(token: string, playlistId: string, itemId: string): Promise<void> {
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
}

async function reorderPlaylistItems(token: string, playlistId: string, itemIds: string[]): Promise<void> {
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
}

async function reportExtractionFailure(
  token: string | null,
  url: string,
  errorType: string,
  errorMessage: string,
  notes?: string
): Promise<void> {
  try {
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
  } catch {
    // Silent failure
  }
}

async function deleteAccount(token: string): Promise<{ success: boolean }> {
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

// Mock token for authenticated requests
const MOCK_TOKEN = 'mock-auth-token';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('[P0] checkCache', () => {
    it('should return cached result when cache hit', async () => {
      // GIVEN: Cache API returns a hit
      const cacheResult = {
        cached: true,
        audioUrl: 'https://example.com/audio.mp3',
        title: 'Test Article',
        duration: 120,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(cacheResult),
      });

      // WHEN: Checking cache
      const result = await checkCache('abc123hash');

      // THEN: Returns cached data
      expect(result).toEqual(cacheResult);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cache/check?hash=abc123hash')
      );
    });

    it('should return cached: false when cache miss', async () => {
      // GIVEN: Cache API returns miss
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ cached: false }),
      });

      // WHEN: Checking cache
      const result = await checkCache('notfoundhash');

      // THEN: Returns not cached
      expect(result.cached).toBe(false);
    });

    it('should return cached: false on non-OK response', async () => {
      // GIVEN: API returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // WHEN: Checking cache
      const result = await checkCache('somehash');

      // THEN: Gracefully returns not cached
      expect(result).toEqual({ cached: false });
    });

    it('should return cached: false on network error', async () => {
      // GIVEN: Network error occurs
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // WHEN: Checking cache
      const result = await checkCache('somehash');

      // THEN: Gracefully returns not cached
      expect(result).toEqual({ cached: false });
    });
  });

  describe('[P0] getLibrary', () => {
    it('should return library items when authenticated', async () => {
      // GIVEN: User is authenticated and API returns library
      const libraryData = {
        items: [
          {
            id: 'lib-1',
            playback_position: 30,
            is_played: false,
            added_at: '2024-01-01T00:00:00Z',
            audio: {
              id: 'audio-1',
              title: 'Test Article',
              audio_url: 'https://example.com/audio.mp3',
              duration_seconds: 120,
              word_count: 500,
              original_url: 'https://example.com/article',
            },
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(libraryData),
      });

      // WHEN: Fetching library
      const result = await getLibrary(MOCK_TOKEN);

      // THEN: Returns library items with auth header
      expect(result).toEqual(libraryData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/library'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
          }),
        })
      );
    });

    it('should throw error on API failure', async () => {
      // GIVEN: API returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: { message: 'Server error' } }),
      });

      // WHEN/THEN: Should throw error
      await expect(getLibrary(MOCK_TOKEN)).rejects.toThrow('Server error');
    });

    it('should throw error when no token provided', async () => {
      // GIVEN: No auth token
      // WHEN/THEN: Should throw auth error
      await expect(getLibrary('')).rejects.toThrow('Authentication required');
    });
  });

  describe('[P0] addToLibrary', () => {
    it('should add audio to library', async () => {
      // GIVEN: API accepts add request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Adding to library
      await addToLibrary(MOCK_TOKEN, 'audio-123');

      // THEN: Sends POST with correct body
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/library'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${MOCK_TOKEN}`,
          }),
          body: JSON.stringify({ audioId: 'audio-123' }),
        })
      );
    });

    it('should throw error when add fails', async () => {
      // GIVEN: API returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: { message: 'Item already exists' } }),
      });

      // WHEN/THEN: Should throw error
      await expect(addToLibrary(MOCK_TOKEN, 'audio-123')).rejects.toThrow(
        'Item already exists'
      );
    });
  });

  describe('[P0] deleteFromLibrary', () => {
    it('should delete item from library', async () => {
      // GIVEN: API accepts delete request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Deleting from library
      await deleteFromLibrary(MOCK_TOKEN, 'lib-item-123');

      // THEN: Sends DELETE to correct endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/library/lib-item-123'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
          }),
        })
      );
    });
  });

  describe('[P1] updatePlaybackPosition', () => {
    it('should update position only', async () => {
      // GIVEN: API accepts position update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Updating position
      await updatePlaybackPosition(MOCK_TOKEN, 'lib-123', 60);

      // THEN: Sends PATCH with position
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/library/lib-123/position'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ position: 60 }),
        })
      );
    });

    it('should update position and played status', async () => {
      // GIVEN: API accepts update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Updating position and marking as played
      await updatePlaybackPosition(MOCK_TOKEN, 'lib-123', 120, true);

      // THEN: Sends both fields
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/library/lib-123/position'),
        expect.objectContaining({
          body: JSON.stringify({ position: 120, isPlayed: true }),
        })
      );
    });
  });

  describe('[P1] getLimitStatus', () => {
    it('should return subscription and limit status', async () => {
      // GIVEN: API returns limit status
      const limitData = {
        tier: 'free' as const,
        used: 2,
        limit: 3,
        remaining: 1,
        resetAt: '2024-01-02T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(limitData),
      });

      // WHEN: Getting limit status
      const result = await getLimitStatus(MOCK_TOKEN);

      // THEN: Returns limit data
      expect(result).toEqual(limitData);
    });

    it('should return pro tier status', async () => {
      // GIVEN: Pro user
      const limitData = {
        tier: 'pro' as const,
        used: 50,
        limit: null,
        remaining: null,
        resetAt: null,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(limitData),
      });

      // WHEN: Getting limit status
      const result = await getLimitStatus(MOCK_TOKEN);

      // THEN: Returns pro status
      expect(result.tier).toBe('pro');
      expect(result.limit).toBeNull();
    });
  });

  describe('[P1] Playlist API', () => {
    it('should create playlist', async () => {
      // GIVEN: API accepts create
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            playlist: { id: 'new-pl', name: 'New Playlist' },
          }),
      });

      // WHEN: Creating playlist
      const result = await createPlaylist(MOCK_TOKEN, 'New Playlist');

      // THEN: Returns created playlist
      expect(result.playlist.name).toBe('New Playlist');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/playlists'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Playlist' }),
        })
      );
    });

    it('should delete playlist', async () => {
      // GIVEN: API accepts delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Deleting playlist
      await deletePlaylist(MOCK_TOKEN, 'pl-123');

      // THEN: Sends DELETE
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/playlists/pl-123'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should add item to playlist', async () => {
      // GIVEN: API accepts add
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Adding to playlist
      await addToPlaylist(MOCK_TOKEN, 'pl-123', 'audio-456');

      // THEN: Sends POST to items endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/playlists/pl-123/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ audioId: 'audio-456' }),
        })
      );
    });

    it('should remove item from playlist', async () => {
      // GIVEN: API accepts remove
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Removing from playlist
      await removeFromPlaylist(MOCK_TOKEN, 'pl-123', 'item-789');

      // THEN: Sends DELETE to item endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/playlists/pl-123/items/item-789'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should reorder playlist items', async () => {
      // GIVEN: API accepts reorder
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Reordering items
      const newOrder = ['item-3', 'item-1', 'item-2'];
      await reorderPlaylistItems(MOCK_TOKEN, 'pl-123', newOrder);

      // THEN: Sends PUT to reorder endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/playlists/pl-123/reorder'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ itemIds: newOrder }),
        })
      );
    });
  });

  describe('[P1] reportExtractionFailure', () => {
    it('should report extraction failure silently', async () => {
      // GIVEN: API accepts report
      mockFetch.mockResolvedValueOnce({ ok: true });

      // WHEN: Reporting failure
      await reportExtractionFailure(
        MOCK_TOKEN,
        'https://example.com/article',
        'PARSE_FAILED',
        'Could not extract content',
        'User provided notes'
      );

      // THEN: Sends POST with report data
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/report/extraction'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('PARSE_FAILED'),
        })
      );
    });

    it('should not throw on failure (silent fail)', async () => {
      // GIVEN: API fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // WHEN: Reporting failure
      // THEN: Should not throw
      await expect(
        reportExtractionFailure(null, 'https://example.com', 'ERROR', 'Message')
      ).resolves.not.toThrow();
    });
  });

  describe('[P0] deleteAccount', () => {
    it('should delete user account', async () => {
      // GIVEN: API accepts delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // WHEN: Deleting account
      const result = await deleteAccount(MOCK_TOKEN);

      // THEN: Sends DELETE to account endpoint
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/account'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
          }),
        })
      );
    });

    it('should throw error when delete fails', async () => {
      // GIVEN: API returns error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: { message: 'Deletion failed' } }),
      });

      // WHEN/THEN: Should throw error
      await expect(deleteAccount(MOCK_TOKEN)).rejects.toThrow('Deletion failed');
    });
  });
});

describe('API Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('[P0] Authentication required endpoints', () => {
    it('should include auth header when token provided', async () => {
      // GIVEN: User has token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      // WHEN: Calling authenticated endpoint
      await getLibrary(MOCK_TOKEN);

      // THEN: Auth header is included
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKEN}`,
          }),
        })
      );
    });

    it('should reject calls without token', async () => {
      // GIVEN: No token
      // WHEN/THEN: Should throw auth required error
      await expect(getLibrary('')).rejects.toThrow('Authentication required');
      await expect(addToLibrary('', 'audio-1')).rejects.toThrow('Authentication required');
      await expect(deleteFromLibrary('', 'lib-1')).rejects.toThrow('Authentication required');
      await expect(getLimitStatus('')).rejects.toThrow('Authentication required');
    });
  });
});
