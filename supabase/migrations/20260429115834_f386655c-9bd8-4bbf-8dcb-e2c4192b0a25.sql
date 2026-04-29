CREATE TABLE public.mailing_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signup_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'thank_you_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mailing_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to mailing list"
ON public.mailing_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(email) >= 3
  AND char_length(email) <= 254
  AND char_length(source) <= 50
);

CREATE POLICY "Admins can view mailing subscriptions"
ON public.mailing_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_mailing_subscriptions_created_at ON public.mailing_subscriptions(created_at DESC);