/**
 * Fetcher Service Tests
 *
 * Tests for src/services/fetcher.ts
 * Story: 2-2 HTML Content Extraction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPdfUrl, extractFilename, fetchUrl, fetchPdf } from '../../src/services/fetcher.js';
import { ErrorCodes, LIMITS } from '../../src/utils/errors.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to create mock Response
function createMockResponse(body: string | Buffer, options: {
  ok?: boolean;
  status?: number;
  headers?: Record<string, string>;
} = {}) {
  const { ok = true, status = 200, headers = {} } = options;

  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : body.toString()),
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
    body: body instanceof Buffer ? {
      getReader: () => {
        let done = false;
        return {
          read: vi.fn().mockImplementation(() => {
            if (done) return Promise.resolve({ done: true, value: undefined });
            done = true;
            return Promise.resolve({ done: false, value: new Uint8Array(body) });
          }),
          cancel: vi.fn(),
        };
      },
    } : null,
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.clearAllTimers();
});

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

describe('fetchUrl', () => {
  const testUrl = 'https://example.com/article';
  const validHtml = '<html><body><article>This is a proper article with enough content.</article></body></html>';

  describe('successful fetch', () => {
    it('should return HTML content on success', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(validHtml));

      const result = await fetchUrl(testUrl);

      expect(result).toBe(validHtml);
      expect(mockFetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.any(String),
        }),
      }));
    });

    it('should follow redirects', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(validHtml));

      await fetchUrl(testUrl);

      expect(mockFetch).toHaveBeenCalledWith(testUrl, expect.objectContaining({
        redirect: 'follow',
      }));
    });
  });

  describe('HTTP error handling', () => {
    it('should throw PAYWALL_DETECTED for 401 status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('', { ok: false, status: 401 }));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.PAYWALL_DETECTED);
    });

    it('should throw PAYWALL_DETECTED for 403 status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('', { ok: false, status: 403 }));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.PAYWALL_DETECTED);
    });

    it('should throw FETCH_FAILED for 404 status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('', { ok: false, status: 404 }));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.FETCH_FAILED);
    });

    it('should throw FETCH_FAILED for 500 status', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('', { ok: false, status: 500 }));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.FETCH_FAILED);
    });
  });

  describe('paywall content detection', () => {
    it('should throw PAYWALL_DETECTED for short content with paywall indicator', async () => {
      const paywallHtml = '<html><body>Subscribe to read more</body></html>';
      mockFetch.mockResolvedValueOnce(createMockResponse(paywallHtml));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.PAYWALL_DETECTED);
    });

    it('should throw PAYWALL_DETECTED for paywall meta tag', async () => {
      const paywallMeta = '<html><head><meta name="paywall" content="true"></head><body>Content</body></html>';
      mockFetch.mockResolvedValueOnce(createMockResponse(paywallMeta));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.PAYWALL_DETECTED);
    });

    it('should throw PAYWALL_DETECTED for isPaidContent JSON-LD', async () => {
      const paidContent = '<html><script type="application/ld+json">{"isPaidContent": true}</script></html>';
      mockFetch.mockResolvedValueOnce(createMockResponse(paidContent));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.PAYWALL_DETECTED);
    });

    it('should not detect paywall in long content with indicator words', async () => {
      // Content >3000 chars should not trigger paywall detection for indicator words
      const longContent = '<html><body>' + 'a'.repeat(3500) + 'subscribe to read</body></html>';
      mockFetch.mockResolvedValueOnce(createMockResponse(longContent));

      const result = await fetchUrl(testUrl);
      expect(result).toBe(longContent);
    });
  });

  describe('network error handling', () => {
    it('should throw FETCH_FAILED for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.FETCH_FAILED);
    });

    it('should throw TIMEOUT for AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(fetchUrl(testUrl)).rejects.toThrow(ErrorCodes.TIMEOUT);
    });
  });
});

describe('fetchPdf', () => {
  const testUrl = 'https://example.com/document.pdf';
  const testBuffer = Buffer.from('PDF content here');

  describe('successful fetch', () => {
    it('should return buffer and filename', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(testBuffer, {
        headers: { 'content-length': testBuffer.length.toString() },
      }));

      const result = await fetchPdf(testUrl);

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toBe('document.pdf');
    });

    it('should extract filename from Content-Disposition', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(testBuffer, {
        headers: {
          'content-length': testBuffer.length.toString(),
          'content-disposition': 'attachment; filename="report.pdf"',
        },
      }));

      const result = await fetchPdf(testUrl);

      expect(result.filename).toBe('report.pdf');
    });
  });

  describe('size limit enforcement', () => {
    it('should throw PDF_TOO_LARGE when Content-Length exceeds limit', async () => {
      const oversizeLength = LIMITS.MAX_PDF_SIZE_BYTES + 1;
      mockFetch.mockResolvedValueOnce(createMockResponse(testBuffer, {
        headers: { 'content-length': oversizeLength.toString() },
      }));

      await expect(fetchPdf(testUrl)).rejects.toThrow(ErrorCodes.PDF_TOO_LARGE);
    });
  });

  describe('error handling', () => {
    it('should throw FETCH_FAILED for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse('', { ok: false, status: 404 }));

      await expect(fetchPdf(testUrl)).rejects.toThrow(ErrorCodes.FETCH_FAILED);
    });

    it('should throw FETCH_FAILED when response body is null', async () => {
      const nullBodyResponse = createMockResponse(testBuffer);
      nullBodyResponse.body = null;
      mockFetch.mockResolvedValueOnce(nullBodyResponse);

      await expect(fetchPdf(testUrl)).rejects.toThrow(ErrorCodes.FETCH_FAILED);
    });

    it('should throw TIMEOUT for AbortError', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(fetchPdf(testUrl)).rejects.toThrow(ErrorCodes.TIMEOUT);
    });
  });
});
