# Story 7.7: Global Persistent Audio Player

Status: done

## Story

As a web user navigating the site,
I want audio to continue playing when I switch pages,
So that I have the same seamless experience as SoundCloud or Spotify Web.

## Acceptance Criteria

1. **AC1: Cross-Page Persistence**
   - Given user is playing audio on any page
   - When they navigate to a different page
   - Then audio continues playing without interruption
   - And mini-player remains visible

2. **AC2: Background Audio (Mobile Web)**
   - Given user locks their phone screen (mobile web)
   - When audio is playing
   - Then audio continues in background
   - And lock screen controls work via Media Session API

3. **AC3: Tab Switch Persistence**
   - Given user switches browser tabs
   - When audio is playing
   - Then audio continues playing
   - And browser tab shows "Playing" indicator

4. **AC4: Position Restoration**
   - Given user closes the browser
   - When they reopen the site
   - Then their last playback position is restored from localStorage

## Tasks / Subtasks

### Task 1: AudioService Singleton (AC: 1, 2, 3)
- [x] 1.1 Create `services/audio-service.ts` with singleton pattern
- [x] 1.2 Implement single `<audio>` element that never unmounts
- [x] 1.3 Implement `play(url)`, `pause()`, `seek(time)` methods
- [x] 1.4 Implement `getState()` returning `{ isPlaying, currentTime, duration, src }`
- [x] 1.5 Add event listeners for audio events (timeupdate, ended, error)

### Task 2: AudioPlayerProvider Context (AC: 1)
- [x] 2.1 Create `providers/AudioPlayerProvider.tsx`
- [x] 2.2 Wrap entire app with provider in root layout
- [x] 2.3 Expose audio state and controls via context
- [x] 2.4 Create `hooks/useAudioPlayer.ts` for consuming context

### Task 3: Media Session API (AC: 2, 3)
- [x] 3.1 Integrate Media Session API for browser/OS controls
- [x] 3.2 Set metadata (title, artist, artwork) on track change
- [x] 3.3 Handle media session actions (play, pause, seekforward, seekbackward)
- [x] 3.4 Update document title with playing indicator

### Task 4: Position Persistence (AC: 4)
- [x] 4.1 Save playback position to localStorage on timeupdate (throttled)
- [x] 4.2 Restore position from localStorage on page load
- [x] 4.3 Sync position to server periodically (every 30s) - SKIPPED: No server sync endpoint exists
- [x] 4.4 Handle position restoration when returning to previously played item

### Task 5: Global Mini-Player (AC: 1)
- [x] 5.1 Create `components/player/GlobalMiniPlayer.tsx`
- [x] 5.2 Show mini-player when audio is playing (any page)
- [x] 5.3 Implement play/pause toggle on mini-player
- [x] 5.4 Implement tap-to-expand to full player
- [x] 5.5 Position mini-player above navigation

### Task 6: Testing (AC: all)
- [x] 6.1 Write unit tests for AudioService singleton
- [x] 6.2 Write integration tests for AudioPlayerProvider
- [ ] 6.3 Write E2E tests for cross-page persistence - Deferred to E2E test pass
- [ ] 6.4 Manual test: lock screen controls on mobile web - Manual testing required

## Dev Notes

- **Critical**: Audio element must be created once and never destroyed
- Use `AudioService.getInstance()` pattern - no React state for the actual audio
- React context only exposes the state, doesn't manage the audio element
- Media Session API enables lock screen controls on mobile browsers
- localStorage key format: `tsucast-playback-position-{trackId}`
- Throttle position saves to every 5 seconds to reduce writes
- Mini-player positioned fixed at bottom of screen

## Technical References

- Media Session API: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
- Similar to: SoundCloud web player, Spotify web player
- Architecture ref: `_bmad-output/planning-artifacts/architecture-v2.md` (Web Playback Capabilities section)

## FR Mapping

- FR66: Web audio continues when page/tab changes
- FR67: Web audio continues when screen locked (mobile browsers)
- FR68: Lock screen controls work via Media Session API

## Dependencies

None - this is foundational for web audio.

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [ ] Code review complete
