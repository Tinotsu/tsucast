# Story 5.1: Free Tier Implementation

Status: ready-for-dev

## Story

As a free user,
I want to try tsucast with limited usage,
so that I can experience the value before paying.

## Acceptance Criteria

1. **AC1: Generation Counter**
   - Given user is on free tier
   - When they generate audio
   - Then daily generation counter increments
   - And limit is 3 articles per day

2. **AC2: Limit Display**
   - Given free user checks limit
   - When they view Add screen
   - Then they see remaining generations: "2 of 3 today"

3. **AC3: Daily Reset**
   - Given daily limit resets
   - When midnight UTC passes
   - Then counter resets to 0
   - And user can generate again

## Tasks / Subtasks

### Task 1: Update User Profiles Schema (AC: 1, 3)
- [ ] 1.1 Verify `user_profiles` has required columns (from Story 1.1):
  ```sql
  -- Already in user_profiles table:
  subscription_tier TEXT DEFAULT 'free',
  daily_generations INTEGER DEFAULT 0,
  daily_generations_reset_at TIMESTAMPTZ
  ```
- [ ] 1.2 If not present, create migration to add columns

### Task 2: Limit Check in Generate Endpoint (AC: 1, 3)
- [ ] 2.1 Update `apps/api/src/routes/generate.ts`:
  ```typescript
  generate.post('/generate', authMiddleware, async (c) => {
    const user = c.get('user');

    // Get user profile with generation count
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, daily_generations, daily_generations_reset_at')
      .eq('id', user.id)
      .single();

    // Check if reset needed (new day)
    const now = new Date();
    const resetAt = profile?.daily_generations_reset_at
      ? new Date(profile.daily_generations_reset_at)
      : null;

    let currentGenerations = profile?.daily_generations || 0;

    if (!resetAt || resetAt < now) {
      // Reset for new day
      currentGenerations = 0;
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);

      await supabase
        .from('user_profiles')
        .update({
          daily_generations: 0,
          daily_generations_reset_at: tomorrow.toISOString(),
        })
        .eq('id', user.id);
    }

    // Check limit for free tier
    const FREE_LIMIT = 3;
    if (profile?.subscription_tier === 'free' && currentGenerations >= FREE_LIMIT) {
      return c.json({
        error: {
          code: 'RATE_LIMITED',
          message: "You've reached your daily limit",
          remaining: 0,
          resetAt: profile.daily_generations_reset_at,
        }
      }, 429);
    }

    // ... continue with generation

    // After successful generation, increment counter
    await supabase
      .from('user_profiles')
      .update({
        daily_generations: currentGenerations + 1,
      })
      .eq('id', user.id);

    return c.json({
      audioUrl,
      title,
      duration,
      remaining: FREE_LIMIT - (currentGenerations + 1),
    });
  });
  ```

### Task 3: Get Limit Status Endpoint (AC: 2)
- [ ] 3.1 Create endpoint to check current limit status:
  ```typescript
  // In apps/api/src/routes/user.ts
  user.get('/user/limit', authMiddleware, async (c) => {
    const user = c.get('user');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, daily_generations, daily_generations_reset_at')
      .eq('id', user.id)
      .single();

    const now = new Date();
    const resetAt = profile?.daily_generations_reset_at
      ? new Date(profile.daily_generations_reset_at)
      : null;

    // Check if reset needed
    let generations = profile?.daily_generations || 0;
    if (!resetAt || resetAt < now) {
      generations = 0;
    }

    const FREE_LIMIT = 3;
    const isPro = profile?.subscription_tier === 'pro';

    return c.json({
      tier: profile?.subscription_tier || 'free',
      used: isPro ? 0 : generations,
      limit: isPro ? null : FREE_LIMIT,
      remaining: isPro ? null : FREE_LIMIT - generations,
      resetAt: isPro ? null : profile?.daily_generations_reset_at,
    });
  });
  ```

### Task 4: Limit Banner Component (AC: 2)
- [ ] 4.1 Create `components/ui/LimitBanner.tsx`:
  ```typescript
  interface LimitBannerProps {
    used: number;
    limit: number;
    resetAt?: string;
  }

  export function LimitBanner({ used, limit, resetAt }: LimitBannerProps) {
    const remaining = limit - used;
    const isLow = remaining <= 1;

    return (
      <View className={cn(
        'px-4 py-2 rounded-lg mb-4',
        isLow ? 'bg-orange-100 dark:bg-orange-900' : 'bg-amber-100 dark:bg-amber-900'
      )}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons
              name={isLow ? 'warning' : 'flash'}
              size={16}
              color={isLow ? '#EA580C' : '#F59E0B'}
            />
            <Text className={cn(
              'ml-2 text-sm font-medium',
              isLow ? 'text-orange-800 dark:text-orange-200' : 'text-amber-800 dark:text-amber-200'
            )}>
              {remaining} of {limit} generations left today
            </Text>
          </View>

          {remaining === 0 && (
            <TouchableOpacity
              onPress={() => router.push('/upgrade')}
              className="bg-amber-500 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm font-medium">Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View className="mt-2 h-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
          <View
            className={cn(
              'h-full rounded-full',
              isLow ? 'bg-orange-500' : 'bg-amber-500'
            )}
            style={{ width: `${(used / limit) * 100}%` }}
          />
        </View>
      </View>
    );
  }
  ```

### Task 5: Subscription Hook (AC: 2)
- [ ] 5.1 Create `hooks/useSubscription.ts`:
  ```typescript
  import { useQuery } from '@tanstack/react-query';
  import { getLimitStatus } from '@/services/api';

  export function useSubscription() {
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['subscription'],
      queryFn: getLimitStatus,
      staleTime: 60000, // 1 minute
    });

    return {
      tier: data?.tier || 'free',
      isPro: data?.tier === 'pro',
      used: data?.used || 0,
      limit: data?.limit || 3,
      remaining: data?.remaining ?? 3,
      resetAt: data?.resetAt,
      isLoading,
      refetch,
    };
  }
  ```

### Task 6: Integrate into Add Screen (AC: 2)
- [ ] 6.1 Update `app/(tabs)/index.tsx`:
  ```typescript
  import { LimitBanner } from '@/components/ui/LimitBanner';
  import { useSubscription } from '@/hooks/useSubscription';

  export default function AddScreen() {
    const { tier, used, limit, remaining, isPro } = useSubscription();

    return (
      <SafeAreaView>
        {/* Show limit banner for free users */}
        {!isPro && (
          <LimitBanner used={used} limit={limit} />
        )}

        <PasteInput ... />
        <VoiceSelector ... />

        <GenerateButton
          disabled={!isPro && remaining === 0}
          onPress={handleGenerate}
        />
      </SafeAreaView>
    );
  }
  ```

### Task 7: API Service Functions (AC: 2)
- [ ] 7.1 Add to `services/api.ts`:
  ```typescript
  export interface LimitStatus {
    tier: 'free' | 'pro';
    used: number;
    limit: number | null;
    remaining: number | null;
    resetAt: string | null;
  }

  export async function getLimitStatus(): Promise<LimitStatus> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/api/user/limit`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.json();
  }
  ```

### Task 8: Refresh Limit After Generation (AC: 1, 2)
- [ ] 8.1 Update generation flow to refresh limit:
  ```typescript
  const handleGenerate = async () => {
    try {
      const result = await generateAudio(url, voiceId);
      // Refresh limit status
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      // Navigate to player
      router.push(`/player/${result.audioId}`);
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        // Show upgrade prompt
        setShowLimitModal(true);
      } else {
        // Handle other errors
      }
    }
  };
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Rate limiting uses in-memory + database
- Daily reset at midnight UTC
- Free tier: 3 articles/day
- Pro tier: Unlimited

**Limit Check Flow:**
1. Check subscription tier
2. Check if reset needed (past midnight)
3. If free + at limit → reject with 429
4. After generation → increment counter

### Source Tree Components

```
apps/mobile/
├── app/(tabs)/
│   └── index.tsx            # Limit banner integration
├── components/ui/
│   └── LimitBanner.tsx      # Limit display
├── hooks/
│   └── useSubscription.ts   # Limit state
└── services/
    └── api.ts               # getLimitStatus

apps/api/
└── src/routes/
    ├── generate.ts          # Limit enforcement
    └── user.ts              # GET /user/limit
```

### Testing Standards

- Test free user at 0/3 → can generate
- Test free user at 3/3 → blocked with error
- Test midnight reset → counter resets
- Test pro user → no limits
- Test limit banner shows correct count
- Test generate button disabled at limit

### Key Technical Decisions

1. **Server-Side Enforcement:** Limits checked on server, not just UI
2. **Midnight UTC Reset:** Simple, predictable reset time
3. **3 Articles/Day:** Enough to experience value, low enough to convert
4. **Graceful UX:** Show remaining, don't just block

### Dependencies

- Story 1-1 must be completed (user_profiles exists)
- Story 3-2 must be completed (generation flow exists)

### References

- [Source: architecture-v2.md#Rate-Limiting]
- [Source: epics.md#Story-5.1-Free-Tier-Implementation]
- [Source: prd.md#FR39]
- [Source: ux-design-specification.md#Experience-Principles] (Graceful limits)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
