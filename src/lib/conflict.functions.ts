import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  pin: z.string().min(4).max(6),
  code: z.string().trim().min(8).max(64),
  note: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export const logRedeemConflict = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ok, error: pinErr } = await supabaseAdmin.rpc("verify_staff_pin", { p_pin: data.pin });
    if (pinErr || ok !== true) throw new Error("INVALID_PIN");

    const code = data.code.toUpperCase();
    const { data: signup } = await supabaseAdmin
      .from("signups")
      .select("id")
      .eq("redemption_code", code)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("redemption_audit").insert({
      signup_id: signup?.id ?? null,
      code,
      action: "conflict",
      note: data.note ?? null,
    });
    if (error) throw new Error("Could not log conflict.");
    return { ok: true };
  });