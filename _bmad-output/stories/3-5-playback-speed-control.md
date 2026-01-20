# Story 3.5: Playback Speed Control

Status: ready-for-dev

## Story

As a user who wants to listen faster,
I want to adjust playback speed,
so that I can consume content more efficiently.

## Acceptance Criteria

1. **AC1: Speed Options Display**
   - Given user is on player screen
   - When they tap speed button
   - Then they see speed options: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x

2. **AC2: Speed Selection**
   - Given user selects a speed
   - When they tap the option
   - Then playback speed changes immediately
   - And speed indicator updates

3. **AC3: Speed Persistence**
   - Given user changed speed
   - When they play a different article
   - Then speed preference persists

## Tasks / Subtasks

### Task 1: Speed Control Component (AC: 1, 2)
- [ ] 1.1 Create `components/player/SpeedControl.tsx`:
  ```typescript
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  interface SpeedControlProps {
    currentSpeed: number;
    onSpeedChange: (speed: number) => void;
  }

  export function SpeedControl({ currentSpeed, onSpeedChange }: SpeedControlProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <View>
        {/* Speed Button */}
        <TouchableOpacity
          onPress={() => setIsOpen(!isOpen)}
          className="bg-amber-200 dark:bg-amber-800 px-3 py-2 rounded-lg"
        >
          <Text className="text-amber-900 dark:text-amber-100 font-medium">
            {currentSpeed}x
          </Text>
        </TouchableOpacity>

        {/* Speed Options Modal/Dropdown */}
        {isOpen && (
          <View className="absolute bottom-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
            {SPEED_OPTIONS.map((speed) => (
              <TouchableOpacity
                key={speed}
                onPress={() => {
                  onSpeedChange(speed);
                  setIsOpen(false);
                }}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  currentSpeed === speed && 'bg-amber-500'
                )}
              >
                <Text className={cn(
                  'text-center',
                  currentSpeed === speed ? 'text-white font-bold' : 'text-gray-800 dark:text-gray-200'
                )}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }
  ```

### Task 2: Speed Control Hook (AC: 2, 3)
- [ ] 2.1 Create `hooks/usePlaybackSpeed.ts`:
  ```typescript
  import TrackPlayer from 'react-native-track-player';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  const SPEED_PREFERENCE_KEY = 'playback_speed';
  const DEFAULT_SPEED = 1;

  export function usePlaybackSpeed() {
    const [speed, setSpeedState] = useState(DEFAULT_SPEED);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved speed on mount
    useEffect(() => {
      AsyncStorage.getItem(SPEED_PREFERENCE_KEY).then((stored) => {
        if (stored) {
          const savedSpeed = parseFloat(stored);
          setSpeedState(savedSpeed);
          TrackPlayer.setRate(savedSpeed);
        }
        setIsLoaded(true);
      });
    }, []);

    const setSpeed = async (newSpeed: number) => {
      setSpeedState(newSpeed);
      await TrackPlayer.setRate(newSpeed);
      await AsyncStorage.setItem(SPEED_PREFERENCE_KEY, newSpeed.toString());
    };

    return { speed, setSpeed, isLoaded };
  }
  ```

### Task 3: Integrate into Player Screen (AC: 1, 2)
- [ ] 3.1 Update `app/player/[id].tsx` to include SpeedControl:
  ```typescript
  import { SpeedControl } from '@/components/player/SpeedControl';
  import { usePlaybackSpeed } from '@/hooks/usePlaybackSpeed';

  export default function PlayerScreen() {
    const { speed, setSpeed } = usePlaybackSpeed();
    // ... other player hooks

    return (
      <SafeAreaView>
        {/* ... album art, title, progress */}

        {/* Controls Row */}
        <View className="flex-row items-center justify-between px-8">
          <SpeedControl currentSpeed={speed} onSpeedChange={setSpeed} />

          <View className="flex-row items-center gap-8">
            <SkipButton direction="backward" onPress={() => skipBackward(15)} />
            <PlayButton isPlaying={isPlaying} onPress={togglePlayPause} />
            <SkipButton direction="forward" onPress={() => skipForward(30)} />
          </View>

          {/* Placeholder for sleep timer (Story 3.6) */}
          <View className="w-12" />
        </View>
      </SafeAreaView>
    );
  }
  ```

### Task 4: Apply Speed on Track Load (AC: 3)
- [ ] 4.1 Update `hooks/useAudioPlayer.ts` to apply saved speed:
  ```typescript
  const loadTrack = async (track: Track) => {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.id,
      url: track.audioUrl,
      title: track.title,
      artist: 'tsucast',
      artwork: track.artwork,
    });

    // Apply saved speed preference
    const savedSpeed = await AsyncStorage.getItem('playback_speed');
    if (savedSpeed) {
      await TrackPlayer.setRate(parseFloat(savedSpeed));
    }

    setCurrentTrack(track);
    await TrackPlayer.play();
  };
  ```

### Task 5: Speed Indicator in Mini-Player (AC: 2)
- [ ] 5.1 Add speed display to MiniPlayer (if different from 1x):
  ```typescript
  // In MiniPlayer component (Story 6.4)
  const { speed } = usePlaybackSpeed();

  {speed !== 1 && (
    <Text className="text-xs text-amber-600">
      {speed}x
    </Text>
  )}
  ```

### Task 6: Accessibility & UX Polish (AC: 1)
- [ ] 6.1 Add haptic feedback on speed change:
  ```typescript
  import * as Haptics from 'expo-haptics';

  const setSpeed = async (newSpeed: number) => {
    await Haptics.selectionAsync();
    // ... rest of speed change logic
  };
  ```
- [ ] 6.2 Install expo-haptics:
  ```bash
  npx expo install expo-haptics
  ```
- [ ] 6.3 Ensure speed button is accessible (proper labels)

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- react-native-track-player provides setRate() API
- Speed preference stored in AsyncStorage
- Speed persists across sessions and tracks

**From UX Design Specification:**
- Speed control visible but secondary
- Common podcast speeds (0.5x - 2x)
- Current speed always visible

### Source Tree Components

```
apps/mobile/
├── app/player/
│   └── [id].tsx             # Speed control integration
├── components/player/
│   └── SpeedControl.tsx     # Speed selector component
└── hooks/
    └── usePlaybackSpeed.ts  # Speed state + persistence
```

### Testing Standards

- Test speed change → audio pitch/tempo changes
- Test all speed options (0.5x to 2x)
- Test speed persistence → restart app, speed retained
- Test speed persistence → load new track, speed applied
- Test UI updates correctly when speed changes

### Key Technical Decisions

1. **AsyncStorage:** Simple persistence for user preference
2. **react-native-track-player:** Native audio rate adjustment
3. **7 Speed Options:** Standard podcast speeds (0.5, 0.75, 1, 1.25, 1.5, 1.75, 2)
4. **Apply on Track Load:** Speed preference applies to all new tracks

### Dependencies

- Story 3-3 must be completed (player exists)

### References

- [Source: epics.md#Story-3.5-Playback-Speed-Control]
- [Source: prd.md#FR12]
- [react-native-track-player setRate](https://react-native-track-player.js.org/docs/api/functions/player#setrate)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
