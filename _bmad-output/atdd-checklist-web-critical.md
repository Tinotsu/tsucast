# ATDD Checklist: Web Critical Journeys

> **Status**: RED (Tests written, implementation verification needed)
> **Stories Covered**: 7-2 (User Authentication), 7-3 (Audio Generation & Playback)
> **Created**: 2026-01-22

## Overview

This checklist tracks Acceptance Test-Driven Development (ATDD) tests for the web application's critical user journeys: authentication, audio generation, and library management.

## Test Files

| File | Journey | Tests | Status |
|------|---------|-------|--------|
| `tests/e2e/critical-journeys/auth-journey.spec.ts` | Authentication | 15 | RED |
| `tests/e2e/critical-journeys/generate-journey.spec.ts` | Generate | 18 | RED |
| `tests/e2e/critical-journeys/library-journey.spec.ts` | Library | 15 | RED |
| `tests/e2e/support/fixtures/auth.fixture.ts` | Fixtures | N/A | Complete |

## Authentication Journey (Story 7-2)

### AC1: Login Form
| Test | Status | Notes |
|------|--------|-------|
| Display email/password form on login page | 🔴 RED | |
| Display sign up link on login page | 🔴 RED | |
| Show error for invalid credentials | 🔴 RED | |
| Show loading during authentication | 🔴 RED | |
| Redirect to dashboard after successful login | 🔴 RED | |

### AC2: Session Management
| Test | Status | Notes |
|------|--------|-------|
| Maintain session across page refreshes | 🔴 RED | |
| Clear session and redirect on logout | 🔴 RED | |
| Show user email/avatar when logged in | 🔴 RED | |

### AC3: Protected Routes
| Test | Status | Notes |
|------|--------|-------|
| Redirect /generate to /login when unauthenticated | 🔴 RED | |
| Redirect /library to /login when unauthenticated | 🔴 RED | |
| Allow access to /generate when authenticated | 🔴 RED | |
| Allow access to /library when authenticated | 🔴 RED | |

### Edge Cases
| Test | Status | Notes |
|------|--------|-------|
| Handle expired sessions gracefully | 🔴 RED | |
| Handle network errors during auth | 🔴 RED | |
| Handle Supabase service unavailable | 🔴 RED | |

---

## Generate Journey (Story 7-3)

### AC1: URL Input & Generation
| Test | Status | Notes |
|------|--------|-------|
| Display URL input when authenticated | 🔴 RED | |
| Display voice selector when authenticated | 🔴 RED | |
| Show generate button | 🔴 RED | |
| Disable button when URL is empty | 🔴 RED | |
| Validate URL format | 🔴 RED | |
| Enable button with valid URL | 🔴 RED | |
| Show loading during generation | 🔴 RED | |
| Show player after successful generation | 🔴 RED | |
| Show error on generation failure | 🔴 RED | |

### AC2: Audio Playback
| Test | Status | Notes |
|------|--------|-------|
| Play/pause button in player | 🔴 RED | |
| Progress/seek bar in player | 🔴 RED | |
| Display article title in player | 🔴 RED | |
| View in Library link after generation | 🔴 RED | |
| Generate Another button after generation | 🔴 RED | |

### Free User Limits
| Test | Status | Notes |
|------|--------|-------|
| Display remaining generations for free users | 🔴 RED | |
| Show upgrade prompt at limit | 🔴 RED | |
| Disable generate at limit | 🔴 RED | |
| No limit banner for pro users | 🔴 RED | |

### Error Recovery
| Test | Status | Notes |
|------|--------|-------|
| Handle rate limit (429) | 🔴 RED | |
| Handle network errors | 🔴 RED | |

---

## Library Journey (Story 7-3)

### AC3: Library View
| Test | Status | Notes |
|------|--------|-------|
| Display library heading when authenticated | 🔴 RED | |
| Display empty state when library empty | 🔴 RED | |
| Display link to generate when empty | 🔴 RED | |
| Display library items with titles | 🔴 RED | |
| Display item count | 🔴 RED | |
| Display duration for each item | 🔴 RED | |
| Have play button for each item | 🔴 RED | |
| Show player when item selected | 🔴 RED | |
| Show progress bar for partially played | 🔴 RED | |
| Show 'Played' indicator for completed | 🔴 RED | |

### Library Actions
| Test | Status | Notes |
|------|--------|-------|
| Delete button for items | 🔴 RED | |
| Remove item from list when deleted | 🔴 RED | |
| Add New button linking to generate | 🔴 RED | |

### Error Handling
| Test | Status | Notes |
|------|--------|-------|
| Handle API errors gracefully | 🔴 RED | |
| Redirect to login on session expiry | 🔴 RED | |

---

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific journey
npm run test:e2e -- --grep "Authentication Journey"
npm run test:e2e -- --grep "Generate Journey"
npm run test:e2e -- --grep "Library Journey"

# Run with UI for debugging
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed
```

## Next Steps (TDD Red-Green-Refactor)

1. **RED Phase (Current)**: All tests are written and expected to fail
2. **GREEN Phase**: Implement features to make tests pass
3. **REFACTOR Phase**: Clean up code while keeping tests green

### Implementation Priority

1. **Authentication Flow** - Foundation for all other features
   - Login form component
   - Session management with Supabase SSR
   - Protected route middleware

2. **Generate Flow** - Core value proposition
   - URL input with validation
   - Voice selector component
   - Generate API integration
   - Audio player component

3. **Library Flow** - User retention
   - Library list component
   - Item cards with playback state
   - Delete functionality

## Acceptance Criteria Mapping

| AC | Story | Test File | Coverage |
|----|-------|-----------|----------|
| AC1: Login Form | 7-2 | auth-journey.spec.ts | ✅ Complete |
| AC2: Session | 7-2 | auth-journey.spec.ts | ✅ Complete |
| AC3: Protected Routes | 7-2 | auth-journey.spec.ts | ✅ Complete |
| AC1: URL Input | 7-3 | generate-journey.spec.ts | ✅ Complete |
| AC2: Audio Playback | 7-3 | generate-journey.spec.ts | ✅ Complete |
| AC3: Library View | 7-3 | library-journey.spec.ts | ✅ Complete |
