import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/sanssucre-logo.png";
import heroWebp from "@/assets/red-velvet-hero.webp";
import heroPng from "@/assets/red-velvet-hero.png";
import metroLogo from "@/assets/metro-logo.png";
import atcLogo from "@/assets/atc-logo.png";
import { SignupForm } from "@/components/signup-form";
import { ShareButton } from "@/components/share-button";
import { TestimonialsSection } from "@/components/testimonials-section";
import { useTrackVisit } from "@/hooks/use-track-visit";
import { siteCopy as defaults } from "@/lib/site-copy";
import { useSiteCopy } from "@/hooks/use-site-copy";
import { Countdown } from "@/components/countdown";
import { getReservationCount } from "@/server/stats.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: defaults.meta.title },
      { name: "description", content: defaults.meta.description },
      { property: "og:title", content: defaults.meta.title },
      { property: "og:description", content: defaults.meta.description },
    ],
  }),
  component: Index,
});

function Index() {
  useTrackVisit("/");
  const siteCopy = useSiteCopy();
  // Capture ?ref=CODE so the signup form can attribute the referral.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[A-Z0-9]{8,64}$/i.test(ref)) {
      sessionStorage.setItem("ss_referral_code", ref.toUpperCase());
    }
  }, []);
  const heroRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [reservedCount, setReservedCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const r = await getReservationCount();
        if (!cancelled) setReservedCount(r.total);
      } catch {
        /* ignore */
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -30% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Cinematic full-bleed hero */}
      <section ref={heroRef} className="relative isolate min-h-[78vh] overflow-hidden md:min-h-[85vh]">
        <picture>
          <source srcSet={heroWebp} type="image/webp" />
          <img
            src={heroPng}
            alt="A red velvet muffin with cream cheese on a stone countertop"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center md:object-[70%_center]"
            fetchPriority="high"
            decoding="async"
            width={1920}
            height={1080}
          />
        </picture>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-background/85 via-background/40 to-background/95 md:bg-gradient-to-r md:from-background/90 md:via-background/55 md:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-background"
        />

        <div className="mx-auto flex max-w-6xl items-center justify-end px-5 pt-5">
          <ShareButton variant="ghost" className="hidden sm:inline-flex" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col px-6 pb-20 pt-10 sm:px-5 sm:pt-14 md:min-h-[75vh] md:justify-center md:pb-24">
          <div className="max-w-xl">
            <img
              src={logo}
              alt="Sans Sucre"
              width={480}
              height={128}
              className="hero-rise h-28 w-auto drop-shadow-md sm:h-40 lg:h-48"
              fetchPriority="high"
            />
            <p className="hero-rise mt-8 font-display text-xs uppercase sm:mt-10 sm:text-sm tracking-[0.35em] text-primary sm:text-sm" style={{ animationDelay: "120ms" }}>
              {siteCopy.hero.eyebrow}
            </p>
            <h1 className="hero-rise mt-4 font-display text-4xl font-bold leading-[1.05] text-foreground drop-shadow-sm sm:text-5xl lg:text-6xl" style={{ animationDelay: "220ms" }}>
              {siteCopy.hero.headline.line1}
              <br />
              <span className="text-primary">{siteCopy.hero.headline.line2}</span>
            </h1>
            <p className="hero-rise mt-6 max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg" style={{ animationDelay: "340ms" }}>
              {siteCopy.hero.sub}
            </p>

            <p className="hero-rise mt-6 text-sm font-medium text-foreground/80" style={{ animationDelay: "440ms" }}>
              {siteCopy.hero.location}
            </p>

            {/* Countdown to opening */}
            <div className="hero-rise mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-background/60 px-3 py-2 backdrop-blur-sm" style={{ animationDelay: "520ms" }}>
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-primary">Opens in</span>
              <Countdown targetISO={siteCopy.opening.date} compact className="text-sm" />
              <span className="text-[11px] text-foreground/60">· {siteCopy.opening.label}</span>
            </div>

            {/* Live community count */}
            {reservedCount !== null && reservedCount > 0 && (
              <div className="hero-rise mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-foreground/80" style={{ animationDelay: "600ms" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="tabular-nums font-semibold">{reservedCount.toLocaleString()}</span>
                <span>{siteCopy.receipt.communityCount}</span>
              </div>
            )}

            <div className="hero-rise mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center" style={{ animationDelay: "680ms" }}>
              <a
                href="#claim"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                {siteCopy.hero.primaryCta}
              </a>
              <ShareButton />
            </div>

            <p className="hero-rise mt-4 text-sm" style={{ animationDelay: "760ms" }}>
              <Link to="/find" className="text-foreground/70 underline underline-offset-4 hover:text-foreground">
                {siteCopy.findMyReward.linkLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} id="claim" className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">{siteCopy.form.heading}</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{siteCopy.form.sub}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          <SignupForm />
        </div>
      </section>

      <TestimonialsSection />

      <footer className="border-t bg-secondary/40 py-10 text-center text-sm text-muted-foreground">
        <img
          src={logo}
          alt="Sans Sucre"
          width={140}
          height={36}
          className="mx-auto mb-4 h-8 w-auto opacity-80"
          loading="lazy"
        />
        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <img src={metroLogo} alt="Metro Supermarket" className="h-8 w-auto" loading="lazy" />
          <span className="text-xs text-muted-foreground" aria-hidden>×</span>
          <img src={atcLogo} alt="Alabang Town Center" className="h-8 w-auto" loading="lazy" />
        </div>
        <p className="mx-auto max-w-md px-5 text-xs sm:text-sm">{siteCopy.footer.location}</p>
        <p className="mt-4">© {new Date().getFullYear()} Sans Sucre · sanssucre.ph</p>
        <p className="mt-1">
          <Link to="/privacy" className="hover:text-foreground">
            {siteCopy.footer.privacyLabel}
          </Link>
          <span className="px-2 text-muted-foreground/60">·</span>
          <Link to="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <span className="px-2 text-muted-foreground/60">·</span>
          <Link to="/share-your-story" className="hover:text-foreground">
            Share your story
          </Link>
          <span className="px-2 text-muted-foreground/60">·</span>
          <Link to="/find" className="hover:text-foreground">
            Find my reward
          </Link>
        </p>
      </footer>

      {/* Sticky mobile CTA — auto-hides when the form is visible */}
      <a
        href="#claim"
        aria-hidden={heroVisible || formVisible}
        className={`fixed inset-x-0 bottom-0 z-40 mx-3 mb-3 flex h-12 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-lg transition-all duration-300 md:hidden ${
          heroVisible || formVisible ? "pointer-events-none translate-y-20 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {siteCopy.stickyCta}
      </a>
    </main>
  );
}
