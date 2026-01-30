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

export interface Chapter {
  title: string;
  charIndex: number;
}

export interface ParseResult {
  title: string;
  content: string;
  textContent: string;
  wordCount: number;
  chapters: Chapter[];
  excerpt?: string;
  byline?: string;
  siteName?: string;
  image?: string;
}

/**
 * Extract chapter markers from HTML headings
 * Returns array of chapters with title and character index in textContent
 */
export function extractChapters(htmlContent: string, textContent: string): Chapter[] {
  if (!htmlContent || !textContent) {
    return [];
  }

  try {
    // Parse the HTML content to find headings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { document } = parseHTML(htmlContent) as any;

    const headings = document.querySelectorAll('h1, h2, h3');
    const chapters: Chapter[] = [];

    for (const heading of headings) {
      const headingText = heading.textContent?.trim();
      if (!headingText) continue;

      // Find the position of this heading text in the textContent
      // Use indexOf to get character position
      const charIndex = textContent.indexOf(headingText);

      if (charIndex >= 0) {
        chapters.push({
          title: headingText,
          charIndex,
        });
      }
    }

    // Sort chapters by character index (in case DOM order differs)
    chapters.sort((a, b) => a.charIndex - b.charIndex);

    return chapters;
  } catch (error) {
    logger.warn({ error }, 'Failed to extract chapters from HTML');
    return [];
  }
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

    // Extract og:image BEFORE Readability (it mutates the DOM and may remove meta tags)
    let image: string | undefined;
    try {
      const ogImageMeta = document.querySelector('meta[property="og:image"]');
      const ogImageContent = ogImageMeta?.getAttribute('content');
      if (ogImageContent) {
        // Resolve relative/protocol-relative URLs
        image = new URL(ogImageContent, url).href;
      }
    } catch {
      // Invalid URL or extraction error - continue without image
      logger.debug({ url }, 'Failed to extract og:image');
    }

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

    // Extract chapters from headings in the parsed HTML content
    const chapters = extractChapters(article.content || '', article.textContent || '');

    logger.info(
      { url, title: article.title, wordCount, chapterCount: chapters.length },
      'HTML content parsed successfully'
    );

    return {
      title: article.title || 'Untitled',
      content: article.content || '',
      textContent: article.textContent || '',
      wordCount,
      chapters,
      excerpt: article.excerpt || undefined,
      byline: article.byline || undefined,
      siteName: article.siteName || undefined,
      image,
    };
  } catch (error) {
    if (error instanceof Error && error.message === ErrorCodes.PARSE_FAILED) {
      throw error;
    }

    logger.error({ url, error }, 'HTML parsing error');
    throw new Error(ErrorCodes.PARSE_FAILED);
  }
}
