import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  quote: string | null;
  source: string | null;
  photo_url: string | null;
}

function Stars() {
  return (
    <div className="flex items-center gap-0.5 text-gold-deep" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const initial = t.name.slice(0, 1).toUpperCase();
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl">
      {/* Header band */}
      <header className="flex items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-foreground/80">
            {initial}
          </span>
          <span className="truncate font-display text-sm font-semibold tracking-wide">
            {t.name}
          </span>
        </div>
        <Stars />
      </header>

      {/* Hero photo */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-secondary sm:aspect-[4/3]">
        {t.photo_url ? (
          <img
            src={t.photo_url}
            alt={`Photo from ${t.name}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-gold/20 to-accent/30">
            <span className="font-display text-7xl font-bold text-primary/60">{initial}</span>
          </div>
        )}
      </div>

      {/* Quote panel */}
      <div className="m-3 flex flex-1 flex-col gap-3 rounded-xl bg-secondary/60 p-5">
        <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none text-gold-deep" fill="currentColor" aria-hidden>
          <path d="M7.5 5C4.5 5 2 7.5 2 10.5V19h7v-8H5.5c0-1.7 1.3-3 3-3V5zm10 0c-3 0-5.5 2.5-5.5 5.5V19h7v-8H15c0-1.7 1.3-3 3-3V5z" />
        </svg>
        <blockquote
          className="flex-1 font-display text-base italic leading-snug text-foreground line-clamp-4 sm:text-lg"
          title={t.quote ?? undefined}
        >
          {t.quote}
        </blockquote>
        <figcaption className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          — {t.name}{t.source ? ` · ${t.source}` : ""}
        </figcaption>
      </div>
    </article>
  );
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
        .eq("comment_only", false)
        .not("quote", "is", null)
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
      <section className="relative mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
          <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Be among the first to share your story.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Visited Sans Sucre? We'd love to hear about it.
          </p>
          <Link
            to="/share-your-story"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Share your story →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-12 sm:py-20">
      {/* Editorial backdrop blocks */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-12 bottom-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
      </div>

      <div className="mb-10 text-center sm:mb-12">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          What people are{" "}
          <span className="relative inline-block">
            saying
            <span aria-hidden className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 bg-gold/60" />
          </span>
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/share-your-story"
          className="inline-flex h-11 items-center justify-center rounded-full border border-primary/30 bg-card px-6 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Share your own story →
        </Link>
      </div>
    </section>
  );
}