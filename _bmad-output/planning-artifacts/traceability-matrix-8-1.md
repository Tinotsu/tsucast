# Traceability Matrix - Story 8.1: MVP Launch Blockers

**Story:** 8.1 MVP Launch Blockers
**Date:** 2026-01-21
**Status:** 14% Coverage (6 CRITICAL/HIGH gaps)
**Author:** TEA (Test Architect) Agent

---

## Executive Summary

Story 8-1 implements critical MVP launch features including RevenueCat integration, account deletion, webhook handling, tappable terms on signup, and restore purchases. **Test coverage is critically low at 14%**, with only 1 of 7 acceptance criteria having any test coverage.

**Gate Decision: FAIL** - P0/P1 acceptance criteria lack test coverage.

---

## Coverage Summary

| Priority | Total Criteria | FULL Coverage | Coverage % | Status |
|----------|---------------|---------------|------------|--------|
| P0       | 2             | 0             | 0%         | ❌ FAIL |
| P1       | 4             | 0             | 0%         | ❌ FAIL |
| P2       | 1             | 1             | 100%       | ✅ PASS |
| **Total** | **7**        | **1**         | **14%**    | ❌ FAIL |

---

## Detailed Mapping

### AC-1: Real RevenueCat Integration (P0)

**Description:** Given user wants to purchase Pro subscription, when they tap "Upgrade", then real RevenueCat SDK processes payment via App Store/Play Store, and subscription is activated immediately, and user_profiles.subscription_tier updates to 'pro'.

**Coverage:** NONE ❌

**Implementation Files:**
- `apps/mobile/services/purchases.ts` - RevenueCat SDK wrapper
- `apps/mobile/app/upgrade.tsx` - Upgrade screen with purchase flow
- `apps/mobile/hooks/useSubscription.ts` - Subscription hook

**Tests Found:** None

**Gap Analysis:**
- Missing unit tests for `purchases.ts` service functions
- Missing unit tests for `isPurchasesConfigured()`, `initializePurchases()`, `purchasePackage()`
- Missing component tests for `upgrade.tsx` purchase flow
- Missing E2E test for full purchase journey (blocked by sandbox requirement)

**Recommendation:**
- Add unit tests: `apps/mobile/__tests__/unit/purchases/purchases.test.ts`
- Add component test: `apps/mobile/__tests__/component/upgrade.test.tsx`
- Test IDs needed: `8.1-UNIT-001` through `8.1-UNIT-005`, `8.1-COMP-001`

---

### AC-2: Terms of Service Page (P2)

**Description:** Given user wants to read Terms of Service, when they tap Terms link in settings, then they are taken to tsucast.com/terms, and page contains actual legal content.

**Coverage:** PARTIAL ⚠️ (Web only)

**Implementation Files:**
- `apps/mobile/app/(tabs)/settings.tsx:120-122` - handleTermsOfService function
- `apps/web/app/(app)/settings/page.tsx:183` - Web Terms link
- `apps/web/components/landing/Footer.tsx:73` - Footer Terms link

**Tests Found:**
- ✅ `apps/web/__tests__/pages/settings.test.tsx:334-347` - Web settings Terms link (P2)
- ✅ `apps/web/__tests__/landing.test.tsx:80` - Landing page Terms link

**Gap Analysis:**
- Missing mobile tests for tapping Terms link in settings
- External page content cannot be tested (tsucast.com/terms)

**Recommendation:**
- Add mobile unit test to verify `Linking.openURL` is called with correct URL
- Test ID needed: `8.1-UNIT-006`

---

### AC-3: Privacy Policy Page (P2)

**Description:** Given user wants to read Privacy Policy, when they tap Privacy link in settings, then they are taken to tsucast.com/privacy, and page contains actual legal content.

**Coverage:** PARTIAL ⚠️ (Web only)

**Implementation Files:**
- `apps/mobile/app/(tabs)/settings.tsx:116-118` - handlePrivacyPolicy function
- `apps/web/app/(app)/settings/page.tsx:176` - Web Privacy link
- `apps/web/components/landing/Footer.tsx:68` - Footer Privacy link

**Tests Found:**
- ✅ `apps/web/__tests__/pages/settings.test.tsx:318-331` - Web settings Privacy link (P2)
- ✅ `apps/web/__tests__/landing.test.tsx:79` - Landing page Privacy link

**Gap Analysis:**
- Missing mobile tests for tapping Privacy link in settings
- External page content cannot be tested (tsucast.com/privacy)

**Recommendation:**
- Add mobile unit test to verify `Linking.openURL` is called with correct URL
- Test ID needed: `8.1-UNIT-007`

---

### AC-4: Tappable Terms on Signup (P1)

**Description:** Given user is on signup screen, when they see terms agreement text, then "Terms of Service" and "Privacy Policy" are tappable links, and tapping opens the respective page.

**Coverage:** NONE ❌

**Implementation Files:**
- `apps/mobile/app/(auth)/signup.tsx:189-202` - Tappable Terms/Privacy Text components

**Tests Found:** None

**Gap Analysis:**
- Missing component test for signup screen terms links
- Should verify Text components have `onPress` handlers
- Should verify `Linking.openURL` called with correct URLs

**Recommendation:**
- Add component test: `apps/mobile/__tests__/component/signup.test.tsx`
- Test IDs needed: `8.1-COMP-002`, `8.1-COMP-003`

---

### AC-5: Account Deletion (P0)

**Description:** Given user wants to delete their account, when they tap "Delete Account" in settings, then they see confirmation dialog with warning, and on confirm, all user data is permanently deleted, and they are logged out and returned to login screen.

**Coverage:** NONE ❌

**Implementation Files:**
- `apps/mobile/app/(tabs)/settings.tsx:168-195` - handleDeleteAccount function
- `apps/mobile/services/api.ts` - deleteAccount() API call
- `apps/api/src/routes/user.ts:174-220` - DELETE /api/user/account endpoint

**Tests Found:** None

**Gap Analysis:**
- **CRITICAL**: No tests for account deletion API endpoint
- **CRITICAL**: No tests for mobile account deletion UI flow
- Missing tests for cascade delete (correct order: playlist_items → playlists → user_library → user_profiles → auth.users)
- Missing tests for error handling if deletion fails
- Missing tests for confirmation dialog appearance

**Recommendation:**
- Add API integration test: `apps/api/__tests__/integration/user.test.ts`
- Add mobile component test for settings delete flow
- Test IDs needed: `8.1-API-001`, `8.1-API-002`, `8.1-COMP-004`, `8.1-COMP-005`

---

### AC-6: Webhook Signature Verification (P1)

**Description:** Given RevenueCat sends webhook notification, when subscription status changes, then webhook signature is verified correctly per RevenueCat docs, and user_profiles.subscription_tier is updated appropriately.

**Coverage:** NONE ❌

**Implementation Files:**
- `apps/api/src/routes/webhooks.ts:45-140` - RevenueCat webhook handler

**Tests Found:** None

**Gap Analysis:**
- **HIGH**: No tests for webhook authentication (Bearer token)
- **HIGH**: No tests for subscription event handling (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
- Missing tests for invalid authorization rejection
- Missing tests for malformed JSON handling
- Missing tests for user_profiles.subscription_tier update

**Recommendation:**
- Add API integration test: `apps/api/__tests__/integration/webhooks.test.ts`
- Test IDs needed: `8.1-API-003` through `8.1-API-010`

---

### AC-7: Restore Purchases (P1)

**Description:** Given user reinstalls app or switches devices, when they tap "Restore Purchases", then RevenueCat restores their subscription status, and subscription_tier reflects their actual plan.

**Coverage:** NONE ❌

**Implementation Files:**
- `apps/mobile/app/(tabs)/settings.tsx:128-166` - handleRestorePurchases function
- `apps/mobile/services/purchases.ts:283-325` - restorePurchases function
- `apps/mobile/app/upgrade.tsx:91-118` - handleRestore function

**Tests Found:** None

**Gap Analysis:**
- Missing unit tests for `restorePurchases()` function in purchases.ts
- Missing component tests for settings restore flow
- Missing component tests for upgrade screen restore button
- Missing tests for success/failure/cancelled states

**Recommendation:**
- Add unit test: `apps/mobile/__tests__/unit/purchases/restorePurchases.test.ts`
- Add component tests for settings and upgrade screens
- Test IDs needed: `8.1-UNIT-008`, `8.1-COMP-006`, `8.1-COMP-007`

---

## Gap Analysis Summary

### Critical Gaps (P0 - BLOCKING)

| Gap | Criterion | Impact | Recommended Test |
|-----|-----------|--------|------------------|
| 1 | AC-1 RevenueCat purchase flow | Cannot verify IAP works | Unit tests for purchases.ts |
| 2 | AC-5 Account deletion API | Cannot verify GDPR compliance | Integration test for DELETE /api/user/account |
| 3 | AC-5 Account deletion UI | Cannot verify user can delete account | Component test for settings |

### High Priority Gaps (P1)

| Gap | Criterion | Impact | Recommended Test |
|-----|-----------|--------|------------------|
| 4 | AC-4 Tappable terms on signup | Cannot verify App Store requirement | Component test for signup |
| 5 | AC-6 Webhook authentication | Cannot verify subscription sync works | Integration test for webhook endpoint |
| 6 | AC-7 Restore purchases | Cannot verify App Store requirement | Unit + component tests |

### Medium Priority Gaps (P2)

| Gap | Criterion | Impact | Recommended Test |
|-----|-----------|--------|------------------|
| 7 | AC-2 Mobile Terms link | Low risk - implementation simple | Unit test for settings |
| 8 | AC-3 Mobile Privacy link | Low risk - implementation simple | Unit test for settings |

---

## Recommended Test Plan

### Phase 1: Critical Tests (Must Have for MVP)

1. **8.1-API-001**: Account deletion endpoint - happy path
   ```
   Given: Authenticated user with data
   When: DELETE /api/user/account called
   Then: All user data deleted, auth user removed, returns 200
   ```

2. **8.1-API-002**: Account deletion endpoint - cascade order
   ```
   Given: User with playlist_items, playlists, user_library, user_profile
   When: DELETE /api/user/account called
   Then: Deletes in correct order respecting foreign keys
   ```

3. **8.1-API-003**: Webhook authentication - valid token
   ```
   Given: Valid Bearer token in Authorization header
   When: POST /api/webhooks/revenuecat with INITIAL_PURCHASE event
   Then: Returns 200, updates user_profiles.subscription_tier to 'pro'
   ```

4. **8.1-API-004**: Webhook authentication - invalid token
   ```
   Given: Invalid Bearer token in Authorization header
   When: POST /api/webhooks/revenuecat
   Then: Returns 401 Unauthorized
   ```

5. **8.1-UNIT-001**: purchases.ts - isPurchasesConfigured
   ```
   Given: API keys not set
   When: isPurchasesConfigured() called
   Then: Returns false
   ```

### Phase 2: High Priority Tests (Should Have)

6. **8.1-COMP-001**: Upgrade screen - purchase button state
7. **8.1-COMP-002**: Signup screen - Terms link tappable
8. **8.1-COMP-003**: Signup screen - Privacy link tappable
9. **8.1-COMP-004**: Settings - Delete account button visible
10. **8.1-COMP-005**: Settings - Delete account confirmation dialog

### Phase 3: Lower Priority Tests (Nice to Have)

11. **8.1-UNIT-006**: Settings - Terms link calls Linking.openURL
12. **8.1-UNIT-007**: Settings - Privacy link calls Linking.openURL
13. **8.1-COMP-006**: Settings - Restore purchases button
14. **8.1-COMP-007**: Upgrade - Restore purchases button

---

## Quality Assessment

### Tests Not Yet Written

All tests for Story 8-1 are missing except for web settings tests (which cover AC-2 and AC-3 partially).

### Implementation Quality Concerns

1. **purchases.ts**: Uses stub mode when API keys not configured - testable pattern ✅
2. **webhooks.ts**: Uses Bearer token auth - simple to test ✅
3. **user.ts account deletion**: Cascade delete logic is complex - needs thorough testing ⚠️

---

## Gate Decision

### Decision: ❌ FAIL

### Rationale

| Criterion | Threshold | Actual | Status |
|-----------|-----------|--------|--------|
| P0 Coverage | ≥100% | 0% | ❌ FAIL |
| P1 Coverage | ≥90% | 0% | ❌ FAIL |
| Overall Coverage | ≥80% | 14% | ❌ FAIL |

**Blocking Issues:**
1. Account deletion (P0) has NO test coverage - this is an Apple App Store requirement
2. RevenueCat integration (P0) has NO test coverage - this is critical for monetization
3. Webhook handling (P1) has NO test coverage - this affects subscription sync
4. Restore purchases (P1) has NO test coverage - this is an Apple App Store requirement

### Recommendation

**Before MVP launch, add these minimum tests:**

1. `apps/api/__tests__/integration/user.test.ts` - Account deletion tests
2. `apps/api/__tests__/integration/webhooks.test.ts` - Webhook authentication tests
3. `apps/mobile/__tests__/unit/purchases/purchases.test.ts` - Purchase service tests

**Estimated effort:** 4-6 hours of test writing

---

## References

- Story File: `_bmad-output/stories/8-1-mvp-launch-blockers.md`
- MVP Gaps Analysis: `docs/mvp-gaps-analysis.md`
- RevenueCat Docs: https://www.revenuecat.com/docs/webhooks
- Apple Account Deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/

---

## YAML Gate Snippet

```yaml
traceability:
  story_id: "8.1"
  story_name: "MVP Launch Blockers"
  coverage:
    overall: 14%
    p0: 0%
    p1: 0%
    p2: 100%
  gaps:
    critical: 3
    high: 3
    medium: 2
  status: "FAIL"
  blocking_issues:
    - "AC-1: No tests for RevenueCat purchase flow"
    - "AC-5: No tests for account deletion API or UI"
    - "AC-6: No tests for webhook authentication"
    - "AC-7: No tests for restore purchases"
  recommendations:
    - "Add apps/api/__tests__/integration/user.test.ts"
    - "Add apps/api/__tests__/integration/webhooks.test.ts"
    - "Add apps/mobile/__tests__/unit/purchases/purchases.test.ts"
```

---

<!-- Generated by TEA (Test Architect) Agent - BMAD Workflow testarch-trace -->
