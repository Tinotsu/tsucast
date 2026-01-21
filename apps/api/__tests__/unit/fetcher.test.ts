/**
 * Fetcher Service Tests
 *
 * Tests for src/services/fetcher.ts
 * Story: 2-2 HTML Content Extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPdfUrl, extractFilename } from '../../src/services/fetcher.js';

describe('isPdfUrl', () => {
  it('should return true for .pdf URLs (lowercase)', () => {
    expect(isPdfUrl('https://example.com/document.pdf')).toBe(true);
  });

  it('should return true for .pdf URLs (uppercase)', () => {
    expect(isPdfUrl('https://example.com/DOCUMENT.PDF')).toBe(true);
  });

  it('should return true for .pdf URLs (mixed case)', () => {
    expect(isPdfUrl('https://example.com/Document.Pdf')).toBe(true);
  });

  it('should return true for .pdf URLs with query params', () => {
    expect(isPdfUrl('https://example.com/doc.pdf?token=abc123')).toBe(true);
  });

  it('should return false for HTML URLs', () => {
    expect(isPdfUrl('https://example.com/article')).toBe(false);
  });

  it('should return false for URLs with pdf in query only', () => {
    expect(isPdfUrl('https://example.com/search?format=pdf')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isPdfUrl('not-a-url')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isPdfUrl('')).toBe(false);
  });

  it('should return false for URLs ending with pdf-like extensions', () => {
    expect(isPdfUrl('https://example.com/file.pdf.html')).toBe(false);
    expect(isPdfUrl('https://example.com/file.pdfx')).toBe(false);
  });
});

describe('extractFilename', () => {
  describe('from URL path', () => {
    it('should extract filename from simple URL', () => {
      expect(extractFilename('https://example.com/document.pdf')).toBe('document.pdf');
    });

    it('should extract filename from nested path', () => {
      expect(extractFilename('https://example.com/path/to/file.pdf')).toBe('file.pdf');
    });

    it('should decode URL-encoded filenames', () => {
      expect(extractFilename('https://example.com/my%20document.pdf')).toBe('my document.pdf');
    });

    it('should return default for root path', () => {
      expect(extractFilename('https://example.com/')).toBe('document.pdf');
    });
  });

  describe('from Content-Disposition header', () => {
    it('should extract filename from quoted header', () => {
      expect(
        extractFilename(
          'https://example.com/download',
          'attachment; filename="report.pdf"'
        )
      ).toBe('report.pdf');
    });

    it('should extract filename from unquoted header', () => {
      expect(
        extractFilename(
          'https://example.com/download',
          'attachment; filename=report.pdf'
        )
      ).toBe('report.pdf');
    });

    it('should prefer Content-Disposition over URL', () => {
      expect(
        extractFilename(
          'https://example.com/abc123.pdf',
          'attachment; filename="actual-name.pdf"'
        )
      ).toBe('actual-name.pdf');
    });

    it('should handle single quotes in header', () => {
      expect(
        extractFilename(
          'https://example.com/download',
          "attachment; filename='report.pdf'"
        )
      ).toBe('report.pdf');
    });
  });
});
