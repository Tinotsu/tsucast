-- Migration: Create faq_items table for admin-managed FAQ content on landing page
-- Allows admins to manage FAQ questions/answers displayed on the public landing page

-- Create faq_items table
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL CHECK (char_length(question) <= 500),
  answer TEXT NOT NULL CHECK (char_length(answer) <= 5000),
  position INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on position for ordered queries
CREATE INDEX IF NOT EXISTS idx_faq_items_position ON public.faq_items(position);

-- Index on published for filtered queries
CREATE INDEX IF NOT EXISTS idx_faq_items_published ON public.faq_items(published);

-- Enable Row Level Security
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read published FAQ items (public endpoint)
DROP POLICY IF EXISTS "Anyone can read published FAQ items" ON public.faq_items;
CREATE POLICY "Anyone can read published FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (published = true);

-- RLS Policy: Service role can do everything (for API server)
DROP POLICY IF EXISTS "Service role manages FAQ items" ON public.faq_items;
CREATE POLICY "Service role manages FAQ items"
  ON public.faq_items
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger to update updated_at on changes
DROP TRIGGER IF EXISTS faq_items_updated_at ON public.faq_items;
CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT SELECT ON public.faq_items TO anon;
GRANT ALL ON public.faq_items TO service_role;

-- Seed initial FAQ items for testing
INSERT INTO public.faq_items (question, answer, position, published) VALUES
  ('What links work with tsucast?', 'tsucast works with most text-based content: articles, blog posts, newsletters, PDFs, and documentation. If it has readable text, we can convert it to audio.', 0, true),
  ('What doesn''t work?', 'Paywalled content (unless you have access), videos, social media posts with mostly images, and very short content (under 100 words) may not work well.', 1, true),
  ('How long can articles be?', 'Articles up to 50,000 words are supported. That''s about 4-5 hours of audio. Most articles convert in under 10 seconds.', 2, true),
  ('Is there a free trial?', 'Yes! You can listen to our free samples on the landing page without signing up. When you create an account, you get free credits to try the full experience.', 3, true)
ON CONFLICT DO NOTHING;
