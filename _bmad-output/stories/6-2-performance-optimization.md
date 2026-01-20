# Story 6.2: Performance Optimization

Status: ready-for-dev

## Story

As a user,
I want the app to feel fast and responsive,
so that the experience is delightful.

## Acceptance Criteria

1. **AC1: App Launch Time**
   - Given user opens the app
   - When launch completes
   - Then app is interactive in under 3 seconds
   - And shows loading skeleton while data fetches

2. **AC2: Library Performance**
   - Given user navigates to library
   - When library has 100+ items
   - Then list loads and scrolls smoothly
   - And renders under 2 seconds

3. **AC3: Interaction Responsiveness**
   - Given user interacts with any control
   - When they tap a button
   - Then response is immediate (no lag)
   - And UI updates optimistically where appropriate

4. **AC4: Slow Network Handling**
   - Given user is on slow network
   - When they use the app
   - Then cached data displays immediately
   - And fresh data loads in background

5. **AC5: Image Loading**
   - Given images/thumbnails are displayed
   - When they load
   - Then they fade in smoothly
   - And placeholders show while loading

## Tasks / Subtasks

### Task 1: Skeleton Loading Components (AC: 1, 2)
- [ ] 1.1 Create `components/ui/Skeleton.tsx`:
  ```typescript
  import { MotiView } from 'moti';

  interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    radius?: number;
    className?: string;
  }

  export function Skeleton({
    width = '100%',
    height = 20,
    radius = 8,
    className
  }: SkeletonProps) {
    return (
      <MotiView
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
        }}
        style={{
          width,
          height,
          borderRadius: radius,
        }}
        className={cn('bg-amber-200 dark:bg-amber-800', className)}
      />
    );
  }
  ```
- [ ] 1.2 Install Moti for animations:
  ```bash
  npm install moti
  npx expo install react-native-reanimated
  ```

### Task 2: Library Skeleton Component (AC: 2)
- [ ] 2.1 Create `components/library/LibrarySkeleton.tsx`:
  ```typescript
  export function LibrarySkeleton() {
    return (
      <SafeAreaView className="flex-1 bg-cream dark:bg-deep-brown">
        {[...Array(8)].map((_, i) => (
          <View key={i} className="flex-row p-4 border-b border-amber-200 dark:border-amber-800">
            {/* Progress bar skeleton */}
            <Skeleton width={4} height={60} radius={2} className="mr-3" />

            <View className="flex-1">
              {/* Title skeleton */}
              <Skeleton width="80%" height={18} className="mb-2" />
              {/* Metadata skeleton */}
              <View className="flex-row">
                <Skeleton width={60} height={14} className="mr-2" />
                <Skeleton width={80} height={14} />
              </View>
            </View>
          </View>
        ))}
      </SafeAreaView>
    );
  }
  ```

### Task 3: Add Screen Skeleton (AC: 1)
- [ ] 3.1 Create `components/add/AddScreenSkeleton.tsx`:
  ```typescript
  export function AddScreenSkeleton() {
    return (
      <View className="flex-1 p-6">
        {/* Input skeleton */}
        <Skeleton height={120} radius={16} className="mb-6" />

        {/* Voice selector skeleton */}
        <View className="flex-row mb-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} width={120} height={100} radius={12} className="mr-3" />
          ))}
        </View>

        {/* Button skeleton */}
        <Skeleton height={56} radius={12} />
      </View>
    );
  }
  ```

### Task 4: React Query Caching Strategy (AC: 4)
- [ ] 4.1 Update `app/_layout.tsx` with optimized QueryClient:
  ```typescript
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
        retry: 2,
        refetchOnWindowFocus: false, // Mobile doesn't need this
        refetchOnReconnect: true,
      },
    },
  });
  ```

### Task 5: Optimistic Updates (AC: 3)
- [ ] 5.1 Update `hooks/useLibrary.ts` with optimistic delete:
  ```typescript
  const deleteMutation = useMutation({
    mutationFn: deleteFromLibrary,
    onMutate: async (itemId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['library'] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData(['library']);

      // Optimistically update
      queryClient.setQueryData(['library'], (old: any) => ({
        ...old,
        items: old?.items?.filter((item: any) => item.id !== itemId),
      }));

      return { previousItems };
    },
    onError: (err, itemId, context) => {
      // Rollback on error
      queryClient.setQueryData(['library'], context?.previousItems);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
  ```

### Task 6: Memoization & Performance (AC: 3)
- [ ] 6.1 Memoize expensive components:
  ```typescript
  // In LibraryItem.tsx
  export const LibraryItem = memo(function LibraryItem({ item, onDelete }: Props) {
    // ... component code
  }, (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.playback_position === nextProps.item.playback_position &&
      prevProps.item.is_played === nextProps.item.is_played
    );
  });
  ```
- [ ] 6.2 Use useMemo for expensive calculations:
  ```typescript
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
  }, [items]);
  ```

### Task 7: Image Optimization (AC: 5)
- [ ] 7.1 Create `components/ui/FadeImage.tsx`:
  ```typescript
  import { Image } from 'expo-image';

  interface FadeImageProps {
    source: string;
    style?: any;
    className?: string;
  }

  export function FadeImage({ source, style, className }: FadeImageProps) {
    return (
      <Image
        source={{ uri: source }}
        style={style}
        className={className}
        transition={200}
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        contentFit="cover"
      />
    );
  }
  ```
- [ ] 7.2 Install expo-image:
  ```bash
  npx expo install expo-image
  ```

### Task 8: Splash Screen Optimization (AC: 1)
- [ ] 8.1 Configure splash screen in `app.json`:
  ```json
  {
    "expo": {
      "splash": {
        "image": "./assets/splash.png",
        "resizeMode": "contain",
        "backgroundColor": "#FFFBEB"
      }
    }
  }
  ```
- [ ] 8.2 Keep splash until app ready:
  ```typescript
  import * as SplashScreen from 'expo-splash-screen';

  SplashScreen.preventAutoHideAsync();

  export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);

    useEffect(() => {
      async function prepare() {
        try {
          // Load fonts, setup player, etc.
          await setupPlayer();
          await loadFonts();
        } finally {
          setAppIsReady(true);
        }
      }
      prepare();
    }, []);

    useEffect(() => {
      if (appIsReady) {
        SplashScreen.hideAsync();
      }
    }, [appIsReady]);

    if (!appIsReady) {
      return null;
    }

    // ... rest of layout
  }
  ```

### Task 9: FlashList Optimization (AC: 2)
- [ ] 9.1 Optimize FlashList in library:
  ```typescript
  <FlashList
    data={items}
    renderItem={({ item }) => <LibraryItem item={item} />}
    estimatedItemSize={80}
    keyExtractor={(item) => item.id}
    // Performance optimizations
    drawDistance={300}
    overrideItemLayout={(layout, item) => {
      layout.size = 80; // Fixed height items
    }}
  />
  ```

### Task 10: Performance Monitoring (AC: all)
- [ ] 10.1 Add performance tracking:
  ```typescript
  // Track render times
  if (__DEV__) {
    const startTime = performance.now();
    // ... render
    console.log(`Render time: ${performance.now() - startTime}ms`);
  }
  ```
- [ ] 10.2 Use React DevTools Profiler in development

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- FlashList for 60 FPS scrolling
- React Query for caching
- Memoization for expensive renders

**From UX Design Specification:**
- < 3 second app launch
- < 2 second library load
- Smooth animations throughout

### Performance Targets

| Metric | Target |
|--------|--------|
| App launch | < 3 seconds |
| Library load (100 items) | < 2 seconds |
| List scroll | 60 FPS |
| Button response | < 100ms |

### Source Tree Components

```
apps/mobile/
├── app/
│   └── _layout.tsx          # Splash, QueryClient config
├── components/
│   ├── ui/
│   │   ├── Skeleton.tsx
│   │   └── FadeImage.tsx
│   ├── library/
│   │   └── LibrarySkeleton.tsx
│   └── add/
│       └── AddScreenSkeleton.tsx
└── hooks/
    └── useLibrary.ts        # Optimistic updates
```

### Testing Standards

- Test app launch time with stopwatch
- Test library scroll with 100+ items
- Test on older devices (not just latest iPhone)
- Profile with React DevTools
- Test on slow network (Network Link Conditioner)

### Key Technical Decisions

1. **FlashList:** Native recycling for smooth scroll
2. **expo-image:** Better caching and transitions
3. **Moti:** Smooth skeleton animations
4. **Optimistic Updates:** Instant UI feedback

### Dependencies

- Story 4-1 must be completed (library exists)

### References

- [Source: prd.md#Non-Functional-Requirements] (NFR4, NFR5)
- [Source: epics.md#Story-6.2-Performance-Optimization]
- [FlashList Performance](https://shopify.github.io/flash-list/docs/performance)
- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

## Dev Agent Record

### Agent Model Used

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
