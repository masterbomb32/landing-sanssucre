import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getFaqsForPreview } from "@/lib/faqs.functions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const Route = createFileRoute("/faq")({
  validateSearch: (search: Record<string, unknown>) => ({
    preview: search.preview === "1" || search.preview === 1 ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "FAQ — Sans Sucre" },
      {
        name: "description",
        content:
          "Answers to common questions about Sans Sucre's opening day rewards, location, and how to claim your treat.",
      },
      { property: "og:title", content: "FAQ — Sans Sucre" },
      {
        property: "og:description",
        content:
          "Everything you need to know about claiming your Sans Sucre opening day reward.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { preview } = Route.useSearch();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [previewActive, setPreviewActive] = useState(false);
  const fetchPreview = useServerFn(getFaqsForPreview);

  useEffect(() => {
    let cancelled = false;
    const loadPublished = async () => {
      const { data } = await supabase
        .from("faqs")
        .select("id,question,answer")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      setPreviewActive(false);
      setFaqs((data ?? []) as Faq[]);
    };
    const run = async () => {
      if (preview === 1) {
        try {
          const res = await fetchPreview();
          if (cancelled) return;
          setPreviewActive(true);
          setFaqs(res.faqs as Faq[]);
          return;
        } catch {
          // Not admin or not authed — silently fall back to published.
        }
      }
      await loadPublished();
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [preview, fetchPreview]);

  // FAQPage JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (faqs ?? []).map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-background px-5 py-12 sm:py-16">
      {previewActive && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-amber-950 shadow-md">
          Preview mode — showing FAQ drafts (admin only)
        </div>
      )}
      <article className="mx-auto max-w-2xl space-y-8">
        <header>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold">Frequently asked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything you need to know about claiming your Sans Sucre opening day reward.
          </p>
        </header>

        {faqs === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions published yet.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="text-left font-display text-base">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Still have questions?{" "}
            <a href="mailto:hello@sanssucre.ph" className="text-primary underline underline-offset-2">
              Email us
            </a>
            .
          </p>
        </div>
      </article>

      {faqs && faqs.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </main>
  );
}