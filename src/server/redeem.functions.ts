import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FeedbackSchema = z.object({
  code: z.string().trim().min(8).max(64),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FeedbackSchema.parse(input))
  .handler(async ({ data }) => {
    // Find signup by code
    const { data: signup, error: sErr } = await supabaseAdmin
      .from("signups")
      .select("id, redeemed_at")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (sErr) throw new Error("Could not save feedback. Please try again.");
    if (!signup) throw new Error("INVALID_CODE");
    if (!signup.redeemed_at) throw new Error("NOT_REDEEMED");

    const { error } = await supabaseAdmin
      .from("feedback")
      .insert({
        signup_id: signup.id,
        rating: data.rating,
        comment: data.comment ?? null,
      });
    if (error) {
      if (`${error.message}`.toLowerCase().includes("duplicate")) {
        throw new Error("ALREADY_SUBMITTED");
      }
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
      .from("feedback")
      .select("rating")
      .eq("signup_id", signup.id)
      .maybeSingle();
    return { exists: true, hasFeedback: !!fb };
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
    return { results };
  });