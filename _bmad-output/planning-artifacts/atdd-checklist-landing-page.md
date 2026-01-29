# ATDD Checklist: Landing Page Redesign

**Date:** 2026-01-29
**Author:** Tino
**Status:** RED Phase (Tests Written, Failing)

---

## Story Summary

**Epic:** Landing Page Redesign
**Goal:** Premium landing page for conversion (1,000 paid subscribers in 3 months)
**Primary Test Level:** E2E + API

---

## Acceptance Criteria Breakdown

### P0 - Critical (Must Pass)

| AC ID | Criterion | Test Level | Test ID |
|-------|-----------|------------|---------|
| AC-001 | Hero displays featured content title | E2E | LP-HERO-003 |
| AC-002 | Hero audio player plays on click | E2E | LP-HERO-004 |
| AC-003 | CTA navigates to signup | E2E | LP-HERO-007 |
| AC-004 | Graceful fallback when no featured content | E2E | LP-HERO-008 |
| AC-005 | Night mode toggle switches theme | E2E | LP-NIGHT-001 |
| AC-006 | Night mode persists on reload | E2E | LP-NIGHT-002 |
| AC-007 | Mobile 375px: Hero visible | E2E | LP-RESP-001 |
| AC-008 | Mobile 375px: Hamburger menu works | E2E | LP-RESP-002 |

### P1 - High Priority (Should Pass)

| AC ID | Criterion | Test Level | Test ID |
|-------|-----------|------------|---------|
| AC-009 | Free samples section loads | E2E | LP-FREE-001 |
| AC-010 | Free samples audio plays | E2E | LP-FREE-004 |
| AC-011 | Voice tester: select voice | E2E | LP-FEAT-003 |
| AC-012 | Voice tester: play sample | E2E | LP-FEAT-004 |
| AC-013 | FAQ items load from API | E2E | LP-FAQ-001 |
| AC-014 | FAQ accordion expands | E2E | LP-FAQ-002 |
| AC-015 | 4 pricing cards display | E2E | LP-PRICE-001 |
| AC-016 | Buy redirects to login | E2E | LP-PRICE-004 |
| AC-017 | Tablet 768px: 2-column features | E2E | LP-RESP-003 |
| AC-018 | Desktop 1024px: full layout | E2E | LP-RESP-004 |

### P2/P3 - Lower Priority

| AC ID | Criterion | Test Level | Test ID |
|-------|-----------|------------|---------|
| AC-019 | Typing animation visible | E2E | LP-HERO-002 |
| AC-020 | Pricing anchor scroll | E2E | LP-HDR-004 |
| AC-021 | Footer privacy link | E2E | LP-FOOTER-002 |

---

## Test Files Created

| File | Path | Tests |
|------|------|-------|
| E2E Tests | `apps/web/tests/e2e/landing-page.spec.ts` | 20 |
| API Tests | `apps/web/tests/e2e/landing-page-api.spec.ts` | 9 |

**Total Tests:** 29

---

## Required data-testid Attributes

### Header

| Attribute | Element | Section |
|-----------|---------|---------|
| `night-mode-toggle` | Button | Header |
| `desktop-nav` | Nav container | Header |
| `mobile-menu-toggle` | Hamburger button | Header (mobile) |
| `mobile-menu` | Mobile nav menu | Header (mobile) |
| `nav-pricing` | Pricing nav link | Header |

### Hero Section

| Attribute | Element | Section |
|-----------|---------|---------|
| `hero-headline` | H1 headline | Hero |
| `typing-animation` | Animation container | Hero |
| `hero-audio-player` | Audio player container | Hero |
| `hero-audio-title` | Audio title text | Hero |
| `hero-audio-play` | Play button | Hero |
| `hero-audio-pause` | Pause button (when playing) | Hero |
| `hero-audio-progress` | Progress bar | Hero |
| `hero-audio-fallback` | Fallback message | Hero |
| `hero-cta` | CTA button | Hero |

### Free Samples Section

| Attribute | Element | Section |
|-----------|---------|---------|
| `free-samples-section` | Section container | Free Samples |
| `free-sample-card` | Sample card (multiple) | Free Samples |
| `free-sample-play` | Play button | Free Samples |
| `free-sample-pause` | Pause button | Free Samples |

### Features Section

| Attribute | Element | Section |
|-----------|---------|---------|
| `features-grid` | Grid container | Features |
| `voice-chip-adam` | Adam voice chip | Voice Tester |
| `voice-chip-sarah` | Sarah voice chip | Voice Tester |
| `voice-chip-michael` | Michael voice chip | Voice Tester |
| `voice-sample-play` | Play sample button | Voice Tester |
| `voice-sample-playing` | Playing indicator | Voice Tester |

### FAQ Section

| Attribute | Element | Section |
|-----------|---------|---------|
| `faq-section` | Section container | FAQ |
| `faq-item` | FAQ item (multiple) | FAQ |
| `faq-question` | Question button | FAQ |
| `faq-answer` | Answer content | FAQ |

### Pricing Section

| Attribute | Element | Section |
|-----------|---------|---------|
| `pricing-section` | Section container | Pricing |
| `pricing-card` | Card (multiple) | Pricing |
| `pricing-card-coffee` | Coffee pack card | Pricing |
| `pricing-card-kebab` | Kebab pack card | Pricing |
| `pricing-card-pizza` | Pizza pack card | Pricing |
| `pricing-card-feast` | Feast pack card | Pricing |
| `pricing-buy-coffee` | Buy button (Coffee) | Pricing |

### Footer

| Attribute | Element | Section |
|-----------|---------|---------|
| `footer-privacy` | Privacy link | Footer |

---

## API Endpoints Required

### Public Endpoints

| Method | Endpoint | Purpose | Test ID |
|--------|----------|---------|---------|
| GET | `/api/free-content/featured` | Featured hero content | API-FEAT-001 |
| GET | `/api/faq` | Published FAQ items | API-FAQ-001 |
| GET | `/api/voices/samples` | Voice sample URLs | API-VOICE-001 |

### Admin Endpoints (Auth Required)

| Method | Endpoint | Purpose | Test ID |
|--------|----------|---------|---------|
| GET | `/api/admin/faq` | All FAQ items | API-ADMIN-006 |
| POST | `/api/admin/faq` | Create FAQ item | API-ADMIN-001 |
| PATCH | `/api/admin/faq/:id` | Update FAQ item | - |
| DELETE | `/api/admin/faq/:id` | Delete FAQ item | - |
| PUT | `/api/admin/faq/reorder` | Reorder FAQ items | - |
| PATCH | `/api/admin/free-content/:id/featured` | Toggle featured | API-ADMIN-005 |

---

## Database Schema Required

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
```

### Modify Table: `free_content`

```sql
ALTER TABLE free_content
ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;

-- Only one featured item allowed
CREATE UNIQUE INDEX idx_free_content_featured
ON free_content (featured)
WHERE featured = true;
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Create `faq_items` database table
- [ ] Add `featured` column to `free_content` table
- [ ] Create `/api/faq` endpoint (public, GET)
- [ ] Create `/api/free-content/featured` endpoint (public, GET)
- [ ] Create `/api/voices/samples` endpoint (public, GET)
- [ ] Run tests: `npm run test:e2e -- landing-page-api.spec.ts`

### Phase 2: Header Component

- [ ] Create night mode toggle button
- [ ] Implement localStorage persistence for theme
- [ ] Add `data-testid="night-mode-toggle"`
- [ ] Add `data-testid="desktop-nav"` and `data-testid="mobile-menu-toggle"`
- [ ] Implement mobile hamburger menu
- [ ] Run tests: LP-NIGHT-001, LP-NIGHT-002, LP-RESP-002

### Phase 3: Hero Section

- [ ] Create hero headline component
- [ ] Implement typing animation (CSS)
- [ ] Create audio player component
- [ ] Fetch featured content from API
- [ ] Implement play/pause functionality
- [ ] Add fallback UI for empty state
- [ ] Add all `data-testid` attributes
- [ ] Run tests: LP-HERO-003, LP-HERO-004, LP-HERO-007, LP-HERO-008

### Phase 4: Free Samples Section

- [ ] Create free samples grid component
- [ ] Fetch non-featured content from API
- [ ] Implement sample card audio playback
- [ ] Add `data-testid` attributes
- [ ] Run tests: LP-FREE-001, LP-FREE-004

### Phase 5: Features Section

- [ ] Create features grid (6 cards)
- [ ] Implement voice tester (interactive)
- [ ] Pre-generate voice sample audio files
- [ ] Add voice chip selection logic
- [ ] Add `data-testid` attributes
- [ ] Run tests: LP-FEAT-003, LP-FEAT-004

### Phase 6: FAQ Section

- [ ] Create FAQ accordion component
- [ ] Fetch FAQ items from API
- [ ] Implement expand/collapse animation
- [ ] Add `data-testid` attributes
- [ ] Run tests: LP-FAQ-001, LP-FAQ-002

### Phase 7: Pricing Section

- [ ] Create pricing cards component (4 packs)
- [ ] Add badges (Popular, Best Value)
- [ ] Implement buy button → login redirect
- [ ] Add `data-testid` attributes
- [ ] Run tests: LP-PRICE-001, LP-PRICE-004

### Phase 8: Responsive Layout

- [ ] Test mobile 375px viewport
- [ ] Test tablet 768px viewport
- [ ] Test desktop 1024px viewport
- [ ] Run tests: LP-RESP-001 through LP-RESP-004

### Phase 9: Admin Extensions

- [ ] Add featured toggle to `/admin/free-content`
- [ ] Create `/admin/faq` page (CRUD)
- [ ] Implement FAQ reorder (drag & drop)
- [ ] Run tests: API-ADMIN-* tests

### Phase 10: Final Verification

- [ ] All P0 tests pass (8/8)
- [ ] All P1 tests pass (12/12)
- [ ] P2/P3 tests pass (9/9)
- [ ] Manual verification in browser
- [ ] Night mode works across all sections
- [ ] Mobile responsive complete

---

## Red-Green-Refactor Workflow

### RED Phase ✅ (Complete)

- ✅ All 29 tests written and committed
- ✅ Tests fail due to missing implementation
- ✅ data-testid requirements documented

### GREEN Phase (DEV Team)

1. Pick one failing test from P0
2. Implement minimal code to pass
3. Run test: `npm run test:e2e -- landing-page.spec.ts --grep "LP-HERO-003"`
4. Verify green
5. Move to next test
6. Repeat until all P0 tests pass
7. Continue with P1, P2, P3

### REFACTOR Phase (After Green)

1. All tests passing
2. Improve code quality
3. Extract shared components
4. Optimize performance (Lighthouse)
5. Ensure tests still pass

---

## Running Tests

```bash
# Run all landing page E2E tests
npm run test:e2e -- landing-page.spec.ts

# Run all landing page API tests
npm run test:e2e -- landing-page-api.spec.ts

# Run specific test by ID
npm run test:e2e -- landing-page.spec.ts --grep "LP-HERO-004"

# Run P0 tests only
npm run test:e2e -- landing-page.spec.ts --grep "P0"

# Run in headed mode (see browser)
npm run test:e2e -- landing-page.spec.ts --headed

# Run on specific viewport (mobile)
npm run test:e2e -- landing-page.spec.ts --project=chromium --grep "375px"
```

---

## Approval

**ATDD Checklist Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

---

**Generated by**: BMad TEA Agent - ATDD Module
**Workflow**: `_bmad/bmm/testarch/atdd`
**Version**: 4.0 (BMad v6)
