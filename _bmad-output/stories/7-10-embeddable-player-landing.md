# Story 7.10: Embeddable Player for Landing Page

Status: done

## Story

As a visitor on the landing page,
I want to hear sample audio without logging in,
So that I can experience the magic before signing up.

## Acceptance Criteria

1. **AC1: Player Visible**
   - Given visitor is on landing page
   - When the page loads
   - Then they see an embeddable audio player with sample content
   - And player works without authentication

2. **AC2: Audio Playback**
   - Given visitor taps play on embeddable player
   - When playback starts
   - Then audio plays immediately
   - And basic controls work (play/pause, seek, volume)

3. **AC3: Call-to-Action**
   - Given visitor is enjoying the sample
   - When they want more
   - Then they see clear CTA to sign up
   - And can continue listening while signing up modal is open

4. **AC4: Navigation Stops Audio**
   - Given embeddable player is playing
   - When user navigates away from landing page
   - Then audio stops (intentional - landing page only)

## Tasks / Subtasks

### Task 1: Embeddable Player Component (AC: 1, 2)
- [x] 1.1 Create `components/marketing/EmbeddablePlayer.tsx`
- [x] 1.2 Use self-contained `<audio>` element (NOT global player)
- [x] 1.3 Design player to match landing page aesthetic
- [x] 1.4 Show sample content title

### Task 2: Player Controls (AC: 2)
- [x] 2.1 Implement play/pause button with state
- [x] 2.2 Implement progress bar with seek
- [x] 2.3 Implement volume control with mute toggle
- [x] 2.4 Show current time / total duration
- [x] 2.5 Add loading state during audio fetch

### Task 3: Sample Content (AC: 1)
- [x] 3.1 Create `components/marketing/HeroPlayer.tsx` wrapper
- [x] 3.2 Fetch sample from `GET /api/free-content`
- [x] 3.3 Gracefully hide player if no content or API error

### Task 4: Landing Page Integration (AC: 1, 3)
- [x] 4.1 Add HeroPlayer to landing page Hero section
- [x] 4.2 Position with "Try it — no signup required" label
- [x] 4.3 Style to complement existing landing page design

### Task 5: Navigation Behavior (AC: 4)
- [x] 5.1 Stop audio on component unmount
- [x] 5.2 Cleanup audio element properly

### Task 6: Testing (AC: all)
- [ ] 6.1 Write E2E test: player displays on landing - Deferred
- [ ] 6.2 Write E2E test: audio plays without auth - Deferred
- [ ] 6.3 Write E2E test: audio stops on navigation - Deferred

## Dev Notes

- **Important**: This is a SELF-CONTAINED player, not the global player
- Global player (Story 7.7) is for logged-in users navigating the app
- Embeddable player is isolated to landing page only
- Audio stops when leaving landing (this is intentional UX)
- Player hidden if no free content available or on error

## Technical References

- EmbeddablePlayer: `apps/web/components/marketing/EmbeddablePlayer.tsx`
- HeroPlayer (wrapper): `apps/web/components/marketing/HeroPlayer.tsx`
- Hero section: `apps/web/components/landing/Hero.tsx`

## FR Mapping

- FR65: Embeddable audio player on landing page

## Dependencies

- Story 7.1 (Landing Page) - for page to add player to ✅
- Story 7.9 (Free Content Admin) - for sample content to play ✅

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [ ] Code review complete
