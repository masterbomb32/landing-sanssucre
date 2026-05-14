import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/share-your-story")({
  head: () => ({
    meta: [
      { title: "Share your Sans Sucre story" },
      {
        name: "description",
        content:
          "Tell us how your visit to Sans Sucre went. Your story may be featured on our site.",
      },
    ],
  }),
  component: ShareYourStoryPage,
});

function ShareYourStoryPage() {
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [source, setSource] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 1 || quote.trim().length < 5) {
      toast.error("Please share a bit more about your visit.");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (photo) {
        if (photo.size > 5 * 1024 * 1024) {
          toast.error("Photo must be smaller than 5MB.");
          setSubmitting(false);
          return;
        }
        const ext = photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("testimonial-photos")
          .upload(path, photo, { contentType: photo.type, cacheControl: "3600" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("testimonial-photos").getPublicUrl(path);
        photo_url = pub.publicUrl;
      }

      const { error } = await supabase.from("testimonials").insert({
        name: name.trim().slice(0, 100),
        quote: quote.trim().slice(0, 1000),
        source: source.trim() ? source.trim().slice(0, 100) : null,
        photo_url,
        published: false,
      });
      if (error) throw error;

      setDone(true);
      toast.success("Thank you! Your story is in moderation.");
    } catch (err) {
      console.error(err);
      toast.error("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:py-16">
      <article className="mx-auto max-w-xl">
        <Link to="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Share your story</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us how your visit to Sans Sucre went. With your permission, we may feature your
          words (and photo) on our site.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-6 w-6" strokeWidth={3} />
            </div>
            <p className="mt-3 font-display text-lg font-semibold">Thank you!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our team reviews each story before publishing.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                placeholder="Maria Santos"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">Your story</Label>
              <Textarea
                id="quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value.slice(0, 1000))}
                placeholder="What did you love about Sans Sucre?"
                rows={5}
                required
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{quote.length}/1000</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">
                Where you're from <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value.slice(0, 100))}
                placeholder="Alabang, Muntinlupa"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">
                Add a photo of yourself or your Sans Sucre treat{" "}
                <span className="text-muted-foreground">(optional, max 5MB)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                A clear photo of you, or of the item you ordered. Square or portrait works best.
              </p>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setPhoto(file);
                  if (photoPreview) URL.revokeObjectURL(photoPreview);
                  setPhotoPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Selected preview"
                    className="h-32 w-32 rounded-md border object-cover"
                  />
                </div>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit my story"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By submitting, you agree we may publish your name, story, and photo on the site.
            </p>
          </form>
        )}
      </article>
    </main>
  );
}