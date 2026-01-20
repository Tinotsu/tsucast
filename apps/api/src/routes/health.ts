import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', (c) => {
  // Add readiness checks here (database, external services, etc.)
  return c.json({
    status: 'ready',
    checks: {
      api: true,
    },
  });
});

export default app;
