import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { logger } from './lib/logger.js';
import { timeoutMiddleware } from './middleware/timeout.js';
import { loggingMiddleware } from './middleware/logging.js';
import healthRoutes from './routes/health.js';
import generateRoutes from './routes/generate.js';
import libraryRoutes from './routes/library.js';
import cacheRoutes from './routes/cache.js';
import reportRoutes from './routes/report.js';
import userRoutes from './routes/user.js';
import webhookRoutes from './routes/webhooks.js';
import playlistRoutes from './routes/playlists.js';

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', honoLogger()); // Console logging for dev
app.use('*', loggingMiddleware); // Structured logging with request IDs
app.use('*', timeoutMiddleware(120000)); // 120s default timeout

// Routes
app.route('/health', healthRoutes);
app.route('/api/generate', generateRoutes);
app.route('/api/library', libraryRoutes);
app.route('/api/cache', cacheRoutes);
app.route('/api/report', reportRoutes);
app.route('/api/user', userRoutes);
app.route('/api/webhooks', webhookRoutes);
app.route('/api/playlists', playlistRoutes);

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
  logger.error({ err, path: c.req.path }, 'Unhandled error');
  return c.json({ error: 'Internal Server Error' }, 500);
});

const port = parseInt(process.env.PORT || '3000', 10);

logger.info({ port }, 'Starting tsucast API server');

serve({
  fetch: app.fetch,
  port,
});
