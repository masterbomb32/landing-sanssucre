-- 1. Soft-delete on signups
ALTER TABLE public.signups
  ADD COLUMN IF NOT EXISTS voided_at timestamptz,
  ADD COLUMN IF NOT EXISTS voided_by uuid,
  ADD COLUMN IF NOT EXISTS void_reason text;

CREATE INDEX IF NOT EXISTS signups_voided_at_idx ON public.signups (voided_at);

-- 2. Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_signup_id uuid NOT NULL REFERENCES public.signups(id) ON DELETE CASCADE,
  referred_signup_id uuid NOT NULL UNIQUE REFERENCES public.signups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_signup_id);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  quote text NOT NULL,
  photo_url text,
  source text,
  published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published testimonials"
  ON public.testimonials FOR SELECT TO anon, authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Anyone can submit a testimonial"
  ON public.testimonials FOR INSERT TO anon, authenticated
  WITH CHECK (
    published = false
    AND char_length(name) BETWEEN 1 AND 100
    AND char_length(quote) BETWEEN 5 AND 1000
    AND (photo_url IS NULL OR char_length(photo_url) <= 500)
    AND (source IS NULL OR char_length(source) <= 100)
  );
CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. FAQs
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published faqs"
  ON public.faqs FOR SELECT TO anon, authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can insert faqs"
  ON public.faqs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update faqs"
  ON public.faqs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete faqs"
  ON public.faqs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Staff push subscriptions
CREATE TABLE IF NOT EXISTS public.staff_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_push_user_idx ON public.staff_push_subscriptions(user_id);
ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view push subs"
  ON public.staff_push_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users can register own push sub"
  ON public.staff_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own push sub"
  ON public.staff_push_subscriptions FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Storage bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('testimonial-photos', 'testimonial-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read testimonial photos"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'testimonial-photos');
CREATE POLICY "Anyone can upload testimonial photos"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'testimonial-photos');
CREATE POLICY "Admins can delete testimonial photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'testimonial-photos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. updated_at trigger function (idempotent) + triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS testimonials_touch ON public.testimonials;
CREATE TRIGGER testimonials_touch BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS faqs_touch ON public.faqs;
CREATE TRIGGER faqs_touch BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 8. Seed starter FAQs
INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('When does Sans Sucre open?', 'Opening day details are shown on the home page countdown.', 10),
  ('How do I claim my reward?', 'Show the redemption code (or QR) from your receipt page to our staff at the counter on opening day.', 20),
  ('Is the reward free?', 'Yes — your chosen reward is free with your first visit, no purchase required.', 30),
  ('Can I sign up more than once?', 'One reward per mobile number. If you''ve already signed up, use "Find my code" to retrieve it.', 40),
  ('Where are you located?', 'See the Visit Us section below for the map and directions.', 50),
  ('What if I lose my code?', 'Use the "Find my code" page and we''ll resend it to your registered mobile number.', 60),
  ('Do you offer dine-in seating?', 'Yes, limited indoor seating is available. Take-out is also welcome.', 70),
  ('How can I contact you?', 'Reach us via the social links in the footer or visit during opening hours.', 80)
ON CONFLICT DO NOTHING;