import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LogSchema = z.object({
  source: z.enum(["client", "server"]).default("client"),
  level: z.enum(["error", "warn", "info"]).default("error"),
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(10000).optional(),
  path: z.string().max(200).optional(),
  userAgent: z.string().max(500).optional(),
  visitorHash: z.string().max(128).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const logClientError = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LogSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await supabaseAdmin.from("error_log").insert({
        source: data.source,
        level: data.level,
        message: data.message.slice(0, 2000),
        stack: data.stack?.slice(0, 10000) ?? null,
        path: data.path ?? null,
        user_agent: data.userAgent ?? null,
        visitor_hash: data.visitorHash ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context: (data.context ?? null) as any,
      });
    } catch (e) {
      console.error("logClientError failed", e);
    }
    return { ok: true };
  });

const ListSchema = z.object({
  limit: z.number().int().min(1).max(500).default(100),
  source: z.enum(["client", "server", "all"]).default("all"),
});

export const listErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");

    let q = supabaseAdmin
      .from("error_log")
      .select("id,source,level,message,stack,path,user_agent,created_at,context")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.source !== "all") q = q.eq("source", data.source);
    const { data: rows, error } = await q;
    if (error) throw new Error("Could not load errors.");
    return { errors: rows ?? [] };
  });

export const clearErrors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");
    const { error } = await supabaseAdmin
      .from("error_log")
      .delete()
      .lt("created_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString());
    if (error) throw new Error("Could not clear errors.");
    return { ok: true };
  });

const FunnelSchema = z.object({
  from: z.string().datetime().nullable().optional(),
  to: z.string().datetime().nullable().optional(),
});

export const getFunnel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FunnelSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");

    const fromIso = data.from ?? null;
    const toIso = data.to ?? null;

    // Unique visitors
    let vq = supabaseAdmin.from("page_visits").select("visitor_hash").limit(50000);
    if (fromIso) vq = vq.gte("created_at", fromIso);
    if (toIso) vq = vq.lte("created_at", toIso);
    const { data: visits } = await vq;
    const visitors = new Set((visits ?? []).map((v) => v.visitor_hash)).size;

    // Signups
    let sq = supabaseAdmin
      .from("signups")
      .select("id,redeemed_at,voided_at", { count: "exact" })
      .limit(50000);
    if (fromIso) sq = sq.gte("created_at", fromIso);
    if (toIso) sq = sq.lte("created_at", toIso);
    const { data: signups, count: signupCount } = await sq;
    const signupIds = (signups ?? [])
      .filter((s) => !s.voided_at)
      .map((s) => s.id);
    const redeemed = (signups ?? []).filter((s) => !!s.redeemed_at && !s.voided_at).length;

    // Feedback for those signups
    let feedback = 0;
    if (signupIds.length > 0) {
      const { count } = await supabaseAdmin
        .from("testimonials")
        .select("id", { count: "exact", head: true })
        .in("signup_id", signupIds);
      feedback = count ?? 0;
    }

    return {
      steps: {
        visitors,
        signups: signupCount ?? 0,
        redeemed,
        feedback,
      },
    };
  });