# Story 7.8: Explore Tab with Free Content

Status: done

## Story

As a web user browsing the library,
I want to discover free curated content in an Explore tab,
So that I can try tsucast without generating my own content.

## Acceptance Criteria

1. **AC1: Tab Navigation**
   - Given user navigates to Library page
   - When the page loads
   - Then they see two tabs: My Library / Explore
   - And current tab is highlighted

2. **AC2: Explore Content Display**
   - Given user views Explore tab
   - When content loads
   - Then they see featured items with title, duration, and play button
   - And items are displayed in a grid

3. **AC3: Playback Integration**
   - Given user taps play on an Explore item
   - When playback starts
   - Then audio plays using the global player
   - And mini-player appears

4. **AC4: Unauthenticated Access**
   - Given user is not logged in
   - When they visit Explore tab
   - Then content is still visible and playable
   - And they see prompt to sign up for more features

## Tasks / Subtasks

### Task 1: Tab UI (AC: 1)
- [x] 1.1 Add tabs to `app/(app)/library/page.tsx`: My Library / Explore
- [x] 1.2 Implement tab switching with URL state (`?tab=explore`)
- [x] 1.3 Style active tab indicator
- [x] 1.4 Preserve tab state on navigation

### Task 2: Explore Tab Component (AC: 2)
- [x] 2.1 Create `components/library/ExploreTab.tsx`
- [x] 2.2 Display items with title, duration, word count
- [x] 2.3 Create grid layout for items
- [x] 2.4 Add loading skeleton for Explore tab
- [x] 2.5 Add empty state when no content

### Task 3: API Integration (AC: 2, 4)
- [x] 3.1 Use existing `GET /api/free-content` endpoint (public, no auth required)
- [x] 3.2 Use existing `getFreeContent` from lib/api.ts
- [x] 3.3 Display items from API response

### Task 4: Playback (AC: 3)
- [x] 4.1 Wire play button to global AudioService
- [x] 4.2 Pass correct metadata for Media Session
- [x] 4.3 Handle play state UI (show pause when playing)

### Task 5: Unauthenticated Experience (AC: 4)
- [x] 5.1 Allow unauthenticated access to `/library?tab=explore`
- [x] 5.2 Add sign-up prompt banner for unauthenticated users
- [x] 5.3 Style prompt as invitation, not wall

### Task 6: Testing (AC: all)
- [x] 6.1 Existing integration tests for `/api/free-content` pass
- [ ] 6.2 Write E2E tests for tab navigation - Deferred
- [ ] 6.3 Write E2E test for unauthenticated playback - Deferred

## Dev Notes

- Explore tab is public - no auth required
- Items come from `free_content` table
- Sign-up prompt is subtle, doesn't block content
- Play button shows loading state during audio load
- Uses global audio player from Story 7.7

## Technical References

- Global player: Story 7.7
- Admin management: Story 7.9
- API endpoint: `GET /api/free-content`

## FR Mapping

- FR63: Explore tab with free curated content

## Dependencies

- Story 7.7 (Global Persistent Audio Player) - for playback ✅
- Story 7.9 (Free Content Admin) - for content to exist ✅ (already implemented)

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [ ] Code review complete
