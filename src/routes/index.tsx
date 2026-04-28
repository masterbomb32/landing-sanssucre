import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/hero-bakery.jpg";
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
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImage}
            alt="Sans Sucre patisserie counter with cakes, macarons and croissants"
            width={1920}
            height={1080}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
        </div>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28 lg:py-36">
          <div className="max-w-xl">
            <p className="font-display text-sm uppercase tracking-[0.25em] text-primary">
              Sans Sucre · Grand Opening
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              A sweet welcome,
              <br />
              <span className="italic text-primary">just for you.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              Reserve your reward in under a minute. Visit us on opening day and we'll have it
              waiting.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#claim"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Claim my reward
              </a>
              <ShareButton />
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="claim" className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Reserve your reward</h2>
          <p className="mt-2 text-muted-foreground">
            Tell us where to send your unique code. Show it at the shop on opening day.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing up you agree to receive updates from Sans Sucre. One reward per person.
        </p>
      </section>

      <footer className="border-t bg-secondary/40 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Sans Sucre · sanssucre.ph
      </footer>
    </main>
  );
}
