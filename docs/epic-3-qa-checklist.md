# Epic 3: Audio Generation & Playback - QA Checklist

## Overview
This checklist covers all features implemented in Epic 3. Test on physical iOS and Android devices for best results.

---

## Story 3-1: Voice Selection & Preview

### Voice Display
- [ ] All 4 voices are displayed (Alex, Sarah, James, Emma)
- [ ] Each voice shows: name, description, gender badge, style tag
- [ ] Voice cards are horizontally scrollable
- [ ] Selected voice has visual indicator (checkmark/highlight)

### Voice Preview
- [ ] Tap preview button plays audio sample
- [ ] Preview audio plays correctly
- [ ] Tap same voice again stops preview
- [ ] Switching to another voice stops previous preview
- [ ] Preview works even without internet (uses local assets or handles error gracefully)

### Voice Persistence
- [ ] Selected voice persists after closing and reopening app
- [ ] Default voice (Alex) is selected on first launch

---

## Story 3-2: Streaming Audio Generation

### API Generation Flow
- [ ] POST `/api/generate` with valid URL and voiceId returns:
  - `extraction_only` status when TTS not configured
  - `processing` status with cacheId when generation starts
  - `ready` status with audioUrl when complete
- [ ] Polling `/api/generate/status/:id` returns correct status
- [ ] Cache hit returns cached audio immediately
- [ ] Failed URLs return appropriate error codes

### Error Handling
- [ ] Paywall detected -> PAYWALL_DETECTED error
- [ ] 404 pages -> FETCH_FAILED error
- [ ] Non-article pages -> PARSE_FAILED error
- [ ] Too long articles -> ARTICLE_TOO_LONG error
- [ ] PDF too large -> PDF_TOO_LARGE error
- [ ] Image-only PDF -> IMAGE_ONLY_PDF error

---

## Story 3-3: Player Screen & Controls

### Player Screen Layout
- [ ] Player screen opens as modal (slides up from bottom)
- [ ] Shows: album art area, track title, progress bar, controls
- [ ] Can swipe down to dismiss
- [ ] Back button works correctly

### Play/Pause
- [ ] Play button shows play icon when paused
- [ ] Play button shows pause icon when playing
- [ ] Tap toggles between play and pause
- [ ] Loading indicator shows when buffering

### Skip Forward/Backward
- [ ] Skip forward advances 30 seconds
- [ ] Skip backward rewinds 15 seconds
- [ ] Buttons show "30" and "15" labels
- [ ] Skipping past end doesn't crash

### Progress Bar
- [ ] Progress bar shows current position
- [ ] Progress updates in real-time while playing
- [ ] Can drag slider to seek
- [ ] Time labels show current position and remaining time
- [ ] Seeking works while playing and paused

---

## Story 3-4: Background Audio & Lock Screen

### Background Playback
- [ ] Audio continues when app is backgrounded (home button)
- [ ] Audio continues when phone is locked
- [ ] Audio continues for 30+ minutes in background
- [ ] No stuttering or interruptions

### Lock Screen Controls (iOS)
- [ ] Now Playing info shows on lock screen
- [ ] Play/pause button works
- [ ] Skip forward/backward buttons work
- [ ] Progress scrubber works
- [ ] Track title and artwork display correctly

### Notification Controls (Android)
- [ ] Media notification appears when playing
- [ ] Play/pause button works
- [ ] Skip buttons work
- [ ] Tapping notification opens app

### Bluetooth/Headphone Controls
- [ ] Play/pause works from headphone controls
- [ ] Skip works from headphone controls (if supported)
- [ ] Disconnecting headphones pauses audio
- [ ] Car Bluetooth controls work

### Audio Interruptions
- [ ] Incoming phone call pauses audio
- [ ] Audio resumes after call ends
- [ ] Other apps requesting audio (Siri, etc.) pauses correctly

---

## Story 3-5: Playback Speed Control

### Speed Options
- [ ] Speed button shows current speed (e.g., "1x")
- [ ] Tap opens speed selector modal
- [ ] All 7 options shown: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
- [ ] Current speed has checkmark indicator
- [ ] "1x (Normal)" label for 1x speed

### Speed Selection
- [ ] Selecting speed changes playback immediately
- [ ] Audio pitch sounds natural at all speeds
- [ ] Speed indicator updates on button

### Speed Persistence
- [ ] Speed persists after closing player
- [ ] Speed persists after restarting app
- [ ] Speed applies to new tracks

---

## Story 3-6: Sleep Timer

### Timer Options
- [ ] Sleep timer button shows moon icon
- [ ] Tap opens timer selector modal
- [ ] All 6 options shown: 15 min, 30 min, 45 min, 1 hour, End of article, Off
- [ ] "Off" option in different color (red)

### Timer Activation
- [ ] Selecting timer shows active indicator (filled moon)
- [ ] Badge shows remaining minutes
- [ ] Timer indicator text appears below controls
- [ ] Timer counts down correctly

### Timer Completion
- [ ] Audio pauses when timer reaches zero
- [ ] Volume fades out gently before pause
- [ ] Timer indicator disappears after completion
- [ ] Can start new timer after completion

### Timer Cancellation
- [ ] Selecting "Off" cancels timer
- [ ] Timer indicator disappears
- [ ] Badge on moon icon disappears

### End of Article
- [ ] "End of article" option shows dot indicator
- [ ] Audio pauses when track ends
- [ ] Works correctly (doesn't pause prematurely)

### Background Timer
- [ ] Timer continues when app is backgrounded
- [ ] Timer completes correctly in background
- [ ] Audio pauses even when phone is locked

---

## Test Data

### Test URLs for Generation
- Paul Graham essay: `https://www.paulgraham.com/writing44.html`
- Wikipedia article: `https://en.wikipedia.org/wiki/Podcast`
- BBC article: `https://www.bbc.com/news/technology-67988517`

### Known Limitations
- Medium articles may trigger paywall detection
- Some sites with aggressive anti-scraping may fail
- Very long articles (>15,000 words) will be rejected

---

## Test Commands

```bash
# Run mobile tests
cd apps/mobile && npm test

# Run API tests
cd apps/api && npm test

# Typecheck both apps
cd apps/mobile && npm run typecheck
cd apps/api && npm run typecheck

# Build for testing
cd apps/mobile && npx expo prebuild
```

---

## Sign-off

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Voice Selection | [ ] | [ ] | |
| Voice Preview | [ ] | [ ] | |
| Voice Persistence | [ ] | [ ] | |
| Player Controls | [ ] | [ ] | |
| Progress/Seek | [ ] | [ ] | |
| Background Audio | [ ] | [ ] | |
| Lock Screen | [ ] | [ ] | |
| Bluetooth | [ ] | [ ] | |
| Interruptions | [ ] | [ ] | |
| Playback Speed | [ ] | [ ] | |
| Speed Persistence | [ ] | [ ] | |
| Sleep Timer | [ ] | [ ] | |
| End of Article | [ ] | [ ] | |

**Tested by:** __________________ **Date:** __________________
