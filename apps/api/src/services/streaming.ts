/**
 * Streaming Orchestrator
 *
 * Coordinates chunked TTS generation and HLS delivery.
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */

import { logger } from '../lib/logger.js';
import { generateSpeechTogether } from './tts-together.js';
import { chunkText, TextChunk, estimateTotalDuration, getTextPreview } from './chunker.js';
import { generateManifest, HlsSegment } from './hls.js';
import { uploadSegment, uploadManifest, finalizeManifest } from './storage.js';
import {
  createStream,
  startChunk,
  completeChunk,
  failChunk,
  completeStream,
  getCompletedChunks,
  updateStreamManifest,
} from './stream-state.js';

export interface StreamGenerationParams {
  urlHash: string;
  cacheId?: string;
  text: string;
  title: string;
  voiceId: string;
  userId: string;
}

export interface StreamGenerationResult {
  streamId: string;
  manifestUrl: string;
  totalChunks: number;
  estimatedDuration: number;
  firstChunkReady: boolean;
  firstChunkDuration: number;
}

/**
 * Start streaming generation
 *
 * Flow:
 * 1. Chunk the text
 * 2. Create stream state in DB
 * 3. Generate first chunk synchronously (critical for fast response)
 * 4. Return manifest URL immediately after first chunk
 * 5. Queue remaining chunks for background processing
 */
export async function startStreamGeneration(
  params: StreamGenerationParams
): Promise<StreamGenerationResult> {
  const { urlHash, cacheId, text, title, voiceId, userId } = params;

  // 1. Chunk the text
  const chunks = chunkText(text);

  if (chunks.length === 0) {
    throw new Error('No content to generate');
  }

  const totalWords = chunks.reduce((s, c) => s + c.wordCount, 0);

  logger.info(
    {
      urlHash,
      totalChunks: chunks.length,
      totalWords,
      chunkSizes: chunks.map((c) => c.wordCount),
    },
    'Starting stream generation'
  );

  // 2. Create stream state
  const streamId = await createStream({
    urlHash,
    cacheId,
    totalChunks: chunks.length,
    chunks: chunks.map((c) => ({
      index: c.index,
      wordCount: c.wordCount,
      textPreview: getTextPreview(c.text),
    })),
  });

  // 3. Generate first chunk synchronously
  const firstChunk = chunks[0];
  let manifestUrl: string;
  let firstChunkDuration: number;

  try {
    await startChunk(streamId, 0);

    const result = await generateAndUploadChunk(streamId, firstChunk, voiceId);
    firstChunkDuration = result.durationSeconds;

    // Create initial manifest with first segment only
    const manifest = generateManifest({
      streamId,
      segments: [
        {
          index: 0,
          url: result.segmentUrl,
          duration: result.durationSeconds,
        },
      ],
      isComplete: chunks.length === 1,
    });

    manifestUrl = await uploadManifest(manifest, streamId);
    await updateStreamManifest(streamId, manifestUrl);

    logger.info(
      { streamId, manifestUrl, firstChunkDuration },
      'First chunk ready, manifest created'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await failChunk(streamId, 0, errorMessage);
    logger.error({ streamId, error }, 'First chunk generation failed');
    throw error;
  }

  // 4. Queue remaining chunks for background processing
  if (chunks.length > 1) {
    // Fire and forget - don't await
    processRemainingChunks(streamId, chunks.slice(1), voiceId).catch((err) => {
      logger.error({ streamId, error: err }, 'Background chunk processing failed');
    });
  } else {
    // Single chunk - complete immediately
    await completeStream(streamId, manifestUrl, firstChunkDuration);
  }

  // 5. Return result
  return {
    streamId,
    manifestUrl,
    totalChunks: chunks.length,
    estimatedDuration: estimateTotalDuration(chunks),
    firstChunkReady: true,
    firstChunkDuration,
  };
}

/**
 * Generate TTS and upload a single chunk
 */
async function generateAndUploadChunk(
  streamId: string,
  chunk: TextChunk,
  voiceId: string
): Promise<{ segmentUrl: string; durationSeconds: number; sizeBytes: number }> {
  logger.info(
    { streamId, chunkIndex: chunk.index, wordCount: chunk.wordCount },
    'Generating chunk'
  );

  const startTime = Date.now();

  // Generate TTS via Together.ai
  const ttsResult = await generateSpeechTogether({
    text: chunk.text,
    voiceId,
  });

  const ttsTime = Date.now() - startTime;

  // Upload segment to R2
  const uploadResult = await uploadSegment(
    ttsResult.audioBuffer,
    streamId,
    chunk.index
  );

  const totalTime = Date.now() - startTime;

  // Update chunk state
  await completeChunk(
    streamId,
    chunk.index,
    uploadResult.url,
    ttsResult.durationSeconds,
    uploadResult.size
  );

  logger.info(
    {
      streamId,
      chunkIndex: chunk.index,
      duration: ttsResult.durationSeconds,
      sizeBytes: uploadResult.size,
      ttsTimeMs: ttsTime,
      totalTimeMs: totalTime,
    },
    'Chunk complete'
  );

  return {
    segmentUrl: uploadResult.url,
    durationSeconds: ttsResult.durationSeconds,
    sizeBytes: uploadResult.size,
  };
}

/**
 * Process remaining chunks in background (after first chunk returned)
 */
async function processRemainingChunks(
  streamId: string,
  chunks: TextChunk[],
  voiceId: string
): Promise<void> {
  const segments: HlsSegment[] = [];
  let totalDuration = 0;

  // Get first chunk that's already complete
  const completedChunks = await getCompletedChunks(streamId);
  for (const c of completedChunks) {
    if (c.segmentUrl && c.durationSeconds) {
      segments.push({
        index: c.chunkIndex,
        url: c.segmentUrl,
        duration: c.durationSeconds,
      });
      totalDuration += c.durationSeconds;
    }
  }

  // Process remaining chunks sequentially
  for (const chunk of chunks) {
    try {
      await startChunk(streamId, chunk.index);

      const result = await generateAndUploadChunk(streamId, chunk, voiceId);

      segments.push({
        index: chunk.index,
        url: result.segmentUrl,
        duration: result.durationSeconds,
      });
      totalDuration += result.durationSeconds;

      // Update manifest after each chunk
      const manifest = generateManifest({
        streamId,
        segments: segments.sort((a, b) => a.index - b.index),
        isComplete: chunk.isLast,
      });

      const manifestUrl = await uploadManifest(manifest, streamId);
      await updateStreamManifest(streamId, manifestUrl);

      logger.info(
        {
          streamId,
          chunkIndex: chunk.index,
          isLast: chunk.isLast,
          segmentsReady: segments.length,
        },
        'Manifest updated'
      );

      // If last chunk, finalize
      if (chunk.isLast) {
        await finalizeManifest(streamId);
        await completeStream(streamId, manifestUrl, totalDuration);
        logger.info(
          { streamId, totalSegments: segments.length, totalDuration },
          'Stream generation complete'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await failChunk(streamId, chunk.index, errorMessage);
      logger.error(
        { streamId, chunkIndex: chunk.index, error },
        'Chunk generation failed'
      );
      // Stop processing on failure
      return;
    }
  }
}

/**
 * Resume processing a partially completed stream
 * (e.g., after server restart)
 */
export async function resumeStreamGeneration(
  streamId: string,
  voiceId: string
): Promise<void> {
  // TODO: Implement if needed for recovery
  logger.info({ streamId }, 'Stream resume not implemented');
}
