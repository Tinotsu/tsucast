# Story 2.1: URL Input & Validation

Status: ready-for-dev

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
- [ ] 1.1 Create `app/(tabs)/index.tsx` as Add screen:
  - Large paste input area at top (60% of screen)
  - Voice selector component (placeholder for Story 3.1)
  - "Generate" button at bottom
- [ ] 1.2 Style with Autumn Magic palette:
  - Background: Cream `#FFFBEB` / Deep Brown `#1C1410`
  - Input: Soft Tan `#FEF3C7` / Warm Charcoal `#292118`
  - Button: Amber `#F59E0B`
- [ ] 1.3 Implement responsive layout for various screen sizes
- [ ] 1.4 Add keyboard-aware scrolling for input focus

### Task 2: Paste Input Component (AC: 1, 2, 3)
- [ ] 2.1 Create `components/add/PasteInput.tsx`:
  ```typescript
  interface PasteInputProps {
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    isLoading?: boolean;
  }
  ```
- [ ] 2.2 Implement large, tappable input area:
  - Placeholder: "Paste article URL here..."
  - Multi-line capable but single URL expected
  - Auto-focus on screen mount (optional)
- [ ] 2.3 Add paste button/icon for quick paste from clipboard
- [ ] 2.4 Show validation error state (red border, error message below)
- [ ] 2.5 Show success state when URL is valid

### Task 3: URL Validation (AC: 2, 3)
- [ ] 3.1 Create `utils/validation.ts` with URL validation:
  ```typescript
  export function isValidUrl(text: string): boolean {
    try {
      const url = new URL(text.trim());
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  ```
- [ ] 3.2 Implement real-time validation on text change
- [ ] 3.3 Debounce validation (300ms) to avoid excessive checks
- [ ] 3.4 Handle edge cases:
  - Whitespace trimming
  - URL with/without www
  - URLs with query params
  - PDF URLs (*.pdf)

### Task 4: URL Normalization (AC: 2)
- [ ] 4.1 Create `utils/urlNormalization.ts`:
  ```typescript
  export function normalizeUrl(url: string): string {
    const parsed = new URL(url.trim());

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove www
    parsed.hostname = parsed.hostname.replace(/^www\./, '');

    // Remove trailing slash
    parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';

    // Remove tracking params
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign',
      'utm_term', 'utm_content', 'ref', 'fbclid',
      'gclid', 'mc_cid', 'mc_eid'
    ];
    trackingParams.forEach(p => parsed.searchParams.delete(p));

    // Sort remaining params
    parsed.searchParams.sort();

    // Remove fragment
    parsed.hash = '';

    return parsed.toString();
  }
  ```
- [ ] 4.2 Generate URL hash for cache lookup:
  ```typescript
  import * as Crypto from 'expo-crypto';

  export async function hashUrl(normalizedUrl: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      normalizedUrl
    );
  }
  ```

### Task 5: Cache Check API (AC: 2, 4)
- [ ] 5.1 Create VPS endpoint `GET /api/cache/check`:
  ```typescript
  // apps/api/src/routes/cache.ts
  app.get('/api/cache/check', async (c) => {
    const urlHash = c.req.query('hash');

    const cached = await db.query.audioCache.findFirst({
      where: eq(audioCache.urlHash, urlHash),
    });

    if (cached && cached.status === 'ready') {
      return c.json({
        cached: true,
        audioUrl: cached.audioUrl,
        title: cached.title,
        duration: cached.durationSeconds
      });
    }

    return c.json({ cached: false });
  });
  ```
- [ ] 5.2 Create mobile API client in `services/api.ts`:
  ```typescript
  export async function checkCache(urlHash: string): Promise<CacheResult> {
    const response = await fetch(
      `${API_URL}/api/cache/check?hash=${urlHash}`
    );
    return response.json();
  }
  ```
- [ ] 5.3 Call cache check after URL validation
- [ ] 5.4 Show "Ready to play" UI if cached

### Task 6: Add Screen State Management (AC: all)
- [ ] 6.1 Implement screen state with useState/useReducer:
  ```typescript
  type AddScreenState =
    | { status: 'idle' }
    | { status: 'validating' }
    | { status: 'invalid'; error: string }
    | { status: 'checking_cache' }
    | { status: 'cached'; audioUrl: string; title: string }
    | { status: 'ready_to_generate' };
  ```
- [ ] 6.2 Handle all state transitions:
  - idle → validating (on paste)
  - validating → invalid OR checking_cache
  - checking_cache → cached OR ready_to_generate
- [ ] 6.3 Show appropriate UI for each state

### Task 7: Voice Selector Placeholder (AC: 1)
- [ ] 7.1 Create placeholder `components/add/VoiceSelector.tsx`:
  - Show single default voice option
  - Disabled state (fully implemented in Story 3.1)
  - Styled to match design
- [ ] 7.2 Export selected voice for generation (default value)

### Task 8: Generate Button (AC: 4)
- [ ] 8.1 Create Generate button component:
  - Disabled when URL invalid or checking cache
  - Enabled when ready_to_generate
  - Shows "Play Now" when cached
- [ ] 8.2 Handle button tap:
  - If cached → navigate to player with audio
  - If not cached → proceed to generation (Story 3.2)
- [ ] 8.3 Add loading spinner during operations

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

(To be filled during implementation)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |

### File List

(To be filled after implementation)
