/**
 * URL Normalization Tests
 *
 * Tests for utils/urlNormalization.ts
 * Story: 2-1 URL Input & Validation (AC2)
 */

// Mock expo-crypto before importing modules that use it
jest.mock('expo-crypto', () => {
  // Simple djb2 hash function
  const simpleHash = (str: string): string => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    const hex = Math.abs(hash >>> 0).toString(16);
    return hex.repeat(Math.ceil(64 / hex.length)).substring(0, 64);
  };

  return {
    digestStringAsync: jest.fn(
      (_algorithm: string, data: string): Promise<string> => {
        return Promise.resolve(simpleHash(data));
      }
    ),
    CryptoDigestAlgorithm: {
      SHA256: 'SHA-256',
    },
  };
});

import {
  normalizeUrl,
  hashUrl,
  normalizeAndHashUrl,
  extractDomain,
  extractPath,
} from '../../utils/urlNormalization';

describe('normalizeUrl', () => {
  describe('hostname normalization', () => {
    it('should lowercase hostname', () => {
      expect(normalizeUrl('https://EXAMPLE.COM/path')).toBe(
        'https://example.com/path'
      );
    });

    it('should remove www prefix', () => {
      expect(normalizeUrl('https://www.example.com/path')).toBe(
        'https://example.com/path'
      );
    });

    it('should handle mixed case with www', () => {
      expect(normalizeUrl('https://WWW.Example.COM/path')).toBe(
        'https://example.com/path'
      );
    });
  });

  describe('path normalization', () => {
    it('should remove trailing slash', () => {
      expect(normalizeUrl('https://example.com/path/')).toBe(
        'https://example.com/path'
      );
    });

    it('should remove multiple trailing slashes', () => {
      expect(normalizeUrl('https://example.com/path///')).toBe(
        'https://example.com/path'
      );
    });

    it('should keep root path as /', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com/');
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });

    it('should preserve path segments', () => {
      expect(normalizeUrl('https://example.com/a/b/c')).toBe(
        'https://example.com/a/b/c'
      );
    });
  });

  describe('tracking parameter removal', () => {
    it('should remove utm_source', () => {
      const url = 'https://example.com/article?utm_source=twitter';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should remove all UTM parameters', () => {
      const url =
        'https://example.com/article?utm_source=twitter&utm_medium=social&utm_campaign=test&utm_term=keyword&utm_content=link';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should remove fbclid', () => {
      const url = 'https://example.com/article?fbclid=abc123';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should remove gclid', () => {
      const url = 'https://example.com/article?gclid=xyz789';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should remove ref parameter', () => {
      const url = 'https://example.com/article?ref=homepage';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should preserve non-tracking parameters', () => {
      const url = 'https://example.com/search?q=test&page=2&utm_source=twitter';
      const normalized = normalizeUrl(url);
      expect(normalized).toContain('q=test');
      expect(normalized).toContain('page=2');
      expect(normalized).not.toContain('utm_source');
    });

    it('should remove multiple tracking parameters', () => {
      const url =
        'https://example.com/article?id=123&fbclid=abc&gclid=xyz&mc_cid=mail&ref=email';
      const normalized = normalizeUrl(url);
      expect(normalized).toContain('id=123');
      expect(normalized).not.toContain('fbclid');
      expect(normalized).not.toContain('gclid');
      expect(normalized).not.toContain('mc_cid');
      expect(normalized).not.toContain('ref=');
    });
  });

  describe('query parameter sorting', () => {
    it('should sort remaining query parameters alphabetically', () => {
      const url = 'https://example.com/search?z=last&a=first&m=middle';
      expect(normalizeUrl(url)).toBe(
        'https://example.com/search?a=first&m=middle&z=last'
      );
    });
  });

  describe('fragment removal', () => {
    it('should remove URL fragments', () => {
      const url = 'https://example.com/article#section-2';
      expect(normalizeUrl(url)).toBe('https://example.com/article');
    });

    it('should remove fragments with query params', () => {
      const url = 'https://example.com/article?id=123#comments';
      expect(normalizeUrl(url)).toBe('https://example.com/article?id=123');
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      expect(normalizeUrl('  https://example.com/path')).toBe(
        'https://example.com/path'
      );
    });

    it('should trim trailing whitespace', () => {
      expect(normalizeUrl('https://example.com/path  ')).toBe(
        'https://example.com/path'
      );
    });
  });

  describe('error handling', () => {
    it('should return original string for invalid URLs', () => {
      expect(normalizeUrl('not a valid url')).toBe('not a valid url');
    });

    it('should return trimmed string for invalid URLs', () => {
      expect(normalizeUrl('  invalid  ')).toBe('invalid');
    });
  });
});

describe('hashUrl', () => {
  it('should return a string', async () => {
    const hash = await hashUrl('https://example.com');
    expect(typeof hash).toBe('string');
  });

  it('should return consistent hash for same input', async () => {
    const hash1 = await hashUrl('https://example.com');
    const hash2 = await hashUrl('https://example.com');
    expect(hash1).toBe(hash2);
  });

  it('should return different hash for different input', async () => {
    const hash1 = await hashUrl('https://example.com');
    const hash2 = await hashUrl('https://different.com');
    expect(hash1).not.toBe(hash2);
  });
});

describe('normalizeAndHashUrl', () => {
  it('should return both normalized URL and hash', async () => {
    const result = await normalizeAndHashUrl('https://WWW.Example.COM/path/');
    expect(result).toHaveProperty('normalized');
    expect(result).toHaveProperty('hash');
    expect(result.normalized).toBe('https://example.com/path');
    expect(typeof result.hash).toBe('string');
  });

  it('should remove tracking params before hashing', async () => {
    const result1 = await normalizeAndHashUrl('https://example.com/article');
    const result2 = await normalizeAndHashUrl(
      'https://example.com/article?utm_source=twitter'
    );
    expect(result1.normalized).toBe(result2.normalized);
    expect(result1.hash).toBe(result2.hash);
  });
});

describe('extractDomain', () => {
  it('should extract domain from URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('should remove www prefix', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
  });

  it('should lowercase domain', () => {
    expect(extractDomain('https://EXAMPLE.COM')).toBe('example.com');
  });

  it('should handle subdomains', () => {
    expect(extractDomain('https://blog.example.com')).toBe('blog.example.com');
  });

  it('should return null for invalid URLs', () => {
    expect(extractDomain('not a url')).toBeNull();
  });
});

describe('extractPath', () => {
  it('should extract path from URL', () => {
    expect(extractPath('https://example.com/article/123')).toBe('/article/123');
  });

  it('should return root path for domain only', () => {
    expect(extractPath('https://example.com')).toBe('/');
  });

  it('should truncate long paths', () => {
    const longPath = '/a'.repeat(30); // 60 characters
    const result = extractPath(`https://example.com${longPath}`);
    expect(result!.length).toBeLessThanOrEqual(50);
    expect(result).toContain('...');
  });

  it('should return null for invalid URLs', () => {
    expect(extractPath('not a url')).toBeNull();
  });
});
