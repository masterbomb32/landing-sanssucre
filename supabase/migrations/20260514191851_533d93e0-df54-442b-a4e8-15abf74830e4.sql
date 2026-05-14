
-- 1. Extend testimonials
ALTER TABLE public.testimonials
  ADD COLUMN rating smallint,
  ADD COLUMN signup_id uuid,
  ADD COLUMN comment_only boolean NOT NULL DEFAULT false;

ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_rating_range CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));

ALTER TABLE public.testimonials
  ALTER COLUMN quote DROP NOT NULL;

ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_has_content CHECK (rating IS NOT NULL OR (quote IS NOT NULL AND char_length(quote) >= 5));

CREATE UNIQUE INDEX testimonials_signup_id_key
  ON public.testimonials(signup_id)
  WHERE signup_id IS NOT NULL;

-- 2. Backfill from feedback
INSERT INTO public.testimonials (name, quote, rating, signup_id, comment_only, published, created_at, updated_at)
SELECT
  COALESCE(s.name, 'Guest'),
  NULLIF(f.comment, ''),
  f.rating,
  f.signup_id,
  true,
  false,
  f.created_at,
  f.created_at
FROM public.feedback f
LEFT JOIN public.signups s ON s.id = f.signup_id
ON CONFLICT (signup_id) WHERE signup_id IS NOT NULL DO NOTHING;

-- 3. Drop the feedback table
DROP TABLE public.feedback;

-- 4. Update public-read RLS to exclude comment_only
DROP POLICY IF EXISTS "Anyone can read published testimonials" ON public.testimonials;
CREATE POLICY "Anyone can read published testimonials"
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (
    (published = true AND comment_only = false)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 5. Tighten the public INSERT policy: anonymous inserts must be public-testimonial shape
--    (signup-linked rows go through the SECURITY DEFINER RPC instead)
DROP POLICY IF EXISTS "Anyone can submit a testimonial" ON public.testimonials;
CREATE POLICY "Anyone can submit a testimonial"
  ON public.testimonials
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    published = false
    AND comment_only = false
    AND signup_id IS NULL
    AND rating IS NULL
    AND quote IS NOT NULL
    AND char_length(name) BETWEEN 1 AND 100
    AND char_length(quote) BETWEEN 5 AND 1000
    AND (photo_url IS NULL OR char_length(photo_url) <= 500)
    AND (source IS NULL OR char_length(source) <= 100)
  );

-- 6. RPC for redeem-flow submissions (validates the redemption code server-side)
CREATE OR REPLACE FUNCTION public.submit_testimonial_for_code(
  p_code text,
  p_rating smallint,
  p_comment text,
  p_share_publicly boolean,
  p_photo_url text,
  p_source text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signup public.signups%ROWTYPE;
  v_id uuid;
  v_quote text;
  v_comment_only boolean;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'INVALID_RATING';
  END IF;

  SELECT * INTO v_signup FROM public.signups WHERE redemption_code = p_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;
  IF v_signup.redeemed_at IS NULL THEN RAISE EXCEPTION 'NOT_REDEEMED'; END IF;

  IF EXISTS (SELECT 1 FROM public.testimonials WHERE signup_id = v_signup.id) THEN
    RAISE EXCEPTION 'ALREADY_SUBMITTED';
  END IF;

  v_quote := NULLIF(btrim(COALESCE(p_comment, '')), '');
  v_comment_only := NOT COALESCE(p_share_publicly, false);

  -- For public-share, require a quote of meaningful length
  IF NOT v_comment_only AND (v_quote IS NULL OR char_length(v_quote) < 5) THEN
    -- fall back to feedback-only if no usable quote
    v_comment_only := true;
  END IF;

  INSERT INTO public.testimonials (
    name, quote, rating, signup_id, comment_only, published, photo_url, source
  ) VALUES (
    LEFT(COALESCE(v_signup.name, 'Guest'), 100),
    CASE WHEN v_quote IS NULL THEN NULL ELSE LEFT(v_quote, 1000) END,
    p_rating,
    v_signup.id,
    v_comment_only,
    false,
    CASE WHEN v_comment_only THEN NULL ELSE LEFT(p_photo_url, 500) END,
    CASE WHEN v_comment_only THEN NULL ELSE LEFT(p_source, 100) END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_testimonial_for_code(text, smallint, text, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_testimonial_for_code(text, smallint, text, boolean, text, text) TO anon, authenticated;
