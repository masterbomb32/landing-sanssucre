import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Sans Sucre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: LoginPage,
});

/** Only allow same-origin relative paths as a post-login redirect. */
function safeNext(next?: string) {
  if (!next) return undefined;
  if (!next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const target = safeNext(next);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + (target ?? "/admin") },
        });
        if (error) throw error;
        toast.success("Account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      if (target) {
        window.location.href = target;
        return;
      }
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src={logo} alt="Sans Sucre" className="mx-auto h-14 w-auto" />
          <h1 className="mt-4 font-display text-2xl">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sans Sucre staff only.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signup" ? "Have an account? Sign in" : "First-time admin? Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          The first account created becomes the admin. <Link to="/" className="underline">Back to site</Link>
        </p>
      </div>
    </main>
  );
}
