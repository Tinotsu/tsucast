# Story 7.3: Web Audio Generation & Playback

Status: done

## Story

As a developer testing the backend,
I want to generate and play audio via web,
So that I can test TTS/parsing without mobile builds.

## Acceptance Criteria

1. **AC1: URL Input & Generation**
   - Given authenticated user is on web app
   - When they paste a URL
   - Then content is extracted using same API as mobile
   - And audio is generated using same TTS pipeline

2. **AC2: Audio Playback**
   - Given audio generation completes
   - When user clicks play
   - Then audio plays using HTML5 audio element
   - And basic controls work (play, pause, seek)

3. **AC3: Library View**
   - Given user views their library on web
   - When library loads
   - Then they see same items as mobile app
   - And can play any item

4. **AC4: Browser Limitations**
   - Given user is on web
   - When they switch browser tabs
   - Then audio may pause (browser limitation)
   - And this is expected behavior (documented)

## Tasks / Subtasks

### Task 1: Generate Page (AC: 1)
- [x] 1.1 Create `app/(app)/generate/page.tsx`
- [x] 1.2 Create `components/app/UrlInput.tsx` for URL entry
- [x] 1.3 Create `components/app/VoiceSelector.tsx` for voice selection
- [x] 1.4 Implement API call to `/api/generate`

### Task 2: Audio Player (AC: 2)
- [x] 2.1 Create `components/app/WebPlayer.tsx` with HTML5 audio
- [x] 2.2 Implement play/pause controls
- [x] 2.3 Implement seek/progress bar
- [x] 2.4 Implement playback speed control
- [x] 2.5 Implement volume/mute controls

### Task 3: Library Page (AC: 3)
- [x] 3.1 Create `app/(app)/library/page.tsx`
- [x] 3.2 Fetch library items from API
- [x] 3.3 Display items with title, duration, progress
- [x] 3.4 Implement play from library

### Task 4: Dashboard & Navigation (AC: all)
- [x] 4.1 Create `app/(app)/dashboard/page.tsx`
- [x] 4.2 Create `components/app/AppHeader.tsx`
- [x] 4.3 Add navigation between app pages

## Dev Notes

- HTML5 audio element for playback
- Same API endpoints as mobile app
- Web player is simpler than mobile (no background playback)
- Library synced via Supabase

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
