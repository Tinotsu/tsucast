# Story 5.2: Limit Display & Upgrade Prompt

Status: ready-for-dev

## Story

As a free user who hit the limit,
I want clear feedback and upgrade path,
so that I can continue using tsucast if I choose.

## Acceptance Criteria

1. **AC1: Limit Reached Message**
   - Given free user hits daily limit
   - When they try to generate
   - Then they see: "You've reached your daily limit"
   - And see "Upgrade for unlimited" button
   - And see "Come back tomorrow" option

2. **AC2: Upgrade Navigation**
   - Given limit message is shown
   - When user taps upgrade
   - Then they're taken to subscription screen

3. **AC3: Non-Blocking**
   - Given limit message is shown
   - When user dismisses it
   - Then they can continue using library and player
   - And are not blocked from other features

## Tasks / Subtasks

### Task 1: Limit Modal Component (AC: 1, 3)
- [ ] 1.1 Create `components/ui/LimitModal.tsx`:
  ```typescript
  interface LimitModalProps {
    visible: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    resetAt?: string;
  }

  export function LimitModal({ visible, onClose, onUpgrade, resetAt }: LimitModalProps) {
    const timeUntilReset = resetAt
      ? formatDistanceToNow(new Date(resetAt), { addSuffix: true })
      : 'tomorrow';

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            {/* Illustration */}
            <View className="items-center mb-4">
              <View className="w-20 h-20 bg-amber-100 dark:bg-amber-900 rounded-full items-center justify-center">
                <Ionicons name="sparkles" size={40} color="#F59E0B" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-amber-900 dark:text-amber-100 text-center">
              You've used all your free articles today
            </Text>

            {/* Description */}
            <Text className="mt-3 text-amber-700 dark:text-amber-300 text-center">
              Upgrade to Pro for unlimited articles, or your limit resets {timeUntilReset}.
            </Text>

            {/* Buttons */}
            <View className="mt-6 gap-3">
              <TouchableOpacity
                onPress={onUpgrade}
                className="bg-amber-500 py-4 rounded-xl"
              >
                <Text className="text-white font-bold text-center text-lg">
                  Upgrade for Unlimited
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="py-3"
              >
                <Text className="text-amber-600 dark:text-amber-400 text-center">
                  Come back tomorrow
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pro benefits */}
            <View className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-800">
              <Text className="text-sm text-amber-700 dark:text-amber-300 text-center mb-2">
                Pro includes:
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {['Unlimited articles', 'All voices', 'Priority support'].map((benefit) => (
                  <View key={benefit} className="flex-row items-center bg-amber-50 dark:bg-amber-900/50 px-2 py-1 rounded-full">
                    <Ionicons name="checkmark" size={12} color="#F59E0B" />
                    <Text className="text-xs text-amber-700 dark:text-amber-300 ml-1">
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  ```

### Task 2: Upgrade Screen Placeholder (AC: 2)
- [ ] 2.1 Create `app/upgrade.tsx` placeholder:
  ```typescript
  export default function UpgradeScreen() {
    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
        <Stack.Screen options={{ title: 'Upgrade to Pro' }} />

        <ScrollView className="flex-1 p-6">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              Unlock Unlimited Listening
            </Text>
            <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
              Turn any article into a podcast, anytime
            </Text>
          </View>

          {/* Plan Card */}
          <View className="bg-amber-100 dark:bg-amber-900 rounded-2xl p-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Pro
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  $9.99
                </Text>
                <Text className="text-amber-700 dark:text-amber-300">/month</Text>
              </View>
            </View>

            {/* Benefits */}
            {[
              'Unlimited article conversions',
              'All premium voices',
              'Priority processing',
              'Early access to new features',
            ].map((benefit) => (
              <View key={benefit} className="flex-row items-center py-2">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="ml-3 text-amber-900 dark:text-amber-100">
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Subscribe Button (placeholder for Story 5.3) */}
          <TouchableOpacity
            className="bg-amber-500 py-4 rounded-xl"
            disabled
          >
            <Text className="text-white font-bold text-center text-lg">
              Coming Soon
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text className="mt-4 text-xs text-amber-500 text-center">
            Subscription billed monthly. Cancel anytime.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }
  ```

### Task 3: Integrate Modal in Add Screen (AC: 1, 2, 3)
- [ ] 3.1 Update `app/(tabs)/index.tsx`:
  ```typescript
  import { LimitModal } from '@/components/ui/LimitModal';

  export default function AddScreen() {
    const { remaining, resetAt } = useSubscription();
    const [showLimitModal, setShowLimitModal] = useState(false);

    const handleGenerate = async () => {
      // Check limit before attempting
      if (remaining === 0) {
        setShowLimitModal(true);
        return;
      }

      try {
        const result = await generateAudio(url, voiceId);
        router.push(`/player/${result.audioId}`);
      } catch (error) {
        if (error.code === 'RATE_LIMITED') {
          setShowLimitModal(true);
        } else {
          // Handle other errors
          setError(error.message);
        }
      }
    };

    return (
      <SafeAreaView>
        {/* ... Add screen content */}

        <LimitModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          onUpgrade={() => {
            setShowLimitModal(false);
            router.push('/upgrade');
          }}
          resetAt={resetAt}
        />
      </SafeAreaView>
    );
  }
  ```

### Task 4: Upgrade Hook (AC: 2)
- [ ] 4.1 Update `hooks/useSubscription.ts` with upgrade navigation:
  ```typescript
  export function useSubscription() {
    // ... existing code

    const showUpgradePrompt = () => {
      router.push('/upgrade');
    };

    const checkAndPromptLimit = (): boolean => {
      if (tier === 'free' && remaining === 0) {
        return true; // Show limit modal
      }
      return false;
    };

    return {
      // ... existing returns
      showUpgradePrompt,
      checkAndPromptLimit,
    };
  }
  ```

### Task 5: Soft Upgrade Prompts (AC: 1)
- [ ] 5.1 Create `components/ui/UpgradeBanner.tsx` for gentle prompts:
  ```typescript
  interface UpgradeBannerProps {
    message?: string;
  }

  export function UpgradeBanner({ message }: UpgradeBannerProps) {
    return (
      <TouchableOpacity
        onPress={() => router.push('/upgrade')}
        className="mx-4 mb-4 p-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl flex-row items-center"
      >
        <View className="flex-1">
          <Text className="text-white font-bold">
            {message || 'Enjoying tsucast?'}
          </Text>
          <Text className="text-white/80 text-sm">
            Upgrade for unlimited articles
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    );
  }
  ```
- [ ] 5.2 Show banner occasionally in library for free users

### Task 6: Time Until Reset Display (AC: 1)
- [ ] 6.1 Install date-fns for time formatting:
  ```bash
  npm install date-fns
  ```
- [ ] 6.2 Add time calculation utility:
  ```typescript
  import { formatDistanceToNow, differenceInHours } from 'date-fns';

  export function formatResetTime(resetAt: string): string {
    const resetDate = new Date(resetAt);
    const hoursUntil = differenceInHours(resetDate, new Date());

    if (hoursUntil < 1) {
      return 'in less than an hour';
    }

    return formatDistanceToNow(resetDate, { addSuffix: true });
  }
  ```

### Task 7: Analytics Tracking (AC: 1, 2)
- [ ] 7.1 Track limit events for conversion optimization:
  ```typescript
  // In limit modal
  useEffect(() => {
    if (visible) {
      analytics.track('limit_modal_shown', {
        used: subscription.used,
        tier: subscription.tier,
      });
    }
  }, [visible]);

  const handleUpgradeClick = () => {
    analytics.track('upgrade_clicked', {
      source: 'limit_modal',
    });
    onUpgrade();
  };
  ```
- [ ] 7.2 Use Expo's built-in analytics or configure custom

## Dev Notes

### Architecture Patterns & Constraints

**From UX Design Specification:**
- Graceful limits (invitation, not wall)
- Users can dismiss and continue using other features
- Upgrade feels like a gift, not punishment

**Modal Design Principles:**
- Clear, friendly messaging
- Easy to dismiss
- Shows value of upgrading
- Shows time until reset

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── (tabs)/index.tsx    # Modal integration
│   └── upgrade.tsx         # Upgrade screen
├── components/ui/
│   ├── LimitModal.tsx      # Limit reached modal
│   └── UpgradeBanner.tsx   # Gentle upgrade prompt
└── hooks/
    └── useSubscription.ts  # Upgrade helpers
```

### Testing Standards

- Test modal appears at limit
- Test "Come back tomorrow" dismisses modal
- Test "Upgrade" navigates to upgrade screen
- Test dismiss → can use library and player
- Test time until reset displays correctly
- Test banner shows for free users occasionally

### Key Technical Decisions

1. **Modal Pattern:** Non-blocking, dismissible
2. **Friendly Copy:** "Come back tomorrow" not "Buy now"
3. **Value Focus:** Show benefits, not just restrict
4. **Time Display:** Show when limit resets

### Dependencies

- Story 5-1 must be completed (limits exist)

### References

- [Source: ux-design-specification.md#Desired-Emotional-Response]
- [Source: ux-design-specification.md#Experience-Principles]
- [Source: epics.md#Story-5.2-Limit-Display-Upgrade-Prompt]
- [Source: prd.md#FR40-FR41]

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
