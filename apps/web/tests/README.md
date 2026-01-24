# tsucast Web E2E Tests

End-to-end tests for the tsucast web application using Playwright.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

3. Copy environment file and configure:
   ```bash
   cp .env.test.example .env.test
   # Edit .env.test with test credentials
   ```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test smoke.spec.ts

# Run specific test
npx playwright test -g "landing page loads"
```

## Test Structure

```
tests/
├── e2e/                    # E2E test specs
│   ├── smoke.spec.ts       # Critical path smoke tests
│   ├── auth.spec.ts        # Authentication flows
│   ├── generate.spec.ts    # Generate page (core product)
│   └── library.spec.ts     # Library functionality
├── support/
│   ├── fixtures/           # Test fixtures
│   │   └── index.ts        # Extended test with auth
│   └── helpers/            # Utility functions
│       └── api.ts          # Direct API helpers
└── README.md
```

## Writing Tests

### Using Fixtures

```typescript
import { test, expect } from "../support/fixtures";

// Unauthenticated test
test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/tsucast/i);
});

// Authenticated test (uses authenticatedPage fixture)
test("can access generate page", async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  await page.goto("/generate");
  await expect(page.getByPlaceholder(/url/i)).toBeVisible();
});
```

### Selector Strategy

Prefer these selectors (in order):
1. `getByRole()` - Accessible roles
2. `getByLabel()` - Form labels
3. `getByPlaceholder()` - Input placeholders
4. `getByText()` - Visible text
5. `getByTestId()` - data-testid attributes (last resort)

### Test Isolation

- Each test runs in a fresh browser context
- No state shared between tests
- Use fixtures for common setup
- Clean up test data when needed

## Debugging

```bash
# Debug mode
npx playwright test --debug

# Show trace viewer for failed tests
npx playwright show-trace test-results/*/trace.zip

# Generate and view HTML report
npx playwright show-report
```

## CI Integration

Tests run automatically in CI with:
- Retries: 2 (CI only)
- Workers: 1 (CI only, for stability)
- Artifacts: Screenshots, videos, traces on failure

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | App URL to test | `http://localhost:3000` |
| `API_URL` | API URL for helpers | `http://localhost:3001/api` |
| `TEST_USER_EMAIL` | Test user email | `test@example.com` |
| `TEST_USER_PASSWORD` | Test user password | - |
