import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Search, MailX, MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { downloadCsv, csvDate } from "@/lib/csv";
import { toast } from "sonner";
import { unsubscribeMailing, resubscribeMailing } from "@/server/admin.functions";

export const Route = createFileRoute("/admin/mailing")({
  head: () => ({ meta: [{ title: "Mailing list — Admin" }, { name: "robots", content: "noindex" }] }),
  component: MailingPage,
});

type Row = {
  id: string;
  signup_id: string;
  email: string;
  source: string;
  created_at: string;
  unsubscribed_at: string | null;
};

function MailingPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [showUnsub, setShowUnsub] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const unsub = useServerFn(unsubscribeMailing);
  const resub = useServerFn(resubscribeMailing);

  const load = async () => {
    const { data, error } = await supabase
      .from("mailing_subscriptions")
      .select("id,signup_id,email,source,created_at,unsubscribed_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const list = (data ?? []) as Row[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.signup_id).filter(Boolean)));
    if (ids.length > 0) {
      const { data: sd } = await supabase.from("signups").select("id,name").in("id", ids);
      const map: Record<string, string> = {};
      for (const s of sd ?? []) map[s.id] = s.name;
      setNames(map);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (!showUnsub && r.unsubscribed_at) return false;
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return (
        r.email.toLowerCase().includes(s) ||
        (names[r.signup_id] ?? "").toLowerCase().includes(s)
      );
    });
  }, [rows, q, showUnsub, names]);

  const exportCsv = () => {
    downloadCsv(
      `sanssucre-mailing-${csvDate()}.csv`,
      ["email", "name", "source", "subscribed_at", "unsubscribed_at"],
      filtered.map((r) => [
        r.email,
        names[r.signup_id] ?? "",
        r.source,
        r.created_at,
        r.unsubscribed_at ?? "",
      ]),
    );
  };

  const handleUnsub = async (id: string) => {
    setBusy(id);
    try {
      await unsub({ data: { id } });
      toast.success("Unsubscribed.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const handleResub = async (id: string) => {
    setBusy(id);
    try {
      await resub({ data: { id } });
      toast.success("Resubscribed.");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCount = rows.filter((r) => !r.unsubscribed_at).length;
  const unsubCount = rows.length - activeCount;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="font-display text-2xl">Mailing list</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {activeCount} active · {unsubCount} unsubscribed
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search email or name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showUnsub ? "default" : "outline"}
            onClick={() => setShowUnsub((v) => !v)}
          >
            {showUnsub ? "Hide unsubscribed" : "Show unsubscribed"}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Subscribed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-medium">{r.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{names[r.signup_id] ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{r.source}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDateTime(r.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  {r.unsubscribed_at ? (
                    <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                      Unsubscribed
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.unsubscribed_at ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === r.id}
                      onClick={() => handleResub(r.id)}
                    >
                      {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><MailCheck className="h-3.5 w-3.5" /> Resub</>}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy === r.id}
                      onClick={() => handleUnsub(r.id)}
                    >
                      {busy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><MailX className="h-3.5 w-3.5" /> Unsub</>}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No subscribers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}