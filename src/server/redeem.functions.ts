import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyStaffSilently } from "@/lib/push.functions";

const FeedbackSchema = z.object({
  code: z.string().trim().min(8).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  share_publicly: z.boolean().optional().default(false),
  photo_url: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  source: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.rpc("submit_testimonial_for_code", {
      p_code: data.code,
      p_rating: data.rating,
      p_comment: data.comment ?? "",
      p_share_publicly: data.share_publicly ?? false,
      p_photo_url: data.photo_url ?? "",
      p_source: data.source ?? "",
    });
    if (error) {
      const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
      if (msg.includes("ALREADY_SUBMITTED")) throw new Error("ALREADY_SUBMITTED");
      if (msg.includes("INVALID_CODE")) throw new Error("INVALID_CODE");
      if (msg.includes("NOT_REDEEMED")) throw new Error("NOT_REDEEMED");
      throw new Error("Could not save feedback. Please try again.");
    }
    return { ok: true };
  });

const CheckSchema = z.object({ code: z.string().trim().min(8).max(64) });

export const fetchFeedbackStatus = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => CheckSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: signup } = await supabaseAdmin
      .from("signups")
      .select("id")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (!signup) return { exists: false };
    const { data: fb } = await supabaseAdmin
      .from("testimonials")
      .select("rating")
      .eq("signup_id", signup.id)
      .maybeSingle();
    return { exists: true, hasFeedback: !!fb };
  });

const PrefillSchema = z.object({ code: z.string().trim().min(8).max(64) });

export const fetchSignupForCode = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => PrefillSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: signup } = await supabaseAdmin
      .from("signups")
      .select("id,name,redeemed_at")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (!signup) return { exists: false as const };
    const { data: existing } = await supabaseAdmin
      .from("testimonials")
      .select("id")
      .eq("signup_id", signup.id)
      .maybeSingle();
    return {
      exists: true as const,
      name: signup.name as string,
      redeemed: !!signup.redeemed_at,
      hasSubmission: !!existing,
    };
  });

const PublicStorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  quote: z.string().trim().min(5).max(1000),
  rating: z.number().int().min(1).max(5),
  source: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
  photo_url: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const submitPublicStory = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PublicStorySchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.rpc("submit_testimonial_public", {
      p_name: data.name,
      p_quote: data.quote,
      p_rating: data.rating,
      p_source: data.source ?? "",
      p_photo_url: data.photo_url ?? "",
    });
    if (error) {
      const msg = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`;
      if (msg.includes("INVALID_NAME")) throw new Error("INVALID_NAME");
      if (msg.includes("INVALID_QUOTE")) throw new Error("INVALID_QUOTE");
      if (msg.includes("INVALID_RATING")) throw new Error("INVALID_RATING");
      throw new Error("Could not submit. Please try again.");
    }
    return { ok: true };
  });

// ---- Offline support: prefetch unredeemed codes for the staff station ----

const PrefetchSchema = z.object({ pin: z.string().min(4).max(6) });

export const prefetchUnredeemed = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PrefetchSchema.parse(input))
  .handler(async ({ data }) => {
    // Re-verify PIN server-side so unauth callers cannot enumerate codes.
    const { data: ok, error: pinErr } = await supabaseAdmin.rpc("verify_staff_pin", {
      p_pin: data.pin,
    });
    if (pinErr || ok !== true) {
      throw new Error("INVALID_PIN");
    }
    const { data: rows, error } = await supabaseAdmin
      .from("signups")
      .select("id,redemption_code,name,reward_choice,created_at")
      .is("redeemed_at", null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .is("voided_at" as any, null)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error("Could not load codes.");
    return {
      codes: (rows ?? []).map((r) => ({
        id: r.id,
        code: r.redemption_code,
        name: r.name,
        reward_choice: r.reward_choice,
        created_at: r.created_at,
      })),
      fetchedAt: new Date().toISOString(),
    };
  });

const BatchSchema = z.object({
  pin: z.string().min(4).max(6),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        code: z.string().trim().min(8).max(64),
        redeemed_at: z.string().datetime().optional(),
      }),
    )
    .min(1)
    .max(100),
});

export type BatchOutcome = {
  id: string;
  code: string;
  status: "ok" | "already" | "invalid" | "error";
  redeemed_at?: string;
  message?: string;
};

export const redeemBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BatchSchema.parse(input))
  .handler(async ({ data }): Promise<{ results: BatchOutcome[] }> => {
    const { data: ok, error: pinErr } = await supabaseAdmin.rpc("verify_staff_pin", {
      p_pin: data.pin,
    });
    if (pinErr || ok !== true) throw new Error("INVALID_PIN");

    const results: BatchOutcome[] = [];
    for (const item of data.items) {
      const code = item.code.toUpperCase();
      const { data: row, error } = await supabaseAdmin.rpc("redeem_signup", {
        p_code: code,
      });
      if (!error) {
        const r = Array.isArray(row) ? row[0] : row;
        results.push({
          id: item.id,
          code,
          status: "ok",
          redeemed_at: r?.redeemed_at ?? new Date().toISOString(),
        });
        continue;
      }
      const errAny = error as { message?: string; details?: string; hint?: string };
      const blob = `${errAny.message ?? ""} ${errAny.details ?? ""} ${errAny.hint ?? ""}`;
      if (blob.includes("ALREADY_REDEEMED")) {
        const at = blob.split("ALREADY_REDEEMED:")[1]?.trim().split(/\s/)[0];
        results.push({ id: item.id, code, status: "already", redeemed_at: at });
      } else if (blob.includes("INVALID_CODE")) {
        results.push({ id: item.id, code, status: "invalid" });
      } else {
        results.push({ id: item.id, code, status: "error", message: errAny.message });
      }
    }
    const okCount = results.filter((r) => r.status === "ok").length;
    if (okCount > 0) {
      notifyStaffSilently(
        "Codes redeemed ✅",
        okCount === 1 ? "1 code redeemed at station." : `${okCount} codes redeemed at station.`,
        "/admin",
      );
    }
    return { results };
  });

const NotifyRedeemSchema = z.object({
  code: z.string().trim().min(8).max(64),
  name: z.string().trim().max(100).optional(),
});

/**
 * Lightweight server fn callable from any client after a successful redeem
 * RPC call, so admins on other devices get a push.
 */
export const notifyRedeem = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotifyRedeemSchema.parse(input))
  .handler(async ({ data }) => {
    let name = data.name;
    if (!name) {
      const { data: row } = await supabaseAdmin
        .from("signups")
        .select("name")
        .eq("redemption_code", data.code)
        .maybeSingle();
      name = row?.name ?? "Guest";
    }
    await notifyStaffSilently("Code redeemed ✅", `${name} · ${data.code}`, "/admin");
    return { ok: true };
  });