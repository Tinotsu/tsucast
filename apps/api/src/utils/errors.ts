/**
 * Error Codes and Messages
 *
 * Standardized error responses for content extraction pipeline.
 */

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export const ErrorCodes = {
  // Content extraction errors
  PARSE_FAILED: 'PARSE_FAILED',
  PAYWALL_DETECTED: 'PAYWALL_DETECTED',
  ARTICLE_TOO_LONG: 'ARTICLE_TOO_LONG',
  FETCH_FAILED: 'FETCH_FAILED',

  // PDF-specific errors
  IMAGE_ONLY_PDF: 'IMAGE_ONLY_PDF',
  PDF_PASSWORD_PROTECTED: 'PDF_PASSWORD_PROTECTED',
  PDF_TOO_LARGE: 'PDF_TOO_LARGE',

  // TTS errors (for future use)
  TTS_FAILED: 'TTS_FAILED',

  // Generic errors
  INVALID_URL: 'INVALID_URL',
  TIMEOUT: 'TIMEOUT',
} as const;

export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.PARSE_FAILED]: "Couldn't extract content from this URL",
  [ErrorCodes.PAYWALL_DETECTED]: 'This article appears to be behind a paywall',
  [ErrorCodes.ARTICLE_TOO_LONG]: 'Article is too long (max 15,000 words)',
  [ErrorCodes.FETCH_FAILED]: 'Could not fetch the article',
  [ErrorCodes.IMAGE_ONLY_PDF]:
    'This PDF contains images only. Text-based PDFs work best.',
  [ErrorCodes.PDF_PASSWORD_PROTECTED]:
    'This PDF is password-protected and cannot be processed.',
  [ErrorCodes.PDF_TOO_LARGE]: 'This PDF is too large (max 50MB)',
  [ErrorCodes.TTS_FAILED]: 'Audio generation failed. Please try again.',
  [ErrorCodes.INVALID_URL]: 'Please enter a valid URL',
  [ErrorCodes.TIMEOUT]: 'Request timed out. Please try again.',
};

/**
 * Create a standardized API error response
 */
export function createApiError(
  code: string,
  customMessage?: string,
  details?: unknown
): ApiError {
  const error: ApiError = {
    code,
    message: customMessage || ErrorMessages[code] || 'An unknown error occurred',
  };

  if (details !== undefined) {
    error.details = details;
  }

  return error;
}

/**
 * Content extraction limits
 */
export const LIMITS = {
  MAX_WORD_COUNT: 15000,
  MAX_PDF_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  FETCH_TIMEOUT_MS: 30000, // 30 seconds
  PDF_FETCH_TIMEOUT_MS: 60000, // 60 seconds for larger PDFs
} as const;
