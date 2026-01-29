---
date: 2026-01-29
author: Tino
project: tsucast
type: ux-specification
scope: landing-page-and-marketing
---

# Landing Page & Marketing Pages UX Specification

**Author:** Tino
**Date:** 2026-01-29
**Related:** `ux-design-specification.md` (main app screens)

---

## Overview

This document defines the premium landing page designed for conversion (1,000 paid subscribers in 3 months). The goal is "see it → try it → sign up" — visitors experience the magic before committing.

**Design Inspiration:**
- **dinq.me** — Minimalist Swiss-style, bold typography, dark theme elegance
- **bookmarkify.io** — Subtle scroll-triggered animations, staggered reveals
- **backenrich.com** — Interactive demo that lets you experience the product

**Scope:**
- Landing page (`/`)
- Login page (`/login`)
- Signup page (`/signup`)
- Upgrade page (`/upgrade`)
- Admin extensions (FAQ management, featured content)

---

## Landing Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ Logo | Pricing | Sign In | [🌙 Night Toggle]            │
├─────────────────────────────────────────────────────────┤
│ HERO                                                    │
│ Headline + Typing Animation + Audio Player              │
├─────────────────────────────────────────────────────────┤
│ FREE SAMPLES                                            │
│ 2-3 curated podcasts (from admin free-content)          │
├─────────────────────────────────────────────────────────┤
│ FEATURES                                                │
│ 6 features with animations and interactivity            │
├─────────────────────────────────────────────────────────┤
│ FOUNDER STORY                                           │
│ Photo + "Why I built this"                              │
├─────────────────────────────────────────────────────────┤
│ PRICING                                                 │
│ Credit packs                                            │
├─────────────────────────────────────────────────────────┤
│ FAQ                                                     │
│ Admin-managed Q&A                                       │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Section 1: Header

**Purpose:** Minimal navigation with night mode toggle.

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  tsucast          Pricing    Sign In    [🌙]            │
└─────────────────────────────────────────────────────────┘
```

**Mobile Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  tsucast                               [🌙]    [☰]      │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Logo: tsucast wordmark, links to `/`
- Nav items: Pricing (anchor link), Sign In (`/login`)
- Night mode toggle: Icon button, persists to localStorage
- Mobile: Hamburger menu for nav items
- Sticky on scroll with backdrop blur

**Animation:**
- Header fades in on page load (200ms)
- Smooth color transition on night mode toggle (300ms)

---

## Section 2: Hero

**Purpose:** Instant understanding + proof of magic. The hero has two parts: an animation showing how it works, and a real audio player proving it works.

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              Any article. Any voice.                    │
│                   10 seconds.                           │
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │                                             │     │
│     │  ┌───────────────────────────────────────┐  │     │
│     │  │ https://paulgraham.com/think.html█    │  │     │
│     │  └───────────────────────────────────────┘  │     │
│     │                                             │     │
│     │           ━━━━━━━━░░░░░░░░░ Processing...   │     │
│     │                                             │     │
│     │              ✓ Ready to play               │     │
│     │                                             │     │
│     └─────────────────────────────────────────────┘     │
│                  ↑ Animation Loop                       │
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │                                             │     │
│     │  How to Think for Yourself                  │     │
│     │  Paul Graham • 12 min                       │     │
│     │                                             │     │
│     │  ━━━━━━━━━━━━━░░░░░░░░░░░░  4:32 / 12:45   │     │
│     │                                             │     │
│     │           [  ▶  PLAY  ]                     │     │
│     │                                             │     │
│     └─────────────────────────────────────────────┘     │
│                  ↑ Real Audio Player                    │
│                                                         │
│              [ Get Started Free → ]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Hero Headline:**
- Text: "Any article. Any voice. 10 seconds."
- Style: H1 (48px bold desktop, 32px mobile), centered
- Animation: Fade in + slight slide up (300ms, staggered)

**Typing Animation Component:**

The animation demonstrates the core flow in a continuous loop:

```
Phase 1: Typing (2s)
├── Empty input field with blinking cursor
├── URL types character by character (50ms per char)
└── Example: "https://paulgraham.com/think.html"

Phase 2: Processing (1.5s)
├── Progress bar animates from 0% to 100%
├── Text: "Processing..." with subtle pulse
└── Simulates the <10 second generation

Phase 3: Ready (2s)
├── Checkmark appears with scale animation
├── Text: "Ready to play"
└── Hold for recognition

Phase 4: Reset (0.5s)
├── Fade out
└── Loop back to Phase 1
```

**Timing:** Total loop = 6 seconds, runs continuously.

**Real Audio Player:**

Below the animation, a functional audio player with admin-managed content:

| Element | Specification |
|---------|---------------|
| Title | Bold, 20px, from `free_content.title` |
| Source | Author/domain extracted, 14px, 60% opacity |
| Duration | Total duration from `free_content.duration_seconds` |
| Progress Bar | Seekable, shows current position |
| Play Button | Large (56px), primary style, centered |

**Admin Integration:**
- Featured article is the FIRST item from `free_content` table marked as `featured: true`
- Admin can change featured article via `/admin/free-content` (add `featured` toggle)
- Title displays prominently so visitors recognize famous content

**CTA Button:**
- Text: "Get Started Free →"
- Style: Primary button (white on black / black on white in night mode)
- Links to `/signup`

---

## Section 3: Free Samples

**Purpose:** Let visitors try more content without signing up.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    Try These Free                       │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│  │ ▶ │ Article 1   │  │ ▶ │ Article 2   │  │ ▶ │ ... │ │
│  │   │ 8 min       │  │   │ 12 min      │  │   │      │ │
│  └─────────────────┘  └─────────────────┘  └──────────┘ │
│                                                         │
│         ← Horizontal scroll on mobile →                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Heading: "Try These Free" (H2, 28px bold)
- Cards: Horizontal row, 3 visible on desktop, scroll on mobile
- Each card: Play button + Title + Duration
- Data source: `free_content` table (non-featured items)
- Clicking card opens inline player (expands card)

**Animation:**
- Cards fade in with stagger (50ms delay each) on scroll into view
- Play button scales on hover (1.05x)

---

## Section 4: Features

**Purpose:** Highlight key capabilities with engaging animations and interactivity.

**6 Features (in order):**

| # | Feature | Type | Description |
|---|---------|------|-------------|
| 1 | Lightning Fast | Animated | Show speed: "<10 seconds" |
| 2 | Premium AI Voices | Interactive | Voice tester with samples |
| 3 | Works Anywhere | Animated | Supported content types |
| 4 | Sleep Timer | Animated | Bedtime listening |
| 5 | Personal Library | Static | Save and organize |
| 6 | Speed Control | Static | 0.5x to 2x playback |

**Layout (Desktop):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                 Everything You Need                     │
│                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │   ⚡ Lightning Fast   │  │  🎙️ Premium Voices    │   │
│  │                       │  │                       │   │
│  │   [Animated counter]  │  │  [Voice selector]     │   │
│  │   URL → Audio in      │  │  Adam Sarah Michael   │   │
│  │   < 10 seconds        │  │  [▶ Play sample]      │   │
│  │                       │  │                       │   │
│  └───────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │   🌐 Works Anywhere   │  │  🌙 Sleep Timer       │   │
│  │                       │  │                       │   │
│  │   [Rotating icons]    │  │  [Moon animation]     │   │
│  │   Articles • Blogs    │  │  Fall asleep          │   │
│  │   PDFs • Newsletters  │  │  listening            │   │
│  │                       │  │                       │   │
│  └───────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │   📚 Personal Library │  │  ⏩ Speed Control     │   │
│  │                       │  │                       │   │
│  │   Save articles,      │  │  0.5x to 2x           │   │
│  │   resume anywhere     │  │  playback speed       │   │
│  │                       │  │                       │   │
│  └───────────────────────┘  └───────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Feature 1: Lightning Fast (Animated)**
```
Animation sequence (loops):
1. Counter starts at 0
2. Counts up to 10 (100ms per number)
3. At 8, shows "✓ Ready!"
4. Hold 2s, reset
```
- Shows the speed promise visually
- Number animates with easing

**Feature 2: Premium AI Voices (Interactive)**
```
┌─────────────────────────────────────┐
│  🎙️ Premium AI Voices              │
│                                     │
│  [ Adam ]  [ Sarah ]  [ Michael ]   │
│     ↑ selected                      │
│                                     │
│  "The best way to predict the       │
│   future is to invent it."          │
│                                     │
│         [ ▶ Play Sample ]           │
└─────────────────────────────────────┘
```
- Voice chips: Click to select
- Sample text: Short quote (admin-configurable)
- Play button: Plays pre-generated sample audio
- Audio samples: Pre-generated and stored (not live TTS)

**Feature 3: Works Anywhere (Animated)**
```
Animation (carousel):
├── Icon: 📰 "Articles"
├── Icon: ✍️ "Blogs"
├── Icon: 📄 "PDFs"
├── Icon: 📧 "Newsletters"
└── Loop with crossfade (2s each)
```

**Feature 4: Sleep Timer (Animated)**
```
Animation:
├── Moon icon gently pulses
├── Stars twinkle around it
├── Text fades between timer options:
│   "5 min" → "15 min" → "30 min" → "End of article"
└── Calming, slow animation (3s per state)
```

**Feature 5 & 6: Static Cards**
- Icon + Title + Description
- No animation, clean presentation
- Fade in on scroll

**Animation Triggers:**
- All features animate on scroll into viewport
- Stagger: 100ms delay between cards
- Animations pause when not visible (IntersectionObserver)

---

## Section 5: Founder Story

**Purpose:** Build trust and human connection.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐                                           │
│  │          │   Why I Built tsucast                     │
│  │  [Photo] │                                           │
│  │          │   "I had hundreds of saved articles I     │
│  │  Tino    │   never read. Podcasts worked for me,     │
│  └──────────┘   but articles didn't. So I built         │
│                 something to turn any article into      │
│                 a podcast I could listen to while       │
│                 walking, cooking, or falling asleep."   │
│                                                         │
│                 — Tino, Founder                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Photo: `/images/founder.webp` (convert from `/tinophoto.jpg`)
- Size: 120px circle with border
- Quote: Italic style, 18px, max 3-4 sentences
- Signature: Bold, right-aligned

**Animation:**
- Fade in on scroll
- Photo slightly scales up (1.0 → 1.02) on hover

---

## Section 6: Pricing

**Purpose:** Clear credit-based pricing with conversion focus.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                     Simple Pricing                      │
│            Pay for what you use. No subscription.       │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │   ☕    │  │   🍖    │  │   🍕    │  │   🍱    │    │
│  │ Coffee  │  │ Kebab   │  │ Pizza   │  │ Feast   │    │
│  │         │  │         │  │         │  │         │    │
│  │ 5 cred  │  │ 15 cred │  │ 50 cred │  │150 cred │    │
│  │  $5     │  │  $12    │  │  $35    │  │  $89    │    │
│  │         │  │ POPULAR │  │         │  │ BEST    │    │
│  │ [Buy]   │  │ [Buy]   │  │ [Buy]   │  │ [Buy]   │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │
│                                                         │
│              1 credit ≈ 1 article (~10 min)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Heading: "Simple Pricing" (H2)
- Subheading: "Pay for what you use. No subscription."
- Cards: 4 packs in horizontal row
- Popular badge: Highlight on Kebab pack
- Best value badge: Highlight on Feast pack
- Buy button: Links to `/login` then redirect to checkout

**Animation:**
- Cards stagger fade in (50ms delay)
- Hover: Card lifts slightly (translateY -4px)

---

## Section 7: FAQ

**Purpose:** Answer common questions, reduce friction.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              Frequently Asked Questions                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ What links work with tsucast?              [+]  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ What doesn't work?                         [+]  │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ How long can articles be?                  [+]  │    │
│  │                                                 │    │
│  │ Articles up to 50,000 words are supported.     │    │
│  │ That's about 4-5 hours of audio.               │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Is there a free trial?                     [+]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Heading: "Frequently Asked Questions" (H2)
- Accordion: Click to expand/collapse
- Data source: New `faq_items` table (admin-managed)
- Order: `position` field for sorting

**Animation:**
- Expand: Height animates smoothly (300ms ease-out)
- Arrow: Rotates 180° on expand
- Content: Fades in (200ms delay after height)

**Admin Integration:**
- New admin page: `/admin/faq`
- CRUD for FAQ items (question, answer, position, published)
- Drag to reorder

---

## Section 8: Footer

**Purpose:** Legal links, secondary navigation.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  tsucast                                                │
│  Turn any article into a podcast.                       │
│                                                         │
│  Product          Legal           Connect               │
│  Features         Privacy         Twitter               │
│  Pricing          Terms           Email                 │
│  Download App     Contact                               │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  © 2026 tsucast. All rights reserved.                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Logo + tagline left-aligned
- 3 link columns
- Divider line
- Copyright at bottom
- Night mode: Inverted colors

---

## Login Page Refresh

**Purpose:** Visual refresh to match landing page premium feel.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      tsucast                            │
│                                                         │
│              ┌─────────────────────────┐                │
│              │                         │                │
│              │      Welcome back       │                │
│              │                         │                │
│              │  Email                  │                │
│              │  ┌───────────────────┐  │                │
│              │  │                   │  │                │
│              │  └───────────────────┘  │                │
│              │                         │                │
│              │  Password               │                │
│              │  ┌───────────────────┐  │                │
│              │  │                   │  │                │
│              │  └───────────────────┘  │                │
│              │                         │                │
│              │  [    Sign In    ]      │                │
│              │                         │                │
│              │  ─── or continue with ──│                │
│              │                         │                │
│              │  [ G  Google ]          │                │
│              │                         │                │
│              │  Don't have an account? │                │
│              │  Sign up →              │                │
│              │                         │                │
│              │  Forgot password?       │                │
│              │                         │                │
│              └─────────────────────────┘                │
│                                                         │
│                        [🌙]                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Specifications:**
- Centered card layout
- Logo at top
- "Welcome back" heading
- Clean input fields with black border
- Primary button full-width
- OAuth divider
- Links: Sign up, Forgot password
- Night mode toggle at bottom

**Animation:**
- Card fades in + slides up on load (300ms)
- Button shows loading spinner on submit

---

## Signup Page Refresh

**Purpose:** Match login page design with additional fields.

**Layout:** Same as login with:
- Heading: "Create your account"
- Fields: Email, Password, Confirm Password
- Button: "Create Account"
- OAuth option
- Link: "Already have an account? Sign in →"
- Legal: "By signing up, you agree to our Terms and Privacy Policy"

---

## Upgrade Page Refresh

**Purpose:** Credit purchase page for authenticated users.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │                                            │
│            │         Get More Credits                   │
│            │                                            │
│            │  Current balance: 3 credits                │
│            │  Time bank: 12 minutes                     │
│            │                                            │
│            │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│            │  │   ☕    │  │   🍖    │  │   🍕    │     │
│            │  │ Coffee  │  │ Kebab   │  │ Pizza   │     │
│            │  │ 5 cred  │  │ 15 cred │  │ 50 cred │     │
│            │  │  $5     │  │  $12    │  │  $35    │     │
│            │  │ [Buy]   │  │ [Buy]   │  │ [Buy]   │     │
│            │  └─────────┘  └─────────┘  └─────────┘     │
│            │                                            │
│            │  ┌─────────────────────────────────────┐   │
│            │  │ 🍱 Feast Pack                       │   │
│            │  │ 150 credits for $89                 │   │
│            │  │ Best value — 41% savings            │   │
│            │  │ [Buy Feast Pack]                    │   │
│            │  └─────────────────────────────────────┘   │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

**Specifications:**
- Shows current credit balance prominently
- Same pricing cards as landing page
- Feast pack gets featured treatment (larger card)
- Buy buttons trigger Stripe checkout

---

## Admin Extensions

### 1. Featured Hero Content

Add to `/admin/free-content`:
- Toggle: "Feature on landing page" (only one at a time)
- Featured item appears in landing page hero

### 2. FAQ Management

New page: `/admin/faq`

```
┌─────────────────────────────────────────────────────────┐
│  FAQ Management                        [+ Add Question] │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ☰ │ What links work with tsucast?          [Edit][Del]│
│  ☰ │ What doesn't work?                     [Edit][Del]│
│  ☰ │ How long can articles be?              [Edit][Del]│
│  ☰ │ Is there a free trial?                 [Edit][Del]│
│                                                         │
│  Drag ☰ to reorder                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**FAQ Item Fields:**
- `question` (text, required)
- `answer` (text/markdown, required)
- `position` (integer, for ordering)
- `published` (boolean, default true)

### 3. Voice Samples for Feature Section

- Pre-generate voice samples with same quote
- Store in R2 alongside free content
- Admin can update the sample quote

---

## Animation & Transition Specifications

### Scroll Animations (IntersectionObserver)

```javascript
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

// Animation classes
.animate-fade-in {
  animation: fadeIn 500ms ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 500ms ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Stagger Delays

- Use CSS custom properties: `--stagger-delay: calc(var(--index) * 50ms)`
- Apply via inline style: `style={{ '--index': index }}`

### Typing Animation

```javascript
// Typing effect config
const TYPING_SPEED = 50; // ms per character
const URL_TO_TYPE = "https://paulgraham.com/think.html";
const PROCESSING_DURATION = 1500;
const READY_DURATION = 2000;
const RESET_DURATION = 500;
```

### Night Mode Transition

```css
* {
  transition: background-color 300ms ease,
              color 300ms ease,
              border-color 300ms ease;
}
```

---

## Responsive Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| **Mobile** | < 768px | Single column, hamburger menu, horizontal scroll for cards |
| **Tablet** | 768-1024px | 2-column features, side padding increases |
| **Desktop** | > 1024px | Full layout, max-width 1200px centered |

**Mobile-Specific:**
- Hero animation: Smaller (280px width)
- Features: 1 column, swipeable
- Pricing: Horizontal scroll
- FAQ: Full width
- Footer: Stacked columns

---

## Database Schema Addition

### New Table: `faq_items`

```sql
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Public read for published, admin write
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published FAQs"
  ON faq_items FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage FAQs"
  ON faq_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
```

### Modify `free_content` Table

```sql
ALTER TABLE free_content
ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;

-- Ensure only one featured item
CREATE UNIQUE INDEX idx_free_content_featured
ON free_content (featured)
WHERE featured = true;
```

---

## API Endpoints Required

### FAQ Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/faq` | Public | List published FAQs |
| GET | `/api/admin/faq` | Admin | List all FAQs |
| POST | `/api/admin/faq` | Admin | Create FAQ |
| PATCH | `/api/admin/faq/:id` | Admin | Update FAQ |
| DELETE | `/api/admin/faq/:id` | Admin | Delete FAQ |
| PUT | `/api/admin/faq/reorder` | Admin | Reorder FAQs |

### Free Content Endpoints (additions)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/free-content/featured` | Public | Get featured hero item |
| PATCH | `/api/admin/free-content/:id/featured` | Admin | Toggle featured status |

### Voice Samples Endpoint

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/voices/samples` | Public | List voice sample audio URLs |

---

## Implementation Priority

### Phase 1: Core Landing Page
1. Header with night mode toggle
2. Hero headline + typing animation
3. Hero audio player (using existing AudioPlayer component)
4. Basic responsive layout

### Phase 2: Content Sections
5. Free samples section
6. Features section (static first)
7. Founder story section
8. Pricing section (reuse existing)
9. Footer

### Phase 3: Interactivity
10. Feature animations (scroll-triggered)
11. Voice tester (interactive feature)
12. FAQ accordion

### Phase 4: Admin & Polish
13. FAQ admin page + API
14. Featured content toggle in admin
15. Login/Signup page refresh
16. Upgrade page refresh
17. Final animation polish

---

## Assets Required

| Asset | Source | Destination | Format |
|-------|--------|-------------|--------|
| Founder photo | `/tinophoto.jpg` | `/public/images/founder.webp` | WebP, 240x240 |
| Voice samples | Generate via TTS | R2 storage | MP3 |
| Feature icons | Lucide React | — | SVG |

---
