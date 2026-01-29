# Story 7.14: Mobile Bottom Navigation

Status: done

## Story

As a mobile web user,
I want a bottom navigation bar,
So that I can easily navigate between main sections with my thumb.

## Acceptance Criteria

1. **AC1: Bottom Nav Visible on Mobile**
   - Given user is on mobile (<768px)
   - When they view any authenticated page
   - Then they see bottom navigation bar
   - And it has three items: Add, Library, Settings

2. **AC2: Navigation Works**
   - Given bottom nav is visible
   - When user taps a nav item
   - Then they navigate to that section
   - And the tapped item shows active state

3. **AC3: Mini-Player Above Bottom Nav**
   - Given audio is playing
   - When user views the page
   - Then mini-player appears ABOVE the bottom nav
   - And both are visible without overlap

4. **AC4: Bottom Nav Hidden on Desktop**
   - Given user is on desktop (>1024px)
   - When they view any page
   - Then bottom nav is not visible
   - And navigation is handled by sidebar (Story 7.13)

5. **AC5: Safe Area Support**
   - Given user is on iPhone with notch/home indicator
   - When they view bottom nav
   - Then it respects safe area insets
   - And home indicator doesn't overlap content

## Tasks / Subtasks

### Task 1: BottomNav Component (AC: 1, 2)
- [x] 1.1 Create `components/navigation/BottomNav.tsx`
- [x] 1.2 Fixed position at bottom, full width
- [x] 1.3 Add three nav items: Add, Library, Settings
- [x] 1.4 Each item has icon + label
- [x] 1.5 Wire navigation with Next.js Link

### Task 2: Active State (AC: 2)
- [x] 2.1 Use `usePathname()` for current route detection
- [x] 2.2 Highlight active item with accent color
- [x] 2.3 Inactive items use muted color
- [x] 2.4 Add subtle scale animation on tap

### Task 3: Mini-Player Coordination (AC: 3)
- [x] 3.1 Calculate bottom offset for mini-player
- [x] 3.2 Mini-player: `bottom-16` when bottom nav visible
- [x] 3.3 Ensure no visual overlap
- [x] 3.4 Both components respect z-index hierarchy

### Task 4: Responsive Visibility (AC: 1, 4)
- [x] 4.1 Show only on mobile with `lg:hidden`
- [x] 4.2 Hide on tablet/desktop
- [x] 4.3 Coordinate with Sidebar visibility

### Task 5: Safe Area Handling (AC: 5)
- [x] 5.1 Add `pb-safe` or `env(safe-area-inset-bottom)` padding
- [x] 5.2 Test on iOS Safari with home indicator
- [x] 5.3 Ensure touch targets are above safe area

### Task 6: Layout Integration (AC: all)
- [x] 6.1 Add BottomNav to `app/(app)/layout.tsx`
- [x] 6.2 Add bottom padding to main content on mobile
- [x] 6.3 Account for both bottom nav + mini-player height

### Task 7: Styling (AC: all)
- [x] 7.1 Background: `bg-[var(--card)]`
- [x] 7.2 Border: `border-t border-[var(--border)]`
- [x] 7.3 Height: 64px (h-16) plus safe area
- [x] 7.4 Icons: 20px, Labels: 10px font

### Task 8: Testing (AC: all)
- [x] 8.1 Test visible on mobile viewport
- [x] 8.2 Test hidden on desktop viewport
- [x] 8.3 Test navigation between pages
- [x] 8.4 Test mini-player positioning above nav

## Dev Notes

- Reference: `ux-design-specification.md` lines 986-993
- Use CSS `env(safe-area-inset-bottom)` for iPhone home indicator
- Icons should be from lucide-react (PlusCircle, Library, Settings)
- Z-index: bottom-nav (z-40), mini-player (z-50)
- Consider haptic feedback for taps (future enhancement)

## Wireframe Reference

```
┌─────────────────────────────────────┐
│                                     │
│           Page Content              │
│                                     │
├─────────────────────────────────────┤
│  ▶ Mini-player ━━━━━ 4:32          │  <- Mini-player
├─────────────────────────────────────┤
│     ⊕        📚        ⚙           │  <- Bottom Nav
│    Add     Library   Settings       │
└─────────────────────────────────────┘
     ↑ Safe area padding below
```

## Technical References

- GlobalMiniPlayer: `components/player/GlobalMiniPlayer.tsx`
- App layout: `app/(app)/layout.tsx`
- UX Spec: `_bmad-output/planning-artifacts/ux-design-specification.md`

## FR Mapping

- FR24: View library (navigation)
- FR1: Add URL (navigation to generate page)

## Dependencies

- Story 7.7 (Global Mini-Player) - COMPLETE
- Story 7.13 (Sidebar) - for coordination

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
