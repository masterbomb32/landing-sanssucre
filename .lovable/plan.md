## Goal
Rework the testimonial cards on the homepage so the **photo** and the **quote** are the visual focus, and the person's name/source becomes a small caption.

## File
- `src/components/testimonials-section.tsx` (presentation only — no data or query changes)

## New card layout

```
┌──────────────────────────────┐
│  ⬤  ← large round photo      │
│      (64–72px, top-left)     │
│                              │
│  "Large quote text, serif    │
│   display font, 2–4 lines,   │
│   the dominant element."     │
│                              │
│  — danae andrada · Pque      │  ← small, muted, single line
└──────────────────────────────┘
```

Specifics:
- **Photo**: 64px (sm) / 72px (md+) rounded-full, object-cover, sits at top of card. Fallback initial avatar uses same size.
- **Quote**: `font-display`, `text-lg sm:text-xl`, `leading-snug`, `text-foreground`. Drop the small `Quote` icon (or keep as a tiny decorative mark above the text at low opacity — TBD, default = remove for cleaner hierarchy).
- **Name + source**: single line, `text-xs text-muted-foreground`, format `— {name} · {source}`. No bold, no separate row, no top border.
- Card padding `p-6`, `gap-4` between photo / quote / caption. Keep existing rounded-2xl border + hover shadow.
- Grid stays `sm:grid-cols-2 lg:grid-cols-3`. "Share your own story →" link unchanged.
- Empty state (no testimonials yet) unchanged.

## Out of scope
- No DB / query / admin changes.
- No new fields, no font additions.
