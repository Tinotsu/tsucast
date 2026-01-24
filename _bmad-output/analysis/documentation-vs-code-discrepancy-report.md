# Documentation vs Code Discrepancy Report

**Date:** 2026-01-24
**Scope:** Full BMad documentation (_bmad-output/) vs actual codebase
**Reviewer:** TEA Agent

---

## Executive Summary

After thorough analysis of the BMad documentation versus the actual codebase implementation, I've identified **significant discrepancies** across multiple dimensions. The implementation is substantially more advanced than documented, with critical architectural changes not reflected in the official documentation.

| Severity | Count | Status | Examples |
|----------|-------|--------|----------|
| CRITICAL | 1 | RESOLVED | Cache status terminology mismatch |
| HIGH | 2 | RESOLVED | Voice ID in cache key, Status polling endpoint |
| MEDIUM | 4 | Open | Web app status, Story tracking, Add screen incomplete |
| LOW | 5 | Acceptable | Over-implementations (positive), Enhanced error types |

---

## CRITICAL Discrepancies (Must Fix)

### 1. Cache Entry Status Model Mismatch - RESOLVED

**Documentation States (architecture-v2.md, line 262):**
```sql
INSERT INTO audio_cache (url_hash, status='generating')
```

**Actual Implementation (apps/api/src/services/cache.ts, line 22):**
```typescript
status: 'pending' | 'processing' | 'ready' | 'failed';
```

**Impact:** Developers following documentation will create queries for 'generating' status that will never match database entries with 'processing' status. This is a **documentation bug** that contradicts implementation.

**Files Affected:**
- `_bmad-output/planning-artifacts/architecture-v2.md` (lines 254-282)
- `apps/api/src/services/cache.ts` (line 22, 78)
- `apps/api/src/routes/cache.ts` (lines 85-96)

**Resolution:** FIXED on 2026-01-24
- Updated Flow 1 diagram to use 'processing' instead of 'generating'
- Updated database schema comment to show correct status values
- Updated index condition to use 'processing'
- Bumped architecture version to v2.4

---

## HIGH Priority Discrepancies

### 2. Voice ID in Cache Key - RESOLVED

**Documentation States:** Cache checking is URL-based only, no mention of voice selection affecting cache keys.

**Actual Implementation:**
```typescript
// apps/api/src/routes/cache.ts line 58
const urlHash = hashUrlWithVoice(normalizedUrl, voiceId);

// apps/api/src/services/cache.ts line 16
voice_id: string;
```

**Impact:** This is actually a **feature improvement** (same URL + different voice = separate generation) but should be documented as an architectural decision.

**Resolution:** FIXED on 2026-01-24
- Added voice_id column to audio_cache schema
- Updated url_hash comment to show it includes voice_id
- Added hashUrlWithVoice function to URL normalization section
- Added explanatory note about cache key behavior

### 3. Generation Status Polling Endpoint - RESOLVED

**Documentation States:** No mention of `/api/generate/status/:id` endpoint anywhere in architecture.

**Actual Implementation (apps/api/src/routes/generate.ts, lines 53-89):**
```typescript
app.get('/status/:id', ipRateLimit(60, 60 * 1000), async (c) => {
  const id = c.req.param('id');
  const entry = await getCacheEntryById(id);

  if (entry.status === 'processing') {
    return c.json({ status: 'processing' }, 202);
  }
  // ... returns ready/failed
});
```

**Impact:** Critical endpoint for client-side polling during generation is not documented.

**Resolution:** FIXED on 2026-01-24
- Added GET /api/generate/status/:id to VPS API - Content endpoints table

---

## MEDIUM Priority Discrepancies

### 4. Web Application Status Misrepresentation

**Documentation States (epics.md, lines 1106-1110):**
```
Epic 7: Web Application (OPTIONAL - Post-MVP)
Note: This epic is OPTIONAL for MVP. Mobile launch is not blocked
```

**Actual Implementation:** Web app is **fully scaffolded** with:
- Admin dashboard with full metrics UI
- Admin users, reports, moderation pages
- Auth pages (login, signup)
- App pages (dashboard, generate, library, upgrade, settings)
- Landing page, Terms, Privacy pages

**Action Required:** Update Epic 7 status from "OPTIONAL" to "MVP INCLUDED" or "Phase 1 - Scaffolded"

### 5. Add Screen Implementation - Incomplete

**Documentation States (Epic 3, Story 3.2):** Full generation flow with progress indicator.

**Actual Implementation (apps/mobile/app/(tabs)/index.tsx, lines 163-169):**
```typescript
if (state.status === 'cached') {
  // TODO: Navigate to player screen with audioUrl
} else if (state.status === 'ready_to_generate') {
  // TODO: Navigate to generation flow with normalizedUrl, urlHash, and selectedVoiceId
}
```

**Impact:** Core mobile generation flow has TODO comments - UI structure exists but navigation incomplete.

### 6. Story Status Tracking - No Completion Markers

**Issue:** All stories in epics.md marked as "ready-for-dev" with no completion status. Individual story files don't indicate which have been implemented.

**Impact:** No traceability between planned work and actual code.

**Action Required:** Add completion markers to story files (e.g., `status: completed`, `implemented_date: 2026-01-XX`).

---

## LOW Priority Discrepancies (Positive Over-Implementations)

### 7. Rate Limiting - Over-Implemented

**Documentation Shows:** Simple in-memory rate limiting.

**Actual Implementation:** Dual system with:
- IP-based rate limiting (`apps/api/src/middleware/ip-rate-limit.ts`)
- User-based generation tracking (`apps/api/src/services/rate-limit.ts`)

**Status:** Better security than documented.

### 8. Player Components - Over-Implemented

**Documentation:** Basic player controls.

**Actual Implementation:** Advanced components including:
- `QueueSheet.tsx` - Advanced queue management UI
- `QueueButton.tsx` - Queue controls
- `MiniPlayer.tsx` - Mini-player bar
- `SleepTimer.tsx` - Sleep timer implementation
- `SpeedControl.tsx` - Speed control UI
- `ProgressBar.tsx` - Progress UI

**Status:** More polish than specified.

### 9. Admin Panel - Over-Implemented

**Documentation:** Concept for admin dashboard.

**Actual Implementation:** Fully functional UI with metrics display, user management, reports, and moderation pages.

**Status:** Ready for API integration.

### 10. PDF Error Types - Enhanced

**Documentation:** Basic PDF error handling.

**Actual Implementation (apps/api/src/utils/errors.ts):**
```typescript
IMAGE_ONLY_PDF
PDF_TOO_LARGE
PDF_PASSWORD_PROTECTED
TIMEOUT
```

**Status:** Better error handling than documented.

### 11. RevenueCat Mock Mode - UNDOCUMENTED

**Actual Implementation (apps/mobile/services/purchases.ts):**
```typescript
export function isPurchasesConfigured(): boolean {
  const key = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  return key.length > 0;
}

// If not configured, returns mock data for development
```

**Status:** Excellent pattern for development without SDK keys - should be documented.

---

## Discrepancy Matrix

| Category | Issue | Severity | Type | Docs Location | Code Location |
|----------|-------|----------|------|---------------|---------------|
| Cache Status | 'generating' vs 'processing' | CRITICAL | Mismatch | architecture-v2.md:262 | cache.ts:22,78 |
| Cache Key | Voice ID not documented | HIGH | Missing Docs | architecture-v2.md:671+ | cache.ts:16 |
| API Endpoints | Status polling missing | HIGH | Missing Docs | architecture-v2.md:432+ | generate.ts:53 |
| Add Screen | Generation flow incomplete | MEDIUM | Incomplete | epics.md:160+ | index.tsx:163 |
| Web App | Marked optional but built | MEDIUM | Misleading | epics.md:1106 | apps/web/app/ |
| Story Tracking | No completion markers | MEDIUM | Process Gap | epics.md | stories/*.md |
| Rate Limiting | Over-implemented | LOW | Better impl | architecture-v2.md:712 | ip-rate-limit.ts |
| Error Types | PDF errors enhanced | LOW | Missing Docs | prd.md:763 | errors.ts |
| Player | Over-implemented | LOW | Better impl | epics.md:496+ | components/player/ |
| Admin Panel | Over-implemented | LOW | Better impl | epics.md:1273+ | app/admin/ |
| RevenueCat | Mock mode undocumented | LOW | Missing Docs | story 5-3 | purchases.ts |

---

## Recommendations

### Critical (Must Fix Before Release):
1. ~~**Update architecture-v2.md line 262:** Change 'generating' to 'processing' in Flow 1 diagram~~ DONE

### Important (Should Fix):
2. ~~**Update architecture-v2.md line 677:** Add `voiceId` to URL normalization/hashing explanation~~ DONE
3. ~~**Add to API Endpoints (architecture-v2.md):** Document `GET /api/generate/status/:id` endpoint~~ DONE
4. **Update Epic 7 status** from "OPTIONAL" to "MVP INCLUDED"
5. **Add story completion markers** to individual story files
6. **Document new error types** in PRD or architecture

### Nice-to-Have:
7. Document the dual rate-limiting approach (IP + User-based)
8. Document RevenueCat mock mode development pattern
9. ~~Document why voice_id is part of cache key (UX benefit)~~ DONE

---

## Conclusion

The implementation is **substantially more complete and sophisticated** than the documentation suggests. The main issue is not missing features but **documentation lag**.

**Key Findings:**
- **What's broken:** Cache status terminology (generating vs processing) - CRITICAL mismatch
- **What's missing:** Voice ID in cache keys, status polling endpoint documentation
- **What's over-delivered:** Web app fully built, admin UI complete, rate limiting production-ready
- **What's incomplete:** Mobile Add screen generation flow (TODOs present)

The discrepancies suggest the team has been implementing faster than documenting, which is reasonable for a startup MVP but should be addressed to maintain architectural consistency.

---

**Generated:** 2026-01-24
**Report ID:** discrepancy-analysis-20260124

<!-- Powered by BMAD-CORE™ -->
