/**
 * Error Types and Messages
 *
 * Standardized error handling for extraction pipeline.
 * Story: 2-4 Extraction Error Reporting
 */

/**
 * Error type codes matching API responses
 */
export const ExtractionErrorTypes = {
  PARSE_FAILED: 'PARSE_FAILED',
  PAYWALL_DETECTED: 'PAYWALL_DETECTED',
  ARTICLE_TOO_LONG: 'ARTICLE_TOO_LONG',
  FETCH_FAILED: 'FETCH_FAILED',
  IMAGE_ONLY_PDF: 'IMAGE_ONLY_PDF',
  PDF_PASSWORD_PROTECTED: 'PDF_PASSWORD_PROTECTED',
  PDF_TOO_LARGE: 'PDF_TOO_LARGE',
  TIMEOUT: 'TIMEOUT',
  INVALID_URL: 'INVALID_URL',
} as const;

export type ExtractionErrorType =
  (typeof ExtractionErrorTypes)[keyof typeof ExtractionErrorTypes];

/**
 * User-friendly error messages for each error type
 */
export const ErrorMessages: Record<
  ExtractionErrorType,
  { title: string; message: string }
> = {
  [ExtractionErrorTypes.PARSE_FAILED]: {
    title: 'Extraction Failed',
    message: "We couldn't extract content from this URL. Try a different article.",
  },
  [ExtractionErrorTypes.PAYWALL_DETECTED]: {
    title: 'Paywall Detected',
    message: 'This article appears to be behind a paywall. Try a free article instead.',
  },
  [ExtractionErrorTypes.ARTICLE_TOO_LONG]: {
    title: 'Article Too Long',
    message: 'This article exceeds the maximum length of 15,000 words.',
  },
  [ExtractionErrorTypes.FETCH_FAILED]: {
    title: 'Could Not Fetch',
    message: 'We couldn\'t reach this URL. Check your connection and try again.',
  },
  [ExtractionErrorTypes.IMAGE_ONLY_PDF]: {
    title: 'PDF Not Supported',
    message: 'This PDF contains images only. Text-based PDFs work best.',
  },
  [ExtractionErrorTypes.PDF_PASSWORD_PROTECTED]: {
    title: 'PDF Protected',
    message: 'This PDF is password-protected and cannot be processed.',
  },
  [ExtractionErrorTypes.PDF_TOO_LARGE]: {
    title: 'PDF Too Large',
    message: 'This PDF exceeds the maximum file size of 50MB.',
  },
  [ExtractionErrorTypes.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },
  [ExtractionErrorTypes.INVALID_URL]: {
    title: 'Invalid URL',
    message: 'Please enter a valid article URL.',
  },
};

/**
 * Get error info for display
 *
 * @param errorCode - Error type code from API
 * @returns Title and message for display
 */
export function getErrorInfo(errorCode: string): { title: string; message: string } {
  return (
    ErrorMessages[errorCode as ExtractionErrorType] || {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
    }
  );
}
