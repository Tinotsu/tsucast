/**
 * Voices API Integration Tests
 *
 * Tests for voice endpoints:
 * - GET /api/voices/samples (public)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

describe('Voices API Endpoints', () => {
  let app: Hono;
  let voicesRoutes: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset module cache to get fresh route instance
    vi.resetModules();
    const voicesModule = await import('../../src/routes/voices.js');
    voicesRoutes = voicesModule.default;

    app = new Hono();
    app.route('/api/voices', voicesRoutes);
  });

  describe('GET /api/voices/samples', () => {
    it('should return voice samples', async () => {
      const res = await app.request('/api/voices/samples');
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.samples).toBeDefined();
      expect(Array.isArray(body.samples)).toBe(true);
      expect(body.samples.length).toBeGreaterThan(0);
    });

    it('should include Adam, Sarah, and Michael voices', async () => {
      const res = await app.request('/api/voices/samples');
      const body = await res.json();

      const voiceIds = body.samples.map((s: { voiceId: string }) => s.voiceId);
      expect(voiceIds).toContain('am_adam');
      expect(voiceIds).toContain('af_sarah');
      expect(voiceIds).toContain('am_michael');
    });

    it('should have required fields for each sample', async () => {
      const res = await app.request('/api/voices/samples');
      const body = await res.json();

      for (const sample of body.samples) {
        expect(sample).toHaveProperty('voiceId');
        expect(sample).toHaveProperty('name');
        expect(sample).toHaveProperty('description');
        expect(sample).toHaveProperty('audioUrl');
        expect(typeof sample.voiceId).toBe('string');
        expect(typeof sample.name).toBe('string');
        expect(typeof sample.description).toBe('string');
        expect(typeof sample.audioUrl).toBe('string');
      }
    });

    it('should have valid audio URLs', async () => {
      const res = await app.request('/api/voices/samples');
      const body = await res.json();

      for (const sample of body.samples) {
        expect(sample.audioUrl).toMatch(/^https:\/\//);
        expect(sample.audioUrl).toMatch(/\.mp3$/);
      }
    });
  });
});
