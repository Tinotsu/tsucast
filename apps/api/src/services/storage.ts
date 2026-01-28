/**
 * R2 Storage Service
 *
 * Handles audio file uploads to Cloudflare R2.
 * Story: 3-2 Streaming Audio Generation
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.js';

// Initialize R2 client (lazy loaded)
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

/**
 * Upload audio buffer to R2 storage
 */
export async function uploadAudio(
  audioBuffer: Buffer,
  options: {
    urlHash?: string;
    contentType?: string;
    keyPrefix?: string;
  } = {}
): Promise<UploadResult> {
  const { urlHash, contentType = 'audio/mpeg', keyPrefix = 'audio' } = options;

  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2 bucket configuration missing');
  }

  // Generate unique key using URL hash or random UUID
  const fileId = urlHash || randomUUID();
  const key = `${keyPrefix}/${fileId}.mp3`;

  try {
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: audioBuffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
      })
    );

    const url = `${publicUrl}/${key}`;

    logger.info({ key, size: audioBuffer.length, url }, 'Audio uploaded to R2');

    return {
      key,
      url,
      size: audioBuffer.length,
    };
  } catch (error) {
    logger.error({ error, key }, 'R2 upload failed');
    throw error;
  }
}

/**
 * Check if R2 is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_URL
  );
}

/**
 * Upload HLS segment (MP3 audio chunk)
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */
export async function uploadSegment(
  audioBuffer: Buffer,
  streamId: string,
  chunkIndex: number
): Promise<{ url: string; size: number }> {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2 bucket configuration missing');
  }

  const paddedIndex = chunkIndex.toString().padStart(3, '0');
  const key = `streams/${streamId}/segment-${paddedIndex}.mp3`;

  try {
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000', // Cache for 1 year
      })
    );

    const url = `${publicUrl}/${key}`;

    logger.info(
      { key, size: audioBuffer.length, streamId, chunkIndex },
      'Segment uploaded to R2'
    );

    return { url, size: audioBuffer.length };
  } catch (error) {
    logger.error({ error, key, streamId, chunkIndex }, 'Segment upload failed');
    throw error;
  }
}

/**
 * Upload HLS manifest (.m3u8)
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */
export async function uploadManifest(
  content: string,
  streamId: string
): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2 bucket configuration missing');
  }

  const key = `streams/${streamId}/playlist.m3u8`;

  try {
    const client = getR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: 'application/vnd.apple.mpegurl',
        // No cache during generation - players need fresh manifest
        CacheControl: 'no-cache, no-store, must-revalidate',
      })
    );

    const url = `${publicUrl}/${key}`;

    logger.info({ key, streamId }, 'Manifest uploaded to R2');

    return url;
  } catch (error) {
    logger.error({ error, key, streamId }, 'Manifest upload failed');
    throw error;
  }
}

/**
 * Finalize manifest with long cache (after stream complete)
 * Story: Streaming Audio Generation (HLS + Together.ai)
 */
export async function finalizeManifest(streamId: string): Promise<void> {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    return;
  }

  const key = `streams/${streamId}/playlist.m3u8`;

  try {
    const client = getR2Client();

    // Read existing manifest
    const existing = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const content = await existing.Body?.transformToString();
    if (!content) {
      logger.warn({ key, streamId }, 'Manifest not found for finalization');
      return;
    }

    // Re-upload with long cache
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: 'application/vnd.apple.mpegurl',
        CacheControl: 'public, max-age=31536000', // 1 year
      })
    );

    logger.info({ key, streamId }, 'Manifest finalized with long cache');
  } catch (error) {
    logger.error({ error, key, streamId }, 'Manifest finalization failed');
    // Non-fatal - manifest still works, just not optimally cached
  }
}
