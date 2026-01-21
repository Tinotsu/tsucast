/**
 * URL Validation Tests
 *
 * Tests for utils/validation.ts
 * Story: 2-1 URL Input & Validation (AC3)
 */

import {
  isValidUrl,
  isPdfUrl,
  getUrlValidationError,
  getUrlType,
} from '../../utils/validation';

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('should accept http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should accept https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should accept URLs with paths', () => {
      expect(isValidUrl('https://example.com/article/123')).toBe(true);
    });

    it('should accept URLs with query parameters', () => {
      expect(isValidUrl('https://example.com/search?q=test&page=1')).toBe(true);
    });

    it('should accept URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    it('should accept URLs with www prefix', () => {
      expect(isValidUrl('https://www.example.com')).toBe(true);
    });

    it('should accept URLs with subdomains', () => {
      expect(isValidUrl('https://blog.example.com/post')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(isValidUrl('  https://example.com  ')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidUrl(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidUrl(undefined as any)).toBe(false);
    });

    it('should reject plain text', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should reject ftp URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });

    it('should reject file URLs', () => {
      expect(isValidUrl('file:///path/to/file')).toBe(false);
    });

    it('should reject javascript URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });

    it('should accept URLs with spaces (browser encodes them)', () => {
      // Note: The URL constructor accepts spaces and encodes them as %20
      // The getUrlValidationError function provides the UX check for spaces
      expect(isValidUrl('https://example.com/path with spaces')).toBe(true);
    });

    it('should reject whitespace-only input', () => {
      expect(isValidUrl('   ')).toBe(false);
    });
  });
});

describe('isPdfUrl', () => {
  it('should detect PDF URLs (lowercase)', () => {
    expect(isPdfUrl('https://example.com/document.pdf')).toBe(true);
  });

  it('should detect PDF URLs (uppercase)', () => {
    expect(isPdfUrl('https://example.com/document.PDF')).toBe(true);
  });

  it('should detect PDF URLs (mixed case)', () => {
    expect(isPdfUrl('https://example.com/document.Pdf')).toBe(true);
  });

  it('should reject non-PDF URLs', () => {
    expect(isPdfUrl('https://example.com/article')).toBe(false);
  });

  it('should reject URLs ending with pdf in query', () => {
    expect(isPdfUrl('https://example.com/search?type=pdf')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isPdfUrl('not a url.pdf')).toBe(false);
  });
});

describe('getUrlValidationError', () => {
  it('should return null for valid URLs', () => {
    expect(getUrlValidationError('https://example.com')).toBeNull();
  });

  it('should return null for empty input (not an error, just incomplete)', () => {
    expect(getUrlValidationError('')).toBeNull();
  });

  it('should return null for whitespace-only input', () => {
    expect(getUrlValidationError('   ')).toBeNull();
  });

  it('should detect URLs with spaces', () => {
    expect(getUrlValidationError('https://example.com/path with space')).toBe(
      'URLs cannot contain spaces'
    );
  });

  it('should detect missing protocol', () => {
    expect(getUrlValidationError('example.com/path')).toBe(
      'URL must start with http:// or https://'
    );
  });

  it('should detect non-HTTP protocols', () => {
    expect(getUrlValidationError('ftp://example.com')).toBe(
      'Please enter an HTTP or HTTPS URL'
    );
  });

  it('should return generic error for invalid format', () => {
    expect(getUrlValidationError('not-a-url')).toBe('Please enter a valid URL');
  });
});

describe('getUrlType', () => {
  it('should return "pdf" for PDF URLs', () => {
    expect(getUrlType('https://example.com/document.pdf')).toBe('pdf');
  });

  it('should return "pdf" for uppercase PDF URLs', () => {
    expect(getUrlType('https://example.com/document.PDF')).toBe('pdf');
  });

  it('should return "html" for non-PDF URLs', () => {
    expect(getUrlType('https://example.com/article')).toBe('html');
  });

  it('should return "html" for invalid URLs', () => {
    expect(getUrlType('not-a-url')).toBe('html');
  });

  it('should return "html" for URLs with pdf in path but not extension', () => {
    expect(getUrlType('https://example.com/pdf/article')).toBe('html');
  });
});
