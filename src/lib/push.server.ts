import { buildPushPayload } from "@block65/webcrypto-web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type StaffPushPayload = {
  title: string;
  body: string;
  url?: string;
};

function getVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("VAPID env vars missing");
  }
  return { subject, publicKey, privateKey };
}

/**
 * Fan-out a push notification to every registered staff subscription.
 * Prunes dead subscriptions (404/410) and logs counts. Never throws — safe to
 * call from anywhere (auth or unauth contexts).
 */
export async function fanOutStaffPush(
  payload: StaffPushPayload,
): Promise<{ sent: number; failed: number; pruned: number }> {
  let sent = 0;
  let failed = 0;
  let pruned = 0;

  try {
    const vapid = getVapid();
    const { data: subs, error } = await supabaseAdmin
      .from("staff_push_subscriptions")
      .select("id,endpoint,p256dh,auth");
    if (error) {
      console.error("fanOutStaffPush: load subs failed", error);
      return { sent: 0, failed: 0, pruned: 0 };
    }
    if (!subs || subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

    const deadIds: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const message = {
            data: {
              title: payload.title,
              body: payload.body,
              url: payload.url ?? "/admin",
            },
            options: { ttl: 60, urgency: "normal" as const },
          };
          const subscription = {
            endpoint: sub.endpoint,
            expirationTime: null,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          };
          const req = await buildPushPayload(message, subscription, vapid);
          const res = await fetch(sub.endpoint, {
            method: req.method,
            headers: req.headers,
            body: req.body,
          });
          if (res.status === 404 || res.status === 410) {
            deadIds.push(sub.id);
            pruned++;
          } else if (!res.ok) {
            failed++;
            console.error("push send non-ok", res.status, await res.text().catch(() => ""));
          } else {
            sent++;
          }
        } catch (e) {
          failed++;
          console.error("push send threw", e);
        }
      }),
    );

    if (deadIds.length > 0) {
      await supabaseAdmin
        .from("staff_push_subscriptions")
        .delete()
        .in("id", deadIds);
    }
  } catch (e) {
    console.error("fanOutStaffPush fatal", e);
  }

  return { sent, failed, pruned };
}