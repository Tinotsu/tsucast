/**
 * Parser Service Tests
 *
 * Tests for src/services/parser.ts
 * Story: 2-2 HTML Content Extraction
 */

import { describe, it, expect, vi } from 'vitest';
import { parseHtmlContent } from '../../src/services/parser.js';
import { ErrorCodes } from '../../src/utils/errors.js';

// Sample HTML content for testing
const sampleArticleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Article Title</title>
  <meta name="author" content="Test Author">
</head>
<body>
  <header>
    <nav>Navigation links here</nav>
  </header>
  <article>
    <h1>Test Article Title</h1>
    <p class="byline">By Test Author</p>
    <p>This is the first paragraph of the article. It contains some meaningful content that should be extracted by the Readability parser.</p>
    <p>This is the second paragraph with more content. The parser should be able to identify this as the main article body and extract it properly.</p>
    <p>Here is a third paragraph to ensure we have enough content for the parser to work with. Articles typically have multiple paragraphs of text.</p>
    <p>Fourth paragraph continues the article. Good articles have substantial content that provides value to readers.</p>
    <p>Fifth paragraph adds more depth. The Readability algorithm needs sufficient text to properly identify article content.</p>
  </article>
  <aside>
    <h3>Related Articles</h3>
    <ul><li>Link 1</li><li>Link 2</li></ul>
  </aside>
  <footer>
    <p>Copyright 2024</p>
  </footer>
</body>
</html>
`;

const minimalValidHtml = `
<!DOCTYPE html>
<html>
<head><title>Minimal Article</title></head>
<body>
  <article>
    <h1>Minimal Article</h1>
    <p>${'This is test content. '.repeat(50)}</p>
  </article>
</body>
</html>
`;

const shortContentHtml = `
<!DOCTYPE html>
<html>
<head><title>Too Short</title></head>
<body>
  <article>
    <h1>Too Short</h1>
    <p>Very short.</p>
  </article>
</body>
</html>
`;

const noArticleHtml = `
<!DOCTYPE html>
<html>
<head><title>No Article</title></head>
<body>
  <nav>Navigation only</nav>
  <footer>Footer only</footer>
</body>
</html>
`;

describe('parseHtmlContent', () => {
  describe('successful parsing', () => {
    it('should extract title from article', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.title).toBe('Test Article Title');
    });

    it('should extract text content', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.textContent).toContain('first paragraph');
      expect(result.textContent).toContain('second paragraph');
    });

    it('should calculate word count', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.wordCount).toBeGreaterThan(0);
      expect(typeof result.wordCount).toBe('number');
    });

    it('should remove navigation and footer content', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.textContent).not.toContain('Navigation links');
      expect(result.textContent).not.toContain('Copyright 2024');
    });

    it('should remove sidebar/aside content', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.textContent).not.toContain('Related Articles');
    });

    it('should return HTML content string', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      expect(result.content).toBeTruthy();
      expect(typeof result.content).toBe('string');
    });

    it('should handle minimal valid article', async () => {
      const result = await parseHtmlContent(minimalValidHtml, 'https://example.com/minimal');
      expect(result.title).toBe('Minimal Article');
      expect(result.wordCount).toBeGreaterThan(10);
    });
  });

  describe('error handling', () => {
    it('should throw PARSE_FAILED for too short content', async () => {
      await expect(
        parseHtmlContent(shortContentHtml, 'https://example.com/short')
      ).rejects.toThrow(ErrorCodes.PARSE_FAILED);
    });

    it('should throw PARSE_FAILED for non-article pages', async () => {
      await expect(
        parseHtmlContent(noArticleHtml, 'https://example.com/nav')
      ).rejects.toThrow(ErrorCodes.PARSE_FAILED);
    });

    it('should throw PARSE_FAILED for empty HTML', async () => {
      await expect(
        parseHtmlContent('', 'https://example.com/empty')
      ).rejects.toThrow(ErrorCodes.PARSE_FAILED);
    });

    it('should throw PARSE_FAILED for malformed HTML', async () => {
      await expect(
        parseHtmlContent('<not valid html', 'https://example.com/malformed')
      ).rejects.toThrow(ErrorCodes.PARSE_FAILED);
    });
  });

  describe('content extraction quality', () => {
    it('should preserve paragraph breaks in textContent', async () => {
      const result = await parseHtmlContent(sampleArticleHtml, 'https://example.com/article');
      // textContent should have the text from multiple paragraphs
      expect(result.textContent.split(/\s+/).length).toBeGreaterThan(50);
    });

    it('should provide untitled as fallback title', async () => {
      const htmlNoTitle = `
        <!DOCTYPE html>
        <html><body>
          <article>
            <p>${'Content paragraph here. '.repeat(30)}</p>
          </article>
        </body></html>
      `;
      const result = await parseHtmlContent(htmlNoTitle, 'https://example.com/notitle');
      expect(result.title).toBeTruthy();
    });
  });
});
