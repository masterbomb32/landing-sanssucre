
-- New RPC for anonymous public story submissions (with required rating)
CREATE OR REPLACE FUNCTION public.submit_testimonial_public(
  p_name text,
  p_quote text,
  p_rating smallint,
  p_source text,
  p_photo_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_quote text;
  v_id uuid;
BEGIN
  v_name := NULLIF(btrim(COALESCE(p_name, '')), '');
  v_quote := NULLIF(btrim(COALESCE(p_quote, '')), '');

  IF v_name IS NULL OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME';
  END IF;
  IF v_quote IS NULL OR char_length(v_quote) < 5 OR char_length(v_quote) > 1000 THEN
    RAISE EXCEPTION 'INVALID_QUOTE';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'INVALID_RATING';
  END IF;

  INSERT INTO public.testimonials (
    name, quote, rating, signup_id, comment_only, published, photo_url, source
  ) VALUES (
    LEFT(v_name, 100),
    LEFT(v_quote, 1000),
    p_rating,
    NULL,
    false,
    false,
    NULLIF(LEFT(COALESCE(p_photo_url, ''), 500), ''),
    NULLIF(LEFT(COALESCE(p_source, ''), 100), '')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.submit_testimonial_public(text, text, smallint, text, text) TO anon, authenticated;

-- Drop the anon INSERT policy; submissions now go through the RPC for a single trust boundary
DROP POLICY IF EXISTS "Anyone can submit a testimonial" ON public.testimonials;
