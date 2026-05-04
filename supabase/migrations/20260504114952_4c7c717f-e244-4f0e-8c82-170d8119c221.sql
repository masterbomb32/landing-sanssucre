
-- 1. Feedback: remove public SELECT policy
DROP POLICY IF EXISTS "Anyone can read own feedback" ON public.feedback;

-- 2. Signups: remove from realtime publication if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'signups'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.signups';
  END IF;
END $$;

-- 3. Redemption audit: restrict INSERT to admins only
DROP POLICY IF EXISTS "Anyone can append redemption audit" ON public.redemption_audit;

CREATE POLICY "Admins can append redemption audit"
  ON public.redemption_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Bake audit logging into redeem/unredeem RPCs so client doesn't need to insert
CREATE OR REPLACE FUNCTION public.redeem_signup(p_code text)
 RETURNS TABLE(id uuid, name text, mobile text, email text, reward_choice text, redemption_code text, redeemed_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing public.signups%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
    FROM public.signups
    WHERE public.signups.redemption_code = p_code
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_existing.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_REDEEMED:%', v_existing.redeemed_at;
  END IF;

  UPDATE public.signups
    SET redeemed_at = now()
    WHERE public.signups.redemption_code = p_code
    RETURNING * INTO v_existing;

  INSERT INTO public.redemption_audit (signup_id, code, action)
    VALUES (v_existing.id, v_existing.redemption_code, 'redeem');

  RETURN QUERY SELECT
    v_existing.id,
    v_existing.name,
    v_existing.mobile,
    v_existing.email,
    v_existing.reward_choice,
    v_existing.redemption_code,
    v_existing.redeemed_at,
    v_existing.created_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unredeem_signup(p_code text, p_window_seconds integer DEFAULT 30)
 RETURNS TABLE(id uuid, redemption_code text, redeemed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_existing public.signups%ROWTYPE;
BEGIN
  SELECT * INTO v_existing
    FROM public.signups
    WHERE public.signups.redemption_code = p_code
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF v_existing.redeemed_at IS NULL THEN
    RAISE EXCEPTION 'NOT_REDEEMED';
  END IF;

  IF (EXTRACT(EPOCH FROM (now() - v_existing.redeemed_at)) > p_window_seconds) THEN
    RAISE EXCEPTION 'WINDOW_EXPIRED';
  END IF;

  UPDATE public.signups
    SET redeemed_at = NULL
    WHERE public.signups.redemption_code = p_code
    RETURNING * INTO v_existing;

  INSERT INTO public.redemption_audit (signup_id, code, action)
    VALUES (v_existing.id, v_existing.redemption_code, 'unredeem');

  RETURN QUERY SELECT
    v_existing.id,
    v_existing.redemption_code,
    v_existing.redeemed_at;
END;
$function$;

-- 5. Restrict EXECUTE on sensitive helper functions
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_admin_if_first() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_first() TO authenticated;
