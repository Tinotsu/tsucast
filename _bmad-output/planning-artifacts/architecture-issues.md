---
date: 2026-01-20
type: architecture-review
status: in-progress
author: Winston (Architect)
---

# Architecture Issues Tracker

## Critical Issues (Must Resolve Before Implementation)

### Issue 1: Edge Function Timeout for TTS Generation
**Status:** ✅ RESOLVED
**Impact:** Core feature broken for long articles

Supabase Edge Functions timeout at 60-150s. Long articles (10+ chunks × 5-10s each) will fail.

**Resolution:** Switch to VPS architecture. No timeout limits. TTS uses Fish Audio external API.

---

### Issue 2: Audio Chunk Stitching Not Addressed
**Status:** ✅ RESOLVED
**Impact:** Streaming pipeline implementation unclear

How are multiple audio chunks combined? One R2 file or multiple? How does player handle this?

**Resolution:** Option A - Single TTS call with streaming upload. Send full article to Fish Audio, stream response directly to R2. ONE file per article. No stitching needed.

---

### Issue 3: R2 Public Access Configuration Missing
**Status:** ✅ RESOLVED
**Impact:** Audio playback may fail

Is bucket public? Signed URLs? Expiration?

**Resolution:** Option C - Public bucket + random UUIDs.
- All audio stored as `/audio/{uuid}.mp3` (unguessable)
- Public audio: anyone with URL can access
- Private audio: same storage, but API checks ownership before returning URL to client
- No signed URLs needed, no expiration issues

---

## Significant Issues (Shape Implementation)

### Issue 4: Voice Sample Storage Strategy
**Status:** ✅ RESOLVED
**Impact:** Voice preview feature unclear

Where are voice samples stored? App bundle, R2, or Fish Audio API?

**Resolution:** Option B - Store in R2 at `/voices/{name}.mp3`. API returns voice list with sample URLs. Can update without app release.

---

### Issue 5: URL Normalization Rules Not Defined
**Status:** ✅ RESOLVED
**Impact:** Same article could generate multiple times

No rules for: trailing slashes, query params, fragments.

**Resolution:** Normalize before hashing: lowercase hostname, remove www, remove trailing slash, strip tracking params (utm_*, fbclid, etc), remove fragment, sort remaining params. Then SHA256 hash.

---

### Issue 6: Concurrent Generation Race Condition
**Status:** ✅ RESOLVED
**Impact:** Cost waste, data inconsistency

Two users paste same URL → both miss cache → duplicate TTS cost.

**Resolution:** Database lock. Insert with status='generating' first. If conflict, poll until ready. Simple, no extra infrastructure.

---

### Issue 7: PDF Size/Page Limits Not Enforced
**Status:** ✅ RESOLVED
**Impact:** Could generate very expensive audio for huge PDFs

No schema column, no enforcement logic.

**Resolution:** Check word count after parsing. Reject if > 15,000 words. Simple validation, no schema change.

---

### Issue 8: No Retry/Dead Letter Strategy
**Status:** ✅ RESOLVED
**Impact:** Failed generations leave orphaned data

What happens to partial audio? How does user retry?

**Resolution:** Status column handles this (from Issue 6). Failed = user can retry. Cron deletes failed rows > 24h old.

---

## Moderate Issues (Nice to Fix)

### Issue 9: Storage Confusion (R2 vs Supabase)
**Status:** ✅ RESOLVED
**Resolution:** R2 only. No Supabase Storage.

---

### Issue 10: Rate Limiting Strategy
**Status:** ✅ RESOLVED
**Impact:** Could exhaust Fish Audio API credits

No queuing, no rate limit handling.

**Resolution:** Simple in-memory counter per user. 10 req/hour free, unlimited paid. No Redis for MVP.

---

### Issue 11: SSE Event Specification
**Status:** ✅ RESOLVED
**Impact:** Client implementation unclear

What events? Reconnection? Format?

**Resolution:** Skip SSE for MVP. Simple request → spinner → response. Add SSE later if UX needs it.

---

### Issue 12: Cross-Device Sync Conflicts
**Status:** ✅ RESOLVED
**Impact:** Playback position confusion

What if user plays on two devices?

**Resolution:** Last-write-wins. Simple timestamp comparison. No merge logic.

---

### Issue 13: Observability Stack
**Status:** ✅ RESOLVED
**Impact:** Can't debug launch issues

No monitoring for TTS times, failure rates, SLA compliance.

**Resolution:** Console logs + Sentry free tier for errors. Add metrics post-MVP.

---

### Issue 14: Webhook Security Details
**Status:** ✅ RESOLVED
**Impact:** RevenueCat webhook could be spoofed

No verification implementation guidance.

**Resolution:** Use RevenueCat SDK signature verification. Standard implementation.

---

### Issue 15: Database Indexes Missing
**Status:** ✅ RESOLVED
**Impact:** Slow queries at scale

Only audio_cache indexed. Missing user_library, playlists, playlist_items.

**Resolution:** Add basic indexes: user_library(user_id), audio_cache(status). Add more when queries slow down.

---

## Minor Issues (Enhancement)

### Issue 16: No TTS Provider Failover
**Status:** 🟢 ENHANCEMENT
Cartesia listed as fallback but no automatic failover.

### Issue 17: Test Framework Not Specified
**Status:** 🟢 ENHANCEMENT
E2E mentioned but no framework (Detox? Maestro?).

### Issue 18: CI/CD Pipeline Details
**Status:** 🟢 ENHANCEMENT
GitHub Actions mentioned but no workflow defined.

---

_Last updated: 2026-01-20_
