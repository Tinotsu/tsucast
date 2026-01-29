/**
 * FAQ API Integration Tests
 *
 * Tests for FAQ endpoints:
 * - GET /api/faq (public list)
 * - GET /api/faq/admin (admin list - requires auth)
 * - POST /api/faq/admin (create - requires auth)
 * - DELETE /api/faq/admin/:id (delete - requires auth)
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

describe('FAQ API Endpoints', () => {
  let app: Hono;
  let faqRoutes: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup auth to return valid admin user
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockAdminId } },
      error: null,
    });

    // Reset module cache to get fresh route instance
    vi.resetModules();
    const faqModule = await import('../../src/routes/faq.js');
    faqRoutes = faqModule.default;

    app = new Hono();
    app.route('/api/faq', faqRoutes);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/faq (public)', () => {
    it('should return 500 when supabase not configured', async () => {
      const res = await app.request('/api/faq');
      // Returns 500 because supabase is not configured in mock
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/faq/admin', () => {
    it('should return 401 without auth', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const res = await app.request('/api/faq/admin');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/faq/admin', () => {
    it('should return 401 without auth', async () => {
      const res = await app.request('/api/faq/admin', {
        method: 'POST',
        body: JSON.stringify({ question: 'Q?', answer: 'A' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/faq/admin/:id', () => {
    it('should return 401 without auth', async () => {
      const res = await app.request('/api/faq/admin/550e8400-e29b-41d4-a716-446655440000', {
        method: 'DELETE',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/faq/admin/:id', () => {
    it('should return 401 without auth', async () => {
      const res = await app.request('/api/faq/admin/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PUT',
        body: JSON.stringify({ question: 'Updated?' }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/faq/admin/reorder', () => {
    it('should return 401 without auth', async () => {
      const res = await app.request('/api/faq/admin/reorder', {
        method: 'POST',
        body: JSON.stringify({ items: [{ id: '550e8400-e29b-41d4-a716-446655440000', position: 0 }] }),
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(401);
    });
  });
});
