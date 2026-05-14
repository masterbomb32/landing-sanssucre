import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { REWARDS } from "@/lib/rewards";

const PH_MOBILE = /^(\+?63|0)?9\d{9}$/;

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  mobile: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .refine((v) => PH_MOBILE.test(v.replace(/\s|-/g, "")), {
      message: "Please enter a valid Philippine mobile number (e.g. 09171234567).",
    }),
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  rewardChoice: z.string().refine((v) => REWARDS.some((r) => r.id === v), {
    message: "Please choose a reward.",
  }),
});

function generateCode(): string {
  // 12-char Code-128-friendly alphanumeric (no ambiguous chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function normalizeMobile(input: string): string {
  const digits = input.replace(/\s|-/g, "").replace(/^\+?63/, "0");
  return digits;
}

export const createSignup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SignupSchema.parse(input))
  .handler(async ({ data }) => {
    const mobile = normalizeMobile(data.mobile);

    // Enforce one signup per mobile (DB also has a unique constraint)
    const { data: existing } = await supabaseAdmin
      .from("signups")
      .select("redemption_code")
      .eq("mobile", mobile)
      .maybeSingle();
    if (existing?.redemption_code) {
      return { code: existing.redemption_code, alreadyRegistered: true };
    }

    // Try a handful of times in the (extremely unlikely) event of a code collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data: row, error } = await supabaseAdmin
        .from("signups")
        .insert({
          name: data.name,
          mobile,
          email: data.email ?? null,
          reward_choice: data.rewardChoice,
          redemption_code: code,
        })
        .select("redemption_code")
        .single();

      if (!error && row) {
        // Fire-and-forget notifications — added in a later step.
        return { code: row.redemption_code, alreadyRegistered: false };
      }

      if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
        console.error("createSignup error", error);
        throw new Error("Could not save your signup. Please try again.");
      }
    }
    throw new Error("Could not generate a unique code. Please try again.");
  });

const VisitSchema = z.object({
  visitorId: z.string().min(8).max(128),
  path: z.string().min(1).max(200),
  referrer: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
});

export const logVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VisitSchema.parse(input))
  .handler(async ({ data }) => {
    // Cloudflare/Lovable edge sets cf-ipcountry; fall back to common alternates.
    const country =
      getRequestHeader("cf-ipcountry") ||
      getRequestHeader("x-vercel-ip-country") ||
      getRequestHeader("x-country") ||
      null;
    const { error } = await supabaseAdmin.from("page_visits").insert({
      visitor_hash: data.visitorId,
      path: data.path,
      referrer: data.referrer ?? null,
      user_agent: data.userAgent ?? null,
      country: country && country.length <= 4 ? country.toUpperCase() : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (error) console.error("logVisit error", error);
    return { ok: true };
  });

const ShareSchema = z.object({
  visitorId: z.string().min(8).max(128),
  channel: z.enum(["native", "copy", "whatsapp", "facebook", "dialog_open"]),
  path: z.string().min(1).max(200),
});

export const logShare = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ShareSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("share_events").insert({
      visitor_hash: data.visitorId,
      channel: data.channel,
      path: data.path,
    });
    if (error) console.error("logShare error", error);
    return { ok: true };
  });