import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  upsertFaq,
  deleteFaq,
  publishFaqDraft,
  discardFaqDraft,
} from "@/server/faqs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  Rocket,
  Undo2,
  FileEdit,
} from "lucide-react";
import { toast } from "sonner";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  draft_question: string | null;
  draft_answer: string | null;
  has_draft: boolean;
}

export const Route = createFileRoute("/admin/faqs")({
  component: AdminFaqs,
});

function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const upsertFn = useServerFn(upsertFaq);
  const deleteFn = useServerFn(deleteFaq);
  const publishFn = useServerFn(publishFaqDraft);
  const discardFn = useServerFn(discardFaqDraft);

  const load = async () => {
    const { data } = await supabase
      .from("faqs")
      .select(
        "id,question,answer,sort_order,published,draft_question,draft_answer,has_draft",
      )
      .order("sort_order", { ascending: true });
    setFaqs((data ?? []) as Faq[]);
  };

  useEffect(() => {
    load();
  }, []);

  const onSaveDraft = async (f: Faq) => {
    try {
      await upsertFn({
        data: {
          id: f.id,
          question: f.question,
          answer: f.answer,
          sort_order: f.sort_order,
          published: f.published,
          draft_question: f.draft_question ?? "",
          draft_answer: f.draft_answer ?? "",
        },
      });
      toast.success("Draft saved.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save draft.");
    }
  };

  const onSaveLive = async (f: Faq) => {
    try {
      await upsertFn({
        data: {
          id: f.id,
          question: f.question,
          answer: f.answer,
          sort_order: f.sort_order,
          published: f.published,
        },
      });
      toast.success("Saved.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    }
  };

  const onPublishDraft = async (id: string) => {
    try {
      await publishFn({ data: { id } });
      toast.success("Draft published.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish.");
    }
  };

  const onDiscardDraft = async (id: string) => {
    if (!confirm("Discard this draft?")) return;
    try {
      await discardFn({ data: { id } });
      toast.success("Draft discarded.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not discard.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  const onCreate = async () => {
    try {
      await upsertFn({
        data: {
          question: "New question",
          answer: "New answer",
          sort_order: (faqs?.length ?? 0) * 10 + 100,
          published: true,
        },
      });
      toast.success("Created.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create.");
    }
  };

  if (faqs === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">FAQs</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/faq?preview=1" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Preview drafts
            </a>
          </Button>
          <Button onClick={onCreate} size="sm">
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <FaqEditor
            key={f.id}
            value={f}
            onChange={(v) =>
              setFaqs((prev) =>
                prev ? prev.map((p, i) => (i === idx ? v : p)) : prev,
              )
            }
            onSaveDraft={onSaveDraft}
            onSaveLive={onSaveLive}
            onPublishDraft={onPublishDraft}
            onDiscardDraft={onDiscardDraft}
            onDelete={onDelete}
          />
        ))}
      </div>
    </main>
  );
}

function FaqEditor({
  value,
  onChange,
  onSaveDraft,
  onSaveLive,
  onPublishDraft,
  onDiscardDraft,
  onDelete,
}: {
  value: Faq;
  onChange: (v: Faq) => void;
  onSaveDraft: (v: Faq) => void;
  onSaveLive: (v: Faq) => void;
  onPublishDraft: (id: string) => void;
  onDiscardDraft: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = { ...value, published: !value.published };
              onChange(next);
              onSaveLive(next);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value.published
                ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
            }`}
            aria-pressed={value.published}
          >
            {value.published ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            {value.published ? "Published" : "Hidden"}
          </button>
          {value.has_draft && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              <FileEdit className="h-3.5 w-3.5" />
              Draft pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Order</Label>
          <Input
            type="number"
            className="w-20"
            value={value.sort_order}
            onChange={(e) =>
              onChange({ ...value, sort_order: parseInt(e.target.value) || 0 })
            }
            onBlur={() => onSaveLive(value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Live */}
        <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Live (on /faq)
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Question</Label>
            <Input
              value={value.question}
              onChange={(e) =>
                onChange({ ...value, question: e.target.value })
              }
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Answer</Label>
            <Textarea
              value={value.answer}
              onChange={(e) =>
                onChange({ ...value, answer: e.target.value })
              }
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => onSaveLive(value)}>
              <Save className="h-3.5 w-3.5" /> Save live
            </Button>
          </div>
        </div>

        {/* Draft */}
        <div className="space-y-2 rounded-lg border bg-amber-500/5 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Draft (preview only)
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Question</Label>
            <Input
              value={value.draft_question ?? ""}
              placeholder={value.question}
              onChange={(e) =>
                onChange({ ...value, draft_question: e.target.value })
              }
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Answer</Label>
            <Textarea
              value={value.draft_answer ?? ""}
              placeholder={value.answer}
              onChange={(e) =>
                onChange({ ...value, draft_answer: e.target.value })
              }
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => onSaveDraft(value)}>
              <Save className="h-3.5 w-3.5" /> Save draft
            </Button>
            {value.has_draft && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDiscardDraft(value.id)}
                >
                  <Undo2 className="h-3.5 w-3.5" /> Discard
                </Button>
                <Button size="sm" onClick={() => onPublishDraft(value.id)}>
                  <Rocket className="h-3.5 w-3.5" /> Publish
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {value.published
            ? "Live version is visible at /faq."
            : "Hidden from /faq until you toggle Published."}
        </p>
        <Button variant="outline" size="sm" onClick={() => onDelete(value.id)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
