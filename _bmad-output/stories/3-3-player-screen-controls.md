# Story 3.3: Player Screen & Controls

Status: ready-for-dev

## Story

As a user listening to generated audio,
I want familiar podcast controls,
so that I can play, pause, skip, and scrub easily.

## Acceptance Criteria

1. **AC1: Player Screen Layout**
   - Given user has audio playing
   - When they view the player screen
   - Then they see: album art area, title, play/pause button, progress bar, skip buttons

2. **AC2: Play/Pause**
   - Given user taps play/pause
   - When audio is playing
   - Then it pauses
   - And button shows play icon

3. **AC3: Skip Forward/Backward**
   - Given user taps skip forward
   - When audio is playing
   - Then position advances 30 seconds
   - Given user taps skip backward
   - When audio is playing
   - Then position rewinds 15 seconds

4. **AC4: Seek/Scrub**
   - Given user drags progress bar
   - When they release at new position
   - Then audio seeks to that position
   - And playback continues

5. **AC5: Progress Display**
   - Given user views progress
   - When audio is playing
   - Then they see current time and total duration
   - And progress bar updates in real-time

## Tasks / Subtasks

### Task 1: Install & Configure react-native-track-player (AC: all)
- [ ] 1.1 Install the library:
  ```bash
  npx expo install react-native-track-player
  ```
- [ ] 1.2 Create `services/trackPlayer.ts` for initialization:
  ```typescript
  import TrackPlayer, {
    Capability,
    AppKilledPlaybackBehavior
  } from 'react-native-track-player';

  export async function setupPlayer(): Promise<boolean> {
    let isSetup = false;
    try {
      await TrackPlayer.getActiveTrack();
      isSetup = true;
    } catch {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
        ],
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
        },
      });
      isSetup = true;
    }
    return isSetup;
  }
  ```
- [ ] 1.3 Create playback service `services/playbackService.ts`:
  ```typescript
  import TrackPlayer, { Event } from 'react-native-track-player';

  export async function PlaybackService() {
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));
    TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
      const position = await TrackPlayer.getPosition();
      await TrackPlayer.seekTo(position + 30);
    });
    TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
      const position = await TrackPlayer.getPosition();
      await TrackPlayer.seekTo(Math.max(0, position - 15));
    });
  }
  ```
- [ ] 1.4 Register service in `index.js`:
  ```javascript
  import { registerRootComponent } from 'expo';
  import TrackPlayer from 'react-native-track-player';
  import { PlaybackService } from './services/playbackService';
  import App from './App';

  registerRootComponent(App);
  TrackPlayer.registerPlaybackService(() => PlaybackService);
  ```

### Task 2: Player State Management (AC: all)
- [ ] 2.1 Create `stores/playerStore.ts` with Zustand:
  ```typescript
  import { create } from 'zustand';

  interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    position: number;
    duration: number;
    buffered: number;

    setCurrentTrack: (track: Track | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setPosition: (position: number) => void;
    setDuration: (duration: number) => void;
  }

  export const usePlayerStore = create<PlayerState>((set) => ({
    currentTrack: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    buffered: 0,

    setCurrentTrack: (track) => set({ currentTrack: track }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setPosition: (position) => set({ position }),
    setDuration: (duration) => set({ duration }),
  }));
  ```
- [ ] 2.2 Install Zustand:
  ```bash
  npm install zustand
  ```

### Task 3: Audio Player Hook (AC: all)
- [ ] 3.1 Create `hooks/useAudioPlayer.ts`:
  ```typescript
  import TrackPlayer, {
    usePlaybackState,
    useProgress,
    State
  } from 'react-native-track-player';
  import { usePlayerStore } from '@/stores/playerStore';

  export function useAudioPlayer() {
    const playbackState = usePlaybackState();
    const progress = useProgress();
    const { currentTrack, setCurrentTrack, setIsPlaying } = usePlayerStore();

    const isPlaying = playbackState.state === State.Playing;

    // Sync state
    useEffect(() => {
      setIsPlaying(isPlaying);
    }, [isPlaying]);

    const play = async () => {
      await TrackPlayer.play();
    };

    const pause = async () => {
      await TrackPlayer.pause();
    };

    const togglePlayPause = async () => {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }
    };

    const seekTo = async (position: number) => {
      await TrackPlayer.seekTo(position);
    };

    const skipForward = async (seconds: number = 30) => {
      const newPosition = Math.min(progress.position + seconds, progress.duration);
      await seekTo(newPosition);
    };

    const skipBackward = async (seconds: number = 15) => {
      const newPosition = Math.max(progress.position - seconds, 0);
      await seekTo(newPosition);
    };

    const loadTrack = async (track: Track) => {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: track.id,
        url: track.audioUrl,
        title: track.title,
        artist: 'tsucast',
        artwork: track.artwork || require('@/assets/images/default-artwork.png'),
      });
      setCurrentTrack(track);
      await TrackPlayer.play();
    };

    return {
      currentTrack,
      isPlaying,
      position: progress.position,
      duration: progress.duration,
      buffered: progress.buffered,
      play,
      pause,
      togglePlayPause,
      seekTo,
      skipForward,
      skipBackward,
      loadTrack,
    };
  }
  ```

### Task 4: Player Screen (AC: 1)
- [ ] 4.1 Create `app/player/[id].tsx`:
  ```typescript
  import { useLocalSearchParams } from 'expo-router';
  import { useAudioPlayer } from '@/hooks/useAudioPlayer';

  export default function PlayerScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const {
      currentTrack,
      isPlaying,
      position,
      duration,
      togglePlayPause,
      skipForward,
      skipBackward,
      seekTo,
    } = useAudioPlayer();

    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
        {/* Album Art Area */}
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-64 h-64 bg-amber-200 dark:bg-amber-800 rounded-2xl items-center justify-center">
            <Ionicons name="musical-notes" size={80} color="#F59E0B" />
          </View>
        </View>

        {/* Track Info */}
        <View className="px-8 mb-4">
          <Text className="text-xl font-bold text-amber-900 dark:text-amber-100 text-center" numberOfLines={2}>
            {currentTrack?.title || 'No track playing'}
          </Text>
        </View>

        {/* Progress Bar */}
        <ProgressBar
          position={position}
          duration={duration}
          onSeek={seekTo}
        />

        {/* Controls */}
        <View className="flex-row items-center justify-center gap-8 py-8">
          <SkipButton direction="backward" onPress={() => skipBackward(15)} />
          <PlayButton isPlaying={isPlaying} onPress={togglePlayPause} />
          <SkipButton direction="forward" onPress={() => skipForward(30)} />
        </View>
      </SafeAreaView>
    );
  }
  ```

### Task 5: Play Button Component (AC: 2)
- [ ] 5.1 Create `components/player/PlayButton.tsx`:
  ```typescript
  interface PlayButtonProps {
    isPlaying: boolean;
    onPress: () => void;
    size?: 'small' | 'large';
  }

  export function PlayButton({ isPlaying, onPress, size = 'large' }: PlayButtonProps) {
    const iconSize = size === 'large' ? 40 : 24;
    const buttonSize = size === 'large' ? 'w-20 h-20' : 'w-12 h-12';

    return (
      <TouchableOpacity
        onPress={onPress}
        className={cn(
          buttonSize,
          'bg-amber-500 rounded-full items-center justify-center',
          'active:bg-amber-600'
        )}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={iconSize}
          color="white"
        />
      </TouchableOpacity>
    );
  }
  ```

### Task 6: Skip Buttons (AC: 3)
- [ ] 6.1 Create `components/player/SkipButton.tsx`:
  ```typescript
  interface SkipButtonProps {
    direction: 'forward' | 'backward';
    onPress: () => void;
  }

  export function SkipButton({ direction, onPress }: SkipButtonProps) {
    const icon = direction === 'forward' ? 'play-forward' : 'play-back';
    const label = direction === 'forward' ? '30' : '15';

    return (
      <TouchableOpacity
        onPress={onPress}
        className="items-center"
      >
        <View className="relative">
          <Ionicons name={icon} size={32} color="#92400E" />
          <Text className="absolute -bottom-1 right-0 text-xs font-bold text-amber-700">
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  ```

### Task 7: Progress Bar Component (AC: 4, 5)
- [ ] 7.1 Create `components/player/ProgressBar.tsx`:
  ```typescript
  import Slider from '@react-native-community/slider';

  interface ProgressBarProps {
    position: number;
    duration: number;
    onSeek: (position: number) => void;
  }

  export function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);

    const displayPosition = isSeeking ? seekPosition : position;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <View className="px-8">
        <Slider
          value={displayPosition}
          minimumValue={0}
          maximumValue={duration || 1}
          onSlidingStart={() => setIsSeeking(true)}
          onValueChange={setSeekPosition}
          onSlidingComplete={(value) => {
            setIsSeeking(false);
            onSeek(value);
          }}
          minimumTrackTintColor="#F59E0B"
          maximumTrackTintColor="#D4A574"
          thumbTintColor="#F59E0B"
        />
        <View className="flex-row justify-between mt-1">
          <Text className="text-sm text-amber-700 dark:text-amber-300">
            {formatTime(displayPosition)}
          </Text>
          <Text className="text-sm text-amber-700 dark:text-amber-300">
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    );
  }
  ```
- [ ] 7.2 Install slider:
  ```bash
  npx expo install @react-native-community/slider
  ```

### Task 8: Initialize Player on App Start (AC: all)
- [ ] 8.1 Update `app/_layout.tsx` to initialize player:
  ```typescript
  import { setupPlayer } from '@/services/trackPlayer';

  export default function RootLayout() {
    const [playerReady, setPlayerReady] = useState(false);

    useEffect(() => {
      setupPlayer().then(() => setPlayerReady(true));
    }, []);

    if (!playerReady) {
      return <SplashScreen />;
    }

    return (
      // ... rest of layout
    );
  }
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- react-native-track-player for audio playback
- Zustand for player state management
- Background playback support (configured in player setup)

**From UX Design Specification:**
- Familiar podcast controls (play/pause, skip, scrub)
- Clean, minimal player UI
- Autumn Magic color palette
- 15s back, 30s forward (standard podcast increments)

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── _layout.tsx          # Player initialization
│   └── player/
│       └── [id].tsx         # Player screen
├── components/player/
│   ├── PlayButton.tsx
│   ├── SkipButton.tsx
│   └── ProgressBar.tsx
├── hooks/
│   └── useAudioPlayer.ts    # Player hook
├── stores/
│   └── playerStore.ts       # Zustand store
└── services/
    ├── trackPlayer.ts       # Setup & config
    └── playbackService.ts   # Background service
```

### Testing Standards

- Test play/pause → state changes correctly
- Test skip forward 30s → position updates
- Test skip backward 15s → position updates
- Test seek via slider → audio jumps to position
- Test progress display → updates in real-time
- Test at end of audio → playback stops gracefully

### Key Technical Decisions

1. **react-native-track-player:** Industry standard for RN audio
2. **Zustand:** Lightweight state management
3. **15s/30s Skips:** Standard podcast convention
4. **Slider Component:** Native slider for smooth seeking

### Dependencies

- Story 3-2 must be completed (audio generation exists)
- Audio files must be in R2 storage

### References

- [Source: architecture-v2.md#Flow-2-Audio-Playback]
- [Source: ux-design-specification.md#Transferable-UX-Patterns]
- [Source: epics.md#Story-3.3-Player-Screen-Controls]
- [Source: prd.md#FR10-FR18]
- [react-native-track-player](https://react-native-track-player.js.org/)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
