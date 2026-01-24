/**
 * User Account Integration Tests
 *
 * Tests for user endpoints:
 * - GET /api/user/limit (rate limit status)
 * - GET /api/user/subscription (subscription details)
 * - GET /api/user/profile (user profile)
 * - DELETE /api/user/account (account deletion - Apple requirement)
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

const mockUserId = 'user-to-delete-123';

// Create mock Supabase responses
const mockFrom = vi.fn();
const mockGetUser = vi.fn();
const mockAuthAdmin = {
  deleteUser: vi.fn(),
};
const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
    admin: mockAuthAdmin,
  },
};

vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
  isSupabaseConfigured: vi.fn(() => true),
}));

// Mock RevenueCat service
const mockDeleteSubscriber = vi.fn().mockResolvedValue(true);
vi.mock('../../src/services/revenuecat.js', () => ({
  getSubscriptionDetails: vi.fn().mockResolvedValue(null),
  isRevenueCatConfigured: vi.fn().mockReturnValue(false),
  deleteSubscriber: mockDeleteSubscriber,
}));

describe('User Account API Endpoints', () => {
  let app: Hono;
  let userRoutes: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth to return valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    userRoutes = (await import('../../src/routes/user.js')).default;
    app = new Hono();
    app.route('/api/user', userRoutes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/user/limit', () => {
    it('should return rate limit status for free user', async () => {
      // Use a future reset time to prevent auto-reset during test
      const futureResetAt = new Date();
      futureResetAt.setUTCDate(futureResetAt.getUTCDate() + 1);
      futureResetAt.setUTCHours(0, 0, 0, 0);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_tier: 'free',
                daily_generations: 2,
                daily_generations_reset_at: futureResetAt.toISOString(),
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      const res = await app.request('/api/user/limit', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tier).toBe('free');
      expect(body.used).toBe(2);
      expect(body.limit).toBe(3); // FREE_TIER_LIMIT
      expect(body.remaining).toBe(1);
    });

    it('should return unlimited for pro user', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                subscription_tier: 'pro',
                daily_generations: 0,
                daily_generations_reset_at: null,
              },
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/user/limit', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tier).toBe('pro');
      expect(body.limit).toBeNull();
      expect(body.remaining).toBeNull();
    });
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockUserId,
                email: 'test@example.com',
                subscription_tier: 'free',
                created_at: '2026-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const res = await app.request('/api/user/profile', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.profile.id).toBe(mockUserId);
      expect(body.profile.email).toBe('test@example.com');
    });

    it('should return 500 on database error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const res = await app.request('/api/user/profile', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/user/account (Apple Requirement)', () => {
    it('should delete user account and all associated data', async () => {
      // Setup: User has playlists with items, library items, and profile

      // Mock getting user's playlists
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'playlist-1' }, { id: 'playlist-2' }],
            error: null,
          }),
        }),
      });

      // Mock deleting playlist items
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock deleting playlists
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock deleting library items
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock deleting user profile
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock auth.admin.deleteUser
      mockAuthAdmin.deleteUser.mockResolvedValue({ error: null });

      const res = await app.request('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      // Verify auth user was deleted
      expect(mockAuthAdmin.deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    it('should delete account even when user has no playlists', async () => {
      // Mock getting user's playlists - empty
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Mock deleting playlists (should still be called)
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock deleting library items
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock deleting user profile
      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockAuthAdmin.deleteUser.mockResolvedValue({ error: null });

      const res = await app.request('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
    });

    it('should return 500 if auth user deletion fails', async () => {
      // Mock all the data deletions succeeding
      mockFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockFrom.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // But auth deletion fails
      mockAuthAdmin.deleteUser.mockResolvedValue({
        error: { message: 'Failed to delete auth user' },
      });

      const res = await app.request('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe('DELETION_FAILED');
    });

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const res = await app.request('/api/user/account', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('Account Deletion - Data Integrity', () => {
    it('should delete data in correct order respecting foreign keys', async () => {
      const deletionOrder: string[] = [];

      // Track what gets deleted in what order
      mockFrom.mockImplementation((table: string) => {
        if (table === 'playlists') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'playlist-1' }],
                error: null,
              }),
            }),
            delete: vi.fn().mockImplementation(() => {
              deletionOrder.push('playlists');
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }

        if (table === 'playlist_items') {
          return {
            delete: vi.fn().mockImplementation(() => {
              deletionOrder.push('playlist_items');
              return {
                in: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }

        if (table === 'user_library') {
          return {
            delete: vi.fn().mockImplementation(() => {
              deletionOrder.push('user_library');
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }

        if (table === 'user_profiles') {
          return {
            delete: vi.fn().mockImplementation(() => {
              deletionOrder.push('user_profiles');
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          };
        }

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      mockAuthAdmin.deleteUser.mockResolvedValue({ error: null });

      await app.request('/api/user/account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      // Verify deletion order: playlist_items -> playlists -> user_library -> user_profiles
      expect(deletionOrder).toEqual([
        'playlist_items',
        'playlists',
        'user_library',
        'user_profiles',
      ]);
    });
  });
});

describe('RevenueCat Cleanup on Account Deletion', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth to return valid user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });

  it('should call deleteSubscriber when deleting account', async () => {
    // Setup minimal mocks for successful deletion
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockAuthAdmin.deleteUser.mockResolvedValue({ error: null });

    const userRoutes = (await import('../../src/routes/user.js')).default;
    const app = new Hono();
    app.route('/api/user', userRoutes);

    await app.request('/api/user/account', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer valid-token' },
    });

    // Verify RevenueCat subscriber was deleted
    expect(mockDeleteSubscriber).toHaveBeenCalledWith(mockUserId);
  });
});
