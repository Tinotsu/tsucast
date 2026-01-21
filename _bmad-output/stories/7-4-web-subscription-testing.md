# Story 7.4: Web Subscription Testing

Status: done

## Story

As a developer testing payments,
I want to test the subscription flow on web,
So that I can verify RevenueCat integration without app store builds.

## Acceptance Criteria

1. **AC1: Subscription Status Display**
   - Given authenticated user is on web
   - When they view their subscription status
   - Then they see current tier (free/pro)
   - And remaining daily limit if free

2. **AC2: Upgrade Flow**
   - Given free user wants to upgrade
   - When they click upgrade
   - Then they see plan options and pricing
   - And are directed to appropriate payment method

3. **AC3: Webhook Handling**
   - Given subscription webhook fires
   - When RevenueCat notifies backend
   - Then user_profiles.subscription_tier updates
   - And change reflects on web immediately

4. **AC4: Subscription Management**
   - Given user wants to manage subscription
   - When they click "Manage"
   - Then they're directed to appropriate portal
   - And can view/cancel subscription

## Tasks / Subtasks

### Task 1: Settings Page (AC: 1)
- [x] 1.1 Create `app/(app)/settings/page.tsx`
- [x] 1.2 Display current subscription tier
- [x] 1.3 Display daily usage/limits for free tier
- [x] 1.4 Add logout button

### Task 2: Upgrade Page (AC: 2, 4)
- [x] 2.1 Create `app/(app)/upgrade/page.tsx`
- [x] 2.2 Display plan options (Free vs Pro)
- [x] 2.3 Add upgrade CTA for free users
- [x] 2.4 Add manage subscription link for pro users

### Task 3: API Integration (AC: 1, 3)
- [x] 3.1 Create `lib/api.ts` with fetch helpers
- [x] 3.2 Fetch subscription status from user_profiles
- [x] 3.3 Display usage statistics

## Dev Notes

- Web payments would use Stripe (not RevenueCat)
- For testing, webhook simulation can trigger tier changes
- Same user_profiles table as mobile

## Story Wrap-up

- [x] All tests pass
- [x] Build succeeds
- [x] Code review complete
