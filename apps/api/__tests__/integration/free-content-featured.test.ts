/**
 * Free Content Featured API Integration Tests
 *
 * Tests for featured content endpoints:
 * - GET /api/free-content/featured (public)
 * - PUT /api/free-content/admin/:id/featured (admin)
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

const mockAdminId = 'admin-user-123';

// Create mock Supabase responses
const mockGetUser = vi.fn();

vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => null), // Will cause 500 on DB operations
  isSupabaseConfigured: vi.fn(() => false),
}));

// Mock admin check
vi.mock('../../src/services/admin.js', () => ({
  isAdmin: vi.fn(() => Promise.resolve(true)),
}));

describe('Free Content Featured API Endpoints', () => {
  let app: Hono;
  let freeContentRoutes: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth to return valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockAdminId } },
      error: null,
    });

    // Reset module cache to get fresh route instance
    vi.resetModules();
    const freeContentModule = await import('../../src/routes/free-content.js');
    freeContentRoutes = freeContentModule.default;

    app = new Hono();
    app.route('/api/free-content', freeContentRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/free-content/featured (public)', () => {
    it('should return 500 when supabase not configured', async () => {
      const res = await app.request('/api/free-content/featured');
      // Returns 500 because supabase is not configured in mock
      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/free-content/admin/:id/featured', () => {
    it('should return 401 without auth', async () => {
      const res = await app.request(
        '/api/free-content/admin/550e8400-e29b-41d4-a716-446655440000/featured',
        {
          method: 'PUT',
          body: JSON.stringify({ featured: true }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      expect(res.status).toBe(401);
    });
  });
});
