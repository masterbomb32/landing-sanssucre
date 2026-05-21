-- 1. Tighten signups insert policy to block self-voiding
DROP POLICY IF EXISTS "Anyone can submit a signup" ON public.signups;

CREATE POLICY "Anyone can submit a signup"
  ON public.signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) >= 1 AND char_length(name) <= 100
    AND char_length(mobile) >= 7 AND char_length(mobile) <= 20
    AND (email IS NULL OR char_length(email) <= 254)
    AND char_length(reward_choice) >= 1 AND char_length(reward_choice) <= 50
    AND char_length(redemption_code) >= 8 AND char_length(redemption_code) <= 64
    AND redeemed_at IS NULL
    AND voided_at IS NULL
    AND voided_by IS NULL
    AND void_reason IS NULL
  );

-- 2. Restrict the testimonial-photos bucket: size + mime types
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/avif']
WHERE id = 'testimonial-photos';

-- 3. Tighten upload policy: restrict file extensions
DROP POLICY IF EXISTS "Anyone can upload testimonial photos" ON storage.objects;

CREATE POLICY "Anyone can upload testimonial photos"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'testimonial-photos'
    AND lower(name) ~ '\.(jpe?g|png|gif|webp|avif)$'
    AND char_length(name) <= 200
  );