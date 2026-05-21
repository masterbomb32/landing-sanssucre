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
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialChip({ t, eager }: { t: Testimonial; eager?: boolean }) {
  const initial = t.name.slice(0, 1).toUpperCase();
  return (
    <article className="group flex min-h-32 gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-secondary">
        {t.photo_url ? (
          <img
            src={t.photo_url}
            alt={`Photo from ${t.name}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            width={112}
            height={112}
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <span className="font-display text-lg font-bold text-primary/70">{initial}</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-bold leading-tight">{t.name}</h3>
            {t.source && <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{t.source}</p>}
          </div>
          <Stars />
        </div>
        <blockquote className="mt-2 line-clamp-2 text-sm leading-snug text-foreground/80" title={t.quote ?? undefined}>
          “{t.quote}”
        </blockquote>
      </div>
    </article>
  );
}

function ShareYourStoryCard() {
  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary via-primary to-primary/90 p-5 text-primary-foreground shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/30 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />

      <p className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Your turn</p>
      <h3 className="mt-2 font-display text-xl font-bold leading-tight">
        Your Sans Sucre moment belongs here.
      </h3>
      <p className="mt-2 text-[13px] leading-snug text-primary-foreground/85">
        Share a photo, a few words, or a favorite treat from opening day.
      </p>

      <div className="mt-auto pt-4">
        <Link
          to="/share-your-story"
          className="inline-flex h-9 items-center justify-center rounded-full bg-gold px-4 text-[13px] font-semibold text-foreground shadow-sm transition-transform motion-safe:group-hover:translate-x-0.5"
        >
          Share your story →
        </Link>
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
        .limit(12);
      if (!cancelled) {
        setItems(data ?? []);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Layout strategy:
  // - 0 testimonials: CTA card + 0 stories (just CTA centered)
  // - 1-3 testimonials: CTA card leads, stories fill remaining columns (4 tiles total on desktop)
  // - 4+ testimonials: show 4 stories, CTA moves below as a button
  const showCtaAsLead = items.length < 4;
  const visible = showCtaAsLead ? items.slice(0, 3) : items.slice(0, 4);

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-10 sm:py-14">
      {/* Editorial backdrop blocks */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-12 top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 bottom-12 h-56 w-56 rounded-full bg-gold/15 blur-3xl" />
      </div>

      <div className="mb-8 text-center sm:mb-10">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {items.length === 0 ? (
            <>Be among the first to{" "}
              <span className="relative inline-block">
                share
                <span aria-hidden className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 bg-gold/60" />
              </span>
            </>
          ) : (
            <>What people are{" "}
              <span className="relative inline-block">
                saying
                <span aria-hidden className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 bg-gold/60" />
              </span>
            </>
          )}
        </h2>
      </div>

      {loaded && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {showCtaAsLead && <ShareYourStoryCard />}
          {visible.map((t, i) => (
            <TestimonialCard key={t.id} t={t} eager={i < 4} />
          ))}
        </div>
      )}

      {loaded && !showCtaAsLead && (
        <div className="mt-8 text-center sm:mt-10">
          <Link
            to="/share-your-story"
            className="inline-flex h-11 items-center justify-center rounded-full border border-primary/30 bg-card px-6 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Share your own story →
          </Link>
        </div>
      )}
    </section>
  );
}