# Story 2.1: URL Input & Validation

Status: done
Last Updated: 2026-01-21

## Story

As a user with an article to listen to,
I want to paste a URL into tsucast,
so that the content can be extracted for audio generation.

## Acceptance Criteria

1. **AC1: Add Screen Layout**
   - Given user is on Add screen
   - When screen loads
   - Then they see a prominent paste input field
   - And voice selector below it
   - And "Generate" button

2. **AC2: Valid URL Handling**
   - Given user pastes a URL
   - When URL is valid (http/https)
   - Then URL is normalized (lowercase, remove tracking params)
   - And cache check is performed
   - And if cached: user sees "Ready to play" with instant play option

3. **AC3: Invalid URL Handling**
   - Given user pastes invalid text
   - When it's not a valid URL
   - Then they see: "Please enter a valid URL"
   - And input field shows error state

4. **AC4: Cache Miss Flow**
   - Given URL is not cached
   - When validation passes
   - Then "Generate" button becomes active
   - And user can proceed to generation

## Tasks / Subtasks

### Task 1: Add Screen Structure (AC: 1)
- [x] 1.1 Create `app/(tabs)/index.tsx` as Add screen:
  - Large paste input area at top (60% of screen)
  - Voice selector component (placeholder for Story 3.1)
  - "Generate" button at bottom
- [x] 1.2 Style with B&W monochrome theme:
  - Background: `bg-black`
  - Input: `bg-zinc-900 border border-zinc-800`
  - Button: `bg-white text-black` (enabled) / `bg-zinc-800` (disabled)
- [x] 1.3 Implement responsive layout for various screen sizes
- [x] 1.4 Add keyboard-aware scrolling for input focus

### Task 2: Paste Input Component (AC: 1, 2, 3)
- [x] 2.1 Create `components/add/PasteInput.tsx`:
  ```typescript
  interface PasteInputProps {
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    isLoading?: boolean;
    isValid?: boolean;
    isCached?: boolean;
  }
  ```
- [x] 2.2 Implement large, tappable input area:
  - Placeholder: "Paste article URL here..."
  - Multi-line capable but single URL expected
- [x] 2.3 Add paste button/icon for quick paste from clipboard
- [x] 2.4 Show validation error state (red border, error message below)
- [x] 2.5 Show success state when URL is valid

### Task 3: URL Validation (AC: 2, 3)
- [x] 3.1 Create `utils/validation.ts` with URL validation:
  - `isValidUrl(text)` - validates http/https URLs
  - `isPdfUrl(text)` - checks for PDF URLs
  - `getUrlValidationError(text)` - returns user-friendly error messages
- [x] 3.2 Implement real-time validation on text change
- [x] 3.3 Debounce validation (300ms) to avoid excessive checks
- [x] 3.4 Handle edge cases:
  - Whitespace trimming
  - URL with/without www
  - URLs with query params
  - PDF URLs (*.pdf)

### Task 4: URL Normalization (AC: 2)
- [x] 4.1 Create `utils/urlNormalization.ts`:
  - `normalizeUrl(url)` - normalizes URL (lowercase, remove www, tracking params, etc.)
  - Removes 40+ common tracking parameters (UTM, Facebook, Google, etc.)
  - Sorts remaining query params for consistency
- [x] 4.2 Generate URL hash for cache lookup:
  - `hashUrl(normalizedUrl)` - SHA256 hash using expo-crypto
  - `normalizeAndHashUrl(url)` - convenience function for both operations

### Task 5: Cache Check API (AC: 2, 4)
- [x] 5.1 Create VPS endpoint `GET /api/cache/check`:
  - Created `apps/api/src/routes/cache.ts`
  - Validates SHA256 hash format
  - Returns `{ cached: true, audioUrl, title, duration }` if found
  - Returns `{ cached: false }` if not found
- [x] 5.2 Create mobile API client in `services/api.ts`:
  - `checkCache(urlHash)` - checks cache via VPS API
  - Handles network errors gracefully
- [x] 5.3 Call cache check after URL validation
- [x] 5.4 Show "Ready to play" UI if cached

### Task 6: Add Screen State Management (AC: all)
- [x] 6.1 Implement screen state with useState:
  ```typescript
  type AddScreenState =
    | { status: 'idle' }
    | { status: 'validating' }
    | { status: 'invalid'; error: string }
    | { status: 'checking_cache' }
    | { status: 'cached'; audioUrl: string; title: string; duration?: number }
    | { status: 'ready_to_generate'; normalizedUrl: string; urlHash: string };
  ```
- [x] 6.2 Handle all state transitions:
  - idle → validating (on input change, debounced)
  - validating → invalid OR checking_cache
  - checking_cache → cached OR ready_to_generate
- [x] 6.3 Show appropriate UI for each state

### Task 7: Voice Selector Placeholder (AC: 1)
- [x] 7.1 Create placeholder `components/add/VoiceSelector.tsx`:
  - Show single default voice option
  - Disabled state (fully implemented in Story 3.1)
  - Styled with B&W theme
- [x] 7.2 Export selected voice for generation (`DEFAULT_VOICE`)

### Task 8: Generate Button (AC: 4)
- [x] 8.1 Create `components/add/GenerateButton.tsx`:
  - Disabled when URL invalid or checking cache
  - Enabled when ready_to_generate
  - Shows "Play Now" when cached
- [x] 8.2 Handle button tap:
  - If cached → logs for navigation to player (TODO in Story 3.2)
  - If not cached → logs for generation flow (TODO in Story 3.2)
- [x] 8.3 Add loading spinner during operations

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- URL normalization happens client-side before cache check
- Cache check is public endpoint (no auth required)
- URL hash uses SHA256 for deduplication
- VPS API runs on Hetzner with Dokploy

**From UX Design Specification:**
- Shazam-inspired one-action focus
- 75% of screen for primary action (paste input)
- Zero configuration - voice has working default
- < 10 seconds to first audio (cache hit = instant)

### Source Tree Components

```
apps/mobile/
├── app/(tabs)/
│   └── index.tsx           # Add screen
├── components/add/
│   ├── PasteInput.tsx      # URL input component
│   ├── VoiceSelector.tsx   # Placeholder for Story 3.1
│   └── GenerateButton.tsx  # Action button
├── services/
│   └── api.ts              # VPS API client
└── utils/
    ├── validation.ts       # URL validation
    └── urlNormalization.ts # URL normalization + hashing

apps/api/
└── src/routes/
    └── cache.ts            # GET /api/cache/check
```

### Testing Standards

- Test valid URL paste → shows valid state
- Test invalid text paste → shows error
- Test URL with tracking params → normalized correctly
- Test cached URL → shows "Ready to play"
- Test uncached URL → shows "Generate" button
- Test network error during cache check

### Key Technical Decisions

1. **Client-Side Normalization:** Normalize before API call to ensure consistent hashing
2. **SHA256 Hashing:** Secure, consistent hash for cache keys
3. **Public Cache Check:** No auth needed - just checking if URL exists
4. **Debounced Validation:** 300ms delay to avoid rapid API calls

### Dependencies

- Story 1-1 must be completed (app structure exists)
- VPS API server must be set up (basic Hono server)

### References

- [Source: architecture-v2.md#URL-Normalization]
- [Source: architecture-v2.md#Flow-1-Content-Generation]
- [Source: ux-design-specification.md#Defining-Experience]
- [Source: epics.md#Story-2.1-URL-Input-Validation]
- [Source: prd.md#FR1]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | All tasks implemented | Claude Opus 4.5 |
| 2026-01-21 | Code review: Added git tracking, created audio_cache migration, fixed Supabase singleton | Claude Opus 4.5 |

### File List

**Mobile App (apps/mobile/):**
- `app/(tabs)/index.tsx` - Add screen with state management
- `components/add/PasteInput.tsx` - URL paste input component
- `components/add/VoiceSelector.tsx` - Voice selector placeholder
- `components/add/GenerateButton.tsx` - Generate/Play button
- `utils/validation.ts` - URL validation utilities
- `utils/urlNormalization.ts` - URL normalization and hashing
- `services/api.ts` - VPS API client

**VPS API (apps/api/):**
- `src/routes/cache.ts` - GET /api/cache/check endpoint (uses Supabase singleton)
- `src/index.ts` - Added cache route registration

**Database (supabase/migrations/):**
- `002_audio_cache.sql` - audio_cache table for URL-based caching

### Review Follow-ups (Deferred)

- [ ] [LOW] Unit tests for validation.ts functions
- [ ] [LOW] Unit tests for urlNormalization.ts functions
- [ ] [LOW] Integration tests for Add screen state machine
- [ ] [LOW] Remove unused exports (SUPPORTED_CONTENT_TYPES, KNOWN_SUPPORTED_DOMAINS, extractDomain, extractPath) if not needed in future stories
