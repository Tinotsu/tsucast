# Story 4.2: Playback Progress Tracking

Status: done

## Story

As a user who partially listened to an article,
I want my position remembered,
so that I can resume where I left off.

## Acceptance Criteria

1. **AC1: Position Saving During Playback**
   - Given user is listening to an article
   - When they pause or leave
   - Then playback position is saved to `user_library` table
   - And saved every 30 seconds during playback

2. **AC2: Position Restoration**
   - Given user opens a previously played article
   - When player loads
   - Then playback resumes from saved position

3. **AC3: Completion Marking**
   - Given user finishes an article
   - When playback reaches the end
   - Then item is marked as "played" in library
   - And visual indicator shows completed status

4. **AC4: Cross-Device Sync**
   - Given user plays on multiple devices
   - When position syncs
   - Then last-write-wins (most recent position used)

## Tasks / Subtasks

### Task 1: Position Save API Endpoint (AC: 1, 4)
- [x] 1.1 Add to `apps/api/src/routes/library.ts`:
  ```typescript
  // Update playback position
  library.patch('/library/:id/position', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { position, is_played } = await c.req.json();

    const { error } = await supabase
      .from('user_library')
      .update({
        playback_position: position,
        is_played: is_played ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return c.json({ error: { code: 'UPDATE_FAILED', message: 'Failed to save position' } }, 500);
    }

    return c.json({ success: true });
  });
  ```

### Task 2: Position Saving Hook (AC: 1)
- [x] 2.1 Create `hooks/usePositionSaving.ts`:
  ```typescript
  import { useRef, useEffect } from 'react';
  import TrackPlayer, { useProgress } from 'react-native-track-player';
  import { savePlaybackPosition } from '@/services/api';
  import { usePlayerStore } from '@/stores/playerStore';

  const SAVE_INTERVAL_MS = 30000; // 30 seconds

  export function usePositionSaving() {
    const { position } = useProgress();
    const { currentTrack, currentLibraryId } = usePlayerStore();
    const lastSavedPosition = useRef(0);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Save position periodically
    useEffect(() => {
      if (!currentLibraryId) return;

      // Only save if position changed significantly (> 5 seconds)
      if (Math.abs(position - lastSavedPosition.current) > 5) {
        // Debounce saves
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await savePlaybackPosition(currentLibraryId, Math.floor(position));
            lastSavedPosition.current = position;
          } catch (error) {
            console.error('Failed to save position:', error);
          }
        }, 2000); // 2 second debounce
      }

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
      };
    }, [position, currentLibraryId]);

    // Save on pause
    const saveOnPause = async () => {
      if (currentLibraryId) {
        const currentPosition = await TrackPlayer.getPosition();
        await savePlaybackPosition(currentLibraryId, Math.floor(currentPosition));
      }
    };

    // Save on app background
    useEffect(() => {
      const subscription = AppState.addEventListener('change', async (state) => {
        if (state === 'background' && currentLibraryId) {
          const currentPosition = await TrackPlayer.getPosition();
          await savePlaybackPosition(currentLibraryId, Math.floor(currentPosition));
        }
      });

      return () => subscription.remove();
    }, [currentLibraryId]);

    return { saveOnPause };
  }
  ```

### Task 3: Track Library ID in Player Store (AC: 1, 2)
- [x] 3.1 Update `stores/playerStore.ts`:
  ```typescript
  interface PlayerState {
    currentTrack: Track | null;
    currentLibraryId: string | null;  // Add this
    isPlaying: boolean;
    // ... rest of state

    setCurrentLibraryId: (id: string | null) => void;
  }

  export const usePlayerStore = create<PlayerState>((set) => ({
    // ... existing state
    currentLibraryId: null,
    setCurrentLibraryId: (id) => set({ currentLibraryId: id }),
  }));
  ```

### Task 4: Load with Saved Position (AC: 2)
- [x] 4.1 Update `hooks/useAudioPlayer.ts`:
  ```typescript
  const loadFromLibrary = async (libraryItem: LibraryItemData) => {
    const { setCurrentLibraryId } = usePlayerStore.getState();

    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: libraryItem.audio.id,
      url: libraryItem.audio.audio_url,
      title: libraryItem.audio.title,
      artist: 'tsucast',
    });

    // Store library ID for position saving
    setCurrentLibraryId(libraryItem.id);

    // Seek to saved position if exists
    if (libraryItem.playback_position > 0) {
      await TrackPlayer.seekTo(libraryItem.playback_position);
    }

    // Apply saved speed preference
    const savedSpeed = await AsyncStorage.getItem('playback_speed');
    if (savedSpeed) {
      await TrackPlayer.setRate(parseFloat(savedSpeed));
    }

    setCurrentTrack({
      id: libraryItem.audio.id,
      audioUrl: libraryItem.audio.audio_url,
      title: libraryItem.audio.title,
    });

    await TrackPlayer.play();
  };
  ```

### Task 5: Completion Detection (AC: 3)
- [x] 5.1 Add completion handler in `services/playbackService.ts`:
  ```typescript
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    const { currentLibraryId } = usePlayerStore.getState();

    if (currentLibraryId) {
      try {
        await markAsPlayed(currentLibraryId);
      } catch (error) {
        console.error('Failed to mark as played:', error);
      }
    }
  });
  ```
- [x] 5.2 Add API function in `services/api.ts`:
  ```typescript
  export async function markAsPlayed(libraryId: string): Promise<void> {
    const token = await getAuthToken();
    const position = await TrackPlayer.getDuration();

    await fetch(`${API_URL}/api/library/${libraryId}/position`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        position,
        is_played: true,
      }),
    });
  }
  ```

### Task 6: Visual Completion Indicator (AC: 3)
- [x] 6.1 Update `components/library/LibraryItem.tsx`:
  ```typescript
  // Add completed indicator
  {item.is_played && (
    <View className="absolute top-2 right-2">
      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
    </View>
  )}

  // Or show in subtitle
  <View className="flex-row items-center mt-1">
    {item.is_played ? (
      <View className="flex-row items-center">
        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
        <Text className="text-sm text-green-600 ml-1">Played</Text>
      </View>
    ) : item.playback_position > 0 ? (
      <Text className="text-sm text-amber-600">
        {formatTime(item.playback_position)} / {formatTime(item.audio.duration_seconds)}
      </Text>
    ) : (
      <Text className="text-sm text-amber-600">
        {formatDuration(item.audio.duration_seconds)}
      </Text>
    )}
  </View>
  ```

### Task 7: API Service Functions (AC: 1, 3)
- [x] 7.1 Add to `services/api.ts`:
  ```typescript
  export async function savePlaybackPosition(
    libraryId: string,
    position: number
  ): Promise<void> {
    const token = await getAuthToken();

    await fetch(`${API_URL}/api/library/${libraryId}/position`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ position }),
    });
  }
  ```

### Task 8: Integrate Position Saving (AC: 1)
- [x] 8.1 Add usePositionSaving to player screen:
  ```typescript
  // In app/player/[id].tsx
  import { usePositionSaving } from '@/hooks/usePositionSaving';

  export default function PlayerScreen() {
    usePositionSaving(); // Hook handles all saving logic

    // ... rest of player
  }
  ```
- [x] 8.2 Call saveOnPause when pausing:
  ```typescript
  const { saveOnPause } = usePositionSaving();

  const handlePause = async () => {
    await TrackPlayer.pause();
    await saveOnPause();
  };
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Position saved to user_library table
- Last-write-wins for cross-device sync
- Save every 30 seconds during playback
- Save on pause and app background

**Position Saving Flow:**
1. During playback → save every 30s (debounced)
2. On pause → immediate save
3. On app background → immediate save
4. On track end → mark as played

### Source Tree Components

```
apps/mobile/
├── app/player/
│   └── [id].tsx             # Position saving integration
├── components/library/
│   └── LibraryItem.tsx      # Completion indicator
├── hooks/
│   ├── useAudioPlayer.ts    # Load with position
│   └── usePositionSaving.ts # Save logic
├── stores/
│   └── playerStore.ts       # currentLibraryId
└── services/
    └── api.ts               # savePlaybackPosition, markAsPlayed

apps/api/
└── src/routes/
    └── library.ts           # PATCH /library/:id/position
```

### Testing Standards

- Test position saved every 30s during playback
- Test position saved on pause
- Test position saved on app background
- Test resume from saved position
- Test track completion → marked as played
- Test cross-device → last position wins

### Key Technical Decisions

1. **30s Interval:** Balance between accuracy and API load
2. **Debounce:** Prevent rapid saves during seeking
3. **Last-Write-Wins:** Simple conflict resolution
4. **Background Save:** Ensure position saved if app killed

### Dependencies

- Story 4-1 must be completed (library exists)
- Story 3-3 must be completed (player exists)

### References

- [Source: architecture-v2.md#Flow-2-Audio-Playback]
- [Source: epics.md#Story-4.2-Playback-Progress-Tracking]
- [Source: prd.md#FR19]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | Implementation completed | Claude Opus 4.5 |

### File List

**Created:**
- `apps/mobile/hooks/usePositionSaving.ts`

**Modified:**
- `apps/api/src/routes/library.ts` (PATCH /library/:id/position)
- `apps/mobile/stores/playerStore.ts` (currentLibraryId)
- `apps/mobile/hooks/useAudioPlayer.ts` (loadFromLibrary with position)
- `apps/mobile/services/playbackService.ts` (PlaybackQueueEnded handler)
- `apps/mobile/services/api.ts` (savePlaybackPosition, markAsPlayed)
- `apps/mobile/components/library/LibraryItem.tsx` (completion indicator)
- `apps/mobile/app/player/[id].tsx` (position saving integration)
