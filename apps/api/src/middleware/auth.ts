/**
 * Auth Middleware
 *
 * Provides user authentication from Supabase JWT tokens.
 */

import type { Context, Next } from 'hono';
import { getSupabase } from '../lib/supabase.js';

/**
 * Extract user ID from Supabase JWT token in Authorization header.
 * Returns null if not authenticated or invalid token.
 */
export async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const client = getSupabase();
  if (!client) {
    return null;
  }

  try {
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user.id;
  } catch {
    return null;
  }
}

/**
 * Auth middleware that requires authentication.
 * Sets user ID in context if authenticated.
 * Returns 401 if not authenticated.
 */
export async function requireAuth(c: Context, next: Next) {
  const userId = await getUserFromToken(c.req.header('Authorization'));

  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  c.set('userId', userId);
  await next();
}

/**
 * Auth middleware that optionally extracts user ID.
 * Sets user ID in context if authenticated, otherwise continues without.
 */
export async function optionalAuth(c: Context, next: Next) {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (userId) {
    c.set('userId', userId);
  }
  await next();
}

/**
 * Admin auth middleware — requires authenticated user with is_admin flag.
 * Sets user ID in context if admin.
 */
export async function requireAdmin(c: Context, next: Next) {
  const userId = await getUserFromToken(c.req.header('Authorization'));
  if (!userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
  }

  const client = getSupabase();
  if (!client) {
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Database not configured' } }, 500);
  }

  try {
    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.is_admin) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }, 403);
    }
  } catch {
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to verify admin status' } }, 500);
  }

  c.set('userId', userId);
  return next();
}
