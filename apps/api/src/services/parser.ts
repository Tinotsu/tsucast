/**
 * Content Parser Service
 *
 * Parses HTML content using Mozilla Readability and linkedom.
 */

import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import { logger } from '../lib/logger.js';
import { ErrorCodes } from '../utils/errors.js';
import { countWords } from '../utils/text.js';

export interface ParseResult {
  title: string;
  content: string;
  textContent: string;
  wordCount: number;
  excerpt?: string;
  byline?: string;
  siteName?: string;
}

/**
 * Parse HTML content using Mozilla Readability
 */
export async function parseHtmlContent(
  html: string,
  url: string
): Promise<ParseResult> {
  try {
    // Parse HTML with linkedom (lighter than jsdom)
    // linkedom's parseHTML types omit `document` — cast needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { document } = parseHTML(html) as any;

    // Set base URL for relative links
    const base = document.createElement('base');
    base.href = url;
    document.head.appendChild(base);

    // Use Readability to extract article content
    const reader = new Readability(document, {
      charThreshold: 100,
    });

    const article = reader.parse();

    if (!article) {
      logger.warn({ url }, 'Readability could not parse article');
      throw new Error(ErrorCodes.PARSE_FAILED);
    }

    // Ensure we have meaningful content
    if (!article.textContent || article.textContent.trim().length < 100) {
      logger.warn({ url, length: article.textContent?.length }, 'Article content too short');
      throw new Error(ErrorCodes.PARSE_FAILED);
    }

    const wordCount = countWords(article.textContent);

    logger.info(
      { url, title: article.title, wordCount },
      'HTML content parsed successfully'
    );

    return {
      title: article.title || 'Untitled',
      content: article.content || '',
      textContent: article.textContent || '',
      wordCount,
      excerpt: article.excerpt || undefined,
      byline: article.byline || undefined,
      siteName: article.siteName || undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCodes.PARSE_FAILED) {
      throw error;
    }

    logger.error({ url, error }, 'HTML parsing error');
    throw new Error(ErrorCodes.PARSE_FAILED);
  }
}
