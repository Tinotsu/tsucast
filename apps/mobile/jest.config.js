/** @type {import('jest').Config} */
module.exports = {
  // Use basic node environment for unit tests (avoids React 19 compatibility issues)
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/unit/**/*.test.{ts,tsx}',
    '**/__tests__/unit/**/*.spec.{ts,tsx}',
  ],

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/support/setup.ts'],

  // Module name mapping for path aliases and mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.ts',
    '^posthog-react-native$': '<rootDir>/__mocks__/posthog-react-native.ts',
    '^expo/virtual/env$': '<rootDir>/__mocks__/expo-virtual-env.ts',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Performance
  maxWorkers: '50%',

  // Clear mocks between tests
  clearMocks: true,
  // Note: resetMocks: true would reset jest.mock() implementations, breaking our expo-crypto mock
};
