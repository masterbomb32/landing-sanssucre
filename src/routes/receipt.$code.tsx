import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/receipt/$code")({
  component: ReceiptPage,
});

function ReceiptPage() {
  const { code } = Route.useParams();
  return (
    <main className="min-h-screen bg-background px-5 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="font-display text-3xl">Your reward is reserved</h1>
        <p className="mt-3 text-muted-foreground">
          Show this code at Sans Sucre on opening day.
        </p>
        <div className="mt-6 rounded-lg bg-muted/40 px-4 py-3 font-mono text-lg tracking-widest">
          {code}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Full receipt page (barcode + share) coming next.
        </p>
      </div>
    </main>
  );
}