# Story 1.3: Session Management & Logout

Status: done

## Story

As a logged-in user,
I want my session to persist and sync across devices,
so that I don't need to log in repeatedly.

## Acceptance Criteria

1. **AC1: Session Persistence**
   - Given user is logged in
   - When they close and reopen the app
   - Then they remain logged in
   - And session is restored from secure storage

2. **AC2: Cross-Device Sync**
   - Given user is logged in on multiple devices
   - When they use tsucast
   - Then their library syncs via Supabase
   - And playback positions sync (last-write-wins)

3. **AC3: Logout Functionality**
   - Given user wants to log out
   - When they tap "Log out" in settings
   - Then session is cleared
   - And they are redirected to login screen
   - And local data is cleared

## Tasks / Subtasks

### Task 1: Session Persistence Enhancement (AC: 1)
- [x] 1.1 Verify `expo-secure-store` is storing auth tokens correctly
- [x] 1.2 Implement session restoration on app launch in `app/_layout.tsx`:
  ```typescript
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);
  ```
- [x] 1.3 Add loading state while checking session (splash screen or skeleton)
- [x] 1.4 Handle expired session gracefully (redirect to login)
- [x] 1.5 Implement automatic token refresh via Supabase client

### Task 2: Auth State Listener (AC: 1, 2)
- [x] 2.1 Enhance `hooks/useAuth.ts` with robust state management:
  ```typescript
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_OUT') {
          // Clear local data
        }
        if (event === 'TOKEN_REFRESHED') {
          // Session refreshed automatically
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  ```
- [x] 2.2 Handle all auth events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
- [x] 2.3 Sync auth state across app components

### Task 3: Settings Screen with Logout (AC: 3)
- [x] 3.1 Create `app/(tabs)/settings.tsx` settings screen:
  - User email display (from session)
  - Subscription tier display (from user_profiles)
  - "Log Out" button at bottom
- [x] 3.2 Style settings screen with monochrome B&W theme:
  - Section headers (zinc-500 text)
  - List items with borders and chevrons
  - Destructive red color for logout button
- [x] 3.3 Add settings tab to tab navigation in `app/(tabs)/_layout.tsx`
- [x] 3.4 Use appropriate icon for settings tab (gear/cog)

### Task 4: Logout Implementation (AC: 3)
- [x] 4.1 Implement `signOut()` function in `hooks/useAuth.ts`:
  ```typescript
  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear any cached data
    await AsyncStorage.clear();
    // Secure store is cleared by Supabase client
  };
  ```
- [x] 4.2 Clear local cached data on logout:
  - AsyncStorage items (preferences, cache)
  - React Query cache (if implemented)
  - Zustand stores (reset to initial state)
- [x] 4.3 Navigate to login screen after logout
- [x] 4.4 Add confirmation dialog before logout (optional but recommended)

### Task 5: Cross-Device Sync Foundation (AC: 2)
- [x] 5.1 Verify Supabase RLS policies allow user data access
- [x] 5.2 Document sync behavior for future stories:
  - Library items sync automatically (Supabase realtime)
  - Playback positions use last-write-wins
- [x] 5.3 Add `updated_at` trigger for user_profiles:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```

### Task 6: Error Handling (AC: 1, 3)
- [x] 6.1 Handle session restoration failures gracefully
- [x] 6.2 Handle logout failures (show retry option)
- [x] 6.3 Handle network errors during session operations
- [x] 6.4 Show appropriate loading states during operations

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Supabase handles session management automatically
- Tokens stored in `expo-secure-store` (encrypted)
- Cross-device sync via Supabase PostgreSQL
- Last-write-wins for conflict resolution (playback positions)

**Session Flow:**
1. App launch → Check stored session
2. Valid session → Restore user state
3. Expired session → Attempt refresh
4. Refresh fails → Redirect to login

### Source Tree Components

```
apps/mobile/
├── app/
│   ├── _layout.tsx        # Session check on launch
│   └── (tabs)/
│       ├── _layout.tsx    # Add settings tab
│       └── settings.tsx   # New settings screen
├── hooks/
│   └── useAuth.ts         # Enhanced with signOut, session management
└── services/
    └── supabase.ts        # Session persistence config
```

### Testing Standards

- Test app close/reopen → session persists
- Test force quit → session persists
- Test token expiry → auto-refresh works
- Test logout → redirected to login, data cleared
- Test logout → reopen app → shows login screen
- Test network failure during session check

### Key Technical Decisions

1. **Secure Storage:** Auth tokens in expo-secure-store, preferences in AsyncStorage
2. **Auto Refresh:** Supabase client handles token refresh automatically
3. **Clear on Logout:** All local data cleared except app preferences (dark mode, etc.)
4. **Sync Strategy:** Last-write-wins for simplicity (no complex conflict resolution)

### Dependencies

- Story 1-1 must be completed first (auth infrastructure)

### References

- [Source: architecture-v2.md#Authentication]
- [Source: epics.md#Story-1.3-Session-Management-Logout]
- [Source: prd.md#FR37-FR38]
- [Supabase Session Management](https://supabase.com/docs/guides/auth/sessions)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Session persistence implemented via expo-secure-store adapter in Supabase client
- Auth state listener properly handles SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events
- Settings screen includes user email, subscription tier, and logout with confirmation
- Logout preserves user preferences (keys prefixed with preference_ or settings_)
- Dark mode support added to tab bar navigation
- Loading spinner shown during auth initialization

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-20 | Implementation completed | Claude Opus 4.5 |
| 2026-01-20 | Code review fixes applied | Claude Opus 4.5 |
| 2026-01-21 | Code review round 2: Fixed placeholder buttons to show "Coming soon", restored missing heart emoji, added React Query cache clear on logout | Claude Opus 4.5 |
| 2026-01-21 | Code review round 3: Updated tabs layout to B&W theme, updated task descriptions from Autumn Magic to B&W theme | Claude Opus 4.5 |

### File List

**Created:**
- `apps/mobile/app/(tabs)/settings.tsx` - Settings screen with logout
- `apps/mobile/app/upgrade.tsx` - Upgrade to Pro screen
- `apps/mobile/services/queryClient.ts` - React Query client (for cache clearing on logout)

**Modified:**
- `apps/mobile/hooks/useAuth.ts` - Enhanced signOut to preserve preferences, improved auth state listener, added queryClient.clear() on logout
- `apps/mobile/app/_layout.tsx` - Added loading state during auth initialization, imports queryClient from module, B&W theme
- `apps/mobile/app/(tabs)/_layout.tsx` - Added settings tab, B&W monochrome theme (dark only)
- `apps/mobile/services/supabase.ts` - Added runtime env var validation
- `supabase/migrations/001_user_profiles.sql` - Includes updated_at trigger
