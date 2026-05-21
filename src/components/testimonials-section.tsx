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
    <article className="group flex min-h-[7.25rem] gap-3 rounded-lg border border-border/70 bg-card p-3 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      <div className="relative h-12 w-12 flex-none overflow-hidden rounded-md bg-secondary">
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
    <article className="group flex h-full min-h-[15.5rem] flex-col justify-between rounded-lg border border-primary/30 bg-primary p-5 text-primary-foreground shadow-sm sm:p-6">
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">Your turn</p>
        <h3 className="mt-3 max-w-md font-display text-2xl font-bold leading-tight">
        Your Sans Sucre moment belongs here.
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/85">
          Share a photo, a few words, or a favorite treat from opening day.
        </p>
      </div>

      <div className="mt-6">
        <Link
          to="/share-your-story"
          className="inline-flex h-10 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-foreground shadow-sm transition-transform motion-safe:group-hover:translate-x-0.5"
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

  const visible = items.slice(0, 4);

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="mb-7 text-center sm:mb-8">
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
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[0.85fr_1.35fr]">
          <ShareYourStoryCard />

          {visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visible.map((t, i) => (
                <TestimonialChip key={t.id} t={t} eager={i < 4} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                "Opening day memory",
                "Favorite treat",
                "Photo moment",
              ].map((prompt) => (
                <div key={prompt} className="rounded-xl border border-border/70 bg-card p-4 text-sm font-medium text-foreground/80 shadow-sm">
                  {prompt}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}