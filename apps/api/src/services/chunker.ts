/**
 * Text Chunking Service
 *
 * Splits article text into TTS-friendly chunks at sentence boundaries.
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

export interface TextChunk {
  index: number;
  text: string;
  wordCount: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface ChunkingOptions {
  firstChunkWords?: number; // Target words for first chunk (default: 150)
  chunkWords?: number; // Target words for subsequent chunks (default: 450)
  minChunkWords?: number; // Minimum words per chunk (default: 50)
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  firstChunkWords: 150, // Small first chunk for fast initial response
  chunkWords: 450, // ~2-3 minutes of audio per chunk
  minChunkWords: 50, // Don't create tiny chunks
};

/**
 * Split text into chunks at sentence boundaries
 */
export function chunkText(text: string, options?: ChunkingOptions): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Split into sentences (handles ., !, ?, and common abbreviations)
  const sentences = splitIntoSentences(text);

  if (sentences.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let chunkIndex = 0;

  const targetWords = (index: number) =>
    index === 0 ? opts.firstChunkWords : opts.chunkWords;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceWordCount = countWords(sentence);

    // Would this sentence push us over target?
    const wouldExceedTarget =
      currentWordCount + sentenceWordCount > targetWords(chunkIndex) * 1.2;
    const hasMinimumContent = currentWordCount >= opts.minChunkWords;

    if (wouldExceedTarget && hasMinimumContent) {
      // Save current chunk and start new one
      chunks.push({
        index: chunkIndex,
        text: currentChunk.join(' ').trim(),
        wordCount: currentWordCount,
        isFirst: chunkIndex === 0,
        isLast: false, // Will be updated after loop
      });

      chunkIndex++;
      currentChunk = [sentence];
      currentWordCount = sentenceWordCount;
    } else {
      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentWordCount += sentenceWordCount;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.join(' ').trim(),
      wordCount: currentWordCount,
      isFirst: chunkIndex === 0,
      isLast: true,
    });
  }

  // Ensure the actual last chunk is marked correctly
  if (chunks.length > 0) {
    // Reset all isLast to false except the actual last
    for (let i = 0; i < chunks.length - 1; i++) {
      chunks[i].isLast = false;
    }
    chunks[chunks.length - 1].isLast = true;
  }

  return chunks;
}

/**
 * Split text into sentences, preserving abbreviations
 */
function splitIntoSentences(text: string): string[] {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();

  // Common abbreviations that shouldn't end sentences
  const abbreviationPattern =
    /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g|Inc|Ltd|Co|St|Ave|Blvd|Fig|Vol|No|pp|ed|al)\./gi;

  // Protect abbreviations with placeholder
  let protectedText = normalized.replace(abbreviationPattern, (match) =>
    match.replace('.', '<<DOT>>')
  );

  // Also protect decimal numbers (e.g., "3.14")
  protectedText = protectedText.replace(/(\d)\.(\d)/g, '$1<<DOT>>$2');

  // Split on sentence endings followed by space
  const sentences = protectedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/<<DOT>>/g, '.').trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

/**
 * Check if article should use streaming (>=500 words)
 */
export function shouldUseStreaming(wordCount: number): boolean {
  return wordCount >= 500;
}

/**
 * Estimate total duration from word count
 * ~150 words per minute average speaking rate
 */
export function estimateDurationFromWordCount(wordCount: number): number {
  return Math.ceil((wordCount / 150) * 60); // seconds
}

/**
 * Estimate total duration from chunks
 */
export function estimateTotalDuration(chunks: TextChunk[]): number {
  const totalWords = chunks.reduce((sum, c) => sum + c.wordCount, 0);
  return estimateDurationFromWordCount(totalWords);
}

/**
 * Get text preview for debugging/logging
 */
export function getTextPreview(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}
