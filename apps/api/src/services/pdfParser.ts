/**
 * PDF Parser Service
 *
 * Parses PDF content using pdf-parse library.
 */

import pdf from 'pdf-parse';
import { logger } from '../lib/logger.js';
import { ErrorCodes } from '../utils/errors.js';
import { countWords } from '../utils/text.js';

export interface PdfParseResult {
  title: string;
  textContent: string;
  wordCount: number;
  pageCount: number;
}

/**
 * Clean up title from filename
 */
function cleanTitle(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse PDF content from buffer
 */
export async function parsePdfContent(
  buffer: Buffer,
  filename: string
): Promise<PdfParseResult> {
  try {
    const data = await pdf(buffer);

    const textContent = data.text.trim();
    const wordCount = countWords(textContent);

    // Extract title from metadata or filename
    const title =
      (data.info && data.info.Title) || cleanTitle(filename);

    logger.info(
      { filename, title, wordCount, pageCount: data.numpages },
      'PDF content parsed successfully'
    );

    return {
      title,
      textContent,
      wordCount,
      pageCount: data.numpages,
    };
  } catch (error) {
    // Check for password-protected PDF
    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes('password') ||
        error.message.toLowerCase().includes('encrypted'))
    ) {
      logger.warn({ filename, error }, 'PDF is password protected');
      throw new Error(ErrorCodes.PDF_PASSWORD_PROTECTED);
    }

    logger.error({ filename, error }, 'PDF parsing error');
    throw new Error(ErrorCodes.PARSE_FAILED);
  }
}

/**
 * Check if PDF appears to be image-only (scanned document)
 *
 * Heuristics:
 * - Very low word count relative to page count
 * - High ratio of non-printable/garbage characters
 */
export function isImageOnlyPdf(result: PdfParseResult): boolean {
  // Less than 50 words total is definitely image-only
  if (result.wordCount < 50) {
    return true;
  }

  // Less than 20 words per page on average suggests scanned document
  if (result.pageCount > 0 && result.wordCount / result.pageCount < 20) {
    return true;
  }

  // Check for high ratio of garbage characters (OCR artifacts)
  const nonPrintableRegex = /[^\x20-\x7E\n\t]/g;
  const garbageChars = (result.textContent.match(nonPrintableRegex) || []).length;
  const garbageRatio = garbageChars / result.textContent.length;

  if (result.textContent.length > 0 && garbageRatio > 0.3) {
    return true;
  }

  return false;
}
