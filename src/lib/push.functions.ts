import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fanOutStaffPush } from "./push.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("NOT_ADMIN");
}

export const getVapidPublicKey = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) throw new Error("VAPID_PUBLIC_KEY missing");
    return { publicKey };
  });

const RegisterSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  userAgent: z.string().max(500).optional(),
});

export const registerStaffPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegisterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("staff_push_subscriptions")
      .upsert(
        {
          user_id: context.userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.userAgent ?? null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) {
      console.error("registerStaffPush error", error);
      throw new Error("Could not register subscription");
    }
    return { ok: true };
  });

const UnregisterSchema = z.object({
  endpoint: z.string().url().max(2000),
});

export const unregisterStaffPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UnregisterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("staff_push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) {
      console.error("unregisterStaffPush error", error);
      throw new Error("Could not unregister subscription");
    }
    return { ok: true };
  });

export const sendTestStaffPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const result = await fanOutStaffPush({
      title: "Sans Sucre test 🍰",
      body: "Push notifications are working.",
      url: "/admin",
    });
    return result;
  });