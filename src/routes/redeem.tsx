import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scanner, playBeep } from "@/components/scanner";
import { PinPad } from "@/components/pin-pad";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, X, Lock, Loader2 } from "lucide-react";
import { getReward } from "@/lib/rewards";
import logo from "@/assets/sanssucre-logo.png";

export const Route = createFileRoute("/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem — Sans Sucre Staff" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RedeemStation,
});

const SESSION_KEY = "sanssucre_redeem_unlocked";
const PIN_SETTING_KEY = "staff.redeem_pin";
const DEFAULT_PIN = "1234";

type Result =
  | { kind: "success"; name: string; reward: string; rewardEmoji: string; code: string; createdAt: string }
  | { kind: "already"; redeemedAt: string; code: string }
  | { kind: "invalid"; code: string }
  | { kind: "error"; message: string };

function RedeemStation() {
  const [unlocked, setUnlocked] = useState(false);
  const [loadingPin, setLoadingPin] = useState(true);
  const [pin, setPin] = useState(DEFAULT_PIN);
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);

  // Load PIN from settings + check session
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
    }
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", PIN_SETTING_KEY)
        .maybeSingle();
      if (data?.value) {
        const v = typeof data.value === "string"
          ? data.value
          : (data.value as { v?: string }).v;
        if (typeof v === "string" && /^\d{4,6}$/.test(v)) setPin(v);
      }
      setLoadingPin(false);
    })();
  }, []);

  // Today's count
  const loadCount = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .gte("redeemed_at", start.toISOString());
    setTodayCount(count ?? 0);
  }, []);

  useEffect(() => {
    if (unlocked) loadCount();
  }, [unlocked, loadCount]);

  const processCode = useCallback(
    async (rawCode: string) => {
      if (busy) return;
      // Extract pure code: receipt URL contains /receipt/CODE; otherwise treat as raw
      let code = rawCode.trim().toUpperCase();
      const m = code.match(/RECEIPT\/([A-Z0-9]{8,})/);
      if (m) code = m[1];
      // Strip non-alphanumerics
      code = code.replace(/[^A-Z0-9]/g, "");
      if (code.length < 8 || code.length > 64) {
        playBeep(false);
        setResult({ kind: "invalid", code: rawCode });
        setScanning(false);
        setTimeout(() => {
          setResult(null);
          setScanning(true);
        }, 2000);
        return;
      }
      setBusy(true);
      setScanning(false);
      const { data, error } = await supabase.rpc("redeem_signup", { p_code: code });
      setBusy(false);
      if (error) {
        // PostgREST can put the RAISE EXCEPTION text in message, details, or hint.
        const errAny = error as { message?: string; details?: string; hint?: string; code?: string };
        const blob = `${errAny.message ?? ""} ${errAny.details ?? ""} ${errAny.hint ?? ""}`;
        if (blob.includes("ALREADY_REDEEMED")) {
          const at = blob.split("ALREADY_REDEEMED:")[1]?.trim().split(/\s/)[0] ?? "";
          playBeep(false);
          setResult({ kind: "already", redeemedAt: at, code });
          return;
        }
        if (blob.includes("INVALID_CODE")) {
          playBeep(false);
          setResult({ kind: "invalid", code });
          setTimeout(() => {
            setResult(null);
            setScanning(true);
          }, 2000);
          return;
        }
        // Transient backend hiccup (schema cache / connection). Auto-rearm so staff can retry.
        if (errAny.code === "PGRST002" || errAny.code === "PGRST001" || /schema cache|no connection/i.test(blob)) {
          playBeep(false);
          setResult({ kind: "error", message: "Backend is warming up. Please try again in a few seconds." });
          setTimeout(() => {
            setResult(null);
            setScanning(true);
          }, 3000);
          return;
        }
        playBeep(false);
        setResult({ kind: "error", message: errAny.message || "Could not redeem. Try again." });
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const reward = getReward(row?.reward_choice ?? "");
      playBeep(true);
      setResult({
        kind: "success",
        name: row?.name ?? "Customer",
        reward: reward?.title ?? row?.reward_choice ?? "Reward",
        rewardEmoji: reward?.emoji ?? "🎁",
        code,
        createdAt: row?.created_at ?? "",
      });
      loadCount();
      setManualCode("");
      // Auto-rearm after success
      setTimeout(() => {
        setResult(null);
        setScanning(true);
      }, 4500);
    },
    [busy, loadCount],
  );

  const reset = () => {
    setResult(null);
    setScanning(true);
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setResult(null);
  };

  if (loadingPin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
        <img src={logo} alt="Sans Sucre" className="mb-6 h-14 w-auto" />
        <PinPad
          expectedPin={pin}
          hint="Enter staff PIN to start redeeming"
          onUnlock={() => {
            sessionStorage.setItem(SESSION_KEY, "1");
            setUnlocked(true);
          }}
        />
        <Link to="/" className="mt-8 text-xs text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Sans Sucre" className="h-8 w-auto" />
            <span className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Scan station
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium tabular-nums">
              Today: {todayCount ?? "—"}
            </span>
            <Button variant="ghost" size="sm" onClick={lock}>
              <Lock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Scanner OR result */}
        {!result && (
          <>
            <Scanner onResult={processCode} paused={!scanning || busy} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Point the camera at the customer's QR code or barcode
            </p>

            {/* Manual fallback */}
            <div className="mt-6 rounded-2xl border bg-card p-4">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Or enter code manually
              </label>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) processCode(manualCode);
                }}
              >
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VW54RAQ3EFEW"
                  className="font-mono uppercase tracking-widest"
                  autoComplete="off"
                  inputMode="text"
                  maxLength={32}
                />
                <Button type="submit" disabled={busy || !manualCode.trim()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
                </Button>
              </form>
            </div>
          </>
        )}

        {result && (
          <ResultCard result={result} onContinue={reset} />
        )}
      </div>
    </main>
  );
}

function ResultCard({ result, onContinue }: { result: Result; onContinue: () => void }) {
  if (result.kind === "success") {
    return (
      <div className="rounded-3xl border-4 border-emerald-500/70 bg-emerald-50 p-6 text-center shadow-xl dark:bg-emerald-950/20">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-9 w-9" strokeWidth={3} />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400">
          Redeemed
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">Hand over:</h2>
        <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm dark:bg-background">
          <span className="text-3xl">{result.rewardEmoji}</span>
          <span className="font-display text-xl font-semibold">{result.reward}</span>
        </div>
        <p className="mt-5 text-base">
          For: <span className="font-semibold">{result.name}</span>
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{result.code}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link to="/redeemed/$code" params={{ code: result.code }} target="_blank">
              Show customer thank-you
            </Link>
          </Button>
          <Button variant="outline" onClick={onContinue}>
            Next customer
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Auto-clears in a few seconds…</p>
      </div>
    );
  }

  if (result.kind === "already") {
    const when = result.redeemedAt ? new Date(result.redeemedAt) : null;
    return (
      <div className="rounded-3xl border-4 border-rose-500/70 bg-rose-50 p-6 text-center shadow-xl dark:bg-rose-950/20">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white">
          <X className="h-9 w-9" strokeWidth={3} />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-700 dark:text-rose-400">
          Already redeemed
        </p>
        <p className="mt-2 text-base">
          This code was redeemed
          {when && ` on ${when.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}`}.
        </p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{result.code}</p>
        <Button className="mt-5" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  if (result.kind === "invalid") {
    return (
      <div className="rounded-3xl border-4 border-amber-500/60 bg-amber-50 p-6 text-center shadow-xl dark:bg-amber-950/20">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white">
          <AlertTriangle className="h-9 w-9" strokeWidth={2.5} />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-amber-400">
          Code not found
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Please check the code and try again.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 bg-card p-6 text-center">
      <p className="text-sm">{result.message}</p>
      <Button className="mt-4" onClick={onContinue}>Continue</Button>
    </div>
  );
}