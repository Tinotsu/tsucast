# Story 7.15: Playlists Feature (Web)

Status: done

## Story

As a web user who wants to organize content,
I want to create and manage playlists,
So that I can group related articles for focused listening sessions.

## Acceptance Criteria

1. **AC1: Playlists Tab in Library**
   - Given user is on Library page
   - When they view the tabs
   - Then they see: My Library | Playlists | Explore
   - And Playlists tab shows their playlists

2. **AC2: Create Playlist**
   - Given user is on Playlists tab
   - When they click "Create Playlist"
   - Then modal appears to enter playlist name
   - And new empty playlist is created

3. **AC3: Add to Playlist**
   - Given user is viewing their library
   - When they click menu on a library item
   - Then they see "Add to Playlist" option
   - And can select which playlist to add to

4. **AC4: View Playlist Contents**
   - Given user has a playlist with items
   - When they click on the playlist
   - Then they see all items in that playlist
   - And can play any item

5. **AC5: Remove from Playlist**
   - Given user is viewing a playlist
   - When they click remove on an item
   - Then item is removed from playlist
   - And item remains in their main library

6. **AC6: Play Entire Playlist**
   - Given user is viewing a playlist
   - When they click "Play All"
   - Then first item starts playing
   - And subsequent items auto-play in sequence

7. **AC7: Rename/Delete Playlist**
   - Given user is viewing a playlist
   - When they click edit
   - Then they can rename the playlist
   - When they click delete
   - Then playlist is deleted (items remain in library)

## Tasks / Subtasks

### Task 1: Database Schema (AC: all)
- [x] 1.1 Create `playlists` table migration
- [x] 1.2 Create `playlist_items` table migration
- [x] 1.3 Add RLS policies for user ownership
- [x] 1.4 Add position column for ordering

### Task 2: API Endpoints (AC: all)
- [x] 2.1 `GET /api/playlists` - list user's playlists
- [x] 2.2 `POST /api/playlists` - create playlist
- [x] 2.3 `GET /api/playlists/:id` - get playlist with items
- [x] 2.4 `PATCH /api/playlists/:id` - rename playlist
- [x] 2.5 `DELETE /api/playlists/:id` - delete playlist
- [x] 2.6 `POST /api/playlists/:id/items` - add item
- [x] 2.7 `DELETE /api/playlists/:id/items/:itemId` - remove item

### Task 3: Playlists Tab UI (AC: 1)
- [x] 3.1 Add "Playlists" tab to library page tabs
- [x] 3.2 Create `components/library/PlaylistsTab.tsx`
- [x] 3.3 Show grid of playlist cards
- [x] 3.4 Show item count and total duration per playlist

### Task 4: Create Playlist Flow (AC: 2)
- [x] 4.1 Add "Create Playlist" button
- [x] 4.2 Create modal for playlist name input
- [x] 4.3 Validate name (required, max length)
- [x] 4.4 Show new playlist in grid after creation

### Task 5: Add to Playlist Flow (AC: 3)
- [x] 5.1 Add context menu to library items
- [x] 5.2 Create "Add to Playlist" sub-menu
- [x] 5.3 List existing playlists to choose from
- [x] 5.4 Option to create new playlist inline
- [x] 5.5 Show confirmation toast on success

### Task 6: Playlist Detail View (AC: 4, 5)
- [x] 6.1 Create `app/(app)/playlist/[id]/page.tsx`
- [x] 6.2 Show playlist header with name, count, duration
- [x] 6.3 List items with play buttons
- [x] 6.4 Add remove button per item
- [x] 6.5 Empty state when no items

### Task 7: Play All Feature (AC: 6)
- [x] 7.1 Add "Play All" button to playlist header
- [x] 7.2 Queue all items in AudioService
- [x] 7.3 Start playback of first item
- [x] 7.4 Auto-advance to next item on complete

### Task 8: Rename/Delete (AC: 7)
- [x] 8.1 Add edit button to playlist header
- [x] 8.2 Inline rename or modal
- [x] 8.3 Delete with confirmation dialog
- [x] 8.4 Redirect to Playlists tab after delete

### Task 9: Testing (AC: all)
- [x] 9.1 Test CRUD operations for playlists
- [x] 9.2 Test add/remove items
- [x] 9.3 Test play all queues correctly
- [x] 9.4 Test RLS prevents cross-user access

## Dev Notes

- Reference: PRD FR28-34 (Playlists requirements)
- Mobile app has similar feature in Epic 4 Story 4.3
- Reuse API patterns from library endpoints
- Consider drag-to-reorder as future enhancement

## Database Schema

```sql
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  library_item_id UUID NOT NULL REFERENCES user_library(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, library_item_id)
);

-- RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own playlists" ON playlists
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own playlist items" ON playlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );
```

## Technical References

- Library page: `app/(app)/library/page.tsx`
- AudioService: `services/audio-service.ts`
- PRD: FR28-34

## FR Mapping

- FR28: Create playlists
- FR29: Add items to playlist
- FR30: Remove items from playlist
- FR31: Reorder items (future)
- FR32: Rename playlist
- FR33: Delete playlist
- FR34: Play entire playlist

## Dependencies

- Story 7.7 (Global Audio Player) - for queue functionality
- Story 7.3 (Web Library) - COMPLETE

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
