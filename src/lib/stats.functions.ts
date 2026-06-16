import { createServerFn } from "@tanstack/react-start";

export const getReservationCount = createServerFn({ method: "GET" }).handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("signups")
    .select("id", { count: "exact", head: true });
  if (error) return { total: 0 };
  return { total: count ?? 0 };
});