import { createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { serverErrorMiddleware } from "@/lib/error-middleware.server";

export const startInstance = createStart(() => ({
  requestMiddleware: [],
  functionMiddleware: [attachSupabaseAuth, serverErrorMiddleware],
}));