import { createFileRoute, Link, notFound, useRouter, redirect } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Check, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/sanssucre-logo.png";
import { ShareButton } from "@/components/share-button";
import { fetchReceipt } from "@/server/receipt.functions";
import { getReward } from "@/lib/rewards";
import { siteCopy } from "@/lib/site-copy";
import { formatDate } from "@/lib/format-date";
import { toast } from "sonner";

export const Route = createFileRoute("/receipt/$code")({
  loader: async ({ params }) => {
    const data = await fetchReceipt({ data: { code: params.code } });
    if (!data) throw notFound();
    // Already redeemed — go straight to thank-you page.
    if (data.redeemed_at) {
      throw redirect({ to: "/redeemed/$code", params: { code: params.code } });
    }
    return data;
  },
  head: () => ({
    meta: [
      { title: `Your reward — ${siteCopy.brand.name}` },
      { name: "description", content: "Your Sans Sucre opening day reward — show this at the counter." },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Code not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't find a reward with that code. Please check the link and try again.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/find"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Find my reward by phone number
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium hover:bg-accent"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  ),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { code } = Route.useParams();
  const data = Route.useLoaderData();
  const router = useRouter();
  const reward = getReward(data.reward_choice);
  const isRedeemed = !!data.redeemed_at;
  const issued = new Date(data.created_at);
  const [justRedeemed, setJustRedeemed] = useState(false);

  // Keep screen awake + nudge user to brighten the display so the QR scans faster.
  useEffect(() => {
    if (isRedeemed) return;
    let wakeLock: { release: () => Promise<void> } | null = null;

    interface WakeLockNavigator {
      wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
    }
    const nav = navigator as Navigator & WakeLockNavigator;

    const acquire = async () => {
      try {
        if (nav.wakeLock?.request) {
          wakeLock = await nav.wakeLock.request("screen");
        }
      } catch {
        /* user denied or unsupported — ignore */
      }
    };
    acquire();

    // Re-acquire when the tab becomes visible again
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    // One-time brightness tip on small screens
    const TIP_KEY = "ss_brightness_tip_shown";
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
    if (isMobile && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(TIP_KEY)) {
      sessionStorage.setItem(TIP_KEY, "1");
      // Small delay so it doesn't fire before the page paints
      setTimeout(() => {
        toast("Tip: turn your brightness up for a faster scan.", { duration: 5000 });
      }, 800);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      wakeLock?.release().catch(() => undefined);
    };
  }, [isRedeemed]);

  // Live-watch for redemption: realtime + 5s polling fallback. Stops after 30 min.
  useEffect(() => {
    if (isRedeemed) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    const goToThankYou = () => {
      if (cancelled) return;
      cancelled = true;
      setJustRedeemed(true);
      setTimeout(() => {
        router.navigate({ to: "/redeemed/$code", params: { code } });
      }, 900);
    };

    const checkOnce = async () => {
      try {
        const fresh = await fetchReceipt({ data: { code } });
        if (fresh?.redeemed_at) goToThankYou();
      } catch {
        /* swallow — next tick will retry */
      }
    };

    // Poll every 5s for redemption status. (Realtime subscription removed
    // to avoid exposing signups PII to all authenticated subscribers.)
    pollTimer = setInterval(checkOnce, 5000);

    // Stop after 30 minutes to save battery.
    stopTimer = setTimeout(() => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    }, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [code, data.id, isRedeemed, router]);

  if (justRedeemed) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
        <div className="text-center">
          <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
          <p className="mt-4 font-display text-lg font-semibold">Redeemed!</p>
          <p className="mt-1 text-sm text-muted-foreground">Loading your thank-you…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="receipt-shell flex min-h-[100dvh] flex-col bg-background px-3 py-3 sm:px-4 sm:py-5">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Header */}
        <div className="mb-2 flex justify-center sm:mb-3">
          <img src={logo} alt="Sans Sucre" className="h-9 w-auto sm:h-11" />
        </div>

        {/* Card */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-primary/15 bg-card shadow-xl">
          {/* Status banner */}
          <div
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] ${
              isRedeemed
                ? "bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isRedeemed ? (
              <>
                <Check className="h-3.5 w-3.5" /> Redeemed
              </>
            ) : (
              <>✦ Reward reserved ✦</>
            )}
          </div>

          {isRedeemed && (
            <div className="border-b border-emerald-500/30 bg-emerald-50 px-4 py-1.5 text-center text-[11px] dark:bg-emerald-950/20">
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                Already claimed — enjoy! 🎉
              </span>{" "}
              <Link
                to="/redeemed/$code"
                params={{ code }}
                className="underline underline-offset-2"
              >
                Leave feedback →
              </Link>
            </div>
          )}

          <div className="flex flex-1 flex-col px-5 py-4 sm:px-7 sm:py-5">
            {/* Greeting */}
            <p className="text-center font-display text-[10px] uppercase tracking-[0.28em] text-primary">
              Hello, {data.name.split(" ")[0]}
            </p>
            <h1 className="mt-0.5 text-center font-display text-xl font-bold leading-tight sm:text-2xl">
              Your treat is waiting.
            </h1>

            {/* Reward block */}
            {reward && (
              <div className="mt-3 rounded-xl bg-secondary/40 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl leading-none" aria-hidden>{reward.emoji}</span>
                  <span className="font-display text-base font-semibold sm:text-lg">{reward.title}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">
                  {reward.description}
                </p>
              </div>
            )}

            {/* QR code */}
            <div className="mt-3 rounded-xl border bg-muted/30 px-3 py-3 text-center">
              <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                Scan at the counter
              </div>
              <div className="mt-2 flex justify-center">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <QRCodeSVG
                    value={code}
                    size={168}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
              <div className="mt-2 font-mono text-sm font-semibold tracking-[0.28em]">{code}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Or read out the code above
              </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Waiting for staff to scan…
            </div>
            </div>

            {/* Info strip */}
            <div className="mt-3 space-y-1.5 rounded-xl border bg-card p-3 text-[12px] leading-snug">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                <div>
                  <span className="font-semibold">Sans Sucre</span>
                  <span className="text-muted-foreground"> — Inside Metro Supermarket, Alabang Town Center</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                <div className="text-muted-foreground">
                  Issued {formatDate(issued, "medium")} (PHT) · Show on opening day
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <ShareButton
                className="h-9 flex-1"
                text={`I just reserved a treat at ${siteCopy.brand.name}'s opening! Get yours:`}
              />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== "undefined") window.print();
                }}
                className="flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
              >
                Save / Print
              </a>
            </div>

            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              One reward per person.
            </p>
          </div>
        </div>

        <div className="mt-2 text-center sm:mt-3">
          <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">
            ← Back to sanssucre.ph
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-height: 640px) {
          .receipt-shell { min-height: auto; overflow-y: auto; }
        }
      `}</style>
    </main>
  );
}
