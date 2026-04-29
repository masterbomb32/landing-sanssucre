import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/sanssucre-logo.png";
import heroWebp from "@/assets/red-velvet-hero.webp";
import heroPng from "@/assets/red-velvet-hero.png";
import { SignupForm } from "@/components/signup-form";
import { ShareButton } from "@/components/share-button";
import { useTrackVisit } from "@/hooks/use-track-visit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sans Sucre — Opening Day Rewards" },
      {
        name: "description",
        content:
          "Join Sans Sucre's opening day. Sign up, pick a reward, visit the shop to claim it.",
      },
      { property: "og:title", content: "Sans Sucre — Opening Day Rewards" },
      {
        property: "og:description",
        content: "Sign up, pick a reward, and visit us on opening day to claim it.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useTrackVisit("/");
  const formRef = useRef<HTMLElement | null>(null);
  const [formVisible, setFormVisible] = useState(false);
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

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Cinematic full-bleed hero */}
      <section className="relative isolate min-h-[78vh] overflow-hidden md:min-h-[85vh]">
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
              width={360}
              height={96}
              className="h-20 w-auto drop-shadow-md sm:h-28 lg:h-32"
              fetchPriority="high"
            />
            <p className="mt-8 font-display text-xs uppercase sm:mt-10 sm:text-sm tracking-[0.35em] text-primary sm:text-sm">
              Grand Opening
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] text-foreground drop-shadow-sm sm:text-5xl lg:text-6xl">
              A sweet welcome,
              <br />
              <span className="text-primary">just for you.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg">
              Reserve your reward in under a minute. Visit Sans Sucre on opening day and we'll have
              something sweet waiting.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:items-center">
              <a
                href="#claim"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                Reserve my reward →
              </a>
              <ShareButton />
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} id="claim" className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">Reserve your reward</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Tell us where to send your unique code. Show it at the shop on opening day.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
          <SignupForm />
        </div>
        <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
          <p>
            We respect your privacy. Your details are used only to deliver your reward and
            occasional Sans Sucre updates. We never sell or share your data.{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">
              Read our privacy notice
            </Link>
            .
          </p>
          <p>By signing up you agree to receive updates from Sans Sucre. One reward per person.</p>
        </div>
      </section>

      <footer className="border-t bg-secondary/40 py-8 text-center text-sm text-muted-foreground">
        <img src={logo} alt="Sans Sucre" width={140} height={36} className="mx-auto mb-3 h-7 w-auto opacity-80" loading="lazy" />
        <p>© {new Date().getFullYear()} Sans Sucre · sanssucre.ph</p>
        <p className="mt-1">
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </p>
      </footer>

      {/* Sticky mobile CTA — auto-hides when the form is visible */}
      <a
        href="#claim"
        aria-hidden={formVisible}
        className={`fixed inset-x-0 bottom-0 z-40 mx-3 mb-3 flex h-12 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-lg transition-all duration-300 md:hidden ${
          formVisible ? "pointer-events-none translate-y-20 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        Reserve now
      </a>
    </main>
  );
}
