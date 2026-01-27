/**
 * Rate Limit Integration Tests
 *
 * Tests that rate limiting correctly enforces free tier limits
 * and allows pro users unlimited access.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRateLimitStatus, checkRateLimit, incrementGenerationCount } from '../../src/services/rate-limit.js';
import { FREE_TIER_LIMIT } from '../../src/utils/constants.js';

// Suppress logger output
vi.mock('../../src/lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Create mock Supabase client that we can control per-test
function createMockSupabase(mockData: {
  selectResult?: unknown;
  selectError?: unknown;
  updateResult?: unknown;
  updateError?: unknown;
}) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: mockData.selectResult,
    error: mockData.selectError || null,
  });

  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });

  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  const mockUpdateEq = vi.fn().mockResolvedValue({
    data: mockData.updateResult,
    error: mockData.updateError || null,
  });

  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    }),
    _mocks: { mockSelect, mockUpdate, mockEq, mockSingle, mockUpdateEq },
  };
}

describe('Rate Limit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to have consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getRateLimitStatus', () => {
    it('should allow pro users unlimited access', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'pro',
          daily_generations: 100,
          daily_generations_reset_at: null,
        },
      });

      const result = await getRateLimitStatus('user-pro', mockSupabase as any);

      expect(result.tier).toBe('pro');
      expect(result.allowed).toBe(true);
      expect(result.limit).toBeNull();
      expect(result.remaining).toBeNull();
    });

    it('should allow free users under limit', async () => {
      const futureReset = new Date('2026-01-24T00:00:00Z').toISOString();

      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'free',
          daily_generations: 1,
          daily_generations_reset_at: futureReset,
        },
      });

      const result = await getRateLimitStatus('user-free', mockSupabase as any);

      expect(result.tier).toBe('free');
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.limit).toBe(FREE_TIER_LIMIT);
      expect(result.remaining).toBe(FREE_TIER_LIMIT - 1);
    });

    it('should block free users at limit', async () => {
      const futureReset = new Date('2026-01-24T00:00:00Z').toISOString();

      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'free',
          daily_generations: FREE_TIER_LIMIT,
          daily_generations_reset_at: futureReset,
        },
      });

      const result = await getRateLimitStatus('user-free-maxed', mockSupabase as any);

      expect(result.tier).toBe('free');
      expect(result.allowed).toBe(false);
      expect(result.used).toBe(FREE_TIER_LIMIT);
      expect(result.remaining).toBe(0);
    });

    it('should reset counter when reset time has passed', async () => {
      // Reset time is in the past
      const pastReset = new Date('2026-01-22T00:00:00Z').toISOString();

      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'free',
          daily_generations: 5, // Had 5 yesterday
          daily_generations_reset_at: pastReset,
        },
      });

      const result = await getRateLimitStatus('user-reset', mockSupabase as any);

      // Should have reset to 0
      expect(result.used).toBe(0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(FREE_TIER_LIMIT);

      // Should have updated the database
      expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
    });

    it('should handle new user with no profile gracefully', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: null,
        selectError: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await getRateLimitStatus('new-user', mockSupabase as any);

      // Should treat as free tier with 0 generations
      expect(result.tier).toBe('free');
      expect(result.allowed).toBe(true);
      expect(result.used).toBe(0);
    });
  });

  describe('checkRateLimit', () => {
    it('should return isPro true for pro users', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'pro',
          daily_generations: 0,
          daily_generations_reset_at: null,
        },
      });

      const result = await checkRateLimit('user-pro', mockSupabase as any);

      expect(result.isPro).toBe(true);
      expect(result.allowed).toBe(true);
    });

    it('should return correct remaining count for free users', async () => {
      const futureReset = new Date('2026-01-24T00:00:00Z').toISOString();

      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'free',
          daily_generations: 2,
          daily_generations_reset_at: futureReset,
        },
      });

      const result = await checkRateLimit('user-free', mockSupabase as any);

      expect(result.isPro).toBe(false);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(FREE_TIER_LIMIT - 2);
      expect(result.resetAt).toBe(futureReset);
    });

    it('should return allowed false when limit reached', async () => {
      const futureReset = new Date('2026-01-24T00:00:00Z').toISOString();

      const mockSupabase = createMockSupabase({
        selectResult: {
          subscription_tier: 'free',
          daily_generations: FREE_TIER_LIMIT,
          daily_generations_reset_at: futureReset,
        },
      });

      const result = await checkRateLimit('user-maxed', mockSupabase as any);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('incrementGenerationCount', () => {
    it('should increment count and return remaining', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: { daily_generations: 1 },
      });

      const remaining = await incrementGenerationCount('user-123', mockSupabase as any);

      expect(remaining).toBe(FREE_TIER_LIMIT - 2); // Was 1, now 2
      expect(mockSupabase._mocks.mockUpdate).toHaveBeenCalled();
    });

    it('should handle first generation (null count)', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: { daily_generations: null },
      });

      const remaining = await incrementGenerationCount('new-user', mockSupabase as any);

      expect(remaining).toBe(FREE_TIER_LIMIT - 1); // Was 0, now 1
    });

    it('should return 0 remaining when at limit', async () => {
      const mockSupabase = createMockSupabase({
        selectResult: { daily_generations: FREE_TIER_LIMIT - 1 },
      });

      const remaining = await incrementGenerationCount('user-at-limit', mockSupabase as any);

      expect(remaining).toBe(0);
    });
  });
});

describe('Credit Check in Generate Endpoint', () => {
  // Test that the generate endpoint requires credits

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 402 when user has no credits', async () => {
    // Mock auth to return a valid user
    vi.doMock('../../src/middleware/auth.js', () => ({
      getUserFromToken: vi.fn().mockResolvedValue('no-credits-user'),
    }));

    // Mock supabase as configured
    vi.doMock('../../src/lib/supabase.js', () => ({
      getSupabase: vi.fn(() => ({
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })),
      isSupabaseConfigured: vi.fn(() => true),
    }));

    // Mock credit service - user has 0 credits
    vi.doMock('../../src/services/credits.js', () => ({
      getUserCreditBalance: vi.fn().mockResolvedValue({ credits: 0, timeBank: 0, totalPurchased: 0, totalUsed: 0 }),
      deductCredits: vi.fn(),
      previewCreditCost: vi.fn(),
      estimateDurationFromWords: vi.fn(),
      calculateCreditsNeeded: vi.fn(),
    }));

    // Re-import generate routes with new mocks
    const { Hono } = await import('hono');
    const generateRoutes = (await import('../../src/routes/generate.js')).default;

    const app = new Hono();
    app.route('/api/generate', generateRoutes);

    const res = await app.request('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        url: 'https://example.com/article',
        voiceId: 'default',
      }),
    });

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error.code).toBe('INSUFFICIENT_CREDITS');
    expect(body.error.message).toBe('Insufficient credits. Purchase credits to generate audio.');
  });
});
