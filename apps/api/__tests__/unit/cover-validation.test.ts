/**
 * Cover Validation Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { isImageUrl, validateCover, normalizeCover } from '../../src/utils/cover-validation.js';

describe('isImageUrl', () => {
  it('returns true for https URL', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
  });

  it('returns true for http URL', () => {
    expect(isImageUrl('http://example.com/image.jpg')).toBe(true);
  });

  it('returns false for emoji', () => {
    expect(isImageUrl('🎧')).toBe(false);
  });

  it('returns false for text', () => {
    expect(isImageUrl('hello')).toBe(false);
  });

  it('returns false for javascript protocol', () => {
    expect(isImageUrl('javascript:alert(1)')).toBe(false);
  });

  it('returns false for data URI', () => {
    expect(isImageUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });
});

describe('validateCover', () => {
  describe('valid inputs', () => {
    it('accepts valid https URL', () => {
      const result = validateCover('https://example.com/image.jpg');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid http URL', () => {
      const result = validateCover('http://example.com/image.jpg');
      expect(result.valid).toBe(true);
    });

    it('accepts single emoji', () => {
      const result = validateCover('🎧');
      expect(result.valid).toBe(true);
    });

    it('accepts complex emoji with skin tone', () => {
      const result = validateCover('👋🏽');
      expect(result.valid).toBe(true);
    });

    it('accepts ZWJ sequence emoji (family)', () => {
      // Family emoji with ZWJ can be up to ~10 chars
      const result = validateCover('👨‍👩‍👧');
      expect(result.valid).toBe(true);
    });

    it('accepts empty string (treated as null)', () => {
      const result = validateCover('');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects javascript: protocol', () => {
      const result = validateCover('javascript:alert(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('http and https');
    });

    it('rejects data: URI', () => {
      const result = validateCover('data:text/html,<script>alert(1)</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('http and https');
    });

    it('rejects string exceeding 2048 characters', () => {
      const longString = 'https://example.com/' + 'a'.repeat(2100);
      const result = validateCover(longString);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2048');
    });

    it('rejects emoji string over 10 characters', () => {
      const result = validateCover('🎧🎧🎧🎧🎧🎧'); // Each emoji is 2 chars (surrogate pair) = 12 chars
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10 characters');
    });

    it('rejects malformed URL', () => {
      const result = validateCover('https://');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('rejects file: protocol (via malformed check)', () => {
      const result = validateCover('file:///etc/passwd');
      // This doesn't start with http/https, so treated as non-URL
      // Should be rejected as too long for emoji or invalid
      expect(result.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles URL with query params', () => {
      const result = validateCover('https://example.com/image.jpg?size=large&format=webp');
      expect(result.valid).toBe(true);
    });

    it('handles URL with fragment', () => {
      const result = validateCover('https://example.com/image.jpg#section');
      expect(result.valid).toBe(true);
    });

    it('handles URL with port', () => {
      const result = validateCover('https://example.com:8080/image.jpg');
      expect(result.valid).toBe(true);
    });
  });
});

describe('normalizeCover', () => {
  it('returns null for null input', () => {
    expect(normalizeCover(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeCover(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeCover('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(normalizeCover('   ')).toBeNull();
  });

  it('trims whitespace from value', () => {
    expect(normalizeCover('  🎧  ')).toBe('🎧');
  });

  it('preserves valid URL', () => {
    const url = 'https://example.com/image.jpg';
    expect(normalizeCover(url)).toBe(url);
  });
});
