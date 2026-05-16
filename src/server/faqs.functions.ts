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
  draft_question: z.string().trim().max(300).nullable().optional(),
  draft_answer: z.string().trim().max(2000).nullable().optional(),
});

export const upsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const hasDraftFieldProvided =
      data.draft_question !== undefined || data.draft_answer !== undefined;
    const dq = data.draft_question ?? null;
    const da = data.draft_answer ?? null;
    const draftDiffersFromLive =
      (dq !== null && dq !== data.question) || (da !== null && da !== data.answer);
    const hasDraft = hasDraftFieldProvided && (dq !== null || da !== null) && draftDiffersFromLive;
    const draftPayload = hasDraftFieldProvided
      ? {
          draft_question: hasDraft ? dq : null,
          draft_answer: hasDraft ? da : null,
          has_draft: hasDraft,
        }
      : {};
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("faqs")
        .update({
          question: data.question,
          answer: data.answer,
          sort_order: data.sort_order,
          published: data.published,
          ...draftPayload,
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
        ...draftPayload,
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

const IdSchema = z.object({ id: z.string().uuid() });

export const publishFaqDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error: readErr } = await supabaseAdmin
      .from("faqs")
      .select("question,answer,draft_question,draft_answer,has_draft")
      .eq("id", data.id)
      .single();
    if (readErr || !row) throw new Error("FAQ not found.");
    if (!row.has_draft) throw new Error("No draft to publish.");
    const nextQuestion = row.draft_question ?? row.question;
    const nextAnswer = row.draft_answer ?? row.answer;
    const { error } = await supabaseAdmin
      .from("faqs")
      .update({
        question: nextQuestion,
        answer: nextAnswer,
        draft_question: null,
        draft_answer: null,
        has_draft: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not publish draft.");
    return { ok: true };
  });

export const discardFaqDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("faqs")
      .update({
        draft_question: null,
        draft_answer: null,
        has_draft: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error("Could not discard draft.");
    return { ok: true };
  });