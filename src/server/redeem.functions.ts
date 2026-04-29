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