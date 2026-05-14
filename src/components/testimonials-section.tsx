import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  source: string | null;
  photo_url: string | null;
}

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id,name,quote,source,photo_url")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(6);
      if (!cancelled) {
        setItems(data ?? []);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || items.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <div className="text-center">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Be among the first to share your story.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Visited Sans Sucre? We'd love to hear about it.{" "}
            <Link to="/share-your-story" className="text-primary underline underline-offset-2">
              Share your story →
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <div className="mb-8 text-center">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">What people are saying</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <figure
            key={t.id}
            className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {t.photo_url ? (
              <img
                src={t.photo_url}
                alt={t.name}
                loading="lazy"
                className="h-16 w-16 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-xl font-semibold text-foreground/70 sm:h-[72px] sm:w-[72px]">
                {t.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <blockquote className="flex-1 font-display text-lg leading-snug text-foreground sm:text-xl">
              "{t.quote}"
            </blockquote>
            <figcaption className="text-xs text-muted-foreground">
              — {t.name}{t.source ? ` · ${t.source}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link
          to="/share-your-story"
          className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Share your own story →
        </Link>
      </div>
    </section>
  );
}