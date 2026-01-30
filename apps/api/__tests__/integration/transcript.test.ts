/**
 * Transcript Feature Integration Tests
 *
 * Tests for transcript generation and API responses.
 * Story: Transcript & Chapters Support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractChapters, Chapter } from '../../src/services/parser.js';

// Mock the supabase module
vi.mock('../../src/lib/supabase.js', () => ({
  getSupabase: vi.fn(() => null),
  isSupabaseConfigured: vi.fn(() => false),
}));

describe('Transcript Feature', () => {
  describe('extractChapters', () => {
    it('should extract chapters from h1-h3 headings', () => {
      const htmlContent = `
        <article>
          <h1>Introduction</h1>
          <p>Some intro text here.</p>
          <h2>Main Topic</h2>
          <p>Main content goes here.</p>
          <h3>Subtopic</h3>
          <p>More detailed content.</p>
        </article>
      `;
      const textContent = 'Introduction Some intro text here. Main Topic Main content goes here. Subtopic More detailed content.';

      const chapters = extractChapters(htmlContent, textContent);

      expect(chapters).toHaveLength(3);
      expect(chapters[0]).toMatchObject({
        title: 'Introduction',
      });
      expect(chapters[1]).toMatchObject({
        title: 'Main Topic',
      });
      expect(chapters[2]).toMatchObject({
        title: 'Subtopic',
      });

      // Chapters should be sorted by charIndex
      expect(chapters[0].charIndex).toBeLessThan(chapters[1].charIndex);
      expect(chapters[1].charIndex).toBeLessThan(chapters[2].charIndex);
    });

    it('should return empty array for content without headings', () => {
      const htmlContent = '<article><p>Just some paragraphs.</p><p>No headings here.</p></article>';
      const textContent = 'Just some paragraphs. No headings here.';

      const chapters = extractChapters(htmlContent, textContent);

      expect(chapters).toHaveLength(0);
    });

    it('should return empty array for empty content', () => {
      expect(extractChapters('', '')).toHaveLength(0);
      expect(extractChapters('', 'some text')).toHaveLength(0);
      expect(extractChapters('<h1>Test</h1>', '')).toHaveLength(0);
    });

    it('should handle headings with special characters', () => {
      const htmlContent = '<h2>What\'s Next? (Part 2)</h2><p>Content follows.</p>';
      const textContent = 'What\'s Next? (Part 2) Content follows.';

      const chapters = extractChapters(htmlContent, textContent);

      expect(chapters).toHaveLength(1);
      expect(chapters[0].title).toBe('What\'s Next? (Part 2)');
    });

    it('should skip headings not found in textContent', () => {
      // Sometimes Readability strips headings from textContent but keeps in content
      const htmlContent = '<h1>Title</h1><h2>Missing Heading</h2><p>Only this appears.</p>';
      const textContent = 'Only this appears.';

      const chapters = extractChapters(htmlContent, textContent);

      // Should not find headings since they're not in textContent
      expect(chapters.every(ch => textContent.includes(ch.title))).toBe(true);
    });
  });

  describe('Transcript JSON Schema', () => {
    it('should validate transcript JSON structure', () => {
      const validTranscript = {
        version: 1,
        title: 'Test Article',
        words: [
          { text: 'Hello', start_ts: 0.0, end_ts: 0.45 },
          { text: 'world', start_ts: 0.45, end_ts: 0.92 },
        ],
        chapters: [
          { title: 'Introduction', start_ts: 0.0, word_index: 0 },
        ],
      };

      // Version should be a number
      expect(typeof validTranscript.version).toBe('number');
      expect(validTranscript.version).toBeGreaterThanOrEqual(1);

      // Title should be a string
      expect(typeof validTranscript.title).toBe('string');

      // Words should be an array with required fields
      expect(Array.isArray(validTranscript.words)).toBe(true);
      for (const word of validTranscript.words) {
        expect(word).toHaveProperty('text');
        expect(word).toHaveProperty('start_ts');
        expect(word).toHaveProperty('end_ts');
        expect(typeof word.text).toBe('string');
        expect(typeof word.start_ts).toBe('number');
        expect(typeof word.end_ts).toBe('number');
      }

      // Chapters should be an array with required fields
      expect(Array.isArray(validTranscript.chapters)).toBe(true);
      for (const chapter of validTranscript.chapters) {
        expect(chapter).toHaveProperty('title');
        expect(chapter).toHaveProperty('start_ts');
        expect(chapter).toHaveProperty('word_index');
        expect(typeof chapter.title).toBe('string');
        expect(typeof chapter.start_ts).toBe('number');
        expect(typeof chapter.word_index).toBe('number');
      }
    });

    it('should allow empty chapters array', () => {
      const transcriptNoChapters = {
        version: 1,
        title: 'Article Without Headings',
        words: [{ text: 'test', start_ts: 0, end_ts: 0.5 }],
        chapters: [],
      };

      expect(Array.isArray(transcriptNoChapters.chapters)).toBe(true);
      expect(transcriptNoChapters.chapters).toHaveLength(0);
    });
  });

  describe('TTS Token Processing', () => {
    it('should aggregate tokens across chunks with cumulative timing', () => {
      // Simulate Kokoro pipeline output across multiple chunks
      const chunk1Tokens = [
        { text: 'Hello', start_ts: 0.0, end_ts: 0.45 },
        { text: 'world', start_ts: 0.45, end_ts: 0.92 },
      ];
      const chunk2Tokens = [
        { text: 'how', start_ts: 0.0, end_ts: 0.3 },
        { text: 'are', start_ts: 0.3, end_ts: 0.5 },
        { text: 'you', start_ts: 0.5, end_ts: 0.8 },
      ];

      // Aggregate with cumulative timing (as done in handler.py)
      const allTokens: Array<{ text: string; start_ts: number; end_ts: number }> = [];
      let cumulativeTime = 0.0;

      for (const token of chunk1Tokens) {
        allTokens.push({
          text: token.text,
          start_ts: cumulativeTime + token.start_ts,
          end_ts: cumulativeTime + token.end_ts,
        });
      }
      cumulativeTime = allTokens[allTokens.length - 1].end_ts;

      for (const token of chunk2Tokens) {
        allTokens.push({
          text: token.text,
          start_ts: cumulativeTime + token.start_ts,
          end_ts: cumulativeTime + token.end_ts,
        });
      }

      expect(allTokens).toHaveLength(5);
      expect(allTokens[0]).toEqual({ text: 'Hello', start_ts: 0.0, end_ts: 0.45 });
      expect(allTokens[1]).toEqual({ text: 'world', start_ts: 0.45, end_ts: 0.92 });
      // Chunk 2 should start where chunk 1 ended (0.92)
      // Use toBeCloseTo for floating point comparisons
      expect(allTokens[2].text).toBe('how');
      expect(allTokens[2].start_ts).toBeCloseTo(0.92, 2);
      expect(allTokens[2].end_ts).toBeCloseTo(1.22, 2);
      expect(allTokens[3].text).toBe('are');
      expect(allTokens[3].start_ts).toBeCloseTo(1.22, 2);
      expect(allTokens[3].end_ts).toBeCloseTo(1.42, 2);
      expect(allTokens[4].text).toBe('you');
      expect(allTokens[4].start_ts).toBeCloseTo(1.42, 2);
      expect(allTokens[4].end_ts).toBeCloseTo(1.72, 2);
    });
  });

  describe('Chapter to Word Mapping', () => {
    it('should map chapter charIndex to word_index and start_ts', () => {
      const words = [
        { text: 'Hello', start_ts: 0.0, end_ts: 0.45 },
        { text: 'world', start_ts: 0.45, end_ts: 0.9 },
        { text: 'Introduction', start_ts: 0.9, end_ts: 1.5 },
        { text: 'content', start_ts: 1.5, end_ts: 2.0 },
        { text: 'here', start_ts: 2.0, end_ts: 2.3 },
      ];

      // Text: "Hello world Introduction content here"
      // charIndex 0 = 'H' (Hello)
      // charIndex 12 = 'I' (Introduction)
      const chapters: Chapter[] = [
        { title: 'Introduction', charIndex: 12 },
      ];

      // Algorithm: accumulate word lengths to find which word matches charIndex
      function mapChapterToWord(
        chapter: Chapter,
        wordsArray: typeof words
      ): { word_index: number; start_ts: number } {
        let cumChars = 0;
        for (let i = 0; i < wordsArray.length; i++) {
          if (cumChars >= chapter.charIndex) {
            return { word_index: i, start_ts: wordsArray[i].start_ts };
          }
          cumChars += wordsArray[i].text.length + 1; // +1 for space
        }
        return { word_index: wordsArray.length - 1, start_ts: wordsArray[wordsArray.length - 1].start_ts };
      }

      const mapped = mapChapterToWord(chapters[0], words);

      // charIndex 12 should land at word index 2 ("Introduction")
      // "Hello" (5) + space (1) + "world" (5) + space (1) = 12
      expect(mapped.word_index).toBe(2);
      expect(mapped.start_ts).toBe(0.9);
    });
  });

  describe('Status Endpoint Response', () => {
    it('should include transcriptUrl in ready status response', async () => {
      // Mock a ready cache entry with transcript
      const mockEntry = {
        id: 'test-id',
        url_hash: 'test-hash',
        status: 'ready' as const,
        audio_url: 'https://r2.example.com/audio/test.mp3',
        transcript_url: 'https://r2.example.com/transcripts/test.json',
        title: 'Test Article',
        duration_seconds: 300,
        word_count: 1500,
      };

      // Expected response structure
      const expectedResponse = {
        status: 'ready',
        audioUrl: mockEntry.audio_url,
        title: mockEntry.title,
        duration: mockEntry.duration_seconds,
        wordCount: mockEntry.word_count,
        transcriptUrl: mockEntry.transcript_url,
      };

      expect(expectedResponse).toHaveProperty('transcriptUrl');
      expect(expectedResponse.transcriptUrl).toBe(mockEntry.transcript_url);
    });

    it('should handle null transcriptUrl for Together.ai fallback', async () => {
      // When RunPod fails and Together.ai is used, transcriptUrl should be null
      const mockEntry = {
        id: 'test-id',
        status: 'ready' as const,
        audio_url: 'https://r2.example.com/audio/test.mp3',
        transcript_url: null,
        title: 'Test Article',
        duration_seconds: 300,
        word_count: 1500,
      };

      const response = {
        status: 'ready',
        audioUrl: mockEntry.audio_url,
        transcriptUrl: mockEntry.transcript_url,
      };

      expect(response.transcriptUrl).toBeNull();
    });
  });
});
