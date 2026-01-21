# Story 7.6: Admin Panel - Content Moderation

Status: done

## Story

As an admin,
I want to review reported URLs and moderate content,
So that I can improve parsing and handle problematic content.

## Acceptance Criteria

1. **AC1: Reports List**
   - Given admin views reports
   - When extraction_reports list loads
   - Then they see failed URLs with: URL, error type, report date, user
   - And can sort by date or frequency

2. **AC2: Report Details**
   - Given admin reviews a report
   - When they click on a report
   - Then they see full error details
   - And can attempt to reproduce the extraction
   - And can mark as: fixed, won't fix, duplicate

3. **AC3: Content Flags**
   - Given admin wants to manage content flags
   - When content is flagged
   - Then they can review flagged items
   - And take action: remove, approve, warn user

4. **AC4: Duplicate Grouping**
   - Given multiple users report same URL
   - When admin views reports
   - Then duplicates are grouped
   - And frequency count is shown

## Tasks / Subtasks

### Task 1: Reports Page (AC: 1, 4)
- [x] 1.1 Create `app/admin/reports/page.tsx`
- [x] 1.2 Display reports list with sorting
- [x] 1.3 Group by normalized URL
- [x] 1.4 Show report count per URL

### Task 2: Report Actions (AC: 2)
- [x] 2.1 Implement report detail view
- [x] 2.2 Add status update actions (fixed, wont_fix)
- [x] 2.3 Create test extraction button

### Task 3: Content Moderation (AC: 3)
- [x] 3.1 Create `app/admin/moderation/page.tsx`
- [x] 3.2 Display flagged content list
- [x] 3.3 Implement moderation actions

## Dev Notes

- Reports from extraction_reports table
- Status field: pending, fixed, wont_fix, duplicate
- Content flags for inappropriate content handling

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
