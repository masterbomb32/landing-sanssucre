-- Lock down the redeem function: only service_role (server-side) may call it
REVOKE ALL ON FUNCTION public.redeem_signup(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_signup(TEXT) TO service_role;

-- Tighten the public INSERT policies with input bounds (replaces "always true")
DROP POLICY IF EXISTS "Anyone can submit a signup" ON public.signups;
CREATE POLICY "Anyone can submit a signup"
  ON public.signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 100
    AND char_length(mobile) BETWEEN 7 AND 20
    AND (email IS NULL OR char_length(email) <= 254)
    AND char_length(reward_choice) BETWEEN 1 AND 50
    AND char_length(redemption_code) BETWEEN 8 AND 64
    AND redeemed_at IS NULL
  );

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
  );