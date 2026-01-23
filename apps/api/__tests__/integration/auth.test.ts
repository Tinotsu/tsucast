/**
 * Authentication Integration Tests
 *
 * Tests that auth middleware correctly validates tokens and rejects invalid requests.
 * These tests verify the actual auth flow, not mocked responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { getUserFromToken, requireAuth, optionalAuth } from '../../src/middleware/auth.js';

// Create a more realistic Supabase mock that we can control per-test
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
};

// Mock the supabase module
vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
  isSupabaseConfigured: vi.fn(() => true),
}));

// Suppress logger output
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserFromToken', () => {
    it('should return null when no Authorization header provided', async () => {
      const result = await getUserFromToken(undefined);
      expect(result).toBeNull();
    });

    it('should return null when Authorization header does not start with Bearer', async () => {
      const result = await getUserFromToken('Basic abc123');
      expect(result).toBeNull();
    });

    it('should return null for empty Bearer token', async () => {
      const result = await getUserFromToken('Bearer ');
      expect(result).toBeNull();
    });

    it('should return user ID for valid token', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const result = await getUserFromToken('Bearer valid-jwt-token');
      expect(result).toBe('user-123');
      expect(mockGetUser).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should return null when Supabase returns error', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const result = await getUserFromToken('Bearer invalid-token');
      expect(result).toBeNull();
    });

    it('should return null when Supabase returns no user', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await getUserFromToken('Bearer expired-token');
      expect(result).toBeNull();
    });

    it('should handle Supabase throwing an exception', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Network error'));

      const result = await getUserFromToken('Bearer some-token');
      expect(result).toBeNull();
    });
  });

  describe('requireAuth middleware', () => {
    it('should return 401 when not authenticated', async () => {
      const app = new Hono();
      app.use('/protected', requireAuth);
      app.get('/protected', (c) => c.json({ message: 'secret' }));

      const res = await app.request('/protected');
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should allow access with valid token', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
        error: null,
      });

      const app = new Hono();
      app.use('/protected', requireAuth);
      app.get('/protected', (c) => {
        const userId = c.get('userId');
        return c.json({ message: 'secret', userId });
      });

      const res = await app.request('/protected', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.userId).toBe('user-456');
    });

    it('should return 401 with invalid token', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      const app = new Hono();
      app.use('/protected', requireAuth);
      app.get('/protected', (c) => c.json({ message: 'secret' }));

      const res = await app.request('/protected', {
        headers: { Authorization: 'Bearer bad-token' },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('optionalAuth middleware', () => {
    it('should continue without user when not authenticated', async () => {
      const app = new Hono();
      app.use('/public', optionalAuth);
      app.get('/public', (c) => {
        const userId = c.get('userId');
        return c.json({ userId: userId || 'anonymous' });
      });

      const res = await app.request('/public');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.userId).toBe('anonymous');
    });

    it('should set user when authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-789' } },
        error: null,
      });

      const app = new Hono();
      app.use('/public', optionalAuth);
      app.get('/public', (c) => {
        const userId = c.get('userId');
        return c.json({ userId: userId || 'anonymous' });
      });

      const res = await app.request('/public', {
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.userId).toBe('user-789');
    });
  });
});

describe('Protected Endpoints Auth Integration', () => {
  // These tests verify that protected endpoints actually require auth

  it('GET /api/library should return 401 without auth', async () => {
    // Import the actual library routes
    const libraryRoutes = (await import('../../src/routes/library.js')).default;

    const app = new Hono();
    app.route('/api/library', libraryRoutes);

    const res = await app.request('/api/library');
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/user/limit should return 401 without auth', async () => {
    const userRoutes = (await import('../../src/routes/user.js')).default;

    const app = new Hono();
    app.route('/api/user', userRoutes);

    const res = await app.request('/api/user/limit');
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('DELETE /api/user/account should return 401 without auth', async () => {
    const userRoutes = (await import('../../src/routes/user.js')).default;

    const app = new Hono();
    app.route('/api/user', userRoutes);

    const res = await app.request('/api/user/account', { method: 'DELETE' });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/generate should return 401 without auth when Supabase configured', async () => {
    const generateRoutes = (await import('../../src/routes/generate.js')).default;

    const app = new Hono();
    app.route('/api/generate', generateRoutes);

    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com', voiceId: 'default' }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
