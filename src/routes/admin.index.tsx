import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Download, Check, Star, Share2, Eye } from "lucide-react";
import { REWARDS, getReward } from "@/lib/rewards";
import { formatDateTime } from "@/lib/format-date";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Signup {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  reward_choice: string;
  redemption_code: string;
  redeemed_at: string | null;
  created_at: string;
}

interface Visit {
  visitor_hash: string;
  path: string;
  referrer: string | null;
  created_at: string;
}

interface ShareEvent {
  channel: string;
  path: string;
  created_at: string;
}

interface FeedbackRow {
  id: string;
  signup_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function Dashboard() {
  const [rows, setRows] = useState<Signup[] | null>(null);
  const [q, setQ] = useState("");
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [shares, setShares] = useState<ShareEvent[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);

  const load = async () => {
    const [signupsRes, visitsRes, sharesRes, feedbackRes] = await Promise.all([
      supabase
        .from("signups")
        .select("id,name,mobile,email,reward_choice,redemption_code,redeemed_at,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("page_visits")
        .select("visitor_hash,path,referrer,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("share_events")
        .select("channel,path,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("feedback")
        .select("id,signup_id,rating,comment,created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    if (signupsRes.error) {
      toast.error(signupsRes.error.message);
      setRows([]);
      return;
    }
    setRows(signupsRes.data ?? []);
    setVisits(visitsRes.data ?? []);
    setShares(sharesRes.data ?? []);
    setFeedback(feedbackRes.data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        r.mobile.toLowerCase().includes(s) ||
        (r.email ?? "").toLowerCase().includes(s) ||
        r.redemption_code.toLowerCase().includes(s),
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const list = rows ?? [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = list.filter((r) => new Date(r.created_at) >= todayStart).length;
    const redeemed = list.filter((r) => !!r.redeemed_at).length;
    const byReward: Record<string, number> = {};
    for (const r of list) byReward[r.reward_choice] = (byReward[r.reward_choice] ?? 0) + 1;
    return { total: list.length, today, redeemed, byReward };
  }, [rows]);

  const landingStats = useMemo(() => {
    const totalVisits = visits.length;
    const uniqueVisitors = new Set(visits.map((v) => v.visitor_hash)).size;
    const conv = uniqueVisitors > 0 ? Math.round(((rows?.length ?? 0) / uniqueVisitors) * 100) : 0;
    const byPath: Record<string, number> = {};
    for (const v of visits) byPath[v.path] = (byPath[v.path] ?? 0) + 1;
    return { totalVisits, uniqueVisitors, conv, byPath };
  }, [visits, rows]);

  const shareStats = useMemo(() => {
    const total = shares.length;
    const byChannel: Record<string, number> = {};
    for (const s of shares) byChannel[s.channel] = (byChannel[s.channel] ?? 0) + 1;
    return { total, byChannel };
  }, [shares]);

  const feedbackStats = useMemo(() => {
    const total = feedback.length;
    const avg = total ? feedback.reduce((sum, f) => sum + f.rating, 0) / total : 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const f of feedback) dist[f.rating] = (dist[f.rating] ?? 0) + 1;
    const responseRate = stats.redeemed > 0 ? Math.round((total / stats.redeemed) * 100) : 0;
    const recentComments = feedback.filter((f) => f.comment && f.comment.trim().length > 0).slice(0, 8);
    return { total, avg, dist, responseRate, recentComments };
  }, [feedback, stats.redeemed]);

  const signupNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const r of rows ?? []) m[r.id] = r.name;
    return m;
  }, [rows]);

  const exportCsv = () => {
    const list = filtered;
    const header = ["created_at", "name", "mobile", "email", "reward", "code", "redeemed_at"];
    const lines = [header.join(",")];
    for (const r of list) {
      const reward = getReward(r.reward_choice)?.title ?? r.reward_choice;
      lines.push(
        [r.created_at, r.name, r.mobile, r.email ?? "", reward, r.redemption_code, r.redeemed_at ?? ""]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanssucre-signups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markRedeemed = async (code: string) => {
    setBusyCode(code);
    const { error } = await supabase.rpc("redeem_signup", { p_code: code });
    setBusyCode(null);
    if (error) {
      const msg = error.message.includes("ALREADY_REDEEMED") ? "Already redeemed." : error.message;
      toast.error(msg);
      return;
    }
    toast.success("Marked as redeemed.");
    load();
  };

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total signups" value={stats.total} />
        <StatCard label="Today" value={stats.today} />
        <StatCard label="Redeemed" value={stats.redeemed} />
        <StatCard
          label="Redemption rate"
          value={stats.total ? `${Math.round((stats.redeemed / stats.total) * 100)}%` : "—"}
        />
      </div>

      {/* Reward breakdown */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          By reward
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {REWARDS.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
              <span className="text-sm">
                <span className="mr-1.5">{r.emoji}</span>
                {r.title}
              </span>
              <span className="font-semibold tabular-nums">{stats.byReward[r.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Landing analytics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <Eye className="h-4 w-4" /> Traffic
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniStat label="Page views" value={landingStats.totalVisits} />
            <MiniStat label="Unique visitors" value={landingStats.uniqueVisitors} />
          </div>
          <div className="mt-3 rounded-lg bg-secondary/40 px-4 py-3">
            <div className="text-xs text-muted-foreground">Visitor → signup</div>
            <div className="mt-0.5 font-display text-xl font-bold tabular-nums">
              {landingStats.conv}%
            </div>
          </div>
          {Object.keys(landingStats.byPath).length > 0 && (
            <div className="mt-3 space-y-1 text-xs">
              <div className="text-muted-foreground">Top paths</div>
              {Object.entries(landingStats.byPath)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([p, n]) => (
                  <div key={p} className="flex justify-between">
                    <span className="truncate font-mono">{p}</span>
                    <span className="tabular-nums">{n}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <Share2 className="h-4 w-4" /> Shares
          </h2>
          <div className="mt-3 rounded-lg bg-secondary/40 px-4 py-3">
            <div className="text-xs text-muted-foreground">Total share actions</div>
            <div className="mt-0.5 font-display text-xl font-bold tabular-nums">
              {shareStats.total}
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            {(["native", "whatsapp", "facebook", "copy", "dialog_open"] as const).map((c) => (
              <div key={c} className="flex items-center justify-between">
                <span className="capitalize text-muted-foreground">
                  {c === "dialog_open" ? "Opened share dialog" : c}
                </span>
                <span className="tabular-nums font-medium">{shareStats.byChannel[c] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            <Star className="h-4 w-4" /> Feedback
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniStat
              label="Avg rating"
              value={feedbackStats.total ? feedbackStats.avg.toFixed(1) : "—"}
            />
            <MiniStat label="Responses" value={feedbackStats.total} />
          </div>
          <div className="mt-3 rounded-lg bg-secondary/40 px-4 py-3">
            <div className="text-xs text-muted-foreground">Response rate (of redeemed)</div>
            <div className="mt-0.5 font-display text-xl font-bold tabular-nums">
              {feedbackStats.responseRate}%
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = feedbackStats.dist[n] ?? 0;
              const pct = feedbackStats.total ? (count / feedbackStats.total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="w-3 tabular-nums text-muted-foreground">{n}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent comments */}
      {feedbackStats.recentComments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Recent comments
          </h2>
          <ul className="mt-3 divide-y">
            {feedbackStats.recentComments.map((f) => (
              <li key={f.id} className="py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">{"★".repeat(f.rating)}<span className="text-muted-foreground/30">{"★".repeat(5 - f.rating)}</span></span>
                  <span className="text-xs text-muted-foreground">
                    {signupNameById[f.signup_id] ?? "Guest"} ·{" "}
                    {formatDateTime(f.created_at, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <p className="mt-1 text-foreground/90">{f.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search + export */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, mobile, email, code"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Reward</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const reward = getReward(r.reward_choice);
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(r.created_at, { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {r.name}
                    {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.mobile}</td>
                  <td className="px-4 py-3">{reward ? `${reward.emoji} ${reward.title}` : r.reward_choice}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/receipt/$code"
                      params={{ code: r.redemption_code }}
                      className="font-mono text-xs underline underline-offset-2"
                    >
                      {r.redemption_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.redeemed_at ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                        <Check className="h-3 w-3" /> Redeemed
                      </span>
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Reserved</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!r.redeemed_at && (
                      <Button size="sm" variant="outline" disabled={busyCode === r.redemption_code} onClick={() => markRedeemed(r.redemption_code)}>
                        {busyCode === r.redemption_code ? <Loader2 className="h-3 w-3 animate-spin" /> : "Redeem"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No signups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-secondary/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
