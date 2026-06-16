import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RangeSchema = z.object({
  from: z.string().datetime().nullable().optional(),
  to: z.string().datetime().nullable().optional(),
});

export const getCountryBreakdown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");

    let q = supabaseAdmin
      .from("page_visits")
      .select("country,visitor_hash,created_at")
      .limit(10000);
    if (data.from) q = q.gte("created_at", data.from);
    if (data.to) q = q.lte("created_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error("Could not load country data.");

    const byCountry: Record<string, Set<string>> = {};
    for (const r of rows ?? []) {
      const key = (r as { country?: string | null }).country ?? "Unknown";
      if (!byCountry[key]) byCountry[key] = new Set();
      byCountry[key].add(r.visitor_hash);
    }
    const entries = Object.entries(byCountry)
      .map(([country, set]) => ({ country, visitors: set.size }))
      .sort((a, b) => b.visitors - a.visitors);
    return { breakdown: entries };
  });