/**
 * Report API Tests
 *
 * Tests for POST /api/report/extraction
 * Story: 2-4 Extraction Error Reporting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import reportRoutes from '../../src/routes/report.js';

// Mock Supabase - must be before imports
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

describe('POST /api/report/extraction', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api/report', reportRoutes);
  });

  describe('successful reports', () => {
    it('should accept valid report and return success', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
          errorType: 'PARSE_FAILED',
          errorMessage: 'Could not extract content',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('Thanks');
    });

    it('should accept report with notes', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
          errorType: 'PAYWALL_DETECTED',
          errorMessage: 'Paywall found',
          notes: 'This is a free article, should work',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it('should accept report without errorMessage', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
          errorType: 'FETCH_FAILED',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should reject missing url', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorType: 'PARSE_FAILED',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('should reject invalid url', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'not-a-valid-url',
          errorType: 'PARSE_FAILED',
        }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it('should reject missing errorType', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject empty errorType', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
          errorType: '',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('response format', () => {
    it('should return consistent success response', async () => {
      const res = await app.request('/api/report/extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://example.com/article',
          errorType: 'PARSE_FAILED',
        }),
      });

      const json = await res.json();
      expect(json).toHaveProperty('success');
      expect(json).toHaveProperty('message');
      expect(typeof json.success).toBe('boolean');
      expect(typeof json.message).toBe('string');
    });
  });
});
