-- Signups table
CREATE TABLE public.signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  reward_choice TEXT NOT NULL,
  redemption_code TEXT NOT NULL UNIQUE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX signups_redemption_code_idx ON public.signups (redemption_code);
CREATE INDEX signups_created_at_idx ON public.signups (created_at DESC);

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous public signups (insert only). Reads/updates are server-only via service role.
CREATE POLICY "Anyone can submit a signup"
  ON public.signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Page visits table
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_hash TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX page_visits_visitor_hash_idx ON public.page_visits (visitor_hash);
CREATE INDEX page_visits_created_at_idx ON public.page_visits (created_at DESC);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a page visit"
  ON public.page_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Helper function: atomically mark a code as redeemed.
-- Returns the row if successfully redeemed; raises exception if not found or already used.
CREATE OR REPLACE FUNCTION public.redeem_signup(p_code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  mobile TEXT,
  email TEXT,
  reward_choice TEXT,
  redemption_code TEXT,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.signups%ROWTYPE;
BEGIN
  SELECT * INTO v_existing FROM public.signups WHERE redemption_code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_existing.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_REDEEMED:%', v_existing.redeemed_at;
  END IF;

  UPDATE public.signups
    SET redeemed_at = now()
    WHERE redemption_code = p_code
    RETURNING * INTO v_existing;

  RETURN QUERY SELECT
    v_existing.id, v_existing.name, v_existing.mobile, v_existing.email,
    v_existing.reward_choice, v_existing.redemption_code,
    v_existing.redeemed_at, v_existing.created_at;
END;
$$;