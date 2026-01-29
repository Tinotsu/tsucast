/**
 * FAQ Routes
 *
 * Public endpoint for reading FAQ items + admin endpoints for CRUD.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { createApiError } from '../utils/errors.js';
import {
  getPublicFaqItems,
  listFaqItems,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  reorderFaqItems,
} from '../services/faq.js';

const app = new Hono();

// Zod schemas
const createFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  position: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

const updateFaqSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  position: z.number().int().min(0).optional(),
  published: z.boolean().optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().min(0),
  })).min(1),
});

// Apply admin middleware to /admin/* routes
app.use('/admin/*', requireAdmin);

/**
 * GET / — Public. Returns published FAQ items ordered by position.
 */
app.get('/', async (c) => {
  try {
    const items = await getPublicFaqItems();
    return c.json({ items });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch FAQ items') }, 500);
  }
});

/**
 * GET /admin — Admin only. Returns all FAQ items (including unpublished).
 */
app.get('/admin', async (c) => {
  try {
    const items = await listFaqItems();
    return c.json({ items });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch FAQ items') }, 500);
  }
});

/**
 * POST /admin — Admin only. Creates a new FAQ item.
 */
app.post('/admin', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = createFaqSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  try {
    const item = await createFaqItem(parsed.data);
    return c.json({ item }, 201);
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to create FAQ item') }, 500);
  }
});

/**
 * PUT /admin/:id — Admin only. Updates an existing FAQ item.
 */
app.put('/admin/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid FAQ ID') }, 400);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = updateFaqSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  try {
    const item = await updateFaqItem(id, parsed.data);
    if (!item) {
      return c.json({ error: createApiError('NOT_FOUND', 'FAQ item not found') }, 404);
    }
    return c.json({ item });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to update FAQ item') }, 500);
  }
});

/**
 * DELETE /admin/:id — Admin only. Deletes a FAQ item.
 */
app.delete('/admin/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid FAQ ID') }, 400);
  }

  try {
    const deleted = await deleteFaqItem(id);
    if (!deleted) {
      return c.json({ error: createApiError('NOT_FOUND', 'FAQ item not found') }, 404);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to delete FAQ item') }, 500);
  }
});

/**
 * POST /admin/reorder — Admin only. Reorders FAQ items by position.
 */
app.post('/admin/reorder', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Validation failed') }, 400);
  }

  try {
    const success = await reorderFaqItems(parsed.data.items);
    if (!success) {
      return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to reorder FAQ items') }, 500);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to reorder FAQ items') }, 500);
  }
});

export default app;
