-- Feedback table for post-redemption customer feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id UUID NOT NULL REFERENCES public.signups(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (signup_id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback once"
  ON public.feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(COALESCE(comment, '')) <= 500);

CREATE POLICY "Anyone can read own feedback"
  ON public.feedback
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));