ALTER TABLE public.signups REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.signups;