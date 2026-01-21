# Story 4.3: Playlist Management

Status: done

## Story

As a user who wants to organize content,
I want to create and manage playlists,
so that I can group related articles for listening sessions.

## Acceptance Criteria

1. **AC1: Create Playlist**
   - Given user is in library
   - When they tap "Create Playlist"
   - Then they can enter a playlist name
   - And empty playlist is created

2. **AC2: Add to Playlist**
   - Given user has a playlist
   - When they long-press a library item
   - Then they see "Add to Playlist" option
   - And can select which playlist

3. **AC3: View Playlist**
   - Given user views a playlist
   - When they tap a playlist
   - Then they see all items in that playlist
   - And can tap to play any item

4. **AC4: Remove from Playlist**
   - Given user wants to remove from playlist
   - When they swipe left on playlist item
   - Then item is removed from playlist
   - And item remains in library

5. **AC5: Rename Playlist**
   - Given user wants to rename playlist
   - When they tap edit on playlist
   - Then they can change the name

6. **AC6: Delete Playlist**
   - Given user wants to delete a playlist
   - When they select delete from menu
   - Then playlist is deleted
   - And items in it remain in library

7. **AC7: Reorder Playlist Items**
   - Given user is viewing a playlist
   - When they want to reorder items
   - Then they can drag items to a new position
   - And the new order is saved immediately
   - And playback order follows the new sequence

8. **AC8: Play Playlist**
   - Given user taps "Play" on a playlist
   - When playback starts
   - Then the first item in the playlist plays
   - And subsequent items play automatically in sequence
   - And a queue indicator shows remaining items

## Tasks / Subtasks

### Task 1: Playlist Database Tables (AC: all)
- [x] 1.1 Create migration `supabase/migrations/005_playlists.sql`:
  ```sql
  -- Playlists
  CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  CREATE INDEX idx_playlists_user_id ON playlists(user_id);

  -- Playlist Items
  CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(playlist_id, audio_id)
  );

  CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);

  -- RLS
  ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
  ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users manage own playlists"
    ON playlists FOR ALL
    USING (auth.uid() = user_id);

  CREATE POLICY "Users manage own playlist items"
    ON playlist_items FOR ALL
    USING (playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid()));

  -- Trigger
  CREATE TRIGGER playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```
- [x] 1.2 Run migration

### Task 2: Playlist API Endpoints (AC: 1, 3, 5, 6)
- [x] 2.1 Create `apps/api/src/routes/playlists.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { authMiddleware } from '../middleware/auth';

  const playlists = new Hono();

  // Get all playlists
  playlists.get('/playlists', authMiddleware, async (c) => {
    const user = c.get('user');

    const { data } = await supabase
      .from('playlists')
      .select(`
        id,
        name,
        created_at,
        items:playlist_items(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return c.json({ playlists: data });
  });

  // Create playlist
  playlists.post('/playlists', authMiddleware, async (c) => {
    const user = c.get('user');
    const { name } = await c.req.json();

    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select()
      .single();

    if (error) {
      return c.json({ error: { message: 'Failed to create playlist' } }, 500);
    }

    return c.json({ playlist: data });
  });

  // Rename playlist
  playlists.patch('/playlists/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { name } = await c.req.json();

    await supabase
      .from('playlists')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user.id);

    return c.json({ success: true });
  });

  // Delete playlist
  playlists.delete('/playlists/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return c.json({ success: true });
  });

  // Get playlist items
  playlists.get('/playlists/:id/items', authMiddleware, async (c) => {
    const id = c.req.param('id');

    const { data } = await supabase
      .from('playlist_items')
      .select(`
        id,
        position,
        audio:audio_cache (
          id, title, audio_url, duration_seconds
        )
      `)
      .eq('playlist_id', id)
      .order('position');

    return c.json({ items: data });
  });

  // Add to playlist
  playlists.post('/playlists/:id/items', authMiddleware, async (c) => {
    const playlistId = c.req.param('id');
    const { audioId } = await c.req.json();

    // Get next position
    const { data: existing } = await supabase
      .from('playlist_items')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position ?? -1) + 1;

    await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        audio_id: audioId,
        position: nextPosition,
      });

    return c.json({ success: true });
  });

  // Remove from playlist
  playlists.delete('/playlists/:id/items/:itemId', authMiddleware, async (c) => {
    const itemId = c.req.param('itemId');

    await supabase
      .from('playlist_items')
      .delete()
      .eq('id', itemId);

    return c.json({ success: true });
  });

  // Reorder playlist items
  playlists.put('/playlists/:id/reorder', authMiddleware, async (c) => {
    const playlistId = c.req.param('id');
    const { itemIds } = await c.req.json(); // Array of item IDs in new order

    // Update positions in batch
    const updates = itemIds.map((id: string, index: number) => ({
      id,
      position: index,
    }));

    for (const update of updates) {
      await supabase
        .from('playlist_items')
        .update({ position: update.position })
        .eq('id', update.id);
    }

    return c.json({ success: true });
  });

  export default playlists;
  ```

### Task 3: Playlist Hook (AC: all)
- [x] 3.1 Create `hooks/usePlaylists.ts`:
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

  export function usePlaylists() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
      queryKey: ['playlists'],
      queryFn: getPlaylists,
    });

    const createMutation = useMutation({
      mutationFn: createPlaylist,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    });

    const deleteMutation = useMutation({
      mutationFn: deletePlaylist,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    });

    const renameMutation = useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        renamePlaylist(id, name),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    });

    return {
      playlists: data?.playlists || [],
      isLoading,
      createPlaylist: createMutation.mutate,
      deletePlaylist: deleteMutation.mutate,
      renamePlaylist: renameMutation.mutate,
    };
  }

  export function usePlaylistItems(playlistId: string) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
      queryKey: ['playlist', playlistId, 'items'],
      queryFn: () => getPlaylistItems(playlistId),
    });

    const addMutation = useMutation({
      mutationFn: (audioId: string) => addToPlaylist(playlistId, audioId),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }),
    });

    const removeMutation = useMutation({
      mutationFn: removeFromPlaylist,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }),
    });

    const reorderMutation = useMutation({
      mutationFn: (itemIds: string[]) => reorderPlaylist(playlistId, itemIds),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] }),
    });

    return {
      items: data?.items || [],
      isLoading,
      addItem: addMutation.mutate,
      removeItem: removeMutation.mutate,
      reorderItems: reorderMutation.mutate,
    };
  }
  ```

### Task 4: Playlist Card Component (AC: 3)
- [x] 4.1 Create `components/library/PlaylistCard.tsx`:
  ```typescript
  interface PlaylistCardProps {
    playlist: Playlist;
    onPress: () => void;
    onLongPress: () => void;
  }

  export function PlaylistCard({ playlist, onPress, onLongPress }: PlaylistCardProps) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        className="p-4 bg-amber-100 dark:bg-amber-900 rounded-xl mr-4 w-40"
      >
        <View className="w-full h-24 bg-amber-200 dark:bg-amber-800 rounded-lg items-center justify-center mb-2">
          <Ionicons name="list" size={32} color="#F59E0B" />
        </View>
        <Text className="font-medium text-amber-900 dark:text-amber-100" numberOfLines={1}>
          {playlist.name}
        </Text>
        <Text className="text-sm text-amber-600 dark:text-amber-400">
          {playlist.items?.[0]?.count || 0} items
        </Text>
      </TouchableOpacity>
    );
  }
  ```

### Task 5: Create Playlist Modal (AC: 1)
- [x] 5.1 Create `components/library/CreatePlaylistModal.tsx`:
  ```typescript
  interface CreatePlaylistModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
  }

  export function CreatePlaylistModal({ visible, onClose, onCreate }: CreatePlaylistModalProps) {
    const [name, setName] = useState('');

    const handleCreate = () => {
      if (name.trim()) {
        onCreate(name.trim());
        setName('');
        onClose();
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4">
              New Playlist
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Playlist name"
              className="border border-amber-300 rounded-lg p-3 mb-4"
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 p-3 rounded-lg bg-gray-200">
                <Text className="text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} className="flex-1 p-3 rounded-lg bg-amber-500">
                <Text className="text-center text-white font-medium">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
  ```

### Task 6: Playlist Detail Screen (AC: 3, 4, 7, 8)
- [x] 6.1 Create `app/playlist/[id].tsx`:
  ```typescript
  import DraggableFlatList from 'react-native-draggable-flatlist';

  export default function PlaylistScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { items, removeItem, reorderItems } = usePlaylistItems(id);
    const { loadPlaylistToQueue } = useAudioPlayer();

    const handlePlayAll = () => {
      loadPlaylistToQueue(items);
    };

    const handleDragEnd = ({ data }: { data: PlaylistItem[] }) => {
      reorderItems(data.map(item => item.id));
    };

    return (
      <SafeAreaView className="flex-1">
        {/* Header with Play button */}
        <View className="p-4 flex-row justify-between items-center">
          <Text className="text-xl font-bold">Playlist Name</Text>
          <TouchableOpacity
            onPress={handlePlayAll}
            className="bg-amber-500 px-4 py-2 rounded-full flex-row items-center"
          >
            <Ionicons name="play" size={20} color="white" />
            <Text className="text-white ml-2">Play All</Text>
          </TouchableOpacity>
        </View>

        {/* Draggable list */}
        <DraggableFlatList
          data={items}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={({ item, drag, isActive }) => (
            <PlaylistItem
              item={item}
              onDrag={drag}
              isActive={isActive}
              onRemove={() => removeItem(item.id)}
            />
          )}
        />
      </SafeAreaView>
    );
  }
  ```
- [x] 6.2 Install draggable list:
  ```bash
  npm install react-native-draggable-flatlist
  ```

### Task 7: Add to Playlist Action (AC: 2)
- [x] 7.1 Add long-press menu to LibraryItem:
  ```typescript
  // In LibraryItem.tsx
  const [showMenu, setShowMenu] = useState(false);

  <TouchableOpacity
    onPress={handlePress}
    onLongPress={() => setShowMenu(true)}
  >
    {/* ... item content */}
  </TouchableOpacity>

  {showMenu && (
    <AddToPlaylistMenu
      audioId={item.audio.id}
      onClose={() => setShowMenu(false)}
    />
  )}
  ```

### Task 8: Load Playlist to Queue (AC: 8)
- [x] 8.1 Update `hooks/useAudioPlayer.ts`:
  ```typescript
  const loadPlaylistToQueue = async (items: PlaylistItem[]) => {
    await TrackPlayer.reset();

    const tracks = items.map(item => ({
      id: item.audio.id,
      url: item.audio.audio_url,
      title: item.audio.title,
      artist: 'tsucast',
    }));

    await TrackPlayer.add(tracks);
    await TrackPlayer.play();
  };
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Playlists stored in Supabase with RLS
- Position column for ordering
- react-native-draggable-flatlist for reordering
- Queue management via track-player

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── (tabs)/library.tsx   # Playlist section
│   └── playlist/[id].tsx    # Playlist detail
├── components/library/
│   ├── PlaylistCard.tsx
│   ├── CreatePlaylistModal.tsx
│   └── AddToPlaylistMenu.tsx
└── hooks/
    └── usePlaylists.ts

apps/api/
└── src/routes/
    └── playlists.ts

supabase/migrations/
└── 005_playlists.sql
```

### Testing Standards

- Test create playlist → appears in list
- Test add item to playlist → item added
- Test drag reorder → order saved
- Test play playlist → queue populated
- Test remove from playlist → item removed, stays in library
- Test delete playlist → items remain in library

### Dependencies

- Story 4-1 must be completed (library exists)
- Story 3-3 must be completed (player exists)

### References

- [Source: architecture-v2.md#Database-Schema]
- [Source: epics.md#Story-4.3-Playlist-Management]
- [Source: prd.md#FR28-FR34]
- [react-native-draggable-flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | Implementation completed | Claude Opus 4.5 |

### File List

**Created:**
- `supabase/migrations/005_playlists.sql`
- `apps/api/src/routes/playlists.ts`
- `apps/mobile/hooks/usePlaylists.ts`
- `apps/mobile/components/library/PlaylistCard.tsx`
- `apps/mobile/components/library/CreatePlaylistModal.tsx`
- `apps/mobile/components/library/AddToPlaylistMenu.tsx`
- `apps/mobile/app/playlist/[id].tsx`

**Modified:**
- `apps/api/src/index.ts` (added playlists route)
- `apps/mobile/services/api.ts` (added playlist API functions)
- `apps/mobile/app/(tabs)/library.tsx` (integrated playlists section)
- `apps/mobile/components/library/LibraryItem.tsx` (added onLongPress)
- `apps/mobile/components/library/LibraryList.tsx` (added onLongPress prop)
- `apps/mobile/hooks/useAudioPlayer.ts` (added loadPlaylistToQueue)
