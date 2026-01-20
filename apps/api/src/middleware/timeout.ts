import type { Context, Next } from 'hono';

export function timeoutMiddleware(ms: number) {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);

    // Attach abort signal to context for downstream use
    c.set('abortSignal', controller.signal);

    try {
      await next();
    } finally {
      clearTimeout(timeoutId);
    }
  };
}
