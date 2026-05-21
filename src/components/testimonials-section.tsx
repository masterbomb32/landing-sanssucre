import { useEffect, useRef, useState } from "react";
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
    <div className="flex items-center gap-0.5 text-primary-foreground" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

const cardShell = "snap-center overflow-hidden rounded-[2rem] bg-sage shadow-sm";
const cardSize = "w-[15.75rem] flex-none sm:w-[16.75rem] lg:w-[calc((100%-4.5rem)/4)]";

function TestimonialCard({ t, eager }: { t: Testimonial; eager?: boolean }) {
  return (
    <article className={`${cardShell} ${cardSize}`}>
      <div className="relative h-32 overflow-hidden rounded-t-[1.6rem] bg-secondary sm:h-34 lg:h-32">
        {t.photo_url ? (
          <img
            src={t.photo_url}
            alt={`Photo from ${t.name}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            width={420}
            height={260}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/15">
            <span className="font-display text-5xl font-bold text-primary/70">{t.name.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="flex h-[11.25rem] flex-col px-3 pb-5 pt-2.5 sm:h-[11.75rem] sm:px-3.5">
        <Stars />
        <span className="mt-2 font-display text-lg leading-none text-primary-foreground">“</span>
        <blockquote className="line-clamp-4 font-display text-[13px] font-bold italic leading-[1.18] text-foreground/65" title={t.quote ?? undefined}>
          “{t.quote}”
        </blockquote>
        <div className="mt-auto min-w-0 pt-2">
          <h3 className="truncate text-sm font-medium leading-tight text-primary-foreground">{t.name}</h3>
          {t.source && <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.16em] text-primary-foreground/75">{t.source}</p>}
        </div>
      </div>
    </article>
  );
}

function ShareYourStoryCard() {
  return (
    <article className={`${cardShell} ${cardSize} flex min-h-[19.5rem] flex-col justify-between p-5 text-primary-foreground sm:min-h-[20.5rem] lg:min-h-[19.25rem]`}>
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary-foreground/80">Your turn</p>
        <h3 className="mt-4 font-display text-2xl font-bold leading-tight">
          Share your own story.
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-foreground/65">
          Share a photo, a few words, or a favorite treat from opening day.
        </p>
      </div>

      <div className="mt-8">
        <Link
          to="/share-your-story"
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary-foreground px-5 text-sm font-semibold text-foreground shadow-sm transition-transform motion-safe:hover:translate-x-0.5"
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