import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

function TestimonialCard({ t, eager }: { t: Testimonial; eager?: boolean }) {
  const initial = t.name.slice(0, 1).toUpperCase();
  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
      {/* Header band */}
      <header className="flex items-center justify-between gap-2 bg-primary px-2.5 py-1.5 text-primary-foreground">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gold text-[9px] font-semibold text-foreground/80">
            {initial}
          </span>
          <span className="truncate font-display text-[11px] font-semibold tracking-wide">
            {t.name}
          </span>
        </div>
        <Stars />
      </header>

      {/* Hero photo — fixed height for consistent card size */}
      <div className="relative h-40 w-full overflow-hidden bg-secondary">
        {t.photo_url ? (
          <img
            src={t.photo_url}
            alt={`Photo from ${t.name}`}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            width={400}
            height={160}
            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-gold/20 to-accent/30">
            <span className="font-display text-5xl font-bold text-primary/60">{initial}</span>
          </div>
        )}
      </div>

      {/* Quote panel — fixed height so cards match */}
      <div className="m-1.5 flex h-[6.5rem] flex-col gap-1.5 rounded-lg bg-secondary/60 p-2.5">
        <svg viewBox="0 0 24 24" className="h-3 w-3 flex-none text-gold-deep" fill="currentColor" aria-hidden>
          <path d="M7.5 5C4.5 5 2 7.5 2 10.5V19h7v-8H5.5c0-1.7 1.3-3 3-3V5zm10 0c-3 0-5.5 2.5-5.5 5.5V19h7v-8H15c0-1.7 1.3-3 3-3V5z" />
        </svg>
        <blockquote
          className="flex-1 font-display text-[13px] italic leading-snug text-foreground line-clamp-3"
          title={t.quote ?? undefined}
        >
          {t.quote}
        </blockquote>
        <figcaption className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
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
    <section className="relative mx-auto max-w-6xl px-5 py-10 sm:py-14">
      {/* Editorial backdrop blocks */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-12 top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 bottom-12 h-56 w-56 rounded-full bg-gold/15 blur-3xl" />
      </div>

      <div className="mb-8 text-center sm:mb-10">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">In their words</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
          What people are{" "}
          <span className="relative inline-block">
            saying
            <span aria-hidden className="absolute inset-x-0 -bottom-1 h-2 -skew-x-6 bg-gold/60" />
          </span>
        </h2>
      </div>

      <Carousel
        opts={{ align: "start", loop: items.length > 4 }}
        className="w-full px-8 sm:px-12"
      >
        <CarouselContent className="-ml-3">
          {items.map((t, i) => (
            <CarouselItem
              key={t.id}
              className="basis-full pl-3 md:basis-1/2 lg:basis-1/4"
            >
              <TestimonialCard t={t} eager={i < 4} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length > 1 && (
          <>
            <CarouselPrevious className="hidden sm:flex left-1" />
            <CarouselNext className="hidden sm:flex right-1" />
          </>
        )}
      </Carousel>

      <div className="mt-8 text-center sm:mt-10">
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