---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
workflowCompleted: true
completedDate: "2026-01-19"
lastEdited: "2026-01-21"
editHistory:
  - date: "2026-01-21"
    changes: "Added Next.js web app strategy for backend testing, marketing, and admin panel. Added FR48-FR62 for web platform. Clarified mobile as primary product, web as secondary."
classification:
  projectType: mobile_app_crossplatform
  domain: general_consumer_content
  complexity: low
  projectContext: greenfield
inputDocuments:
  - path: '_bmad-output/analysis/brainstorming-session-2026-01-19.md'
    type: 'brainstorming'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
---

# Product Requirements Document - tsucast

**Author:** Tino
**Date:** 2026-01-19

## Executive Summary

**tsucast** is a podcast-native text-to-speech app that transforms any article or PDF into high-quality audio for listening on the go. Unlike traditional TTS (accessibility-focused, robotic voices, read-along), tsucast is designed for the podcast experience: paste a URL, select a voice, and start listening within 10 seconds.

**Core Value:** "I've already found what I want to consume. Just transform it into audio that feels human, and get out of my way so I can walk."

**Target:** 1,000 paid users in 3 months, YC acceptance in 12 months.

**Tech Stack:** Expo (React Native) for iOS/Android/Web, built from Linux using EAS cloud builds.

**Brand Vibe:** Tom Bombadil energy - effortless magic, joyful, not a "productivity tool."

## Success Criteria

### User Success

The core "aha!" moment: **paste an article and it works from the first sentence.**

- User hears high-quality, human-feeling audio within 10 seconds
- Streaming starts while rest processes in background (like YouTube)
- No tweaking, no retrying, no settings - it just works
- Article content starts cleanly (no headers, ads, navigation garbage)
- Voice quality makes them forget it's AI-generated

### Business Success

| Timeframe | Metric | Target |
|-----------|--------|--------|
| 3 months | Paid users | 1,000 |
| 3 months | Engagement | 3+ sessions per week |
| 3 months | Growth | 5-7% week-over-week |
| 3 months | Virality | Organic sharing / word-of-mouth |
| 12 months | Milestone | YC acceptance |

### Technical Success

| Metric | Target |
|--------|--------|
| Parse accuracy | > 95% clean article extraction |
| Voice quality | Human-feeling AI clones |
| Time to first audio | < 10 seconds (streaming) |
| Streaming | Audio plays while rest buffers |
| URL success rate | > 90% work first try |

### Measurable Outcomes

- **User delight:** "Tolkien reads LOTR" jaw-drop demo works
- **Retention:** Users return 3+ times per week
- **Conversion:** Free users convert to paid
- **Growth:** Consistent week-over-week user growth

## Product Scope

### MVP - Minimum Viable Product

**Mobile App (Primary Product):**

| Feature | Details |
|---------|---------|
| Paste URL | HTML pages + PDF support |
| Voice selection | AI clone voices |
| Language selection | Multi-language output |
| Streaming playback | Start in < 10s, buffer rest in background |
| Player | Classic podcast controls (play, pause, skip, speed, sleep timer) |
| Background audio | Continues when app backgrounded/locked |
| Lock screen controls | Play/pause from lock screen |
| Library | Playlist of generated podcasts |
| Account | Basic login/sync |
| Platforms | iOS + Android via EAS Build |

**Web App (Secondary - Testing/Marketing/Admin):**

| Feature | Details |
|---------|---------|
| Landing page | Marketing, SEO, app store links |
| Basic playback | Test TTS/parsing without mobile builds |
| Auth flow | Same Supabase auth as mobile |
| Admin panel | User management, metrics, moderation |
| Technology | Next.js + same API backend |

### Growth Features (Post-MVP)

- Share sheet integration ("Listen in tsucast")
- Sleep detection + auto-resume
- Ambient soundscapes (LOTR music, coffee shop)
- Expanded voice library

### Vision (Future)

- Auto voice-to-author matching (Paul Graham article → Paul Graham voice)
- Photo → audio (point camera at book)
- Video content support
- Multi-article daily digest podcast

## User Journeys

### Journey 1: First Magic Moment (Free User)

**Opening Scene:**
Alex is scrolling through saved articles during lunch break. There's a Paul Graham essay they've been meaning to read for weeks. But reading on a screen feels exhausting. They're about to go for a walk...

**Rising Action:**
Alex remembers hearing about tsucast. They download the app, paste the Paul Graham URL. Select a voice. Hit play.

**Climax:**
Within 10 seconds, Paul Graham's voice starts reading the essay. Alex puts in earbuds, heads outside, and just... listens. It works. It actually works.

**Resolution:**
Alex finishes the essay during a 30-minute walk. They've consumed content they'd been putting off for weeks. They immediately paste another article.

> **Core moment:** Paste → 10 seconds → Voice starts → "It works!" → Hooked

### Journey 2: Conversion Moment (Free → Paid)

**Opening Scene:**
Alex has been using tsucast for a few days. They've listened to 2 articles today - a newsletter and a blog post. Now they find a long essay they want to save for their evening walk.

**Rising Action:**
Alex pastes the URL. The app shows: *"You've reached your daily limit. Upgrade to keep listening, or come back tomorrow."*

**Climax (Decision Point):**
Alex thinks: "I really want this for my walk tonight." They see the paid plan - more articles per day. The price feels reasonable for what they're getting.

**Resolution:**
- **Path A:** Alex upgrades. Immediately pastes the article. Walks and listens that evening.
- **Path B:** Alex waits until tomorrow. Still hooked, still comes back.

> **Core moment:** Hits limit → Sees value → Converts or returns

### Journey 3: Power User Session (Paid User)

**Opening Scene:**
Alex is now a paying subscriber. Sunday morning, they're prepping for a long hike.

**Rising Action:**
They paste 3 articles from their reading list: a Paul Graham essay, a tech newsletter, and a research piece they've been avoiding. Select voices for each. Build a mini-playlist.

**Climax:**
Alex heads out. One tap, music-style playback. Article after article flows. The hike flies by.

**Resolution:**
Alex has consumed a week's worth of reading in one hike. They text a friend: *"Bro, I have Tolkien reading me LOTR, and he can read ANY other thing."*

> **Core moment:** Multiple articles → Playlist → Long session → Tells friends

### Journey 4: Error Recovery

**Opening Scene:**
Alex pastes a URL from a weird site with heavy JavaScript rendering.

**Rising Action:**
Tsucast tries to parse... but the article content is garbage or empty.

**Climax:**
App shows: *"Couldn't extract this article. [Report] [Try Another]"*

**Resolution:**
Alex taps Report (helps improve parsing). Pastes a different URL. Moves on. No frustration spiral.

> **Core moment:** Bad URL → Clear error → Report → Move on

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| **First Magic** | URL input, voice selection, streaming playback, < 10s start |
| **Conversion** | Usage limits, limit UI, upgrade flow, payment processing |
| **Power User** | Multiple articles, playlist/library, continuous playback |
| **Error Recovery** | Parse error detection, report mechanism, graceful failure |

### Design Principles from Journeys

- **No onboarding** - App should be self-explanatory
- **No explanation needed** - Tom Bombadil doesn't explain magic
- **Graceful limits** - Free users hit limit gently, not harshly
- **Report, don't rage** - Errors have a clear action path

## Innovation & Novel Patterns

### Core Innovation

**Podcast-native text-to-speech** - The first TTS designed specifically for the podcast listening experience rather than accessibility or read-along use cases.

| Existing TTS | tsucast |
|--------------|---------|
| Accessibility-focused | Podcast-focused |
| Read along with text | Close app and walk |
| Robotic voices | Human-feeling AI voices |
| Per-page/screen | Full article streaming |
| Settings-heavy | Zero configuration |

### What Makes It Novel

1. **UX Model:** Podcast player, not document reader
2. **Architecture:** Streaming-first (< 10s to first audio)
3. **Simplicity:** Paste URL → listen. No friction.
4. **Voice Quality:** AI clones that don't sound robotic

### Validation Approach

- User success = "it works from the first sentence"
- Retention = 3+ sessions/week
- Virality = organic word-of-mouth sharing

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI voice quality not good enough | Research best providers before building |
| Parsing fails on complex sites | Start with well-structured sites, report button for failures |
| Competitors copy the approach | Speed to market, brand (Tom Bombadil vibe) |

## Mobile App Specific Requirements

### Project-Type Overview

Cross-platform mobile app (Expo/React Native) with web support, designed for podcast-style audio consumption. First mobile project - using JS/TS knowledge for faster MVP.

### Platform Strategy

| Platform | Priority | Role | Approach |
|----------|----------|------|----------|
| iOS | MVP | Primary Product | Expo + EAS Build (cloud, no Mac needed) |
| Android | MVP | Primary Product | Expo + EAS Build |
| Web (Next.js) | MVP | Secondary | Backend testing, marketing, admin |

**Development Environment:** Linux (no Mac) - EAS Build handles iOS/Android compilation in cloud

### Web App Strategy

**Purpose:** The Next.js web app is NOT a consumer product - it's a multi-purpose tool:

| Use Case | Description |
|----------|-------------|
| **Backend Testing** | Test API flows (auth, TTS, parsing) without mobile builds |
| **Marketing Site** | Landing page, SEO, app store links |
| **Admin Panel** | User management, usage monitoring, content moderation |
| **Future Creator Features** | Dashboard for creators to manage their voices/content |

**Boundaries (What Web Is NOT):**
- NOT feature parity with mobile
- NOT the primary user experience
- NOT optimized for "listening while walking" (no background audio on web)
- NOT a replacement for EAS Build testing before launch

**Web Playback Limitations:**
- No background audio when tab is hidden
- No lock screen controls
- No CarPlay/Android Auto integration
- Basic HTML5 audio API (not podcast-optimized)

**Why Still Build It:**
1. Developer cannot run iOS locally (Linux + no Mac)
2. Landing page needed for marketing/SEO
3. Admin panel needed for operations
4. Creator features planned for future

**Time Investment:** Web basics should be minimal - focus remains on mobile app quality

### Device Features Required

| Feature | Required | Notes |
|---------|----------|-------|
| Background audio | Yes | Audio continues when app backgrounded or phone locked |
| Lock screen controls | Yes | Play/pause/skip from lock screen |
| Bluetooth/Car audio | Yes | Works with AirPods, car systems, headphones |
| Sleep timer | Yes | Pause audio after set duration |
| Internet connection | Yes | Streaming-first, requires connectivity |

### Offline Mode

**MVP:** Streaming only - requires internet connection
**Future:** Download for offline listening (post-MVP)

### Audio Session Handling

- Proper audio focus management (pause for calls, etc.)
- Resume after interruptions
- Background playback with system notifications
- Lock screen media controls integration

### Store Compliance

| Store | Status | Notes |
|-------|--------|-------|
| Apple App Store | Standard | Audio/podcast category, no special concerns |
| Google Play Store | Standard | Media app, straightforward approval expected |

No special compliance requirements - standard consumer audio app.

### Technical Considerations

| Area | Approach |
|------|----------|
| Framework | Expo (React Native) with TypeScript |
| State management | TBD (Redux, Zustand, or Context) |
| Audio playback | expo-av or react-native-track-player |
| Streaming | Progressive download / chunked playback |
| API communication | REST + streaming audio endpoint |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approach:** Problem-solving MVP - deliver the core magic first, validate with real users

**Philosophy:** If < 10s streaming doesn't work, nothing else matters. Build the hard part, ship it, see if people use it.

**Tech Stack Decision:** Expo (React Native) - use what you know (JS), ship faster

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1: First Magic Moment ✅
- Journey 2: Conversion Moment ✅
- Journey 4: Error Recovery ✅

**Must-Have Capabilities:**

| Feature | Why Essential |
|---------|---------------|
| Paste URL (HTML + PDF) | Core input mechanism |
| Voice selection | Key differentiator |
| Streaming playback (< 10s) | The magic - make or break |
| Classic player controls | Usability baseline |
| Library/playlist | Retention mechanism |
| Account system | Enables free tier limits |
| Free/Paid tiers | Business model |
| Language selection | Multi-language output |

### Platform & Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Mobile Frontend | Expo (React Native) | JS knowledge, fast to MVP |
| Web Frontend | Next.js | Same JS/TS stack, SSR for marketing SEO |
| iOS Build | EAS Build (cloud) | No Mac required |
| Android Build | EAS Build (cloud) | Same pipeline |
| Backend | Node.js + Hono (VPS) | API for TTS, parsing, audio streaming |
| Database/Auth | Supabase | PostgreSQL + built-in auth |
| AI/TTS | Fish Audio API | High-quality voice clones |
| Storage | Cloudflare R2 | Audio file storage, S3-compatible |
| Payments | RevenueCat | Cross-platform subscription management |

### Post-MVP Features

**Phase 2 (Growth):**
- Share sheet integration
- Expanded voice library
- Sleep detection + auto-resume
- Offline download mode

**Phase 3 (Vision):**
- Auto voice-to-author matching
- Ambient soundscapes
- Photo → audio
- Video content support
- Multi-article daily digest

### Risk Mitigation Strategy

| Risk | Strategy |
|------|----------|
| **Technical:** Voice quality / streaming speed | Build core first, iterate. If it doesn't work, pivot or kill. |
| **Market:** Users don't want this | Ship fast, measure retention. Word-of-mouth = validation. |
| **Resource:** Solo developer | Expo reduces work. EAS for iOS builds. Use what you know. |

## Functional Requirements

### Content Input & Processing

- **FR1:** User can paste a URL to convert an article to audio
- **FR2:** User can paste a PDF document to convert to audio
- **FR3:** System extracts clean article content from HTML pages (excluding navigation, ads, headers)
- **FR4:** System extracts text content from PDF documents
- **FR5:** User can report a URL that failed to parse correctly

### Voice & Audio Generation

- **FR6:** User can select from available AI voice options
- **FR7:** System generates audio from extracted text using selected voice
- **FR8:** System streams audio progressively (start playback while rest generates)
- **FR9:** System delivers first audio within 10 seconds of request

### Audio Playback

- **FR10:** User can play and pause audio
- **FR11:** User can skip forward/backward by increments (e.g., 15/30 seconds)
- **FR12:** User can adjust playback speed (0.5x to 2x)
- **FR13:** User can set a sleep timer to auto-pause
- **FR14:** User can control playback from device lock screen
- **FR15:** User can control playback via Bluetooth/car audio systems
- **FR16:** System continues audio playback when app is backgrounded
- **FR17:** User can seek/scrub to any position in the audio timeline
- **FR18:** User can see current playback position and total duration
- **FR19:** System remembers playback position when user leaves and returns
- **FR20:** System auto-plays next item in library/queue (continuous playback)
- **FR21:** User can view and manage a playback queue (up next)
- **FR22:** User can reorder items in the queue
- **FR23:** User can add items to queue from library

### Library & Content Management

- **FR24:** User can view a library of previously generated podcasts
- **FR25:** User can play any item from their library
- **FR26:** User can delete items from their library
- **FR27:** User can see playback progress for each library item
- **FR28:** User can create playlists
- **FR29:** User can add items to a playlist
- **FR30:** User can remove items from a playlist
- **FR31:** User can reorder items within a playlist
- **FR32:** User can rename a playlist
- **FR33:** User can delete a playlist
- **FR34:** User can play an entire playlist in sequence

### User Accounts

- **FR35:** User can create an account
- **FR36:** User can log in to an existing account
- **FR37:** User can log out
- **FR38:** User's library syncs across devices when logged in

### Subscription & Limits

- **FR39:** Free user has a daily limit on articles converted
- **FR40:** System displays remaining daily limit to user
- **FR41:** System shows upgrade prompt when free user hits limit
- **FR42:** User can upgrade to paid plan
- **FR43:** Paid user has higher article limit per plan
- **FR44:** System processes payments securely

### Error Handling

- **FR45:** System displays clear error message when URL parsing fails
- **FR46:** User can report parsing failures for improvement
- **FR47:** System handles network errors gracefully

### Web App (Next.js) - Secondary Platform

**Marketing & Landing:**
- **FR48:** Web displays marketing landing page with app store links
- **FR49:** Web shows product features and value proposition
- **FR50:** Web includes SEO-optimized content for organic discovery

**Backend Testing Interface:**
- **FR51:** Web user can sign up and log in (same auth as mobile)
- **FR52:** Web user can paste URL and generate audio
- **FR53:** Web user can play generated audio with basic controls (play, pause, seek)
- **FR54:** Web user can view their library of generated content
- **FR55:** Web user can test subscription upgrade flow

**Admin Panel (Authenticated Admin Only):**
- **FR56:** Admin can view registered user list and usage statistics
- **FR57:** Admin can view system health metrics (API latency, TTS queue, error rates)
- **FR58:** Admin can review reported URL parsing failures
- **FR59:** Admin can manage content moderation flags

**Future: Creator Dashboard (Post-MVP):**
- **FR60:** Creators can upload and manage custom voice models
- **FR61:** Creators can view analytics on voice usage
- **FR62:** Creators can manage voice monetization settings

**Web Limitations (Explicitly NOT Supported):**
- No background audio playback
- No lock screen controls
- No offline mode
- No sleep timer with screen-off functionality
- No CarPlay/Android Auto integration

## Non-Functional Requirements

### Performance

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR1** | Time to first audio chunk | < 10 seconds from URL paste |
| **NFR2** | Streaming continuity | Progressive playback while rest generates |
| **NFR3** | Progress feedback | Show generation progress to user |
| **NFR4** | App launch time | < 3 seconds to usable state |
| **NFR5** | Library load time | < 2 seconds for up to 100 items |

### Security

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR6** | User authentication | Secure login (OAuth or email/password with hashing) |
| **NFR7** | Payment processing | PCI-compliant via Stripe/RevenueCat |
| **NFR8** | Data in transit | HTTPS for all API communication |
| **NFR9** | Token storage | Secure storage for auth tokens on device |

### Scalability

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR10** | Concurrent users | Minimum 1,000 concurrent TTS requests |
| **NFR11** | Growth capacity | Handle 10x user growth without re-architecture |
| **NFR12** | TTS queue | Queue system for high-load periods |

### Reliability

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR13** | API uptime | 99% availability |
| **NFR14** | Graceful degradation | Clear error handling when TTS fails |
| **NFR15** | Resume capability | Resume playback after network interruption |

### Integration

| NFR | Requirement | Measurement |
|-----|-------------|-------------|
| **NFR16** | TTS provider | Integration with quality AI voice provider |
| **NFR17** | Payment provider | Stripe or RevenueCat integration |
| **NFR18** | Parsing service | Reliable HTML/PDF extraction |

