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
- Colors: Warm, inviting palette (avoid cold corporate blues)
- Spacing: 4px base unit (4, 8, 12, 16, 24, 32, 48)
- Border Radius: Soft and rounded (8px, 16px)
- Typography: Clean sans-serif, limited weights

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
- Colors: Black & white only - no color palette needed for MVP
- Typography: Clean, readable system fonts
- Borders: Used to define surfaces (1px gray borders)
- Animations: Minimal, only essential transitions
- Spacing: Generous, uncluttered

**Theme:** Dark mode only for MVP - simpler to implement, modern look

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

**Theme:** Monochrome Dark - minimal, focused, distraction-free

**MVP Design Philosophy:** Colors are not important for MVP. Ship fast with a simple black & white design. Visual polish comes later.

**Dark Theme Only (MVP):**
- Background: Black `#000000`
- Surface: Dark Gray `#1a1a1a` (cards, inputs)
- Border: Gray `#333333`
- Text Primary: White `#ffffff`
- Text Secondary: Gray `#888888`
- Primary Action: White text on dark, or inverted for buttons

**Semantic (minimal):**
- Error: Red `#ef4444`
- Success: Green `#22c55e`

**Design Approach:**
- Use borders to define surfaces instead of background colors
- High contrast for readability
- No gradients, no shadows, no complex color palette
- Focus on typography and spacing

### Typography System

**Fonts:** System fonts (SF Pro, Roboto, system-ui)

**Scale:**
- H1: 28px Bold
- H2: 22px Semibold
- Body: 16px Regular
- Caption: 14px Regular
- Small: 12px Medium

### Spacing & Layout Foundation

**Base Unit:** 4px
**Scale:** 4, 8, 16, 24, 32, 48px
**Feel:** Generous, uncluttered, breathing room

### Accessibility Considerations

- Contrast ratio: > 4.5:1 (AA compliant) - easily met with B&W
- Touch targets: Minimum 44x44px
- Focus states: Visible white ring
- Dark theme reduces eye strain

---
