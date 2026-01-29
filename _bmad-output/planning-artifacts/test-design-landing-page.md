# Test Design: Landing Page Redesign

**Date:** 2026-01-29
**Author:** Tino
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Landing Page Redesign
**Business Goal:** 1,000 paid subscribers in 3 months - landing page is the conversion driver

**Risk Summary:**
- Total risks identified: 10
- High-priority risks (≥6): 3
- Critical categories: BUS (business impact), DATA (data integrity), TECH (technical)

**Coverage Summary:**
- P0 scenarios: 8 tests (~16 hours)
- P1 scenarios: 12 tests (~12 hours)
- P2 scenarios: 10 tests (~5 hours)
- **Total effort**: ~33 hours (~4 days)

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-001 | BUS | Hero audio player fails to play | 2 | 3 | 6 | E2E tests for audio playback, error states | QA |
| R-003 | DATA | Featured content API returns empty/error | 2 | 3 | 6 | API tests + fallback UI for empty state | DEV |
| R-005 | BUS | Mobile responsive layout breaks | 2 | 3 | 6 | Viewport tests at 375px, 768px, 1024px | QA |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-002 | TECH | Night mode toggle breaks layout | 2 | 2 | 4 | Visual regression + localStorage tests | DEV |
| R-006 | SEC | FAQ admin unauthorized access | 1 | 3 | 3 | Auth middleware test | DEV |
| R-007 | TECH | Voice tester audio fails | 2 | 2 | 4 | Audio element tests, preload | QA |
| R-008 | PERF | Scroll animations cause jank | 2 | 2 | 4 | Lighthouse perf budget, graceful fallback | DEV |
| R-009 | BUS | CTA signup flow broken | 1 | 3 | 3 | E2E smoke test for signup path | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Prob | Impact | Score | Action |
|---------|----------|-------------|------|--------|-------|--------|
| R-004 | TECH | Typing animation perf issues | 1 | 2 | 2 | Monitor, CSS-only |
| R-010 | DATA | FAQ reorder fails | 1 | 2 | 2 | Integration test |

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Hero audio player plays featured content | E2E | R-001 | 2 | QA | Play, seek, pause |
| Featured content API returns data | API | R-003 | 2 | DEV | Success + empty state |
| Landing page renders on mobile (375px) | E2E | R-005 | 2 | QA | Hero, pricing visible |
| CTA → Signup flow works | E2E | R-009 | 1 | QA | Smoke test |
| Night mode toggle persists | E2E | R-002 | 1 | DEV | LocalStorage check |

**Total P0**: 8 tests, ~16 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| FAQ accordion expand/collapse | Component | - | 2 | DEV | Animation + content |
| Voice tester plays samples | E2E | R-007 | 2 | QA | Select voice, play audio |
| Pricing cards display correctly | Component | - | 2 | DEV | 4 packs, badges |
| Free samples section loads | API + E2E | R-003 | 2 | QA | Non-featured items |
| Responsive: Tablet (768px) | E2E | R-005 | 2 | QA | 2-column features |
| Desktop layout (1024px+) | E2E | R-005 | 2 | QA | Full layout |

**Total P1**: 12 tests, ~12 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Typing animation loops correctly | Component | R-004 | 2 | DEV | 4 phases, timing |
| Scroll animations trigger | E2E | R-008 | 2 | QA | IntersectionObserver |
| Footer links work | E2E | - | 1 | QA | Privacy, Terms |
| Founder story section renders | Component | - | 1 | DEV | Photo, quote |
| Login page renders with night mode | E2E | R-002 | 2 | QA | Light + dark |
| Signup page validation | E2E | - | 2 | QA | Error states |

**Total P2**: 10 tests, ~5 hours

### P3 (Low) - Run on-demand

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Admin FAQ CRUD | API | 4 | DEV | Create, read, update, delete |
| Admin FAQ reorder | API | 1 | DEV | Position update |
| Admin featured toggle | API | 1 | DEV | Only one featured |
| Lighthouse performance budget | Perf | 1 | DEV | LCP < 2.5s, CLS < 0.1 |

**Total P3**: 7 tests, ~3 hours

---

## Execution Order

### Smoke Tests (<3 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] Landing page loads (200 OK)
- [ ] Hero section visible
- [ ] Featured audio player visible
- [ ] CTA button clickable

### P0 Tests (<10 min)

**Purpose**: Critical path validation

- [ ] Hero audio player plays (E2E)
- [ ] Featured content API responds (API)
- [ ] Mobile viewport renders (E2E, 375px)
- [ ] Night mode persists (E2E)
- [ ] CTA → Signup smoke (E2E)

### P1 Tests (<20 min)

**Purpose**: Important feature coverage

- [ ] FAQ accordion (Component)
- [ ] Voice tester (E2E)
- [ ] Pricing cards (Component)
- [ ] Free samples (E2E)
- [ ] Tablet/Desktop viewports (E2E)

### P2/P3 Tests (<30 min)

**Purpose**: Full regression coverage

- [ ] Animations (Component + E2E)
- [ ] Admin CRUD (API)
- [ ] Login/Signup pages (E2E)
- [ ] Performance (Lighthouse)

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 8 | 2.0 | 16 | Complex setup, audio testing |
| P1 | 12 | 1.0 | 12 | Standard coverage |
| P2 | 10 | 0.5 | 5 | Simple scenarios |
| P3 | 7 | 0.5 | 3.5 | Admin + perf |
| **Total** | **37** | **-** | **~37 hours** | **~5 days** |

### Prerequisites

**Test Data:**
- `freeContentFactory` - Creates free content items with audio
- `faqItemFactory` - Creates FAQ items for accordion tests
- `userFactory` - Admin user for admin tests

**Tooling:**
- Playwright for E2E (viewport emulation, audio testing)
- Vitest for unit/component tests
- Lighthouse CI for performance

**Environment:**
- Local dev server (npm run web:dev)
- Test database with seeded content
- Pre-generated voice sample audio files

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: ≥80% (hero, pricing, signup)
- **Responsive viewports**: 100% (375px, 768px, 1024px)
- **Admin features**: 100% (FAQ CRUD, featured toggle)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] No high-risk (≥6) items unmitigated
- [ ] Hero audio player works on mobile Chrome/Safari
- [ ] Night mode doesn't break any section

---

## Test Scenarios by Section

### Section 1: Header

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-HDR-001 | Logo links to home | E2E | P2 |
| LP-HDR-002 | Pricing anchor scrolls to pricing section | E2E | P2 |
| LP-HDR-003 | Sign In navigates to /login | E2E | P1 |
| LP-HDR-004 | Night mode toggle switches theme | E2E | P0 |
| LP-HDR-005 | Night mode persists on reload | E2E | P0 |
| LP-HDR-006 | Mobile hamburger menu opens/closes | E2E | P1 |
| LP-HDR-007 | Header sticky on scroll | E2E | P2 |

### Section 2: Hero

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-HERO-001 | Headline renders correctly | E2E | P1 |
| LP-HERO-002 | Typing animation loops (4 phases) | Component | P2 |
| LP-HERO-003 | Audio player displays featured content title | E2E | P0 |
| LP-HERO-004 | Audio player plays on click | E2E | P0 |
| LP-HERO-005 | Audio player seek works | E2E | P1 |
| LP-HERO-006 | Audio player pause/resume works | E2E | P1 |
| LP-HERO-007 | CTA button navigates to /signup | E2E | P0 |
| LP-HERO-008 | Empty featured content shows fallback | E2E | P1 |

### Section 3: Free Samples

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-FREE-001 | Free samples section loads | E2E | P1 |
| LP-FREE-002 | 3 sample cards visible on desktop | E2E | P1 |
| LP-FREE-003 | Horizontal scroll on mobile | E2E | P1 |
| LP-FREE-004 | Play button plays audio | E2E | P1 |
| LP-FREE-005 | Empty state when no free content | E2E | P2 |

### Section 4: Features

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-FEAT-001 | 6 feature cards render | Component | P1 |
| LP-FEAT-002 | Lightning fast counter animates | Component | P2 |
| LP-FEAT-003 | Voice tester: select voice | E2E | P1 |
| LP-FEAT-004 | Voice tester: play sample | E2E | P1 |
| LP-FEAT-005 | Works Anywhere carousel loops | Component | P2 |
| LP-FEAT-006 | Sleep timer animation plays | Component | P2 |
| LP-FEAT-007 | Scroll trigger activates animations | E2E | P2 |

### Section 5: Founder Story

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-FOUNDER-001 | Photo loads (webp) | E2E | P2 |
| LP-FOUNDER-002 | Quote and signature render | Component | P2 |

### Section 6: Pricing

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-PRICE-001 | 4 pricing cards display | Component | P1 |
| LP-PRICE-002 | Popular badge on Kebab | Component | P2 |
| LP-PRICE-003 | Best value badge on Feast | Component | P2 |
| LP-PRICE-004 | Buy button redirects to /login | E2E | P1 |

### Section 7: FAQ

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-FAQ-001 | FAQ items load from API | E2E | P1 |
| LP-FAQ-002 | Accordion expands on click | Component | P1 |
| LP-FAQ-003 | Accordion collapses on second click | Component | P1 |
| LP-FAQ-004 | Only one item expanded at a time | Component | P2 |
| LP-FAQ-005 | Arrow rotates on expand | Component | P2 |

### Section 8: Footer

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-FOOTER-001 | Footer renders all link columns | Component | P2 |
| LP-FOOTER-002 | Privacy link works | E2E | P2 |
| LP-FOOTER-003 | Terms link works | E2E | P2 |

### Admin Tests

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-ADMIN-001 | FAQ CRUD: Create item | API | P3 |
| LP-ADMIN-002 | FAQ CRUD: Update item | API | P3 |
| LP-ADMIN-003 | FAQ CRUD: Delete item | API | P3 |
| LP-ADMIN-004 | FAQ CRUD: Reorder items | API | P3 |
| LP-ADMIN-005 | Featured toggle: Only one featured | API | P3 |
| LP-ADMIN-006 | Unauthorized user cannot access admin | API | P1 |

### Responsive Tests

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-RESP-001 | Mobile 375px: Hero visible | E2E | P0 |
| LP-RESP-002 | Mobile 375px: Hamburger menu | E2E | P1 |
| LP-RESP-003 | Tablet 768px: 2-column features | E2E | P1 |
| LP-RESP-004 | Desktop 1024px: Full layout | E2E | P1 |

### Night Mode Tests

| Test ID | Scenario | Level | Priority |
|---------|----------|-------|----------|
| LP-NIGHT-001 | Toggle switches all sections | E2E | P0 |
| LP-NIGHT-002 | Persists to localStorage | E2E | P0 |
| LP-NIGHT-003 | Respects prefers-color-scheme | E2E | P2 |
| LP-NIGHT-004 | Smooth transition (300ms) | Component | P3 |

---

## Mitigation Plans

### R-001: Hero Audio Player Fails (Score: 6)

**Mitigation Strategy:**
1. Test audio playback on Chrome, Safari, Firefox
2. Add loading state with fallback message
3. Handle audio load errors gracefully
4. Test with slow network (3G throttling)

**Owner:** QA
**Verification:** LP-HERO-004, LP-HERO-005, LP-HERO-006

### R-003: Featured Content API Empty (Score: 6)

**Mitigation Strategy:**
1. API returns 200 with empty array (not error)
2. UI shows "No content available" state
3. Pre-seed at least one featured item in production

**Owner:** DEV
**Verification:** LP-HERO-008, API integration test

### R-005: Mobile Responsive Breaks (Score: 6)

**Mitigation Strategy:**
1. Test all 3 breakpoints (375, 768, 1024)
2. Use CSS Grid/Flexbox with fallbacks
3. Test on real devices (BrowserStack or physical)

**Owner:** QA
**Verification:** LP-RESP-001 through LP-RESP-004

---

## Assumptions and Dependencies

### Assumptions

1. Voice sample audio files will be pre-generated and stored in R2
2. Founder photo will be converted to WebP and placed at `/public/images/founder.webp`
3. FAQ items table will be created before testing
4. Featured content toggle will be added to existing admin page

### Dependencies

1. **Database migration** - faq_items table + featured column on free_content
2. **API endpoints** - FAQ CRUD, featured toggle
3. **Voice samples** - 3 pre-generated MP3 files for voice tester

---

## Follow-on Workflows (Manual)

- Run `*atdd` to generate failing P0 tests before implementation
- Run `*automate` for broader coverage once implementation exists

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `_bmad/bmm/testarch/test-design`
**Version**: 4.0 (BMad v6)
