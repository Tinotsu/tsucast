# Story 7.12: Full Player Modal

Status: done

## Story

As a web user listening to content,
I want to expand the mini-player into a full-screen player modal,
So that I have access to all playback controls like the native app experience.

## Acceptance Criteria

1. **AC1: Modal Opens from Mini-Player**
   - Given mini-player is visible with audio playing
   - When user clicks on the mini-player (not on controls)
   - Then full player modal opens as overlay
   - And audio continues playing without interruption

2. **AC2: Full Controls Available**
   - Given player modal is open
   - When user views the modal
   - Then they see: artwork area, title, source, progress bar
   - And transport controls: Skip -15s, Play/Pause, Skip +15s
   - And extra controls: Speed, Sleep Timer, Queue

3. **AC3: Skip Controls Work**
   - Given player modal is open
   - When user taps Skip -15
   - Then playback rewinds 15 seconds
   - When user taps Skip +15
   - Then playback advances 15 seconds

4. **AC4: Sleep Timer Works**
   - Given player modal is open
   - When user taps Sleep Timer
   - Then they see options: 15 min, 30 min, 45 min, 1 hour, End of article
   - When timer expires
   - Then audio pauses automatically

5. **AC5: Modal Closes Correctly**
   - Given player modal is open
   - When user taps close button or swipes down
   - Then modal closes
   - And mini-player remains visible
   - And audio continues playing

6. **AC6: Keyboard Navigation**
   - Given player modal is open
   - When user presses Escape
   - Then modal closes
   - When user presses Space
   - Then playback toggles

## Tasks / Subtasks

### Task 1: PlayerModal Component (AC: 1, 2, 5)
- [x] 1.1 Create `components/player/PlayerModal.tsx`
- [x] 1.2 Use React Portal to render to document.body
- [x] 1.3 Add close button (X) in top-right corner
- [x] 1.4 Add artwork placeholder area (centered, 245x245px)
- [x] 1.5 Add title and source text below artwork
- [x] 1.6 Add seekable progress bar with time display

### Task 2: Transport Controls (AC: 3)
- [x] 2.1 Create Skip Back button (-15 seconds)
- [x] 2.2 Create large Play/Pause button (72px)
- [x] 2.3 Create Skip Forward button (+15 seconds)
- [x] 2.4 Wire to AudioService skipBack/skipForward methods

### Task 3: Sleep Timer (AC: 4)
- [x] 3.1 Create `components/player/SleepTimer.tsx`
- [x] 3.2 Add timer options: 15, 30, 45, 60 min, End of article
- [x] 3.3 Implement countdown logic in AudioService
- [x] 3.4 Show active timer indicator in modal
- [x] 3.5 Auto-pause when timer expires

### Task 4: Extra Controls Row (AC: 2)
- [x] 4.1 Add Speed control (reuse existing)
- [x] 4.2 Add Sleep Timer button
- [x] 4.3 Add Queue button (placeholder for Story 7.15)
- [x] 4.4 Add Text/Transcript button (future feature placeholder)

### Task 5: Integration (AC: 1, 5, 6)
- [x] 5.1 Add isModalOpen state to AudioPlayerProvider
- [x] 5.2 Wire GlobalMiniPlayer click to open modal
- [x] 5.3 Add keyboard shortcuts (Escape, Space)
- [x] 5.4 Add swipe-down gesture to close (mobile)

### Task 6: Styling & Animation (AC: all)
- [x] 6.1 Apply dark theme CSS variables
- [x] 6.2 Add slide-up animation on open
- [x] 6.3 Add slide-down animation on close
- [x] 6.4 Ensure responsive layout (mobile/desktop)

### Task 7: Testing (AC: all)
- [x] 7.1 Test modal open/close lifecycle
- [x] 7.2 Test skip controls update position correctly
- [x] 7.3 Test sleep timer pauses audio
- [x] 7.4 Test keyboard navigation

## Dev Notes

- Reference: `tech-spec-global-audio-player.md` lines 270-322
- Use `createPortal` from React DOM for modal overlay
- Modal should have `z-50` to appear above everything
- Background should be `bg-[var(--background)]` (full coverage)
- Reuse existing AudioService methods where possible
- Sleep timer state can be stored in AudioService or separate timer service

## Technical References

- AudioService: `services/audio-service.ts`
- AudioPlayerProvider: `providers/AudioPlayerProvider.tsx`
- GlobalMiniPlayer: `components/player/GlobalMiniPlayer.tsx`
- Tech Spec: `_bmad-output/planning-artifacts/tech-spec-global-audio-player.md`

## FR Mapping

- FR10: Play and pause audio
- FR11: Skip forward/backward by increments
- FR13: Sleep timer to auto-pause
- FR17: Seek/scrub to any position
- FR18: See current position and duration

## Dependencies

- Story 7.7 (Global Persistent Audio Player) - COMPLETE

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
