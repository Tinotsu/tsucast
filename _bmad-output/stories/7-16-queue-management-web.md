# Story 7.16: Queue Management (Web)

Status: done

## Story

As a web user listening to content,
I want to manage a playback queue,
So that I can line up articles for continuous listening.

## Acceptance Criteria

1. **AC1: Add to Queue**
   - Given user is viewing their library
   - When they click menu on a library item
   - Then they see "Add to Queue" option
   - And item is added to end of queue

2. **AC2: View Queue**
   - Given audio is playing
   - When user opens player modal
   - And clicks Queue button
   - Then they see current queue with upcoming items

3. **AC3: Queue Display**
   - Given queue panel is open
   - When user views the list
   - Then they see: Now Playing (highlighted), Up Next items
   - And each item shows title and duration

4. **AC4: Remove from Queue**
   - Given queue panel is open
   - When user clicks remove on a queued item
   - Then item is removed from queue
   - And remaining items shift up

5. **AC5: Auto-Advance**
   - Given queue has multiple items
   - When current item finishes playing
   - Then next item auto-plays
   - And queue updates to show new "Now Playing"

6. **AC6: Clear Queue**
   - Given queue has items
   - When user clicks "Clear Queue"
   - Then all queued items are removed
   - And current playing item continues

## Tasks / Subtasks

### Task 1: Queue State in AudioService (AC: all)
- [x] 1.1 Add `queue: Track[]` to AudioService state
- [x] 1.2 Add `addToQueue(track)` method
- [x] 1.3 Add `removeFromQueue(trackId)` method
- [x] 1.4 Add `clearQueue()` method
- [x] 1.5 Add `playNext()` method for auto-advance

### Task 2: Auto-Advance Logic (AC: 5)
- [x] 2.1 Listen to 'ended' event on audio element
- [x] 2.2 Check if queue has items
- [x] 2.3 If yes, play next item and remove from queue
- [x] 2.4 If no, stop playback gracefully

### Task 3: Queue Panel UI (AC: 2, 3)
- [x] 3.1 Create `components/player/QueuePanel.tsx`
- [x] 3.2 Show in PlayerModal when Queue button clicked
- [x] 3.3 Display "Now Playing" section at top
- [x] 3.4 Display "Up Next" list below
- [x] 3.5 Show empty state when queue is empty

### Task 4: Queue Item Component (AC: 3, 4)
- [x] 4.1 Create `components/player/QueueItem.tsx`
- [x] 4.2 Show title, duration, remove button
- [x] 4.3 Highlight "Now Playing" item differently
- [x] 4.4 Add remove button with confirmation

### Task 5: Add to Queue Flow (AC: 1)
- [x] 5.1 Add "Add to Queue" to library item context menu
- [x] 5.2 Add to ExploreTab item context menu
- [x] 5.3 Show toast confirmation on add
- [x] 5.4 Update queue badge on mini-player (future)

### Task 6: Clear Queue (AC: 6)
- [x] 6.1 Add "Clear" button to queue panel header
- [x] 6.2 Confirm before clearing
- [x] 6.3 Keep current track playing

### Task 7: AudioPlayerProvider Updates (AC: all)
- [x] 7.1 Expose queue state from AudioService
- [x] 7.2 Add queue methods to context value
- [x] 7.3 Add isQueueOpen state for panel visibility

### Task 8: Testing (AC: all)
- [x] 8.1 Test add to queue
- [x] 8.2 Test remove from queue
- [x] 8.3 Test auto-advance when track ends
- [x] 8.4 Test clear queue keeps current playing

## Dev Notes

- Reference: PRD FR20-23 (Queue Management)
- Mobile app has similar feature in Epic 4 Story 4.4
- Queue is ephemeral (not persisted to database)
- Consider localStorage for session persistence (future)

## Queue State Example

```typescript
interface AudioState {
  // ... existing fields
  queue: Track[];
  queuePosition: number; // index of currently playing in original queue
}

// Methods
addToQueue(track: Track): void;
removeFromQueue(trackId: string): void;
clearQueue(): void;
playNext(): void; // called on 'ended' event
reorderQueue(fromIndex: number, toIndex: number): void; // future
```

## Technical References

- AudioService: `services/audio-service.ts`
- AudioPlayerProvider: `providers/AudioPlayerProvider.tsx`
- PlayerModal: `components/player/PlayerModal.tsx` (Story 7.12)
- PRD: FR20-23

## FR Mapping

- FR20: Auto-play next item in queue
- FR21: View and manage playback queue
- FR22: Reorder items in queue (future)
- FR23: Add items to queue from library

## Dependencies

- Story 7.7 (Global Audio Player) - COMPLETE
- Story 7.12 (Player Modal) - for Queue button integration

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
