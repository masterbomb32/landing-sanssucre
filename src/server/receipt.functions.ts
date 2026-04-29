import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CodeSchema = z.object({ code: z.string().min(8).max(64) });

export const fetchReceipt = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => CodeSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("signups")
      .select("id, name, email, reward_choice, redemption_code, redeemed_at, created_at")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (error) throw new Error("Could not load receipt.");
    if (!row) return null;
    return row;
  });

const PH_MOBILE = /^(\+?63|0)?9\d{9}$/;

function normalizeMobile(input: string): string {
  return input.replace(/\s|-/g, "").replace(/^\+?63/, "0");
}

const FindSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .refine((v) => PH_MOBILE.test(v.replace(/\s|-/g, "")), {
      message: "Please enter a valid Philippine mobile number.",
    }),
});

// Simple in-memory throttle (per Worker instance). For opening day, this is enough
// to deter casual scraping; not a hardened rate limiter.
const attemptMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export const findReceiptByMobile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FindSchema.parse(input))
  .handler(async ({ data }) => {
    const mobile = normalizeMobile(data.mobile);
    const now = Date.now();
    const entry = attemptMap.get(mobile);
    if (entry && entry.resetAt > now) {
      if (entry.count >= MAX_ATTEMPTS) {
        return { found: false as const, throttled: true as const };
      }
      entry.count += 1;
    } else {
      attemptMap.set(mobile, { count: 1, resetAt: now + WINDOW_MS });
    }

    const { data: row } = await supabaseAdmin
      .from("signups")
      .select("redemption_code")
      .eq("mobile", mobile)
      .maybeSingle();

    if (!row?.redemption_code) {
      return { found: false as const, throttled: false as const };
    }
    return { found: true as const, code: row.redemption_code };
  });
