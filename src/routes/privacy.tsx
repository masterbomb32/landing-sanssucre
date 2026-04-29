import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Sans Sucre" },
      {
        name: "description",
        content:
          "How Sans Sucre collects, uses, and protects your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:py-16">
      <article className="mx-auto max-w-2xl space-y-6">
        <header>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-4 font-display text-4xl">Privacy Notice</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We value your trust. Here is exactly how your information is handled.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="font-display text-xl">What we collect</h2>
          <p className="text-sm text-muted-foreground">
            When you sign up for an opening-day reward, we collect your name, mobile number, your
            chosen reward, and (if you provide it) your email address. We also record anonymous
            visit counts so we can understand how the page is performing — no tracking cookies,
            no third‑party advertising pixels.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">How we use it</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>To deliver your reward by SMS (and email, if provided).</li>
            <li>To verify your reward when you visit the shop.</li>
            <li>To occasionally share Sans Sucre updates, promos, or loyalty news.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            We never sell, rent, or share your personal data with third parties for their own
            marketing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">Your choices</h2>
          <p className="text-sm text-muted-foreground">
            You may unsubscribe from marketing messages at any time, and you may request
            correction or deletion of your data by emailing us at{" "}
            <a className="text-primary underline" href="mailto:hello@sanssucre.ph">
              hello@sanssucre.ph
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl">Retention & security</h2>
          <p className="text-sm text-muted-foreground">
            Your details are stored securely on our managed backend and kept only as long as
            needed for reward fulfillment and customer relationship purposes. This notice is
            governed by the Philippine Data Privacy Act of 2012 (RA 10173).
          </p>
        </section>

        <p className="pt-4 text-xs text-muted-foreground">
          Last updated: April 2026.
        </p>
      </article>
    </main>
  );
}