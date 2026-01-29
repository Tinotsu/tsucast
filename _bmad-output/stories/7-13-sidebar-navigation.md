# Story 7.13: Sidebar Navigation (Desktop)

Status: done

## Story

As a desktop web user,
I want a persistent sidebar navigation,
So that I can quickly access all sections of the app like Apple Podcasts or Spotify.

## Acceptance Criteria

1. **AC1: Sidebar Visible on Desktop**
   - Given user is on desktop (>1024px)
   - When they view any authenticated page
   - Then they see a fixed 240px sidebar on the left
   - And main content is offset to the right

2. **AC2: Navigation Items**
   - Given sidebar is visible
   - When user views navigation
   - Then they see: Logo, Add New (primary CTA), Library, Settings
   - And current page is highlighted
   - And icons accompany text labels

3. **AC3: Night Mode Toggle in Sidebar**
   - Given sidebar is visible
   - When user views bottom of sidebar
   - Then they see night mode toggle
   - And clicking it toggles theme immediately

4. **AC4: Sidebar Hidden on Mobile**
   - Given user is on mobile (<768px)
   - When they view any page
   - Then sidebar is not visible
   - And navigation is handled by bottom nav (Story 7.14)

5. **AC5: Active State Styling**
   - Given user is on Library page
   - When they view sidebar
   - Then Library item has active background color
   - And other items have default styling

## Tasks / Subtasks

### Task 1: Sidebar Component (AC: 1, 2)
- [x] 1.1 Create `components/navigation/Sidebar.tsx`
- [x] 1.2 Fixed position, 240px width, full height
- [x] 1.3 Add tsucast logo at top (links to /)
- [x] 1.4 Add "Add New" button with plus icon (primary style)
- [x] 1.5 Add Library nav item with icon
- [x] 1.6 Add Settings nav item with icon
- [x] 1.7 Add divider line between sections

### Task 2: Active State Logic (AC: 5)
- [x] 2.1 Use `usePathname()` from next/navigation
- [x] 2.2 Highlight active item with background color
- [x] 2.3 Apply `text-[var(--foreground)]` for active
- [x] 2.4 Apply `text-[var(--muted)]` for inactive

### Task 3: Night Mode Toggle (AC: 3)
- [x] 3.1 Add moon icon + "Night Mode" label at sidebar bottom
- [x] 3.2 Wire to existing `useTheme` hook
- [x] 3.3 Toggle between themes on click
- [x] 3.4 Show current theme state (sun/moon icon)

### Task 4: Layout Integration (AC: 1, 4)
- [x] 4.1 Update `app/(app)/layout.tsx` to include Sidebar
- [x] 4.2 Add `ml-60` (240px) offset to main content on desktop
- [x] 4.3 Use CSS media query or Tailwind `lg:` prefix
- [x] 4.4 Hide sidebar on mobile with `hidden lg:block`

### Task 5: Responsive Behavior (AC: 4)
- [x] 5.1 Sidebar hidden below 1024px breakpoint
- [x] 5.2 Main content takes full width on mobile
- [x] 5.3 No horizontal scroll when sidebar hidden

### Task 6: Styling (AC: all)
- [x] 6.1 Apply CSS variables for theme support
- [x] 6.2 Background: `bg-[var(--card)]`
- [x] 6.3 Border: `border-r border-[var(--border)]`
- [x] 6.4 Hover states on nav items

### Task 7: Testing (AC: all)
- [x] 7.1 Test sidebar visible on desktop viewport
- [x] 7.2 Test sidebar hidden on mobile viewport
- [x] 7.3 Test active state matches current route
- [x] 7.4 Test night mode toggle works

## Dev Notes

- Reference: `ux-design-specification.md` lines 646-676
- Use `usePathname()` hook for active state detection
- Sidebar should not scroll with content (fixed position)
- Z-index should be below modal (z-40) but above content
- Consider collapsible state for tablet (768-1024px) - future enhancement

## Wireframe Reference

```
┌──────────┬────────────────────────────────────────┐
│ SIDEBAR  │  MAIN CONTENT                          │
│ 240px    │                                        │
│          │                                        │
│ tsucast  │  Page content here...                  │
│          │                                        │
│ ⊕ Add    │                                        │
│ 📚 Library│                                        │
│ ⚙ Settings│                                        │
│          │                                        │
│          │                                        │
│          │                                        │
│ 🌙 Night │                                        │
└──────────┴────────────────────────────────────────┘
```

## Technical References

- Theme hook: `hooks/useTheme.ts`
- App layout: `app/(app)/layout.tsx`
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md`

## FR Mapping

- FR24: View library (navigation to)
- FR37: Log out (from settings, accessible via sidebar)
- FR64: Night mode toggle

## Dependencies

- Story 7.11 (Night Mode Toggle) - COMPLETE

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
