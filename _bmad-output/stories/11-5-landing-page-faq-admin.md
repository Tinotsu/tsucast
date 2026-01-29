# Story 11.5: Landing Page FAQ & Admin

Status: in-progress

## Story

As a visitor and admin,
I want an FAQ section on the landing page that admins can manage,
So that common questions are answered and content stays fresh.

## Acceptance Criteria

1. **AC1: FAQ Section Display**
   - Given FAQ items exist in database
   - When visitor views landing page
   - Then FAQ section shows "Frequently Asked Questions" heading
   - And questions are displayed in accordion format
   - And items are ordered by position field

2. **AC2: FAQ Accordion Interaction**
   - Given visitor sees FAQ section
   - When they click a question
   - Then answer expands with smooth animation (300ms)
   - And arrow icon rotates 180°
   - And clicking again collapses the answer

3. **AC3: Admin FAQ Management**
   - Given admin is logged in
   - When they navigate to `/admin/faq`
   - Then they see list of all FAQ items
   - And can add new questions
   - And can edit existing questions
   - And can delete questions
   - And can drag to reorder

4. **AC4: Admin Featured Toggle**
   - Given admin is on `/admin/free-content`
   - When they toggle "Featured" on an item
   - Then that item becomes the hero featured content
   - And any previously featured item is un-featured
   - And only one item can be featured at a time

## Tasks / Subtasks

### Task 1: FAQ Component (AC: 1, 2)
- [x] 1.1 Create `components/landing/FAQ.tsx`
- [x] 1.2 Add `data-testid="faq-section"` container
- [x] 1.3 Add `data-testid="faq-item"` for each item
- [x] 1.4 Add `data-testid="faq-question"` for question button
- [x] 1.5 Add `data-testid="faq-answer"` for answer content
- [x] 1.6 Fetch FAQ items from `/api/faq`
- [x] 1.7 Implement accordion expand/collapse
- [x] 1.8 Add height animation (300ms ease-out)
- [x] 1.9 Add arrow rotation on expand

### Task 2: Admin FAQ Page (AC: 3)
- [x] 2.1 Create `/admin/faq/page.tsx`
- [x] 2.2 List all FAQ items (published and unpublished)
- [x] 2.3 Add "Add Question" button
- [x] 2.4 Create FAQ item edit modal/form
- [x] 2.5 Implement delete with confirmation
- [x] 2.6 Implement drag-to-reorder (update position)
- [x] 2.7 Show published/unpublished toggle

### Task 3: Admin Featured Toggle (AC: 4)
- [x] 3.1 Add "Featured" toggle to free-content admin list
- [x] 3.2 Call `/api/free-content/admin/:id/featured` on toggle
- [x] 3.3 Show visual indicator for currently featured item (star icon)
- [x] 3.4 Optimistic update with rollback on error

### Task 4: Testing (AC: all)
- [ ] 4.1 Run E2E tests: LP-FAQ-001, LP-FAQ-002
- [ ] 4.2 Test admin FAQ CRUD manually
- [ ] 4.3 Test featured toggle constraint

## Dev Notes

- FAQ accordion uses CSS `grid-template-rows` for smooth height animation
- Admin FAQ uses same table styling as other admin pages
- Drag-to-reorder can use `@dnd-kit/core` or native HTML drag
- Featured toggle sends PATCH request, backend handles constraint

### Accordion Animation Pattern

```css
.faq-answer {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}

.faq-answer[data-expanded="true"] {
  grid-template-rows: 1fr;
}

.faq-answer > div {
  overflow: hidden;
}
```

## Test Coverage

| Test ID | Description | Status |
|---------|-------------|--------|
| LP-FAQ-001 | FAQ items load | ❌ |
| LP-FAQ-002 | Accordion expands | ❌ |
| API-ADMIN-001 | Admin FAQ create | ❌ |
| API-ADMIN-005 | Featured toggle constraint | ❌ |
| API-ADMIN-006 | Unauthorized access denied | ❌ |

## Story Wrap-up

- [ ] FAQ section tests pass
- [ ] Admin CRUD works
- [ ] Featured toggle works
- [ ] Accordion animation smooth
- [ ] Code review complete
