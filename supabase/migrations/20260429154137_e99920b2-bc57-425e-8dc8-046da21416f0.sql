-- Unredeem within a time window (cashier mis-scan recovery)
CREATE OR REPLACE FUNCTION public.unredeem_signup(p_code text, p_window_seconds int DEFAULT 30)
RETURNS TABLE(
  id uuid,
  redemption_code text,
  redeemed_at timestamp with time zone
)
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

  RETURN QUERY SELECT
    v_existing.id,
    v_existing.redemption_code,
    v_existing.redeemed_at;
END;
$function$;

-- Audit log for redemption / unredemption actions
CREATE TABLE public.redemption_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  signup_id uuid,
  code text NOT NULL,
  action text NOT NULL CHECK (action IN ('redeem', 'unredeem', 'test_redeem')),
  station text,
  note text
);

ALTER TABLE public.redemption_audit ENABLE ROW LEVEL SECURITY;

-- Anyone (the staff station, no auth) can append an audit row, with bounded fields
CREATE POLICY "Anyone can append redemption audit"
ON public.redemption_audit
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(code) BETWEEN 4 AND 64
  AND action IN ('redeem', 'unredeem', 'test_redeem')
  AND (station IS NULL OR char_length(station) <= 64)
  AND (note IS NULL OR char_length(note) <= 200)
);

-- Only admins can read audit history
CREATE POLICY "Admins can view redemption audit"
ON public.redemption_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));