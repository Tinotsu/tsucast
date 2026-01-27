-- Migration: Email sequence system for onboarding and transactional emails
-- Tech-Spec: Pre-Launch Readiness — Analytics & Email Sequences

-- =============================================================================
-- 1. email_templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on email_templates" ON public.email_templates;
CREATE POLICY "Service role full access on email_templates"
  ON public.email_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 2. email_sequences
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on email_sequences" ON public.email_sequences;
CREATE POLICY "Service role full access on email_sequences"
  ON public.email_sequences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 3. email_sequence_steps
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER email_sequence_steps_updated_at
  BEFORE UPDATE ON public.email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on email_sequence_steps" ON public.email_sequence_steps;
CREATE POLICY "Service role full access on email_sequence_steps"
  ON public.email_sequence_steps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 4. user_email_state
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_email_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  send_failures INTEGER NOT NULL DEFAULT 0,
  paused BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_email_state_unique UNIQUE (user_id, sequence_id)
);

CREATE TRIGGER user_email_state_updated_at
  BEFORE UPDATE ON public.user_email_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_email_state ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_email_state_user_id
  ON public.user_email_state (user_id);

CREATE INDEX IF NOT EXISTS idx_user_email_state_queue
  ON public.user_email_state (sequence_id, completed_at)
  WHERE completed_at IS NULL;

-- RLS policies
DROP POLICY IF EXISTS "Service role full access on user_email_state" ON public.user_email_state;
CREATE POLICY "Service role full access on user_email_state"
  ON public.user_email_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own email state" ON public.user_email_state;
CREATE POLICY "Users can read own email state"
  ON public.user_email_state
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- 5. Seed Data: Templates
-- =============================================================================

INSERT INTO public.email_templates (slug, subject, html_body, text_body) VALUES
(
  'welcome',
  'Welcome to tsucast!',
  '<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;"><h1 style="color:#000;">Welcome to tsucast!</h1><p>Hi {{name}},</p><p>Thanks for joining tsucast! Here''s how to get started:</p><ol><li>Open the app and paste any article URL</li><li>Pick a voice you like</li><li>Hit generate and listen in seconds</li></ol><p>Happy listening!</p><p style="color:#666;font-size:12px;margin-top:40px;">If you no longer wish to receive these emails, <a href="{{unsubscribeUrl}}">unsubscribe</a>.</p></body></html>',
  E'Welcome to tsucast!\n\nHi {{name}},\n\nThanks for joining tsucast! Here''s how to get started:\n\n1. Open the app and paste any article URL\n2. Pick a voice you like\n3. Hit generate and listen in seconds\n\nHappy listening!\n\nUnsubscribe: {{unsubscribeUrl}}'
),
(
  'onboarding-day-3',
  'Tips to get more from tsucast',
  '<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;"><h1 style="color:#000;">Get more from tsucast</h1><p>Here are a few tips to make the most of your experience:</p><ul><li><strong>Try different voices</strong> — Each voice has a unique tone. Find the one that feels right for you.</li><li><strong>Save to your library</strong> — Tap the bookmark icon to save articles for later listening.</li><li><strong>Create playlists</strong> — Group related articles together for focused listening sessions.</li></ul><p>Enjoy!</p><p style="color:#666;font-size:12px;margin-top:40px;">If you no longer wish to receive these emails, <a href="{{unsubscribeUrl}}">unsubscribe</a>.</p></body></html>',
  E'Get more from tsucast\n\nHere are a few tips:\n\n- Try different voices — Each voice has a unique tone.\n- Save to your library — Tap the bookmark icon.\n- Create playlists — Group related articles together.\n\nEnjoy!\n\nUnsubscribe: {{unsubscribeUrl}}'
),
(
  'onboarding-day-7',
  'Ready for more? Your credits await',
  '<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;"><h1 style="color:#000;">Ready for more?</h1><p>You''ve been using tsucast for a week now. If you''re enjoying turning articles into audio, check out our credit packs for more generations.</p><p><a href="https://tsucast.app/pricing" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">View Credit Packs</a></p><p>Thanks for being part of tsucast!</p><p style="color:#666;font-size:12px;margin-top:40px;">If you no longer wish to receive these emails, <a href="{{unsubscribeUrl}}">unsubscribe</a>.</p></body></html>',
  E'Ready for more?\n\nYou''ve been using tsucast for a week now. If you''re enjoying turning articles into audio, check out our credit packs:\n\nhttps://tsucast.app/pricing\n\nThanks for being part of tsucast!\n\nUnsubscribe: {{unsubscribeUrl}}'
),
(
  'purchase-confirmation',
  'Your {{packName}} pack is ready!',
  '<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;"><h1 style="color:#000;">Purchase Confirmed</h1><p>Your <strong>{{packName}}</strong> pack is ready!</p><p>We''ve added <strong>{{credits}} credits</strong> to your account. Amount charged: ${{amount}}.</p><p>Open the app and start generating.</p><p>Happy listening!</p></body></html>',
  E'Purchase Confirmed\n\nYour {{packName}} pack is ready!\n\nWe''ve added {{credits}} credits to your account. Amount charged: ${{amount}}.\n\nOpen the app and start generating.\n\nHappy listening!'
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 6. Seed Data: Onboarding Sequence
-- =============================================================================

INSERT INTO public.email_sequences (slug, name, is_active) VALUES
  ('onboarding', 'Onboarding Drip', true)
ON CONFLICT (slug) DO NOTHING;

-- Link sequence steps (welcome immediately, tips at day 3, upgrade at day 7)
INSERT INTO public.email_sequence_steps (sequence_id, template_id, step_order, delay_hours)
SELECT
  s.id,
  t.id,
  steps.step_order,
  steps.delay_hours
FROM (VALUES
  ('welcome', 1, 0),
  ('onboarding-day-3', 2, 72),
  ('onboarding-day-7', 3, 168)
) AS steps(template_slug, step_order, delay_hours)
JOIN public.email_sequences s ON s.slug = 'onboarding'
JOIN public.email_templates t ON t.slug = steps.template_slug
ON CONFLICT DO NOTHING;
