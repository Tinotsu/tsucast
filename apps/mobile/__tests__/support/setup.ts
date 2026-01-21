/**
 * Jest Setup File
 *
 * This file runs before each test file.
 * Add global mocks and test utilities here.
 */

// Note: expo-crypto is mocked via manual mock in __mocks__/expo-crypto.ts

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Silence console.error and console.warn in tests (optional - enable for cleaner output)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();

// Global test utilities
(global as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
