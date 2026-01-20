import { Hono } from 'hono';
import { logger } from '../lib/logger.js';

const app = new Hono();

// Get user's library
app.get('/', async (c) => {
  // TODO: Get user ID from auth header and fetch library from Supabase
  logger.info('Fetching library');

  return c.json({
    items: [],
    message: 'Library endpoint ready for implementation',
  });
});

// Add item to library
app.post('/', async (c) => {
  const body = await c.req.json();
  logger.info({ body }, 'Adding to library');

  return c.json({
    success: true,
    message: 'Add to library endpoint ready for implementation',
  });
});

// Update playback position
app.patch('/:id/position', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  logger.info({ id, body }, 'Updating playback position');

  return c.json({
    success: true,
    message: 'Position update endpoint ready for implementation',
  });
});

// Delete from library
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  logger.info({ id }, 'Deleting from library');

  return c.json({
    success: true,
    message: 'Delete endpoint ready for implementation',
  });
});

export default app;
