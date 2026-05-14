import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Scanner, playBeep } from "@/components/scanner";
import { PinPad } from "@/components/pin-pad";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, X, Lock, Loader2, Undo2, FlaskConical, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { getReward } from "@/lib/rewards";
import { formatDateTime, manilaStartOfTodayISO } from "@/lib/format-date";
import { toast } from "sonner";
import logo from "@/assets/sanssucre-logo.png";
import {
  findLocalCode,
  isLocallyRedeemed,
  markLocallyRedeemed,
  saveUnredeemed,
  getCacheFetchedAt,
} from "@/lib/redeem-cache";
import { enqueue, listOutbox, outboxSize, replaceOutbox } from "@/lib/redeem-outbox";
import { prefetchUnredeemed, redeemBatch } from "@/server/redeem.functions";

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
const PIN_CACHE_KEY = "sanssucre_redeem_pin_cache";
const HOLD_SETTING_KEY = "staff.redeem_hold_seconds";
const TEST_MODE_KEY = "staff.test_mode"; // values: "off" | "fake" | "prefix"
const UNDO_WINDOW_SECONDS = 30;
const DEFAULT_HOLD_SECONDS = 8;

type TestMode = "off" | "fake" | "prefix";

type Result =
  | { kind: "success"; name: string; reward: string; rewardEmoji: string; code: string; createdAt: string; isTest?: boolean }
  | { kind: "already"; redeemedAt: string; code: string }
  | { kind: "invalid"; code: string }
  | { kind: "error"; message: string };

function RedeemStation() {
  const [unlocked, setUnlocked] = useState(false);
  const [loadingPin, setLoadingPin] = useState(true);
  const [holdSeconds, setHoldSeconds] = useState<number>(DEFAULT_HOLD_SECONDS);
  const [testMode, setTestMode] = useState<TestMode>("off");
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [undoSecondsLeft, setUndoSecondsLeft] = useState<number | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [online, setOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [queueCount, setQueueCount] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);
  const [cacheAt, setCacheAt] = useState<number | null>(null);
  const prefetchFn = useServerFn(prefetchUnredeemed);
  const batchFn = useServerFn(redeemBatch);

  // Load PIN from settings + check session
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
    }
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", [HOLD_SETTING_KEY, TEST_MODE_KEY]);
      for (const row of data ?? []) {
        const v = typeof row.value === "string"
          ? row.value
          : (row.value as { v?: string })?.v;
        if (row.key === HOLD_SETTING_KEY && typeof v === "string") {
          const n = parseInt(v, 10);
          if (!Number.isNaN(n) && n >= 0 && n <= 120) setHoldSeconds(n);
        }
        if (row.key === TEST_MODE_KEY && typeof v === "string") {
          if (v === "fake" || v === "prefix" || v === "off") setTestMode(v);
        }
      }
      setLoadingPin(false);
    })();
  }, []);

  // Online/offline tracking
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Refresh queue count + cache age periodically
  useEffect(() => {
    if (!unlocked) return;
    let stop = false;
    const tick = async () => {
      const [n, at] = await Promise.all([outboxSize(), getCacheFetchedAt()]);
      if (!stop) {
        setQueueCount(n);
        setCacheAt(at);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [unlocked]);

  // Drain outbox whenever we are online and have queued items
  const drainOutbox = useCallback(async () => {
    if (syncing) return;
    const items = await listOutbox();
    if (items.length === 0) return;
    const pin = sessionStorage.getItem(PIN_CACHE_KEY);
    if (!pin) return; // can't sync without the staff PIN this session
    setSyncing(true);
    try {
      const { results } = await batchFn({
        data: {
          pin,
          items: items.map((i) => ({ id: i.id, code: i.code, redeemed_at: i.redeemed_at })),
        },
      });
      const conflicts = results.filter((r) => r.status === "already").length;
      const invalids = results.filter((r) => r.status === "invalid").length;
      const errored = results.filter((r) => r.status === "error");
      // Keep only items that errored transiently for retry; drop ok/already/invalid.
      const erroredIds = new Set(errored.map((e) => e.id));
      const remaining = items.filter((i) => erroredIds.has(i.id));
      await replaceOutbox(remaining);
      setQueueCount(remaining.length);
      if (conflicts > 0) {
        toast.warning(`${conflicts} queued scan(s) were already redeemed elsewhere.`);
      }
      if (invalids > 0) {
        toast.error(`${invalids} queued scan(s) had invalid codes — discarded.`);
      }
      if (remaining.length === 0 && results.some((r) => r.status === "ok")) {
        toast.success("Queued redemptions synced.");
      }
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  }, [batchFn, syncing]);

  useEffect(() => {
    if (online && unlocked && queueCount > 0) {
      drainOutbox();
    }
  }, [online, unlocked, queueCount, drainOutbox]);

  // Today's count
  const loadCount = useCallback(async () => {
    const { count } = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .gte("redeemed_at", manilaStartOfTodayISO());
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

      // TEST MODE — "fake": never touch DB, fabricate a successful scan
      if (testMode === "fake") {
        const reward = getReward("croissant") ?? { title: "Test Treat", emoji: "🧪", description: "" };
        playBeep(true);
        setScanning(false);
        setResult({
          kind: "success",
          name: "Test Customer",
          reward: reward.title,
          rewardEmoji: reward.emoji,
          code,
          createdAt: new Date().toISOString(),
          isTest: true,
        });
        setManualCode("");
        setPaused(false);
        setCountdown(holdSeconds > 0 ? holdSeconds : null);
        setUndoSecondsLeft(null);
        return;
      }

      // TEST MODE — "prefix": only act on codes starting with TEST; real DB write but tagged in audit
      const isPrefixTest = testMode === "prefix" && code.startsWith("TEST");

      // OFFLINE PATH — accept locally if the code is in the prefetched set.
      if (!online) {
        const local = await findLocalCode(code);
        if (!local) {
          playBeep(false);
          setResult({
            kind: "error",
            message: "Offline and code not in local cache. Cannot verify.",
          });
          setTimeout(() => {
            setResult(null);
            setScanning(true);
          }, 2500);
          return;
        }
        if (await isLocallyRedeemed(code)) {
          playBeep(false);
          setResult({ kind: "already", redeemedAt: "", code });
          return;
        }
        await markLocallyRedeemed(code);
        await enqueue(code);
        setQueueCount(await outboxSize());
        const reward = getReward(local.reward_choice);
        playBeep(true);
        setScanning(false);
        setResult({
          kind: "success",
          name: local.name,
          reward: reward?.title ?? local.reward_choice,
          rewardEmoji: reward?.emoji ?? "🎁",
          code,
          createdAt: local.created_at,
          isTest: false,
        });
        setManualCode("");
        setPaused(false);
        setCountdown(holdSeconds > 0 ? holdSeconds : null);
        setUndoSecondsLeft(null);
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
        isTest: isPrefixTest,
      });
      loadCount();
      setManualCode("");
      // Initialize countdown — handled by effect below. 0 = no auto-clear.
      setPaused(false);
      setCountdown(holdSeconds > 0 ? holdSeconds : null);
      // Arm the undo window
      setUndoSecondsLeft(UNDO_WINDOW_SECONDS);
    },
    [busy, loadCount, holdSeconds, testMode, online],
  );

  // Countdown ticker for the success card
  useEffect(() => {
    if (countdown === null || paused) return;
    if (countdown <= 0) {
      setResult(null);
      setScanning(true);
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, paused]);

  // Undo window ticker — independent of the auto-dismiss countdown so pause doesn't extend undo time
  useEffect(() => {
    if (undoSecondsLeft === null) return;
    if (undoSecondsLeft <= 0) {
      setUndoSecondsLeft(null);
      return;
    }
    const t = setTimeout(() => setUndoSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [undoSecondsLeft]);

  const undoLast = useCallback(async () => {
    if (!result || result.kind !== "success" || undoing) return;
    const code = result.code;
    // Fake-mode "redemption" has no DB row to revert
    if (result.isTest && testMode === "fake") {
      toast.success("Test reverted.");
      setResult(null);
      setScanning(true);
      setCountdown(null);
      setUndoSecondsLeft(null);
      return;
    }
    setUndoing(true);
    const { error } = await supabase.rpc("unredeem_signup", {
      p_code: code,
      p_window_seconds: UNDO_WINDOW_SECONDS,
    });
    setUndoing(false);
    if (error) {
      const blob = `${error.message ?? ""}`;
      if (blob.includes("WINDOW_EXPIRED")) {
        toast.error("Undo window has passed. Ask the customer to re-scan or contact admin.");
      } else if (blob.includes("NOT_REDEEMED")) {
        toast.message("Already reverted.");
      } else {
        toast.error("Could not undo. Try again.");
      }
      return;
    }
    playBeep(false);
    toast.success("Redemption reverted.");
    loadCount();
    setResult(null);
    setScanning(true);
    setCountdown(null);
    setUndoSecondsLeft(null);
  }, [result, undoing, testMode, loadCount]);

  const reset = () => {
    setResult(null);
    setScanning(true);
    setCountdown(null);
    setPaused(false);
    setUndoSecondsLeft(null);
  };

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PIN_CACHE_KEY);
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
          hint="Enter staff PIN to start redeeming"
          onVerify={async (entered) => {
            const { data, error } = await supabase.rpc("verify_staff_pin", { p_pin: entered });
            if (error) return false;
            if (data === true) {
              // Cache PIN in sessionStorage for offline cache prefetch + outbox sync.
              sessionStorage.setItem(PIN_CACHE_KEY, entered);
              // Fire-and-forget prefetch of unredeemed codes for offline use.
              prefetchFn({ data: { pin: entered } })
                .then(async (res) => {
                  await saveUnredeemed(res.codes);
                  setCacheAt(Date.now());
                })
                .catch(() => undefined);
              return true;
            }
            return false;
          }}
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
      {testMode !== "off" && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-950">
          <FlaskConical className="h-3.5 w-3.5" />
          {testMode === "fake"
            ? "Test mode — no real redemptions"
            : "Test mode — only codes starting with TEST will redeem"}
        </div>
      )}
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
            <SyncPill
              online={online}
              queueCount={queueCount}
              syncing={syncing}
              onSync={drainOutbox}
              cacheAt={cacheAt}
            />
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
              Point the camera at the customer's QR code
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
          <ResultCard
            result={result}
            onContinue={reset}
            countdown={countdown}
            paused={paused}
            onTogglePause={() => setPaused((p) => !p)}
            undoSecondsLeft={undoSecondsLeft}
            onUndo={undoLast}
            undoing={undoing}
          />
        )}
      </div>
    </main>
  );
}

function ResultCard({
  result,
  onContinue,
  countdown,
  paused,
  onTogglePause,
  undoSecondsLeft,
  onUndo,
  undoing,
}: {
  result: Result;
  onContinue: () => void;
  countdown?: number | null;
  paused?: boolean;
  onTogglePause?: () => void;
  undoSecondsLeft?: number | null;
  onUndo?: () => void;
  undoing?: boolean;
}) {
  if (result.kind === "success") {
    return (
      <div className="rounded-3xl border-4 border-emerald-500/70 bg-emerald-50 p-6 text-center shadow-xl dark:bg-emerald-950/20">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-9 w-9" strokeWidth={3} />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400">
          {result.isTest ? "Redeemed (TEST)" : "Redeemed"}
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
          <Button onClick={onContinue} size="lg" className="font-semibold">
            Done — next customer
          </Button>
          {undoSecondsLeft !== null && undoSecondsLeft !== undefined && undoSecondsLeft > 0 && onUndo && (
            <Button
              variant="outline"
              size="lg"
              onClick={onUndo}
              disabled={undoing}
              className="border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:text-amber-400"
            >
              {undoing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}
              Undo ({undoSecondsLeft}s)
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/redeemed/$code" params={{ code: result.code }} target="_blank">
              Show customer thank-you
            </Link>
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          {countdown === null || countdown === undefined ? (
            <span>Stays on screen until dismissed</span>
          ) : paused ? (
            <>
              <span>Paused</span>
              <button type="button" onClick={onTogglePause} className="underline underline-offset-2 hover:text-foreground">
                Resume
              </button>
            </>
          ) : (
            <>
              <span>Auto-clears in {countdown}s</span>
              <button type="button" onClick={onTogglePause} className="underline underline-offset-2 hover:text-foreground">
                Pause
              </button>
            </>
          )}
        </div>
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
          {when && ` on ${formatDateTime(when, { dateStyle: "medium", timeStyle: "short" })} (PHT)`}.
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

function SyncPill({
  online,
  queueCount,
  syncing,
  onSync,
  cacheAt,
}: {
  online: boolean;
  queueCount: number;
  syncing: boolean;
  onSync: () => void;
  cacheAt: number | null;
}) {
  const stale = cacheAt && Date.now() - cacheAt > 10 * 60 * 1000;
  let tone = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  let Icon = Wifi;
  let label = "Online";
  if (!online) {
    tone = "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
    Icon = WifiOff;
    label = queueCount > 0 ? `Offline · ${queueCount} queued` : "Offline";
  } else if (queueCount > 0) {
    tone = "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
    label = syncing ? "Syncing…" : `${queueCount} queued`;
  } else if (stale) {
    tone = "bg-secondary text-foreground";
    label = "Cache stale";
  }
  return (
    <button
      type="button"
      onClick={online && queueCount > 0 && !syncing ? onSync : undefined}
      title={
        cacheAt
          ? `Code cache updated ${new Date(cacheAt).toLocaleTimeString()}`
          : "Code cache not loaded yet"
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone} ${
        online && queueCount > 0 ? "hover:brightness-95" : "cursor-default"
      }`}
    >
      {syncing ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      <span>{label}</span>
    </button>
  );
}