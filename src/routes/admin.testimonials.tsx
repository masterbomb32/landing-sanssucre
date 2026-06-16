import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { moderateTestimonial, deleteTestimonial } from "@/lib/testimonials.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Eye, EyeOff, Star, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format-date";

interface Testimonial {
  id: string;
  name: string;
  quote: string | null;
  source: string | null;
  photo_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  rating: number | null;
  signup_id: string | null;
  comment_only: boolean;
}

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
});

function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "published" | "feedback" | "all">("pending");
  const moderateFn = useServerFn(moderateTestimonial);
  const deleteFn = useServerFn(deleteTestimonial);

  const load = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("id,name,quote,source,photo_url,published,sort_order,created_at,rating,signup_id,comment_only")
      .order("created_at", { ascending: false })
      .limit(500);
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublish = async (t: Testimonial) => {
    try {
      await moderateFn({ data: { id: t.id, published: !t.published } });
      toast.success(!t.published ? "Published." : "Unpublished.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update.");
    }
  };

  const updateOrder = async (t: Testimonial, sort_order: number) => {
    try {
      await moderateFn({ data: { id: t.id, sort_order } });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  const promoteToPublic = async (t: Testimonial) => {
    if (!t.quote || t.quote.trim().length < 5) {
      toast.error("This entry has no quote — can't publish.");
      return;
    }
    try {
      await moderateFn({ data: { id: t.id, comment_only: false } });
      toast.success("Promoted to public testimonial.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not promote.");
    }
  };

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = items.filter((t) => {
    if (filter === "all") return true;
    if (filter === "published") return t.published && !t.comment_only;
    if (filter === "feedback") return t.comment_only;
    // "pending" = needs moderation for public display
    return !t.published && !t.comment_only;
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Voices</h1>
        <div className="flex gap-2">
          {(["pending", "published", "feedback", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "pending"
                ? `Pending (${items.filter((i) => !i.published && !i.comment_only).length})`
                : f === "published"
                  ? `Published (${items.filter((i) => i.published && !i.comment_only).length})`
                  : f === "feedback"
                    ? `Feedback only (${items.filter((i) => i.comment_only).length})`
                    : "All"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in this view.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {t.photo_url ? (
                  <img src={t.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-base font-semibold">
                    {t.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.name}</span>
                    {t.source && <span className="text-xs text-muted-foreground">· {t.source}</span>}
                    {t.rating !== null && (
                      <span className="inline-flex items-center gap-0.5 text-amber-500" title={`${t.rating}★`}>
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    )}
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        t.comment_only
                          ? "bg-slate-500/15 text-slate-600 dark:text-slate-400"
                          : t.published
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {t.comment_only ? "Feedback" : t.published ? "Live" : "Pending"}
                    </span>
                  </div>
                  {t.quote ? (
                    <p className="mt-1.5 whitespace-pre-line text-sm text-foreground/85">{t.quote}</p>
                  ) : (
                    <p className="mt-1.5 text-xs italic text-muted-foreground">(No written comment)</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Submitted {formatDateTime(new Date(t.created_at), { dateStyle: "medium", timeStyle: "short" })}
                    {t.signup_id ? " · from redemption" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Order</span>
                  <Input
                    type="number"
                    className="h-8 w-20"
                    defaultValue={t.sort_order}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value) || 0;
                      if (n !== t.sort_order) updateOrder(t, n);
                    }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => onDelete(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                {t.comment_only && t.quote && t.quote.trim().length >= 5 && (
                  <Button size="sm" variant="outline" onClick={() => promoteToPublic(t)} title="Promote to public testimonial">
                    <Sparkles className="h-3.5 w-3.5" /> Promote
                  </Button>
                )}
                {!t.comment_only && (
                  <Button size="sm" onClick={() => togglePublish(t)} disabled={!t.quote}>
                    {t.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {t.published ? "Unpublish" : "Publish"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}