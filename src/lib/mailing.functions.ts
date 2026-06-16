import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubscribeSchema = z.object({
  code: z.string().trim().min(8).max(64),
  email: z.string().trim().email().max(254),
});

export const subscribeMailingList = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscribeSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signup, error: sErr } = await supabaseAdmin
      .from("signups")
      .select("id, email")
      .eq("redemption_code", data.code)
      .maybeSingle();
    if (sErr || !signup) throw new Error("INVALID_CODE");

    // If signup has no email yet, save it for future contact
    if (!signup.email) {
      await supabaseAdmin
        .from("signups")
        .update({ email: data.email })
        .eq("id", signup.id);
    }

    const { error } = await supabaseAdmin
      .from("mailing_subscriptions")
      .insert({
        signup_id: signup.id,
        email: data.email,
        source: "thank_you_page",
      });

    if (error) {
      if (`${error.message}`.toLowerCase().includes("duplicate")) {
        return { ok: true, alreadySubscribed: true };
      }
      throw new Error("Could not subscribe. Please try again.");
    }
    return { ok: true, alreadySubscribed: false };
  });
