/**
 * Library CRUD Integration Tests
 *
 * Tests for library endpoints:
 * - GET /api/library (list items)
 * - POST /api/library (add item)
 * - PATCH /api/library/:id/position (update playback position)
 * - DELETE /api/library/:id (remove item)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

// Suppress logger output
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockUserId = 'test-user-123';

// Create mock Supabase responses
const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
  isSupabaseConfigured: vi.fn(() => true),
}));

describe('Library API Endpoints', () => {
  let app: Hono;
  let libraryRoutes: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth to return valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    libraryRoutes = (await import('../../src/routes/library.js')).default;
    app = new Hono();
    app.route('/api/library', libraryRoutes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/library', () => {
    it('should return empty array when library is empty', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/library', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it('should return library items with flattened audio data', async () => {
      const mockLibraryData = [
        {
          id: 'lib-1',
          playback_position: 120,
          is_played: false,
          added_at: '2026-01-23T10:00:00Z',
          audio: {
            id: 'audio-1',
            title: 'Test Article',
            audio_url: 'https://r2.example.com/audio.mp3',
            duration_seconds: 300,
            word_count: 1500,
            original_url: 'https://example.com/article',
          },
        },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLibraryData,
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/library', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();

      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toEqual({
        id: 'lib-1',
        audio_id: 'audio-1',
        title: 'Test Article',
        url: 'https://example.com/article',
        audio_url: 'https://r2.example.com/audio.mp3',
        duration: 300,
        playback_position: 120,
        is_played: false,
        created_at: '2026-01-23T10:00:00Z',
      });
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const res = await app.request('/api/library', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe('FETCH_FAILED');
    });
  });

  describe('POST /api/library', () => {
    it('should add item to library successfully', async () => {
      const validAudioId = '550e8400-e29b-41d4-a716-446655440000';
      const newItem = {
        id: 'lib-new',
        user_id: mockUserId,
        audio_id: validAudioId,
      };

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: newItem,
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/library', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioId: validAudioId }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.item).toEqual(newItem);
    });

    it('should return 400 for missing audioId', async () => {
      const res = await app.request('/api/library', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 400 for invalid UUID audioId', async () => {
      const res = await app.request('/api/library', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioId: 'not-a-uuid' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/library/:id/position', () => {
    it('should update playback position successfully', async () => {
      // Mock the verification query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'lib-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock the update query
      mockFrom.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/library/lib-1/position', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: 180 }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('should update isPlayed flag when provided', async () => {
      // Mock the verification query
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'lib-1' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock the update query
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValueOnce({ update: mockUpdate });

      const res = await app.request('/api/library/lib-1/position', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: 300, isPlayed: true }),
      });

      expect(res.status).toBe(200);
    });

    it('should return 400 for negative position', async () => {
      const res = await app.request('/api/library/lib-1/position', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: -10 }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_REQUEST');
    });

    it('should return 404 when item not found or unauthorized', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const res = await app.request('/api/library/nonexistent/position', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position: 100 }),
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/library/:id', () => {
    it('should delete item from library successfully', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/library/lib-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('should return 500 on delete error', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Foreign key violation' },
            }),
          }),
        }),
      });

      const res = await app.request('/api/library/lib-1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe('DELETE_FAILED');
    });
  });

  describe('Authorization checks', () => {
    it('should only return items belonging to authenticated user', async () => {
      // This verifies that the eq('user_id', userId) filter is applied
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn((field: string, value: string) => {
          expect(field).toBe('user_id');
          expect(value).toBe(mockUserId);
          return {
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }),
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      await app.request('/api/library', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const res = await app.request('/api/library');

      expect(res.status).toBe(401);
    });
  });
});
