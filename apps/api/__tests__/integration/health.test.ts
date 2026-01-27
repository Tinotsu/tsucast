/**
 * Health Endpoint Integration Tests
 *
 * Tests for /health endpoint including memory metrics.
 */

import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';

// Mock external dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: null, error: null })
          ),
        })),
      })),
    })),
  })),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  HeadBucketCommand: vi.fn(),
}));

vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../src/middleware/ip-rate-limit.js', () => ({
  getIpLimiterSize: vi.fn(() => 42),
  clearRateLimitInterval: vi.fn(),
  ipRateLimit: vi.fn(() => vi.fn((_c: unknown, next: () => Promise<void>) => next())),
}));

describe('Health Endpoint', () => {
  it('should include memory metrics in /health response', async () => {
    const healthRoutes = (await import('../../src/routes/health.js')).default;
    const app = new Hono();
    app.route('/health', healthRoutes);

    const res = await app.request('/health');
    const body = await res.json();

    expect(body.memory).toBeDefined();
    expect(typeof body.memory.rss_mb).toBe('number');
    expect(typeof body.memory.heap_used_mb).toBe('number');
    expect(typeof body.memory.heap_total_mb).toBe('number');
    expect(body.memory.rss_mb).toBeGreaterThan(0);
    expect(body.memory.heap_used_mb).toBeGreaterThan(0);
    expect(body.memory.heap_total_mb).toBeGreaterThan(0);
  });

  it('should include ipLimiterSize in /health response', async () => {
    const healthRoutes = (await import('../../src/routes/health.js')).default;
    const app = new Hono();
    app.route('/health', healthRoutes);

    const res = await app.request('/health');
    const body = await res.json();

    expect(body.ipLimiterSize).toBe(42);
  });

  it('should return ready status on /health/ready', async () => {
    const healthRoutes = (await import('../../src/routes/health.js')).default;
    const app = new Hono();
    app.route('/health', healthRoutes);

    const res = await app.request('/health/ready');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ready');
    expect(body.timestamp).toBeDefined();
  });
});
