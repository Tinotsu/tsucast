import { initSentry, captureException, flush as sentryFlush } from './lib/sentry.js';
initSentry();

import { initPostHog, shutdownPostHog } from './lib/posthog.js';
initPostHog();

import { initEmail } from './lib/email.js';
initEmail();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { bodyLimit } from 'hono/body-limit';
import { logger } from './lib/logger.js';
import { timeoutMiddleware } from './middleware/timeout.js';
import { loggingMiddleware } from './middleware/logging.js';
import { clearRateLimitInterval } from './middleware/ip-rate-limit.js';
import { createApiError, ErrorCodes } from './utils/errors.js';
import healthRoutes from './routes/health.js';
import generateRoutes from './routes/generate.js';
import libraryRoutes from './routes/library.js';
import cacheRoutes from './routes/cache.js';
import reportRoutes from './routes/report.js';
import userRoutes from './routes/user.js';
import webhookRoutes from './routes/webhooks.js';
import playlistRoutes from './routes/playlists.js';
import checkoutRoutes from './routes/checkout.js';
import emailRoutes from './routes/email.js';
import freeContentRoutes from './routes/free-content.js';
import faqRoutes from './routes/faq.js';
import voicesRoutes from './routes/voices.js';
import adminRoutes from './routes/admin.js';
import streamRoutes from './routes/stream.js';
import audioRoutes from './routes/audio.js';
import { processEmailQueue } from './services/email-sequences.js';

type AppEnv = {
  Variables: {
    requestId: string;
  };
};

const app = new Hono<AppEnv>();

// Global middleware
// CORS: Restrict to allowed origins in production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://tsucast.app',
      'https://www.tsucast.app',
      'https://tsucast.com',
      'https://www.tsucast.com',
    ]
  : ['http://localhost:3000', 'http://localhost:8081']; // Dev: Next.js + Expo

app.use('*', cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
if (process.env.NODE_ENV !== 'production') {
  app.use('*', honoLogger());
}
app.use('*', loggingMiddleware); // Structured logging with request IDs
app.use('*', timeoutMiddleware(120000)); // 120s default timeout
app.use('*', bodyLimit({
  maxSize: 1024 * 1024, // 1MB limit to prevent DoS
  onError: (c) => c.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } }, 413),
}));

// Routes
app.route('/health', healthRoutes);
app.route('/api/generate', generateRoutes);
app.route('/api/library', libraryRoutes);
app.route('/api/cache', cacheRoutes);
app.route('/api/report', reportRoutes);
app.route('/api/user', userRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/playlists', playlistRoutes);
app.route('/api/checkout', checkoutRoutes);
app.route('/api/email', emailRoutes);
app.route('/api/free-content', freeContentRoutes);
app.route('/api/faq', faqRoutes);
app.route('/api/voices', voicesRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/stream', streamRoutes);
app.route('/api/audio', audioRoutes);

// Root route
app.get('/', (c) => {
  return c.json({
    name: 'tsucast-api',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  const requestId = c.get('requestId');
  logger.error({ err, path: c.req.path, method: c.req.method, requestId }, 'Unhandled error');
  captureException(err);
  return c.json({ error: createApiError(ErrorCodes.INTERNAL_ERROR) }, 500);
});

const port = parseInt(process.env.PORT || '3001', 10);

logger.info({ port }, 'Starting tsucast API server');

const server = serve({
  fetch: app.fetch,
  port,
});

// Email queue cron interval
let emailQueueRunning = false;
const emailQueueEnabled = process.env.EMAIL_QUEUE_ENABLED !== 'false';
const emailInterval: ReturnType<typeof setInterval> | null = emailQueueEnabled ? setInterval(async () => {
  if (emailQueueRunning) return;
  emailQueueRunning = true;
  try { await processEmailQueue(); }
  catch (e) { logger.error(e, 'Email queue processing failed'); }
  finally { emailQueueRunning = false; }
}, 60 * 60 * 1000) : null;
if (!emailQueueEnabled) logger.info('Email queue disabled via EMAIL_QUEUE_ENABLED=false');

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, `Received ${signal}, shutting down gracefully...`);

  clearRateLimitInterval();
  if (emailInterval) clearInterval(emailInterval);

  server.close(() => {
    logger.info('Server closed');
  });

  // Flush PostHog before Sentry (PostHog buffers events)
  await shutdownPostHog().catch(() => {});
  // Flush any buffered Sentry events before exit
  await sentryFlush(2000).catch(() => {});

  // Force exit after 30s (matches Docker's default SIGKILL timeout)
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000).unref();

  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => { shutdown('SIGTERM'); });
process.on('SIGINT', () => { shutdown('SIGINT'); });

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  captureException(err);
  // Flush with a hard timeout — async ops are unreliable after uncaught exceptions
  shutdownPostHog().catch(() => {})
    .then(() => sentryFlush(2000).catch(() => {}))
    .finally(() => process.exit(1));
  // Hard fallback if flush promise never settles
  setTimeout(() => process.exit(1), 3000).unref();
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled rejection');
  captureException(reason);
  shutdownPostHog().catch(() => {})
    .then(() => sentryFlush(2000).catch(() => {}))
    .finally(() => process.exit(1));
  setTimeout(() => process.exit(1), 3000).unref();
});
