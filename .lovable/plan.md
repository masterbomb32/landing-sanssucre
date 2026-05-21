## Goal

Tighten the proportions of the redesigned "What people are saying" cards so they sit comfortably within the rest of the landing page. Pure CSS/spacing tweaks in `src/components/testimonials-section.tsx` — no structural or data changes.

## Issues observed (390px viewport)

- Cards feel oversized: hero photo at `5/4` on mobile pushes the quote panel below the fold.
- Grid `gap-6` looks tight at desktop given the new card chrome; mobile single column has no visual breathing room between cards.
- Quote panel padding (`p-5`) + display serif at `text-lg` makes each card visually heavy.
- Section vertical padding (`py-12 sm:py-20`) plus large heading compounds the "too big" feel.

## Adjustments

**Card sizing**
- Hero aspect: `aspect-[16/10]` mobile, `aspect-[4/3]` sm+ (shorter on phones).
- Cap card max width on single-column mobile (`max-w-sm mx-auto`) so it doesn't span edge-to-edge.
- Quote panel margin `m-2.5`, padding `p-4`, gap `gap-2`.
- Quote text: `text-sm sm:text-base`, line-clamp from 4 → 3.
- Header band: reduce vertical padding `py-2.5`, avatar `h-6 w-6`, name `text-xs`.
- Stars: `h-3 w-3`.

**Grid spacing**
- `gap-5 sm:gap-6 lg:gap-8` so cards have clear separation on desktop and mobile.
- Constrain section to `max-w-5xl` again (was `6xl`) — better balance with rest of page sections.

**Section rhythm**
- Reduce `py-12 sm:py-20` → `py-10 sm:py-16` (matches sibling sections).
- Heading `text-2xl sm:text-3xl` (was 3xl/4xl).
- Tighten heading margin and eyebrow spacing.

**Backdrop blobs**
- Smaller/softer: `h-48 w-48` and `h-56 w-56`, lower opacity.

## Files

- `src/components/testimonials-section.tsx` — class adjustments only.

## Out of scope

- Card structure, data, copy, empty state behavior.
