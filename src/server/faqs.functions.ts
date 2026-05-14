import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: ReturnType<typeof Object>, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: isAdmin } = await (supabase as any).rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (isAdmin !== true) throw new Error("NOT_ADMIN");
}

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(3).max(2000),
  sort_order: z.number().int().min(0).max(100000).default(100),
  published: z.boolean().default(true),
});

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("faqs")
        .update({
          question: data.question,
          answer: data.answer,
          sort_order: data.sort_order,
          published: data.published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      if (error) throw new Error("Could not update FAQ.");
      return { ok: true, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("faqs")
      .insert({
        question: data.question,
        answer: data.answer,
        sort_order: data.sort_order,
        published: data.published,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Could not create FAQ.");
    return { ok: true, id: row.id };
  });

const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin.from("faqs").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete FAQ.");
    return { ok: true };
  });