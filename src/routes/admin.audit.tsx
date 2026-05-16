import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format-date";
import { downloadCsv, csvDate } from "@/lib/csv";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

type Row = {
  id: string;
  created_at: string;
  signup_id: string | null;
  code: string;
  action: string;
  station: string | null;
  note: string | null;
};

function AuditPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("redemption_audit")
        .select("id,created_at,signup_id,code,action,station,note")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) {
        setRows([]);
        return;
      }
      setRows(data ?? []);
      const ids = Array.from(new Set((data ?? []).map((r) => r.signup_id).filter(Boolean) as string[]));
      if (ids.length > 0) {
        const { data: sd } = await supabase.from("signups").select("id,name").in("id", ids);
        const map: Record<string, string> = {};
        for (const s of sd ?? []) map[s.id] = s.name;
        setNames(map);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(s) ||
        r.action.toLowerCase().includes(s) ||
        (r.signup_id ? (names[r.signup_id] ?? "").toLowerCase().includes(s) : false),
    );
  }, [rows, q, names]);

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportCsv = () => {
    downloadCsv(
      `sanssucre-audit-${csvDate()}.csv`,
      ["created_at", "action", "code", "signup_name", "station", "note"],
      filtered.map((r) => [
        r.created_at,
        r.action,
        r.code,
        r.signup_id ? names[r.signup_id] ?? "" : "",
        r.station ?? "",
        r.note ?? "",
      ]),
    );
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
      <h1 className="font-display text-2xl">Redemption audit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every redeem / unredeem / void action, newest first.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code, action, name"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Signup</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateTime(r.created_at, { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                    {r.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                <td className="px-4 py-3">{r.signup_id ? names[r.signup_id] ?? "—" : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.note ?? ""}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No audit entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages} · {filtered.length} entries
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}