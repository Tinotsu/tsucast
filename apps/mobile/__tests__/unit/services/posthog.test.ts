/**
 * Unit Tests: PostHog Service (Mobile)
 *
 * Tests for the PostHog analytics service functions:
 * identifyUser, resetUser, trackEvent, flushPostHog.
 * Priority: P1 — Ensures user attribution accuracy
 *
 * Verifies:
 * - identifyUser sends correct $set and $set_once properties
 * - resetUser clears PostHog identity
 * - trackEvent sends events with typed properties
 * - flushPostHog awaits the flush promise
 *
 * Uses the manual mock at __mocks__/posthog-react-native.ts.
 * Requires `require()` instead of `import` to control module load order
 * (babel-preset-expo transforms process.env to runtime getter, and ES
 * imports are hoisted above the env var assignment).
 */

// Import mock FIRST (this is fine — mock module has no env deps)
import { __mockInstance as mockPH } from '../../../__mocks__/posthog-react-native';

// Set env BEFORE requiring the service so the singleton is created
process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test_key';
process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';

// Use require() to load the service AFTER env vars are set
// (ES import would be hoisted above the env assignment)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  posthogClient,
  identifyUser,
  resetUser,
  trackEvent,
  flushPostHog,
} = require('@/services/posthog') as typeof import('@/services/posthog');

describe('PostHog Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Initialization', () => {
    it('[P1] should create a PostHog client when key is set', () => {
      // GIVEN: EXPO_PUBLIC_POSTHOG_KEY is set
      // THEN: posthogClient is not null
      expect(posthogClient).not.toBeNull();
    });
  });

  describe('identifyUser', () => {
    it('[P1] should call identify with correct $set and $set_once properties', () => {
      // GIVEN: A logged-in user
      const userId = 'user-abc-123';
      const properties = {
        email: 'tino@example.com',
        createdAt: '2026-01-01T00:00:00Z',
        platform: 'ios',
      };

      // WHEN: identifyUser is called
      identifyUser(userId, properties);

      // THEN: PostHog identify is called with correct structure
      expect(mockPH.identify).toHaveBeenCalledWith(userId, {
        $set: { email: 'tino@example.com' },
        $set_once: {
          created_at: '2026-01-01T00:00:00Z',
          platform: 'ios',
        },
      });
    });

    it('[P1] should use null for undefined properties', () => {
      // GIVEN: A user with no email or createdAt
      identifyUser('user-no-email', {});

      // THEN: null values used (not undefined) — required by PostHog JsonType
      expect(mockPH.identify).toHaveBeenCalledWith('user-no-email', {
        $set: { email: null },
        $set_once: {
          created_at: null,
          platform: null,
        },
      });
    });

    it('[P2] should handle partial properties', () => {
      // GIVEN: Only email provided
      identifyUser('user-partial', { email: 'hi@test.com' });

      // THEN: Missing fields are null
      expect(mockPH.identify).toHaveBeenCalledWith('user-partial', {
        $set: { email: 'hi@test.com' },
        $set_once: {
          created_at: null,
          platform: null,
        },
      });
    });
  });

  describe('resetUser', () => {
    it('[P1] should call posthog.reset()', () => {
      // WHEN: resetUser is called (on sign-out)
      resetUser();

      // THEN: PostHog reset is called to clear identity
      expect(mockPH.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('trackEvent', () => {
    it('[P1] should call capture with event name and properties', () => {
      // GIVEN: An event with typed properties
      trackEvent('article_submitted', { voice_id: 'kokoro-en' });

      // THEN: PostHog capture is called correctly
      expect(mockPH.capture).toHaveBeenCalledWith('article_submitted', {
        voice_id: 'kokoro-en',
      });
    });

    it('[P1] should work without properties', () => {
      // WHEN: trackEvent called with no properties
      trackEvent('user_signed_up');

      // THEN: capture called with undefined
      expect(mockPH.capture).toHaveBeenCalledWith('user_signed_up', undefined);
    });

    it('[P2] should handle null property values', () => {
      // WHEN: Event includes null values (e.g., currentTrack?.id ?? null)
      trackEvent('article_completed', { audio_id: null, duration_seconds: 120 });

      // THEN: null values are preserved
      expect(mockPH.capture).toHaveBeenCalledWith('article_completed', {
        audio_id: null,
        duration_seconds: 120,
      });
    });

    it('[P2] should handle boolean property values', () => {
      // WHEN: Event includes boolean values
      trackEvent('article_played', { source: 'library', cached: true });

      expect(mockPH.capture).toHaveBeenCalledWith('article_played', {
        source: 'library',
        cached: true,
      });
    });
  });

  describe('flushPostHog', () => {
    it('[P1] should call flush on the PostHog client', async () => {
      // WHEN: flushPostHog is called (e.g., app going to background)
      await flushPostHog();

      // THEN: flush was called
      expect(mockPH.flush).toHaveBeenCalledTimes(1);
    });
  });
});
