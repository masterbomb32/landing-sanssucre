import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CodeSchema = z.object({ code: z.string().min(8).max(64) });

export const fetchReceipt = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => CodeSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("signups")
      .select("name, email, reward_choice, redemption_code, redeemed_at, created_at")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (error) throw new Error("Could not load receipt.");
    if (!row) return null;
    return row;
  });
