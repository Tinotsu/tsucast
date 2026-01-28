/**
 * Chunker Service Tests
 *
 * Tests for src/services/chunker.ts
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { describe, it, expect } from 'vitest';
import {
  chunkText,
  countWords,
  shouldUseStreaming,
  estimateTotalDuration,
  estimateDurationFromWordCount,
  getTextPreview,
} from '../../src/services/chunker.js';

describe('chunker', () => {
  describe('countWords', () => {
    it('counts words in simple text', () => {
      expect(countWords('hello world')).toBe(2);
      expect(countWords('one two three four five')).toBe(5);
    });

    it('handles multiple spaces', () => {
      expect(countWords('hello   world')).toBe(2);
      expect(countWords('  hello  world  ')).toBe(2);
    });

    it('returns 0 for empty string', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });
  });

  describe('chunkText', () => {
    it('returns empty array for empty text', () => {
      expect(chunkText('')).toEqual([]);
      expect(chunkText('   ')).toEqual([]);
    });

    it('creates single chunk for short text', () => {
      const text = 'This is a short sentence. It has two sentences.';
      const chunks = chunkText(text);

      expect(chunks.length).toBe(1);
      expect(chunks[0].isFirst).toBe(true);
      expect(chunks[0].isLast).toBe(true);
      expect(chunks[0].index).toBe(0);
    });

    it('splits text at sentence boundaries', () => {
      // Create text with enough words to force multiple chunks
      const sentences = Array(20)
        .fill('This is a test sentence with exactly ten words in it.')
        .join(' ');

      const chunks = chunkText(sentences, {
        firstChunkWords: 50,
        chunkWords: 50,
        minChunkWords: 10,
      });

      // Should have multiple chunks
      expect(chunks.length).toBeGreaterThan(1);

      // Each chunk should end at a sentence boundary (end with period)
      for (const chunk of chunks) {
        expect(chunk.text.trim()).toMatch(/[.!?]$/);
      }
    });

    it('marks first and last chunks correctly', () => {
      const sentences = Array(20)
        .fill('This is a sentence. ')
        .join('');

      const chunks = chunkText(sentences, {
        firstChunkWords: 20,
        chunkWords: 30,
        minChunkWords: 10,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].isFirst).toBe(true);
      expect(chunks[0].isLast).toBe(false);
      expect(chunks[chunks.length - 1].isFirst).toBe(false);
      expect(chunks[chunks.length - 1].isLast).toBe(true);
    });

    it('respects firstChunkWords being smaller than chunkWords', () => {
      const sentences = Array(30)
        .fill('Word word word word word. ')
        .join('');

      const chunks = chunkText(sentences, {
        firstChunkWords: 20,
        chunkWords: 50,
        minChunkWords: 5,
      });

      expect(chunks.length).toBeGreaterThan(1);
      // First chunk should be smaller
      expect(chunks[0].wordCount).toBeLessThan(chunks[1].wordCount * 1.5);
    });

    it('preserves abbreviations like Mr. and Dr.', () => {
      const text = 'Dr. Smith went to the store. Mr. Jones followed him. They discussed the weather.';
      const chunks = chunkText(text);

      // Should be single chunk (short text)
      expect(chunks.length).toBe(1);
      // Abbreviations should be preserved
      expect(chunks[0].text).toContain('Dr.');
      expect(chunks[0].text).toContain('Mr.');
    });

    it('handles decimal numbers correctly', () => {
      const text = 'The price is 3.14 dollars. The tax is 0.25 dollars. Total is 3.39 dollars.';
      const chunks = chunkText(text);

      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toContain('3.14');
      expect(chunks[0].text).toContain('0.25');
    });

    it('assigns sequential indices', () => {
      const sentences = Array(20)
        .fill('Testing one two three four five six. ')
        .join('');

      const chunks = chunkText(sentences, {
        firstChunkWords: 20,
        chunkWords: 30,
        minChunkWords: 10,
      });

      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].index).toBe(i);
      }
    });
  });

  describe('shouldUseStreaming', () => {
    it('returns false for short articles', () => {
      expect(shouldUseStreaming(100)).toBe(false);
      expect(shouldUseStreaming(499)).toBe(false);
    });

    it('returns true for long articles', () => {
      expect(shouldUseStreaming(500)).toBe(true);
      expect(shouldUseStreaming(1000)).toBe(true);
      expect(shouldUseStreaming(5000)).toBe(true);
    });
  });

  describe('estimateDurationFromWordCount', () => {
    it('estimates duration at ~150 words per minute', () => {
      // 150 words = 60 seconds
      expect(estimateDurationFromWordCount(150)).toBe(60);
      // 300 words = 120 seconds
      expect(estimateDurationFromWordCount(300)).toBe(120);
    });

    it('rounds up to whole seconds', () => {
      // 160 words = 64 seconds (160/150 * 60 = 64)
      expect(estimateDurationFromWordCount(160)).toBe(64);
    });
  });

  describe('estimateTotalDuration', () => {
    it('sums word counts and estimates total duration', () => {
      const chunks = [
        { index: 0, text: '', wordCount: 150, isFirst: true, isLast: false },
        { index: 1, text: '', wordCount: 150, isFirst: false, isLast: true },
      ];

      // 300 words = 120 seconds
      expect(estimateTotalDuration(chunks)).toBe(120);
    });

    it('returns 0 for empty array', () => {
      expect(estimateTotalDuration([])).toBe(0);
    });
  });

  describe('getTextPreview', () => {
    it('returns full text if shorter than max length', () => {
      const text = 'Short text';
      expect(getTextPreview(text, 100)).toBe(text);
    });

    it('truncates long text with ellipsis', () => {
      const text = 'This is a very long text that should be truncated';
      const preview = getTextPreview(text, 20);

      expect(preview.length).toBe(20);
      expect(preview).toMatch(/\.\.\.$/);
    });

    it('uses default max length of 100', () => {
      const longText = 'a'.repeat(200);
      const preview = getTextPreview(longText);

      expect(preview.length).toBe(100);
    });
  });
});
