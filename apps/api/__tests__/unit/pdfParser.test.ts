/**
 * PDF Parser Service Tests
 *
 * Tests for src/services/pdfParser.ts
 * Story: 2-3 PDF Content Extraction
 */

import { describe, it, expect, vi } from 'vitest';
import { isImageOnlyPdf } from '../../src/services/pdfParser.js';

describe('isImageOnlyPdf', () => {
  describe('word count heuristics', () => {
    it('should return true for less than 50 words', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'A few words only',
          wordCount: 4,
          pageCount: 1,
        })
      ).toBe(true);
    });

    it('should return true for exactly 49 words', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'word '.repeat(49).trim(),
          wordCount: 49,
          pageCount: 1,
        })
      ).toBe(true);
    });

    it('should not flag 50+ words as image-only by word count alone', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'This is normal text. '.repeat(20),
          wordCount: 80,
          pageCount: 1,
        })
      ).toBe(false);
    });
  });

  describe('words per page heuristics', () => {
    it('should return true for less than 20 words per page', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'Some text across pages',
          wordCount: 50, // 50 words across 5 pages = 10 words/page
          pageCount: 5,
        })
      ).toBe(true);
    });

    it('should not flag normal documents', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'Normal document content. '.repeat(100),
          wordCount: 300, // 300 words across 5 pages = 60 words/page
          pageCount: 5,
        })
      ).toBe(false);
    });

    it('should handle zero page count gracefully', () => {
      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: 'Some content here',
          wordCount: 100,
          pageCount: 0,
        })
      ).toBe(false);
    });
  });

  describe('garbage character detection', () => {
    it('should return true for high ratio of non-printable characters', () => {
      // Create text with >30% non-printable characters
      const normalText = 'Some text';
      const garbage = '\x00\x01\x02\x03\x04\x05\x06'.repeat(10);
      const mixed = normalText + garbage;

      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: mixed,
          wordCount: 100, // High enough to pass word count check
          pageCount: 1,
        })
      ).toBe(true);
    });

    it('should allow normal text with some unicode', () => {
      const textWithUnicode = 'This is a normal article with some émojis and accénts. '.repeat(20);

      expect(
        isImageOnlyPdf({
          title: 'Test',
          textContent: textWithUnicode,
          wordCount: 200,
          pageCount: 2,
        })
      ).toBe(false);
    });
  });

  describe('combined heuristics', () => {
    it('should identify typical scanned PDF', () => {
      expect(
        isImageOnlyPdf({
          title: 'Scanned Document',
          textContent: '   \n \t  ', // Whitespace only from OCR
          wordCount: 0,
          pageCount: 10,
        })
      ).toBe(true);
    });

    it('should identify normal text PDF', () => {
      expect(
        isImageOnlyPdf({
          title: 'Research Paper',
          textContent: 'This is a proper research paper with substantial content. '.repeat(100),
          wordCount: 900,
          pageCount: 10,
        })
      ).toBe(false);
    });
  });
});
