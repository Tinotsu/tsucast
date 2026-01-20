# Story 6.4: Persistent Mini-Player

Status: ready-for-dev

## Story

As a user navigating the app,
I want to see and control current playback,
so that I can switch tabs without losing context.

## Acceptance Criteria

1. **AC1: Mini-Player Display**
   - Given audio is playing
   - When user is on any screen
   - Then mini-player bar appears at bottom
   - And shows: title (truncated), play/pause button

2. **AC2: Open Full Player**
   - Given mini-player is visible
   - When user taps it
   - Then full player screen opens

3. **AC3: Inline Controls**
   - Given mini-player is visible
   - When user taps play/pause
   - Then playback toggles without opening full player

4. **AC4: Hidden When Inactive**
   - Given no audio is playing
   - When user navigates app
   - Then mini-player is hidden

## Tasks / Subtasks

### Task 1: Mini-Player Component (AC: 1, 3)
- [ ] 1.1 Create `components/player/MiniPlayer.tsx`:
  ```typescript
  import { useAudioPlayer } from '@/hooks/useAudioPlayer';
  import { usePlayerStore } from '@/stores/playerStore';
  import { router } from 'expo-router';

  export function MiniPlayer() {
    const { currentTrack, isPlaying, togglePlayPause, position, duration } = useAudioPlayer();

    if (!currentTrack) {
      return null;
    }

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    const handlePress = () => {
      router.push(`/player/${currentTrack.id}`);
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-amber-100 dark:bg-amber-900 border-t border-amber-200 dark:border-amber-800"
      >
        {/* Progress bar */}
        <View className="h-0.5 bg-amber-200 dark:bg-amber-800">
          <View
            className="h-full bg-amber-500"
            style={{ width: `${progress}%` }}
          />
        </View>

        <View className="flex-row items-center px-4 py-3">
          {/* Track info */}
          <View className="flex-1 mr-4">
            <Text
              className="text-base font-medium text-amber-900 dark:text-amber-100"
              numberOfLines={1}
            >
              {currentTrack.title}
            </Text>
            <Text className="text-sm text-amber-600 dark:text-amber-400">
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>

          {/* Play/Pause button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center"
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  ```

### Task 2: Root Layout Integration (AC: 1, 4)
- [ ] 2.1 Update `app/_layout.tsx` to include MiniPlayer:
  ```typescript
  import { MiniPlayer } from '@/components/player/MiniPlayer';
  import { usePlayerStore } from '@/stores/playerStore';

  export default function RootLayout() {
    const currentTrack = usePlayerStore((state) => state.currentTrack);

    return (
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className="flex-1">
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="upgrade" options={{ title: 'Upgrade' }} />
            </Stack>

            {/* Mini-player - positioned above tab bar */}
            {currentTrack && <MiniPlayer />}
          </View>
          <Toast config={toastConfig} />
        </GestureHandlerRootView>
      </QueryClientProvider>
    );
  }
  ```

### Task 3: Tab Layout Adjustment (AC: 1)
- [ ] 3.1 Update `app/(tabs)/_layout.tsx` to account for mini-player:
  ```typescript
  import { usePlayerStore } from '@/stores/playerStore';

  export default function TabLayout() {
    const currentTrack = usePlayerStore((state) => state.currentTrack);

    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#F59E0B',
          tabBarInactiveTintColor: '#92400E',
          tabBarStyle: {
            backgroundColor: '#FFFBEB', // or dark mode color
            borderTopColor: '#FDE68A',
            // Add padding if mini-player visible
            ...(currentTrack && { marginBottom: 60 }),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Add',
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color }) => (
              <Ionicons name="library" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }
  ```

### Task 4: Animated Visibility (AC: 1, 4)
- [ ] 4.1 Add slide-up animation when track starts:
  ```typescript
  import { MotiView } from 'moti';

  export function MiniPlayer() {
    const { currentTrack } = useAudioPlayer();

    return (
      <MotiView
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        exit={{ translateY: 100 }}
        transition={{ type: 'timing', duration: 200 }}
      >
        {/* ... mini-player content */}
      </MotiView>
    );
  }
  ```

### Task 5: Swipe to Dismiss (Optional Enhancement) (AC: 3)
- [ ] 5.1 Add swipe down to close mini-player:
  ```typescript
  import { Gesture, GestureDetector } from 'react-native-gesture-handler';
  import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 50) {
        // Close mini-player / stop playback
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0);
      }
    });
  ```

### Task 6: Position Above Keyboard (AC: 1)
- [ ] 6.1 Handle keyboard appearance:
  ```typescript
  import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

  export function MiniPlayer() {
    const keyboardHeight = useKeyboardHeight();

    return (
      <View style={{ bottom: keyboardHeight }}>
        {/* ... mini-player content */}
      </View>
    );
  }
  ```
- [ ] 6.2 Create `hooks/useKeyboardHeight.ts`:
  ```typescript
  import { Keyboard, Platform } from 'react-native';

  export function useKeyboardHeight() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
      const showListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => setKeyboardHeight(e.endCoordinates.height)
      );
      const hideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => setKeyboardHeight(0)
      );

      return () => {
        showListener.remove();
        hideListener.remove();
      };
    }, []);

    return keyboardHeight;
  }
  ```

### Task 7: Safe Area Handling (AC: 1)
- [ ] 7.1 Ensure mini-player respects safe areas:
  ```typescript
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  export function MiniPlayer() {
    const insets = useSafeAreaInsets();

    return (
      <View style={{ paddingBottom: insets.bottom }}>
        {/* ... mini-player content */}
      </View>
    );
  }
  ```

### Task 8: Player Screen Transition (AC: 2)
- [ ] 8.1 Add smooth transition to full player:
  ```typescript
  // In app/player/[id].tsx
  <Stack.Screen
    options={{
      presentation: 'modal',
      animation: 'slide_from_bottom',
      gestureEnabled: true,
      gestureDirection: 'vertical',
    }}
  />
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Mini-player in root layout
- Connected to player store
- Visible when track is loaded

**From UX Design Specification:**
- Persistent mini-player bar (Spotify pattern)
- Always visible during playback
- 2-3 taps max to any action

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Mini-player integration
│   └── (tabs)/
│       └── _layout.tsx      # Tab bar adjustment
├── components/player/
│   └── MiniPlayer.tsx       # Mini-player component
└── hooks/
    └── useKeyboardHeight.ts # Keyboard handling
```

### Testing Standards

- Test mini-player appears when playing
- Test mini-player hides when stopped
- Test tap opens full player
- Test play/pause without opening player
- Test navigation between tabs with mini-player
- Test keyboard doesn't cover mini-player
- Test safe area on notched devices

### Key Technical Decisions

1. **Root Layout:** Mini-player at app root, not in tabs
2. **Progress Bar:** Visual progress on mini-player
3. **Tap Zones:** Large tap area for full player, button for controls
4. **Animations:** Smooth slide up/down transitions

### Dependencies

- Story 3-3 must be completed (player exists)
- Story 3-4 must be completed (background audio)

### References

- [Source: ux-design-specification.md#Transferable-UX-Patterns]
- [Source: ux-design-specification.md#Custom-Components]
- [Source: epics.md#Story-6.4-Persistent-Mini-Player]
- [Spotify Mini-Player Pattern](https://spotify.design/)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
