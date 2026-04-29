-- Fix ambiguous column reference in redeem_signup.
-- The RETURNS TABLE column "redemption_code" collided with the signups column
-- of the same name inside the WHERE / UPDATE statements.
CREATE OR REPLACE FUNCTION public.redeem_signup(p_code text)
RETURNS TABLE(
  id uuid,
  name text,
  mobile text,
  email text,
  reward_choice text,
  redemption_code text,
  redeemed_at timestamptz,
  created_at timestamptz
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

  IF v_existing.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_REDEEMED:%', v_existing.redeemed_at;
  END IF;

  UPDATE public.signups
    SET redeemed_at = now()
    WHERE public.signups.redemption_code = p_code
    RETURNING * INTO v_existing;

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
