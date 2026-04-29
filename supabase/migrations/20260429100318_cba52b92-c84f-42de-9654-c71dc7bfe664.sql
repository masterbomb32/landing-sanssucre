-- Track share button events from landing/receipt/redeemed pages
CREATE TABLE public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_hash text NOT NULL,
  channel text NOT NULL, -- 'native', 'copy', 'whatsapp', 'facebook', 'dialog_open'
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a share event"
  ON public.share_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(visitor_hash) BETWEEN 8 AND 128
    AND char_length(channel) BETWEEN 1 AND 32
    AND char_length(path) BETWEEN 1 AND 200
  );

CREATE POLICY "Admins can view share events"
  ON public.share_events
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_share_events_created_at ON public.share_events (created_at DESC);
CREATE INDEX idx_share_events_channel ON public.share_events (channel);