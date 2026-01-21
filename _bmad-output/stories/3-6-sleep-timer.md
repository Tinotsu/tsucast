# Story 3.6: Sleep Timer

Status: done

## Story

As a user listening before bed,
I want to set a sleep timer,
so that audio stops automatically and I can fall asleep.

## Acceptance Criteria

1. **AC1: Timer Options**
   - Given user is on player screen
   - When they tap sleep timer button
   - Then they see options: 15 min, 30 min, 45 min, 1 hour, End of article

2. **AC2: Timer Activation**
   - Given user selects a timer
   - When timer is set
   - Then countdown begins
   - And timer indicator appears on player

3. **AC3: Timer Completion**
   - Given timer reaches zero
   - When countdown completes
   - Then audio pauses
   - And timer indicator disappears

4. **AC4: Timer Cancellation**
   - Given user wants to cancel timer
   - When they tap timer again and select "Off"
   - Then timer is cancelled

## Tasks / Subtasks

### Task 1: Sleep Timer Component (AC: 1, 4)
- [ ] 1.1 Create `components/player/SleepTimer.tsx`:
  ```typescript
  const TIMER_OPTIONS = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hour', minutes: 60 },
    { label: 'End of article', minutes: -1 }, // Special value
    { label: 'Off', minutes: 0 },
  ];

  interface SleepTimerProps {
    remainingSeconds: number | null;
    onSetTimer: (minutes: number) => void;
    onCancelTimer: () => void;
  }

  export function SleepTimer({
    remainingSeconds,
    onSetTimer,
    onCancelTimer
  }: SleepTimerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isActive = remainingSeconds !== null && remainingSeconds > 0;

    const formatRemaining = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <View>
        {/* Timer Button */}
        <TouchableOpacity
          onPress={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <Ionicons
            name={isActive ? 'moon' : 'moon-outline'}
            size={24}
            color={isActive ? '#F59E0B' : '#92400E'}
          />
          {isActive && (
            <View className="absolute -top-1 -right-1 bg-amber-500 rounded-full px-1">
              <Text className="text-[10px] text-white font-bold">
                {Math.ceil(remainingSeconds! / 60)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Timer Options */}
        {isOpen && (
          <View className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 min-w-32">
            {TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => {
                  if (option.minutes === 0) {
                    onCancelTimer();
                  } else {
                    onSetTimer(option.minutes);
                  }
                  setIsOpen(false);
                }}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-800 dark:text-gray-200">
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
  ```

### Task 2: Sleep Timer Hook (AC: 2, 3, 4)
- [ ] 2.1 Create `hooks/useSleepTimer.ts`:
  ```typescript
  import TrackPlayer, { Event } from 'react-native-track-player';
  import { usePlayerStore } from '@/stores/playerStore';

  export function useSleepTimer() {
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [endOfArticle, setEndOfArticle] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Countdown timer
    useEffect(() => {
      if (remainingSeconds === null || remainingSeconds <= 0) {
        return;
      }

      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === null || prev <= 1) {
            // Timer complete
            TrackPlayer.pause();
            clearInterval(timerRef.current!);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [remainingSeconds]);

    // End of article handler
    useEffect(() => {
      if (!endOfArticle) return;

      const subscription = TrackPlayer.addEventListener(
        Event.PlaybackQueueEnded,
        () => {
          TrackPlayer.pause();
          setEndOfArticle(false);
        }
      );

      return () => subscription.remove();
    }, [endOfArticle]);

    const setTimer = (minutes: number) => {
      // Cancel any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (minutes === -1) {
        // End of article
        setEndOfArticle(true);
        setRemainingSeconds(null);
      } else {
        setEndOfArticle(false);
        setRemainingSeconds(minutes * 60);
      }
    };

    const cancelTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRemainingSeconds(null);
      setEndOfArticle(false);
    };

    return {
      remainingSeconds,
      endOfArticle,
      setTimer,
      cancelTimer,
      isActive: remainingSeconds !== null || endOfArticle,
    };
  }
  ```

### Task 3: Integrate into Player Screen (AC: all)
- [ ] 3.1 Update `app/player/[id].tsx`:
  ```typescript
  import { SleepTimer } from '@/components/player/SleepTimer';
  import { useSleepTimer } from '@/hooks/useSleepTimer';

  export default function PlayerScreen() {
    const { remainingSeconds, setTimer, cancelTimer, endOfArticle } = useSleepTimer();
    // ... other hooks

    return (
      <SafeAreaView>
        {/* ... album art, title, progress */}

        {/* Controls Row */}
        <View className="flex-row items-center justify-between px-8">
          <SpeedControl ... />

          <View className="flex-row items-center gap-8">
            <SkipButton ... />
            <PlayButton ... />
            <SkipButton ... />
          </View>

          <SleepTimer
            remainingSeconds={remainingSeconds}
            onSetTimer={setTimer}
            onCancelTimer={cancelTimer}
          />
        </View>

        {/* Active Timer Indicator */}
        {(remainingSeconds || endOfArticle) && (
          <View className="mt-4 items-center">
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              {endOfArticle
                ? 'Sleep: End of article'
                : `Sleep in ${Math.ceil(remainingSeconds! / 60)} min`}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }
  ```

### Task 4: Timer State Persistence (Optional Enhancement)
- [ ] 4.1 Add timer state to player store:
  ```typescript
  // In stores/playerStore.ts
  interface PlayerState {
    // ... existing state
    sleepTimerEnd: Date | null;
    sleepEndOfArticle: boolean;
  }
  ```
- [ ] 4.2 Restore timer on app reopen (if within time window)

### Task 5: Background Timer Support (AC: 3)
- [ ] 5.1 Ensure timer works when app is backgrounded:
  ```typescript
  // Timer should continue in background via JS timer
  // Audio pause will work via track-player even when backgrounded
  ```
- [ ] 5.2 Test timer completion while app is in background

### Task 6: Gentle Fade Out (Enhancement)
- [ ] 6.1 Add volume fade before pause:
  ```typescript
  const fadeOutAndPause = async () => {
    const steps = 10;
    const stepDuration = 1000; // 10 seconds total fade
    const volumeStep = 1 / steps;

    for (let i = steps; i > 0; i--) {
      await TrackPlayer.setVolume(i * volumeStep);
      await new Promise(r => setTimeout(r, stepDuration));
    }

    await TrackPlayer.pause();
    await TrackPlayer.setVolume(1); // Reset for next play
  };
  ```
- [ ] 6.2 Make fade out optional (for users who prefer instant stop)

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Timer logic runs in JS (not native)
- react-native-track-player handles pause
- Background execution via React Native's timer

**From UX Design Specification:**
- Sleep-friendly design for bedtime listening
- Gentle experience (fade out optional)
- Clear timer indicator

### Source Tree Components

```
apps/mobile/
├── app/player/
│   └── [id].tsx             # Sleep timer integration
├── components/player/
│   └── SleepTimer.tsx       # Timer selector component
└── hooks/
    └── useSleepTimer.ts     # Timer logic
```

### Testing Standards

- Test 15 min timer → pauses after 15 min
- Test "End of article" → pauses when track ends
- Test timer cancellation → timer stops
- Test timer while app backgrounded → still works
- Test timer indicator shows remaining time
- Test multiple timer resets (change timer while active)

### Key Technical Decisions

1. **JS Timer:** Simple setInterval for countdown
2. **End of Article:** Uses track-player's PlaybackQueueEnded event
3. **No Persistence:** Timer resets on app close (intentional for simplicity)
4. **Optional Fade:** Gentle fade out for sleep mode

### Dependencies

- Story 3-3 must be completed (player exists)
- Story 3-4 should be completed (background audio)

### References

- [Source: ux-design-specification.md#Transferable-UX-Patterns]
- [Source: epics.md#Story-3.6-Sleep-Timer]
- [Source: prd.md#FR13]
- [Pocket Casts Sleep Timer](https://support.pocketcasts.com/knowledge-base/sleep-timer/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | Implementation complete | Claude Opus 4.5 |

### File List

| File | Action | Description |
|------|--------|-------------|
| `apps/mobile/hooks/useSleepTimer.ts` | Created | Sleep timer hook with countdown and fade |
| `apps/mobile/components/player/SleepTimer.tsx` | Created | Sleep timer modal component |
| `apps/mobile/app/player/[id].tsx` | Modified | Integrated sleep timer |
| `apps/mobile/__tests__/unit/player/sleepTimer.test.ts` | Created | Timer options tests |
