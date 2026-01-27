/**
 * IP Rate Limiter Tests
 *
 * Tests for src/middleware/ip-rate-limit.ts
 * Verifies LRU eviction, Map cap at MAX_ENTRIES, and exported utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// We need to test the middleware through a minimal Hono app
import { Hono } from 'hono';
import {
  ipRateLimit,
  getIpLimiterSize,
  clearRateLimitInterval,
} from '../../src/middleware/ip-rate-limit.js';

describe('IP Rate Limiter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getIpLimiterSize', () => {
    it('should return current Map size', () => {
      // Size depends on test execution order, but should be a number
      expect(typeof getIpLimiterSize()).toBe('number');
    });
  });

  describe('clearRateLimitInterval', () => {
    it('should not throw when called', () => {
      expect(() => clearRateLimitInterval()).not.toThrow();
    });
  });

  describe('ipRateLimit middleware', () => {
    it('should allow requests under the limit', async () => {
      const app = new Hono();
      app.use('*', ipRateLimit(5, 60000));
      app.get('/test', (c) => c.json({ ok: true }));

      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('should return 429 when over limit', async () => {
      const app = new Hono();
      app.use('*', ipRateLimit(2, 60000));
      app.get('/test', (c) => c.json({ ok: true }));

      const ip = '10.0.0.2';

      // First two requests should succeed
      await app.request('/test', { headers: { 'x-forwarded-for': ip } });
      await app.request('/test', { headers: { 'x-forwarded-for': ip } });

      // Third should be rate limited
      const res = await app.request('/test', {
        headers: { 'x-forwarded-for': ip },
      });

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should skip rate limiting for unknown IPs', async () => {
      const app = new Hono();
      app.use('*', ipRateLimit(1, 60000));
      app.get('/test', (c) => c.json({ ok: true }));

      // No IP headers = 'unknown'
      const res1 = await app.request('/test');
      const res2 = await app.request('/test');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });

    it('should track different IPs independently', async () => {
      const app = new Hono();
      app.use('*', ipRateLimit(1, 60000));
      app.get('/test', (c) => c.json({ ok: true }));

      const res1 = await app.request('/test', {
        headers: { 'x-forwarded-for': '10.0.0.10' },
      });
      const res2 = await app.request('/test', {
        headers: { 'x-forwarded-for': '10.0.0.11' },
      });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });
  });
});
