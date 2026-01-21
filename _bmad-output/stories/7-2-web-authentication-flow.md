# Story 7.2: Web Authentication Flow

Status: done

## Story

As a user testing tsucast on web,
I want to sign in with the same account as mobile,
So that my library syncs across platforms.

## Acceptance Criteria

1. **AC1: Login Form**
   - Given visitor is on web app
   - When they click "Sign In"
   - Then they see email/password login form
   - And social login options (Google, Apple)

2. **AC2: Session Establishment**
   - Given user logs in on web
   - When authentication succeeds
   - Then session is established via Supabase
   - And they can access their library
   - And same data as mobile app

3. **AC3: Account Creation**
   - Given user creates account on web
   - When signup completes
   - Then account works on mobile app too
   - And user_profiles row is created

4. **AC4: Logout**
   - Given user logs out on web
   - When they click logout
   - Then session is cleared
   - And they return to landing page

## Tasks / Subtasks

### Task 1: Supabase Auth Setup (AC: all)
- [x] 1.1 Install `@supabase/ssr` for server-side auth
- [x] 1.2 Create `lib/supabase/client.ts` for browser client
- [x] 1.3 Create `lib/supabase/server.ts` for server client
- [x] 1.4 Create `lib/supabase/middleware.ts` for session management

### Task 2: Auth Components (AC: 1, 2, 3)
- [x] 2.1 Create `components/auth/AuthForm.tsx` with email/password
- [x] 2.2 Add social login buttons (Google, Apple)
- [x] 2.3 Create `app/(auth)/login/page.tsx`
- [x] 2.4 Create `app/(auth)/signup/page.tsx`
- [x] 2.5 Create `app/auth/callback/route.ts` for OAuth callback

### Task 3: Route Protection (AC: 2, 4)
- [x] 3.1 Create Next.js middleware for protected routes
- [x] 3.2 Implement redirect to login for unauthenticated users
- [x] 3.3 Create `hooks/useAuth.ts` for client-side auth state

### Task 4: Testing (AC: all)
- [x] 4.1 Verify build succeeds with auth pages
- [x] 4.2 Test auth form rendering

## Dev Notes

- Used @supabase/ssr for Next.js 15 compatibility
- Server-side session validation via middleware
- OAuth callback handles social login redirects
- Same Supabase project as mobile app

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
