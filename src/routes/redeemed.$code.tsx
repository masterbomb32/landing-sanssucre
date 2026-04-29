import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Check, MapPin, Sparkles } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchReceipt } from "@/server/receipt.functions";
import { submitFeedback, fetchFeedbackStatus } from "@/server/redeem.functions";
import { getReward } from "@/lib/rewards";
import { useSiteCopy } from "@/hooks/use-site-copy";
import { formatDateTime } from "@/lib/format-date";
import { toast } from "sonner";

export const Route = createFileRoute("/redeemed/$code")({
  loader: async ({ params }) => {
    const [data, status] = await Promise.all([
      fetchReceipt({ data: { code: params.code } }),
      fetchFeedbackStatus({ data: { code: params.code } }),
    ]);
    if (!data) throw notFound();
    return { data, hasFeedback: status.hasFeedback ?? false };
  },
  head: () => ({
    meta: [
      { title: "Thanks for visiting — Sans Sucre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Code not found</h1>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Back to home
        </Link>
      </div>
    </main>
  ),
  component: RedeemedPage,
});

function RedeemedPage() {
  const { code } = Route.useParams();
  const { data, hasFeedback } = Route.useLoaderData();
  const copy = useSiteCopy();
  const reward = getReward(data.reward_choice);
  const isRedeemed = !!data.redeemed_at;

  if (!isRedeemed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold">Not redeemed yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This treat hasn't been redeemed at the counter yet.
          </p>
          <Link
            to="/receipt/$code"
            params={{ code }}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            View receipt
          </Link>
        </div>
      </main>
    );
  }

  const firstName = data.name.split(" ")[0];
  const redeemedAt = new Date(data.redeemed_at as string);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <img src={logo} alt="Sans Sucre" className="mx-auto h-16 w-auto sm:h-20" />
        </div>

        <div className="overflow-hidden rounded-3xl border-2 border-primary/15 bg-card shadow-xl">
          <div className="flex items-center justify-center gap-2 bg-emerald-500 px-6 py-3 text-xs font-medium uppercase tracking-[0.25em] text-white">
            <Check className="h-4 w-4" /> Redeemed
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10 text-center">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">
              Thank you, {firstName}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {copy.thankYou.headline}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.thankYou.sub}</p>

            {reward && (
              <div className="mt-7 rounded-2xl bg-secondary/40 p-5">
                <div className="text-4xl" aria-hidden>{reward.emoji}</div>
                <div className="mt-2 font-display text-xl font-semibold">{reward.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Claimed {formatDateTime(redeemedAt, { dateStyle: "long", timeStyle: "short" })} (PHT)
                </p>
              </div>
            )}

            {/* Feedback */}
            <FeedbackBlock code={code} alreadySubmitted={hasFeedback} copy={copy.thankYou} />

            {/* Future rewards / what's next */}
            <div className="mt-8 rounded-2xl border border-primary/10 bg-primary/5 p-5 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                  {copy.futureRewards.heading}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{copy.futureRewards.body}</p>
            </div>

            {/* Location */}
            <div className="mt-6 flex items-start gap-3 rounded-xl border bg-card p-4 text-left">
              <MapPin className="mt-0.5 h-5 w-5 flex-none text-primary" />
              <div className="text-sm">
                <div className="font-semibold">Sans Sucre</div>
                <div className="text-muted-foreground">
                  Inside Metro Supermarket, Alabang Town Center
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="mt-6">
              <ShareButton
                className="w-full"
                text={copy.thankYou.shareText}
                url={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
              />
            </div>
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

function FeedbackBlock({
  code,
  alreadySubmitted,
  copy,
}: {
  code: string;
  alreadySubmitted: boolean;
  copy: { feedbackPrompt: string; feedbackPlaceholder: string; feedbackSubmit: string; feedbackThanks: string };
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySubmitted);

  if (done) {
    return (
      <div className="mt-7 rounded-2xl border bg-secondary/30 p-5 text-center">
        <Check className="mx-auto h-5 w-5 text-emerald-600" />
        <p className="mt-1 text-sm font-medium">{copy.feedbackThanks}</p>
      </div>
    );
  }

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please pick a rating");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ data: { code, rating, comment: comment.trim() || undefined } });
      setDone(true);
      toast.success(copy.feedbackThanks);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("ALREADY_SUBMITTED")) {
        setDone(true);
      } else {
        toast.error("Could not save feedback. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-7 rounded-2xl border bg-card p-5 text-center">
      <p className="text-sm font-medium">{copy.feedbackPrompt}</p>
      <div className="mt-3 flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="p-1"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                }`}
              />
            </button>
          );
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 500))}
        placeholder={copy.feedbackPlaceholder}
        rows={2}
        className="mt-3"
      />
      <Button onClick={submit} disabled={submitting || rating < 1} className="mt-3 w-full">
        {submitting ? "Sending…" : copy.feedbackSubmit}
      </Button>
    </div>
  );
}