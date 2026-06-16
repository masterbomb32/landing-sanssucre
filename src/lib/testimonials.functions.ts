import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
) {
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (isAdmin !== true) throw new Error("NOT_ADMIN");
}

const ModerateSchema = z.object({
  id: z.string().uuid(),
  published: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(100000).optional(),
  comment_only: z.boolean().optional(),
});

export const moderateTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ModerateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.published !== undefined) patch.published = data.published;
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order;
    if (data.comment_only !== undefined) patch.comment_only = data.comment_only;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabaseAdmin.from("testimonials").update(patch as any).eq("id", data.id);
    if (error) throw new Error("Could not update testimonial.");
    return { ok: true };
  });

const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete testimonial.");
    return { ok: true };
  });