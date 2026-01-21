/**
 * R2 Storage Service
 *
 * Handles audio file uploads to Cloudflare R2.
 * Story: 3-2 Streaming Audio Generation
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
  } = {}
): Promise<UploadResult> {
  const { urlHash, contentType = 'audio/mpeg' } = options;

  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2 bucket configuration missing');
  }

  // Generate unique key using URL hash or random UUID
  const fileId = urlHash || randomUUID();
  const key = `audio/${fileId}.mp3`;

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
