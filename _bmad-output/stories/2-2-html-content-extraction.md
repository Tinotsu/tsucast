# Story 2.2: HTML Content Extraction

Status: done
Last Updated: 2026-01-21

## Story

As a user who pasted an article URL,
I want the article content extracted cleanly,
so that only the article text is converted to audio.

## Acceptance Criteria

1. **AC1: Clean Content Extraction**
   - Given user submits a valid HTML page URL
   - When the API processes it
   - Then article content is extracted using Mozilla Readability
   - And navigation, ads, and headers are removed
   - And title is extracted
   - And word count is calculated

2. **AC2: Word Count Limit**
   - Given article has > 15,000 words
   - When extraction completes
   - Then request is rejected with: "Article is too long (max 15,000 words)"

3. **AC3: Paywall Detection**
   - Given page is behind a paywall
   - When extraction fails
   - Then user sees: "This article appears to be behind a paywall"

4. **AC4: Extraction Success**
   - Given extraction succeeds
   - When content is ready
   - Then title and word count are returned
   - And user can proceed to audio generation

## Tasks / Subtasks

### Task 1: VPS API Server Setup (AC: all)
- [ ] 1.1 Initialize `apps/api/` with Node.js + Hono:
  ```bash
  cd apps/api
  npm init -y
  npm install hono @hono/node-server
  npm install -D typescript @types/node tsx
  ```
- [ ] 1.2 Create `apps/api/src/index.ts` entry point:
  ```typescript
  import { serve } from '@hono/node-server';
  import { Hono } from 'hono';
  import { cors } from 'hono/cors';
  import generate from './routes/generate';

  const app = new Hono();
  app.use('*', cors());
  app.route('/api', generate);

  serve({ fetch: app.fetch, port: 3000 });
  ```
- [ ] 1.3 Configure TypeScript (`tsconfig.json`)
- [ ] 1.4 Add dev/build scripts to `package.json`
- [ ] 1.5 Create Dockerfile for Dokploy deployment

### Task 2: Content Parser Service (AC: 1)
- [ ] 2.1 Install parsing dependencies:
  ```bash
  npm install @mozilla/readability linkedom
  ```
- [ ] 2.2 Create `apps/api/src/services/parser.ts`:
  ```typescript
  import { Readability } from '@mozilla/readability';
  import { parseHTML } from 'linkedom';

  export interface ParseResult {
    title: string;
    content: string;
    textContent: string;
    wordCount: number;
  }

  export async function parseHtmlContent(html: string, url: string): Promise<ParseResult> {
    const { document } = parseHTML(html);

    // Set base URL for relative links
    const base = document.createElement('base');
    base.href = url;
    document.head.appendChild(base);

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      throw new Error('PARSE_FAILED');
    }

    const wordCount = article.textContent
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent,
      wordCount
    };
  }
  ```

### Task 3: URL Fetcher Service (AC: 1, 3)
- [ ] 3.1 Create `apps/api/src/services/fetcher.ts`:
  ```typescript
  export async function fetchUrl(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; tsucast/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('PAYWALL_DETECTED');
      }
      throw new Error(`FETCH_FAILED: ${response.status}`);
    }

    return response.text();
  }
  ```
- [ ] 3.2 Handle common paywall indicators:
  - 403/401 status codes
  - Content length < 1000 chars with login prompts
  - Common paywall meta tags
- [ ] 3.3 Add retry logic for transient failures (1 retry)

### Task 4: Generate Route - Parse Step (AC: 1, 2, 3, 4)
- [ ] 4.1 Create `apps/api/src/routes/generate.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { fetchUrl } from '../services/fetcher';
  import { parseHtmlContent } from '../services/parser';

  const generate = new Hono();

  generate.post('/generate', async (c) => {
    const { url, voiceId } = await c.req.json();

    // 1. Fetch HTML
    let html: string;
    try {
      html = await fetchUrl(url);
    } catch (error) {
      if (error.message === 'PAYWALL_DETECTED') {
        return c.json({
          error: { code: 'PAYWALL_DETECTED', message: 'This article appears to be behind a paywall' }
        }, 422);
      }
      return c.json({
        error: { code: 'FETCH_FAILED', message: 'Could not fetch the article' }
        }, 422);
    }

    // 2. Parse content
    let parsed;
    try {
      parsed = await parseHtmlContent(html, url);
    } catch (error) {
      return c.json({
        error: { code: 'PARSE_FAILED', message: "Couldn't extract content from this URL" }
      }, 422);
    }

    // 3. Validate word count
    if (parsed.wordCount > 15000) {
      return c.json({
        error: {
          code: 'ARTICLE_TOO_LONG',
          message: `Article is too long (${parsed.wordCount.toLocaleString()} words, max 15,000)`
        }
      }, 422);
    }

    // 4. Continue to TTS generation (Story 3.2)
    return c.json({
      title: parsed.title,
      wordCount: parsed.wordCount,
      // audioUrl will be added in Story 3.2
    });
  });

  export default generate;
  ```
- [ ] 4.2 Add input validation (URL format check)
- [ ] 4.3 Add request logging

### Task 5: Supabase Database Client (AC: 4)
- [ ] 5.1 Install Supabase server client:
  ```bash
  npm install @supabase/supabase-js
  ```
- [ ] 5.2 Create `apps/api/src/services/supabase.ts`:
  ```typescript
  import { createClient } from '@supabase/supabase-js';

  export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  ```
- [ ] 5.3 Test database connection on startup

### Task 6: Error Response Standardization (AC: 2, 3)
- [ ] 6.1 Create `apps/api/src/utils/errors.ts`:
  ```typescript
  export interface ApiError {
    code: string;
    message: string;
    details?: any;
  }

  export const ErrorCodes = {
    PARSE_FAILED: "Couldn't extract content from this URL",
    PAYWALL_DETECTED: 'This article appears to be behind a paywall',
    ARTICLE_TOO_LONG: 'Article is too long (max 15,000 words)',
    FETCH_FAILED: 'Could not fetch the article',
    TTS_FAILED: 'Audio generation failed. Please try again.',
  } as const;
  ```
- [ ] 6.2 Create error response helper function

### Task 7: Mobile Client Integration (AC: 4)
- [ ] 7.1 Update `services/api.ts` with generate endpoint:
  ```typescript
  export async function generateAudio(url: string, voiceId: string): Promise<GenerateResult> {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url, voiceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.error.code, error.error.message);
    }

    return response.json();
  }
  ```
- [ ] 7.2 Handle API errors in Add screen
- [ ] 7.3 Show user-friendly error messages

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- VPS handles all content fetching (no Edge Function limits)
- Mozilla Readability for HTML parsing (proven, reliable)
- linkedom for server-side DOM (lighter than jsdom)
- 15,000 word limit enforced server-side
- Supabase service role key used server-side only

**Content Extraction Flow:**
1. Receive URL from client
2. Fetch HTML with proper User-Agent
3. Parse with Readability (removes cruft)
4. Validate word count
5. Return parsed content (or error)

### Source Tree Components

```
apps/api/
├── src/
│   ├── index.ts            # Server entry point
│   ├── routes/
│   │   └── generate.ts     # POST /api/generate
│   ├── services/
│   │   ├── fetcher.ts      # URL fetching
│   │   ├── parser.ts       # HTML parsing
│   │   └── supabase.ts     # Database client
│   └── utils/
│       └── errors.ts       # Error codes/messages
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Testing Standards

- Test valid article URL → clean extraction
- Test paywall URL (e.g., NYTimes) → paywall error
- Test extremely long article → word count error
- Test invalid URL → fetch error
- Test non-article page (homepage) → parse error
- Test various site structures (Medium, Substack, blogs)

### Key Technical Decisions

1. **Readability:** Battle-tested library used by Firefox Reader View
2. **linkedom:** Lighter than jsdom, sufficient for Readability
3. **Word Count:** Simple whitespace split, accurate enough for limits
4. **Paywall Heuristics:** Status codes + content analysis

### Dependencies

- Story 2-1 must be completed (URL input exists)
- VPS infrastructure must be ready (Hetzner + Dokploy)

### References

- [Source: architecture-v2.md#Flow-1-Content-Generation]
- [Source: architecture-v2.md#API-Endpoints]
- [Source: epics.md#Story-2.2-HTML-Content-Extraction]
- [Source: prd.md#FR3]
- [Mozilla Readability](https://github.com/mozilla/readability)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | All tasks implemented | Claude Opus 4.5 |

### File List

**VPS API (apps/api/):**
- `src/services/parser.ts` - HTML parsing with Mozilla Readability
- `src/services/fetcher.ts` - URL fetching with paywall detection
- `src/utils/errors.ts` - Error codes and messages
- `src/routes/generate.ts` - Updated with content extraction
- `__tests__/unit/parser.test.ts` - Parser tests
- `__tests__/unit/fetcher.test.ts` - Fetcher tests
- `__tests__/unit/errors.test.ts` - Error utilities tests
