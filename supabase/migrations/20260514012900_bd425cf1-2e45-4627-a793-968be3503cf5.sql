
-- 1. Audit log for admin manual signup edits
CREATE TABLE public.signup_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id uuid NOT NULL REFERENCES public.signups(id) ON DELETE CASCADE,
  edited_by uuid REFERENCES auth.users(id),
  before jsonb NOT NULL,
  after jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX signup_edits_signup_id_idx ON public.signup_edits(signup_id);
CREATE INDEX signup_edits_created_at_idx ON public.signup_edits(created_at DESC);

ALTER TABLE public.signup_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view signup edits"
  ON public.signup_edits
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2. Country column on page_visits (populated server-side from CF headers)
ALTER TABLE public.page_visits
  ADD COLUMN country text;

CREATE INDEX page_visits_country_idx ON public.page_visits(country) WHERE country IS NOT NULL;

-- Tighten the existing INSERT check to allow the new optional column
DROP POLICY IF EXISTS "Anyone can log a page visit" ON public.page_visits;
CREATE POLICY "Anyone can log a page visit"
  ON public.page_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) BETWEEN 8 AND 128
    AND char_length(path) BETWEEN 1 AND 200
    AND (referrer IS NULL OR char_length(referrer) <= 500)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
    AND (country IS NULL OR char_length(country) <= 4)
  );
