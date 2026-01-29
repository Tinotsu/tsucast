# Story 7.9: Free Content Admin Management

Status: done

## Story

As an admin,
I want to manage free curated content (create, edit, delete),
So that I can keep the Explore tab fresh and relevant.

## Acceptance Criteria

1. **AC1: View All Content**
   - Given admin navigates to Free Content admin page
   - When page loads
   - Then they see all free content items with status indicators
   - And items show title, voice, status, duration, created date

2. **AC2: Create New Content**
   - Given admin wants to add new content
   - When they fill the form (title, URL or text, voice)
   - Then content is created with "processing" status
   - And TTS generation runs in background
   - And page polls for status updates

3. **AC3: Edit Content Title**
   - Given admin wants to update a content item's title
   - When they click edit and modify the title
   - Then changes are saved immediately
   - And list updates without refresh

4. **AC4: Delete Content**
   - Given admin wants to remove content
   - When they click delete and confirm
   - Then item is removed from list
   - And item no longer appears in public Explore tab

## Tasks / Subtasks

### Task 1: Admin List View (AC: 1)
- [x] 1.1 Create `/app/admin/free-content/page.tsx` - DONE (existed)
- [x] 1.2 Display table with all content items
- [x] 1.3 Show status with colored badges
- [x] 1.4 Show duration, word count, created date

### Task 2: Create Content (AC: 2)
- [x] 2.1 Add form with title, URL/text toggle, voice selector - DONE (existed)
- [x] 2.2 POST to `/api/free-content/admin`
- [x] 2.3 Add item to list with processing status
- [x] 2.4 Implement polling for status updates

### Task 3: Edit Content (AC: 3)
- [x] 3.1 Add PATCH `/api/free-content/admin/:id` route
- [x] 3.2 Add `updateFreeContent` to service
- [x] 3.3 Add `updateAdminFreeContent` to admin-api.ts
- [x] 3.4 Add inline edit mode in UI (click pencil → edit field → save/cancel)
- [x] 3.5 Handle Enter/Escape keyboard shortcuts

### Task 4: Delete Content (AC: 4)
- [x] 4.1 DELETE `/api/free-content/admin/:id` - DONE (existed)
- [x] 4.2 Confirmation dialog before delete
- [x] 4.3 Remove from list on success

### Task 5: Testing (AC: all)
- [x] 5.1 Existing API integration tests pass
- [ ] 5.2 Add E2E tests for admin CRUD - Deferred
- [ ] 5.3 Drag-to-reorder - SKIPPED (out of scope for MVP)

## Dev Notes

- Edit is inline - click pencil icon, edit title, press Enter or click checkmark
- Escape cancels edit
- Delete has browser confirm dialog
- Drag-to-reorder skipped for MVP (requires dnd library and order column)
- Polling auto-stops after 5 minutes if still processing

## Technical References

- API routes: `apps/api/src/routes/free-content.ts`
- Service: `apps/api/src/services/free-content.ts`
- Admin API client: `apps/web/lib/admin-api.ts`

## FR Mapping

- FR64: Admin can create/edit/delete free content

## Dependencies

- Story 7.8 (Explore Tab) - displays the content ✅

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [ ] Code review complete
