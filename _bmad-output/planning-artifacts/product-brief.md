---
stepsCompleted: [vision, users, metrics, scope]
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
  - path: '_bmad-output/analysis/brainstorming-session-2026-01-19.md'
    type: 'brainstorming'
date: 2026-01-20
author: Tino
derivedFrom: PRD (reverse extraction)
---

# Product Brief: tsucast

## Vision & Problem Statement

### The Problem

People have reading lists full of articles they'll never read. Not because they don't want to - but because screen reading is exhausting, and life happens. Walking, commuting, exercising... these are moments lost to silence when they could be learning.

Traditional TTS solutions exist but they're built for accessibility, not enjoyment:
- Robotic voices that feel like work to listen to
- Read-along interfaces that demand attention
- Complex settings and configurations
- No podcast-style experience

### The Vision

**tsucast** is a podcast-native text-to-speech app that transforms any article or PDF into high-quality audio for listening on the go.

**Core Value Proposition:**
> "I've already found what I want to consume. Just transform it into audio that feels human, and get out of my way so I can walk."

### Brand Identity

**Tom Bombadil energy** - effortless magic, joyful, not a "productivity tool." The app doesn't explain itself. It just works, and it brings delight.

### What Makes It Different

| Traditional TTS | tsucast |
|-----------------|---------|
| Accessibility-focused | Podcast-focused |
| Read along with text | Close app and walk |
| Robotic voices | Human-feeling AI voices |
| Per-page/screen | Full article streaming |
| Settings-heavy | Zero configuration |

---

## Target Users

### Primary User Persona

**Alex - The Knowledge Worker**

- Has a growing "read later" list that never shrinks
- Already consumes podcasts regularly
- Wants to learn during walks, commutes, exercise
- Values efficiency but hates friction
- Willing to pay for tools that actually work

### User Behaviors

- Saves articles with good intentions, rarely reads them
- Already listens to podcasts/audiobooks during activities
- Prefers audio when multitasking
- Gets frustrated by complex tools
- Will share magic moments with friends

### Jobs to Be Done

1. **Transform saved content into audio** - so I can consume it during walks/commutes
2. **Listen without looking** - so I can do other things while learning
3. **Build a personal audio library** - so I can organize what I want to hear
4. **Experience quality voices** - so it doesn't feel like a chore

---

## Success Metrics

### Business Goals

| Timeframe | Metric | Target |
|-----------|--------|--------|
| 3 months | Paid users | 1,000 |
| 3 months | Engagement | 3+ sessions per week |
| 3 months | Growth | 5-7% week-over-week |
| 3 months | Virality | Organic word-of-mouth |
| 12 months | Milestone | YC acceptance |

### User Success Indicators

The core "aha!" moment: **paste an article and it works from the first sentence.**

- User hears audio within 10 seconds
- No tweaking, no settings - it just works
- Voice quality makes them forget it's AI
- They tell a friend

### Technical Success Criteria

| Metric | Target |
|--------|--------|
| Parse accuracy | > 95% clean extraction |
| Time to first audio | < 10 seconds |
| URL success rate | > 90% first try |
| Voice quality | Human-feeling AI clones |

### North Star Metric

**Weekly Active Listeners with 3+ sessions** - This captures both acquisition and retention, and directly measures whether people find value.

---

## Product Scope

### MVP Features (Phase 1)

| Feature | What It Does |
|---------|--------------|
| **Paste URL** | HTML pages + PDF support |
| **Voice Selection** | Choose from AI clone voices |
| **Language Selection** | Multi-language output |
| **Streaming Playback** | Start in < 10s, buffer in background |
| **Podcast Player** | Play, pause, skip, speed, sleep timer |
| **Library** | Your generated podcasts |
| **Accounts** | Login + sync across devices |
| **Free/Paid Tiers** | Daily limits, upgrade path |

### Platform Coverage

| Platform | MVP | Approach |
|----------|-----|----------|
| iOS | Yes | Expo + EAS Build (cloud) |
| Android | Yes | Expo + EAS Build (cloud) |
| Web | Yes | Expo Web |

### What's NOT in MVP

- Share sheet integration
- Offline downloads
- Ambient soundscapes
- Photo-to-audio
- Video support
- Auto voice-matching

### Future Vision (Post-MVP)

1. **Growth Phase:** Share sheet, expanded voices, sleep detection, offline mode
2. **Vision Phase:** Auto voice-to-author matching, photo → audio, video support, multi-article daily digest

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI voice quality not good enough | Research providers before building; this is make-or-break |
| Parsing fails on complex sites | Start with well-structured sites; report button for failures |
| < 10s streaming doesn't work | Build this first; if it fails, pivot or kill |
| Users don't want this | Ship fast, measure retention; word-of-mouth = validation |
| Competitors copy | Speed to market + brand differentiation |

---

## Technical Approach

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Expo (React Native) | JS knowledge, fast to MVP |
| Builds | EAS Build (cloud) | No Mac required for iOS |
| Backend | TBD (Node.js likely) | API for TTS, parsing, accounts |
| TTS | TBD | Research Fish Audio, Cartesia, ElevenLabs |

---

## Summary

**tsucast** solves a real problem (unread content) with a delightful solution (podcast-native TTS). The MVP is focused on one thing: **paste a URL, hear it in 10 seconds, walk away listening.**

Success looks like: 1,000 paid users in 3 months, powered by word-of-mouth from people who experience the magic moment.

The brand is Tom Bombadil - effortless, joyful, unexplained magic.

---

*Product Brief derived from PRD on 2026-01-20*
