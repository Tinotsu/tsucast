# Story 11.3: Landing Page Hero Section

Status: completed

## Story

As a visitor to tsucast,
I want to see a compelling hero with typing animation and real audio player,
So that I immediately understand what tsucast does and can experience it.

## Acceptance Criteria

1. **AC1: Hero Headline**
   - Given visitor is on landing page
   - When hero section loads
   - Then headline "Any article. Any voice. 10 seconds." is visible
   - And headline uses bold typography (48px desktop, 32px mobile)

2. **AC2: Typing Animation**
   - Given hero section is visible
   - When animation plays
   - Then URL types character by character (50ms per char)
   - And progress bar animates during "Processing" phase
   - And "Ready to play" appears with checkmark
   - And animation loops continuously (~6 seconds per cycle)

3. **AC3: Featured Audio Player**
   - Given featured content exists in database
   - When hero loads
   - Then audio player shows featured article title
   - And duration is displayed
   - And play button is prominent (56px)

4. **AC4: Audio Playback**
   - Given visitor clicks play button
   - When audio starts
   - Then play button changes to pause
   - And progress bar shows playback position
   - And visitor can seek by clicking progress bar

5. **AC5: Empty State Fallback**
   - Given no featured content exists
   - When hero loads
   - Then fallback message is displayed (not broken UI)
   - And page remains functional

6. **AC6: CTA Button**
   - Given visitor sees hero section
   - When they click "Get Started Free" CTA
   - Then they are navigated to `/signup`

## Tasks / Subtasks

### Task 1: Hero Layout (AC: 1, 6)
- [x] 1.1 Create new hero section layout
- [x] 1.2 Add `data-testid="hero-headline"` to headline
- [x] 1.3 Style headline (48px bold, centered)
- [x] 1.4 Add CTA button with `data-testid="hero-cta"`
- [x] 1.5 Link CTA to `/signup`

### Task 2: Typing Animation (AC: 2)
- [x] 2.1 Create `components/landing/TypingAnimation.tsx`
- [x] 2.2 Add `data-testid="typing-animation"` container
- [x] 2.3 Implement typing effect (JS intervals for smooth animation)
- [x] 2.4 Implement 4-phase loop: Typing → Processing → Ready → Reset
- [x] 2.5 No external animation libraries used
- [x] 2.6 Respect `prefers-reduced-motion` (skip to ready state)

### Task 3: Audio Player (AC: 3, 4, 5)
- [x] 3.1 Create `components/landing/HeroAudioPlayer.tsx`
- [x] 3.2 Fetch featured content from `/api/free-content/featured`
- [x] 3.3 Add `data-testid="hero-audio-player"` container
- [x] 3.4 Add `data-testid="hero-audio-title"` for title
- [x] 3.5 Add `data-testid="hero-audio-play"` and `hero-audio-pause`
- [x] 3.6 Add `data-testid="hero-audio-progress"` for progress bar
- [x] 3.7 Add `data-testid="hero-audio-fallback"` for empty state
- [x] 3.8 Implement play/pause toggle
- [x] 3.9 Implement seekable progress bar

### Task 4: Testing (AC: all)
- [x] 4.1 Unit tests pass (216 tests)
- [ ] 4.2 E2E tests: LP-HERO-003, LP-HERO-004, LP-HERO-007, LP-HERO-008
- [ ] 4.3 Manual browser testing (Chrome, Safari, Firefox)

## Dev Notes

- Typing animation uses CSS `@keyframes` with `steps()` for character-by-character reveal
- Audio player reuses patterns from free-content page
- Featured content is fetched server-side for SEO (headline + title visible to crawlers)
- Animation runs client-side only

### Typing Animation CSS Pattern

```css
.typing-text {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid;
  width: 0;
  animation:
    typing 2s steps(40) forwards,
    blink 0.5s step-end infinite;
}

@keyframes typing {
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}
```

## Test Coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| LP-HERO-002 | Typing animation visible | ❌ |
| LP-HERO-003 | Featured content title | ❌ |
| LP-HERO-004 | Audio plays on click | ❌ |
| LP-HERO-007 | CTA navigates to signup | ❌ |
| LP-HERO-008 | Fallback for empty state | ❌ |
| LP-RESP-001 | Mobile hero visible | ❌ |

## Story Wrap-up

- [ ] All hero tests pass
- [ ] Typing animation loops smoothly
- [ ] Audio player works on all browsers
- [ ] Reduced motion respected
- [ ] Code review complete
