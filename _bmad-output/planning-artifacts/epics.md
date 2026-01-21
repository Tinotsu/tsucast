---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
  - path: '_bmad-output/planning-artifacts/architecture-v2.md'
    type: 'architecture'
  - path: '_bmad-output/planning-artifacts/ux-design-specification.md'
    type: 'ux-design'
date: 2026-01-20
lastEdited: 2026-01-21
editHistory:
  - date: "2026-01-21"
    changes: "Added Epic 7: Web Application (OPTIONAL) with 6 stories covering marketing landing page, web auth, audio playback, subscription testing, and admin panel"
project: tsucast
---

# tsucast - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for tsucast, decomposing the requirements from the PRD, Architecture v2.2, and UX Design Specification into implementable stories.

**Architecture:** Hybrid - Supabase (Auth + DB) + Hetzner VPS + Dokploy + Cloudflare R2
**Mobile:** Expo SDK 53 + React Native + NativeWind
**Core Promise:** Paste URL → Audio in < 10 seconds

## Requirements Inventory

### Functional Requirements

| FR | Description | Category |
|----|-------------|----------|
| FR1 | User can paste a URL to convert an article to audio | Content Input |
| FR2 | User can paste a PDF document to convert to audio | Content Input |
| FR3 | System extracts clean article content from HTML pages | Content Processing |
| FR4 | System extracts text content from PDF documents | Content Processing |
| FR5 | User can report a URL that failed to parse correctly | Error Handling |
| FR6 | User can select from available AI voice options | Voice Selection |
| FR7 | System generates audio from extracted text using selected voice | Audio Generation |
| FR8 | System streams audio progressively (start while rest generates) | Streaming |
| FR9 | System delivers first audio within 10 seconds of request | Performance |
| FR10 | User can play and pause audio | Playback |
| FR11 | User can skip forward/backward by increments | Playback |
| FR12 | User can adjust playback speed (0.5x to 2x) | Playback |
| FR13 | User can set a sleep timer to auto-pause | Playback |
| FR14 | User can control playback from device lock screen | Background |
| FR15 | User can control playback via Bluetooth/car audio | Background |
| FR16 | System continues audio playback when app is backgrounded | Background |
| FR17 | User can seek/scrub to any position in timeline | Playback |
| FR18 | User can see current playback position and total duration | Playback |
| FR19 | System remembers playback position when user leaves and returns | Progress |
| FR20 | System auto-plays next item in library/queue | Queue |
| FR21 | User can view and manage a playback queue | Queue |
| FR22 | User can reorder items in the queue | Queue |
| FR23 | User can add items to queue from library | Queue |
| FR24 | User can view a library of previously generated podcasts | Library |
| FR25 | User can play any item from their library | Library |
| FR26 | User can delete items from their library | Library |
| FR27 | User can see playback progress for each library item | Library |
| FR28 | User can create playlists | Playlists |
| FR29 | User can add items to a playlist | Playlists |
| FR30 | User can remove items from a playlist | Playlists |
| FR31 | User can reorder items within a playlist | Playlists |
| FR32 | User can rename a playlist | Playlists |
| FR33 | User can delete a playlist | Playlists |
| FR34 | User can play an entire playlist in sequence | Playlists |
| FR35 | User can create an account | Authentication |
| FR36 | User can log in to an existing account | Authentication |
| FR37 | User can log out | Authentication |
| FR38 | User's library syncs across devices when logged in | Sync |
| FR39 | Free user has a daily limit on articles converted | Monetization |
| FR40 | System displays remaining daily limit to user | Monetization |
| FR41 | System shows upgrade prompt when free user hits limit | Monetization |
| FR42 | User can upgrade to paid plan | Monetization |
| FR43 | Paid user has higher article limit per plan | Monetization |
| FR44 | System processes payments securely | Payments |
| FR45 | System displays clear error message when URL parsing fails | Error Handling |
| FR46 | User can report parsing failures for improvement | Error Handling |
| FR47 | System handles network errors gracefully | Error Handling |

### Non-Functional Requirements

| NFR | Description | Category |
|-----|-------------|----------|
| NFR1 | Time to first audio chunk < 10 seconds | Performance |
| NFR2 | Streaming continuity while rest generates | Performance |
| NFR3 | Progress feedback during generation | UX |
| NFR4 | App launch time < 3 seconds | Performance |
| NFR5 | Library load time < 2 seconds for 100 items | Performance |
| NFR6 | Secure authentication (OAuth + email/password) | Security |
| NFR7 | PCI-compliant payments via RevenueCat | Security |
| NFR8 | HTTPS for all API communication | Security |
| NFR9 | Secure token storage on device | Security |
| NFR10 | Support 1,000 concurrent TTS requests | Scalability |
| NFR11 | Handle 10x user growth without re-architecture | Scalability |
| NFR12 | Queue system for high-load periods | Scalability |
| NFR13 | API uptime 99% availability | Reliability |
| NFR14 | Graceful degradation when TTS fails | Reliability |
| NFR15 | Resume playback after network interruption | Reliability |
| NFR16 | Integration with quality AI voice provider | Integration |
| NFR17 | RevenueCat integration for payments | Integration |
| NFR18 | Reliable HTML/PDF extraction | Integration |

### Additional Requirements

**From Architecture v2.2:**
- Starter template: Expo SDK 53 with file-based routing (Expo Router)
- Monorepo: Turborepo with apps/mobile and apps/api
- VPS deployment via Dokploy on Hetzner (auto SSL, zero-downtime deploys)
- Health endpoint (`GET /health`) for monitoring
- Request timeout middleware (120s) for TTS calls
- Structured logging with Pino
- URL normalization before hashing for cache deduplication
- Race condition prevention via `status='generating'` database lock
- Word count limit validation (15,000 words max)
- Cron jobs via node-cron (cleanup failed generations, orphan R2 files)

**From UX Design:**
- 3.5 screen design: Add, Player, Library + persistent mini-player
- Autumn Magic color palette (warm amber/brown tones)
- Zero onboarding - self-explanatory UI
- Background-first design (lock screen is primary interface)
- Voice selection visible but optional (defaults work)
- Graceful error handling (dismissible, not blocking)
- Dark mode following system preference

## FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR35 | Epic 1 | Story 1.1 (Email Auth) |
| FR36 | Epic 1 | Story 1.2 (Social Auth) |
| FR37, FR38 | Epic 1 | Story 1.3 (Session Management) |
| FR1 | Epic 2 | Story 2.1 (URL Input) |
| FR3 | Epic 2 | Story 2.2 (HTML Extraction) |
| FR2, FR4 | Epic 2 | Story 2.3 (PDF Extraction) |
| FR5 | Epic 2 | Story 2.4 (Error Reporting) |
| FR6, FR9 | Epic 3 | Story 3.1 (Voice Selection & Preview) |
| FR7, FR8 | Epic 3 | Story 3.2 (Audio Generation) |
| FR10, FR11, FR17, FR18 | Epic 3 | Story 3.3 (Player Controls) |
| FR14, FR15, FR16 | Epic 3 | Story 3.4 (Background Audio) |
| FR12 | Epic 3 | Story 3.5 (Speed Control) |
| FR13 | Epic 3 | Story 3.6 (Sleep Timer) |
| FR24, FR25, FR26, FR27 | Epic 4 | Story 4.1 (Library View) |
| FR19 | Epic 4 | Story 4.2 (Progress Tracking) |
| FR28-34 | Epic 4 | Story 4.3 (Playlist Management) |
| FR20, FR21, FR22, FR23 | Epic 4 | Story 4.4 (Queue Management) |
| FR39 | Epic 5 | Story 5.1 (Free Tier) |
| FR40, FR41 | Epic 5 | Story 5.2 (Limit Display & Upgrade) |
| FR42, FR43, FR44 | Epic 5 | Story 5.3 (Payment Integration) |
| FR45, FR46, FR47 | Epic 6 | Story 6.1 (Error Handling) |
| FR48, FR49, FR50 | Epic 7 | Story 7.1 (Marketing Landing Page) |
| FR51 | Epic 7 | Story 7.2 (Web Authentication Flow) |
| FR52, FR53, FR54 | Epic 7 | Story 7.3 (Web Audio Generation & Playback) |
| FR55 | Epic 7 | Story 7.4 (Web Subscription Testing) |
| FR56, FR57 | Epic 7 | Story 7.5 (Admin Panel - User Management) |
| FR58, FR59 | Epic 7 | Story 7.6 (Admin Panel - Content Moderation) |

## Epic List

| Epic | Title | Goal | Stories |
|------|-------|------|---------|
| 1 | User Authentication | Users can securely register, login, and access tsucast across devices | 3 |
| 2 | Content Ingestion | Users can paste any URL and have content extracted for audio | 4 |
| 3 | Audio Generation & Playback | Users experience the magic - paste URL, hear audio in < 10 seconds | 6 |
| 4 | Library & Organization | Users have a personal podcast library with progress tracking | 4 |
| 5 | Monetization & Subscriptions | Business model with free/paid tiers and App Store payments | 3 |
| 6 | Production Readiness | App handles errors gracefully and meets launch quality standards | 4 |
| 7 | Web Application (OPTIONAL) | Next.js web app for marketing, backend testing, and admin | 6 |
| 8 | MVP Launch Preparation | Final App Store requirements and payment integration | 1 |

**Implementation Order:** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6 → Epic 8
**MVP Milestone:** Epics 1-6 + Epic 8 required for launch
**Optional Post-MVP:** Epic 7 (Web Application) - not blocking mobile launch

---

## Epic 1: User Authentication & Session Management

Users can securely register, login, and access tsucast across devices with their library synced.

### Story 1.1: Email Registration & Login

As a new user,
I want to create an account with my email,
So that I can save my generated podcasts and access them across devices.

**Acceptance Criteria:**

**Given** user opens the app for the first time
**When** they are not logged in
**Then** they see a login screen with email/password fields
**And** option to create new account

**Given** user wants to create an account
**When** they enter a valid email and password (min 8 chars)
**Then** account is created via Supabase Auth
**And** user is automatically logged in
**And** user_profiles row is created via database trigger

**Given** user has an existing account
**When** they enter correct email and password
**Then** they are logged in
**And** redirected to the Add screen

**Given** user enters incorrect credentials
**When** they attempt to login
**Then** they see clear error message: "Invalid email or password"
**And** can retry

**Technical Notes:**
- Initialize Expo project with file-based routing (Expo Router)
- Set up Supabase client in `services/supabase.ts`
- Create `app/(auth)/login.tsx` and `app/(auth)/signup.tsx`
- Create `hooks/useAuth.ts` for auth state management
- Run Supabase migration to create `user_profiles` table with trigger

---

### Story 1.2: Social Authentication (Apple & Google)

As a user who prefers social login,
I want to sign in with Apple or Google,
So that I don't need to remember another password.

**Acceptance Criteria:**

**Given** user is on login screen
**When** they tap "Continue with Apple"
**Then** Apple OAuth flow initiates
**And** on success, user is logged in

**Given** user is on login screen
**When** they tap "Continue with Google"
**Then** Google OAuth flow initiates
**And** on success, user is logged in

**Given** user signs in with social account
**When** authentication completes
**Then** user_profiles row is created (if first login)
**And** user is redirected to Add screen

**Technical Notes:**
- Configure Apple OAuth in Supabase Dashboard
- Configure Google OAuth in Supabase Dashboard
- Add `expo-apple-authentication` for iOS
- Add `expo-auth-session` for Google OAuth
- Create `components/auth/SocialButton.tsx`

---

### Story 1.3: Session Management & Logout

As a logged-in user,
I want my session to persist and sync across devices,
So that I don't need to log in repeatedly.

**Acceptance Criteria:**

**Given** user is logged in
**When** they close and reopen the app
**Then** they remain logged in
**And** session is restored from secure storage

**Given** user is logged in on multiple devices
**When** they use tsucast
**Then** their library syncs via Supabase
**And** playback positions sync (last-write-wins)

**Given** user wants to log out
**When** they tap "Log out" in settings
**Then** session is cleared
**And** they are redirected to login screen
**And** local data is cleared

**Technical Notes:**
- Use `expo-secure-store` for token storage
- Implement session refresh in `useAuth.ts`
- Create basic `app/settings.tsx` with logout button
- Supabase handles cross-device sync automatically

---

## Epic 2: Content Ingestion

Users can paste any URL and have content extracted, ready for audio generation.

### Story 2.1: URL Input & Validation

As a user with an article to listen to,
I want to paste a URL into tsucast,
So that the content can be extracted for audio generation.

**Acceptance Criteria:**

**Given** user is on Add screen
**When** screen loads
**Then** they see a prominent paste input field
**And** voice selector below it
**And** "Generate" button

**Given** user pastes a URL
**When** URL is valid (http/https)
**Then** URL is normalized (lowercase, remove tracking params)
**And** cache check is performed
**And** if cached: user sees "Ready to play" with instant play option

**Given** user pastes invalid text
**When** it's not a valid URL
**Then** they see: "Please enter a valid URL"
**And** input field shows error state

**Given** URL is not cached
**When** validation passes
**Then** "Generate" button becomes active
**And** user can proceed to generation

**Technical Notes:**
- Create `app/(tabs)/index.tsx` as Add screen
- Create `components/add/PasteInput.tsx`
- Implement URL normalization in `utils/validation.ts`
- Create VPS endpoint `GET /api/cache/check` to check cache

---

### Story 2.2: HTML Content Extraction

As a user who pasted an article URL,
I want the article content extracted cleanly,
So that only the article text is converted to audio.

**Acceptance Criteria:**

**Given** user submits a valid HTML page URL
**When** the API processes it
**Then** article content is extracted using Mozilla Readability
**And** navigation, ads, and headers are removed
**And** title is extracted
**And** word count is calculated

**Given** article has > 15,000 words
**When** extraction completes
**Then** request is rejected with: "Article is too long (max 15,000 words)"

**Given** page is behind a paywall
**When** extraction fails
**Then** user sees: "This article appears to be behind a paywall"

**Given** extraction succeeds
**When** content is ready
**Then** title and word count are returned
**And** user can proceed to audio generation

**Technical Notes:**
- Create VPS endpoint `POST /api/generate` (first step: parse)
- Use `@mozilla/readability` with `linkedom` for server-side DOM
- Implement word count validation
- Store extracted content temporarily for TTS step

---

### Story 2.3: PDF Content Extraction

As a user with a PDF document,
I want to extract text from it,
So that I can listen to PDF content as audio.

**Acceptance Criteria:**

**Given** user pastes a URL ending in .pdf
**When** the API processes it
**Then** PDF is downloaded
**And** text is extracted using pdf-parse
**And** title is derived from filename or metadata

**Given** PDF has > 15,000 words
**When** extraction completes
**Then** request is rejected with word count error

**Given** PDF is image-based (scanned)
**When** no text is extractable
**Then** user sees: "This PDF contains images only. Text-based PDFs work best."

**Technical Notes:**
- Extend `POST /api/generate` to detect PDF URLs
- Use `pdf-parse` library for text extraction
- Handle password-protected PDFs gracefully

---

### Story 2.4: Extraction Error Reporting

As a user whose URL failed to parse,
I want to report the failure,
So that parsing can be improved for that site.

**Acceptance Criteria:**

**Given** content extraction fails
**When** user sees the error
**Then** they see a "Report" button alongside the error message

**Given** user taps "Report"
**When** report is submitted
**Then** URL and error type are stored in `extraction_reports` table
**And** user sees: "Thanks! We'll work on improving this."
**And** user can try a different URL

**Given** user dismisses error without reporting
**When** they tap "Try Another"
**Then** input is cleared
**And** they can paste a new URL

**Technical Notes:**
- Create `extraction_reports` table in Supabase
- Create VPS endpoint `POST /api/report-extraction`
- Create `components/ui/ErrorState.tsx` with Report/Try Another buttons

---

## Epic 3: Audio Generation & Playback

Users experience the core magic: paste URL, hear audio in < 10 seconds.

### Story 3.1: Voice Selection & Preview

As a user about to generate audio,
I want to select a voice that sounds good,
So that my listening experience is enjoyable.

**Acceptance Criteria:**

**Given** user is on Add screen with valid URL
**When** they view voice options
**Then** they see 3-5 voice choices with names
**And** one voice is pre-selected as default

**Given** user wants to preview a voice
**When** they tap the preview button
**Then** a short sample plays from R2 (`/voices/{name}.mp3`)
**And** sample is < 5 seconds

**Given** user selects a different voice
**When** they tap a voice option
**Then** that voice becomes selected
**And** selection persists for future generations

**Technical Notes:**
- Create `components/add/VoiceSelector.tsx`
- Store voice samples in R2 at `/voices/`
- Create `constants/voices.ts` with voice metadata
- Store selected voice preference in AsyncStorage

---

### Story 3.2: Streaming Audio Generation

As a user who submitted content,
I want audio to start playing within 10 seconds,
So that I experience the magic instantly.

**Acceptance Criteria:**

**Given** user taps "Generate"
**When** generation starts
**Then** they see a progress indicator
**And** content is sent to Fish Audio API
**And** audio streams directly to R2 storage

**Given** generation completes
**When** audio file is ready in R2
**Then** `audio_cache` row is updated with status='ready'
**And** audio URL is returned to client
**And** auto-play begins

**Given** same URL was generating by another user
**When** current user requests it
**Then** they poll until status='ready'
**And** receive the cached audio

**Given** Fish Audio API fails
**When** error occurs
**Then** `audio_cache` status is set to 'failed'
**And** user sees: "Audio generation failed. Try again?"

**Technical Notes:**
- Extend `POST /api/generate` with TTS integration
- Implement race condition lock (INSERT with status='generating')
- Stream Fish Audio response directly to R2 using S3 SDK
- Create `audio_cache` table via migration
- Create `components/add/GeneratingState.tsx` for progress UI

---

### Story 3.3: Player Screen & Controls

As a user listening to generated audio,
I want familiar podcast controls,
So that I can play, pause, skip, and scrub easily.

**Acceptance Criteria:**

**Given** user has audio playing
**When** they view the player screen
**Then** they see: album art area, title, play/pause button, progress bar, skip buttons

**Given** user taps play/pause
**When** audio is playing
**Then** it pauses
**And** button shows play icon

**Given** user taps skip forward
**When** audio is playing
**Then** position advances 30 seconds

**Given** user taps skip backward
**When** audio is playing
**Then** position rewinds 15 seconds

**Given** user drags progress bar
**When** they release at new position
**Then** audio seeks to that position
**And** playback continues

**Given** user views progress
**When** audio is playing
**Then** they see current time and total duration
**And** progress bar updates in real-time

**Technical Notes:**
- Install and configure `react-native-track-player`
- Create `app/player/[id].tsx` full-screen player
- Create `components/player/PlayButton.tsx`
- Create `components/player/ProgressBar.tsx`
- Create `hooks/useAudioPlayer.ts`
- Create `stores/playerStore.ts` for player state (Zustand)

---

### Story 3.4: Background Audio & Lock Screen

As a user who locked their phone,
I want audio to continue playing,
So that I can listen while walking without looking at my phone.

**Acceptance Criteria:**

**Given** audio is playing
**When** user locks their phone
**Then** audio continues playing
**And** lock screen shows media controls

**Given** audio is playing
**When** user presses home/switches apps
**Then** audio continues in background

**Given** lock screen is visible
**When** user taps play/pause on lock screen
**Then** audio responds correctly

**Given** user has Bluetooth headphones
**When** they use headphone controls
**Then** play/pause/skip work correctly

**Given** phone call comes in
**When** audio is playing
**Then** audio pauses automatically
**And** resumes when call ends

**Technical Notes:**
- Configure `react-native-track-player` for background mode
- Set up iOS audio session properly in app.json
- Configure Android foreground service
- Handle audio interruptions (calls, other apps)

---

### Story 3.5: Playback Speed Control

As a user who wants to listen faster,
I want to adjust playback speed,
So that I can consume content more efficiently.

**Acceptance Criteria:**

**Given** user is on player screen
**When** they tap speed button
**Then** they see speed options: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x

**Given** user selects a speed
**When** they tap the option
**Then** playback speed changes immediately
**And** speed indicator updates

**Given** user changed speed
**When** they play a different article
**Then** speed preference persists

**Technical Notes:**
- Create `components/player/SpeedControl.tsx`
- Use `react-native-track-player` rate property
- Store speed preference in AsyncStorage

---

### Story 3.6: Sleep Timer

As a user listening before bed,
I want to set a sleep timer,
So that audio stops automatically and I can fall asleep.

**Acceptance Criteria:**

**Given** user is on player screen
**When** they tap sleep timer button
**Then** they see options: 15 min, 30 min, 45 min, 1 hour, End of article

**Given** user selects a timer
**When** timer is set
**Then** countdown begins
**And** timer indicator appears on player

**Given** timer reaches zero
**When** countdown completes
**Then** audio pauses
**And** timer indicator disappears

**Given** user wants to cancel timer
**When** they tap timer again and select "Off"
**Then** timer is cancelled

**Technical Notes:**
- Create `components/player/SleepTimer.tsx`
- Implement timer logic in player store
- Handle "End of article" option via track-player events

---

## Epic 4: Library & Organization

Users have a personal podcast library with progress tracking and playlists.

### Story 4.1: Library View

As a user with multiple generated podcasts,
I want to see my library,
So that I can find and play past articles.

**Acceptance Criteria:**

**Given** user navigates to Library tab
**When** library loads
**Then** they see a list of generated podcasts
**And** each item shows: title, duration, date added
**And** playback progress indicator (if partially played)

**Given** user taps a library item
**When** item is selected
**Then** player opens with that item
**And** playback starts from saved position (or beginning if new)

**Given** user swipes left on an item
**When** they confirm deletion
**Then** item is removed from their library
**And** audio remains in cache for other users (if public)

**Given** library has 100+ items
**When** user scrolls
**Then** list scrolls smoothly
**And** loads in < 2 seconds

**Technical Notes:**
- Create `app/(tabs)/library.tsx`
- Create `user_library` table via migration
- Create `components/library/LibraryList.tsx`
- Create `components/library/LibraryItem.tsx`
- Create `hooks/useLibrary.ts` for fetching and mutations

---

### Story 4.2: Playback Progress Tracking

As a user who partially listened to an article,
I want my position remembered,
So that I can resume where I left off.

**Acceptance Criteria:**

**Given** user is listening to an article
**When** they pause or leave
**Then** playback position is saved to `user_library` table
**And** saved every 30 seconds during playback

**Given** user opens a previously played article
**When** player loads
**Then** playback resumes from saved position

**Given** user finishes an article
**When** playback reaches the end
**Then** item is marked as "played" in library
**And** visual indicator shows completed status

**Given** user plays on multiple devices
**When** position syncs
**Then** last-write-wins (most recent position used)

**Technical Notes:**
- Update `user_library` with `playback_position` and `is_played` columns
- Implement position saving in `useAudioPlayer.ts`
- Create VPS endpoint `PATCH /api/library/:id/position`

---

### Story 4.3: Playlist Management

As a user who wants to organize content,
I want to create and manage playlists,
So that I can group related articles for listening sessions.

**Acceptance Criteria:**

**Given** user is in library
**When** they tap "Create Playlist"
**Then** they can enter a playlist name
**And** empty playlist is created

**Given** user has a playlist
**When** they long-press a library item
**Then** they see "Add to Playlist" option
**And** can select which playlist

**Given** user views a playlist
**When** they tap a playlist
**Then** they see all items in that playlist
**And** can tap to play any item

**Given** user wants to remove from playlist
**When** they swipe left on playlist item
**Then** item is removed from playlist
**And** item remains in library

**Given** user wants to rename playlist
**When** they tap edit on playlist
**Then** they can change the name

**Given** user wants to delete a playlist
**When** they select delete from menu
**Then** playlist is deleted
**And** items in it remain in library

**Given** user is viewing a playlist
**When** they want to reorder items
**Then** they can drag items to a new position
**And** the new order is saved immediately
**And** playback order follows the new sequence

**Given** user taps "Play" on a playlist
**When** playback starts
**Then** the first item in the playlist plays
**And** subsequent items play automatically in sequence
**And** a queue indicator shows remaining items

**Given** user is playing a playlist
**When** the current item finishes
**Then** the next item in the playlist plays automatically
**And** this continues until all items have played

**Technical Notes:**
- Create `playlists` and `playlist_items` tables with `position` column
- Create `components/library/PlaylistCard.tsx`
- Create `app/playlist/[id].tsx` for playlist detail view
- Implement `hooks/usePlaylists.ts` for CRUD operations
- Use `react-native-draggable-flatlist` for drag-to-reorder
- On playlist play, add all items to react-native-track-player queue

---

### Story 4.4: Queue Management

As a user listening to content,
I want to manage what plays next,
So that I can queue up articles for continuous listening.

**Acceptance Criteria:**

**Given** audio is playing
**When** user taps queue button
**Then** they see current queue (up next items)

**Given** user is in library
**When** they long-press an item
**Then** they see "Add to Queue" option
**And** item is added to end of queue

**Given** user views queue
**When** they drag an item
**Then** they can reorder the queue
**And** order persists

**Given** current item finishes
**When** queue has items
**Then** next item auto-plays

**Given** queue is empty
**When** current item finishes
**Then** playback stops gracefully

**Technical Notes:**
- Create `components/player/QueueButton.tsx`
- Use react-native-track-player queue management
- Implement queue UI with drag-to-reorder

---

## Epic 5: Monetization & Subscriptions

Business model with free/paid tiers using RevenueCat for App Store payments.

### Story 5.1: Free Tier Implementation

As a free user,
I want to try tsucast with limited usage,
So that I can experience the value before paying.

**Acceptance Criteria:**

**Given** user is on free tier
**When** they generate audio
**Then** daily generation counter increments
**And** limit is 3 articles per day

**Given** free user checks limit
**When** they view Add screen
**Then** they see remaining generations: "2 of 3 today"

**Given** daily limit resets
**When** midnight UTC passes
**Then** counter resets to 0
**And** user can generate again

**Technical Notes:**
- Add `daily_generations` and `daily_generations_reset_at` to user_profiles
- Create `components/ui/LimitBanner.tsx`
- Implement limit check in VPS `/api/generate`

---

### Story 5.2: Limit Display & Upgrade Prompt

As a free user who hit the limit,
I want clear feedback and upgrade path,
So that I can continue using tsucast if I choose.

**Acceptance Criteria:**

**Given** free user hits daily limit
**When** they try to generate
**Then** they see: "You've reached your daily limit"
**And** see "Upgrade for unlimited" button
**And** see "Come back tomorrow" option

**Given** limit message is shown
**When** user taps upgrade
**Then** they're taken to subscription screen

**Given** limit message is shown
**When** user dismisses it
**Then** they can continue using library and player
**And** are not blocked from other features

**Technical Notes:**
- Create limit exceeded modal
- Create `hooks/useSubscription.ts` for tier checking
- Style upgrade prompt to feel like invitation, not wall

---

### Story 5.3: In-App Purchase Integration

As a user who wants to upgrade,
I want to subscribe via App Store,
So that payment is secure and familiar.

**Acceptance Criteria:**

**Given** user taps "Upgrade"
**When** subscription screen loads
**Then** they see plan options with pricing
**And** "Unlimited articles" benefit highlighted

**Given** user selects a plan
**When** they confirm purchase
**Then** RevenueCat processes the payment
**And** App Store/Play Store handles transaction

**Given** purchase succeeds
**When** confirmation received
**Then** user_profiles.subscription_tier updates to 'pro'
**And** user sees success message
**And** limits are removed immediately

**Given** purchase fails
**When** error occurs
**Then** user sees friendly error
**And** can try again later

**Given** user wants to manage subscription
**When** they tap "Manage Subscription"
**Then** they're directed to App Store/Play Store settings
**And** can cancel or modify there

**Technical Notes:**
- Configure RevenueCat with App Store Connect & Play Console
- Create `supabase/functions/webhook-revenuecat/index.ts`
- Initialize RevenueCat SDK in app startup
- Create `services/purchases.ts` for purchase flow
- Handle restore purchases for device transfers

---

## Epic 6: Production Readiness

App handles errors gracefully and meets all non-functional requirements for launch.

### Story 6.1: Error Handling & User Feedback

As a user who encounters an error,
I want clear feedback and recovery options,
So that I'm not frustrated when things fail.

**Acceptance Criteria:**

**Given** network is unavailable
**When** user tries to generate audio
**Then** they see: "No internet connection"
**And** can tap "Retry" when connected

**Given** TTS generation fails
**When** Fish Audio returns an error
**Then** user sees: "Audio generation failed. Try again?"
**And** can retry or try a different article

**Given** an unexpected error occurs
**When** the app catches an exception
**Then** user sees generic: "Something went wrong"
**And** error is logged (not shown to user)
**And** "Retry" option is available

**Given** rate limiting occurs
**When** user hits API limits
**Then** they see friendly message (not technical)
**And** are given a reasonable wait time

**Given** any error occurs
**When** user sees error message
**Then** they can dismiss with one tap
**And** are not blocked from using other features

**Given** external monitoring checks the API
**When** it requests GET /health
**Then** API returns status of all dependencies (db, r2, fish_audio reachable)
**And** response time is under 500ms
**And** returns 200 if healthy, 503 if degraded

**Given** a TTS generation request is made
**When** Fish Audio takes longer than 120 seconds
**Then** the request times out gracefully
**And** user sees: "Generation is taking too long. Please try again."
**And** partial data is cleaned up

**Given** any API request is processed
**When** logs are written
**Then** logs are in structured JSON format
**And** include: request_id, user_id, endpoint, duration_ms, status_code
**And** sensitive data (tokens, passwords) is never logged

**Technical Notes:**
- Implement error boundary at app root
- Create consistent error UI components
- Use toast for dismissible errors, modal for blocking
- Log errors to monitoring (Sentry or Expo crash reports)
- Implement retry logic with exponential backoff
- Add `/health` endpoint checking: Supabase connection, R2 bucket access, Fish Audio API reachability
- Add request timeout middleware (120s) with AbortController for fetch calls
- Use pino or similar for structured JSON logging
- Deploy via Dokploy on Hetzner (handles SSL, process management, zero-downtime deploys)

---

### Story 6.2: Performance Optimization

As a user,
I want the app to feel fast and responsive,
So that the experience is delightful.

**Acceptance Criteria:**

**Given** user opens the app
**When** launch completes
**Then** app is interactive in under 3 seconds
**And** shows loading skeleton while data fetches

**Given** user navigates to library
**When** library has 100+ items
**Then** list loads and scrolls smoothly
**And** renders under 2 seconds

**Given** user interacts with any control
**When** they tap a button
**Then** response is immediate (no lag)
**And** UI updates optimistically where appropriate

**Given** user is on slow network
**When** they use the app
**Then** cached data displays immediately
**And** fresh data loads in background

**Given** images/thumbnails are displayed
**When** they load
**Then** they fade in smoothly
**And** placeholders show while loading

**Technical Notes:**
- Implement React Query caching strategies
- Use memo/useMemo for expensive computations
- Implement skeleton screens for all loading states
- Create `components/ui/Skeleton.tsx`
- Create `components/library/LibrarySkeleton.tsx`

---

### Story 6.3: App Store Preparation

As the app owner,
I want the app ready for App Store submission,
So that users can download it.

**Acceptance Criteria:**

**Given** app is feature-complete
**When** preparing for submission
**Then** app.json has correct metadata (name, version, bundle ID)
**And** app icons are present in all required sizes
**And** splash screen is configured

**Given** building for iOS
**When** EAS Build runs
**Then** production build succeeds
**And** app size is reasonable (< 50MB)

**Given** building for Android
**When** EAS Build runs
**Then** production build succeeds
**And** app is properly signed

**Given** app is submitted
**When** review is pending
**Then** all required screenshots are provided
**And** privacy policy URL is configured
**And** app description is complete

**Technical Notes:**
- Configure `app.json` with production settings
- Set up `eas.json` for production builds
- Create app icons at all required sizes
- Implement deep linking for future sharing features

---

### Story 6.4: Persistent Mini-Player

As a user navigating the app,
I want to see and control current playback,
So that I can switch tabs without losing context.

**Acceptance Criteria:**

**Given** audio is playing
**When** user is on any screen
**Then** mini-player bar appears at bottom
**And** shows: title (truncated), play/pause button

**Given** mini-player is visible
**When** user taps it
**Then** full player screen opens

**Given** mini-player is visible
**When** user taps play/pause
**Then** playback toggles without opening full player

**Given** no audio is playing
**When** user navigates app
**Then** mini-player is hidden

**Technical Notes:**
- Create `components/player/MiniPlayer.tsx`
- Add to root layout `app/_layout.tsx`
- Position above tab bar
- Connect to player store state

---

---

## Epic 7: Web Application (OPTIONAL - Post-MVP)

Next.js web app for marketing, backend testing without mobile builds, and admin panel. **Depends on Epic 2** (Content Ingestion backend).

> **Note:** This epic is OPTIONAL for MVP. Mobile launch is not blocked by web app completion. Web is secondary platform for testing, marketing, and operations.

### Story 7.1: Marketing Landing Page

As a potential user discovering tsucast,
I want to see a compelling landing page,
So that I understand the value and download the mobile app.

**Acceptance Criteria:**

**Given** visitor navigates to tsucast website
**When** landing page loads
**Then** they see hero section with value proposition
**And** feature highlights explaining the magic
**And** app store download links (iOS/Android)
**And** visual demos or screenshots of the app

**Given** landing page is indexed
**When** search engines crawl it
**Then** SEO meta tags are properly configured
**And** Open Graph tags enable social sharing previews
**And** structured data helps search visibility

**Given** visitor is on mobile device
**When** they view the landing page
**Then** layout is responsive and mobile-friendly
**And** app store links are prominent

**FR Mapping:** FR48, FR49, FR50

**Dependencies:** None (can be built in parallel with mobile)

**Technical Notes:**
- Create Next.js app in `apps/web` within monorepo
- Server-side rendering for SEO
- Implement marketing pages: `/`, `/features`, `/pricing`
- Configure meta tags and Open Graph in `app/layout.tsx`
- Use same Autumn Magic design tokens from mobile

---

### Story 7.2: Web Authentication Flow

As a user testing tsucast on web,
I want to sign in with the same account as mobile,
So that my library syncs across platforms.

**Acceptance Criteria:**

**Given** visitor is on web app
**When** they click "Sign In"
**Then** they see email/password login form
**And** social login options (Google, Apple)

**Given** user logs in on web
**When** authentication succeeds
**Then** session is established via Supabase
**And** they can access their library
**And** same data as mobile app

**Given** user creates account on web
**When** signup completes
**Then** account works on mobile app too
**And** user_profiles row is created

**Given** user logs out on web
**When** they click logout
**Then** session is cleared
**And** they return to landing page

**FR Mapping:** FR51

**Dependencies:** Epic 1 (User Authentication) backend complete

**Technical Notes:**
- Use `@supabase/auth-helpers-nextjs` for auth
- Create `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx`
- Share auth logic with mobile where possible
- Implement protected route middleware

---

### Story 7.3: Web Audio Generation & Playback

As a developer testing the backend,
I want to generate and play audio via web,
So that I can test TTS/parsing without mobile builds.

**Acceptance Criteria:**

**Given** authenticated user is on web app
**When** they paste a URL
**Then** content is extracted using same API as mobile
**And** audio is generated using same TTS pipeline

**Given** audio generation completes
**When** user clicks play
**Then** audio plays using HTML5 audio element
**And** basic controls work (play, pause, seek)

**Given** user views their library on web
**When** library loads
**Then** they see same items as mobile app
**And** can play any item

**Given** user is on web
**When** they switch browser tabs
**Then** audio may pause (browser limitation)
**And** this is expected behavior (documented)

**FR Mapping:** FR52, FR53, FR54

**Dependencies:** Epic 2 (Content Ingestion), Epic 3 Story 3.2 (Audio Generation) backend

**Technical Notes:**
- Create `app/(app)/generate/page.tsx` for URL input
- Create `app/(app)/library/page.tsx` for library view
- Use HTML5 `<audio>` element for playback
- Reuse same `/api/generate` endpoint as mobile
- Document web playback limitations clearly

---

### Story 7.4: Web Subscription Testing

As a developer testing payments,
I want to test the subscription flow on web,
So that I can verify RevenueCat integration without app store builds.

**Acceptance Criteria:**

**Given** authenticated user is on web
**When** they view their subscription status
**Then** they see current tier (free/pro)
**And** remaining daily limit if free

**Given** free user wants to upgrade
**When** they click upgrade
**Then** they see plan options and pricing
**And** are directed to appropriate payment method

**Given** subscription webhook fires
**When** RevenueCat notifies backend
**Then** user_profiles.subscription_tier updates
**And** change reflects on web immediately

**Given** user wants to manage subscription
**When** they click "Manage"
**Then** they're directed to appropriate portal
**And** can view/cancel subscription

**FR Mapping:** FR55

**Dependencies:** Epic 5 (Monetization) backend complete

**Technical Notes:**
- Create `app/(app)/upgrade/page.tsx` for subscription UI
- RevenueCat web SDK or Stripe direct for web payments
- Display subscription status from user_profiles
- Webhook already implemented in Epic 5

---

### Story 7.5: Admin Panel - User Management

As an admin,
I want to view user statistics and manage accounts,
So that I can monitor the platform and help users.

**Acceptance Criteria:**

**Given** admin logs in
**When** they access /admin
**Then** they see admin dashboard
**And** only users with admin role can access

**Given** admin views users
**When** user list loads
**Then** they see registered users with: email, signup date, subscription tier, usage stats
**And** can search and filter users

**Given** admin views system health
**When** metrics load
**Then** they see: API latency, TTS queue depth, error rates
**And** metrics update periodically

**Given** admin wants to view user details
**When** they click on a user
**Then** they see full user profile
**And** generation history
**And** subscription details

**FR Mapping:** FR56, FR57

**Dependencies:** Epic 1 (Authentication), Admin role in user_profiles

**Technical Notes:**
- Create `app/admin/page.tsx` with admin check middleware
- Add `is_admin` column to user_profiles
- Create admin API endpoints with role verification
- Implement `/api/admin/users` and `/api/admin/metrics`
- Use charts library for metrics visualization

---

### Story 7.6: Admin Panel - Content Moderation

As an admin,
I want to review reported URLs and moderate content,
So that I can improve parsing and handle problematic content.

**Acceptance Criteria:**

**Given** admin views reports
**When** extraction_reports list loads
**Then** they see failed URLs with: URL, error type, report date, user
**And** can sort by date or frequency

**Given** admin reviews a report
**When** they click on a report
**Then** they see full error details
**And** can attempt to reproduce the extraction
**And** can mark as: fixed, won't fix, duplicate

**Given** admin wants to manage content flags
**When** content is flagged
**Then** they can review flagged items
**And** take action: remove, approve, warn user

**Given** multiple users report same URL
**When** admin views reports
**Then** duplicates are grouped
**And** frequency count is shown

**FR Mapping:** FR58, FR59

**Dependencies:** Epic 2 Story 2.4 (Error Reporting), extraction_reports table

**Technical Notes:**
- Create `app/admin/reports/page.tsx` for report review
- Create `app/admin/moderation/page.tsx` for content flags
- Implement `/api/admin/reports` with CRUD operations
- Add status field to extraction_reports (pending, fixed, wont_fix)
- Group reports by normalized URL

---

## Epic 8: MVP Launch Preparation

Final requirements for App Store submission including real payment integration, legal compliance, and account management.

> **Note:** This epic contains **launch blockers** that must be completed before App Store submission. Epic 7 (Web) is optional, but Epic 8 is required.

### Story 8.1: MVP Launch Blockers

As a user preparing to use tsucast,
I want working payments, clear legal terms, and account control,
So that I can trust the app and use it confidently.

**Acceptance Criteria:**

**Given** user wants to purchase Pro subscription
**When** they tap "Upgrade"
**Then** real RevenueCat SDK processes payment via App Store/Play Store
**And** subscription is activated immediately

**Given** user wants to read Terms of Service
**When** they tap Terms link in settings
**Then** they are taken to tsucast.com/terms with actual legal content

**Given** user wants to read Privacy Policy
**When** they tap Privacy link in settings
**Then** they are taken to tsucast.com/privacy with actual legal content

**Given** user is on signup screen
**When** they see terms text
**Then** "Terms of Service" and "Privacy Policy" are tappable links

**Given** user wants to delete their account
**When** they tap "Delete Account" in settings
**Then** they see confirmation dialog
**And** on confirm, all user data is permanently deleted
**And** they are logged out

**Given** RevenueCat sends webhook
**When** subscription status changes
**Then** signature is verified correctly
**And** user_profiles.subscription_tier is updated

**Technical Notes:**
- Replace stub in `services/purchases.ts` with real `react-native-purchases` SDK
- Create terms and privacy pages on tsucast.com
- Add account deletion UI to settings + API endpoint
- Update signup.tsx to make terms links tappable
- Verify webhook signature matches RevenueCat documentation

---

_Epics and Stories completed: 2026-01-20_
_Epic 7 added: 2026-01-21_
_Epic 8 added: 2026-01-21_
