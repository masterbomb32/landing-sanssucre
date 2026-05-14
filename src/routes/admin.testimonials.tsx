import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { moderateTestimonial, deleteTestimonial } from "@/server/testimonials.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format-date";

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  source: string | null;
  photo_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
}

export const Route = createFileRoute("/admin/testimonials")({
  component: AdminTestimonials,
});

function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "published" | "all">("pending");
  const moderateFn = useServerFn(moderateTestimonial);
  const deleteFn = useServerFn(deleteTestimonial);

  const load = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("id,name,quote,source,photo_url,published,sort_order,created_at")
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

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filtered = items.filter((t) =>
    filter === "all" ? true : filter === "published" ? t.published : !t.published,
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Testimonials</h1>
        <div className="flex gap-2">
          {(["pending", "published", "all"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "pending"
                ? `Pending (${items.filter((i) => !i.published).length})`
                : f === "published"
                  ? `Published (${items.filter((i) => i.published).length})`
                  : "All"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No testimonials in this view.</p>
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
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        t.published
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {t.published ? "Live" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-foreground/85">{t.quote}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Submitted {formatDateTime(new Date(t.created_at), { dateStyle: "medium", timeStyle: "short" })}
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
                <Button size="sm" onClick={() => togglePublish(t)}>
                  {t.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {t.published ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}