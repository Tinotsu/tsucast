/**
 * E2E Extraction Tests
 *
 * Tests real URL extraction against live websites.
 * Run with: npm run test:e2e
 */

import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import generateRoutes from '../../src/routes/generate.js';

// Increase timeout for real HTTP requests
const TEST_TIMEOUT = 30000;

describe('E2E Content Extraction', () => {
  let app: Hono;

  beforeAll(() => {
    app = new Hono();
    app.route('/api/generate', generateRoutes);
  });

  describe('HTML extraction - should succeed', () => {
    it('Paul Graham essay', async () => {
      const res = await app.request('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://paulgraham.com/airbnbs.html',
          voiceId: 'test',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.title).toBeTruthy();
      expect(json.wordCount).toBeGreaterThan(100);
      expect(json.contentType).toBe('html');
      console.log(`  ✓ Paul Graham: "${json.title}" (${json.wordCount} words)`);
    }, TEST_TIMEOUT);

    it('Wikipedia article', async () => {
      const res = await app.request('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://en.wikipedia.org/wiki/Giant_panda',
          voiceId: 'test',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.title).toBeTruthy();
      expect(json.wordCount).toBeGreaterThan(500);
      expect(json.contentType).toBe('html');
      console.log(`  ✓ Wikipedia: "${json.title}" (${json.wordCount} words)`);
    }, TEST_TIMEOUT);

    it('BBC Sport article', async () => {
      const res = await app.request('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://www.bbc.com/sport/motorsport/articles/c20g7ljg1v0o',
          voiceId: 'test',
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.title).toBeTruthy();
      expect(json.wordCount).toBeGreaterThan(100);
      expect(json.contentType).toBe('html');
      console.log(`  ✓ BBC: "${json.title}" (${json.wordCount} words)`);
    }, TEST_TIMEOUT);
  });

  describe('Known limitations - expected failures', () => {
    it('Medium - may trigger false paywall detection', async () => {
      const res = await app.request('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://medium.com/@aline.olivebarros/challenge-2-wireframing-spotify-a8e7e69959ff',
          voiceId: 'test',
        }),
      });

      const json = await res.json();

      // Medium often triggers paywall detection due to their page template
      // This test documents the current behavior
      if (res.status === 200) {
        console.log(`  ✓ Medium: "${json.title}" (${json.wordCount} words)`);
        expect(json.wordCount).toBeGreaterThan(50);
      } else {
        console.log(`  ⚠ Medium: ${json.error?.code} - expected limitation`);
        expect(json.error?.code).toMatch(/PAYWALL_DETECTED|PARSE_FAILED/);
      }
    }, TEST_TIMEOUT);

    it('X/Twitter - requires JS rendering (not supported)', async () => {
      const res = await app.request('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://x.com/thedankoe/status/2010751592346030461',
          voiceId: 'test',
        }),
      });

      const json = await res.json();

      // Twitter/X requires JavaScript rendering
      // It may return a shell page with minimal content or fail entirely
      if (res.status === 200) {
        // If it "succeeds", it's just shell HTML, not the actual tweet
        console.log(`  ⚠ X/Twitter: Got shell page only (${json.wordCount} words) - tweet content not extracted`);
        expect(json.wordCount).toBeLessThan(100); // Real tweets would have more
      } else {
        console.log(`  ⚠ X/Twitter: ${json.error?.code} - JS rendering not supported`);
        expect(json.error).toBeDefined();
      }
    }, TEST_TIMEOUT);
  });
});
