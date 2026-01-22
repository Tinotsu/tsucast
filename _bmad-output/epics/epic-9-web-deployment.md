# Epic 9: Web Application Deployment

> **Status**: Draft
> **Priority**: P0 - MVP Launch Blocker
> **Created**: 2026-01-22
> **Target**: Production deployment of tsucast web application

## Epic Overview

This epic covers all remaining work required to deploy the tsucast web application to production. It includes gap remediation, external service configuration, legal compliance, and pre-deployment verification.

---

## Domain Status Summary

| # | Domain | Status | Blocking? | Notes |
|---|--------|--------|-----------|-------|
| 1 | Authentication | ✅ Complete | No | Login, signup, OAuth, logout, session all working |
| 2 | Rate Limiting | ✅ Complete | No | UI shows remaining, disables at limit, upgrade prompt |
| 3 | Account Deletion | ❌ **GAP** | Yes | API exists, UI missing |
| 4 | Legal Pages | ❌ **GAP** | Yes | No /terms or /privacy pages |
| 5 | Error Handling | ✅ Complete | No | User-friendly errors, retry support |
| 6 | Library | ✅ Complete | No | CRUD, playback, delete all working |
| 7 | Web Player | ✅ Complete | No | Full controls, speed, seek, position tracking |
| 8 | Navigation | ✅ Complete | No | Responsive, mobile nav, protected routes |
| 9 | Payment Config | ⚠️ External | Yes | RevenueCat dashboard needs configuration |
| 10 | Health Monitoring | ✅ Complete | No | /health endpoint with all checks |

**Overall Completion: 70%** (7/10 domains ready)

---

## Stories

### Story 9-1: Account Deletion UI

**Priority**: P0 (App Store requirement)
**Estimate**: 4 hours
**Dependencies**: API endpoint exists at `DELETE /api/user/account`

#### Acceptance Criteria

- [ ] **AC1**: Settings page has "Delete Account" section in Account card
- [ ] **AC2**: Delete button styled as destructive action (red)
- [ ] **AC3**: Clicking delete shows confirmation dialog with warning text
- [ ] **AC4**: Dialog requires typing "DELETE" to confirm
- [ ] **AC5**: Successful deletion signs out user and redirects to home
- [ ] **AC6**: Error handling shows user-friendly message on failure

#### Technical Notes

```typescript
// Location: apps/web/app/(app)/settings/page.tsx
// Add to Account section (line ~60)

// Dialog should warn:
// "This action cannot be undone. All your data including:
// - Generated podcasts
// - Library items
// - Playlists
// - Account information
// will be permanently deleted."
```

#### Test Cases

- [ ] Delete button visible in settings
- [ ] Confirmation dialog appears on click
- [ ] Cannot submit without typing "DELETE"
- [ ] Successful deletion redirects to home
- [ ] Failed deletion shows error message

---

### Story 9-2: Terms of Service Page

**Priority**: P0 (Legal requirement)
**Estimate**: 2 hours (scaffold) + Legal review
**Dependencies**: None

#### Acceptance Criteria

- [ ] **AC1**: `/terms` route accessible without authentication
- [ ] **AC2**: Page displays Terms of Service content
- [ ] **AC3**: Last updated date visible
- [ ] **AC4**: Link to Privacy Policy included
- [ ] **AC5**: Responsive layout matching site design
- [ ] **AC6**: Footer links to Terms page

#### Technical Notes

```
Location: apps/web/app/(public)/terms/page.tsx

Content sections needed:
1. Acceptance of Terms
2. Description of Service
3. User Accounts
4. Acceptable Use
5. Intellectual Property
6. Limitation of Liability
7. Termination
8. Changes to Terms
9. Contact Information
```

---

### Story 9-3: Privacy Policy Page

**Priority**: P0 (Legal requirement - GDPR/CCPA)
**Estimate**: 2 hours (scaffold) + Legal review
**Dependencies**: None

#### Acceptance Criteria

- [ ] **AC1**: `/privacy` route accessible without authentication
- [ ] **AC2**: Page displays Privacy Policy content
- [ ] **AC3**: GDPR compliance sections included
- [ ] **AC4**: Data collection practices documented
- [ ] **AC5**: User rights section (deletion, export)
- [ ] **AC6**: Cookie policy included
- [ ] **AC7**: Footer links to Privacy page

#### Technical Notes

```
Location: apps/web/app/(public)/privacy/page.tsx

Required sections (GDPR):
1. Data We Collect
2. How We Use Your Data
3. Data Storage & Security
4. Third-Party Services (Supabase, Fish Audio, RevenueCat)
5. Your Rights (Access, Rectification, Deletion, Portability)
6. Cookie Policy
7. Children's Privacy
8. Changes to Policy
9. Contact DPO
```

---

### Story 9-4: RevenueCat Configuration

**Priority**: P0 (Monetization)
**Estimate**: 4 hours
**Dependencies**: RevenueCat account, App Store/Play Store accounts
**Type**: External Configuration

#### Acceptance Criteria

- [ ] **AC1**: RevenueCat project created for tsucast
- [ ] **AC2**: Products configured:
  - `tsucast_pro_monthly` - Monthly subscription
  - `tsucast_pro_yearly` - Annual subscription (optional)
- [ ] **AC3**: Webhook URL configured pointing to production API
- [ ] **AC4**: `REVENUECAT_WEBHOOK_AUTH_KEY` set in production env
- [ ] **AC5**: Test purchase flow works in sandbox
- [ ] **AC6**: Webhook events update user subscription_tier correctly

#### Technical Notes

```yaml
# Environment variables needed:
REVENUECAT_WEBHOOK_AUTH_KEY=<generate-secure-key>

# Webhook URL:
https://api.tsucast.com/api/webhooks/revenuecat

# RevenueCat Dashboard:
1. Create new project "tsucast"
2. Add App Store Connect app
3. Add Google Play Console app
4. Configure products
5. Set webhook URL with Bearer auth
```

---

### Story 9-5: Web Subscription Flow (Optional)

**Priority**: P2 (Post-MVP)
**Estimate**: 8 hours
**Dependencies**: Story 9-4

#### Acceptance Criteria

- [ ] **AC1**: Upgrade page has web payment option
- [ ] **AC2**: Stripe checkout integration for web users
- [ ] **AC3**: Webhook syncs Stripe → RevenueCat → user_profiles
- [ ] **AC4**: Subscription management in settings (cancel, update)

#### Technical Notes

```
// This is optional for MVP - mobile users subscribe via App Store/Play Store
// Web subscription can be added post-launch
// Upgrade page currently shows "Coming soon for web"
```

---

### Story 9-6: Pre-Deployment Verification

**Priority**: P0
**Estimate**: 4 hours
**Dependencies**: Stories 9-1 through 9-4

#### Acceptance Criteria

- [ ] **AC1**: All E2E tests pass (`npm run test:e2e`)
- [ ] **AC2**: All unit tests pass (`npm run test`)
- [ ] **AC3**: Build succeeds (`npm run build`)
- [ ] **AC4**: No TypeScript errors (`npm run typecheck`)
- [ ] **AC5**: Health check returns 200 on staging
- [ ] **AC6**: Manual smoke test of critical flows:
  - Login/Signup
  - Generate audio from URL
  - Play audio in library
  - Rate limit enforcement
  - Account deletion

#### Verification Checklist

```markdown
## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (unit + E2E)
- [ ] Build completes without errors
- [ ] No console errors in browser
- [ ] TypeScript strict mode passes

### Authentication
- [ ] Email login works
- [ ] Google OAuth works
- [ ] Apple OAuth works
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Session persists across refresh

### Rate Limiting
- [ ] Free users see "X of 3 left"
- [ ] Generate disabled at limit
- [ ] Upgrade prompt appears
- [ ] Pro users have no limit
- [ ] Counter resets at midnight UTC

### Generation Flow
- [ ] URL input validates correctly
- [ ] Cache hit returns instantly
- [ ] New generation shows loading
- [ ] Audio plays after generation
- [ ] Error messages display correctly
- [ ] Retry works after failure

### Library
- [ ] Items display with metadata
- [ ] Play button works
- [ ] Delete button works
- [ ] Position saves on pause
- [ ] Position resumes on play

### Account
- [ ] Delete account works
- [ ] Confirmation required
- [ ] Redirects after deletion

### Legal
- [ ] /terms page accessible
- [ ] /privacy page accessible
- [ ] Footer links work

### Monitoring
- [ ] /health returns 200
- [ ] All services healthy
- [ ] Logging working
```

---

### Story 9-7: Production Deployment

**Priority**: P0
**Estimate**: 2 hours
**Dependencies**: Story 9-6

#### Acceptance Criteria

- [ ] **AC1**: DNS configured for web domain
- [ ] **AC2**: SSL certificate provisioned
- [ ] **AC3**: Environment variables set in production
- [ ] **AC4**: Database migrations applied
- [ ] **AC5**: Zero-downtime deployment successful
- [ ] **AC6**: Post-deployment smoke test passes

#### Technical Notes

```yaml
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_URL=https://api.tsucast.com

# Deployment target: Vercel or self-hosted
# Domain: tsucast.com (or subdomain)
```

---

### Story 9-8: E2E Test Coverage Expansion

**Priority**: P1
**Estimate**: 4 hours
**Dependencies**: Stories 9-1, 9-2, 9-3

#### Acceptance Criteria

- [ ] **AC1**: E2E test for account deletion flow
- [ ] **AC2**: E2E test for Terms page accessibility
- [ ] **AC3**: E2E test for Privacy page accessibility
- [ ] **AC4**: E2E test for rate limit enforcement
- [ ] **AC5**: All new tests added to CI pipeline

---

## Detailed Domain Audit

### 1. Authentication ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| Login page | `app/(auth)/login/page.tsx` | ✅ |
| Signup page | `app/(auth)/signup/page.tsx` | ✅ |
| AuthForm component | `components/auth/AuthForm.tsx` | ✅ |
| Google OAuth | `components/auth/AuthForm.tsx` | ✅ |
| Apple OAuth | `components/auth/AuthForm.tsx` | ✅ |
| Password validation | `components/auth/AuthForm.tsx` | ✅ |
| Protected routes | `middleware.ts` | ✅ |
| Session refresh | `lib/supabase/middleware.ts` | ✅ |
| Logout | `hooks/useAuth.ts` | ✅ |
| Cookie cleanup | `hooks/useAuth.ts` | ✅ |

**Verification**: Manual test login/logout flows

---

### 2. Rate Limiting ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| Display remaining | `app/(app)/generate/page.tsx:129` | ✅ |
| Progress bar | `app/(app)/generate/page.tsx:141-147` | ✅ |
| Disable at limit | `app/(app)/generate/page.tsx:220-235` | ✅ |
| Upgrade prompt | `app/(app)/generate/page.tsx:151-169` | ✅ |
| API enforcement | `api/routes/generate.ts:50-102` | ✅ |

**Verification**: Test with free user at 3/3 limit

---

### 3. Account Deletion ❌ GAP

| Feature | File | Status |
|---------|------|--------|
| API endpoint | `api/routes/user.ts:110-184` | ✅ |
| Settings UI | `app/(app)/settings/page.tsx` | ❌ Missing |
| Confirmation dialog | N/A | ❌ Missing |

**Action**: Implement Story 9-1

---

### 4. Legal Pages ❌ GAP

| Feature | File | Status |
|---------|------|--------|
| Terms page | `app/(public)/terms/page.tsx` | ❌ Missing |
| Privacy page | `app/(public)/privacy/page.tsx` | ❌ Missing |
| Footer links | `components/landing/Footer.tsx` | ⚠️ Verify |

**Action**: Implement Stories 9-2 and 9-3

---

### 5. Error Handling ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| Error display | `app/(app)/generate/page.tsx:214-218` | ✅ |
| ApiError class | `lib/api.ts` | ✅ |
| 401 handling | `lib/api.ts` | ✅ |
| Timeout handling | `lib/api.ts` | ✅ |
| Retry button | `app/(app)/library/page.tsx:113-124` | ✅ |

---

### 6. Library ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| List items | `app/(app)/library/page.tsx` | ✅ |
| Item count | `app/(app)/library/page.tsx` | ✅ |
| Empty state | `app/(app)/library/page.tsx` | ✅ |
| Delete item | `app/(app)/library/page.tsx:65-78` | ✅ |
| Select item | `app/(app)/library/page.tsx` | ✅ |
| Play indicator | `app/(app)/library/page.tsx` | ✅ |

---

### 7. Web Player ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| Play/Pause | `components/app/WebPlayer.tsx:77-87` | ✅ |
| Seek bar | `components/app/WebPlayer.tsx:144-150` | ✅ |
| Skip ±15/30s | `components/app/WebPlayer.tsx:161-186` | ✅ |
| Speed control | `components/app/WebPlayer.tsx:192-202` | ✅ |
| Mute toggle | `components/app/WebPlayer.tsx:205-214` | ✅ |
| Position save | `components/app/WebPlayer.tsx:64-75` | ✅ |

---

### 8. Navigation ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| Header nav | `components/app/AppHeader.tsx` | ✅ |
| Mobile nav | `components/app/AppHeader.tsx:105-125` | ✅ |
| Active link | `components/app/AppHeader.tsx` | ✅ |
| User menu | `components/app/AppHeader.tsx` | ✅ |

---

### 9. Payment (External) ⚠️ PENDING

| Feature | File | Status |
|---------|------|--------|
| Webhook handler | `api/routes/webhooks.ts` | ✅ |
| Subscription update | `api/routes/webhooks.ts:78-107` | ✅ |
| RevenueCat dashboard | External | ❌ Config needed |
| Products setup | External | ❌ Config needed |

**Action**: Implement Story 9-4

---

### 10. Health Monitoring ✅ COMPLETE

| Feature | File | Status |
|---------|------|--------|
| /health endpoint | `api/routes/health.ts` | ✅ |
| Database check | `api/routes/health.ts:92-109` | ✅ |
| Storage check | `api/routes/health.ts:114-141` | ✅ |
| TTS check | `api/routes/health.ts:146-174` | ✅ |
| /health/ready | `api/routes/health.ts:82-87` | ✅ |

---

## Sprint Plan

### Sprint 1: Critical Gaps (P0)

| Story | Points | Assignee |
|-------|--------|----------|
| 9-1: Account Deletion UI | 3 | Dev |
| 9-2: Terms Page | 2 | Dev |
| 9-3: Privacy Page | 2 | Dev |
| 9-4: RevenueCat Config | 3 | DevOps |

**Total**: 10 points

### Sprint 2: Verification & Deployment (P0)

| Story | Points | Assignee |
|-------|--------|----------|
| 9-6: Pre-Deployment Verification | 3 | QA |
| 9-7: Production Deployment | 2 | DevOps |
| 9-8: E2E Test Expansion | 3 | Dev |

**Total**: 8 points

### Backlog (P2)

| Story | Points |
|-------|--------|
| 9-5: Web Subscription Flow | 5 |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Legal content not ready | High | Medium | Use placeholder, mark for legal review |
| RevenueCat config delays | Medium | Low | Can launch free-only initially |
| E2E tests flaky | Low | Medium | Add retry logic, fix hard waits |
| Production env issues | High | Low | Staging verification before prod |

---

## Success Criteria

1. All P0 stories completed
2. Pre-deployment checklist 100% green
3. Zero critical bugs in staging
4. Health check returns 200
5. Legal pages accessible
6. Account deletion working
7. Payment webhook tested

---

## References

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- MVP Gaps: `docs/mvp-gaps-analysis.md`
- Story 8-1: `_bmad-output/stories/8-1-mvp-launch-blockers.md`
