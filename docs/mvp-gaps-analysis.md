# MVP Gaps Analysis

Generated: 2026-01-21

## Executive Summary

This document identifies untested areas, potential risks, and required actions before MVP launch.

---

## 1. Critical Findings

### 1.1 RevenueCat Integration - NOT READY ❌

**File**: `apps/mobile/services/purchases.ts`

The entire purchases system is **STUBBED**. All functions return mock data.

```typescript
// Line 8-24: Clear warning in code
// STUB IMPLEMENTATION - NOT FOR PRODUCTION
```

**Impact**:
- Cannot monetize the app
- Users can't actually purchase Pro subscription
- No real revenue tracking

**Required Actions**:
1. Install `react-native-purchases` package
2. Configure RevenueCat dashboard with products
3. Set up App Store Connect / Google Play Console products
4. Replace stub implementations with real SDK calls
5. Test purchase flow on real devices

**Time Estimate**: 2-3 days

---

### 1.2 Audio URLs Are Public (Not Signed)

**File**: `apps/api/src/services/storage.ts:82`

```typescript
const url = `${publicUrl}/${key}`;
```

**Current Behavior**:
- Audio files are stored at predictable URLs
- URLs never expire
- Anyone with the URL can access the audio

**Risk Level**: Medium
- Content is generated from public articles anyway
- No user-private data exposed
- But could enable scraping/hotlinking

**Options**:
1. Keep as-is (acceptable for MVP)
2. Implement signed URLs with expiration (post-MVP)
3. Add auth middleware on CDN (Cloudflare Workers)

**Recommendation**: Acceptable for MVP, add to post-launch roadmap

---

### 1.3 Webhook Signature Format - UNVERIFIED ⚠️

**File**: `apps/api/src/routes/webhooks.ts:58-60`

```typescript
const expectedSignature = createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex');
```

**Risk**: RevenueCat may use a different signature format (e.g., with timestamp, different encoding).

**Required Actions**:
1. Verify against RevenueCat documentation
2. Test with actual webhook delivery
3. Check if `X-RevenueCat-Signature` header format matches

---

## 2. What's Working Well ✅

### 2.1 Server-Side Rate Limiting

**File**: `apps/api/src/routes/generate.ts:86-135, 266-278`

- ✅ FREE_TIER_LIMIT = 3 per day
- ✅ Resets at UTC midnight
- ✅ Returns 429 when exceeded
- ✅ Pro users bypass limits
- ✅ Counter increments only on successful generation

### 2.2 Database Schema

- ✅ `user_profiles` with subscription_tier, daily_generations
- ✅ Auto-creates profile on signup (trigger)
- ✅ RLS policies properly configured

### 2.3 Error Codes

- ✅ Comprehensive error handling in generate.ts
- ✅ User-friendly error messages
- ✅ Proper HTTP status codes

---

## 3. Untested User Journeys

### 3.1 Critical Path (Must Test Before Launch)

| Journey | Status | Notes |
|---------|--------|-------|
| Sign up → Generate first audio → Play | ❓ | Need E2E test |
| Hit rate limit → See upgrade prompt | ❓ | Need E2E test |
| Purchase Pro → Limits removed | ❌ | Blocked by RevenueCat |
| Resume playback after app kill | ❓ | Need device test |
| Background audio + lock screen | ❓ | Need device test |

### 3.2 Edge Cases (Should Test)

| Scenario | Expected | Tested |
|----------|----------|--------|
| Network drops during generation | Show error, retry option | ❓ |
| Network drops during playback | Buffer, resume when back | ❓ |
| Very long article (10k+ words) | Reject with error | ❓ |
| App in background for 1hr+ | Audio continues, position saves | ❓ |
| Multiple devices, same account | Last-write-wins on position | ❓ |
| Delete account | All data purged (GDPR) | ❓ |

---

## 4. Missing MVP Features

### 4.1 Required for Launch

| Feature | Status | Blocker? |
|---------|--------|----------|
| Real IAP (RevenueCat) | ✅ SDK integrated | Need external setup (dashboard, products) |
| Terms of Service screen | ⚠️ External link only | YES - need page at tsucast.com/terms |
| Privacy Policy screen | ⚠️ External link only | YES - need page at tsucast.com/privacy |
| Account deletion | ✅ Implemented | API + UI complete |
| Signup terms clickable | ✅ Implemented | Links are now tappable |
| Restore purchases | ✅ Implemented | Available in Settings |

**Details**:
- RevenueCat SDK installed, uses stub mode until API keys configured
- `settings.tsx` has links to external URLs but pages must exist
- `signup.tsx` has tappable Terms/Privacy links
- Account deletion: DELETE /api/user/account + UI in Settings

### 4.2 Nice to Have (Post-MVP)

| Feature | Priority |
|---------|----------|
| Offline playback | High |
| Search in library | Medium |
| Share audio link | Medium |
| YouTube URL support | Medium |
| Multiple languages | Low |

---

## 5. Platform-Specific Testing Required

### 5.1 iOS

- [ ] Background audio mode enabled in Info.plist
- [ ] Lock screen controls work
- [ ] Control Center integration
- [ ] CarPlay (if supported)
- [ ] Headphone disconnect pauses
- [ ] Phone call pauses/resumes

### 5.2 Android

- [ ] Notification controls work
- [ ] Audio focus handling (other apps)
- [ ] Bluetooth disconnect handling
- [ ] Doze mode doesn't kill playback
- [ ] Android Auto (if supported)

---

## 6. Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| Auth tokens secure (httpOnly) | ✅ | Supabase handles |
| SQL injection prevention | ✅ | Using Supabase SDK |
| XSS prevention | ✅ | React Native (no DOM) |
| Rate limiting | ✅ | Implemented |
| Input validation | ✅ | Zod schemas |
| Secrets in env vars | ✅ | Not hardcoded |
| HTTPS only | ✅ | Enforced |
| Audio URLs guessable | ⚠️ | SHA256 hash, low risk |

---

## 7. Recommended Test Plan

### Phase 1: Pre-RevenueCat (Can Do Now)

1. **Manual E2E Test**
   - Create new account
   - Generate 3 articles
   - Verify rate limit kicks in
   - Play audio, background app
   - Kill app, reopen, verify position saved

2. **Device Testing**
   - iOS: Background audio, lock screen
   - Android: Notification controls, background

3. **Error Scenarios**
   - Invalid URL → proper error
   - Paywall site → proper error
   - Server timeout → proper error + retry

### Phase 2: With RevenueCat

4. **Purchase Flow**
   - View offerings
   - Complete purchase (sandbox)
   - Verify subscription_tier = 'pro'
   - Verify no rate limit

5. **Subscription Lifecycle**
   - Cancel subscription
   - Verify downgrade after expiry
   - Restore purchases

---

## 8. Action Items

### Must Do (Launch Blockers)

1. [x] **Install RevenueCat SDK** - react-native-purchases installed ✅
2. [ ] **Configure RevenueCat** - dashboard setup, store products, API keys (EXTERNAL)
3. [ ] **Create Terms/Privacy web pages** - need actual pages at tsucast.com (EXTERNAL)
4. [x] **Add account deletion** - UI in settings + API endpoint ✅
5. [x] **Make signup terms clickable** - tappable links ✅
6. [ ] **Device test iOS/Android** - background audio, lock screen, notifications
7. [x] **Fix webhook signature** - uses Bearer token auth ✅

### Should Do (High Risk)

7. [ ] **E2E test critical path** - signup → generate → play → rate limit
8. [ ] **Test error scenarios** - network drops, invalid URLs, paywall sites
9. [ ] **Test 100+ item library performance** - scroll smoothness, memory usage

### Nice to Have

10. [ ] Signed audio URLs (prevent hotlinking)
11. [ ] Offline playback (download for offline)
12. [ ] Analytics/crash reporting (Sentry, Mixpanel)

---

## 9. Summary of Launch Blockers

| Blocker | Status | What's Needed |
|---------|--------|---------------|
| RevenueCat integration | ✅ SDK integrated | External: dashboard, store products, API keys |
| Terms of Service page | ⚠️ Link only | Create page at tsucast.com/terms |
| Privacy Policy page | ⚠️ Link only | Create page at tsucast.com/privacy |
| Account deletion | ✅ Complete | Implemented - API + UI |
| Signup terms clickable | ✅ Complete | Links are tappable |
| Webhook signature | ✅ Fixed | Uses Bearer token auth per RevenueCat docs |
| Restore purchases | ✅ Complete | Available in Settings |

---

## Appendix: File References

- Rate limiting: `apps/api/src/routes/generate.ts:266-278`
- RevenueCat stub: `apps/mobile/services/purchases.ts` (STUB - all mocked)
- Webhooks: `apps/api/src/routes/webhooks.ts:58-60`
- Storage: `apps/api/src/services/storage.ts:82` (public URLs)
- User profiles: `supabase/migrations/001_user_profiles.sql`
- Settings (terms links): `apps/mobile/app/(tabs)/settings.tsx:112-118`
- Signup terms text: `apps/mobile/app/(auth)/signup.tsx:187-190`
- Account deletion: **NOT FOUND** - needs implementation
