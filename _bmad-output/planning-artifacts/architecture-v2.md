---
version: 2.2
status: 'complete'
completedAt: '2026-01-20'
previousVersion: 'architecture.md'
superseded_tts: 'Fish Audio references are outdated — TTS migrated to self-hosted Kokoro on RunPod Serverless. See implementation-artifacts/tech-spec-self-hosted-tts-kokoro.md'
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
  - path: '_bmad-output/planning-artifacts/architecture-issues.md'
    type: 'issues-review'
  - path: '_bmad-output/planning-artifacts/ux-design-specification.md'
    type: 'ux-design'
workflowType: 'architecture'
project_name: 'tsucast'
user_name: 'Tino'
date: '2026-01-20'
lastEdited: "2026-01-29"
editHistory:
  - date: "2026-01-21"
    changes: "Added Next.js web app architecture (secondary platform for testing/marketing/admin)"
  - date: "2026-01-24"
    changes: "Fixed cache status terminology ('generating' → 'processing'), added voice_id to cache key, documented /api/generate/status/:id endpoint"
  - date: "2026-01-29"
    changes: "Updated web playback to support background audio (like SoundCloud). Added free_content table, Explore tab, night mode, embeddable player. Added /api/free-content, /api/user/preferences, /api/admin/free-content endpoints."
---

# Architecture Decision Document: tsucast (v2.4)

_Hybrid architecture: Supabase (Auth + DB) + Hetzner VPS + Dokploy + Cloudflare R2_

---

## Executive Summary

### Final Architecture Decision

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Auth** | Supabase Auth | Managed, OAuth built-in, free tier |
| **Database** | Supabase PostgreSQL | Managed, backups, scaling handled |
| **API Server** | VPS + Node.js/Hono | No timeout limits, full control |
| **Storage** | Cloudflare R2 | Zero egress, cheap storage |
| **TTS** | Fish Audio API | External API, no hosting needed |
| **Payments** | RevenueCat | Required for app stores |

### Key Changes from v1

| Area | v1 (Supabase-First) | v2.1 (Hybrid) |
|------|---------------------|---------------|
| **API Server** | Supabase Edge Functions | VPS + Node.js/Hono |
| **Timeout Limits** | 60-150s (problematic) | None |
| **Database** | Supabase PostgreSQL | Supabase PostgreSQL (kept!) |
| **Auth** | Supabase Auth | Supabase Auth (kept!) |
| **Storage** | R2 + Supabase Storage | R2 only |
| **TTS Approach** | Chunked + stitched | Single call + stream |
| **Job Queue** | None | Optional (defer to scale) |

### Why Hybrid

1. **Supabase Auth + DB** — Managed, reliable, free tier generous
2. **VPS for API** — No timeout limits for TTS streaming
3. **R2 for storage** — Zero egress fees, cheaper than S3
4. **Fish Audio API** — No GPU needed, pay per use

---

## MVP vs Scale-Later

### MVP Launch (Include These)

| Component | Technology | Why Include |
|-----------|------------|-------------|
| **Auth + Database** | Supabase | Core requirement, can't function without it |
| **API Server** | Single VPS | Handles all API logic + TTS orchestration |
| **Object Storage** | Cloudflare R2 | Audio file storage |
| **TTS** | Fish Audio API | Core feature |
| **Payments** | RevenueCat | Needed for monetization |
| **Error Tracking** | Sentry free tier | Know when things break |

**MVP Monthly Cost: ~$25-45/month** (before TTS usage)

### Defer Until Scale

| Component | Add At | Why Defer |
|-----------|--------|-----------|
| **Redis/Job Queue** | 1,000 users | Synchronous processing is fine at low scale |
| **Upstash Redis** | 2,000 users | In-memory rate limiting works initially |
| **Cloudflare Workers Cron** | 1,000 users | Use node-cron on VPS initially |
| **Advanced Monitoring (Axiom)** | 1,000 users | Console.log + Sentry is enough early |
| **Connection Pooler** | 5,000 users | Supabase Pro has 200 connections |
| **Auto-scaling** | 5,000 users | Single VPS handles ~500 concurrent |
| **CDN for API** | 10,000 users | R2 already has CDN for audio |
| **Multi-region** | 50,000 users | Single region works globally |
| **Database Replicas** | 50,000 users | Supabase handles read scaling |
| **Load Balancer** | 50,000 users | Single VPS is enough |

### Scaling Tiers

```
TIER 1: Launch (0 - 500 users)
├── Supabase Free → Pro at 500 users ($25/mo)
├── Single VPS ($5-10/mo)
├── R2 free tier
├── Sentry free tier
└── Total: ~$30-35/mo + TTS

TIER 2: Growth (500 - 5,000 users)
├── Supabase Pro ($25/mo)
├── VPS upgrade ($10-20/mo)
├── Add Upstash Redis ($10/mo)
├── Add Axiom logging ($25/mo)
└── Total: ~$70-80/mo + TTS

TIER 3: Scale (5,000 - 50,000 users)
├── Supabase Pro + pooler ($25/mo)
├── Multiple VPS or container service
├── Redis cluster
├── Full observability stack
└── Total: ~$200-500/mo + TTS
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile App (PRIMARY)                          │
│              (Expo + React Native + NativeWind)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Add Screen  │  │   Player    │  │   Library   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│              react-native-track-player                           │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│             Web App (SECONDARY - Testing/Marketing/Admin)        │
│                    (Next.js 14+ App Router)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Landing    │  │   Basic     │  │   Admin     │              │
│  │   Page      │  │   Player    │  │   Panel     │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┼────────────────┘                      │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│      Supabase           │    │        VPS (~$6/month)          │
│  ┌─────────────────┐    │    │  ┌───────────────────────────┐  │
│  │  Auth (OAuth)   │    │    │  │     Node.js + Hono        │  │
│  │  - Google       │    │    │  │  /api/parse   (content)   │  │
│  │  - Apple        │    │    │  │  /api/generate (TTS)      │  │
│  │  - Email        │    │    │  │  /api/library (CRUD)      │  │
│  └─────────────────┘    │    │  │  /webhooks   (payments)   │  │
│  ┌─────────────────┐    │    │  └───────────────────────────┘  │
│  │   PostgreSQL    │◄───┼────┤  ┌──────────────┐               │
│  │   (Database)    │    │    │  │    Caddy     │               │
│  │                 │    │    │  │   (HTTPS)    │               │
│  └─────────────────┘    │    │  └──────────────┘               │
└─────────────────────────┘    └───────────────┬─────────────────┘
                                               │
                         ┌─────────────────────┼─────────────────┐
                         │                     │                 │
                         ▼                     ▼                 ▼
                    ┌─────────┐          ┌──────────┐      ┌───────────┐
                    │  Fish   │          │Cloudflare│      │RevenueCat │
                    │  Audio  │          │    R2    │      │ Payments  │
                    │  (TTS)  │          │ (Storage)│      │           │
                    └─────────┘          └──────────┘      └───────────┘
```

### MVP Architecture (Simplified)

```
┌───────────┐
│  Mobile   │──────┐
│   App     │      │
└───────────┘      │
                   │      ┌───────────┐      ┌───────────┐
                   ├─────►│    VPS    │─────►│ Supabase  │
                   │      │ (API+Cron)│      │ (Auth+DB) │
┌───────────┐      │      └─────┬─────┘      └───────────┘
│  Web App  │──────┘            │
│(Secondary)│            ┌──────┼──────┐
└───────────┘            ▼      ▼      ▼
                    ┌─────────┐ ┌──────┐ ┌───────────┐
                    │  Fish   │ │  R2  │ │RevenueCat │
                    │  Audio  │ │      │ │ (Payments)│
                    └─────────┘ └──────┘ └───────────┘

Both apps share: same API, same Supabase Auth, same database
```

---

## Technology Stack

### Core Stack

| Layer | Technology | MVP? | Rationale |
|-------|------------|------|-----------|
| **Mobile** | Expo SDK 53 + React Native | ✅ | Cross-platform, JS knowledge |
| **Web** | Next.js 14+ (App Router) | ✅ | SSR for marketing, same JS/TS stack |
| **Web Styling** | Tailwind CSS | ✅ | Consistent with NativeWind patterns |
| **Styling** | NativeWind v4 | ✅ | Tailwind for RN, consistent styling |
| **Navigation** | Expo Router | ✅ | File-based routing |
| **Audio Player** | react-native-track-player | ✅ | Background playback, lock screen |
| **State** | React Query + Zustand | ✅ | Server state + UI state |
| **API Server** | Node.js + Hono | ✅ | Lightweight, TypeScript, fast |
| **Logging** | Pino | ✅ | Fast, structured JSON logging |
| **Database** | Supabase PostgreSQL | ✅ | Managed, backups, free tier |
| **Auth** | Supabase Auth | ✅ | Managed, OAuth built-in |
| **Storage** | Cloudflare R2 | ✅ | Zero egress fees |
| **TTS** | Fish Audio API | ✅ | Streaming, ~$0.165/article |
| **Payments** | RevenueCat | ✅ | Required for app stores |
| **Job Queue** | BullMQ + Upstash Redis | ❌ | Add at 1,000 users |
| **Logging** | Axiom | ❌ | Add at 1,000 users |

### Infrastructure

| Component | Choice | MVP? | Cost |
|-----------|--------|------|------|
| **Auth + DB** | Supabase | ✅ | Free → $25/mo at 500 users |
| **VPS** | Hetzner CX21 (2 vCPU, 4GB RAM) | ✅ | €5.39/mo (~$6) |
| **Deployment** | Dokploy (self-hosted PaaS) | ✅ | Free (runs on VPS) |
| **Domain** | Cloudflare (DNS + proxy) | ✅ | Free |
| **SSL** | Dokploy (auto Let's Encrypt) | ✅ | Free |
| **Storage** | Cloudflare R2 | ✅ | Free → ~$1-5/mo |
| **Logging** | Pino (structured JSON) | ✅ | Free |
| **Error Tracking** | Sentry (free tier) | ✅ | Free |
| **Uptime Monitoring** | UptimeRobot (free tier) | ✅ | Free |
| **Job Queue** | Upstash Redis | ❌ | Add at scale (~$10/mo) |
| **Cron** | node-cron (in-process) | ✅ | Free |
| **Advanced Logs** | Axiom | ❌ | Add at scale (~$25/mo) |

**MVP Infrastructure:** ~$6-31/month + TTS costs
**At Scale (1K users):** ~$70-80/month + TTS costs

---

## Core Flows

### Flow 1: Content Generation

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. User pastes URL                                               │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. Normalize URL & Check Cache                                   │
│    - Normalize: lowercase, remove www, strip utm params          │
│    - Hash: SHA256(normalized_url)                                │
│    - Query: SELECT * FROM audio_cache WHERE url_hash = ?         │
│    - If HIT & public: return audio_url immediately               │
│    - If HIT & private: check ownership, return if owner          │
│    - If MISS: continue to step 3                                 │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. Claim Generation (Race Condition Prevention)                  │
│    - INSERT INTO audio_cache (url_hash, status='processing')     │
│      ON CONFLICT DO NOTHING                                      │
│    - If inserted: we generate                                    │
│    - If conflict: poll until status='ready'                      │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. Fetch & Parse Content                                         │
│    - Fetch URL with proper User-Agent                            │
│    - Parse with Mozilla Readability (linkedom for DOM)           │
│    - Extract: title, textContent, wordCount                      │
│    - Validate: reject if wordCount > 15,000                      │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. Generate Audio (Single TTS Call)                              │
│    - Send full text to Fish Audio API                            │
│    - Stream response directly to R2                              │
│    - File path: /audio/{uuid}.mp3                                │
│    - Update DB: status='ready', audio_url, duration              │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. Return to Client                                              │
│    { audioUrl, title, duration, wordCount }                      │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 2: Audio Playback

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Client receives audioUrl (R2 CDN URL)                         │
│    https://audio.tsucast.com/audio/{uuid}.mp3                    │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. react-native-track-player loads URL                           │
│    - Progressive download from R2 CDN                            │
│    - Playback starts as soon as buffer ready                     │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. Background & Lock Screen                                      │
│    - Audio continues when app backgrounded                       │
│    - Lock screen controls via track-player                       │
│    - Bluetooth/headphone controls work                           │
└─────────────────────────────────┬────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. Position Tracking                                             │
│    - Save position to DB every 30s                               │
│    - Save on pause/close                                         │
│    - Cross-device: last-write-wins                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

> **Note:** Database is hosted on Supabase PostgreSQL. Users table extends Supabase Auth.

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro'
  daily_generations INTEGER DEFAULT 0,
  daily_generations_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Audio Cache (public podcast cache)
CREATE TABLE audio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash TEXT UNIQUE NOT NULL,          -- SHA256(normalized_url + voice_id)
  original_url TEXT NOT NULL,
  voice_id TEXT NOT NULL DEFAULT 'default', -- Voice used for generation
  title TEXT,
  audio_url TEXT,                         -- R2 CDN URL
  duration_seconds INTEGER,
  word_count INTEGER,
  status TEXT DEFAULT 'processing',       -- 'pending', 'processing', 'ready', 'failed'
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audio_cache_url_hash ON audio_cache(url_hash);
CREATE INDEX idx_audio_cache_status ON audio_cache(status) WHERE status = 'processing';

-- User Library (user's saved podcasts)
CREATE TABLE user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
  playback_position INTEGER DEFAULT 0,    -- seconds
  is_played BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, audio_id)
);

CREATE INDEX idx_user_library_user_id ON user_library(user_id);

-- Playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_playlists_user_id ON playlists(user_id);

-- Playlist Items
CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playlist_id, audio_id)
);

CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);

-- Extraction Reports (for failed URLs)
CREATE TABLE extraction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  error_type TEXT,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Free Content (Explore tab - admin curated)
CREATE TABLE free_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'featured',  -- 'featured', 'popular', 'new'
  position INTEGER DEFAULT 0,         -- Display order
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_free_content_active ON free_content(is_active) WHERE is_active = true;
CREATE INDEX idx_free_content_category ON free_content(category);

-- User Preferences (theme, etc.)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system'; -- 'light', 'dark', 'system'

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users read own library" ON user_library FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own playlist items" ON playlist_items FOR ALL
  USING (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));
```

---

## API Endpoints

### Authentication (via Supabase - handled in mobile app)

> Auth is handled directly between mobile app and Supabase. VPS validates Supabase JWT tokens.

| Method | Description | Where |
|--------|-------------|-------|
| `supabase.auth.signUp()` | Email registration | Mobile → Supabase |
| `supabase.auth.signInWithPassword()` | Email login | Mobile → Supabase |
| `supabase.auth.signInWithOAuth()` | Google/Apple OAuth | Mobile → Supabase |
| `supabase.auth.signOut()` | Logout | Mobile → Supabase |
| `supabase.auth.getUser()` | Get current user | Mobile → Supabase |

### VPS API - Health & Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Health check (db, r2, fish_audio) | Public |

### VPS API - Content

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/generate` | Generate audio from URL | Supabase JWT |
| GET | `/api/generate/status/:id` | Poll generation status | Public (rate limited) |
| GET | `/api/cache/check` | Check if URL is cached | Public |

### VPS API - Library

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/library` | Get user's library | Supabase JWT |
| POST | `/api/library` | Add to library | Supabase JWT |
| DELETE | `/api/library/:id` | Remove from library | Supabase JWT |
| PATCH | `/api/library/:id/position` | Update playback position | Supabase JWT |

### VPS API - Playlists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/playlists` | Get user's playlists | Supabase JWT |
| POST | `/api/playlists` | Create playlist | Supabase JWT |
| PATCH | `/api/playlists/:id` | Rename playlist | Supabase JWT |
| DELETE | `/api/playlists/:id` | Delete playlist | Supabase JWT |
| POST | `/api/playlists/:id/items` | Add item to playlist | Supabase JWT |
| DELETE | `/api/playlists/:id/items/:itemId` | Remove from playlist | Supabase JWT |

### VPS API - Free Content (Explore Tab)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/free-content` | Get active free content | Public |

### VPS API - User Preferences

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/user/preferences` | Get user preferences | Supabase JWT |
| PATCH | `/api/user/preferences` | Update preferences (theme) | Supabase JWT |

### VPS API - Admin (Free Content Management)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/free-content` | List all free content | Admin JWT |
| POST | `/api/admin/free-content` | Add free content | Admin JWT |
| PATCH | `/api/admin/free-content/:id` | Update free content | Admin JWT |
| DELETE | `/api/admin/free-content/:id` | Remove free content | Admin JWT |

### VPS API - Webhooks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/webhooks/revenuecat` | Subscription updates | RevenueCat signature |

### JWT Validation Middleware

```typescript
// middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('user', user);
  await next();
}
```

### Health Check Endpoint

```typescript
// routes/health.ts
import { Hono } from 'hono';
import { supabase } from '../services/supabase';
import { r2Client } from '../services/storage';

const health = new Hono();

health.get('/health', async (c) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      storage: 'unknown',
      tts: 'unknown',
    }
  };

  // Check Supabase connection
  try {
    await supabase.from('audio_cache').select('count').limit(1);
    checks.services.database = 'healthy';
  } catch {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check R2 connection
  try {
    await r2Client.headBucket({ Bucket: process.env.R2_BUCKET });
    checks.services.storage = 'healthy';
  } catch {
    checks.services.storage = 'unhealthy';
    checks.status = 'degraded';
  }

  // Check Fish Audio API (lightweight ping)
  try {
    const res = await fetch('https://api.fish.audio/v1/voices', {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    checks.services.tts = res.ok ? 'healthy' : 'unhealthy';
  } catch {
    checks.services.tts = 'unhealthy';
    checks.status = 'degraded';
  }

  return c.json(checks, checks.status === 'ok' ? 200 : 503);
});

export default health;
```

### Request Timeout Middleware

```typescript
// middleware/timeout.ts
import { Context, Next } from 'hono';

const DEFAULT_TIMEOUT = 120_000; // 120 seconds for TTS

export function timeoutMiddleware(timeoutMs = DEFAULT_TIMEOUT) {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Attach abort signal to context for use in handlers
    c.set('abortSignal', controller.signal);

    try {
      await next();
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

// Usage in TTS service:
// const response = await fetch(fishAudioUrl, {
//   signal: c.get('abortSignal'),
//   ...
// });
```

### Structured Logging Setup

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: ['req.headers.authorization', 'password', 'token'],
});

// middleware/logging.ts
import { Context, Next } from 'hono';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger';

export async function loggingMiddleware(c: Context, next: Next) {
  const requestId = randomUUID();
  const startTime = Date.now();

  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);

  await next();

  const duration = Date.now() - startTime;
  const user = c.get('user');

  logger.info({
    request_id: requestId,
    user_id: user?.id || 'anonymous',
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms: duration,
  });
}
```

---

## R2 Storage Structure

```
tsucast-audio/                    # Bucket name
├── audio/                        # Generated podcasts
│   ├── {uuid}.mp3               # Public audio (random UUID)
│   └── ...
└── voices/                       # Voice preview samples
    ├── alex.mp3
    ├── sarah.mp3
    └── ...
```

### Access Configuration

| Path | Access | Notes |
|------|--------|-------|
| `/audio/*` | Public | Random UUIDs are unguessable |
| `/voices/*` | Public | Static preview samples |

**Custom Domain:** `audio.tsucast.com` (via Cloudflare)

---

## URL Normalization

All URLs are normalized before hashing to prevent duplicate generations:

```typescript
function normalizeUrl(url: string): string {
  const parsed = new URL(url);

  // 1. Lowercase hostname
  parsed.hostname = parsed.hostname.toLowerCase();

  // 2. Remove www
  parsed.hostname = parsed.hostname.replace(/^www\./, '');

  // 3. Remove trailing slash
  parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';

  // 4. Remove tracking params
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'ref', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'
  ];
  trackingParams.forEach(p => parsed.searchParams.delete(p));

  // 5. Sort remaining params
  parsed.searchParams.sort();

  // 6. Remove fragment
  parsed.hash = '';

  return parsed.toString();
}

// Hash for cache key (includes voice_id to allow same URL with different voices)
function hashUrlWithVoice(url: string, voiceId: string): string {
  return crypto.createHash('sha256')
    .update(normalizeUrl(url) + ':' + voiceId)
    .digest('hex');
}

// Usage:
const urlHash = hashUrlWithVoice(url, voiceId);
```

> **Note:** The cache key includes `voice_id` so users can generate the same article with different voices. Each URL + voice combination is cached separately.

---

## Rate Limiting

### Free Tier Limits

| Limit | Value | Reset |
|-------|-------|-------|
| Generations per day | 3 | Midnight UTC |
| Requests per minute | 20 | Rolling window |

### Implementation

```typescript
// Simple in-memory rate limiting (no Redis needed for MVP)
const userGenerations = new Map<string, { count: number; resetAt: Date }>();

function checkGenerationLimit(userId: string, tier: string): boolean {
  if (tier === 'pro') return true; // Unlimited for pro

  const now = new Date();
  const record = userGenerations.get(userId);

  if (!record || record.resetAt < now) {
    // Reset at midnight
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    userGenerations.set(userId, { count: 1, resetAt: tomorrow });
    return true;
  }

  if (record.count >= 3) return false;

  record.count++;
  return true;
}
```

---

## Error Handling

### Standard Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Error Codes

| Code | HTTP Status | User Message |
|------|-------------|--------------|
| `PARSE_FAILED` | 422 | "Couldn't extract content from this URL" |
| `PAYWALL_DETECTED` | 422 | "This article appears to be behind a paywall" |
| `ARTICLE_TOO_LONG` | 422 | "Article is too long (max 15,000 words)" |
| `TTS_FAILED` | 500 | "Audio generation failed. Please try again." |
| `RATE_LIMITED` | 429 | "You've reached your daily limit" |
| `UNAUTHORIZED` | 401 | "Please log in to continue" |
| `NOT_FOUND` | 404 | "Resource not found" |

---

## Background Jobs

### Job Types

| Job | Trigger | Action |
|-----|---------|--------|
| `cleanup-failed` | Cron (daily) | Delete failed audio_cache rows > 24h old |
| `cleanup-orphans` | Cron (weekly) | Delete R2 files not in database |
| `sync-subscriptions` | RevenueCat webhook | Update user subscription tier |

### MVP Implementation (node-cron, no Redis)

```typescript
// jobs/cron.ts
import cron from 'node-cron';
import { db } from '../db';
import { audioCache } from '../db/schema';
import { and, eq, lt } from 'drizzle-orm';
import dayjs from 'dayjs';

// Daily cleanup at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running cleanup-failed job');
  await db.delete(audioCache)
    .where(and(
      eq(audioCache.status, 'failed'),
      lt(audioCache.createdAt, dayjs().subtract(24, 'hours').toDate())
    ));
});

// Weekly orphan cleanup on Sunday at 4 AM
cron.schedule('0 4 * * 0', async () => {
  console.log('Running cleanup-orphans job');
  // List R2 files, compare with DB, delete orphans
});
```

### Scale Implementation (BullMQ + Upstash Redis)

> Add this when you reach ~1,000 users and need reliable job processing.

```typescript
// jobs/cleanup.ts
import { Queue, Worker } from 'bullmq';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const cleanupQueue = new Queue('cleanup', { connection: redis });

// Schedule daily cleanup
cleanupQueue.add('cleanup-failed', {}, {
  repeat: { cron: '0 3 * * *' }
});

new Worker('cleanup', async (job) => {
  // ... job logic
}, { connection: redis });
```

---

## Project Structure

```
tsucast/
├── apps/
│   ├── mobile/                   # Expo React Native app
│   │   ├── app/                  # Expo Router pages
│   │   │   ├── (auth)/           # Auth screens (login, signup)
│   │   │   ├── (tabs)/           # Main tab screens
│   │   │   ├── player/           # Player screen
│   │   │   └── _layout.tsx       # Root layout with mini-player
│   │   ├── components/
│   │   │   ├── add/              # Add screen components
│   │   │   ├── player/           # Player components
│   │   │   ├── library/          # Library components
│   │   │   └── ui/               # Shared UI components
│   │   ├── hooks/
│   │   │   ├── useAuth.ts        # Supabase Auth hook
│   │   │   ├── useAudioPlayer.ts # Track player hook
│   │   │   └── useLibrary.ts     # Library hook
│   │   ├── services/
│   │   │   ├── supabase.ts       # Supabase client
│   │   │   ├── api.ts            # VPS API client
│   │   │   └── purchases.ts      # RevenueCat
│   │   ├── stores/               # Zustand stores
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   │
│   └── api/                      # Node.js API server (VPS)
│       ├── src/
│       │   ├── routes/           # Hono routes
│       │   │   ├── generate.ts   # URL → audio generation
│       │   │   ├── library.ts    # Library CRUD
│       │   │   ├── playlists.ts  # Playlist CRUD
│       │   │   └── webhooks.ts   # RevenueCat webhooks
│       │   ├── services/         # Business logic
│       │   │   ├── parser.ts     # URL parsing (Readability)
│       │   │   ├── tts.ts        # Fish Audio integration
│       │   │   ├── storage.ts    # R2 operations
│       │   │   └── supabase.ts   # Supabase admin client
│       │   ├── jobs/             # Cron jobs (node-cron for MVP)
│       │   ├── middleware/       # Auth, rate limiting
│       │   ├── utils/
│       │   └── index.ts          # Entry point
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                   # Shared types/utils
│       ├── types/
│       └── utils/
│
│   └── web/                      # Next.js web app (secondary)
│       ├── app/                  # App Router pages
│       │   ├── (marketing)/      # Landing, features, pricing
│       │   ├── (app)/            # Authenticated app routes
│       │   │   ├── dashboard/    # Basic playback testing
│       │   │   └── library/      # View library
│       │   ├── admin/            # Admin panel (protected)
│       │   └── layout.tsx        # Root layout
│       ├── components/
│       │   ├── marketing/        # Landing page components
│       │   ├── player/           # Basic web player
│       │   └── admin/            # Admin components
│       ├── lib/
│       │   ├── supabase.ts       # Supabase client (browser)
│       │   └── api.ts            # API client
│       └── package.json
│
├── supabase/
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase local config
│
├── package.json                  # Monorepo root
└── turbo.json                    # Turborepo config
```

---

## Deployment

### VPS Setup (Hetzner + Dokploy) - MVP

> **Note:** Database and Auth are on Supabase. VPS only runs the API server via Dokploy.

**Why Dokploy:**
- Self-hosted PaaS (like Vercel/Railway but on your VPS)
- Auto SSL via Let's Encrypt
- Zero-downtime deploys
- Built-in Docker management
- GitHub integration for auto-deploy
- Health checks and restart policies
- Web UI for logs and monitoring

```bash
# 1. Create VPS (CX21: 2 vCPU, 4GB RAM, 40GB SSD) - ~$6/month
# 2. Install Dokploy (one command)
curl -sSL https://dokploy.com/install.sh | sh

# 3. Access Dokploy UI at https://your-vps-ip:3000
# 4. Connect GitHub repo
# 5. Configure environment variables
# 6. Deploy!

# NO manual Node.js installation needed
# NO manual Caddy/Nginx configuration
# NO PM2 configuration
# Dokploy handles everything
```

### Dokploy Project Config

```yaml
# dokploy.yaml (in repo root)
name: tsucast-api
type: application

build:
  dockerfile: apps/api/Dockerfile

deploy:
  replicas: 2
  healthCheck:
    path: /health
    interval: 30s
    timeout: 10s
    retries: 3

domains:
  - host: api.tsucast.com
    https: true

resources:
  memory: 512Mi
  cpu: 0.5
```

### Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Deploy Flow

```
1. Push to main branch
2. Dokploy detects push (GitHub webhook)
3. Builds Docker image
4. Runs health check on new container
5. If healthy: switches traffic (zero-downtime)
6. If unhealthy: keeps old container, alerts
```

### Supabase Setup

```bash
# 1. Create project at supabase.com
# 2. Run migrations
npx supabase db push

# 3. Configure Auth providers in Supabase Dashboard:
#    - Enable Email/Password
#    - Configure Google OAuth
#    - Configure Apple OAuth
```

### Web App Deployment

> **Note:** Web app is SECONDARY to mobile. Deploy alongside API on same VPS via Dokploy.

**Deployment Options:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Same VPS (Dokploy)** | Simple, cheap, single infra | Shares resources with API | ✅ MVP |
| **Vercel** | Easy Next.js, auto-scaling | Extra cost, separate infra | Consider at scale |

**MVP: Same VPS with Dokploy**

```yaml
# dokploy.yaml (web app)
name: tsucast-web
type: application

build:
  dockerfile: apps/web/Dockerfile

deploy:
  replicas: 1
  healthCheck:
    path: /api/health
    interval: 30s

domains:
  - host: tsucast.com
    https: true
  - host: www.tsucast.com
    https: true
    redirect: tsucast.com

resources:
  memory: 256Mi
  cpu: 0.25
```

**Web App Dockerfile:**

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Web App Architecture (Secondary Platform)

> **Purpose:** Testing, marketing, and admin - NOT a primary consumer product.

### Why Build a Web App

| Use Case | Description |
|----------|-------------|
| **Backend Testing** | Test API flows without mobile builds (critical on Linux dev) |
| **Marketing Site** | Landing page, SEO, app store links |
| **Admin Panel** | User management, metrics, content moderation |
| **Future Creator Dashboard** | Voice management, analytics |

### What Web Is NOT

- NOT feature parity with mobile
- NOT the primary user experience
- NOT optimized for "listening while walking"
- NOT a replacement for mobile app testing

### Web Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ | App Router, SSR for SEO |
| **Styling** | Tailwind CSS | Consistent with NativeWind |
| **Auth** | Supabase Auth | Same as mobile, SSR-compatible |
| **API Client** | Same Hono backend | No separate API needed |
| **State** | React Query | Same patterns as mobile |

### Shared Authentication

Both mobile and web use Supabase Auth with the same user accounts:

```typescript
// apps/web/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side (middleware, server components)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set(name, value, options),
        remove: (name, options) => cookieStore.set(name, '', options),
      },
    }
  );
}
```

### Web App Features (FR48-FR62)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Landing page (FR48-50)** | High | SEO, marketing, app store links |
| **Basic auth (FR51)** | High | Same Supabase as mobile |
| **Generate audio (FR52)** | High | Test API without mobile |
| **Global player (FR53)** | High | Persistent audio with background playback |
| **View library (FR54)** | Medium | Library with tabs (All/Playlists/Explore) |
| **Explore tab (FR63)** | Medium | Free curated content from admin |
| **Night mode (FR64)** | Low | Dark/light theme toggle |
| **Embeddable player (FR65)** | Medium | Landing page audio samples |
| **Admin: Users (FR56)** | Medium | User list, usage stats |
| **Admin: Health (FR57)** | Medium | API metrics dashboard |
| **Admin: Reports (FR58-59)** | Low | URL parsing reports |
| **Admin: Free content (FR63)** | Medium | CRUD for Explore tab content |
| **Creator dashboard (FR60-62)** | Post-MVP | Voice management |

### Web Playback Capabilities

Web audio works like SoundCloud/Spotify Web when implemented correctly:

| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| Background audio | ✅ | ✅ | Requires singleton AudioService |
| Lock screen controls | ✅ | ✅ | Via Media Session API |
| Sleep timer | ✅ | ✅ | Works while audio playing |
| CarPlay/Android Auto | ✅ | ❌ | Native app only |
| Offline download | Future | ❌ | Native app only |

**How Web Background Audio Works:**
1. Single persistent `<audio>` element (never destroyed on navigation)
2. Media Session API configured before playback starts
3. AudioService singleton pattern (not React component state)
4. Audio continues when screen locks, tab hidden, or app switched

### Web Routes Structure

```
/                     # Landing page (marketing) + embeddable player
/features             # Feature showcase
/pricing              # Pricing page
/login                # Auth (Supabase)
/signup               # Auth (Supabase)
/add                  # URL input + generate
/library              # Library (tabs: All / Playlists / Explore)
/settings             # User settings + night mode toggle
/admin                # Admin panel (role-protected)
/admin/users          # User management
/admin/health         # System health
/admin/reports        # URL parsing reports
/admin/free-content   # Manage Explore tab content
```

---

## Environment Variables

### VPS API Server (.env)

```bash
# Supabase (Auth + Database)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # For admin operations

# R2 Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=tsucast-audio
R2_PUBLIC_URL=https://audio.tsucast.com

# Fish Audio
FISH_AUDIO_API_KEY=xxx

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=xxx

# Sentry (optional for MVP)
SENTRY_DSN=xxx

# Add at scale (not needed for MVP)
# UPSTASH_REDIS_URL=xxx
# UPSTASH_REDIS_TOKEN=xxx
# AXIOM_TOKEN=xxx
```

### Mobile App (.env)

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# API Server
EXPO_PUBLIC_API_URL=https://api.tsucast.com

# RevenueCat
REVENUECAT_API_KEY_IOS=xxx
REVENUECAT_API_KEY_ANDROID=xxx
```

### Web App (.env.local)

```bash
# Supabase (same project as mobile)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# API Server (same as mobile)
NEXT_PUBLIC_API_URL=https://api.tsucast.com

# Admin access (list of admin user IDs)
ADMIN_USER_IDS=uuid1,uuid2
```

---

## Cost Summary

### Monthly Costs (MVP Launch)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | Free | Up to 500 users |
| Hetzner VPS (CX21) | $6 | 2 vCPU, 4GB RAM |
| Cloudflare R2 | Free | Up to 10GB |
| Domain | ~$1 | Via Cloudflare |
| Sentry | Free | Free tier |
| **Infrastructure Total** | **~$7/mo** | |
| Fish Audio (100 articles) | ~$17 | Early usage |
| **Grand Total** | **~$24/mo** | |

### Monthly Costs (500 Users)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase Pro | $25 | Needed at 500 users |
| Hetzner VPS (CX21) | $6 | Still sufficient |
| Cloudflare R2 (~50GB) | $1-3 | |
| Fish Audio (500 articles) | ~$82 | |
| **Total** | **~$115/mo** | |

### Monthly Costs (1,000 Subscribers)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase Pro | $25 | |
| Hetzner VPS (CX31) | $12 | Upgrade for headroom |
| Cloudflare R2 (~100GB) | $3-5 | |
| Upstash Redis | $10 | Add job queue |
| Sentry Team | $26 | Upgrade for volume |
| Fish Audio (2,000 articles) | $330 | |
| RevenueCat | ~$75 | 1% over $2.5K MRR |
| **Total** | **~$480/mo** | |

### Revenue at 1,000 Subscribers

- 1,000 × $9.99 × 70% (after App Store) = **$6,993/month**
- Costs: ~$480/month
- **Profit: ~$6,500/month**
- **Margin: ~93%**

---

## Security Checklist

- [x] HTTPS everywhere (Caddy auto-TLS)
- [x] JWT tokens for auth (Supabase Auth)
- [x] Password hashing (Supabase handles)
- [x] Rate limiting (in-memory for MVP)
- [x] Input validation (Zod)
- [x] SQL injection prevention (Drizzle ORM)
- [x] Row Level Security (Supabase RLS)
- [x] CORS configuration
- [x] Webhook signature verification (RevenueCat)
- [x] Environment variables for secrets
- [x] Supabase service role key protected (server-side only)

---

## Implementation Order

### Phase 1: Foundation
1. Create Supabase project and run migrations
2. Set up VPS with Node.js and Caddy
3. Initialize Hono API server
4. Configure Supabase Auth (email + Google + Apple)
5. Configure R2 bucket and test uploads

### Phase 2: Core Feature
6. Implement URL parsing (Readability)
7. Implement Fish Audio TTS integration
8. Implement streaming upload to R2
9. Implement cache checking and generation flow
10. Test end-to-end generation

### Phase 3: Mobile App
11. Initialize Expo app with Obytes template
12. Set up Supabase client and auth hooks
13. Implement auth screens (login, signup)
14. Implement Add screen (paste + generate)
15. Implement Player screen (track-player)
16. Implement Library screen

### Phase 4: Web App (Secondary Platform)
17. Initialize Next.js app with App Router
18. Set up Supabase SSR auth
19. Create marketing landing page
20. Implement basic web player (testing interface)
21. Build admin panel (users, health, reports)
22. Deploy web app via Dokploy

### Phase 5: Polish & Launch
23. Add playlists (mobile)
24. Add RevenueCat payments
25. Add rate limiting middleware
26. Set up Sentry error tracking
27. App Store preparation and submission

### Phase 6: Scale (Post-Launch)
28. Add Upstash Redis for job queue
29. Add Axiom for logging
30. Upgrade Supabase to Pro
31. Add performance monitoring
32. Consider Vercel for web app if traffic warrants

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-01-20 | Initial Supabase-first architecture |
| v2 | 2026-01-20 | Revised to VPS-first after issues review |
| v2.1 | 2026-01-20 | Hybrid architecture (Supabase Auth+DB, VPS API), MVP vs scale-later breakdown |
| v2.2 | 2026-01-20 | Added Dokploy deployment, health endpoint, timeout middleware, structured logging (pino) |
| v2.3 | 2026-01-21 | Added Next.js web app architecture (secondary platform for testing/marketing/admin) |
| v2.4 | 2026-01-24 | Fixed cache status terminology ('generating' → 'processing'), added voice_id to cache key, documented /api/generate/status/:id endpoint |

---

_Architecture v2.4 completed: 2026-01-24_
