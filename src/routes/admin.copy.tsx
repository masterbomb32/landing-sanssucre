import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { siteCopy } from "@/lib/site-copy";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/copy")({
  component: CopyEditor,
});

const FIELDS: { key: string; label: string; multiline?: boolean; defaultValue: string }[] = [
  { key: "hero.eyebrow", label: "Hero eyebrow", defaultValue: siteCopy.hero.eyebrow },
  { key: "hero.headline.line1", label: "Hero headline (line 1)", defaultValue: siteCopy.hero.headline.line1 },
  { key: "hero.headline.line2", label: "Hero headline (line 2, accent)", defaultValue: siteCopy.hero.headline.line2 },
  { key: "hero.sub", label: "Hero subhead", multiline: true, defaultValue: siteCopy.hero.sub },
  { key: "hero.location", label: "Hero location line", defaultValue: siteCopy.hero.location },
  { key: "hero.primaryCta", label: "Primary CTA button", defaultValue: siteCopy.hero.primaryCta },
  { key: "stickyCta", label: "Mobile sticky CTA", defaultValue: siteCopy.stickyCta },
  { key: "form.heading", label: "Form heading", defaultValue: siteCopy.form.heading },
  { key: "form.sub", label: "Form subhead", multiline: true, defaultValue: siteCopy.form.sub },
  { key: "form.submit", label: "Form submit button", defaultValue: siteCopy.form.submit },
  { key: "footer.location", label: "Footer location", multiline: true, defaultValue: siteCopy.footer.location },
  { key: "brand.shareText", label: "Share text (used when sharing)", multiline: true, defaultValue: siteCopy.brand.shareText },
];

function CopyEditor() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      const initial: Record<string, string> = {};
      for (const f of FIELDS) initial[f.key] = f.defaultValue;
      for (const row of data ?? []) {
        if (typeof row.value === "string") initial[row.key] = row.value;
        else if (row.value && typeof row.value === "object" && "v" in (row.value as object)) {
          initial[row.key] = String((row.value as { v: string }).v);
        }
      }
      setValues(initial);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = FIELDS.map((f) => ({ key: f.key, value: { v: values[f.key] ?? "" } }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Copy saved. Refresh the homepage to see updates.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Edit landing copy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes apply immediately on the public site. Leave a field at its default to use the original wording.
        </p>
      </div>
      <div className="space-y-5 rounded-2xl border bg-card p-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.multiline ? (
              <Textarea
                id={f.key}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={2}
              />
            ) : (
              <Input
                id={f.key}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
        <Button onClick={save} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </main>
  );
}
