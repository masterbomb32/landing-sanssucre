import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { upsertFaq, deleteFaq } from "@/server/faqs.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}

export const Route = createFileRoute("/admin/faqs")({
  component: AdminFaqs,
});

function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const upsertFn = useServerFn(upsertFaq);
  const deleteFn = useServerFn(deleteFaq);

  const load = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("id,question,answer,sort_order,published")
      .order("sort_order", { ascending: true });
    setFaqs(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async (f: Faq) => {
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">FAQs</h1>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" /> New FAQ
        </Button>
      </div>
      <div className="space-y-4">
        {faqs.map((f, idx) => (
          <FaqEditor
            key={f.id}
            value={f}
            onChange={(v) => setFaqs((prev) => (prev ? prev.map((p, i) => (i === idx ? v : p)) : prev))}
            onSave={onSave}
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
  onSave,
  onDelete,
}: {
  value: Faq;
  onChange: (v: Faq) => void;
  onSave: (v: Faq) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Question</Label>
          <Input
            value={value.question}
            onChange={(e) => onChange({ ...value, question: e.target.value })}
            maxLength={300}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Order</Label>
          <Input
            type="number"
            className="w-20"
            value={value.sort_order}
            onChange={(e) => onChange({ ...value, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="pb-2">
          <button
            type="button"
            onClick={() => {
              const next = { ...value, published: !value.published };
              onChange(next);
              onSave(next);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value.published
                ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
            }`}
            aria-pressed={value.published}
          >
            {value.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {value.published ? "Published" : "Draft"}
          </button>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs">Answer</Label>
        <Textarea
          value={value.answer}
          onChange={(e) => onChange({ ...value, answer: e.target.value })}
          rows={3}
          maxLength={2000}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {value.published ? "Visible at /faq after saving." : "Hidden from /faq until published."}
        </p>
        <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onDelete(value.id)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
        <Button size="sm" onClick={() => onSave(value)}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
        </div>
      </div>
    </div>
  );
}