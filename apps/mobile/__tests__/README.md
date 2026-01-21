# Mobile App Tests

Testing infrastructure for the tsucast mobile app.

## Setup

```bash
# Install dependencies (from project root)
npm install

# Run tests
npm run test:mobile
```

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for utilities, hooks
│   ├── validation.test.ts   # URL validation tests
│   └── urlNormalization.test.ts  # URL normalization tests
├── components/              # Component tests (React Native Testing Library)
├── support/                 # Test utilities and setup
│   └── setup.ts            # Jest setup file (mocks, globals)
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

For pure functions (validation, normalization, etc.):

```typescript
import { isValidUrl } from '../../utils/validation';

describe('isValidUrl', () => {
  it('should accept valid https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });
});
```

### Component Tests

For React Native components:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { PasteInput } from '../../components/add/PasteInput';

describe('PasteInput', () => {
  it('should render placeholder text', () => {
    const { getByPlaceholderText } = render(
      <PasteInput value="" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Paste article URL here...')).toBeTruthy();
  });
});
```

## Mocking Expo Modules

Common mocks are pre-configured in `support/setup.ts`:

- `expo-crypto` - Returns predictable hash values
- `expo-clipboard` - Mock clipboard operations
- `expo-secure-store` - Mock secure storage

## Coverage Targets

| Metric | Target |
|--------|--------|
| Branches | 50% |
| Functions | 50% |
| Lines | 50% |
| Statements | 50% |

## Best Practices

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **Use descriptive test names** - `should return false for invalid URLs`
3. **One assertion per test** (when practical)
4. **Mock external dependencies** - Expo modules, API calls
5. **Keep tests fast** - Unit tests should run in milliseconds
