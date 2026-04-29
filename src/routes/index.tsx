import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/sanssucre-logo.png";
import redVelvetWebp from "@/assets/red-velvet.webp";
import redVelvetPng from "@/assets/red-velvet.png";
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
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <img
            src={logo}
            alt="Sans Sucre"
            width={180}
            height={48}
            className="h-9 w-auto sm:h-12"
            fetchPriority="high"
          />
          <ShareButton variant="ghost" className="hidden sm:inline-flex" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 sm:py-16 md:grid-cols-2 lg:py-24">
          <div className="order-2 md:order-1">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary sm:text-sm">
              Grand Opening
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              A sweet welcome,
              <br />
              <span className="text-primary">just for you.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Reserve your reward in under a minute. Visit us on opening day and we'll have it
              waiting.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <a
                href="#claim"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Claim my reward
              </a>
              <ShareButton />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <picture>
              <source srcSet={redVelvetWebp} type="image/webp" />
              <img
                src={redVelvetPng}
                alt="Sans Sucre red velvet muffin with cream cheese topping"
                width={800}
                height={800}
                className="mx-auto h-auto w-full max-w-xs drop-shadow-2xl sm:max-w-sm md:max-w-md"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="claim" className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
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

      {/* Sticky mobile CTA */}
      <a
        href="#claim"
        className="fixed inset-x-0 bottom-0 z-40 mx-3 mb-3 flex h-12 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-lg md:hidden"
      >
        Claim my reward
      </a>
    </main>
  );
}
