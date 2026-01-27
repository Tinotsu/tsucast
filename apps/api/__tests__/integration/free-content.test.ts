/**
 * Free Content Integration Tests
 *
 * Tests public and admin endpoints for free content CRUD.
 * Covers: GET (public), GET (admin), POST (admin), DELETE (admin)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock Supabase
const mockFrom = vi.fn();
const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => mockSupabaseClient),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/services/tts.js', () => ({
  generateSpeech: vi.fn(),
}));

vi.mock('../../src/services/storage.js', () => ({
  uploadAudio: vi.fn(),
}));

vi.mock('../../src/services/fetcher.js', () => ({
  fetchUrl: vi.fn(),
}));

vi.mock('../../src/services/parser.js', () => ({
  parseHtmlContent: vi.fn(),
}));

// --- Factories ---

function createFreeContentItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Test Article',
    voice_id: 'am_adam',
    source_url: 'https://example.com/article',
    audio_url: 'https://cdn.example.com/free-content/audio.mp3',
    duration_seconds: 180,
    word_count: 500,
    file_size_bytes: 2048000,
    status: 'ready',
    error_message: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Helpers ---

function setupAuth(userId: string | null, isAdmin = false) {
  if (userId) {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
  } else {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No user' },
    });
  }

  if (userId && isAdmin) {
    const adminChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_profiles') return adminChain;
      return createSupabaseChain({ data: [] });
    });
  }
}

function createSupabaseChain(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  chain.order.mockResolvedValue(result);
  chain.delete.mockReturnValue({
    ...chain,
    eq: vi.fn().mockResolvedValue({ ...result, count: result.count ?? 0 }),
  });
  mockFrom.mockReturnValue(chain);
  return chain;
}

/** Sets up admin auth + table-aware mockFrom for admin CRUD operations */
function setupAdminWithTable(tableResult: { data?: unknown; error?: unknown; count?: number }) {
  setupAuth('admin-user', true);

  const adminChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
  };

  const dataChain = createSupabaseChain(tableResult);

  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_profiles') return adminChain;
    return dataChain;
  });

  return dataChain;
}

/** Sets up admin auth + insert chain that resolves to given item (for POST happy paths) */
function setupAdminWithInsert(item: Record<string, unknown>) {
  setupAuth('admin-user', true);

  const adminChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
  };
  const insertChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: item, error: null }),
  };
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_profiles') return adminChain;
    return insertChain;
  });
}

/** Sets up admin auth + insert chain that throws (for POST error paths) */
function setupAdminWithInsertError(error: Error) {
  setupAuth('admin-user', true);

  const adminChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
  };
  const insertChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockRejectedValue(error),
  };
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_profiles') return adminChain;
    return insertChain;
  });
}

/** Sets up admin auth + delete chain with given count (for DELETE paths) */
function setupAdminWithDelete(result: { error: unknown; count: number }) {
  setupAuth('admin-user', true);

  const adminChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
  };
  const deleteEq = vi.fn().mockResolvedValue(result);
  const deleteChain = {
    delete: vi.fn().mockReturnValue({ eq: deleteEq }),
  };
  mockFrom.mockImplementation((table: string) => {
    if (table === 'user_profiles') return adminChain;
    return deleteChain;
  });
}

describe('Free Content Routes', () => {
  let app: Hono;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { default: freeContentRoutes } = await import('../../src/routes/free-content.js');
    app = new Hono();
    app.route('/api/free-content', freeContentRoutes);
  });

  // --- Public GET / ---

  describe('GET /api/free-content (public)', () => {
    it('should return 200 with items array containing ready items', async () => {
      const readyItems = [
        createFreeContentItem({ id: '1', title: 'Article One' }),
        createFreeContentItem({ id: '2', title: 'Article Two' }),
      ];

      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: readyItems, error: null });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });
      eqMock.mockReturnValue({ order: orderMock });

      const res = await app.request('/api/free-content');
      expect(res.status).toBe(200);

      const body = await res.json();

      // H1: Assert response body contract
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toMatchObject({
        id: '1',
        title: 'Article One',
        status: 'ready',
        audio_url: expect.any(String),
      });
    });

    it('should return 200 with empty array when no ready items exist', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const res = await app.request('/api/free-content');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ items: [] });
    });

    it('should return 500 with error shape on database failure', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } }),
      });

      const res = await app.request('/api/free-content');
      expect(res.status).toBe(500);

      // M3: Assert error response body shape
      const body = await res.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should not require Authorization header', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      // No Authorization header
      const res = await app.request('/api/free-content');
      expect(res.status).toBe(200);
    });
  });

  // --- Admin GET /admin ---

  describe('GET /api/free-content/admin (admin)', () => {
    it('should return 200 with all items (all statuses) for admin', async () => {
      const allItems = [
        createFreeContentItem({ id: '1', status: 'ready' }),
        createFreeContentItem({ id: '2', status: 'processing' }),
        createFreeContentItem({ id: '3', status: 'failed', error_message: 'TTS failed' }),
      ];

      setupAuth('admin-user', true);

      const adminChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
      };
      const dataChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: allItems, error: null }),
      };
      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') return adminChain;
        return dataChain;
      });

      const res = await app.request('/api/free-content/admin', {
        headers: { Authorization: 'Bearer valid-token' },
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('items');
      expect(body.items).toHaveLength(3);
    });

    it('should reject unauthenticated requests with 401', async () => {
      setupAuth(null);

      const res = await app.request('/api/free-content/admin', {
        headers: {},
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  // --- Admin POST /admin ---

  describe('POST /api/free-content/admin', () => {
    it('should create item and return 201 with item body', async () => {
      const createdItem = createFreeContentItem({ status: 'processing' });
      setupAdminWithInsert(createdItem);

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'New Article',
          url: 'https://example.com/new-article',
        }),
      });

      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body).toHaveProperty('item');
      expect(body.item).toMatchObject({
        id: expect.any(String),
        title: 'Test Article',
        status: 'processing',
      });
    });

    it('should create item with text content (no URL)', async () => {
      const createdItem = createFreeContentItem({ status: 'processing', source_url: null });
      setupAdminWithInsert(createdItem);

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'Custom Text Article',
          text: 'This is the full text content for TTS generation.',
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.item).toBeDefined();
    });

    it('should return 409 for duplicate content', async () => {
      const dupError = new Error('Content with this URL and voice already exists');
      (dupError as Error & { code: string }).code = 'DUPLICATE_CONTENT';
      setupAdminWithInsertError(dupError);

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({
          title: 'Duplicate Article',
          url: 'https://example.com/already-exists',
        }),
      });

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('DUPLICATE_CONTENT');
      expect(body.error.message).toContain('already exists');
    });

    it('should reject unauthenticated users with 401', async () => {
      setupAuth(null);

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test', url: 'https://example.com' }),
      });

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin users with 403', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: false }, error: null }),
      });

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ title: 'Test', url: 'https://example.com' }),
      });

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should reject request missing title with 400', async () => {
      setupAdminWithTable({ data: null });

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject request with neither text nor url with 400', async () => {
      setupAdminWithTable({ data: null });

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify({ title: 'Test' }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid JSON body with 400', async () => {
      setupAdminWithTable({ data: null });

      const res = await app.request('/api/free-content/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: 'not-json',
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --- Admin DELETE /admin/:id ---

  describe('DELETE /api/free-content/admin/:id', () => {
    const validUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    it('should delete existing item and return 200 with success', async () => {
      setupAdminWithDelete({ error: null, count: 1 });

      const res = await app.request(`/api/free-content/admin/${validUUID}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ success: true });
    });

    it('should return 404 for non-existent item', async () => {
      setupAdminWithDelete({ error: null, count: 0 });

      const res = await app.request(`/api/free-content/admin/${validUUID}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should reject invalid UUID with 400', async () => {
      setupAuth('admin-user', true);

      const adminChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { is_admin: true }, error: null }),
      };
      mockFrom.mockReturnValue(adminChain);

      const res = await app.request('/api/free-content/admin/not-a-uuid', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unauthenticated requests with 401', async () => {
      setupAuth(null);

      const res = await app.request(`/api/free-content/admin/${validUUID}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });
  });
});
