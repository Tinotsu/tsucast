# Story 10.2: Mobile Article Credit Pricing

Status: ready-for-dev

## Story

As a mobile user who wants to convert articles,
I want to purchase credit packs with clear food-themed pricing,
So that I pay only for what I use without a subscription commitment.

## Acceptance Criteria

1. **AC1: Credit Balance Display**
   - Given a logged-in user
   - When they view the Add screen
   - Then they see their credit balance prominently displayed (replacing the limit banner)
   - And optionally see banked time if > 0

2. **AC2: Credit Pack Purchases (IAP)**
   - Given user taps "Buy Credits" or is prompted to upgrade
   - When the purchase sheet loads
   - Then they see 5 credit pack options (consumable IAP):
     - 🍬 Candy: 3 credits for $2.99
     - ☕ Coffee: 5 credits for $4.99 (recommended)
     - 🥙 Kebab: 10 credits for $8.99
     - 🍕 Pizza: 20 credits for $16.99
     - 🍱 Feast: 50 credits for $39.99
   - And key benefits displayed (no subscription, never expire)

3. **AC3: Credit Cost Preview Before Generation**
   - Given user enters an article URL
   - When article is analyzed (cache check complete)
   - Then they see estimated audio duration
   - And they see credits required (1 credit per 20 min)
   - And if cached, shows "Free! Already available" with play button

4. **AC4: Smart Caching (Free if Cached)**
   - Given an article was previously generated
   - When same URL + same voice requested
   - Then no credits are deducted
   - And user sees "Cached - No credits needed"

5. **AC5: Credit Deduction on Generation**
   - Given user has sufficient credits
   - When they generate a new article
   - Then credits are deducted based on audio duration
   - And time bank is updated (leftover time saved)
   - And balance refreshes immediately

6. **AC6: Insufficient Credits Handling**
   - Given user has 0 credits
   - When they try to generate
   - Then they see "Not enough credits" modal
   - And are offered credit pack purchase options
   - And generation is blocked until credits purchased

7. **AC7: Time Bank System**
   - Given user converts a 5-minute article (uses 1 credit = 20 min)
   - When generation completes
   - Then 15 minutes are added to their time bank
   - And next long article uses banked time first

8. **AC8: Replace Subscription UI**
   - Given user navigates to upgrade screen
   - When page loads
   - Then they see credit packs (not subscription)
   - And existing subscription users see "Unlimited" badge (grandfathered)

## Tasks / Subtasks

### Task 1: RevenueCat Consumable Products Setup (AC: 2)
- [ ] 1.1 Configure consumable products in RevenueCat dashboard:
  ```
  tsucast_credits_candy (3 credits, $2.99)
  tsucast_credits_coffee (5 credits, $4.99)
  tsucast_credits_kebab (10 credits, $8.99)
  tsucast_credits_pizza (20 credits, $16.99)
  tsucast_credits_feast (50 credits, $39.99)
  ```
- [ ] 1.2 Configure App Store Connect consumable IAP products
- [ ] 1.3 Configure Google Play Console consumable products
- [ ] 1.4 Link products in RevenueCat with store products

### Task 2: Mobile Credits Hook (AC: 1, 5, 7)
- [ ] 2.1 Create `hooks/useCredits.ts`:
  ```typescript
  import { useQuery, useQueryClient } from '@tanstack/react-query';
  import { getCredits } from '@/services/api';

  export function useCredits() {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
      queryKey: ['credits'],
      queryFn: getCredits,
      staleTime: 30000,
    });

    const invalidate = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    }, [queryClient]);

    return {
      credits: data?.credits ?? 0,
      timeBank: data?.timeBank ?? 0,
      isLoading,
      error,
      refetch,
      invalidate,
    };
  }
  ```
- [ ] 2.2 Add `getCredits()` function to `services/api.ts`:
  ```typescript
  export async function getCredits(): Promise<{
    credits: number;
    timeBank: number;
  }> {
    return authFetch('/api/user/credits');
  }
  ```

### Task 3: Credit Balance Component (AC: 1)
- [ ] 3.1 Create `components/ui/CreditBalance.tsx`:
  ```tsx
  interface CreditBalanceProps {
    credits: number;
    timeBank: number;
    onBuyPress: () => void;
  }

  export function CreditBalance({ credits, timeBank, onBuyPress }: CreditBalanceProps) {
    return (
      <View className="flex-row items-center justify-between bg-zinc-900 rounded-xl p-4 mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl">🎫</Text>
          <View>
            <Text className="text-lg font-semibold text-white">{credits} credits</Text>
            {timeBank > 0 && (
              <Text className="text-sm text-zinc-400">+{timeBank}min banked</Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={onBuyPress}
          className="bg-amber-600 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Buy More</Text>
        </Pressable>
      </View>
    );
  }
  ```
- [ ] 3.2 Replace `LimitBanner` with `CreditBalance` in Add screen

### Task 4: Credit Preview Component (AC: 3, 4)
- [ ] 4.1 Create `components/add/CreditPreview.tsx`:
  ```tsx
  interface CreditPreviewProps {
    estimatedMinutes: number;
    creditsNeeded: number;
    isCached: boolean;
    hasEnoughCredits: boolean;
  }

  export function CreditPreview({
    estimatedMinutes,
    creditsNeeded,
    isCached,
    hasEnoughCredits,
  }: CreditPreviewProps) {
    if (isCached) {
      return (
        <View className="flex-row items-center gap-2 bg-green-900/30 rounded-lg p-3">
          <Text className="text-green-400">✨ Free! Already available</Text>
        </View>
      );
    }

    return (
      <View className="bg-zinc-900 rounded-lg p-3">
        <View className="flex-row justify-between">
          <Text className="text-zinc-400">Est. duration:</Text>
          <Text className="text-white">{estimatedMinutes} min</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-zinc-400">Credits needed:</Text>
          <Text className={hasEnoughCredits ? 'text-white' : 'text-red-400'}>
            {creditsNeeded} credit{creditsNeeded !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  }
  ```
- [ ] 4.2 Add preview API call to `services/api.ts`:
  ```typescript
  export async function previewGeneration(url: string, voiceId?: string): Promise<{
    isCached: boolean;
    estimatedMinutes: number;
    creditsNeeded: number;
    currentCredits: number;
    hasSufficientCredits: boolean;
  }> {
    return authFetch('/api/generate/preview', {
      method: 'POST',
      body: JSON.stringify({ url, voiceId }),
    });
  }
  ```
- [ ] 4.3 Integrate preview into Add screen after URL validation

### Task 5: Update Add Screen (AC: 1, 3, 6)
- [ ] 5.1 Import and use `useCredits` hook
- [ ] 5.2 Replace `LimitBanner` with `CreditBalance`
- [ ] 5.3 Add `CreditPreview` component after URL validation
- [ ] 5.4 Update state machine to include preview step:
  ```typescript
  type AddScreenState =
    | { status: 'idle' }
    | { status: 'validating' }
    | { status: 'invalid'; error: string }
    | { status: 'checking_cache' }
    | { status: 'previewing' }  // NEW
    | { status: 'cached'; audioUrl: string; title: string; duration?: number }
    | { status: 'ready_to_generate'; normalizedUrl: string; urlHash: string;
        estimatedMinutes: number; creditsNeeded: number };  // UPDATED
  ```
- [ ] 5.5 Update `GenerateButton` to show credit cost:
  - "Convert (1 credit)" when ready
  - "Play now" when cached
  - "Buy credits" when insufficient

### Task 6: Credit Purchase Flow (AC: 2)
- [ ] 6.1 Update `services/purchases.ts` to support consumables:
  ```typescript
  // Credit pack identifiers
  export const CREDIT_PACKS = [
    { id: 'candy', productId: 'tsucast_credits_candy', credits: 3, emoji: '🍬' },
    { id: 'coffee', productId: 'tsucast_credits_coffee', credits: 5, emoji: '☕', recommended: true },
    { id: 'kebab', productId: 'tsucast_credits_kebab', credits: 10, emoji: '🥙' },
    { id: 'pizza', productId: 'tsucast_credits_pizza', credits: 20, emoji: '🍕' },
    { id: 'feast', productId: 'tsucast_credits_feast', credits: 50, emoji: '🍱', best: true },
  ] as const;

  export async function purchaseCreditPack(packId: string): Promise<{
    success: boolean;
    credits?: number;
    error?: string;
  }> {
    // Purchase consumable via RevenueCat
    // On success, call API to add credits to user account
  }
  ```
- [ ] 6.2 Create webhook handler for consumable purchases in API

### Task 7: Credit Purchase Modal (AC: 2, 6)
- [ ] 7.1 Create `components/ui/CreditPurchaseModal.tsx`:
  ```tsx
  const CREDIT_PACKS = [
    { id: 'candy', emoji: '🍬', name: 'Candy', credits: 3, price: '$2.99' },
    { id: 'coffee', emoji: '☕', name: 'Coffee', credits: 5, price: '$4.99', recommended: true },
    { id: 'kebab', emoji: '🥙', name: 'Kebab', credits: 10, price: '$8.99' },
    { id: 'pizza', emoji: '🍕', name: 'Pizza', credits: 20, price: '$16.99' },
    { id: 'feast', emoji: '🍱', name: 'Feast', credits: 50, price: '$39.99', best: true },
  ];

  export function CreditPurchaseModal({
    visible,
    onClose,
    onPurchase,
  }: CreditPurchaseModalProps) {
    // Modal with credit pack grid
    // Benefits section: ♾️ Never expire, 💸 No subscription, 📖 Time banking
  }
  ```
- [ ] 7.2 Replace `LimitModal` usage with `CreditPurchaseModal`

### Task 8: Update Upgrade Screen (AC: 8)
- [ ] 8.1 Update `app/upgrade.tsx` to show credit packs:
  - Grid layout for credit pack options
  - Current balance display at top
  - Benefits section
  - Handle existing Pro subscribers (show "Unlimited" badge)
- [ ] 8.2 Add purchase handling with loading states
- [ ] 8.3 Add success animation/feedback after purchase

### Task 9: Update Generation Flow (AC: 5)
- [ ] 9.1 Update generation endpoint call to handle credit deduction response
- [ ] 9.2 Refresh credits after successful generation
- [ ] 9.3 Handle "insufficient credits" error from API gracefully

### Task 10: Backward Compatibility (AC: 8)
- [ ] 10.1 Detect existing Pro subscribers:
  ```typescript
  // Check if user has active subscription entitlement
  const hasProSubscription = customerInfo?.entitlements.active['Tsucast Pro'];

  // Pro subscribers get unlimited (grandfathered)
  if (hasProSubscription) {
    return { credits: Infinity, timeBank: 0 };
  }
  ```
- [ ] 10.2 Show "Unlimited" badge for Pro subscribers
- [ ] 10.3 Skip credit checks for Pro subscribers

### Task 11: Unit Tests (AC: All)
- [ ] 11.1 Test credit calculation logic:
  - 0 duration edge case
  - Exactly 20 minutes (1 credit, 0 bank)
  - 5 minutes (1 credit, 15 bank)
  - 35 minutes (2 credits, 5 bank)
  - With existing time bank
- [ ] 11.2 Test `useCredits` hook
- [ ] 11.3 Test `CreditBalance` component
- [ ] 11.4 Test `CreditPreview` component
- [ ] 11.5 Test purchase flow

## Dev Notes

### Architecture Patterns & Constraints

**From pricing-specification.md (via Story 10-1):**
- 1 credit = 1 article (up to 20 min of audio)
- Time bank system for short article rollover
- 3-minute minimum charge per article
- Smart caching: no cost if already generated
- Credits never expire

**Credit Calculation (same as web):**
```
For each article:
  1. Check if cached → free
  2. Estimate duration from word count (÷150)
  3. Apply 3-min minimum
  4. Subtract time bank
  5. Calculate: ceil(net_duration / 20)
  6. Update time bank: (credits × 20) - net_duration
```

**RevenueCat Consumables:**
- Products must be configured as "Consumable" type in RevenueCat
- Each purchase triggers webhook to API to add credits
- Credits stored in `user_profiles.credits_balance` (same as web)

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   └── index.tsx              # Add screen (UPDATE)
│   └── upgrade.tsx                # Credit purchase page (UPDATE)
├── components/
│   ├── add/
│   │   └── CreditPreview.tsx      # Credit cost preview (NEW)
│   └── ui/
│       ├── CreditBalance.tsx      # Balance display (NEW)
│       └── CreditPurchaseModal.tsx # Purchase modal (NEW)
├── hooks/
│   └── useCredits.ts              # Credit state hook (NEW)
└── services/
    ├── api.ts                     # Add credit endpoints (UPDATE)
    └── purchases.ts               # Add consumable support (UPDATE)

apps/api/
└── src/
    └── routes/
        └── webhooks.ts            # Handle consumable webhook (UPDATE)
```

### Key Technical Decisions

1. **RevenueCat for consumables:** Keeps all IAP logic in one place, handles receipt validation
2. **Shared credit backend:** Mobile uses same `/api/user/credits` and `/api/generate` as web
3. **Grandfathered subscriptions:** Existing Pro users keep unlimited access
4. **Optimistic UI:** Show credit deduction immediately, revert on error

### Dependencies

- Story 10-1 must be complete (credit system backend in place)
- RevenueCat dashboard must have consumable products configured
- App Store Connect / Play Console products created

### Migration Considerations

- Existing free users: Start with 0 credits (same as before, no regression)
- Existing Pro subscribers: Grandfathered with unlimited access
- Daily limits removed: Credits replace daily generation limits

### Testing Standards

- Unit test credit calculation with edge cases
- Integration test purchase flow in sandbox mode
- E2E test: purchase → credits visible → generate → balance updates
- Test backward compatibility with Pro subscribers

### References

- [Source: Story 10-1 Web Article Credit Pricing]
- [Source: pricing-specification.md]
- [Source: project-context.md]
- [RevenueCat Consumables Docs](https://www.revenuecat.com/docs/consumables)

## Definition of Done

- [ ] Credit balance displays on Add screen
- [ ] Credit preview shows before generation
- [ ] Credit pack purchase works via IAP
- [ ] Credits deducted on generation
- [ ] Time bank accumulates and applies
- [ ] Cached content is free
- [ ] Insufficient credits blocks generation with purchase prompt
- [ ] Existing Pro subscribers have unlimited access
- [ ] All unit tests pass
- [ ] No TypeScript errors
- [ ] App runs without deprecation warnings
