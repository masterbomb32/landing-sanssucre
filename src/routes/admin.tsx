import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogOut } from "lucide-react";
import logo from "@/assets/sanssucre-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Sans Sucre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      // Try to claim admin if no admin exists; otherwise check role.
      const { data, error } = await supabase.rpc("claim_admin_if_first");
      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account isn't an admin. Ask the owner to grant access.
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/mailing", label: "Mailing" },
    { to: "/admin/audit", label: "Audit" },
    { to: "/admin/copy", label: "Edit copy" },
    { to: "/admin/faqs", label: "FAQs" },
    { to: "/admin/testimonials", label: "Testimonials" },
    { to: "/redeem", label: "Scan station" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/admin" className="flex items-center gap-3">
            <img src={logo} alt="Sans Sucre" className="h-8 w-auto" />
            <span className="font-display text-sm uppercase tracking-[0.25em] text-muted-foreground">Admin</span>
          </Link>
          <nav className="hidden gap-4 sm:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm ${path === n.to ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="flex gap-4 border-t px-5 py-2 sm:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={`text-sm ${path === n.to ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
