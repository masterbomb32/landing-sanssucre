import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { Check, Calendar, MapPin } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import metroLogo from "@/assets/metro-logo.png";
import atcLogo from "@/assets/atc-logo.png";
import { ShareButton } from "@/components/share-button";
import { fetchReceipt } from "@/server/receipt.functions";
import { getReward } from "@/lib/rewards";
import { siteCopy } from "@/lib/site-copy";

export const Route = createFileRoute("/receipt/$code")({
  loader: async ({ params }) => {
    const data = await fetchReceipt({ data: { code: params.code } });
    if (!data) throw notFound();
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
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Code not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't find a reward with that code. Please check the link and try again.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Back to home
        </Link>
      </div>
    </main>
  ),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { code } = Route.useParams();
  const data = Route.useLoaderData();
  const reward = getReward(data.reward_choice);
  const receiptUrl =
    typeof window !== "undefined" ? window.location.href : `https://sanssucre.ph/receipt/${code}`;
  const isRedeemed = !!data.redeemed_at;
  const issued = new Date(data.created_at);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <img src={logo} alt="Sans Sucre" className="mx-auto h-16 w-auto sm:h-20" />
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
          {/* Status banner */}
          <div
            className={`flex items-center justify-center gap-2 px-6 py-3 text-xs font-medium uppercase tracking-[0.25em] ${
              isRedeemed
                ? "bg-secondary text-muted-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isRedeemed ? (
              <>
                <Check className="h-4 w-4" /> Redeemed
              </>
            ) : (
              <>✦ Reward reserved ✦</>
            )}
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-center font-display text-xs uppercase tracking-[0.3em] text-primary">
              Hello, {data.name.split(" ")[0]}
            </p>
            <h1 className="mt-2 text-center font-display text-3xl font-bold leading-tight sm:text-4xl">
              Your treat is waiting.
            </h1>

            {/* Reward block */}
            {reward && (
              <div className="mt-7 rounded-2xl bg-secondary/40 p-5 text-center">
                <div className="text-4xl" aria-hidden>
                  {reward.emoji}
                </div>
                <div className="mt-2 font-display text-xl font-semibold">{reward.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
              </div>
            )}

            {/* QR */}
            <div className="mt-8 flex flex-col items-center">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <QRCodeSVG value={receiptUrl} size={180} level="M" includeMargin={false} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Scan at the counter</p>
            </div>

            {/* Code + barcode */}
            <div className="mt-6 rounded-xl border bg-muted/30 p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Redemption code
              </div>
              <div className="mt-1 font-mono text-lg font-semibold tracking-[0.3em]">{code}</div>
              <div className="mt-3 flex justify-center overflow-hidden">
                <div className="bg-white px-3 py-2">
                  <Barcode
                    value={code}
                    format="CODE128"
                    height={48}
                    width={1.4}
                    fontSize={12}
                    margin={0}
                    displayValue={false}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mt-7 flex items-start gap-3 rounded-xl border bg-card p-4">
              <MapPin className="mt-0.5 h-5 w-5 flex-none text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Sans Sucre</div>
                <div className="text-muted-foreground">
                  Inside Metro Supermarket, Alabang Town Center
                </div>
                <div className="mt-3 flex items-center gap-3 opacity-90">
                  <img src={metroLogo} alt="Metro Supermarket" className="h-7 w-auto" />
                  <span className="text-xs text-muted-foreground" aria-hidden>×</span>
                  <img src={atcLogo} alt="Alabang Town Center" className="h-7 w-auto" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border bg-card p-4 text-sm">
              <Calendar className="h-5 w-5 flex-none text-primary" />
              <div>
                Issued {issued.toLocaleDateString("en-PH", { dateStyle: "long" })}. Show this page
                on opening day.
              </div>
            </div>

            {/* Share + Save */}
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <ShareButton
                className="flex-1"
                text={`I just reserved a treat at ${siteCopy.brand.name}'s opening! Get yours:`}
              />
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== "undefined") window.print();
                }}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                Save / Print
              </a>
            </div>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              One reward per person. Show this code at the counter to claim.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to sanssucre.ph
          </Link>
        </div>
      </div>
    </main>
  );
}
