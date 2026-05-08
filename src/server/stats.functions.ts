import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getReservationCount = createServerFn({ method: "GET" }).handler(async () => {
  const { count, error } = await supabaseAdmin
    .from("signups")
    .select("id", { count: "exact", head: true });
  if (error) return { total: 0 };
  return { total: count ?? 0 };
});