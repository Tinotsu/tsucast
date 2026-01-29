# Story 11.2: Landing Page Header & Night Mode

Status: completed

## Story

As a visitor to tsucast,
I want a minimal header with night mode toggle,
So that I can navigate easily and switch to dark theme for comfortable viewing.

## Acceptance Criteria

1. **AC1: Header Layout**
   - Given visitor is on landing page
   - When page loads
   - Then header shows: Logo, Pricing link, Sign In link, Night mode toggle
   - And header is sticky on scroll with backdrop blur

2. **AC2: Mobile Header**
   - Given visitor is on mobile (< 768px)
   - When page loads
   - Then hamburger menu icon is visible
   - And desktop nav items are hidden
   - And clicking hamburger opens mobile menu

3. **AC3: Night Mode Toggle**
   - Given visitor clicks night mode toggle
   - When toggle is activated
   - Then entire page switches to dark theme
   - And all sections have appropriate dark colors

4. **AC4: Night Mode Persistence**
   - Given visitor enables night mode
   - When they reload the page
   - Then night mode preference is preserved from localStorage
   - And theme matches their preference

5. **AC5: Smooth Transitions**
   - Given visitor toggles night mode
   - When theme changes
   - Then colors transition smoothly (300ms)
   - And no jarring flash occurs

## Tasks / Subtasks

### Task 1: Header Component (AC: 1, 2)
- [x] 1.1 Refactor `components/landing/Header.tsx` with new design
- [x] 1.2 Add `data-testid="desktop-nav"` for desktop navigation
- [x] 1.3 Add `data-testid="mobile-menu-toggle"` for hamburger button
- [x] 1.4 Add `data-testid="mobile-menu"` for mobile nav drawer
- [x] 1.5 Implement sticky header with backdrop blur
- [x] 1.6 Add Pricing anchor link (`data-testid="nav-pricing"`)

### Task 2: Night Mode Implementation (AC: 3, 4, 5)
- [x] 2.1 Create `useTheme` hook with localStorage persistence
- [x] 2.2 Add `data-testid="night-mode-toggle"` button
- [x] 2.3 Implement dark mode CSS variables/classes
- [x] 2.4 Add `dark` class to `<html>` element on toggle
- [x] 2.5 Add smooth transitions for color changes (300ms)
- [x] 2.6 Respect `prefers-color-scheme` as default

### Task 3: Testing (AC: all)
- [ ] 3.1 Run E2E tests: LP-NIGHT-001, LP-NIGHT-002
- [ ] 3.2 Run E2E tests: LP-RESP-002 (mobile hamburger)
- [x] 3.3 Updated all landing components for dark mode support

## Dev Notes

- Night mode uses Tailwind `dark:` variant
- Store preference in `localStorage.setItem('theme', 'dark')`
- Check `prefers-color-scheme: dark` on first load if no stored preference
- Header z-index should be highest (z-50)

## Test Coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| LP-NIGHT-001 | Toggle switches theme | ❌ |
| LP-NIGHT-002 | Persists on reload | ❌ |
| LP-RESP-002 | Mobile hamburger menu | ❌ |
| LP-HDR-004 | Pricing anchor scroll | ❌ |

## Story Wrap-up

- [ ] Night mode tests pass
- [ ] Mobile responsive tests pass
- [ ] Visual verification in light and dark
- [ ] Code review complete
