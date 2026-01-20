# Story 1.1: Email Registration & Login

Status: done

## Story

As a new user,
I want to create an account with my email,
so that I can save my generated podcasts and access them across devices.

## Acceptance Criteria

1. **AC1: Login Screen Display**
   - Given user opens the app for the first time
   - When they are not logged in
   - Then they see a login screen with email/password fields
   - And option to create new account

2. **AC2: Account Creation**
   - Given user wants to create an account
   - When they enter a valid email and password (min 8 chars)
   - Then account is created via Supabase Auth
   - And user is automatically logged in
   - And user_profiles row is created via database trigger

3. **AC3: Existing Account Login**
   - Given user has an existing account
   - When they enter correct email and password
   - Then they are logged in
   - And redirected to the Add screen

4. **AC4: Login Error Handling**
   - Given user enters incorrect credentials
   - When they attempt to login
   - Then they see clear error message: "Invalid email or password"
   - And can retry

## Tasks / Subtasks

### Task 1: Project Initialization (AC: all)
- [x] 1.1 Create Expo project with `create-expo-app@latest` using Expo SDK 54
- [x] 1.2 Verify file-based routing structure with `app/` directory
- [x] 1.3 Install core dependencies:
  - `@supabase/supabase-js`
  - `@react-native-async-storage/async-storage`
  - `expo-secure-store`
  - `react-native-url-polyfill`
- [x] 1.4 Configure `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] 1.5 Create `.env.example` template for team reference
- [x] 1.6 Install NativeWind v4 for Tailwind styling (per UX spec)

### Task 2: Supabase Client Setup (AC: 2, 3)
- [x] 2.1 Create `services/supabase.ts` with Supabase client initialization
- [x] 2.2 Configure AsyncStorage adapter for session persistence
- [x] 2.3 Configure expo-secure-store for token storage (auth tokens only)
- [x] 2.4 Set up URL polyfill for React Native compatibility
- [x] 2.5 Export typed Supabase client instance

### Task 3: Auth State Management (AC: all)
- [x] 3.1 Create `hooks/useAuth.ts` custom hook
- [x] 3.2 Implement auth state listener with `onAuthStateChange`
- [x] 3.3 Implement `signUp(email, password)` function
- [x] 3.4 Implement `signIn(email, password)` function
- [x] 3.5 Implement `signOut()` function
- [x] 3.6 Implement `isLoading` and `user` state exports
- [x] 3.7 Handle session refresh automatically

### Task 4: Database Migration (AC: 2)
- [x] 4.1 Create `supabase/migrations/` directory structure
- [x] 4.2 Create migration for `user_profiles` table:
  ```sql
  CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free',
    daily_generations INTEGER DEFAULT 0,
    daily_generations_reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [x] 4.3 Create trigger function `create_user_profile()` to auto-create profile on signup
- [x] 4.4 Create trigger `on_auth_user_created` on `auth.users`
- [x] 4.5 Enable RLS on `user_profiles` table
- [x] 4.6 Create RLS policies for user self-access only
- [ ] 4.7 Run migration via `npx supabase db push`

### Task 5: Auth Screens UI (AC: 1, 2, 3, 4)
- [x] 5.1 Create `app/(auth)/_layout.tsx` for auth group layout
- [x] 5.2 Create `app/(auth)/login.tsx` login screen:
  - Email input field with validation
  - Password input field (min 8 chars, obscured)
  - "Sign In" button
  - "Create Account" link to signup
  - Error message display area
- [x] 5.3 Create `app/(auth)/signup.tsx` signup screen:
  - Email input field with validation
  - Password input field (min 8 chars)
  - Confirm password field
  - "Create Account" button
  - "Already have an account?" link to login
  - Error message display area
- [x] 5.4 Style screens using NativeWind with Autumn Magic palette:
  - Background: Cream `#FFFBEB` (light) / Deep Brown `#1C1410` (dark)
  - Primary buttons: Amber `#F59E0B`
  - Text: Deep Brown `#451A03` (light) / Warm Cream `#FEF3C7` (dark)
- [x] 5.5 Implement form validation with clear error states
- [x] 5.6 Show loading state during auth operations

### Task 6: Navigation & Routing (AC: 3)
- [x] 6.1 Create `app/_layout.tsx` root layout with auth state check
- [x] 6.2 Create `app/(tabs)/_layout.tsx` for authenticated tab navigation
- [x] 6.3 Create placeholder `app/(tabs)/index.tsx` (Add screen - future story)
- [x] 6.4 Implement conditional navigation:
  - Not logged in → show auth screens
  - Logged in → show main app (tabs)
- [x] 6.5 Handle navigation during auth state changes
- [x] 6.6 Ensure smooth redirect after successful login

### Task 7: Error Handling (AC: 4)
- [x] 7.1 Map Supabase auth errors to user-friendly messages:
  - `invalid_credentials` → "Invalid email or password"
  - `email_not_confirmed` → "Please verify your email"
  - `user_already_exists` → "An account with this email already exists"
  - Network errors → "Unable to connect. Check your internet."
- [x] 7.2 Display errors in UI without blocking
- [x] 7.3 Allow retry after error

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Auth is handled directly between mobile app and Supabase (no VPS involvement)
- Use Supabase JS client with `@supabase/supabase-js`
- JWT tokens stored securely via `expo-secure-store`
- Row Level Security (RLS) enabled on all user tables
- Environment variables prefixed with `EXPO_PUBLIC_` for Expo compatibility

**From UX Design Specification:**
- Zero onboarding - screens should be self-explanatory
- Tom Bombadil energy - magic without explanation
- Autumn Magic color palette (warm amber/brown tones)
- Dark mode follows system preference
- Minimal UI, no visual noise

### Source Tree Components

```
tsucast/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── app/                   # Expo Router pages
│       │   ├── _layout.tsx        # Root layout with auth check
│       │   ├── (auth)/            # Auth group (unauthenticated)
│       │   │   ├── _layout.tsx    # Auth layout
│       │   │   ├── login.tsx      # Login screen
│       │   │   └── signup.tsx     # Signup screen
│       │   └── (tabs)/            # Main app group (authenticated)
│       │       ├── _layout.tsx    # Tab layout
│       │       └── index.tsx      # Add screen (placeholder)
│       ├── hooks/
│       │   └── useAuth.ts         # Auth state hook
│       ├── services/
│       │   └── supabase.ts        # Supabase client
│       └── .env                   # Environment variables
└── supabase/
    └── migrations/
        └── 001_user_profiles.sql  # User profiles migration
```

### Testing Standards

- Manually test auth flow on iOS simulator and Android emulator
- Test login with valid credentials → successful redirect
- Test login with invalid credentials → error displayed
- Test signup with new email → account created, auto-login
- Test signup with existing email → appropriate error
- Test session persistence → close app, reopen, still logged in
- Test logout → redirected to login screen

### Project Structure Notes

- This is a greenfield project - no existing code
- Using Expo SDK 53 with React 19 features
- File-based routing via Expo Router v5
- Monorepo structure planned but mobile-first for MVP
- No API server needed for this story (direct Supabase)

### Key Technical Decisions

1. **Session Storage:** Use `expo-secure-store` for auth tokens (encrypted keychain/keystore) rather than AsyncStorage
2. **Auth State:** Single `useAuth` hook provides all auth functionality
3. **Profile Creation:** Database trigger handles profile creation - no client code needed
4. **Email Verification:** Disabled for MVP testing (enable before launch)
5. **Error Messages:** User-friendly, not technical jargon

### References

- [Source: architecture-v2.md#JWT-Validation-Middleware]
- [Source: architecture-v2.md#Database-Schema]
- [Source: ux-design-specification.md#Design-System-Foundation]
- [Source: ux-design-specification.md#Color-System]
- [Source: epics.md#Story-1.1-Email-Registration-Login]
- [Source: prd.md#Functional-Requirements FR35, FR36]
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Supabase Auth React Native Guide](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [expo-secure-store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Clean implementation

### Completion Notes List

- Used Expo SDK 54 (newer than planned SDK 53)
- Implemented expo-secure-store adapter for Supabase session storage
- Created comprehensive error message mapping for user-friendly auth errors
- Added dark mode support throughout auth screens
- Task 4.7 (run migration) deferred - requires Supabase project setup

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-20 | Implementation completed | Claude Opus 4.5 |
| 2026-01-20 | Code review fixes applied | Claude Opus 4.5 |

### File List

**Created:**
- `apps/mobile/package.json` - Mobile app dependencies
- `apps/mobile/app.json` - Expo configuration
- `apps/mobile/tsconfig.json` - TypeScript configuration
- `apps/mobile/tailwind.config.js` - Tailwind/NativeWind configuration
- `apps/mobile/global.css` - Global styles with Tailwind
- `apps/mobile/babel.config.js` - Babel configuration
- `apps/mobile/metro.config.js` - Metro bundler configuration
- `apps/mobile/services/supabase.ts` - Supabase client with SecureStore adapter
- `apps/mobile/hooks/useAuth.ts` - Authentication hook with all auth methods
- `apps/mobile/app/_layout.tsx` - Root layout with auth navigation handler
- `apps/mobile/app/(auth)/_layout.tsx` - Auth group layout
- `apps/mobile/app/(auth)/login.tsx` - Login screen with validation
- `apps/mobile/app/(auth)/signup.tsx` - Signup screen with validation
- `apps/mobile/app/(tabs)/_layout.tsx` - Tab navigation layout
- `apps/mobile/app/(tabs)/index.tsx` - Add screen placeholder
- `apps/mobile/app/(tabs)/library.tsx` - Library screen placeholder
- `apps/mobile/.env.example` - Environment variables template
- `supabase/migrations/001_user_profiles.sql` - User profiles migration with RLS
