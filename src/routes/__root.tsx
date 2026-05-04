import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import heroWebp from "@/assets/red-velvet-hero.webp";
import { Toaster } from "@/components/ui/sonner";
import { siteCopy } from "@/lib/site-copy";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
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
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
