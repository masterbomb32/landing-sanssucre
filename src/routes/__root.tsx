import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import heroWebp from "@/assets/red-velvet-hero.webp";
import { Toaster } from "@/components/ui/sonner";
import { siteCopy } from "@/lib/site-copy";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--rose) 45%, transparent), transparent 60%), radial-gradient(ellipse at bottom, color-mix(in oklab, var(--gold) 25%, transparent), transparent 65%)",
        }}
      />
      <div className="hero-rise relative z-10 mx-auto max-w-lg text-center">
        <p className="font-sans text-xs uppercase tracking-[0.32em] text-primary/80">
          Sans Sucre · Pâtisserie
        </p>

        <div className="mt-6 flex items-center justify-center gap-4 text-primary/70">
          <span className="h-px w-12 bg-border" />
          <span className="text-2xl" aria-hidden="true">✦</span>
          <span className="h-px w-12 bg-border" />
        </div>

        <h1 className="mt-6 font-display text-7xl font-bold tracking-tight text-primary sm:text-8xl">
          404
        </h1>
        <h2 className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
          This page is out of the oven.
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          The page you're looking for has wandered off — perhaps it stepped out for a
          coffee. Let's get you back to something sweet.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Take me home
          </Link>
          <Link
            to="/faq"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Visit our FAQ
          </Link>
        </div>

        <p className="mt-10 font-display text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Metro Supermarket · Alabang Town Center
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: siteCopy.meta.title },
      { name: "description", content: siteCopy.meta.description },
      { name: "author", content: siteCopy.brand.name },
      { property: "og:title", content: siteCopy.meta.title },
      { property: "og:description", content: siteCopy.meta.description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/1K8BHbLdHtcV3XgILtgwxQw8Dsj1/social-images/social-1777908650761-opening_day_rewards.webp" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteCopy.meta.title },
      { name: "twitter:description", content: siteCopy.meta.description },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/1K8BHbLdHtcV3XgILtgwxQw8Dsj1/social-images/social-1777908650761-opening_day_rewards.webp" },
      { title: "Rewards on Opening Day" },
      { property: "og:title", content: "Rewards on Opening Day" },
      { name: "twitter:title", content: "Rewards on Opening Day" },
      { name: "description", content: "Sweet Rewards Launch is a landing page for customer onboarding and reward redemption." },
      { property: "og:description", content: "Sweet Rewards Launch is a landing page for customer onboarding and reward redemption." },
      { name: "twitter:description", content: "Sweet Rewards Launch is a landing page for customer onboarding and reward redemption." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", as: "image", href: heroWebp, type: "image/webp" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-center" />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});}",
          }}
        />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
