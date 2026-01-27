---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
  - path: '_bmad-output/planning-artifacts/product-brief.md'
    type: 'brief'
  - path: '_bmad-output/analysis/brainstorming-session-2026-01-19.md'
    type: 'brainstorming'
  - path: '_bmad-output/planning-artifacts/research/market-ai-content-to-podcast-platforms-research-2026-01-20.md'
    type: 'research'
date: 2026-01-20
author: Tino
project: tsucast
---

# UX Design Specification: tsucast

**Author:** Tino
**Date:** 2026-01-20

---

## Executive Summary

### Project Vision

**tsucast** is a podcast-native text-to-speech app that transforms any article or PDF into high-quality audio for listening on the go. The UX is built around one principle: effortless magic.

**The Promise:** Paste → 10 seconds → Voice starts → Walk away listening.

**The Brand:** Tom Bombadil energy - joyful, magical, unexplained. The app doesn't teach or explain. It invites you in and tells you a story.

### Target Users

**Primary Persona: Alex - The Knowledge Worker**
- Has accumulated reading debt (articles saved, never read)
- Already a podcast/audiobook listener
- Wants to consume content during walks, commutes, exercise
- Values efficiency but won't tolerate friction
- Will evangelize tools that deliver magic

**User Context:**
- Primary use: Mobile (walking, commuting, exercising)
- Secondary use: Web (quick paste from desktop)
- Tech comfort: High, but expects simplicity
- Patience level: Low - must work instantly

### Key Design Challenges

1. **Instant Gratification** - < 10 seconds to first audio is non-negotiable
2. **Zero Configuration** - No settings, no onboarding, no explanations
3. **Graceful Monetization** - Free tier limits feel generous, not punishing
4. **Background-First Design** - 90% of use is when app is invisible (lock screen, pocket)
5. **Error Recovery** - Parsing failures must be dismissible, not frustrating

### Design Opportunities

1. **Radical Simplicity** - 3.5 screens as competitive advantage
2. **Voice as Companion** - Selection feels personal, not technical
3. **Familiar Podcast UX** - Leverage existing mental models
4. **Delight Through Magic** - "Tolkien reads LOTR" creates virality
5. **Sleep-Friendly Design** - Gentle experience for bedtime listening

---

## Core User Experience

### Defining Experience

**The Core Loop:** Paste URL → Audio in 10 seconds → Walk away listening

This single interaction defines tsucast. Every UX decision must protect and optimize this loop. If the core loop works beautifully, users forgive everything else. If it fails, nothing else matters.

**The Core Action:** Paste → Play
- User has content (URL) ready
- User pastes into tsucast
- Audio streams within 10 seconds
- User puts phone away and walks

### Platform Strategy

| Platform | Role | Approach |
|----------|------|----------|
| **iOS** | Primary listening | Expo + EAS Build |
| **Android** | Primary listening | Expo + EAS Build |
| **Web** | Quick paste, backup | Expo Web |

**Background-First Design:** 90% of usage occurs when the app is not visible. Lock screen controls, Bluetooth audio, and notification-based interactions are the primary interface for most user sessions.

### Effortless Interactions

**Must Be Effortless:**
- Adding content (paste URL, nothing else required)
- Starting playback (one tap, streams immediately)
- Continuing playback (automatic position memory)
- Background audio (seamless when phone locks)
- Voice selection (visible but optional, default works)

**Deliberately Avoided:**
- Onboarding tutorials
- Account required to try
- Settings screens
- Folder/organization systems
- Metadata entry

### Critical Success Moments

| Moment | Experience | Success Metric |
|--------|------------|----------------|
| **First Magic** | Paste first URL, hear audio | < 10 seconds to voice |
| **The Demo** | Show friend "Tolkien reads LOTR" | Friend asks "how do I get this?" |
| **The Walk** | Listen during entire activity | Zero interruptions |
| **The Limit** | Hit free tier cap | Feels fair, considers upgrading |
| **The Return** | Open app next day | One tap to resume |

### Experience Principles

1. **Instant Magic** - 10 seconds or it's broken. No exceptions.
2. **Zero Learning Curve** - Works without explanation. Tom Bombadil energy.
3. **Background Excellence** - Optimize for invisible usage (lock screen, pocket, Bluetooth).
4. **Graceful Limits** - Monetization is an invitation, not a wall.
5. **One Core Loop** - Protect Paste → Listen → Return. Resist scope creep.

---

## Desired Emotional Response

### Primary Emotional Goals

**The Core Feeling:** Effortless magic - like Tom Bombadil singing through the forest. Things just happen. No explanation needed.

| Emotion | Trigger | Design Focus |
|---------|---------|--------------|
| **Delight** | Audio starts playing | < 10 second magic, quality voice |
| **Relief** | Consuming backlog | Reading list finally shrinking |
| **Wonder** | Voice quality | "How is this possible?" |
| **Calm** | Walking and listening | Seamless background experience |
| **Confidence** | Every interaction | Zero learning curve |

### Emotional Journey Mapping

| Stage | Desired Emotion | Design Implication |
|-------|-----------------|-------------------|
| **Discovery** | Curiosity → Intrigue | Clear promise, viral demo potential |
| **First Use** | Anticipation → Delight | Works in < 10 seconds |
| **Core Experience** | Flow → Calm | No interruptions, seamless |
| **Hitting Limit** | Understanding → Fair | Gentle, not punishing |
| **Conversion** | Value → Gratitude | Worth the price |
| **Return** | Familiarity → Comfort | One tap to continue |

### Micro-Emotions

**Cultivate:**
- Confidence over confusion
- Trust over skepticism
- Delight over mere satisfaction
- Belonging ("made for people like me")

**Prevent:**
- Anxiety ("is it working?") → Clear progress
- Frustration ("why didn't it work?") → Graceful errors
- Guilt ("wasting money") → Clear value
- Overwhelm ("too many options") → Radical simplicity

### Design Implications

| Emotion | UX Approach |
|---------|-------------|
| Delight | Fast streaming, surprising voice quality |
| Calm | Minimal UI, no interruptions |
| Confidence | No onboarding, obvious interactions |
| Wonder | Voice quality that feels human |
| Trust | Consistent quality, position memory |

### Emotional Design Principles

1. **Magic Over Mechanics** - Never explain how it works. It just works.
2. **Calm Over Busy** - Minimal UI, no visual noise, gentle transitions.
3. **Generous Over Punishing** - Limits feel fair, upgrades feel like gifts.
4. **Human Over Robotic** - Voice quality is non-negotiable.
5. **Companion Over Tool** - This isn't productivity software. It's a friend who reads to you.

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

#### Shazam - "It Just Works" Benchmark
- **One-tap magic:** 75% of screen is single action
- **Zero onboarding:** Self-explanatory UI
- **2-second results:** Speed is the experience
- **Invisible technology:** Users don't know or care how

**Key Lesson:** Remove everything except the core action. The technology should be invisible.

_Source: [UX Collective - How Shazam's UX Delivers Instant Gratification](https://uxdesign.cc/how-shazams-ux-delivers-instant-gratification-04a42c29a8c2)_

#### Overcast - Podcast Player Excellence
- **Minimalist home:** Single "Add" button dominates
- **Smart features:** Voice Boost, Smart Speed enhance without complexity
- **Flash load times:** Speed prioritized in architecture
- **Icon-only navigation:** Clean, text-free

**Key Lesson:** Power features can coexist with simplicity. Defaults must work perfectly.

_Source: [Usability Geek - Overcast Case Study](https://usabilitygeek.com/ux-case-study-overcast-mobile-app/)_

#### Pocket Casts - Library & Sync Mastery
- **Flawless sync:** Start on phone, continue on web, exact same position
- **Now Playing:** Swipe for details, sleep timer, speed controls
- **Simple power:** "Swiss Army knife that remains simple"

**Key Lesson:** Position memory and cross-device sync are non-negotiable. Don't over-organize.

_Source: [Automattic Design - Pocket Casts](https://automattic.design/2025/08/15/smarter-more-open-podcasting-with-pocket-casts/)_

#### Spotify - Background Audio Standard
- **Persistent playback bar:** Always visible across all screens
- **Lock screen controls:** Primary interface during playback
- **Audio-forward UX:** Designed for screens AND no screens
- **2-3 taps max:** Every action quickly reachable

**Key Lesson:** The app should work equally well visible or invisible. Lock screen IS the interface.

_Source: [Spotify Design - Audio-Forward UX](https://spotify.design/article/audio-forward-ux-meeting-listeners-where-they-are)_

### Transferable UX Patterns

**Navigation:**
- Icon-only bottom nav (Overcast)
- Persistent mini-player bar (Spotify)
- 2-3 taps max to any action (Spotify)

**Interactions:**
- One giant primary action (Shazam)
- Swipe for secondary options (Pocket Casts)
- Sleep timer in Now Playing (Pocket Casts)

**Background:**
- Lock screen play/pause/skip (Spotify, Pocket Casts)
- Exact position sync across devices (Pocket Casts)
- Audio continues when app killed (Spotify)

### Anti-Patterns to Avoid

| Avoid | Why | Instead |
|-------|-----|---------|
| Onboarding tutorials | Users want to use, not learn | Self-explanatory UI |
| Auto-categorization | Confuses users (Pocket Casts) | Simple flat library |
| Account required upfront | Friction before magic | Try first, account later |
| Visible settings screens | Adds complexity | Defaults work perfectly |
| Technology explanations | Breaks the magic | Unexplained like Shazam |

### Design Inspiration Strategy

**Adopt:** Shazam's one-button focus, Pocket Casts' position sync, Spotify's playback bar, Overcast's icon nav

**Adapt:** Pocket Casts' Now Playing (simpler), Spotify's lock screen (podcast-style)

**Avoid:** Smart Folders, onboarding, settings screens, technology explanations

---

## Design System Foundation

### Design System Choice

**Selected:** NativeWind (Tailwind CSS for React Native) + Minimal Custom Components

**Philosophy:** Build only what tsucast needs. No component library bloat. Full visual control.

### Rationale for Selection

| Factor | Decision |
|--------|----------|
| **UI Complexity** | Only 3.5 screens - don't need 50+ components |
| **Brand Control** | Full visual ownership, no Material/iOS defaults |
| **Bundle Size** | Minimal - utility classes + ~10 custom components |
| **Maintenance** | Fewer dependencies for solo developer |
| **Cross-Platform** | NativeWind works seamlessly with Expo Web |
| **Speed** | Tailwind utilities are fast to write |

### Implementation Approach

**Design Tokens:**
- Colors: White `#ffffff` background, Black `#000000` text and borders (+ semantic red/green)
- Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48)
- Border Radius: Soft and rounded (8px, 16px)
- Borders: 1px solid black
- Typography: System sans-serif, bold weight only, tight tracking on headings, relaxed line-height on body

**Custom Components (~10 total):**
- `PasteInput` - URL input (dominant on Add screen)
- `VoiceSelector` - Voice picker
- `PlayButton` - Primary play action
- `MiniPlayer` - Persistent bottom bar
- `PlayerScreen` - Full Now Playing view
- `ProgressBar` - Playback progress
- `LibraryItem` - Single library entry
- `LibraryList` - Scrollable list
- `LimitBanner` - Gentle free tier message
- `IconButton` - Navigation icons

### Customization Strategy

**Visual Direction (MVP):**
- Colors: Pure black on white — no gray, no zinc, no in-between
- Typography: Bold weight everywhere, system fonts, tight tracking on headings, relaxed line-height on body
- Borders: 1px solid black — defines all surfaces
- Animations: Minimal, only essential transitions
- Spacing: Generous, uncluttered, breathing room

**Theme:** Light mode only for MVP — clean, paper-like, Notion-inspired

**What We're Avoiding:**
- Pre-built component libraries
- Complex form components
- Modals and popovers
- Multiple color themes
- Anything not in the 3.5 screens

---

## Defining Experience

### The Core Interaction

**One-Sentence:** "Paste any article URL and start listening within 10 seconds."

**User Description:** "I paste a link and it just reads it to me."

### User Mental Model

**Expectations:**
- Paste a link → obvious input field
- Pick a voice → simple selector
- Tap play → audio starts immediately
- Walk away → background audio works

**Mental Models Leveraged:**
- Podcast player (familiar controls)
- Shazam (one action, instant result)
- YouTube (streaming starts fast)

### Success Criteria

| Criteria | Target |
|----------|--------|
| Speed | < 10 seconds to first audio |
| Quality | Human-sounding voice |
| Reliability | 90%+ URLs work first try |
| Simplicity | No confusion about next step |
| Background | Audio continues when locked |

### Pattern Analysis

**Established Patterns:**
- Paste input (universal)
- Streaming playback (YouTube model)
- Podcast controls (Overcast/Pocket Casts)
- Background audio (all audio apps)

**Our Innovation:**
- Speed: URL → Audio in 10 seconds
- Friction: Zero configuration required
- Quality: Voice that doesn't feel robotic

### Experience Mechanics

**Flow:**
1. **Initiation:** Open app → See paste input (no splash, no onboarding)
2. **Input:** Paste URL → Auto-detect → Show title preview → Voice pre-selected
3. **Generation:** Tap Play → Progress indicator → Audio streams in < 10s
4. **Playback:** Lock phone → Walk away → Lock screen controls work
5. **Completion:** Article ends → Next plays or gentle stop → Marked as played

**Error Handling:**
- Invalid URL: "That doesn't look like a URL"
- Parse failed: "Couldn't extract. [Report] [Try Another]"
- Network error: "No connection. Try again?"

**Principle:** Errors are dismissible, never blocking.

---

## Visual Design Foundation

### Color System

**Theme:** Pure Black & White — two colors only, maximum contrast, zero ambiguity.

**Inspiration:** dinq.me, backenrich.com, Notion — stark monochrome, bold type, clean borders.

**Palette (strict):**
- Background: White `#ffffff`
- Text: Black `#000000`
- Borders: Black `#000000`
- Buttons: Black on white, or white on black (inverted for hover/CTA)
- No gray. No zinc. No in-between tones.

**Semantic (only exceptions to B&W):**
- Error: Red `#ef4444`
- Success: Green `#22c55e`

**Design Rules:**
- Only black and white exist. No gray text, no gray borders, no gray backgrounds.
- Borders define surfaces — always 1px solid, always black or white depending on contrast.
- High contrast is the aesthetic, not a compromise.
- No gradients, no shadows, no opacity tricks.
- If something needs visual hierarchy, use size and weight — not color.

### Typography System

**Fonts:** System fonts (SF Pro, Roboto, system-ui)

**Weight:** Bold everywhere. All text is bold. No regular, no medium, no semibold — just bold.

**Scale:**
- H1: 28px Bold
- H2: 22px Bold
- Body: 16px Bold
- Caption: 14px Bold
- Small: 12px Bold

### Spacing & Layout Foundation

**Base Unit:** 4px
**Scale:** 4, 8, 16, 24, 32, 48px
**Feel:** Generous, uncluttered, breathing room

### Accessibility Considerations

- Contrast ratio: 21:1 (AAA compliant) — pure black on white / white on black
- Touch targets: Minimum 44x44px
- Focus states: Visible black border (2px solid)
- Light theme for clean, paper-like readability

---

## Web Application Screens

**Context:** The web app is secondary to mobile. It serves backend testing, marketing, and admin purposes. Web is NOT feature-parity with mobile and is NOT optimized for "listening while walking."

**Design System:** Same pure black on white theme as mobile (bg-white, text-black, no gray/zinc).

### 1. Landing Page

**Purpose:** Marketing page to drive app store downloads and establish product positioning.

**Key Elements:**
- Hero section with tagline: "Any article. Any voice. 10 seconds."
- Demo video or animated illustration showing paste → listen flow
- 3-4 feature highlights (voice quality, streaming speed, podcast controls)
- App Store + Google Play download buttons (prominent)
- "Try on Web" secondary CTA (links to dashboard)
- Testimonials or social proof section (future)
- Footer with links (Privacy, Terms, Contact)

**Limitations vs Mobile:**
- N/A - this is a marketing page, not a product feature

---

### 2. Web Auth

**Purpose:** User authentication for web dashboard access using same Supabase auth as mobile.

**Key Elements:**
- Login form (email + password)
- Sign up form (email + password + confirm)
- "Forgot password" link
- OAuth buttons (Google, Apple) - same providers as mobile
- Link to app stores for mobile download
- Minimal branding (logo + tagline)

**Limitations vs Mobile:**
- Same auth system, no feature differences

---

### 3. Web Dashboard

**Purpose:** Simplified interface for testing URL-to-audio flow and viewing library.

**Key Elements:**
- URL paste input (prominent, same UX as mobile Add screen)
- Voice selector dropdown
- "Generate" button
- Library list (table view with columns: Title, Date, Duration, Status)
- Play button for each library item
- Delete button for each library item
- Usage meter (articles remaining today)
- Upgrade CTA banner (for free users)

**Limitations vs Mobile:**
- No background audio when tab is hidden
- No playback queue management
- No playlist creation (library only)
- Simplified single-column layout

---

### 4. Web Player

**Purpose:** Basic audio playback for testing generated content without mobile device.

**Key Elements:**
- Article title and source URL
- Voice name indicator
- Play/Pause button (large, centered)
- Progress bar with seek capability
- Current time / Total duration display
- Playback speed selector (0.5x, 1x, 1.25x, 1.5x, 2x)
- Volume slider
- "Download to Mobile" CTA (app store links)

**Limitations vs Mobile:**
- No background audio playback (audio stops when tab hidden)
- No lock screen controls
- No sleep timer functionality
- No CarPlay/Android Auto integration
- No Bluetooth control integration
- HTML5 audio only (not podcast-optimized)
- Disclaimer banner: "For best experience, use the mobile app"

---

### 5. Admin Panel

**Purpose:** Internal tool for user management, system monitoring, and content moderation.

**Key Elements:**
- **User Management:**
  - User list table (email, signup date, plan, usage count)
  - Search/filter by email or plan type
  - View user details (usage history, subscription status)

- **System Metrics:**
  - API latency charts (response times)
  - TTS queue depth and processing times
  - Error rate dashboard
  - Active users (daily/weekly/monthly)

- **Moderation Queue:**
  - Reported URL parsing failures list
  - URL, error type, report count, user who reported
  - Actions: Mark fixed, Dismiss, Add to blocklist

- **Content Flags:**
  - Flagged content for review
  - Approve/Remove actions

**Access Control:**
- Admin-only authentication (role-based)
- Separate from regular user auth flow

**Limitations vs Mobile:**
- N/A - admin panel is web-only by design

---

### Web Design Guidelines

**Layout:**
- Max-width container (1200px) centered
- Responsive breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- Single-column layout for dashboard/player
- Multi-column tables for admin panel

**Components:**
- Use same design tokens as mobile (spacing, typography, colors)
- Buttons: Black text on white background with black border, or white text on black background (CTA)
- Inputs: White background, black border, black bold text
- Tables: White background, black borders, black bold text

**Typography:**
- Same scale as mobile (H1: 28px, H2: 22px, Body: 16px)
- Bold weight everywhere — no regular or medium weights
- Headings: `tracking-tight` for dense headlines
- Body text: `leading-relaxed` (line-height 1.6) for comfortable reading
- System fonts (Inter, SF Pro, Roboto, system-ui)

---
