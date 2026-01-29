# Story 11.6: Auth Pages Refresh & Polish

Status: blocked-by:11-2

## Story

As a visitor converting to user,
I want login and signup pages that match the premium landing page design,
So that the experience feels cohesive and trustworthy.

## Acceptance Criteria

1. **AC1: Login Page Refresh**
   - Given visitor navigates to `/login`
   - When page loads
   - Then centered card layout with logo is shown
   - And "Welcome back" heading is displayed
   - And email/password fields have clean styling
   - And Google OAuth option is available
   - And night mode toggle is present

2. **AC2: Signup Page Refresh**
   - Given visitor navigates to `/signup`
   - When page loads
   - Then centered card layout with logo is shown
   - And "Create your account" heading is displayed
   - And email/password/confirm fields are present
   - And legal links (Terms, Privacy) are visible
   - And night mode toggle is present

3. **AC3: Upgrade Page Refresh**
   - Given authenticated user navigates to `/upgrade`
   - When page loads
   - Then current credit balance is prominently shown
   - And 4 pricing cards match landing page design
   - And Feast pack is featured (larger card)

4. **AC4: Night Mode on Auth Pages**
   - Given visitor has night mode enabled
   - When they navigate to login/signup
   - Then night mode preference is applied
   - And colors match dark theme

5. **AC5: Animation Polish**
   - Given all landing page sections are complete
   - When visitor scrolls through page
   - Then scroll animations trigger smoothly
   - And no jank or layout shift occurs
   - And Lighthouse performance score >= 90

## Tasks / Subtasks

### Task 1: Login Page (AC: 1, 4)
- [ ] 1.1 Redesign `/app/(auth)/login/page.tsx`
- [ ] 1.2 Add centered card layout
- [ ] 1.3 Update form styling (black borders, clean inputs)
- [ ] 1.4 Add night mode toggle
- [ ] 1.5 Add fade-in animation on load

### Task 2: Signup Page (AC: 2, 4)
- [ ] 2.1 Redesign `/app/(auth)/signup/page.tsx`
- [ ] 2.2 Match login page design
- [ ] 2.3 Add "Create your account" heading
- [ ] 2.4 Ensure legal links are visible

### Task 3: Upgrade Page (AC: 3)
- [ ] 3.1 Redesign `/app/(app)/upgrade/page.tsx`
- [ ] 3.2 Show credit balance at top
- [ ] 3.3 Use same pricing card component as landing
- [ ] 3.4 Feature Feast pack (larger, highlighted)

### Task 4: Animation Polish (AC: 5)
- [ ] 4.1 Review all scroll animations
- [ ] 4.2 Ensure `animation-timeline: view()` fallbacks work
- [ ] 4.3 Add stagger delays consistently
- [ ] 4.4 Test `prefers-reduced-motion` support
- [ ] 4.5 Run Lighthouse audit (target >= 90)
- [ ] 4.6 Fix any CLS issues

### Task 5: Final Testing
- [ ] 5.1 Run all landing page E2E tests
- [ ] 5.2 Manual testing on Chrome, Safari, Firefox
- [ ] 5.3 Test on real mobile device
- [ ] 5.4 Verify night mode across all pages

## Dev Notes

- Auth pages should use same `useTheme` hook
- Pricing cards can be extracted to shared component
- Lighthouse CI can be added to prevent regressions
- Test on slow 3G to verify no blocking resources

## Test Coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| LP-RESP-003 | Tablet 768px layout | ❌ |
| LP-RESP-004 | Desktop 1024px layout | ❌ |
| All P0 | 8 critical tests | ❌ |
| All P1 | 12 high priority tests | ❌ |
| All P2 | 9 medium priority tests | ❌ |

## Story Wrap-up

- [ ] All 29 landing page tests pass
- [ ] Login/Signup pages match design
- [ ] Lighthouse >= 90 performance
- [ ] Night mode works everywhere
- [ ] Code review complete
- [ ] Ready for production
