# API Tests

Testing infrastructure for the tsucast API server.

## Setup

```bash
# Install dependencies (from project root)
npm install

# Run tests
npm run test:api
```

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for services, utilities
├── integration/             # Integration tests for API endpoints
│   └── cache.test.ts       # Cache endpoint tests
├── support/                 # Test utilities and setup
│   └── setup.ts            # Vitest setup file (mocks, env vars)
└── README.md
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Unit Tests

For service layer logic:

```typescript
import { describe, it, expect } from 'vitest';
import { extractContent } from '../../src/services/extractor';

describe('extractContent', () => {
  it('should extract article title', async () => {
    const result = await extractContent('<html><title>Test</title></html>');
    expect(result.title).toBe('Test');
  });
});
```

### Integration Tests

For API endpoints using Hono's test helper:

```typescript
import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';

describe('GET /api/cache/check', () => {
  it('should return 400 if hash is missing', async () => {
    const app = new Hono();
    app.get('/check', (c) => {
      if (!c.req.query('hash')) {
        return c.json({ error: 'Missing hash' }, 400);
      }
      return c.json({ cached: false });
    });

    const res = await app.request('/check');
    expect(res.status).toBe(400);
  });
});
```

## Environment Variables

Test environment variables are set in `support/setup.ts`:

```typescript
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
```

## Mocking

Common mocks are pre-configured:

- `@supabase/supabase-js` - Mock Supabase client
- `pino` logger - Silenced during tests

## Coverage Targets

| Metric | Target |
|--------|--------|
| Branches | 50% |
| Functions | 50% |
| Lines | 50% |
| Statements | 50% |

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Mock external services** - Database, external APIs
3. **Test edge cases** - Invalid input, error conditions
4. **Use descriptive names** - `should return 400 for invalid hash format`
5. **Clean up after tests** - Use `afterEach` hooks
