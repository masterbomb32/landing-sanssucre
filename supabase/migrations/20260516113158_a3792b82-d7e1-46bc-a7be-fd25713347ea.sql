
-- Phase 3: mailing list soft unsubscribe
ALTER TABLE public.mailing_subscriptions
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

CREATE POLICY "Admins can update mailing subscriptions"
  ON public.mailing_subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Phase 6: draft fields on FAQs
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS draft_question text,
  ADD COLUMN IF NOT EXISTS draft_answer text,
  ADD COLUMN IF NOT EXISTS has_draft boolean NOT NULL DEFAULT false;
