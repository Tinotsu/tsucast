---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Features for tsucast (article-to-podcast converter)'
session_goals: 'Core MVP features for launch, User delight moments'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'SCAMPER Method', 'Inner Child Conference']
ideas_generated: [35]
context_file: '_bmad-output/planning-artifacts/bmm-workflow-status.yaml'
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Tino
**Date:** 2026-01-19

## Session Overview

**Topic:** Features for tsucast (article-to-podcast converter)
**Goals:** Core MVP features for launch, User delight moments

### Context Guidance

_Building an app where users paste any article URL and receive high-quality audio for listening while walking. Inspired by wanting to consume Paul Graham essays on the go. Core principle: Simple as possible - paste URL, get audio with the best voice._

### Session Setup

- **Focus Area:** Feature ideation for MVP launch
- **Success Criteria:** Identify essential features AND delightful touches
- **Approach:** Balance utility (must-haves) with magic (delight moments)

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Features for tsucast with focus on Core MVP features + User delight moments

**Recommended Techniques:**

1. **First Principles Thinking** (Creative): Strip assumptions, find core value - what's truly essential for "listen to articles while walking"
2. **SCAMPER Method** (Structured): Systematic 7-lens feature exploration for comprehensive MVP coverage
3. **Inner Child Conference** (Introspective Delight): Tap childlike wonder for memorable delight moments

**AI Rationale:** Dual-goal session requires both structured practical thinking (SCAMPER for MVP) and playful exploration (Inner Child for delight). First Principles grounds the session in core user value before feature generation.

## Technique 1: First Principles Thinking

### Core Insights Discovered

| Principle | Insight |
|-----------|---------|
| **Content Source** | No discovery/recommendations needed - user already curates via plasview or any link |
| **Core Value** | Format transformation: text → audio for walking time |
| **App Philosophy** | Single purpose, separate from plasview, does ONE thing well |
| **Flow** | Open → Paste/Select → Play (3 steps max) |
| **Voice = Connection** | Must feel like someone talking TO you, not a robot reading AT you |
| **Voice Flexibility** | AI clone: author's voice OR premium "radio" voices (Joe Rogan style) |

### The Fundamental Truth

> *"I've already found what I want to consume. Just transform it into audio that feels human, and get out of my way so I can walk."*

## Technique 2: SCAMPER Method

### MVP Features Extracted

| Category | Feature |
|----------|---------|
| **Core** | Paste any URL → get audio |
| **UI** | 3.5 screens: Paste+Voice, Player, Library, (Account) |
| **Player** | Standard podcast controls (progress, speed, sleep, transcript) |
| **Input** | Share sheet integration ("Listen in tsucast") |
| **Voice** | AI clone voices, user selects |
| **Parsing** | Clean article extraction (not HTML) |
| **Speed** | Fast generation - no long waits |
| **Sync** | Cloud storage, access anywhere |
| **Notifications** | "Your podcast is ready" push |
| **Friction** | No settings, optional signup |

### Future Features Noted

- Playlists (instead of categories)
- Multi-article merge → daily podcast
- Photo → audio (books for kids)
- Auto voice-to-author matching
- Offline mode with good local voice
- Video content support
- PDF / research paper support

### Key Principles from SCAMPER

- **Substitute:** Complexity → radical simplicity (3.5 screens)
- **Combine:** Paste + Play as close to one action as possible
- **Adapt:** Podcast player UI yes, podcast app complexity no
- **Modify:** Magnify voice quality + parsing, minimize settings to zero
- **Eliminate:** Everything that isn't paste → play → listen
- **Reverse:** Push "ready" notifications, auto-match voice to author

## Technique 3: Inner Child Conference

### The WHOA Moment

> *"Finding a big book that seems terrible to read but with an amazing cover like LOTR, pasting the PDF, and having Tolkien reading it in French while I'm going to sleep."*

### Delight Moments Discovered

| Delight | Feature Translation |
|---------|---------------------|
| **Author reads their own work** | Famous author voice clones (Tolkien, Paul Graham, etc.) |
| **It has the MUSIC** | Ambient soundscapes matched to content type |
| **Infinite patience** | No interruptions, goes until you sleep |
| **Knows when you slept** | Sleep detection + morning "resume here?" prompt |
| **"ANY other thing"** | Universal: URL, PDF, anything - the magic is unlimited |
| **The viral demo** | "Bro I have Tolkien reading me LOTR" - jaw-drop moment |

### The Viral Demo Flow

1. Show friend the app
2. Paste LOTR PDF
3. Select "Tolkien" voice
4. Hit play
5. Watch their face
6. "Now paste anything you want"

### App Character: Tom Bombadil Energy

| Tom Bombadil | Tsucast Vibe |
|--------------|--------------|
| Sings instead of talks | Voice that feels alive, not robotic |
| Magic without explanation | Paste → audio. Don't ask how. |
| Joyful and light | Not a "productivity tool" - a delightful companion |
| Ancient but playful | Powerful AI, but UX is fun, not intimidating |
| "Come in, let me tell you a story" | The whole app IS that invitation |

## Idea Organization & Prioritization

### Platform Strategy

| Platform | MVP? | How |
|----------|------|-----|
| **Web** | MVP | Works on any device |
| **iOS** | MVP | Cloud build (EAS/Codemagic) from Linux |
| **Android** | MVP | Cloud build from Linux |
| **Desktop** | Future | Or just use web |

**Research needed:** Pick Flutter vs React Native vs Web-first (PWA)

### The 3.5 Interfaces

| Screen | Purpose |
|--------|---------|
| **1. Add Content** | Paste URL + choose voice + choose language |
| **2. Player** | Classic podcast controls |
| **3. Library** | Playlist of saved podcasts |
| **(.5) Account** | Basic login/sync |

### MVP Features

| Feature | Details |
|---------|---------|
| Paste URL | HTML pages + PDF support |
| Choose voice | AI clone voice selection |
| Choose language | Multi-language output |
| Player | Classic podcast controls (play, pause, skip, speed, sleep timer) |
| Library | Playlist of generated podcasts |
| Account | Basic login/sync |
| Push notifications | Mobile |

### Future Features

| Feature | Category | Notes |
|---------|----------|-------|
| Share sheet integration | UX | "Listen in tsucast" from browser |
| Sleep detection + auto-resume | Delight | Knows when you fell asleep |
| Ambient soundscapes | Delight | LOTR music, coffee shop vibes |
| Auto voice-to-author matching | Delight | Paul Graham article → Paul Graham voice |
| Photo → audio | Expansion | Point camera at book, get audio |
| Video support | Expansion | Extract content from videos |
| Multi-article merge | Expansion | Daily digest podcast |

### Research Needed

- [ ] Best AI voice tech (quality + speed + cost)
- [ ] Article parsing/extraction libraries
- [ ] Flutter vs React Native vs PWA for cross-platform from Linux
- [ ] Cloud build services (EAS Build, Codemagic)
- [ ] Competitor analysis (Pocket listen, Speechify, etc.)

## Session Summary

### The Fundamental Truth

> *"I've already found what I want to consume. Just transform it into audio that feels human, and get out of my way so I can walk."*

### The Viral Demo

> *"Bro I have Tolkien reading me LOTR, and he can read ANY other thing!!!"*

### The Brand Vibe

**Tom Bombadil Energy:** Effortless magic, joyful, not a "productivity tool" - a delightful companion that invites you in to hear a story.

### Key Insights

1. **Content is already curated** - tsucast transforms, doesn't recommend
2. **Simplicity is the feature** - 3.5 screens, no settings, paste → play
3. **Voice = connection** - must feel like someone talking TO you
4. **Magic through AI** - what wasn't possible before, now is
5. **Sleep/bedtime is a key use case** - infinite patience, gentle experience

### Session Achievements

- **3 techniques completed:** First Principles, SCAMPER, Inner Child Conference
- **~35 ideas generated** across MVP features and future delight moments
- **Clear MVP scope defined:** 3.5 interfaces, 7 core features
- **Brand personality discovered:** Tom Bombadil - joyful, magical, welcoming
- **Viral moment identified:** "Tolkien reads LOTR"

