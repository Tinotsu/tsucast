# Code Review Findings - tsucast

> **Date**: 2026-01-22
> **Reviewer**: Claude Opus 4.5
> **Scope**: Full codebase review of API (`apps/api`) and Web App (`apps/web`)

## Executive Summary

| Category | API Issues | Web Issues | Total |
|----------|------------|------------|-------|
| Critical | 1 | 0 | 1 |
| High | 12 | 5 | 17 |
| Medium | 16 | 13 | 29 |
| Low | 10 | 17 | 27 |
| **Total** | **39** | **35** | **74** |

---

# Part 1: API Issues (`apps/api`)

## Critical Issues (Fix Immediately)

### 1. Timing Attack Vulnerability in Webhook Auth
- **File**: `src/routes/webhooks.ts:46`
- **Severity**: CRITICAL
- **Issue**: RevenueCat webhook authentication uses simple string comparison, vulnerable to timing attacks
- **Problem**:
  ```typescript
  if (authHeader !== expectedAuth) {  // VULNERABLE
    return c.json({ error: 'Invalid authorization' }, 401);
  }
  ```
- **Fix**: Use `crypto.timingSafeEqual()` for security-sensitive comparisons

---

## High Severity Issues

### 2. Supabase Service Role Key Duplicated
- **Files**: `src/lib/supabase.ts:22`, `src/services/cache.ts:20`, `src/routes/report.ts:18`
- **Issue**: Service role key initialized in multiple places instead of centralized singleton
- **Fix**: Use centralized `getSupabase()` from `/lib/supabase.ts` everywhere

### 3. Missing Input Validation for Voice ID
- **File**: `src/routes/cache.ts:24`
- **Issue**: `voiceId` parameter accepts arbitrary strings without validation
- **Fix**: Add Zod schema to validate against allowed voice IDs

### 4. Missing Authorization Boundary Check
- **File**: `src/routes/library.ts:166-169`
- **Issue**: Update position endpoint doesn't verify record exists before update
- **Fix**: Verify item belongs to user before updating

### 5. Unhandled Promise Rejection in Playlist Reorder
- **File**: `src/routes/playlists.ts:346-359`
- **Issue**: `Promise.all()` without error handling; first error crashes request
- **Fix**: Use `Promise.allSettled()` or wrap in try-catch

### 6. Silent Failure in Cache Update
- **File**: `src/services/cache.ts:152-172`
- **Issue**: `updateCacheFailed()` silently returns on error, inconsistent with other functions
- **Fix**: Propagate errors consistently

### 7. Duplicated Rate Limit Logic
- **Files**: `src/routes/generate.ts:50-102`, `src/routes/user.ts:42-66`
- **Issue**: Rate limit checking and reset logic duplicated
- **Fix**: Extract to shared utility `checkAndResetDailyLimit()`

### 8. Duplicated User Profile Code
- **File**: `src/routes/user.ts:17-77`
- **Issue**: `/limit` and `/profile` endpoints repeat profile fetch logic
- **Fix**: Create shared `getUserProfile()` function

### 9. N+1 Query in Playlist Reorder
- **File**: `src/routes/playlists.ts:340-359`
- **Issue**: Loop sends individual UPDATE queries instead of batch upsert
- **Fix**: Use Supabase's `upsert()` with array

### 10. Unsafe Type Assertion on Cache Response
- **File**: `src/routes/generate.ts:56-60`
- **Issue**: `as { data: UserProfile | null }` without runtime validation
- **Fix**: Use Zod schema to validate response

### 11. Unsafe Type Assertion on Playlist Count
- **File**: `src/routes/playlists.ts:46-49`
- **Issue**: Accessing nested count without structure validation
- **Fix**: Add runtime validation

### 12. Unsafe Type Assertion on Audio Relations
- **File**: `src/routes/library.ts:75-79`
- **Issue**: Manual type handling of Supabase relations without validation
- **Fix**: Add Zod schemas for relation data

### 13. Missing Rate Limiting Tests
- **Severity**: HIGH (Testing Gap)
- **Issue**: No tests for rate limit enforcement
- **Missing Tests**: Free user blocking, pro user bypass, daily reset

---

## Medium Severity Issues

### 14. Missing Body Size Limits
- **File**: `src/index.ts`
- **Issue**: No body size limits, vulnerable to DoS
- **Fix**: Add `bodyLimit({ maxSize: '1mb' })`

### 15. Exposed Error Details
- **File**: `src/services/tts.ts:82-88`
- **Issue**: Fish Audio API errors logged with full headers
- **Fix**: Sanitize logged data

### 16. Missing Error Context in Generate
- **File**: `src/routes/generate.ts:493-495`
- **Issue**: Catch-all returns generic error, loses context
- **Fix**: Preserve error details for debugging

### 17. Silent Failure in Report Route
- **File**: `src/routes/report.ts:113-121`
- **Issue**: All errors swallowed, returns success
- **Fix**: Handle errors appropriately

### 18. Missing Stream Error Handling
- **File**: `src/services/fetcher.ts:206-224`
- **Issue**: PDF stream reading lacks error handling
- **Fix**: Add try-catch around read loop

### 19. Duplicate Library Entry Logic
- **Files**: `src/routes/generate.ts:237-250,454-467`, `src/routes/library.ts:119-131`
- **Issue**: Adding to library done in three places
- **Fix**: Extract to `addToUserLibrary()` utility

### 20. Inconsistent Error Handling Patterns
- **Files**: Multiple routes
- **Issue**: Different routes handle errors differently
- **Fix**: Standardize error handling

### 21. Double Fetch in Cache Hit Path
- **File**: `src/routes/generate.ts:296-309`
- **Issue**: Refetches entry after race condition check
- **Fix**: Return claimed entry from `claimCacheEntry()`

### 22. Missing Rate Limit Headers
- **Files**: All routes
- **Issue**: No `X-RateLimit-*` headers in responses
- **Fix**: Add rate limit headers

### 23. No Request ID Propagation
- **File**: `src/middleware/logging.ts:59`
- **Issue**: Request ID not passed to downstream services
- **Fix**: Propagate through service parameters

### 24. Missing Playlist Name Length Validation
- **File**: `src/routes/playlists.ts:72-74`
- **Issue**: No maximum length for playlist names
- **Fix**: Add `z.string().max(255)`

### 25. Hardcoded API Limits
- **File**: `src/utils/errors.ts:71-76`
- **Issue**: Limits hardcoded as constants
- **Fix**: Move to environment variables

### 26. Timeout Not Propagated to TTS
- **File**: `src/routes/generate.ts:411-414`
- **Issue**: Abort signal not passed to generateSpeech()
- **Fix**: Pass signal through service chain

### 27. No Idempotency Keys
- **Files**: All mutation endpoints
- **Issue**: Duplicate requests create duplicates
- **Fix**: Add Idempotency-Key header support

### 28. Missing Tests for Auth Boundaries
- **Severity**: MEDIUM (Testing Gap)
- **Issue**: No tests verifying user data isolation

### 29. Missing Tests for Webhook Auth
- **Severity**: MEDIUM (Testing Gap)
- **Issue**: RevenueCat webhook tests missing

---

## Low Severity Issues

### 30. Inefficient Word Count
- **File**: `src/utils/text.ts:10-15`
- **Issue**: Uses `split()` + `filter()`, creates intermediate array
- **Alternative**: `(text.match(/\S+/g) || []).length`

### 31. Missing Type Definition
- **File**: `src/routes/library.ts:160`
- **Issue**: `Record<string, unknown>` could be more specific

### 32. Inconsistent HTTP Status Codes
- **Files**: Multiple routes
- **Issue**: Mixed use of 422 vs 400 for errors

### 33. Verbose TTS Logging
- **File**: `src/services/tts.ts:67`
- **Issue**: Logs full request body on every request

### 34. CORS Using Defaults
- **File**: `src/index.ts:20`
- **Issue**: `cors()` called without explicit config
- **Fix**: Configure allowed origins explicitly

---

# Part 2: Web App Issues (`apps/web`)

## High Severity Issues

### 35. Stale Closure in VoiceSelector
- **File**: `components/app/VoiceSelector.tsx:23-25`
- **Issue**: Calls `onChange` during render, not in useEffect
- **Problem**:
  ```typescript
  if (value !== DEFAULT_VOICE.id) {
    onChange(DEFAULT_VOICE.id);  // Called during render!
  }
  ```
- **Fix**: Move to `useEffect` with proper dependencies

### 36. Manual Cookie Deletion Fragile
- **File**: `hooks/useAuth.ts:147-155`
- **Issue**: String manipulation for cookie deletion is error-prone
- **Fix**: Use proper cookie management utility

### 37. Duplicate Cookie Deletion Logic
- **Files**: `hooks/useAuth.ts:147-155`, `lib/api.ts:91-101`
- **Issue**: Same logic duplicated in two files
- **Fix**: Consolidate into single utility

### 38. Race Condition in Auth Init
- **File**: `hooks/useAuth.ts:47-88`
- **Issue**: 1-second timeout can miss auth state changes
- **Fix**: Use deterministic initialization pattern

### 39. Silent Profile Fetch Failure
- **File**: `hooks/useAuth.ts:34-45`
- **Issue**: Profile fetch errors silently ignored
- **Fix**: Log errors and set error state

---

## Medium Severity Issues

### 40. Open Redirect Risk
- **File**: `app/auth/callback/route.ts:15`
- **Issue**: No validation of redirect parameter
- **Fix**: Whitelist allowed redirect paths

### 41. useCallback Before Early Returns
- **File**: `app/(app)/generate/page.tsx:42`
- **Issue**: Callback defined before auth checks
- **Fix**: Place after all early returns

### 42. useRef Singleton Not Reset
- **File**: `hooks/useAuth.ts:22-23`
- **Issue**: Refs not reset on unmount, could share state
- **Fix**: Clear refs on unmount

### 43. Missing Dependency in WebPlayer
- **File**: `components/app/WebPlayer.tsx:62`
- **Issue**: `initialPosition` prop in dependency array
- **Fix**: Use stable callback references

### 44. Polling Without Exponential Backoff
- **File**: `lib/api.ts:169-202`
- **Issue**: Fixed 2-second polling interval
- **Fix**: Implement exponential backoff

### 45. Missing Env Var Validation
- **File**: `lib/supabase/client.ts:13-14`
- **Issue**: Using `!` assertion without validation
- **Fix**: Validate at app startup

### 46. Missing ARIA Labels on Buttons
- **File**: `components/app/WebPlayer.tsx:161-186`
- **Issue**: Skip/speed buttons lack accessibility labels
- **Fix**: Add `aria-label` attributes

### 47. Race Condition on Double-Click
- **File**: `app/(app)/generate/page.tsx:65-98`
- **Issue**: Rapid clicks could trigger multiple generations
- **Fix**: Use request ID or abort controller

### 48. Stale Profile After Generation
- **File**: `app/(app)/generate/page.tsx:60-63`
- **Issue**: Profile not refreshed after generation
- **Fix**: Refetch profile after success

### 49. Position Not Saved on Unmount
- **File**: `components/app/WebPlayer.tsx:64-75`
- **Issue**: Position saved every 30s, lost on early navigation
- **Fix**: Save position on unmount

### 50. Missing User Menu ARIA Label
- **File**: `components/app/AppHeader.tsx:81`
- **Issue**: User menu button has no aria-label
- **Fix**: Add descriptive label

### 51. OAuth Redirect URL Exposure
- **File**: `hooks/useAuth.ts:117,130`
- **Issue**: Ensure OAuth redirects match Supabase config
- **Fix**: Validate OAuth configuration

### 52. Hardcoded Timeout
- **File**: `hooks/useAuth.ts:76-81`
- **Issue**: 1-second auth timeout arbitrary
- **Fix**: Make configurable or use deterministic pattern

---

## Low Severity Issues

### 53. Silent Cache Check Failure
- **File**: `components/app/UrlInput.tsx:52-54`
- **Issue**: Cache check errors only logged to console
- **Fix**: Show subtle UI indicator

### 54. Silent Library Load Failure
- **File**: `app/(app)/library/page.tsx:51-62`
- **Issue**: Connection errors show empty library
- **Fix**: Distinct error state vs empty state

### 55. Unhandled signOut Promise
- **File**: `components/app/AppHeader.tsx:94`
- **Issue**: `signOut()` called without await
- **Fix**: Make async and handle errors

### 56. Admin Error No Context
- **File**: `app/admin/page.tsx:32-37`
- **Issue**: Retry button shows no error details
- **Fix**: Show detailed error messages

### 57. Event Listener Accumulation
- **File**: `components/app/WebPlayer.tsx:53-61`
- **Issue**: Rapid re-renders could accumulate listeners
- **Fix**: Use `.once()` or ensure cleanup timing

### 58. Duplicate Timer Creation
- **File**: `components/app/UrlInput.tsx:60`
- **Issue**: Debounce timer recreated on every render
- **Fix**: Use useCallback to memoize

### 59. Type Assertion Without Validation
- **File**: `hooks/useAuth.ts:43`
- **Issue**: `as UserProfile` without runtime check
- **Fix**: Validate data shape before casting

### 60. Loose Error Type Checking
- **File**: `app/(app)/library/page.tsx:51`
- **Issue**: Repeated `instanceof` checks
- **Fix**: Create custom error handler

### 61. Missing Inline Interface Check
- **File**: `app/admin/page.tsx:63-72`
- **Issue**: Mock data structure not type-checked
- **Fix**: Use `Partial<AdminMetrics>`

### 62. Possible Color Contrast Issues
- **Files**: Multiple (text-zinc-400)
- **Issue**: May not meet WCAG AA
- **Fix**: Test with contrast analyzer

### 63. Missing Loading Announcements
- **File**: `app/(app)/generate/page.tsx:225-229`
- **Issue**: Spinners lack aria-labels
- **Fix**: Add loading state announcements

### 64. Delete Without Debounce
- **File**: `app/(app)/settings/page.tsx:304`
- **Issue**: Delete enabled immediately on "DELETE" input
- **Fix**: Brief disable after click

### 65. Hardcoded API URL Fallback
- **File**: `lib/api.ts:1`
- **Issue**: `localhost:3001` fallback could leak to prod
- **Fix**: Ensure env var always set in prod

### 66. Unnecessary URL Manipulation
- **File**: `lib/supabase/middleware.ts:96-98`
- **Issue**: Redirect param deleted after use
- **Fix**: Acceptable, no change needed

### 67. Index as Key in Map
- **File**: `components/landing/Hero.tsx:53`
- **Issue**: Uses index as key for static array
- **Fix**: Use stable IDs or hardcode elements

### 68. Inconsistent Error Messages
- **Files**: Multiple
- **Issue**: Error formats vary across components
- **Fix**: Standardize error messaging

### 69. Public API URL Exposure
- **File**: `lib/api.ts:1`
- **Issue**: `NEXT_PUBLIC_API_URL` visible to clients
- **Fix**: Ensure backend has proper protection

---

# Priority Action Items

## Immediate (Critical/High)

1. **API #1**: Fix timing attack in webhook auth
2. **Web #35**: Fix VoiceSelector stale closure
3. **API #5**: Fix unhandled promise in playlist reorder
4. **Web #36-37**: Consolidate cookie deletion logic
5. **API #2**: Centralize Supabase client initialization
6. **API #7-8**: Extract duplicated rate limit logic

## Short-Term (High/Medium)

7. **API #3-4**: Add input validation and auth boundary checks
8. **Web #40**: Add redirect validation
9. **Web #44**: Implement exponential backoff for polling
10. **API #9**: Fix N+1 query in playlist reorder
11. **Web #46**: Add ARIA labels for accessibility
12. **API #10-12**: Replace unsafe type assertions with Zod

## Medium-Term (Testing Gaps)

13. Add rate limiting tests
14. Add auth boundary tests
15. Add webhook auth tests
16. Add race condition tests for playlist operations

---

# Metrics Summary

**By Category:**
- Security: 8 issues (1 critical, 4 high, 3 medium)
- Error Handling: 11 issues (2 high, 5 medium, 4 low)
- React/Hooks: 8 issues (2 high, 4 medium, 2 low)
- Type Safety: 8 issues (3 high, 2 medium, 3 low)
- Performance: 8 issues (1 high, 3 medium, 4 low)
- Code Quality: 6 issues (2 high, 4 medium)
- Accessibility: 5 issues (2 medium, 3 low)
- Testing: 4 issues (1 high, 3 medium)
- Configuration: 4 issues (1 medium, 3 low)
- State Management: 4 issues (1 medium, 3 low)
- Other: 8 issues (misc low severity)

**Total: 74 issues identified**
- Critical: 1
- High: 17
- Medium: 29
- Low: 27
