# Story 4.1: Library View

Status: ready-for-dev

## Story

As a user with multiple generated podcasts,
I want to see my library,
so that I can find and play past articles.

## Acceptance Criteria

1. **AC1: Library List Display**
   - Given user navigates to Library tab
   - When library loads
   - Then they see a list of generated podcasts
   - And each item shows: title, duration, date added
   - And playback progress indicator (if partially played)

2. **AC2: Play from Library**
   - Given user taps a library item
   - When item is selected
   - Then player opens with that item
   - And playback starts from saved position (or beginning if new)

3. **AC3: Delete from Library**
   - Given user swipes left on an item
   - When they confirm deletion
   - Then item is removed from their library
   - And audio remains in cache for other users (if public)

4. **AC4: Performance**
   - Given library has 100+ items
   - When user scrolls
   - Then list scrolls smoothly
   - And loads in < 2 seconds

## Tasks / Subtasks

### Task 1: User Library Database Table (AC: all)
- [ ] 1.1 Create migration `supabase/migrations/004_user_library.sql`:
  ```sql
  CREATE TABLE user_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    audio_id UUID NOT NULL REFERENCES audio_cache(id) ON DELETE CASCADE,
    playback_position INTEGER DEFAULT 0,  -- seconds
    is_played BOOLEAN DEFAULT false,
    added_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, audio_id)
  );

  CREATE INDEX idx_user_library_user_id ON user_library(user_id);
  CREATE INDEX idx_user_library_added_at ON user_library(user_id, added_at DESC);

  -- RLS policies
  ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage own library"
    ON user_library FOR ALL
    USING (auth.uid() = user_id);

  -- Trigger for updated_at
  CREATE TRIGGER user_library_updated_at
    BEFORE UPDATE ON user_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```
- [ ] 1.2 Run migration

### Task 2: Library API Endpoints (AC: 1, 3)
- [ ] 2.1 Create `apps/api/src/routes/library.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { authMiddleware } from '../middleware/auth';
  import { supabase } from '../services/supabase';

  const library = new Hono();

  // Get user's library
  library.get('/library', authMiddleware, async (c) => {
    const user = c.get('user');

    const { data, error } = await supabase
      .from('user_library')
      .select(`
        id,
        playback_position,
        is_played,
        added_at,
        audio:audio_cache (
          id,
          title,
          audio_url,
          duration_seconds,
          word_count,
          original_url
        )
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    if (error) {
      return c.json({ error: { code: 'FETCH_FAILED', message: 'Failed to load library' } }, 500);
    }

    return c.json({ items: data });
  });

  // Delete from library
  library.delete('/library/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const { error } = await supabase
      .from('user_library')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return c.json({ error: { code: 'DELETE_FAILED', message: 'Failed to delete' } }, 500);
    }

    return c.json({ success: true });
  });

  export default library;
  ```
- [ ] 2.2 Register route in main app

### Task 3: Library Hook (AC: 1, 2, 3)
- [ ] 3.1 Create `hooks/useLibrary.ts`:
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { getLibrary, deleteFromLibrary } from '@/services/api';

  export function useLibrary() {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
      queryKey: ['library'],
      queryFn: getLibrary,
    });

    const deleteMutation = useMutation({
      mutationFn: deleteFromLibrary,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['library'] });
      },
    });

    return {
      items: data?.items || [],
      isLoading,
      error,
      refetch,
      deleteItem: deleteMutation.mutate,
      isDeleting: deleteMutation.isPending,
    };
  }
  ```
- [ ] 3.2 Install React Query:
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] 3.3 Set up QueryClient provider in `app/_layout.tsx`

### Task 4: Library Screen (AC: 1, 4)
- [ ] 4.1 Create `app/(tabs)/library.tsx`:
  ```typescript
  import { useLibrary } from '@/hooks/useLibrary';
  import { LibraryList } from '@/components/library/LibraryList';
  import { LibrarySkeleton } from '@/components/library/LibrarySkeleton';

  export default function LibraryScreen() {
    const { items, isLoading, error, refetch, deleteItem } = useLibrary();

    if (isLoading) {
      return <LibrarySkeleton />;
    }

    if (error) {
      return (
        <View className="flex-1 items-center justify-center">
          <Text>Failed to load library</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Text className="text-amber-500">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-8">
          <Ionicons name="library-outline" size={64} color="#D97706" />
          <Text className="mt-4 text-lg text-amber-900 dark:text-amber-100">
            Your library is empty
          </Text>
          <Text className="mt-2 text-amber-700 dark:text-amber-300 text-center">
            Paste a URL on the Add tab to generate your first podcast
          </Text>
        </View>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
        <LibraryList
          items={items}
          onDelete={deleteItem}
        />
      </SafeAreaView>
    );
  }
  ```

### Task 5: Library List Component (AC: 1, 4)
- [ ] 5.1 Create `components/library/LibraryList.tsx`:
  ```typescript
  import { FlashList } from '@shopify/flash-list';
  import { LibraryItem } from './LibraryItem';

  interface LibraryListProps {
    items: LibraryItemData[];
    onDelete: (id: string) => void;
  }

  export function LibraryList({ items, onDelete }: LibraryListProps) {
    return (
      <FlashList
        data={items}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            onDelete={() => onDelete(item.id)}
          />
        )}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
      />
    );
  }
  ```
- [ ] 5.2 Install FlashList for performance:
  ```bash
  npx expo install @shopify/flash-list
  ```

### Task 6: Library Item Component (AC: 1, 2, 3)
- [ ] 6.1 Create `components/library/LibraryItem.tsx`:
  ```typescript
  import Swipeable from 'react-native-gesture-handler/Swipeable';
  import { router } from 'expo-router';

  interface LibraryItemProps {
    item: LibraryItemData;
    onDelete: () => void;
  }

  export function LibraryItem({ item, onDelete }: LibraryItemProps) {
    const progress = item.audio.duration_seconds > 0
      ? (item.playback_position / item.audio.duration_seconds) * 100
      : 0;

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      return `${mins} min`;
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString();
    };

    const handlePress = () => {
      router.push(`/player/${item.audio.id}`);
    };

    const renderRightActions = () => (
      <TouchableOpacity
        onPress={onDelete}
        className="bg-red-500 justify-center px-6"
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          onPress={handlePress}
          className="flex-row p-4 bg-cream dark:bg-deep-brown border-b border-amber-200 dark:border-amber-800"
        >
          {/* Progress indicator */}
          <View className="w-1 rounded-full bg-amber-200 dark:bg-amber-800 mr-3">
            <View
              className="w-full bg-amber-500 rounded-full"
              style={{ height: `${progress}%` }}
            />
          </View>

          <View className="flex-1">
            <Text
              className="text-base font-medium text-amber-900 dark:text-amber-100"
              numberOfLines={2}
            >
              {item.audio.title}
            </Text>
            <View className="flex-row mt-1">
              <Text className="text-sm text-amber-600 dark:text-amber-400">
                {formatDuration(item.audio.duration_seconds)}
              </Text>
              <Text className="text-sm text-amber-500 mx-2">•</Text>
              <Text className="text-sm text-amber-600 dark:text-amber-400">
                {formatDate(item.added_at)}
              </Text>
              {item.is_played && (
                <>
                  <Text className="text-sm text-amber-500 mx-2">•</Text>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                </>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#92400E" />
        </TouchableOpacity>
      </Swipeable>
    );
  }
  ```
- [ ] 6.2 Install gesture handler:
  ```bash
  npx expo install react-native-gesture-handler
  ```

### Task 7: Navigate to Player with Saved Position (AC: 2)
- [ ] 7.1 Update player to load from library position:
  ```typescript
  // In useAudioPlayer.ts
  const loadFromLibrary = async (libraryItem: LibraryItemData) => {
    await loadTrack({
      id: libraryItem.audio.id,
      audioUrl: libraryItem.audio.audio_url,
      title: libraryItem.audio.title,
    });

    // Seek to saved position
    if (libraryItem.playback_position > 0) {
      await TrackPlayer.seekTo(libraryItem.playback_position);
    }
  };
  ```

### Task 8: Add Tab Navigation (AC: 1)
- [ ] 8.1 Update `app/(tabs)/_layout.tsx` with library tab:
  ```typescript
  <Tabs>
    <Tabs.Screen
      name="index"
      options={{
        title: 'Add',
        tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
      }}
    />
    <Tabs.Screen
      name="library"
      options={{
        title: 'Library',
        tabBarIcon: ({ color }) => <Ionicons name="library" size={24} color={color} />,
      }}
    />
  </Tabs>
  ```

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- user_library table with RLS
- Joins to audio_cache for content details
- FlashList for performant long lists
- React Query for caching and state

**From UX Design Specification:**
- Library tab is one of 3.5 screens
- Progress indicator for partially played items
- Swipe-to-delete pattern
- < 2 seconds load time for 100 items

### Source Tree Components

```
apps/mobile/
├── app/(tabs)/
│   ├── _layout.tsx          # Tab navigation
│   └── library.tsx          # Library screen
├── components/library/
│   ├── LibraryList.tsx      # FlashList wrapper
│   ├── LibraryItem.tsx      # Individual item
│   └── LibrarySkeleton.tsx  # Loading state
└── hooks/
    └── useLibrary.ts        # Data fetching

apps/api/
└── src/routes/
    └── library.ts           # GET, DELETE endpoints

supabase/migrations/
└── 004_user_library.sql
```

### Testing Standards

- Test library load → items displayed
- Test empty library → empty state shown
- Test tap item → player opens at saved position
- Test swipe delete → item removed
- Test 100+ items → smooth scrolling
- Test pull-to-refresh → data reloaded

### Key Technical Decisions

1. **FlashList:** 60 FPS scrolling for large lists
2. **React Query:** Caching, background refresh, optimistic updates
3. **Swipeable:** Native gesture for delete (familiar pattern)
4. **Progress Bar:** Visual progress indicator per item

### Dependencies

- Story 3-2 must be completed (audio in library)
- Story 3-3 must be completed (player exists)

### References

- [Source: architecture-v2.md#Database-Schema]
- [Source: architecture-v2.md#API-Endpoints]
- [Source: ux-design-specification.md#Custom-Components]
- [Source: epics.md#Story-4.1-Library-View]
- [Source: prd.md#FR24-FR27]
- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [React Query Documentation](https://tanstack.com/query)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
