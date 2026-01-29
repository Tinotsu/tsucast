/**
 * Free Content Routes
 *
 * Public endpoint for reading free content + admin endpoints for CRUD.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { createApiError } from '../utils/errors.js';
import {
  createFreeContent,
  listFreeContent,
  getPublicFreeContent,
  updateFreeContent,
  deleteFreeContent,
  getFeaturedContent,
  setFeaturedContent,
} from '../services/free-content.js';

const app = new Hono();

// Zod schema for POST body
const createFreeContentSchema = z.object({
  title: z.string().min(1).max(500),
  text: z.string().min(1).max(200000).optional(),
  url: z.string().url().max(2000).optional(),
  voiceId: z.string().regex(/^(am_adam|af_sarah|am_michael|af_bella)$/).default('am_adam'),
}).refine(
  data => data.text || data.url,
  { message: 'Either text or url is required' }
);

// Apply admin middleware to /admin/* routes
app.use('/admin/*', requireAdmin);

/**
 * GET / — Public. Returns ready free content items (no auth required).
 */
app.get('/', async (c) => {
  try {
    const items = await getPublicFreeContent();
    return c.json({ items });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch free content') }, 500);
  }
});

/**
 * GET /admin — Admin only. Returns all free content items (all statuses).
 */
app.get('/admin', async (c) => {
  try {
    const items = await listFreeContent();
    return c.json({ items });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch free content') }, 500);
  }
});

/**
 * POST /admin — Admin only. Creates a free content item and kicks off async TTS generation.
 */
app.post('/admin', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = createFreeContentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  try {
    const item = await createFreeContent({
      title: parsed.data.title,
      text: parsed.data.text,
      url: parsed.data.url,
      voiceId: parsed.data.voiceId,
    });
    return c.json({ item }, 201);
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === 'DUPLICATE_CONTENT') {
      return c.json({ error: createApiError('DUPLICATE_CONTENT', error.message) }, 409);
    }
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to create free content') }, 500);
  }
});

// Zod schema for PUT body (update)
const updateFreeContentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  voice_id: z.string().regex(/^(am_adam|af_sarah|am_michael|af_bella)$/).optional(),
  source_url: z.string().url().max(2000).nullable().optional(),
});

/**
 * PUT /admin/:id — Admin only. Updates a free content item's metadata.
 */
app.put('/admin/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid content ID') }, 400);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = updateFreeContentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  try {
    const item = await updateFreeContent(id, parsed.data);
    if (!item) {
      return c.json({ error: createApiError('NOT_FOUND', 'Free content not found') }, 404);
    }
    return c.json({ item });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to update free content') }, 500);
  }
});

/**
 * DELETE /admin/:id — Admin only. Deletes a free content item.
 */
app.delete('/admin/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid content ID') }, 400);
  }

  try {
    const deleted = await deleteFreeContent(id);
    if (!deleted) {
      return c.json({ error: createApiError('NOT_FOUND', 'Free content not found') }, 404);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to delete free content') }, 500);
  }
});

/**
 * GET /featured — Public. Returns the featured content item for landing page hero.
 */
app.get('/featured', async (c) => {
  try {
    const item = await getFeaturedContent();
    return c.json({ item });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch featured content') }, 500);
  }
});

/**
 * PUT /admin/:id/featured — Admin only. Sets or unsets an item as featured.
 */
app.put('/admin/:id/featured', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid content ID') }, 400);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || typeof body.featured !== 'boolean') {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'featured boolean is required') }, 400);
  }

  try {
    const updated = await setFeaturedContent(id, body.featured);
    if (!updated) {
      return c.json({ error: createApiError('NOT_FOUND', 'Free content not found or not ready') }, 404);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to update featured status') }, 500);
  }
});

export default app;
