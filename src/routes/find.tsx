import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { findReceiptByMobile } from "@/lib/receipt.functions";
import { useSiteCopy } from "@/hooks/use-site-copy";
import { toast } from "sonner";

export const Route = createFileRoute("/find")({
  head: () => ({
    meta: [
      { title: "Find my reward — Sans Sucre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FindPage,
});

function FindPage() {
  const copy = useSiteCopy();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim() || busy) return;
    setBusy(true);
    setNotFound(false);
    try {
      const res = await findReceiptByMobile({ data: { mobile: mobile.trim() } });
      if (res.found) {
        navigate({ to: "/receipt/$code", params: { code: res.code } });
      } else {
        setNotFound(true);
        if (res.throttled) {
          toast.error("Too many tries. Please wait a few minutes and try again.");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="Sans Sucre" className="h-12 w-auto" />
        </div>
        <div className="rounded-2xl border-2 border-primary/15 bg-card p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold">{copy.findMyReward.heading}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.findMyReward.body}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={copy.findMyReward.placeholder}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="h-12 text-base"
              maxLength={20}
            />
            <Button type="submit" disabled={busy || !mobile.trim()} className="h-12 w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {copy.findMyReward.submit}
            </Button>
          </form>

          {notFound && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-center text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
              {copy.findMyReward.notFound}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Haven't signed up yet?{" "}
            <Link to="/" className="text-primary underline underline-offset-2">
              Pick your treat →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}