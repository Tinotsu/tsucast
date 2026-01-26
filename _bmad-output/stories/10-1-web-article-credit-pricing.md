# Story 10.1: Web Article Credit Pricing

Status: review

## Story

As a web user who wants to convert articles,
I want to purchase credit packs with clear food-themed pricing,
so that I pay only for what I use without a subscription commitment.

## Acceptance Criteria

1. **AC1: Credit Balance Display**
   - Given a logged-in user
   - When they view the dashboard or generate page
   - Then they see their credit balance prominently displayed
   - And optionally see banked time if > 0

2. **AC2: Pricing Page with Food-Themed Tiers**
   - Given user visits the upgrade/pricing page
   - When page loads
   - Then they see 5 credit pack options:
     - 🍬 Candy: 3 credits for $2.99
     - ☕ Coffee: 5 credits for $4.99 (recommended)
     - 🥙 Kebab: 10 credits for $8.99
     - 🍕 Pizza: 20 credits for $16.99
     - 🍱 Feast: 50 credits for $39.99
   - And key benefits displayed (no subscription, never expire)

3. **AC3: Credit Cost Preview Before Generation**
   - Given user enters an article URL
   - When article is analyzed
   - Then they see estimated audio duration
   - And they see credits required (1 credit per 20 min)
   - And if cached, shows "Free! Already available"

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
   - Then they see "Not enough credits" message
   - And are directed to purchase page
   - And generation is blocked

7. **AC7: Time Bank System**
   - Given user converts a 5-minute article (uses 1 credit = 20 min)
   - When generation completes
   - Then 15 minutes are added to their time bank
   - And next long article uses banked time first

## Tasks / Subtasks

### Task 1: Database Schema Updates (AC: 1, 5, 7)
- [ ] 1.1 Create migration for user_profiles credits fields:
  ```sql
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0;
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS time_bank_minutes INTEGER DEFAULT 0;
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits_purchased INTEGER DEFAULT 0;
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
  ```
- [ ] 1.2 Create credit_transactions table:
  ```sql
  CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund')),
    credits INTEGER NOT NULL,
    time_bank_delta INTEGER DEFAULT 0,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
  ```
- [ ] 1.3 Add RLS policies for credit_transactions

### Task 2: Credit Calculation Service (AC: 3, 5, 7)
- [ ] 2.1 Create `apps/api/src/services/credits.ts`:
  ```typescript
  const MIN_CHARGE = 3; // minutes
  const CREDIT_SIZE = 20; // minutes per credit

  export interface CreditCalculation {
    creditsNeeded: number;
    newTimeBank: number;
    estimatedDuration: number;
    isCached: boolean;
  }

  export function calculateCreditsNeeded(
    durationMinutes: number,
    currentTimeBank: number
  ): { creditsNeeded: number; newTimeBank: number } {
    const effectiveDuration = Math.max(durationMinutes, MIN_CHARGE);
    const netDuration = effectiveDuration - currentTimeBank;

    if (netDuration <= 0) {
      return {
        creditsNeeded: 0,
        newTimeBank: currentTimeBank - effectiveDuration
      };
    }

    const creditsNeeded = Math.ceil(netDuration / CREDIT_SIZE);
    const timeProvided = creditsNeeded * CREDIT_SIZE;
    const newTimeBank = timeProvided - netDuration;

    return { creditsNeeded, newTimeBank };
  }

  export async function previewCreditCost(
    userId: string,
    url: string,
    voiceId: string
  ): Promise<CreditCalculation> {
    // Check cache first
    // Estimate duration from word count
    // Calculate credits with user's time bank
  }

  export async function deductCredits(
    userId: string,
    durationMinutes: number,
    audioId: string,
    description: string
  ): Promise<void> {
    // Calculate credits needed
    // Verify sufficient balance
    // Update user_profiles
    // Record transaction
  }
  ```

### Task 3: API Endpoints (AC: 1, 3, 5, 6)
- [ ] 3.1 Create `GET /api/user/credits` endpoint:
  ```typescript
  // Returns: { credits: number, timeBank: number, totalPurchased: number, totalUsed: number }
  ```
- [ ] 3.2 Create `POST /api/generate/preview` endpoint:
  ```typescript
  // Input: { url: string, voiceId?: string }
  // Returns: {
  //   isCached: boolean,
  //   estimatedMinutes: number,
  //   creditsNeeded: number,
  //   currentCredits: number,
  //   hasSufficientCredits: boolean
  // }
  ```
- [ ] 3.3 Update `POST /api/generate` to deduct credits:
  - Check cache first (no deduction if cached)
  - Verify sufficient credits before generation
  - Deduct after successful generation
  - Return updated balance in response

### Task 4: Stripe Integration for Credit Purchases (AC: 2)
- [ ] 4.1 Set up Stripe products for each tier:
  ```
  tsucast_credits_candy (3 credits, $2.99)
  tsucast_credits_coffee (5 credits, $4.99)
  tsucast_credits_kebab (10 credits, $8.99)
  tsucast_credits_pizza (20 credits, $16.99)
  tsucast_credits_feast (50 credits, $39.99)
  ```
- [ ] 4.2 Create `POST /api/checkout/credits` endpoint:
  ```typescript
  // Input: { tier: 'candy' | 'coffee' | 'kebab' | 'pizza' | 'feast' }
  // Returns: { checkoutUrl: string }
  ```
- [ ] 4.3 Create `POST /api/webhooks/stripe` for successful purchases:
  - Add credits to user balance
  - Record purchase transaction
  - Send confirmation email (optional)

### Task 5: Update Upgrade Page UI (AC: 2)
- [ ] 5.1 Replace subscription UI with credit pack grid:
  ```tsx
  const CREDIT_PACKS = [
    { id: 'candy', emoji: '🍬', name: 'Candy', credits: 3, price: 2.99 },
    { id: 'coffee', emoji: '☕', name: 'Coffee', credits: 5, price: 4.99, recommended: true },
    { id: 'kebab', emoji: '🥙', name: 'Kebab', credits: 10, price: 8.99 },
    { id: 'pizza', emoji: '🍕', name: 'Pizza', credits: 20, price: 16.99 },
    { id: 'feast', emoji: '🍱', name: 'Feast', credits: 50, price: 39.99, best: true },
  ];
  ```
- [ ] 5.2 Show current credit balance at top
- [ ] 5.3 Add benefits section:
  - ♾️ Credits never expire
  - 💸 No subscription
  - 📖 Short articles? Leftover time banks for later
  - 💰 7-day money back guarantee

### Task 6: Credit Balance Component (AC: 1)
- [ ] 6.1 Create `components/CreditBalance.tsx`:
  ```tsx
  export function CreditBalance({ credits, timeBank }: { credits: number; timeBank: number }) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">🎫 {credits} credits</span>
        {timeBank > 0 && (
          <span className="text-sm text-zinc-400">+{timeBank}min banked</span>
        )}
      </div>
    );
  }
  ```
- [ ] 6.2 Add to dashboard header
- [ ] 6.3 Add to generate page

### Task 7: Generate Page Credit Preview (AC: 3, 4, 6)
- [ ] 7.1 Update generate page to show credit cost:
  - After URL validation, call `/api/generate/preview`
  - Show estimated duration and credits needed
  - If cached: "✨ Free! Already available"
  - If not enough credits: "Buy credits to continue"
- [ ] 7.2 Update submit button states:
  - "Convert (1 credit)" when ready
  - "Play now" when cached
  - "Buy credits" when insufficient

### Task 8: Post-Purchase Success Flow (AC: 2)
- [ ] 8.1 Create success page `/app/(app)/credits/success/page.tsx`:
  - Show confetti animation
  - Display new balance
  - Link to generate page
- [ ] 8.2 Handle Stripe redirect with session_id param

### Task 9: Update useAuth Hook (AC: 1)
- [ ] 9.1 Add credits fields to profile type:
  ```typescript
  interface Profile {
    // ... existing fields
    credits_balance: number;
    time_bank_minutes: number;
  }
  ```
- [ ] 9.2 Create `useCredits` hook:
  ```typescript
  export function useCredits() {
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['credits'],
      queryFn: () => fetchApi('/api/user/credits'),
    });
    return {
      credits: data?.credits ?? 0,
      timeBank: data?.timeBank ?? 0,
      isLoading,
      refetch
    };
  }
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From pricing-specification.md:**
- 1 credit = 1 article (up to 20 min of audio)
- Time bank system for short article rollover
- 3-minute minimum charge per article
- Smart caching: no cost if already generated
- Credits never expire

**Credit Calculation:**
```
For each article:
  1. Check if cached → free
  2. Estimate duration from word count (÷150)
  3. Apply 3-min minimum
  4. Subtract time bank
  5. Calculate: ceil(net_duration / 20)
  6. Update time bank: (credits × 20) - net_duration
```

### Source Tree Components

```
apps/web/
├── app/
│   ├── (app)/
│   │   ├── upgrade/page.tsx       # Credit purchase page (UPDATE)
│   │   ├── generate/page.tsx      # Add credit preview (UPDATE)
│   │   ├── dashboard/page.tsx     # Add credit balance (UPDATE)
│   │   └── credits/
│   │       └── success/page.tsx   # Purchase success (NEW)
│   └── api/                       # Route handlers if needed
├── components/
│   └── CreditBalance.tsx          # Balance display (NEW)
├── hooks/
│   └── useCredits.ts              # Credit state hook (NEW)
└── lib/
    └── api.ts                     # Add credit endpoints (UPDATE)

apps/api/
└── src/
    ├── routes/
    │   ├── user.ts                # Add /credits endpoint (UPDATE)
    │   ├── generate.ts            # Add credit deduction (UPDATE)
    │   ├── checkout.ts            # Stripe checkout (NEW)
    │   └── webhooks.ts            # Add Stripe webhook (UPDATE)
    └── services/
        └── credits.ts             # Credit calculation (NEW)

supabase/
└── migrations/
    └── 20260124_add_credits.sql   # Schema changes (NEW)
```

### Testing Standards

- Unit test credit calculation function with edge cases:
  - 0 duration (shouldn't happen, but test)
  - Exactly 20 minutes (1 credit, 0 bank)
  - 5 minutes (1 credit, 15 bank)
  - 35 minutes (2 credits, 5 bank)
  - With existing time bank
- Integration test Stripe webhook
- E2E test: purchase → credits visible → generate → balance updates

### Key Technical Decisions

1. **Stripe over RevenueCat for Web:** RevenueCat is mobile-focused; Stripe is standard for web payments
2. **Immediate Credit Update:** Use optimistic UI + refetch to show new balance instantly
3. **Time Bank in DB:** Store time bank alongside credits for consistency across sessions
4. **Transaction Log:** Record all credit changes for audit and potential refunds

### Environment Variables

```bash
# apps/api/.env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# apps/web/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Dependencies

- Stripe SDK: `stripe` (server), `@stripe/stripe-js` (client)
- No new mobile changes needed for this story

### References

- [Source: pricing-specification.md] (Full pricing model)
- [Source: architecture-v2.md#Payment-Flow]
- [Source: project-context.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-24 | Story created | Claude Opus 4.5 |
| 2026-01-24 | Implementation complete | Claude Opus 4.5 |

### File List

**New Files:**
- `supabase/migrations/006_credits.sql` - Database migration for credits schema
- `apps/api/src/services/credits.ts` - Credit calculation and management service
- `apps/api/src/routes/checkout.ts` - Stripe checkout endpoints
- `apps/web/hooks/useCredits.ts` - React Query hook for credit balance
- `apps/web/components/CreditBalance.tsx` - Credit balance display component
- `apps/web/app/(app)/credits/success/page.tsx` - Purchase success page

**Modified Files:**
- `apps/api/src/routes/user.ts` - Added /credits endpoint
- `apps/api/src/routes/generate.ts` - Added /preview endpoint, credit deduction logic
- `apps/api/src/routes/webhooks.ts` - Added Stripe webhook handler
- `apps/api/src/index.ts` - Registered checkout routes
- `apps/api/.env.example` - Added Stripe environment variables
- `apps/api/package.json` - Added stripe dependency
- `apps/web/lib/api.ts` - Added credit-related API functions
- `apps/web/app/(app)/upgrade/page.tsx` - New food-themed credit pack UI
- `apps/web/app/(app)/generate/page.tsx` - Added credit preview and balance display
