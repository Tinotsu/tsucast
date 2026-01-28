/**
 * Admin Routes
 *
 * Protected endpoints for admin dashboard: users, metrics, reports.
 * All routes require is_admin flag on user_profiles.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth.js';
import { getSupabase } from '../lib/supabase.js';
import { createApiError } from '../utils/errors.js';

const app = new Hono();

app.use('*', requireAdmin);

/**
 * GET /users — Paginated user list with optional search.
 */
app.get('/users', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10)));
  const search = c.req.query('search')?.trim();

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    let query = supabase
      .from('user_profiles')
      .select('id, email, display_name, credits_balance, time_bank_minutes, is_admin, created_at', { count: 'exact' });

    if (search) {
      // Sanitize: strip characters that could inject PostgREST filter operators
      const sanitized = search.replace(/[%_,().*\\]/g, '');
      if (sanitized.length > 0) {
        query = query.or(`email.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch users') }, 500);
    }

    const users = (data || []).map((user) => ({
      ...user,
      last_sign_in: null,
      total_generations: 0,
    }));

    // Batch-fetch generation counts for this page of users
    if (users.length > 0) {
      const userIds = users.map((u) => u.id);
      const countPromises = userIds.map((uid) =>
        supabase
          .from('credit_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('type', 'generation')
      );
      const results = await Promise.all(countPromises);
      for (let i = 0; i < users.length; i++) {
        users[i].total_generations = results[i].count || 0;
      }
    }

    const total = count || 0;
    return c.json({
      items: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch users') }, 500);
  }
});

/**
 * GET /users/:id — Single user details.
 */
app.get('/users/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid user ID') }, 400);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, credits_balance, time_bank_minutes, is_admin, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return c.json({ error: createApiError('NOT_FOUND', 'User not found') }, 404);
    }

    const { count: genCount } = await supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('type', 'generation');

    return c.json({
      ...user,
      last_sign_in: null,
      total_generations: genCount || 0,
    });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch user') }, 500);
  }
});

/**
 * GET /metrics — Dashboard metrics.
 */
app.get('/metrics', async (c) => {
  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Run count queries in parallel (head: true avoids fetching rows)
    const [usersResult, totalGenResult, todayGenResult, todayActiveResult] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('credit_transactions').select('*', { count: 'exact', head: true }).eq('type', 'generation'),
      supabase.from('credit_transactions').select('*', { count: 'exact', head: true }).eq('type', 'generation').gte('created_at', todayISO),
      supabase.rpc('count_active_users_today', { since: todayISO }).single(),
    ]);

    // Fallback if RPC doesn't exist: todayActiveResult.data may be null
    const activeData = todayActiveResult.data as { count: number } | null;
    const activeUsersToday = activeData?.count ?? 0;

    return c.json({
      totalUsers: usersResult.count || 0,
      totalGenerations: totalGenResult.count || 0,
      generationsToday: todayGenResult.count || 0,
      activeUsersToday,
      errorRate: 0,
      avgLatency: 0,
    });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch metrics') }, 500);
  }
});

/**
 * GET /reports — Paginated extraction reports with optional status filter.
 */
app.get('/reports', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10)));
  const status = c.req.query('status')?.trim();

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    // Map frontend status names to DB status names
    const statusMap: Record<string, string> = { pending: 'new' };
    const dbStatus = status ? (statusMap[status] || status) : undefined;

    let query = supabase
      .from('extraction_reports')
      .select('id, url, normalized_url, error_type, error_message, user_id, status, created_at', { count: 'exact' });

    if (dbStatus) {
      query = query.eq('status', dbStatus);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch reports') }, 500);
    }

    // Map DB status back to frontend status names and enrich with user email
    const reverseStatusMap: Record<string, string> = { new: 'pending' };
    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];

    const emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email')
        .in('id', userIds);
      if (profiles) {
        for (const p of profiles) {
          emailMap[p.id] = p.email || '';
        }
      }
    }

    const items = (data || []).map((report) => ({
      ...report,
      status: reverseStatusMap[report.status] || report.status,
      user_email: report.user_id ? (emailMap[report.user_id] || '') : '',
      report_count: 1,
      updated_at: report.created_at,
    }));

    const total = count || 0;
    return c.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to fetch reports') }, 500);
  }
});

/**
 * PATCH /reports/:id — Update report status.
 */
app.patch('/reports/:id', async (c) => {
  const id = c.req.param('id');

  const uuidResult = z.string().uuid().safeParse(id);
  if (!uuidResult.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid report ID') }, 400);
  }

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid request body') }, 400);
  }

  const statusSchema = z.object({
    status: z.enum(['fixed', 'wont_fix', 'duplicate']),
  });
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: createApiError('VALIDATION_ERROR', 'Invalid status value') }, 400);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Database not configured') }, 500);
  }

  try {
    const { data, error } = await supabase
      .from('extraction_reports')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return c.json({ error: createApiError('NOT_FOUND', 'Report not found') }, 404);
    }

    return c.json({ success: true });
  } catch {
    return c.json({ error: createApiError('INTERNAL_ERROR', 'Failed to update report') }, 500);
  }
});

export default app;
