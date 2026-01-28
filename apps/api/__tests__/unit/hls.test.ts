/**
 * HLS Service Tests
 *
 * Tests for src/services/hls.ts
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { describe, it, expect } from 'vitest';
import {
  generateManifest,
  getManifestKey,
  getSegmentKey,
  getRecommendedPollInterval,
} from '../../src/services/hls.js';

describe('hls', () => {
  describe('generateManifest', () => {
    it('generates valid HLS manifest header', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [],
        isComplete: false,
      });

      expect(manifest).toContain('#EXTM3U');
      expect(manifest).toContain('#EXT-X-VERSION:3');
      expect(manifest).toContain('#EXT-X-TARGETDURATION:');
      expect(manifest).toContain('#EXT-X-MEDIA-SEQUENCE:0');
    });

    it('sets EVENT playlist type during generation', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [{ index: 0, url: 'http://example.com/seg0.mp3', duration: 30 }],
        isComplete: false,
      });

      expect(manifest).toContain('#EXT-X-PLAYLIST-TYPE:EVENT');
      expect(manifest).not.toContain('#EXT-X-ENDLIST');
    });

    it('sets VOD playlist type and ENDLIST when complete', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [{ index: 0, url: 'http://example.com/seg0.mp3', duration: 30 }],
        isComplete: true,
      });

      expect(manifest).toContain('#EXT-X-PLAYLIST-TYPE:VOD');
      expect(manifest).toContain('#EXT-X-ENDLIST');
    });

    it('includes segment entries with correct format', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [
          { index: 0, url: 'http://example.com/seg0.mp3', duration: 30.5 },
          { index: 1, url: 'http://example.com/seg1.mp3', duration: 45.123 },
        ],
        isComplete: false,
      });

      expect(manifest).toContain('#EXTINF:30.500,');
      expect(manifest).toContain('http://example.com/seg0.mp3');
      expect(manifest).toContain('#EXTINF:45.123,');
      expect(manifest).toContain('http://example.com/seg1.mp3');
    });

    it('sorts segments by index', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [
          { index: 2, url: 'http://example.com/seg2.mp3', duration: 30 },
          { index: 0, url: 'http://example.com/seg0.mp3', duration: 30 },
          { index: 1, url: 'http://example.com/seg1.mp3', duration: 30 },
        ],
        isComplete: true,
      });

      const lines = manifest.split('\n');
      const urlLines = lines.filter((l) => l.startsWith('http'));

      expect(urlLines[0]).toContain('seg0');
      expect(urlLines[1]).toContain('seg1');
      expect(urlLines[2]).toContain('seg2');
    });

    it('sets target duration to max segment duration (rounded up)', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [
          { index: 0, url: 'http://example.com/seg0.mp3', duration: 25 },
          { index: 1, url: 'http://example.com/seg1.mp3', duration: 45.5 },
        ],
        isComplete: true,
      });

      expect(manifest).toContain('#EXT-X-TARGETDURATION:46');
    });

    it('uses minimum target duration of 30 for empty segments', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [],
        isComplete: false,
      });

      expect(manifest).toContain('#EXT-X-TARGETDURATION:30');
    });

    it('respects custom target duration', () => {
      const manifest = generateManifest({
        streamId: 'test-stream',
        segments: [{ index: 0, url: 'http://example.com/seg0.mp3', duration: 10 }],
        isComplete: true,
        targetDuration: 60,
      });

      expect(manifest).toContain('#EXT-X-TARGETDURATION:60');
    });
  });

  describe('getManifestKey', () => {
    it('generates correct manifest path', () => {
      const key = getManifestKey('abc123');
      expect(key).toBe('streams/abc123/playlist.m3u8');
    });
  });

  describe('getSegmentKey', () => {
    it('generates correct segment path with zero-padded index', () => {
      expect(getSegmentKey('abc123', 0)).toBe('streams/abc123/segment-000.mp3');
      expect(getSegmentKey('abc123', 5)).toBe('streams/abc123/segment-005.mp3');
      expect(getSegmentKey('abc123', 99)).toBe('streams/abc123/segment-099.mp3');
      expect(getSegmentKey('abc123', 123)).toBe('streams/abc123/segment-123.mp3');
    });
  });

  describe('getRecommendedPollInterval', () => {
    it('returns half of target duration', () => {
      expect(getRecommendedPollInterval(30)).toBe(15);
      expect(getRecommendedPollInterval(60)).toBe(30);
    });

    it('returns minimum of 2 seconds', () => {
      expect(getRecommendedPollInterval(2)).toBe(2);
      expect(getRecommendedPollInterval(1)).toBe(2);
    });
  });
});
