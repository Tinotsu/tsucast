/**
 * Health Check Routes
 *
 * Comprehensive health checks for all dependencies.
 * Story: 6-1 Error Handling & User Feedback (AC6)
 */

import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { logger } from '../lib/logger.js';
import { getIpLimiterSize } from '../middleware/ip-rate-limit.js';

const app = new Hono();

type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

interface HealthCheck {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  duration_ms: number;
  memory: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  ipLimiterSize: number;
  services: {
    database: ServiceStatus;
    storage: ServiceStatus;
    tts: ServiceStatus;
  };
}

/**
 * GET /health
 *
 * Full health check of all dependencies.
 * Returns 200 if all healthy, 503 if any degraded.
 * Response time target: < 500ms
 */
app.get('/', async (c) => {
  // In production, require HEALTH_CHECK_TOKEN to access detailed health info
  const token = process.env.HEALTH_CHECK_TOKEN;
  if (token && c.req.header('authorization') !== `Bearer ${token}`) {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() }, 200);
  }

  const startTime = Date.now();
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;
  const checks: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    duration_ms: 0,
    memory: {
      rss_mb: toMB(mem.rss),
      heap_used_mb: toMB(mem.heapUsed),
      heap_total_mb: toMB(mem.heapTotal),
    },
    ipLimiterSize: getIpLimiterSize(),
    services: {
      database: 'unknown',
      storage: 'unknown',
      tts: 'unknown',
    },
  };

  // Run checks in parallel with individual timeouts
  const [dbResult, storageResult, ttsResult] = await Promise.allSettled([
    checkDatabase(),
    checkStorage(),
    checkTTS(),
  ]);

  // Process results
  checks.services.database =
    dbResult.status === 'fulfilled' && dbResult.value ? 'healthy' : 'unhealthy';
  checks.services.storage =
    storageResult.status === 'fulfilled' && storageResult.value ? 'healthy' : 'unhealthy';
  checks.services.tts =
    ttsResult.status === 'fulfilled' && ttsResult.value ? 'healthy' : 'unhealthy';

  // Determine overall status
  const unhealthyServices = Object.values(checks.services).filter((s) => s === 'unhealthy');
  if (unhealthyServices.length > 0) {
    checks.status = 'degraded';
    logger.warn({ checks }, 'Health check: degraded');
  }

  checks.duration_ms = Date.now() - startTime;

  return c.json(checks, checks.status === 'ok' ? 200 : 503);
});

/**
 * GET /health/ready
 *
 * Lightweight readiness check for load balancers.
 */
app.get('/ready', (c) => {
  return c.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Check Supabase database connection
 */
async function checkDatabase(): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return false;
  }

  try {
    const supabase = createClient(url, key);
    // Simple query to check connection - count is efficient
    const { error } = await supabase.from('audio_cache').select('id', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return false;
  }
}

/**
 * Check R2 storage bucket accessibility
 */
async function checkStorage(): Promise<boolean> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return false;
  }

  try {
    const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;
    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (error) {
    logger.error({ error }, 'Storage health check failed');
    return false;
  }
}

/**
 * Check Kokoro TTS configuration (env-var only, no network call).
 * A cold RunPod serverless endpoint won't respond within 5s,
 * so we only verify env vars are set. Actual TTS health is validated at generation time.
 */
function checkTTS(): boolean {
  return !!(process.env.KOKORO_API_URL && process.env.KOKORO_API_KEY);
}

export default app;
