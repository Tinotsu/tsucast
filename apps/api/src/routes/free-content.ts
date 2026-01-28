/**
 * Free Content Routes
 *
 * Public endpoint for reading free content + admin endpoints for CRUD.
 */

import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { z } from 'zod';
import { getUserFromToken } from '../middleware/auth.js';
import { getSupabase } from '../lib/supabase.js';
import { createApiError } from '../utils/errors.js';
import {
  createFreeContent,
  listFreeContent,
  getPublicFreeContent,
  deleteFreeContent,
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

/**
 * Admin auth middleware — requires authenticated user with is_admin flag.
 */
async function requireAdmin(c: Context, next: Next) {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: createApiError('UNAUTHORIZED', 'Authentication required') }, 401);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_admin) {
      return c.json({ error: createApiError('FORBIDDEN', 'Admin access required') }, 403);
    }
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to verify admin status') }, 500);
  }

  c.set('userId', userId);
  return next();
}

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

export default app;
