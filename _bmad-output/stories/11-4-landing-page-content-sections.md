# Story 11.4: Landing Page Content Sections

Status: in-progress

## Story

As a visitor to tsucast,
I want to see free samples, features, founder story, and pricing,
So that I understand the product value and am convinced to sign up.

## Acceptance Criteria

1. **AC1: Free Samples Section**
   - Given free content exists (non-featured)
   - When section loads
   - Then "Try These Free" heading is visible
   - And 3 sample cards are displayed horizontally
   - And each card has play button, title, duration
   - And clicking play starts audio

2. **AC2: Features Section**
   - Given features section is visible
   - When visitor scrolls to it
   - Then 6 feature cards are displayed in grid (2x3 desktop)
   - And cards fade in with stagger animation
   - And "Lightning Fast" shows animated counter
   - And "Works Anywhere" shows rotating content types

3. **AC3: Voice Tester (Interactive)**
   - Given visitor is in features section
   - When they click a voice chip (Adam/Sarah/Michael)
   - Then voice is selected (highlighted)
   - And clicking "Play Sample" plays that voice's audio

4. **AC4: Founder Story Section**
   - Given visitor scrolls to founder section
   - When section loads
   - Then founder photo is visible (circular, 120px)
   - And "Why I Built tsucast" heading is shown
   - And quote text is displayed

5. **AC5: Pricing Section**
   - Given visitor scrolls to pricing
   - When section loads
   - Then 4 pricing cards are visible (Coffee, Kebab, Pizza, Feast)
   - And "Popular" badge is on Kebab
   - And "Best Value" badge is on Feast
   - And clicking Buy redirects to /login

6. **AC6: Responsive Layout**
   - Given visitor is on mobile (375px)
   - When viewing sections
   - Then free samples scroll horizontally
   - And features stack in single column
   - And pricing cards scroll horizontally

## Tasks / Subtasks

### Task 1: Free Samples Section (AC: 1)
- [x] 1.1 Create `components/landing/FreeSamples.tsx`
- [x] 1.2 Fetch non-featured free content from API
- [x] 1.3 Add `data-testid="free-samples-section"`
- [x] 1.4 Add `data-testid="free-sample-card"` for each card
- [x] 1.5 Add `data-testid="free-sample-play"` and `free-sample-pause`
- [x] 1.6 Implement horizontal scroll on mobile
- [x] 1.7 Implement card audio playback

### Task 2: Features Section (AC: 2)
- [ ] 2.1 Create `components/landing/Features.tsx` (new design)
- [ ] 2.2 Add `data-testid="features-grid"` container
- [ ] 2.3 Create 6 feature cards with icons
- [ ] 2.4 Implement scroll-triggered fade-in animation
- [ ] 2.5 Create "Lightning Fast" counter animation
- [ ] 2.6 Create "Works Anywhere" text carousel
- [ ] 2.7 Create "Sleep Timer" moon/stars animation

### Task 3: Voice Tester (AC: 3)
- [ ] 3.1 Create `components/landing/VoiceTester.tsx`
- [ ] 3.2 Add voice chips: `data-testid="voice-chip-adam"`, etc.
- [ ] 3.3 Add `data-selected="true"` attribute when selected
- [ ] 3.4 Add `data-testid="voice-sample-play"` button
- [ ] 3.5 Add `data-testid="voice-sample-playing"` indicator
- [ ] 3.6 Fetch voice samples from `/api/voices/samples`
- [ ] 3.7 Implement audio playback for selected voice

### Task 4: Founder Story (AC: 4) — REMOVED
- [x] ~~4.1 Convert `/tinophoto.jpg` to `/public/images/founder.webp`~~ — Removed per user request
- [x] ~~4.2 Create `components/landing/FounderStory.tsx`~~ — Created but not used
- [x] ~~4.3 Add circular photo with border~~
- [x] ~~4.4 Add quote text (italic) and signature~~
- [x] ~~4.5 Import FounderStory in page.tsx~~ — Removed per user request (2026-01-29)

### Task 5: Pricing Section (AC: 5)
- [ ] 5.1 Refactor `components/landing/Pricing.tsx`
- [ ] 5.2 Add `data-testid="pricing-section"`
- [ ] 5.3 Add `data-testid="pricing-card"` for each card
- [ ] 5.4 Add specific testids: `pricing-card-coffee`, etc.
- [ ] 5.5 Add `data-testid="pricing-buy-coffee"`, etc.
- [ ] 5.6 Add "Popular" and "Best Value" badges
- [ ] 5.7 Link buy buttons to `/login`

### Task 6: Footer Section
- [ ] 6.1 Refactor `components/landing/Footer.tsx`
- [ ] 6.2 Add `data-testid="footer-privacy"` link
- [ ] 6.3 Ensure 3-column layout on desktop
- [ ] 6.4 Stacked layout on mobile

### Task 7: Testing (AC: all)
- [ ] 7.1 Run E2E tests: LP-FREE-*, LP-FEAT-*, LP-PRICE-*
- [ ] 7.2 Test voice tester audio playback
- [ ] 7.3 Test responsive layouts

## Dev Notes

- Free samples uses same audio player pattern as hero
- Voice samples are pre-generated MP3s stored in R2
- Animations use CSS `animation-timeline: view()` with fallback
- Founder photo needs WebP conversion: `convert tinophoto.jpg -resize 240x240 founder.webp`

## Test Coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| LP-FREE-001 | Free samples load | ❌ |
| LP-FREE-004 | Sample audio plays | ❌ |
| LP-FEAT-003 | Voice chip selection | ❌ |
| LP-FEAT-004 | Voice sample plays | ❌ |
| LP-PRICE-001 | 4 pricing cards | ❌ |
| LP-PRICE-004 | Buy redirects to login | ❌ |
| LP-FOOTER-002 | Privacy link works | ❌ |

## Story Wrap-up

- [ ] All section tests pass
- [ ] Animations work smoothly
- [ ] Voice tester functional
- [ ] Mobile responsive verified
- [ ] Code review complete
