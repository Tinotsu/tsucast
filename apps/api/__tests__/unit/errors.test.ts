/**
 * Error Utilities Tests
 *
 * Tests for src/utils/errors.ts
 * Story: 2-2 HTML Content Extraction
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCodes,
  ErrorMessages,
  createApiError,
  LIMITS,
} from '../../src/utils/errors.js';

describe('ErrorCodes', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCodes.PARSE_FAILED).toBe('PARSE_FAILED');
    expect(ErrorCodes.PAYWALL_DETECTED).toBe('PAYWALL_DETECTED');
    expect(ErrorCodes.ARTICLE_TOO_LONG).toBe('ARTICLE_TOO_LONG');
    expect(ErrorCodes.FETCH_FAILED).toBe('FETCH_FAILED');
    expect(ErrorCodes.IMAGE_ONLY_PDF).toBe('IMAGE_ONLY_PDF');
    expect(ErrorCodes.PDF_PASSWORD_PROTECTED).toBe('PDF_PASSWORD_PROTECTED');
    expect(ErrorCodes.PDF_TOO_LARGE).toBe('PDF_TOO_LARGE');
    expect(ErrorCodes.TTS_FAILED).toBe('TTS_FAILED');
    expect(ErrorCodes.INVALID_URL).toBe('INVALID_URL');
    expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
  });
});

describe('ErrorMessages', () => {
  it('should have user-friendly messages for all error codes', () => {
    expect(ErrorMessages[ErrorCodes.PARSE_FAILED]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.PAYWALL_DETECTED]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.ARTICLE_TOO_LONG]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.FETCH_FAILED]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.IMAGE_ONLY_PDF]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.PDF_PASSWORD_PROTECTED]).toBeTruthy();
    expect(ErrorMessages[ErrorCodes.PDF_TOO_LARGE]).toBeTruthy();
  });

  it('should have descriptive paywall message', () => {
    expect(ErrorMessages[ErrorCodes.PAYWALL_DETECTED]).toContain('paywall');
  });

  it('should have descriptive word limit message', () => {
    expect(ErrorMessages[ErrorCodes.ARTICLE_TOO_LONG]).toContain('15,000');
  });
});

describe('createApiError', () => {
  it('should create error with code and default message', () => {
    const error = createApiError(ErrorCodes.PARSE_FAILED);
    expect(error.code).toBe('PARSE_FAILED');
    expect(error.message).toBe(ErrorMessages[ErrorCodes.PARSE_FAILED]);
    expect(error.details).toBeUndefined();
  });

  it('should allow custom message override', () => {
    const customMessage = 'Custom error description';
    const error = createApiError(ErrorCodes.PARSE_FAILED, customMessage);
    expect(error.code).toBe('PARSE_FAILED');
    expect(error.message).toBe(customMessage);
  });

  it('should include details when provided', () => {
    const details = { url: 'https://example.com', attempts: 3 };
    const error = createApiError(ErrorCodes.FETCH_FAILED, undefined, details);
    expect(error.details).toEqual(details);
  });

  it('should handle unknown error codes gracefully', () => {
    const error = createApiError('UNKNOWN_CODE');
    expect(error.code).toBe('UNKNOWN_CODE');
    expect(error.message).toBe('An unknown error occurred');
  });

  it('should not include details property when not provided', () => {
    const error = createApiError(ErrorCodes.PARSE_FAILED);
    expect('details' in error).toBe(false);
  });
});

describe('LIMITS', () => {
  it('should have correct MAX_WORD_COUNT', () => {
    expect(LIMITS.MAX_WORD_COUNT).toBe(15000);
  });

  it('should have correct MAX_PDF_SIZE_BYTES (50MB)', () => {
    expect(LIMITS.MAX_PDF_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('should have correct FETCH_TIMEOUT_MS (30s)', () => {
    expect(LIMITS.FETCH_TIMEOUT_MS).toBe(30000);
  });

  it('should have correct PDF_FETCH_TIMEOUT_MS (60s)', () => {
    expect(LIMITS.PDF_FETCH_TIMEOUT_MS).toBe(60000);
  });
});
