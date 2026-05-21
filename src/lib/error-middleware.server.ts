import { createMiddleware } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const serverErrorMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    try {
      return await next();
    } catch (err) {
      try {
        const e = err as Error;
        const msg = e?.message ?? String(err);
        // Skip expected control-flow throws used by our RPCs
        const skip = [
          "NOT_ADMIN",
          "INVALID_CODE",
          "ALREADY_REDEEMED",
          "NOT_REDEEMED",
          "INVALID_PIN",
          "ALREADY_SUBMITTED",
          "INVALID_NAME",
          "INVALID_QUOTE",
          "INVALID_RATING",
          "MOBILE_TAKEN",
          "WINDOW_EXPIRED",
          "Unauthorized",
        ];
        if (!skip.some((s) => msg.includes(s))) {
          await supabaseAdmin.from("error_log").insert({
            source: "server",
            level: "error",
            message: msg.slice(0, 2000),
            stack: e?.stack?.slice(0, 10000) ?? null,
          });
        }
      } catch {
        // Never let logging fail the request
      }
      throw err;
    }
  },
);