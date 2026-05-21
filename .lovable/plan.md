## Goal

Replace the current flat quote cards in `src/components/testimonials-section.tsx` with a more editorial, branded card design inspired by the attached Rimberio testimonial. Keep data, query, and routing untouched — purely a UI/UX revision.

## Reference read

The Rimberio card has three stacked zones:
1. **Dark header band** — small avatar chip + name on the left, 5 gold stars on the right.
2. **Large hero photo** — dominant portrait, edge-to-edge within the card.
3. **Cream quote panel** — rounded, inset, italic serif quote, attribution.

Background uses olive/sage and warm gold accent blocks behind the card to give a layered "poster" feel.

## Design adaptation (Sans Sucre tokens)

- Header band: `bg-primary` (sage) with `text-primary-foreground`. Avatar inside a small `bg-accent` (gold) circle. Stars in `--accent` gold.
- Photo: full-bleed inside card, fixed aspect (4/3 desktop, 5/4 mobile), `object-cover`. If no `photo_url`, show a sage/gold gradient block with the person's initial in display font (no broken layout).
- Quote panel: `bg-card` (cream), generous padding, italic display serif, attribution in small uppercase tracked label.
- Card shell: `rounded-2xl`, subtle border, soft shadow, hover lifts shadow + translateY(-2px).
- Section backdrop: keep section width, but add two soft offset color blocks behind the grid (sage + gold, low opacity, blurred) for the editorial "poster" feel without overwhelming.
- Eyebrow + heading unchanged in copy; restyle heading slightly (tighter leading, gold underline accent on a single word).

## Layout

- Grid: 1 col mobile, 2 col `sm`, 3 col `lg` (unchanged count, still limit 6).
- Cards equal height via `flex flex-col`; quote panel grows (`flex-1`) so attributions align across rows.
- Add a 5-star row to every card (static, since we don't store ratings — treat as brand decoration, consistent with reference).

## UX touches

- Quote text clamped to ~4 lines (`line-clamp-4`) to keep cards even; full quote still readable on hover via `title` attribute.
- Empty state (no testimonials yet) keeps current copy but adopts the same card chrome as a single "Be the first" card with a CTA button to `/share-your-story`.
- "Share your own story →" link restyled as a pill button under the grid.
- Respect reduced motion: hover lift only when `motion-safe`.

## Files to change

- `src/components/testimonials-section.tsx` — full rewrite of the markup; data fetching logic untouched.
- `src/styles.css` — only if a new utility (e.g. `line-clamp-4` already provided by Tailwind plugin) or a small `--shadow-card` token is needed. Likely no change.

No schema, server function, or routing changes.

## Out of scope

- Adding a real ratings field to the `testimonials` table.
- Changing admin moderation UI.
- Carousel/auto-scroll behavior.
