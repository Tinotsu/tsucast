/**
 * Manual mock for posthog-react-native
 *
 * Automatically used by Jest when modules import 'posthog-react-native'.
 * Provides a mock PostHog constructor that returns a controllable instance.
 */

const mockInstance = {
  identify: jest.fn(),
  capture: jest.fn(),
  reset: jest.fn(),
  flush: jest.fn().mockResolvedValue(undefined),
  optIn: jest.fn(),
  optOut: jest.fn(),
  isOptedOut: jest.fn().mockReturnValue(false),
  register: jest.fn(),
  screen: jest.fn(),
  alias: jest.fn(),
  group: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
};

class MockPostHog {
  identify = mockInstance.identify;
  capture = mockInstance.capture;
  reset = mockInstance.reset;
  flush = mockInstance.flush;
  optIn = mockInstance.optIn;
  optOut = mockInstance.optOut;
  isOptedOut = mockInstance.isOptedOut;
  register = mockInstance.register;
  screen = mockInstance.screen;
  alias = mockInstance.alias;
  group = mockInstance.group;
  enable = mockInstance.enable;
  disable = mockInstance.disable;

  constructor(_apiKey: string, _options?: Record<string, unknown>) {
    // Module-level singleton is created during import
  }
}

export default MockPostHog;

// Export the mock instance methods so tests can spy on them
export const __mockInstance = mockInstance;
