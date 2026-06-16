import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Check, Instagram, Facebook, Mail, Loader2 } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import heroWebp from "@/assets/red-velvet-hero.webp";
import heroPng from "@/assets/red-velvet-hero.png";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchReceipt } from "@/lib/receipt.functions";
import { submitFeedback, fetchFeedbackStatus } from "@/lib/redeem.functions";
import { subscribeMailingList } from "@/lib/mailing.functions";
import { supabase } from "@/integrations/supabase/client";
import { getReward } from "@/lib/rewards";
import { useSiteCopy } from "@/hooks/use-site-copy";
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : "";
  return `${head}${"*".repeat(Math.max(1, local.length - head.length - tail.length))}${tail}@${domain}`;
}

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

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border-2 border-primary/15 bg-card shadow-xl">
          {/* Red velvet hero — no overlay */}
          <div className="relative">
            <picture>
              <source srcSet={heroWebp} type="image/webp" />
              <img
                src={heroPng}
                alt="A red velvet treat from Sans Sucre"
                className="block h-40 w-full object-cover sm:h-48"
                loading="eager"
              />
            </picture>
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white shadow-md">
              <Check className="h-3 w-3" /> Redeemed
            </span>
          </div>

          <div className="px-5 py-4 sm:px-6 sm:py-5">
            <div className="text-center">
              <img src={logo} alt="Sans Sucre" className="mx-auto h-10 w-auto sm:h-12" />
              <p className="mt-2 font-display text-[10px] uppercase tracking-[0.3em] text-primary">
                Thank you, {firstName}
              </p>
              <h1 className="mt-0.5 font-display text-xl font-bold leading-tight sm:text-2xl">
                {copy.thankYou.headline}
              </h1>
            </div>

            {reward && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-secondary/40 px-4 py-2">
                <span className="text-2xl" aria-hidden>{reward.emoji}</span>
                <span className="font-display text-sm font-semibold">{reward.title}</span>
              </div>
            )}

            <div className="mt-3 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {copy.social.followPrompt}
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <a
                  href={copy.social.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={copy.social.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <ShareButton
                  variant="outline"
                  size="icon"
                  iconOnly
                  className="h-9 w-9 rounded-full"
                  text={copy.thankYou.shareText}
                  url={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
                />
              </div>
            </div>

            <div className="mt-3">
              <MailingListBlock
                code={code}
                hasEmail={false}
                existingEmail={undefined}
                copy={copy.mailingList}
              />
            </div>

            <div className="mt-3 border-t pt-3">
              <FeedbackBlock code={code} alreadySubmitted={hasFeedback} copy={copy.thankYou} />
            </div>
          </div>
        </div>

        <div className="mt-2 text-center">
          <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">
            ← sanssucre.ph
          </Link>
        </div>
      </div>
    </main>
  );
}

function MailingListBlock({
  code,
  hasEmail,
  existingEmail,
  copy,
}: {
  code: string;
  hasEmail: boolean;
  existingEmail?: string;
  copy: {
    headingNoEmail: string;
    bodyNoEmail: string;
    placeholder: string;
    submit: string;
    success: string;
    headingHasEmail: string;
    bodyHasEmail: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (hasEmail) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
        <Mail className="mt-0.5 h-4 w-4 flex-none text-primary" />
        <div className="text-left text-xs">
          <div className="font-semibold">{copy.headingHasEmail}</div>
          <div className="text-muted-foreground">
            {copy.bodyHasEmail.replace("{email}", maskEmail(existingEmail ?? ""))}
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="h-4 w-4" /> {copy.success}
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      await subscribeMailingList({ data: { code, email: email.trim() } });
      setDone(true);
      toast.success(copy.success);
    } catch {
      toast.error("Could not subscribe. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Mail className="mt-0.5 h-4 w-4 flex-none text-primary" />
        <div className="text-left text-xs">
          <div className="font-semibold">{copy.headingNoEmail}</div>
          <div className="text-muted-foreground">{copy.bodyNoEmail}</div>
        </div>
      </div>
      <form onSubmit={submit} className="mt-2 flex gap-1.5">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 254))}
          placeholder={copy.placeholder}
          className="h-8 text-xs"
          required
        />
        <Button type="submit" size="sm" disabled={submitting} className="h-8 px-3 text-xs">
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : copy.submit}
        </Button>
      </form>
    </div>
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
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySubmitted);
  const [showComment, setShowComment] = useState(false);
  const [sharePublicly, setSharePublicly] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  if (done) {
    return (
      <div className="space-y-1.5 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600">
          <Check className="h-3.5 w-3.5" /> {copy.feedbackThanks}
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please pick a rating");
      return;
    }
    if (sharePublicly && comment.trim().length < 5) {
      toast.error("Please add a short story to share publicly.");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | undefined;
      if (sharePublicly && photo) {
        if (photo.size > 5 * 1024 * 1024) {
          toast.error("Photo must be smaller than 5MB.");
          setSubmitting(false);
          return;
        }
        const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("testimonial-photos")
          .upload(path, photo, { contentType: photo.type, cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("testimonial-photos").getPublicUrl(path);
        photo_url = pub.publicUrl;
      }
      await submitFeedback({
        data: {
          code,
          rating,
          comment: comment.trim() || undefined,
          share_publicly: sharePublicly,
          photo_url,
          source: sharePublicly ? source.trim() || undefined : undefined,
        },
      });
      setDone(true);
      toast.success(copy.feedbackThanks);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("ALREADY_SUBMITTED")) setDone(true);
      else toast.error("Could not save feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {copy.feedbackPrompt}
      </p>
      <div className="mt-1 flex justify-center">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => {
                setRating(n);
                setShowComment(true);
              }}
              className="p-2"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                }`}
              />
            </button>
          );
        })}
      </div>
      {showComment && (
        <div className="mt-2 space-y-2 text-left">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder={copy.feedbackPlaceholder}
            rows={2}
            className="min-h-12 resize-none text-xs"
          />
          <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <Checkbox
              checked={sharePublicly}
              onCheckedChange={(v) => setSharePublicly(v === true)}
              className="mt-0.5"
            />
            <span>Share my story publicly on the Sans Sucre site (with my name).</span>
          </label>
          {sharePublicly && (
            <div className="space-y-2 rounded-lg border border-primary/15 bg-primary/5 p-3">
              <label className="block text-[11px] text-muted-foreground">
                Where you're from (optional)
              </label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value.slice(0, 100))}
                placeholder="Alabang, Muntinlupa"
                className="h-8 text-xs"
                maxLength={100}
              />
              <label className="block text-[11px] text-muted-foreground">
                Add a photo (optional)
              </label>
              <Input
                type="file"
                accept="image/*"
                className="h-8 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhoto(file);
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {photoPreview && (
                <div className="space-y-1">
                  <img src={photoPreview} alt="" className="h-20 w-20 rounded-md border object-cover" />
                  {photo?.name && (
                    <p className="truncate text-[10px] text-muted-foreground">{photo.name}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <Button onClick={submit} disabled={submitting || rating < 1} size="sm" className="w-full h-8 text-xs">
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : copy.feedbackSubmit}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Or{" "}
            <Link
              to="/share-your-story"
              search={{ code }}
              className="text-primary underline underline-offset-2"
            >
              share a fuller story publicly →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
