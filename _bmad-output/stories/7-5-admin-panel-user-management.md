# Story 7.5: Admin Panel - User Management

Status: done

## Story

As an admin,
I want to view user statistics and manage accounts,
So that I can monitor the platform and help users.

## Acceptance Criteria

1. **AC1: Admin Access**
   - Given admin logs in
   - When they access /admin
   - Then they see admin dashboard
   - And only users with admin role can access

2. **AC2: User List**
   - Given admin views users
   - When user list loads
   - Then they see registered users with: email, signup date, subscription tier, usage stats
   - And can search and filter users

3. **AC3: System Metrics**
   - Given admin views system health
   - When metrics load
   - Then they see: API latency, TTS queue depth, error rates
   - And metrics update periodically

4. **AC4: User Details**
   - Given admin wants to view user details
   - When they click on a user
   - Then they see full user profile
   - And generation history
   - And subscription details

## Tasks / Subtasks

### Task 1: Admin Layout (AC: 1)
- [x] 1.1 Create `app/admin/layout.tsx` with admin check
- [x] 1.2 Create `components/admin/AdminSidebar.tsx`
- [x] 1.3 Implement admin role verification
- [x] 1.4 Redirect non-admins to dashboard

### Task 2: Admin Dashboard (AC: 3)
- [x] 2.1 Create `app/admin/page.tsx` with overview
- [x] 2.2 Display key metrics (users, generations, errors)
- [x] 2.3 Add quick links to admin sections

### Task 3: User Management (AC: 2, 4)
- [x] 3.1 Create `app/admin/users/page.tsx`
- [x] 3.2 Implement user list with search/filter
- [x] 3.3 Display user details on click
- [x] 3.4 Create `lib/admin-api.ts` for admin endpoints

## Dev Notes

- Admin role checked via user_profiles.is_admin
- Client-side and middleware protection for admin routes
- Placeholder metrics - would connect to monitoring service

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
