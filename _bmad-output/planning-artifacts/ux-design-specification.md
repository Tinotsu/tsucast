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

**Web Player Capabilities:**
- ✅ Background audio playback (continues when screen off, like SoundCloud)
- ✅ Lock screen controls via Media Session API
- ✅ Sleep timer (works while audio playing)
- ✅ Bluetooth control integration (via Media Session)
- HTML5 Audio API (fully capable for podcast playback)

**Not Supported on Web:**
- CarPlay/Android Auto (native app only)
- Offline playback (requires native app with downloads)

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

## Web-First UX Revision (2026-01-29)

**Context:** This revision pivots from mobile-first to web-first design. The web app becomes the premium flagship that mobile apps will follow. Focus is on the core 3.5 app screens only (Landing, Pricing, Admin handled separately).

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Navigation** | Sidebar (icons + text) | Premium feel, persistent access, Apple Podcasts style |
| **Player** | Mini-player + full modal | Seamless playback across screens, industry standard |
| **Library** | Tabs (All / Playlists) | Clean organization, matches wireframe spirit |
| **Theme** | Light + Dark (#121212) | Dark gray night mode (Spotify style), softer on eyes |

### Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 768px | Bottom nav, stacked layout, full-width content |
| **Tablet** | 768px - 1024px | Collapsible sidebar, 2-column where appropriate |
| **Desktop** | > 1024px | Fixed sidebar, max-width content area, side-by-side layouts |

---

### Color System Revision

**Light Mode (Default):**
```
Background:     #FFFFFF (pure white)
Surface:        #FFFFFF (cards, inputs)
Border:         #000000 (pure black, 1px)
Text Primary:   #000000 (pure black)
Text Secondary: #000000 at 60% opacity
Accent:         #000000 (buttons, active states)
Error:          #EF4444 (red-500)
Success:        #22C55E (green-500)
```

**Night Mode:**
```
Background:     #121212 (dark gray)
Surface:        #1E1E1E (elevated surfaces)
Border:         #FFFFFF at 20% opacity
Text Primary:   #FFFFFF (pure white)
Text Secondary: #FFFFFF at 60% opacity
Accent:         #FFFFFF (buttons, active states)
Error:          #F87171 (red-400, lighter for dark bg)
Success:        #4ADE80 (green-400, lighter for dark bg)
```

**Design Rules:**
- No intermediate grays except for borders in dark mode
- Borders define all surfaces (1px solid)
- Use opacity for secondary text, not gray colors
- Accent is always the inverse of background (white on black, black on white)

---

### Navigation: Sidebar

**Desktop (> 1024px):**
```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────┐                                            │
│ │          │                                            │
│ │  tsucast │                                            │
│ │          │                                            │
│ ├──────────┤                                            │
│ │ ⊕ Add    │  ← Primary CTA, filled button              │
│ ├──────────┤                                            │
│ │ 📚 Library│ ← Active state: filled bg                 │
│ │ ⚙ Settings│                                           │
│ ├──────────┤                                            │
│ │          │                                            │
│ │          │                                            │
│ │          │                                            │
│ ├──────────┤                                            │
│ │ 🌙 Night │  ← Toggle at bottom                        │
│ └──────────┘                                            │
│    240px                        Content Area            │
└─────────────────────────────────────────────────────────┘
```

**Sidebar Specifications:**
- Width: 240px fixed (desktop), 72px collapsed (tablet), hidden (mobile)
- Logo: tsucast wordmark, links to /library
- Nav items: Icon (20px) + Label (14px bold), 48px height, 16px padding
- Active state: Inverted colors (white bg + black text in light mode)
- Night mode toggle: At bottom of sidebar, icon + "Night" label

**Mobile (< 768px):**
```
┌─────────────────────────────────────────────┐
│ Header: Logo ─────────────────────── ☰ Menu │
├─────────────────────────────────────────────┤
│                                             │
│              Content Area                   │
│                                             │
├─────────────────────────────────────────────┤
│   ⊕ Add      📚 Library     ⚙ Settings     │
│              (bottom nav)                   │
└─────────────────────────────────────────────┘
```

---

### Screen 1: Add URL (/add)

**Purpose:** Paste article URL, select voice, generate audio.

**Desktop Layout:**
```
┌─ Sidebar ─┬──────────────────────────────────────────┐
│           │                                          │
│  tsucast  │  ┌────────────────────────────────────┐  │
│           │  │                                    │  │
│  ⊕ Add ●  │  │        Generate Podcast           │  │
│  📚 Library│  │                                    │  │
│  ⚙ Settings│  │  ┌────────────────────────────┐   │  │
│           │  │  │ Paste article URL...       │   │  │
│           │  │  └────────────────────────────┘   │  │
│           │  │                                    │  │
│           │  │  Voice: [Default ▼]               │  │
│           │  │                                    │  │
│           │  │  ┌────────────────────────────┐   │  │
│           │  │  │ Estimated: 8 min           │   │  │
│           │  │  │ Credits: 1                 │   │  │
│           │  │  └────────────────────────────┘   │  │
│           │  │                                    │  │
│           │  │  [████████ Generate ████████]     │  │
│           │  │                                    │  │
│  🌙 Night │  └────────────────────────────────────┘  │
├───────────┼──────────────────────────────────────────┤
│           │  ▶ Currently Playing Title... ━━━━━━━━   │ ← Mini-player
└───────────┴──────────────────────────────────────────┘
```

**Components:**
1. **Page Header:** "Generate Podcast" (H1, 28px bold)
2. **URL Input:** Full-width, auto-focus, paste detection, border on focus
3. **Voice Selector:** Dropdown or chip group (Default, Paul, Sarah, etc.)
4. **Credit Preview Card:** Shows estimated duration, credits needed, balance
5. **Generate Button:** Full-width, primary style (inverted colors)
6. **Success State:** Transitions to player modal automatically

**Interactions:**
- URL paste triggers auto-preview (debounced 500ms)
- Generate shows loading spinner in button
- On success: Add to library + open player modal
- On error: Inline error message with retry

---

### Screen 2: Library (/library)

**Purpose:** Browse articles and playlists, manage content.

**Desktop Layout:**
```
┌─ Sidebar ─┬──────────────────────────────────────────┐
│           │                                          │
│  tsucast  │  Library                    [+ Create]   │
│           │  ─────────────────────────────────────   │
│  ⊕ Add    │  [ All ]  [ Playlists ]     ← Tabs      │
│  📚 Library●│                                         │
│  ⚙ Settings│  ┌──────────────────────────────────┐   │
│           │  │ ▶ │ Article Title Here         │   │
│           │  │   │ 12 min • Jan 28            │   │
│           │  │   │ ━━━━━━━━░░░░░░░░ 35%       │   │
│           │  ├──────────────────────────────────┤   │
│           │  │ ▶ │ Another Great Article      │   │
│           │  │   │ 8 min • Jan 27 • ✓ Played  │   │
│           │  │   │ ━━━━━━━━━━━━━━━━━━ 100%    │   │
│           │  ├──────────────────────────────────┤   │
│           │  │ ▶ │ Third Article Title        │   │
│           │  │   │ 15 min • Jan 26            │   │
│           │  │   │ New                         │   │
│           │  └──────────────────────────────────┘   │
│  🌙 Night │                                          │
├───────────┼──────────────────────────────────────────┤
│           │  ▶ Article Title... ━━━━━━━━━━━━ 4:32   │
└───────────┴──────────────────────────────────────────┘
```

**All Tab - Article List:**
- Each item: Play button (48px), Title (bold), Meta (duration, date, status)
- Progress bar under meta (if in progress)
- Hover: Show delete icon (right side)
- Click item: Start playback + open mini-player
- Swipe left (mobile): Reveal delete action

**Playlists Tab:**
```
┌──────────────────────────────────────────────────────┐
│  Playlists                          [+ New Playlist] │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ 📚  Morning Reads                    ▶  5 items│  │
│  ├────────────────────────────────────────────────┤  │
│  │ 🌙  Bedtime Stories                  ▶  3 items│  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Click playlist → Expand to show items              │
│  Drag items to reorder (desktop)                    │
└──────────────────────────────────────────────────────┘
```

**Playlist Expanded:**
- Shows all items in playlist
- Drag handle for reordering
- Remove item button
- Play all button
- Edit playlist name (inline)

---

### Screen 3: Player (Modal)

**Purpose:** Full playback experience with controls.

**Triggered by:** Clicking mini-player or tapping "expand" icon.

**Desktop Modal Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                              [✕]     │
│                                                      │
│            ┌────────────────────────┐                │
│            │                        │                │
│            │      🎧 Artwork        │   280x280px    │
│            │    (or placeholder)    │                │
│            │                        │                │
│            └────────────────────────┘                │
│                                                      │
│              How to Think for Yourself               │
│              paulgraham.com • Paul voice             │
│                                                      │
│         ━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░             │
│         4:32                            12:45        │
│                                                      │
│              ⏪ 15    ▶/⏸    ⏩ 15                  │
│                      (72px)                          │
│                                                      │
│    ─────────────────────────────────────────────    │
│                                                      │
│     1x        🌙         📋        📝               │
│    Speed     Sleep     Queue      Text               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Player Controls:**
1. **Artwork:** 280x280px placeholder (gradient or icon)
2. **Title:** H1 (24px bold), centered
3. **Source:** Meta text (14px, 60% opacity)
4. **Progress Bar:** Seekable, shows buffered state
5. **Time Display:** Current / Total
6. **Transport:** Skip -15s, Play/Pause (72px primary button), Skip +15s
7. **Extras Row:** Speed (0.5x-2x), Sleep timer, Queue, Show text

**Speed Options:** 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x

**Sleep Timer Options:** Off, 5 min, 15 min, 30 min, 45 min, 1 hour, End of article

**Web Player Capabilities:**
- ✅ Background audio works when screen is off (like SoundCloud)
- ✅ Sleep timer works via JavaScript timers + Media Session
- ✅ Lock screen controls via Media Session API
- Queue persists in localStorage

---

### Screen 3.5: Settings (/settings)

**Purpose:** Account management, preferences, night mode.

**Desktop Layout:**
```
┌─ Sidebar ─┬──────────────────────────────────────────┐
│           │                                          │
│  tsucast  │  Settings                                │
│           │  ─────────────────────────────────────   │
│  ⊕ Add    │                                          │
│  📚 Library│  Profile                                 │
│  ⚙ Settings●│  ┌────────────────────────────────────┐ │
│           │  │ 👤  Display Name                    │ │
│           │  │     email@example.com               │ │
│           │  └────────────────────────────────────┘ │
│           │                                          │
│           │  Credits                                 │
│           │  ┌────────────────────────────────────┐ │
│           │  │ 🎫  12 credits        [Buy More →] │ │
│           │  │     +45 min time bank              │ │
│           │  └────────────────────────────────────┘ │
│           │                                          │
│           │  Appearance                              │
│           │  ┌────────────────────────────────────┐ │
│           │  │ 🌙  Night Mode           [Toggle]  │ │
│           │  └────────────────────────────────────┘ │
│           │                                          │
│           │  Account                                 │
│           │  ┌────────────────────────────────────┐ │
│           │  │ Sign Out                           │ │
│           │  │ Delete Account                     │ │
│           │  └────────────────────────────────────┘ │
│           │                                          │
│           │  Legal                                   │
│           │  ┌────────────────────────────────────┐ │
│  🌙 Night │  │ Privacy Policy    Terms of Service│ │
│           │  └────────────────────────────────────┘ │
├───────────┼──────────────────────────────────────────┤
│           │  ▶ Currently Playing... ━━━━━━━━━━━━━   │
└───────────┴──────────────────────────────────────────┘
```

**Settings Sections:**
1. **Profile:** Avatar, name, email (read-only for now)
2. **Credits:** Current balance, time bank, buy more link
3. **Appearance:** Night mode toggle (persisted to localStorage)
4. **Account:** Sign out, Delete account (with confirmation modal)
5. **Legal:** Links to /privacy and /terms

---

### Mini-Player (Persistent)

**Purpose:** Always-visible playback bar when audio is playing.

**Desktop Layout (bottom of viewport):**
```
┌───────────────────────────────────────────────────────┐
│ ┌────┐                                                │
│ │ 🎧 │  Article Title Here...  ━━━━━━━░░░  4:32  ▶⏸  │
│ └────┘                                                │
│  48px        flex-grow           progress   time  btn │
└───────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 72px (desktop), 64px (mobile)
- Thumbnail: 48px square (artwork or placeholder)
- Title: Truncated with ellipsis
- Progress: Thin bar (4px) or text time
- Play/Pause: 40px button
- Click anywhere (except button): Opens full player modal

**States:**
- Hidden: No audio loaded
- Playing: Pause icon, progress updating
- Paused: Play icon, progress static
- Loading: Spinner in place of play icon

---

### Transitions & Animations (Apple Podcasts Inspiration)

**Principles:**
- Smooth, not flashy (200-300ms duration)
- Use transform and opacity (GPU accelerated)
- Ease-out for entering, ease-in for exiting

**Specific Animations:**
1. **Page transitions:** Fade (opacity 0→1, 200ms ease-out)
2. **Modal open:** Scale up from mini-player (0.95→1) + fade
3. **Modal close:** Scale down to mini-player (1→0.95) + fade
4. **List items:** Stagger fade-in on load (50ms delay per item, max 5)
5. **Hover states:** Background color transition (150ms)
6. **Night mode toggle:** All colors transition (300ms)

**CSS Variables for Theme:**
```css
:root {
  --bg: #FFFFFF;
  --surface: #FFFFFF;
  --border: #000000;
  --text-primary: #000000;
  --text-secondary: rgba(0, 0, 0, 0.6);
  --accent: #000000;
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
}

[data-theme="dark"] {
  --bg: #121212;
  --surface: #1E1E1E;
  --border: rgba(255, 255, 255, 0.2);
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --accent: #FFFFFF;
}
```

---

### Mobile Web Specifics (< 768px)

**Key Differences from Desktop:**
1. Bottom navigation instead of sidebar
2. Full-width cards and inputs
3. Mini-player above bottom nav
4. Player modal is full-screen (not centered modal)
5. Swipe gestures for delete/actions

**Bottom Navigation:**
```
┌─────────────────────────────────────────────────────┐
│  ⊕ Add         📚 Library         ⚙ Settings       │
│                  (active)                            │
└─────────────────────────────────────────────────────┘
Height: 64px + safe area inset
```

**Mobile Player (Full Screen):**
- Artwork: 280px centered
- Drag handle at top (swipe down to minimize)
- All controls stack vertically
- Extras in scrollable row

---

### Playlist Feature Specifications

**Create Playlist:**
- Trigger: "+ Create" button or "+ New Playlist" in tab
- Modal: Name input + Create button
- Default name: "New Playlist" (auto-selected for editing)

**Add to Playlist:**
- From library item: Long-press (mobile) or "..." menu (desktop)
- Options: Add to existing playlist OR create new
- Toast confirmation: "Added to [Playlist Name]"

**Playlist Detail View (Expanded):**
- Header: Playlist name (editable), item count, total duration
- Play all button
- Items: Drag to reorder, tap to play, swipe to remove
- Empty state: "Add articles from your library"

**API Mapping:**
| Feature | API Endpoint |
|---------|--------------|
| List playlists | GET /api/playlists |
| Create playlist | POST /api/playlists |
| Get playlist items | GET /api/playlists/:id |
| Add item | POST /api/playlists/:id/items |
| Remove item | DELETE /api/playlists/:id/items/:itemId |
| Reorder | PUT /api/playlists/:id/reorder |
| Rename | PATCH /api/playlists/:id |
| Delete playlist | DELETE /api/playlists/:id |

---

### Implementation Priority

**Phase 1: Core Structure**
1. Sidebar navigation component
2. Night mode toggle + theme system
3. Layout wrapper with mini-player slot

**Phase 2: Player Experience**
4. Mini-player component
5. Full player modal
6. Audio playback service (HTML5 Audio)

**Phase 3: Library Upgrade**
7. Tabs component (All / Playlists)
8. Playlist CRUD UI
9. Add to playlist flow

**Phase 4: Polish**
10. Transitions and animations
11. Mobile responsive refinements
12. Loading states and skeletons

---

### Backlog (Not in MVP, API Support Unclear)

| Feature | Notes |
|---------|-------|
| Queue management | API supports playlists, could adapt |
| Show article text | Would need new API endpoint |
| Share playlist | No API support yet |
| Collaborative playlists | No API support |
| Playback statistics | No API support |

---

### Library Tabs: All / Playlists / Explore

**Updated Tab Structure:**
```
[ All ]  [ Playlists ]  [ Explore ]
```

| Tab | Content | Source |
|-----|---------|--------|
| **All** | User's generated articles | `/api/library` |
| **Playlists** | User-created playlists | `/api/playlists` |
| **Explore** | Curated free content from admin | `/api/free-content` |

**Explore Tab Specifications:**
- Shows curated content added via admin dashboard
- No authentication required to play (free samples)
- Each item shows: Title, duration, play button
- No delete action (read-only)
- Can be added to user's playlists (if logged in)
- Goal: Showcase quality, drive conversions

**Explore Tab Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Explore                                             │
│  Curated articles to discover                        │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ ▶ │ Featured: How AI is Changing...     12 min│  │
│  ├────────────────────────────────────────────────┤  │
│  │ ▶ │ The Future of Remote Work           8 min │  │
│  ├────────────────────────────────────────────────┤  │
│  │ ▶ │ Understanding Climate Tech          15 min│  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [Sign up to save to your library]  ← if not logged  │
└──────────────────────────────────────────────────────┘
```

---

### Embeddable Player (Landing Page)

**Purpose:** Allow the player to be used on the landing page for demos and free content preview.

**Requirements:**
- Player component must work WITHOUT full app layout (no sidebar, no auth required)
- Can play free content items directly
- Mini-player can expand to modal overlay
- Should work in marketing pages (landing, free-content page)

**Implementation:**
- Create `<EmbeddablePlayer />` component that wraps the core player logic
- Accepts `audioUrl`, `title`, `duration` as props
- Does NOT require auth context
- Can be dropped into any page

**Landing Page Usage:**
```tsx
// On landing page
<EmbeddablePlayer
  audioUrl={freeContentItem.audio_url}
  title={freeContentItem.title}
  duration={freeContentItem.duration_seconds}
  showExpandButton={true}
/>
```

**Visual Treatment:**
- Same styling as app player (respects theme)
- Floating mini-player style OR inline card
- "Try the app →" CTA visible

---

### UI States & Edge Cases

#### Generation Flow States

**1. Idle State (Default)**
- URL input empty, placeholder visible
- Generate button disabled
- No preview card shown

**2. URL Entered State**
- URL input filled
- Loading preview: "Analyzing article..."
- Preview card appears with estimated duration/credits

**3. Generating State**
```
┌────────────────────────────────────────────────────┐
│                                                    │
│            ◐ Generating your podcast...           │
│                                                    │
│            ━━━━━━━━━━━━░░░░░░░░░░░░░              │
│            Extracting content...                   │
│                                                    │
│            This usually takes 5-10 seconds         │
│                                                    │
└────────────────────────────────────────────────────┘
```
- Spinner animation
- Progress indication (if available from API)
- Reassuring message
- Cancel button (optional)

**4. Success State**
- Player appears with generated audio
- "Added to Library" confirmation
- "Generate Another" and "View in Library" buttons
- Auto-play option (user preference)

**5. Error States**

| Error | Message | Action |
|-------|---------|--------|
| Invalid URL | "That doesn't look like a valid URL" | Clear input |
| Paywall detected | "This article is behind a paywall" | Try another |
| Parse failed | "Couldn't extract content from this page" | Report + Try another |
| Too long | "Article is too long (max 50,000 words)" | — |
| Network error | "Connection failed. Check your internet." | Retry |
| Insufficient credits | "Not enough credits" | Buy credits link |
| Rate limited | "Too many requests. Please wait." | Auto-retry countdown |

**Error UI:**
```
┌────────────────────────────────────────────────────┐
│  ⚠️  Couldn't extract content                      │
│                                                    │
│  This page might be behind a paywall or use       │
│  a format we don't support yet.                   │
│                                                    │
│  [Report Issue]    [Try Another URL]              │
└────────────────────────────────────────────────────┘
```

#### Empty States

**Empty Library (All Tab):**
```
┌────────────────────────────────────────────────────┐
│                                                    │
│                    📚                              │
│                                                    │
│           Your library is empty                   │
│                                                    │
│     Generate your first podcast to get started    │
│                                                    │
│         [+ Generate Podcast]                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Empty Playlists Tab:**
```
┌────────────────────────────────────────────────────┐
│                                                    │
│                    📋                              │
│                                                    │
│           No playlists yet                        │
│                                                    │
│     Create a playlist to organize your content    │
│                                                    │
│         [+ Create Playlist]                        │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Empty Playlist (Detail View):**
```
┌────────────────────────────────────────────────────┐
│  Morning Reads                           [Edit ✎]  │
│  0 articles • 0 min                                │
├────────────────────────────────────────────────────┤
│                                                    │
│           This playlist is empty                  │
│                                                    │
│     Add articles from your library                │
│                                                    │
│         [Browse Library]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Empty Explore Tab:**
```
┌────────────────────────────────────────────────────┐
│                                                    │
│                    🔍                              │
│                                                    │
│           No content to explore yet               │
│                                                    │
│     Check back soon for curated articles          │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Loading States (Skeletons)

**Library List Skeleton:**
```
┌────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ┌─────┐  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│  │░░░░░│  ░░░░░░░░░░ • ░░░░░░                     │
│  └─────┘                                           │
│  ┌─────┐  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│  │░░░░░│  ░░░░░░░░░░ • ░░░░░░                     │
│  └─────┘                                           │
│  ┌─────┐  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░            │
│  │░░░░░│  ░░░░░░░░░░ • ░░░░░░                     │
│  └─────┘                                           │
└────────────────────────────────────────────────────┘
```

- Pulse animation on skeleton blocks
- Match exact layout of loaded state
- 3 skeleton items by default

#### Toast Notifications

| Event | Message | Duration |
|-------|---------|----------|
| Added to playlist | "Added to Morning Reads" | 3s |
| Removed from playlist | "Removed from playlist" | 3s |
| Playlist created | "Playlist created" | 3s |
| Playlist deleted | "Playlist deleted" | 3s |
| Generation complete | "Your podcast is ready!" | 4s |
| Copied to clipboard | "Link copied" | 2s |
| Error | "Something went wrong. Try again." | 5s |

**Toast Position:** Bottom center (mobile), Bottom right (desktop)

**Toast Style:**
```
┌────────────────────────────────────────┐
│  ✓  Added to Morning Reads      [✕]   │
└────────────────────────────────────────┘
```

#### Confirmation Dialogs

**Delete Playlist:**
```
┌────────────────────────────────────────────────────┐
│  Delete "Morning Reads"?                           │
│                                                    │
│  This playlist will be permanently deleted.       │
│  Articles will remain in your library.            │
│                                                    │
│         [Cancel]        [Delete]                   │
└────────────────────────────────────────────────────┘
```

**Remove from Playlist:**
- No confirmation needed (can undo via toast)

**Delete from Library:**
```
┌────────────────────────────────────────────────────┐
│  Remove from library?                              │
│                                                    │
│  "How to Think for Yourself" will be removed.    │
│  It will also be removed from any playlists.      │
│                                                    │
│         [Cancel]        [Remove]                   │
└────────────────────────────────────────────────────┘
```

---

### Playback Completion Behavior

**When article finishes playing:**
1. Progress bar shows 100%
2. Play button changes to "replay" icon (↻)
3. Mark as "Played" in library
4. If in playlist: Auto-advance to next item (with 3s delay)
5. If last in playlist or single item: Stop playback
6. Mini-player remains visible with replay option

**Auto-advance indicator:**
```
┌────────────────────────────────────────────────────┐
│  Up next in 3s...                                  │
│  "The Age of AI"                      [Cancel]    │
└────────────────────────────────────────────────────┘
```

---

### Light Mode Visual Reference

**Light Mode Colors (already defined but for clarity):**
```
Background:     #FFFFFF
Surface:        #FFFFFF
Border:         #000000 (1px solid)
Text Primary:   #000000
Text Secondary: rgba(0, 0, 0, 0.6)
Accent/CTA:     #000000 bg, #FFFFFF text
```

**Light Mode UI Notes:**
- Maintain same layout/spacing as dark mode
- Borders become more prominent (define surfaces)
- Active states: Black background, white text
- Hover states: Light gray background or inverted
- All transitions apply equally

---

## API Checklist for Full Feature Support

### Currently Available ✅

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Generate audio from URL |
| `/api/generate/preview` | POST | Preview credit cost |
| `/api/generate/status/:id` | GET | Poll generation status |
| `/api/library` | GET | Get user's library |
| `/api/library` | POST | Add to library |
| `/api/library/:id` | DELETE | Remove from library |
| `/api/library/:id/position` | PATCH | Update playback position |
| `/api/playlists` | GET | List user's playlists |
| `/api/playlists` | POST | Create playlist |
| `/api/playlists/:id` | GET | Get playlist with items |
| `/api/playlists/:id` | PATCH | Rename playlist |
| `/api/playlists/:id` | DELETE | Delete playlist |
| `/api/playlists/:id/items` | POST | Add item to playlist |
| `/api/playlists/:id/items/:itemId` | DELETE | Remove item from playlist |
| `/api/playlists/:id/reorder` | PUT | Reorder playlist items |
| `/api/free-content` | GET | Get curated free content |
| `/api/user/profile` | GET | Get user profile |
| `/api/user/credits` | GET | Get credit balance |
| `/api/user/subscription` | GET | Get subscription status |
| `/api/user/account` | DELETE | Delete account |
| `/api/checkout/credits` | POST | Create Stripe checkout |
| `/api/checkout/session/:id` | GET | Get checkout session |

### Needs to be Added ❌

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/api/library/search` | GET | Search user's library by title | Medium |
| `/api/library?sort=` | GET | Sort library (date, duration, title) | Low |
| `/api/library/:id/text` | GET | Get original article text | Low |
| `/api/generate/progress/:id` | WS/SSE | Real-time generation progress | Medium |
| `/api/user/preferences` | GET/PATCH | User preferences (theme, autoplay) | Medium |
| `/api/free-content/:id/add` | POST | Add free content to user library | High |
| `/api/share/:audioId` | GET | Generate shareable link | Low |

### API Enhancement Suggestions

**1. Add free content to library (High Priority)**
```
POST /api/free-content/:id/add
Response: { success: true, libraryItemId: "..." }
```
Allows users to save Explore content to their own library.

**2. User preferences (Medium Priority)**
```
GET /api/user/preferences
Response: { theme: "dark", autoplay: true, playbackSpeed: 1.0 }

PATCH /api/user/preferences
Body: { theme: "light" }
```
Persist user settings server-side for cross-device sync.

**3. Generation progress (Medium Priority)**
```
GET /api/generate/progress/:id (SSE)
Events: { stage: "extracting" | "generating" | "uploading", percent: 0-100 }
```
Better UX for the 10-second wait.

**4. Library search (Medium Priority)**
```
GET /api/library?q=search+term
Response: { items: [...filtered items...] }
```
Useful once users have many items.

**5. Article text endpoint (Low Priority)**
```
GET /api/library/:id/text
Response: { text: "Full article content...", wordCount: 2500 }
```
Powers the "Text" button in player extras.

---

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Sidebar navigation component
- [ ] Bottom nav component (mobile)
- [ ] Theme system (CSS variables + context)
- [ ] Night mode toggle + localStorage persistence
- [ ] Layout wrapper with player slot
- [ ] EmbeddablePlayer component for landing page

### Phase 2: Player Experience
- [ ] Mini-player component
- [ ] Full player modal
- [ ] Audio playback service (HTML5 Audio API)
- [ ] Playback position save (debounced)
- [ ] Speed control UI
- [ ] Sleep timer UI

### Phase 3: Library & Tabs
- [ ] Tabs component (All / Playlists / Explore)
- [ ] Library list with progress indicators
- [ ] Playlist list view
- [ ] Playlist detail/expanded view
- [ ] Explore tab (free content)
- [ ] Playlist CRUD modals
- [ ] Add to playlist flow
- [ ] Drag-to-reorder (desktop)

### Phase 4: States & Polish
- [ ] Generation flow states (idle → loading → success/error)
- [ ] Empty states (library, playlists, explore)
- [ ] Skeleton loaders
- [ ] Toast notification system
- [ ] Confirmation dialogs
- [ ] Error boundaries
- [ ] Transitions and animations

### Phase 5: Responsive & Accessibility
- [ ] Tablet breakpoint (768-1024px)
- [ ] Light mode wireframe verification
- [ ] Keyboard navigation
- [ ] Focus states
- [ ] Screen reader labels
- [ ] Reduced motion support

---

## Tech Spec: Global Persistent Audio Player

### Problem

The current `WebPlayer` component:
- Creates a local `<audio>` element that stops on page navigation
- Cannot be controlled from other pages
- Has no mini-player persistence
- Doesn't integrate with browser Media Session API

### Solution: Apple Podcasts Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                AudioPlayerProvider                     │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         AudioService (Singleton)                │  │  │
│  │  │  - ONE HTMLAudioElement (persists forever)      │  │  │
│  │  │  - Media Session API integration                │  │  │
│  │  │  - State management (track, position, playing)  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  {children} ← All pages subscribe to player state     │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         MiniPlayer (fixed bottom bar)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │       PlayerModal (portal to document.body)     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose |
|-----------|---------|
| `AudioService` | Singleton class managing the audio element - persists forever |
| `AudioPlayerProvider` | React context wrapping entire app |
| `useAudioPlayer()` | Hook to control player from any component |
| `MiniPlayer` | Persistent bar at bottom (visible when track loaded) |
| `PlayerModal` | Full-screen player (portal to body) |
| `EmbeddablePlayer` | Standalone player for landing page (no auth required) |

### AudioService Singleton

```typescript
class AudioService {
  private static instance: AudioService;
  private audio: HTMLAudioElement;  // Created ONCE, never destroyed
  private state: AudioState;
  private listeners: Set<Callback>;

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Methods: play, pause, seek, setTrack, skip, setPlaybackRate
  // Events: subscribe, unsubscribe
  // Media Session: setupMediaSession, updateMediaSession
}
```

### Background Audio (REQUIREMENT)

Audio MUST continue playing when:
- User locks phone screen
- User switches to another app
- Browser is minimized
- Tab is in background

**How SoundCloud/Spotify achieve this:**
1. Single persistent `<audio>` element (never destroyed)
2. Media Session API configured before playback starts
3. Audio source set and playing before user navigates away
4. No dynamic creation/destruction of audio elements on navigation

**Critical Implementation Details:**
- Create audio element ONCE at app initialization
- Never call `audio.remove()` or let React unmount it
- Keep audio element in a singleton service, not component state
- Set Media Session metadata immediately when track loads

### Media Session API

Enables browser/OS media controls:
```typescript
navigator.mediaSession.setActionHandler('play', () => this.play());
navigator.mediaSession.setActionHandler('pause', () => this.pause());
navigator.mediaSession.setActionHandler('seekbackward', () => this.skipBack(15));
navigator.mediaSession.setActionHandler('seekforward', () => this.skipForward(15));

navigator.mediaSession.metadata = new MediaMetadata({
  title: track.title,
  artist: 'tsucast',
  artwork: [{ src: '/icons/icon-512.png', sizes: '512x512' }]
});
```

### Landing Page Usage (EmbeddablePlayer)

```tsx
// Works WITHOUT auth, WITHOUT full app layout
<EmbeddablePlayer
  audioUrl={freeContent.audio_url}
  title={freeContent.title}
  showExpandButton={true}  // "Open in app →"
/>
```

### File Structure

```
apps/web/
├── lib/
│   └── audio-service.ts          # Singleton audio service
├── providers/
│   └── AudioPlayerProvider.tsx   # React context provider
├── hooks/
│   └── useAudioPlayer.ts         # Hook to access player
└── components/player/
    ├── MiniPlayer.tsx            # Persistent bottom bar
    ├── PlayerModal.tsx           # Full-screen modal
    ├── EmbeddablePlayer.tsx      # Standalone for landing
    ├── ProgressBar.tsx           # Seekable progress
    ├── SpeedControl.tsx          # Speed selector
    └── VolumeControl.tsx         # Volume slider
```

### Browser Compatibility

| Feature | Chrome | Safari | Firefox | Mobile Safari |
|---------|--------|--------|---------|---------------|
| Audio playback | ✅ | ✅ | ✅ | ✅ |
| Persists navigation | ✅ | ✅ | ✅ | ✅ |
| Media Session | ✅ | ⚠️ Partial | ✅ | ✅ |
| Background (screen off) | ✅ | ✅ | ✅ | ✅ |

**Background Audio Requirement:** Audio MUST continue playing when:
- Browser tab is hidden/minimized
- Phone screen is locked/off
- User switches to another app

This is achievable (SoundCloud, Spotify Web do it) with:
1. Media Session API properly configured
2. Audio element in DOM (not dynamically created/destroyed)
3. User interaction to start playback (browser policy)

---

## Premium UX Polish (Spotify/Apple Podcasts Level)

### What Makes Playback Feel Premium

The difference between "functional" and "delightful" comes from micro-interactions, visual feedback, and smooth animations.

### 1. Mini-Player to Modal Transition

**Current:** Modal just appears
**Premium:** Mini-player morphs into full player

```
Animation sequence:
1. Mini-player starts expanding (scale + position)
2. Background dims with fade
3. Artwork scales up from mini-player thumbnail position
4. Controls fade in with slight delay
5. Duration: 300ms ease-out

Reverse on close:
1. Controls fade out
2. Artwork scales down to mini-player position
3. Background fades out
4. Mini-player appears in final position
```

**Implementation:** Use Framer Motion's `layoutId` for shared element transitions.

### 2. Play Button Animation

**Current:** Static icon swap
**Premium:** Morphing play/pause with scale bounce

```css
.play-button {
  transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.play-button:active {
  transform: scale(0.9);
}
```

**Icon transition:** Use animated SVG or Lottie for play→pause morph.

### 3. Progress Bar Interactions

**Current:** Basic HTML range input
**Premium:** Custom progress with scrubbing preview

| Feature | Description |
|---------|-------------|
| **Thumb enlarges on hover** | 8px → 16px |
| **Time tooltip follows thumb** | Shows "4:32" above thumb while dragging |
| **Buffered state visible** | Lighter shade shows loaded portion |
| **Scrub preview (optional)** | Hear audio at scrub position |
| **Haptic feedback (mobile)** | Vibrate on seek |

```
Visual:
Buffered:  ░░░░░░░░░░░░░░░░░░░░░░░░░░
Progress:  ━━━━━━━━━━━━━━░░░░░░░░░░░░
                        ●
                      [4:32]  ← tooltip
```

### 4. "Now Playing" Indicator

**Current:** No visual indication of which item is playing
**Premium:** Animated equalizer bars + highlight

```
Library item (playing):
┌────────────────────────────────────────┐
│  ▮▮▮  │  Article Title            │  ▮▮▮ = animated bars
│  ▮ ▮  │  12 min • Playing...      │
└────────────────────────────────────────┘

CSS animation:
@keyframes equalizer {
  0%, 100% { height: 4px; }
  50% { height: 16px; }
}
.bar { animation: equalizer 0.5s ease infinite; }
.bar:nth-child(2) { animation-delay: 0.1s; }
.bar:nth-child(3) { animation-delay: 0.2s; }
```

### 5. Artwork Ambient Background (Optional)

**Premium:** Blur of artwork creates ambient background color

```
Player modal background:
┌──────────────────────────────────────┐
│  ╔══════════════════════════════╗   │
│  ║                              ║   │  ← Blurred/dimmed
│  ║       🎧 Artwork             ║   │     artwork as
│  ║                              ║   │     background
│  ╚══════════════════════════════╝   │
│         Title                        │
│         Source                       │
└──────────────────────────────────────┘

Implementation:
- Extract dominant color from artwork (or use placeholder gradient)
- Apply as radial gradient behind player
- For B&W theme: Use subtle gray gradient instead
```

### 6. Loading States That Feel Fast

**Current:** Spinner
**Premium:** Optimistic UI + skeleton

| Scenario | Behavior |
|----------|----------|
| Play button pressed | Immediately show "loading" state, don't wait |
| Track loading | Show track info instantly, audio loads in bg |
| Seek action | Move progress immediately (optimistic) |
| Generation | Show skeleton of player while generating |

### 7. Skip Animation

**Current:** Just seek
**Premium:** Visual feedback showing seconds skipped

```
On skip -15s:
  ┌─────────────────┐
  │    ⏪ -15s      │  ← Overlay appears briefly
  └─────────────────┘
  Duration: 600ms fade out

Optional: Progress bar shows "jump" animation
```

### 8. Speed Change Animation

**Current:** Just changes number
**Premium:** Number animates between values

```
1x → 1.5x

Animation: Counter rolls through
1.0 → 1.1 → 1.2 → 1.3 → 1.4 → 1.5
Duration: 200ms
```

### 9. Toast Notifications

**Premium touches:**
- Slide in from bottom with spring physics
- Success toasts have subtle green accent
- Error toasts shake briefly
- Undo action has countdown indicator

```
┌────────────────────────────────────────┐
│ ✓  Added to Morning Reads    [Undo 5s] │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ ← countdown bar
└────────────────────────────────────────┘
```

### 10. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Skip back 15s |
| `→` | Skip forward 15s |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute toggle |
| `F` | Full player toggle |
| `Esc` | Close modal |

Show keyboard hint on hover:
```
[Play ▶]
  ↳ "Space to play"
```

### 11. Gesture Support (Mobile Web)

| Gesture | Action |
|---------|--------|
| Swipe down on modal | Close modal |
| Swipe left on mini-player | Skip forward |
| Swipe right on mini-player | Skip back |
| Long press on progress | Fine scrub mode |

### 12. Sound Design (Optional)

Subtle audio feedback:
- Soft click on play/pause (optional, user preference)
- Gentle "pop" on adding to playlist
- No sounds on errors (annoying)

---

## Premium UX Checklist

### Must Have (MVP)
- [ ] Mini-player to modal shared element transition
- [ ] Play button scale animation on press
- [ ] Progress bar with hover/drag states
- [ ] Now playing indicator (animated bars or highlight)
- [ ] Optimistic UI for play/seek actions
- [ ] Skip feedback overlay (-15s / +15s)
- [ ] Keyboard shortcuts (Space, arrows)
- [ ] Smooth page transitions (fade)

### Nice to Have (Post-MVP)
- [ ] Artwork ambient background
- [ ] Speed change number animation
- [ ] Toast with undo countdown
- [ ] Gesture support (swipe to close)
- [ ] Scrubbing time preview tooltip
- [ ] Buffered progress indicator
- [ ] Reduced motion support

### Dependencies for Premium Animations

| Library | Purpose | Bundle Size |
|---------|---------|-------------|
| `framer-motion` | Shared element transitions, springs | ~30kb |
| `@radix-ui/react-slider` | Accessible progress bar | ~5kb |
| `sonner` | Toast notifications | ~5kb |

**Alternative:** Use CSS animations + React state for lighter bundle.

---

## Implementation Priority (Updated)

### Phase 1: Core Structure
1. Sidebar navigation + bottom nav
2. Theme system + night mode
3. Layout wrapper with player slot

### Phase 2: Global Player (Critical)
4. **AudioService singleton**
5. **AudioPlayerProvider context**
6. **MiniPlayer component**
7. **PlayerModal component**
8. Media Session API
9. EmbeddablePlayer for landing

### Phase 3: Library & Tabs
10. Tabs (All / Playlists / Explore)
11. Library list with now-playing indicator
12. Playlist CRUD
13. Explore tab

### Phase 4: Premium Polish
14. **Mini-player ↔ modal transition**
15. **Play button animation**
16. **Progress bar premium interactions**
17. **Skip feedback overlay**
18. Keyboard shortcuts
19. Toast system with undo

### Phase 5: Responsive & Accessibility
20. Tablet breakpoint
21. Gesture support
22. Focus states
23. Reduced motion

---
