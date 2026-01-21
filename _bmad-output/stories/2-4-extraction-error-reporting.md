# Story 2.4: Extraction Error Reporting

Status: done
Last Updated: 2026-01-21

## Story

As a user whose URL failed to parse,
I want to report the failure,
so that parsing can be improved for that site.

## Acceptance Criteria

1. **AC1: Report Button on Error**
   - Given content extraction fails
   - When user sees the error
   - Then they see a "Report" button alongside the error message

2. **AC2: Report Submission**
   - Given user taps "Report"
   - When report is submitted
   - Then URL and error type are stored in `extraction_reports` table
   - And user sees: "Thanks! We'll work on improving this."
   - And user can try a different URL

3. **AC3: Error Dismissal**
   - Given user dismisses error without reporting
   - When they tap "Try Another"
   - Then input is cleared
   - And they can paste a new URL

## Tasks / Subtasks

### Task 1: Database Migration for Reports (AC: 2)
- [ ] 1.1 Create migration `supabase/migrations/002_extraction_reports.sql`:
  ```sql
  -- Extraction failure reports for improvement
  CREATE TABLE extraction_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    normalized_url TEXT,
    error_type TEXT NOT NULL,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_agent TEXT,
    notes TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'investigating', 'fixed', 'wont_fix'
    created_at TIMESTAMPTZ DEFAULT now()
  );

  -- Index for finding reports by URL
  CREATE INDEX idx_extraction_reports_url ON extraction_reports(normalized_url);
  CREATE INDEX idx_extraction_reports_status ON extraction_reports(status);

  -- RLS: Users can insert reports, only admins can read
  ALTER TABLE extraction_reports ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can insert reports"
    ON extraction_reports FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Users cannot read reports"
    ON extraction_reports FOR SELECT
    USING (false);
  ```
- [ ] 1.2 Run migration via `npx supabase db push`

### Task 2: Report API Endpoint (AC: 2)
- [ ] 2.1 Create `apps/api/src/routes/report.ts`:
  ```typescript
  import { Hono } from 'hono';
  import { supabase } from '../services/supabase';
  import { normalizeUrl } from '../utils/urlNormalization';

  const report = new Hono();

  report.post('/report-extraction', async (c) => {
    const { url, errorType, errorMessage, notes } = await c.req.json();

    // Get user from auth header (optional)
    const authHeader = c.req.header('Authorization');
    let userId = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Normalize URL for deduplication
    let normalizedUrl = null;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch {
      // Keep original if normalization fails
    }

    // Insert report
    const { error } = await supabase
      .from('extraction_reports')
      .insert({
        url,
        normalized_url: normalizedUrl,
        error_type: errorType,
        error_message: errorMessage,
        user_id: userId,
        notes,
      });

    if (error) {
      console.error('Failed to insert report:', error);
      // Don't expose error to user, just acknowledge
    }

    return c.json({
      success: true,
      message: "Thanks! We'll work on improving this."
    });
  });

  export default report;
  ```
- [ ] 2.2 Register route in main app:
  ```typescript
  import report from './routes/report';
  app.route('/api', report);
  ```

### Task 3: Error State Component (AC: 1, 3)
- [ ] 3.1 Create `components/ui/ErrorState.tsx`:
  ```typescript
  interface ErrorStateProps {
    title: string;
    message: string;
    errorType: string;
    url: string;
    onReport: () => void;
    onDismiss: () => void;
    isReporting?: boolean;
    reportSent?: boolean;
  }

  export function ErrorState({
    title,
    message,
    errorType,
    url,
    onReport,
    onDismiss,
    isReporting,
    reportSent
  }: ErrorStateProps) {
    return (
      <View className="p-6 bg-red-50 dark:bg-red-950 rounded-xl">
        <Text className="text-lg font-semibold text-red-800 dark:text-red-200">
          {title}
        </Text>
        <Text className="mt-2 text-red-700 dark:text-red-300">
          {message}
        </Text>

        <View className="mt-4 flex-row gap-3">
          {!reportSent ? (
            <TouchableOpacity
              onPress={onReport}
              disabled={isReporting}
              className="flex-1 bg-red-100 dark:bg-red-900 py-3 rounded-lg"
            >
              <Text className="text-center text-red-800 dark:text-red-200">
                {isReporting ? 'Reporting...' : 'Report'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-1 bg-green-100 dark:bg-green-900 py-3 rounded-lg">
              <Text className="text-center text-green-800 dark:text-green-200">
                Thanks!
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onDismiss}
            className="flex-1 bg-amber-500 py-3 rounded-lg"
          >
            <Text className="text-center text-white font-medium">
              Try Another
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  ```

### Task 4: Mobile Report Service (AC: 2)
- [ ] 4.1 Add report function to `services/api.ts`:
  ```typescript
  export async function reportExtractionFailure(
    url: string,
    errorType: string,
    errorMessage: string,
    notes?: string
  ): Promise<void> {
    const token = await getAuthToken();

    await fetch(`${API_URL}/api/report-extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        url,
        errorType,
        errorMessage,
        notes,
      }),
    });
  }
  ```
- [ ] 4.2 Handle network errors gracefully (report silently fails)

### Task 5: Integrate Error State in Add Screen (AC: 1, 2, 3)
- [ ] 5.1 Update `app/(tabs)/index.tsx` to handle errors:
  ```typescript
  const [error, setError] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [reportSent, setReportSent] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async () => {
    if (!error || !url) return;
    setIsReporting(true);
    try {
      await reportExtractionFailure(url, error.type, error.message);
      setReportSent(true);
    } finally {
      setIsReporting(false);
    }
  };

  const handleDismiss = () => {
    setUrl('');
    setError(null);
    setReportSent(false);
  };
  ```
- [ ] 5.2 Show ErrorState component when error exists
- [ ] 5.3 Reset report state when URL changes

### Task 6: Error Type Mapping (AC: 1)
- [ ] 6.1 Create error type constants in `constants/errors.ts`:
  ```typescript
  export const ExtractionErrorTypes = {
    PARSE_FAILED: 'parse_failed',
    PAYWALL_DETECTED: 'paywall_detected',
    ARTICLE_TOO_LONG: 'article_too_long',
    IMAGE_ONLY_PDF: 'image_only_pdf',
    PDF_PASSWORD_PROTECTED: 'pdf_password_protected',
    FETCH_FAILED: 'fetch_failed',
    PDF_TOO_LARGE: 'pdf_too_large',
  } as const;

  export const ErrorMessages: Record<string, { title: string; message: string }> = {
    parse_failed: {
      title: 'Extraction Failed',
      message: "We couldn't extract content from this URL.",
    },
    paywall_detected: {
      title: 'Paywall Detected',
      message: 'This article appears to be behind a paywall.',
    },
    // ... etc
  };
  ```

### Task 7: Admin Report Viewing (AC: 2)
- [ ] 7.1 Document SQL query for viewing reports:
  ```sql
  -- View all new reports (run in Supabase dashboard)
  SELECT
    url,
    error_type,
    error_message,
    created_at
  FROM extraction_reports
  WHERE status = 'new'
  ORDER BY created_at DESC;
  ```
- [ ] 7.2 Add to project documentation for manual review process

## Dev Notes

### Architecture Patterns & Constraints

**From Architecture v2.2:**
- Reports stored in Supabase PostgreSQL
- RLS prevents users from reading others' reports
- Service role key used for inserts (authenticated optional)
- Manual review process (no automated fixes)

**Report Flow:**
1. User encounters extraction error
2. User taps "Report"
3. Report sent to VPS → Supabase
4. User sees confirmation
5. Admin reviews reports periodically
6. Parsing improvements deployed

### Source Tree Components

```
apps/mobile/
├── app/(tabs)/
│   └── index.tsx            # Error handling integration
├── components/ui/
│   └── ErrorState.tsx       # Error display with report
├── services/
│   └── api.ts               # reportExtractionFailure()
└── constants/
    └── errors.ts            # Error types and messages

apps/api/
└── src/routes/
    └── report.ts            # POST /api/report-extraction

supabase/
└── migrations/
    └── 002_extraction_reports.sql
```

### Testing Standards

- Test report submission → success message shown
- Test report without auth → still works (anonymous)
- Test report with auth → user_id captured
- Test dismiss without reporting → input cleared
- Test network failure during report → silent failure, no error
- Test report button only shows on extraction errors

### Key Technical Decisions

1. **Anonymous Reports:** Auth optional - don't block reports
2. **Silent Failures:** Report errors don't frustrate user
3. **URL Normalization:** Helps identify duplicate reports
4. **Manual Review:** No automated fixes (too complex for MVP)

### Dependencies

- Story 2-2 must be completed (extraction errors exist)
- Database migration must run first

### References

- [Source: architecture-v2.md#Database-Schema]
- [Source: epics.md#Story-2.4-Extraction-Error-Reporting]
- [Source: prd.md#FR5]
- [Source: ux-design-specification.md#Error-Handling]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | Claude Opus 4.5 |
| 2026-01-21 | All tasks implemented | Claude Opus 4.5 |

### File List

**Database (supabase/migrations/):**
- `003_extraction_reports.sql` - extraction_reports table

**VPS API (apps/api/):**
- `src/routes/report.ts` - POST /api/report/extraction endpoint
- `src/index.ts` - Registered report routes
- `__tests__/integration/report.test.ts` - Report API tests

**Mobile App (apps/mobile/):**
- `components/ui/ErrorState.tsx` - Error display with report/dismiss
- `services/api.ts` - reportExtractionFailure() function
- `constants/errors.ts` - Error types and messages
