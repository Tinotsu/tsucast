import { Hono } from 'hono';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

const app = new Hono();

const generateSchema = z.object({
  url: z.string().url(),
  voiceId: z.string(),
});

// Check if audio exists in cache
app.get('/cache', async (c) => {
  const url = c.req.query('url');

  if (!url) {
    return c.json({ error: 'URL is required' }, 400);
  }

  // TODO: Implement cache lookup in Supabase
  // For now, return not cached
  return c.json({
    cached: false,
    url,
  });
});

// Generate audio from URL
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.errors }, 400);
    }

    const { url, voiceId } = parsed.data;

    logger.info({ url, voiceId }, 'Starting audio generation');

    // TODO: Implement full generation pipeline:
    // 1. Extract content from URL (Readability/pdf-parse)
    // 2. Generate audio with Fish Audio API
    // 3. Upload to Cloudflare R2
    // 4. Cache in Supabase
    // 5. Return audio URL

    return c.json({
      success: true,
      message: 'Generation endpoint ready for implementation',
      url,
      voiceId,
    });
  } catch (error) {
    logger.error({ error }, 'Generation failed');
    return c.json({ error: 'Generation failed' }, 500);
  }
});

export default app;
