-- Error tracking table for client + server errors
CREATE TABLE public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('client', 'server')),
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warn', 'info')),
  message text NOT NULL,
  stack text,
  path text,
  user_agent text,
  visitor_hash text,
  user_id uuid,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_log_created_at ON public.error_log (created_at DESC);
CREATE INDEX idx_error_log_source ON public.error_log (source, created_at DESC);

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read errors. Inserts happen via service-role from server fns.
CREATE POLICY "Admins can view error log"
  ON public.error_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete error log"
  ON public.error_log FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));