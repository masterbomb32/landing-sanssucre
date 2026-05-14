import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { REWARDS } from "@/lib/rewards";

const PH_MOBILE = /^(\+?63|0)?9\d{9}$/;

function normalizeMobile(input: string): string {
  return input.replace(/\s|-/g, "").replace(/^\+?63/, "0");
}

const UpdateSignupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  mobile: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .refine((v) => PH_MOBILE.test(v.replace(/\s|-/g, "")), {
      message: "Please enter a valid Philippine mobile number.",
    })
    .optional(),
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  reward_choice: z
    .string()
    .refine((v) => REWARDS.some((r) => r.id === v), { message: "Invalid reward." })
    .optional(),
});

export const updateSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSignupSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Admin gate via has_role RPC (RLS-respecting)
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr || isAdmin !== true) {
      throw new Error("NOT_ADMIN");
    }

    // Load current row (use admin client so we get a clean snapshot)
    const { data: before, error: loadErr } = await supabaseAdmin
      .from("signups")
      .select("id,name,mobile,email,reward_choice")
      .eq("id", data.id)
      .single();
    if (loadErr || !before) throw new Error("NOT_FOUND");

    const patch: { name?: string; mobile?: string; email?: string | null; reward_choice?: string } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.mobile !== undefined) patch.mobile = normalizeMobile(data.mobile);
    if (data.email !== undefined) patch.email = data.email ?? null;
    if (data.reward_choice !== undefined) patch.reward_choice = data.reward_choice;

    if (Object.keys(patch).length === 0) {
      return { ok: true, signup: before, unchanged: true };
    }

    // Mobile uniqueness check (skip if unchanged)
    if (patch.mobile && patch.mobile !== before.mobile) {
      const { data: clash } = await supabaseAdmin
        .from("signups")
        .select("id")
        .eq("mobile", patch.mobile)
        .neq("id", data.id)
        .maybeSingle();
      if (clash) throw new Error("MOBILE_TAKEN");
    }

    const { data: after, error: upErr } = await supabaseAdmin
      .from("signups")
      .update(patch)
      .eq("id", data.id)
      .select("id,name,mobile,email,reward_choice")
      .single();
    if (upErr || !after) throw new Error("Could not update signup.");

    await supabaseAdmin
      .from("signup_edits")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        signup_id: data.id,
        edited_by: userId,
        before: before as unknown as Record<string, unknown>,
        after: after as unknown as Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

    return { ok: true, signup: after, unchanged: false };
  });

// ---- Soft-delete (void) a signup ----

const VoidSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const voidSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VoidSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");

    const { data: before, error: loadErr } = await supabaseAdmin
      .from("signups")
      .select("id,name,mobile,email,reward_choice,redemption_code,redeemed_at")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id" as any, data.id)
      .single();
    if (loadErr || !before) throw new Error("NOT_FOUND");

    const patch = {
      voided_at: new Date().toISOString(),
      voided_by: userId,
      void_reason: data.reason,
    };
    const { error: upErr } = await supabaseAdmin
      .from("signups")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", data.id);
    if (upErr) throw new Error("Could not void signup.");

    await supabaseAdmin
      .from("signup_edits")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        signup_id: data.id,
        edited_by: userId,
        before: before as unknown as Record<string, unknown>,
        after: { ...(before as Record<string, unknown>), ...patch } as Record<string, unknown>,
      } as any);

    return { ok: true };
  });

const UnvoidSchema = z.object({ id: z.string().uuid() });

export const unvoidSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UnvoidSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("NOT_ADMIN");

    const { error } = await supabaseAdmin
      .from("signups")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ voided_at: null, voided_by: null, void_reason: null } as any)
      .eq("id", data.id);
    if (error) throw new Error("Could not restore signup.");
    return { ok: true };
  });