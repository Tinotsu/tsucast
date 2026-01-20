# Story 4.4: Queue Management

Status: ready-for-dev

## Story

As a user listening to content,
I want to manage what plays next,
so that I can queue up articles for continuous listening.

## Acceptance Criteria

1. **AC1: View Queue**
   - Given audio is playing
   - When user taps queue button
   - Then they see current queue (up next items)

2. **AC2: Add to Queue**
   - Given user is in library
   - When they long-press an item
   - Then they see "Add to Queue" option
   - And item is added to end of queue

3. **AC3: Reorder Queue**
   - Given user views queue
   - When they drag an item
   - Then they can reorder the queue
   - And order persists

4. **AC4: Auto-Play Next**
   - Given current item finishes
   - When queue has items
   - Then next item auto-plays

5. **AC5: Queue Empty**
   - Given queue is empty
   - When current item finishes
   - Then playback stops gracefully

## Tasks / Subtasks

### Task 1: Queue Button Component (AC: 1)
- [ ] 1.1 Create `components/player/QueueButton.tsx`:
  ```typescript
  interface QueueButtonProps {
    queueLength: number;
    onPress: () => void;
  }

  export function QueueButton({ queueLength, onPress }: QueueButtonProps) {
    return (
      <TouchableOpacity onPress={onPress} className="relative">
        <Ionicons name="list" size={24} color="#92400E" />
        {queueLength > 0 && (
          <View className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {queueLength > 9 ? '9+' : queueLength}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }
  ```

### Task 2: Queue Modal/Sheet (AC: 1, 3)
- [ ] 2.1 Create `components/player/QueueSheet.tsx`:
  ```typescript
  import BottomSheet from '@gorhom/bottom-sheet';
  import DraggableFlatList from 'react-native-draggable-flatlist';

  interface QueueSheetProps {
    visible: boolean;
    onClose: () => void;
  }

  export function QueueSheet({ visible, onClose }: QueueSheetProps) {
    const { queue, removeFromQueue, reorderQueue } = useQueue();
    const bottomSheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
      if (visible) {
        bottomSheetRef.current?.expand();
      } else {
        bottomSheetRef.current?.close();
      }
    }, [visible]);

    const handleDragEnd = ({ data }: { data: QueueItem[] }) => {
      reorderQueue(data);
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%', '90%']}
        onClose={onClose}
        enablePanDownToClose
      >
        <View className="flex-1 p-4">
          <Text className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4">
            Up Next
          </Text>

          {queue.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="musical-notes-outline" size={48} color="#D97706" />
              <Text className="mt-4 text-amber-700">Queue is empty</Text>
              <Text className="text-sm text-amber-500">
                Long-press items in your library to add them
              </Text>
            </View>
          ) : (
            <DraggableFlatList
              data={queue}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id}
              renderItem={({ item, drag, isActive }) => (
                <QueueItem
                  item={item}
                  onDrag={drag}
                  isActive={isActive}
                  onRemove={() => removeFromQueue(item.id)}
                />
              )}
            />
          )}
        </View>
      </BottomSheet>
    );
  }
  ```
- [ ] 2.2 Install bottom sheet:
  ```bash
  npm install @gorhom/bottom-sheet
  npx expo install react-native-reanimated react-native-gesture-handler
  ```

### Task 3: Queue Hook (AC: all)
- [ ] 3.1 Create `hooks/useQueue.ts`:
  ```typescript
  import TrackPlayer, { useActiveTrack } from 'react-native-track-player';

  export function useQueue() {
    const [queue, setQueue] = useState<Track[]>([]);
    const activeTrack = useActiveTrack();

    // Sync queue state with track-player
    useEffect(() => {
      const fetchQueue = async () => {
        const tracks = await TrackPlayer.getQueue();
        const activeIndex = await TrackPlayer.getActiveTrackIndex();

        // Only show tracks AFTER current one
        if (activeIndex !== undefined) {
          setQueue(tracks.slice(activeIndex + 1));
        } else {
          setQueue(tracks);
        }
      };

      fetchQueue();

      // Re-fetch when track changes
      const subscription = TrackPlayer.addEventListener(
        Event.PlaybackActiveTrackChanged,
        fetchQueue
      );

      return () => subscription.remove();
    }, [activeTrack]);

    const addToQueue = async (track: Track) => {
      await TrackPlayer.add(track);
      // Refresh queue state
      const tracks = await TrackPlayer.getQueue();
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      setQueue(tracks.slice((activeIndex ?? -1) + 1));
    };

    const removeFromQueue = async (trackId: string) => {
      const tracks = await TrackPlayer.getQueue();
      const index = tracks.findIndex(t => t.id === trackId);
      if (index !== -1) {
        await TrackPlayer.remove(index);
      }
      // Refresh
      const newTracks = await TrackPlayer.getQueue();
      const activeIndex = await TrackPlayer.getActiveTrackIndex();
      setQueue(newTracks.slice((activeIndex ?? -1) + 1));
    };

    const reorderQueue = async (newOrder: Track[]) => {
      // Get current track and its index
      const activeIndex = await TrackPlayer.getActiveTrackIndex() ?? 0;
      const currentTracks = await TrackPlayer.getQueue();

      // Keep tracks up to and including current, then append new order
      const beforeCurrent = currentTracks.slice(0, activeIndex + 1);

      await TrackPlayer.removeUpcomingTracks();
      await TrackPlayer.add(newOrder);

      setQueue(newOrder);
    };

    const clearQueue = async () => {
      await TrackPlayer.removeUpcomingTracks();
      setQueue([]);
    };

    return {
      queue,
      queueLength: queue.length,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      clearQueue,
    };
  }
  ```

### Task 4: Add to Queue from Library (AC: 2)
- [ ] 4.1 Update library item long-press menu:
  ```typescript
  // In components/library/LibraryItemMenu.tsx
  interface LibraryItemMenuProps {
    item: LibraryItemData;
    onClose: () => void;
  }

  export function LibraryItemMenu({ item, onClose }: LibraryItemMenuProps) {
    const { addToQueue } = useQueue();
    const { playlists } = usePlaylists();

    const handleAddToQueue = async () => {
      await addToQueue({
        id: item.audio.id,
        url: item.audio.audio_url,
        title: item.audio.title,
        artist: 'tsucast',
      });
      onClose();
      // Show toast confirmation
    };

    return (
      <View className="bg-white dark:bg-gray-800 rounded-xl p-2">
        <TouchableOpacity
          onPress={handleAddToQueue}
          className="flex-row items-center p-3"
        >
          <Ionicons name="list" size={20} color="#F59E0B" />
          <Text className="ml-3 text-amber-900 dark:text-amber-100">
            Add to Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {/* show playlist picker */}}
          className="flex-row items-center p-3"
        >
          <Ionicons name="add-circle" size={20} color="#F59E0B" />
          <Text className="ml-3 text-amber-900 dark:text-amber-100">
            Add to Playlist
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  ```

### Task 5: Queue Item Component (AC: 1, 3)
- [ ] 5.1 Create `components/player/QueueItem.tsx`:
  ```typescript
  interface QueueItemProps {
    item: Track;
    onDrag: () => void;
    isActive: boolean;
    onRemove: () => void;
  }

  export function QueueItem({ item, onDrag, isActive, onRemove }: QueueItemProps) {
    return (
      <View
        className={cn(
          'flex-row items-center p-3 rounded-lg mb-2',
          isActive ? 'bg-amber-200 dark:bg-amber-800' : 'bg-amber-50 dark:bg-amber-900/50'
        )}
      >
        {/* Drag handle */}
        <TouchableOpacity onLongPress={onDrag} className="pr-3">
          <Ionicons name="reorder-three" size={24} color="#92400E" />
        </TouchableOpacity>

        {/* Track info */}
        <View className="flex-1">
          <Text
            className="text-amber-900 dark:text-amber-100 font-medium"
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>

        {/* Remove button */}
        <TouchableOpacity onPress={onRemove} className="pl-3">
          <Ionicons name="close-circle" size={24} color="#DC2626" />
        </TouchableOpacity>
      </View>
    );
  }
  ```

### Task 6: Integrate Queue into Player (AC: 1)
- [ ] 6.1 Update `app/player/[id].tsx`:
  ```typescript
  export default function PlayerScreen() {
    const { queueLength } = useQueue();
    const [showQueue, setShowQueue] = useState(false);

    return (
      <SafeAreaView>
        {/* ... existing player UI */}

        {/* Secondary controls row */}
        <View className="flex-row justify-between px-8 mt-4">
          <SpeedControl ... />

          <QueueButton
            queueLength={queueLength}
            onPress={() => setShowQueue(true)}
          />

          <SleepTimer ... />
        </View>

        {/* Queue Sheet */}
        <QueueSheet
          visible={showQueue}
          onClose={() => setShowQueue(false)}
        />
      </SafeAreaView>
    );
  }
  ```

### Task 7: Auto-Play & Queue End Handling (AC: 4, 5)
- [ ] 7.1 Configure track-player for auto-advance (default behavior)
- [ ] 7.2 Handle queue end in `services/playbackService.ts`:
  ```typescript
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    // Queue is empty and current track finished
    // Track player will stop automatically
    // Optionally show notification or update UI
  });
  ```

### Task 8: Toast Notifications (AC: 2)
- [ ] 8.1 Add toast for queue actions:
  ```typescript
  import Toast from 'react-native-toast-message';

  // After adding to queue
  Toast.show({
    type: 'success',
    text1: 'Added to Queue',
    text2: track.title,
    visibilityTime: 2000,
  });
  ```
- [ ] 8.2 Install toast library:
  ```bash
  npm install react-native-toast-message
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Queue managed by react-native-track-player
- No server-side queue persistence (session-only)
- Auto-advance is built into track-player

**Queue Behavior:**
- Queue = tracks after current in track-player queue
- Adding to queue = TrackPlayer.add()
- Reorder = remove upcoming + re-add in new order
- Auto-advance is automatic

### Source Tree Components

```
apps/mobile/
├── app/player/
│   └── [id].tsx             # Queue integration
├── components/player/
│   ├── QueueButton.tsx
│   ├── QueueSheet.tsx
│   └── QueueItem.tsx
├── components/library/
│   └── LibraryItemMenu.tsx  # Add to queue option
└── hooks/
    └── useQueue.ts
```

### Testing Standards

- Test add to queue → item appears in queue
- Test drag reorder → order updates
- Test remove from queue → item removed
- Test play through queue → auto-advances
- Test queue empty → playback stops
- Test queue badge shows count

### Key Technical Decisions

1. **Session Queue:** Not persisted to server (simpler)
2. **Bottom Sheet:** Familiar pattern for queue display
3. **track-player Native:** Leverage native queue management
4. **Drag Reorder:** Same library as playlists for consistency

### Dependencies

- Story 3-3 must be completed (player exists)
- Story 4-1 must be completed (library items exist)

### References

- [Source: epics.md#Story-4.4-Queue-Management]
- [Source: prd.md#FR20-FR23]
- [react-native-track-player Queue](https://react-native-track-player.js.org/docs/api/functions/queue)
- [@gorhom/bottom-sheet](https://gorhom.github.io/react-native-bottom-sheet/)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
