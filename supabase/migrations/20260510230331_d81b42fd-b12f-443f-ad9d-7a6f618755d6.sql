
-- 1) Create admin-only staff_settings table
CREATE TABLE IF NOT EXISTS public.staff_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.staff_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read staff settings"
  ON public.staff_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert staff settings"
  ON public.staff_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update staff settings"
  ON public.staff_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Seed redeem_pin from existing site_settings if present, otherwise '1234'
INSERT INTO public.staff_settings (key, value)
SELECT 'redeem_pin',
  COALESCE(
    (SELECT
      CASE
        WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}'
        WHEN value ? 'v' THEN value ->> 'v'
        ELSE NULL
      END
     FROM public.site_settings WHERE key = 'staff.redeem_pin'),
    '1234'
  )
ON CONFLICT (key) DO NOTHING;

-- 3) Remove the public PIN row from site_settings
DELETE FROM public.site_settings WHERE key = 'staff.redeem_pin';

-- 4) verify_staff_pin: callable by anyone (anon staff at the kiosk)
CREATE OR REPLACE FUNCTION public.verify_staff_pin(p_pin text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored text;
BEGIN
  IF p_pin IS NULL OR length(p_pin) < 4 OR length(p_pin) > 6 THEN
    RETURN false;
  END IF;
  SELECT value INTO v_stored FROM public.staff_settings WHERE key = 'redeem_pin';
  IF v_stored IS NULL THEN
    RETURN false;
  END IF;
  -- Small uniform delay to blunt timing analysis
  PERFORM pg_sleep(0.05);
  RETURN v_stored = p_pin;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(text) TO anon, authenticated;

-- 5) update_staff_pin: admin-only
CREATE OR REPLACE FUNCTION public.update_staff_pin(p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'NOT_ADMIN';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^\d{4,6}$' THEN
    RAISE EXCEPTION 'INVALID_PIN';
  END IF;
  INSERT INTO public.staff_settings (key, value, updated_by, updated_at)
    VALUES ('redeem_pin', p_pin, auth.uid(), now())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_by = EXCLUDED.updated_by,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.update_staff_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_staff_pin(text) TO authenticated;

-- 6) Lock down mailing_subscriptions: only the server fn (admin client) inserts
DROP POLICY IF EXISTS "Anyone can subscribe to mailing list" ON public.mailing_subscriptions;
