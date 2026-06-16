import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listErrors, clearErrors } from "@/lib/errors.functions";
import { formatDateTime } from "@/lib/format-date";

export const Route = createFileRoute("/admin/errors")({
  component: ErrorsPage,
});

type ErrorRow = {
  id: string;
  source: string;
  level: string;
  message: string;
  stack: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
  context: unknown;
};

function ErrorsPage() {
  const listFn = useServerFn(listErrors);
  const clearFn = useServerFn(clearErrors);
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"all" | "client" | "server">("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { errors } = await listFn({ data: { source, limit: 200 } });
      setRows(errors as ErrorRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load errors");
    } finally {
      setLoading(false);
    }
  }, [listFn, source]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Error log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent client + server errors. Used to catch silent failures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as typeof source)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="all">All sources</option>
            <option value="client">Client only</option>
            <option value="server">Server only</option>
          </select>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!window.confirm("Delete error log entries older than 30 days?")) return;
              try {
                await clearFn();
                toast.success("Old entries cleared.");
                load();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not clear");
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear &gt;30d
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No errors logged. 🎉
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <button
                  className="flex w-full items-start justify-between gap-3 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          r.source === "server"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {r.source}
                      </span>
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                        {r.level}
                      </span>
                      {r.path && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {r.path}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate font-medium">{r.message}</div>
                  </div>
                  <div className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(r.created_at, { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </button>
                {open[r.id] && (
                  <div className="mt-2 space-y-2 rounded-md bg-muted/40 p-3 text-xs">
                    {r.stack && (
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                        {r.stack}
                      </pre>
                    )}
                    {r.user_agent && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">UA:</span> {r.user_agent}
                      </div>
                    )}
                    {r.context !== null && r.context !== undefined && (
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground">
                        {JSON.stringify(r.context, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}