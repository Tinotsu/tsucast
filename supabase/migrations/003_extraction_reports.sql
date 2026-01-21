-- Extraction failure reports for improvement
-- Story 2-4: Extraction Error Reporting

CREATE TABLE IF NOT EXISTS extraction_reports (
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
CREATE INDEX IF NOT EXISTS idx_extraction_reports_url ON extraction_reports(normalized_url);
CREATE INDEX IF NOT EXISTS idx_extraction_reports_status ON extraction_reports(status);
CREATE INDEX IF NOT EXISTS idx_extraction_reports_created ON extraction_reports(created_at DESC);

-- RLS: Users can insert reports, only admins can read
ALTER TABLE extraction_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert reports (auth optional)
CREATE POLICY "Anyone can insert reports"
    ON extraction_reports FOR INSERT
    WITH CHECK (true);

-- Policy: Only service role can read reports (admin access via dashboard)
CREATE POLICY "Service role can read reports"
    ON extraction_reports FOR SELECT
    USING (false);

-- Add comment for documentation
COMMENT ON TABLE extraction_reports IS 'Stores user-submitted reports when content extraction fails, for manual review and parser improvements';
