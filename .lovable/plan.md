## Goal

Show 4 testimonial cards per row on desktop instead of 2/3, and make every card the same size regardless of quote length or photo aspect.

## Changes (`src/components/testimonials-section.tsx`)

**Grid — 4 columns on desktop**
- Replace `grid gap-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8` with `grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5`.
- Bump section container from `max-w-5xl` → `max-w-6xl` so 4 cards have room to breathe without becoming cramped.
- Fetch limit stays at 6 (already in query) — first 4 fill the row, extras wrap.

**Standardize card size**
- Remove `max-w-sm self-center` cap on the card (was for single-column mobile). Cards fill their grid cell uniformly.
- Lock hero photo to a single aspect ratio across all breakpoints: `aspect-[4/3]` (drop the `16/10` mobile variant) so every photo block is identical height.
- Force the quote panel to a consistent height with `min-h-[7.5rem]` so cards with short quotes don't collapse and tall quotes don't expand. Keep `line-clamp-3` to cap overflow.
- Card root: keep `flex flex-col`; the photo + quote panel now have fixed proportions, producing equal-height cards.

**Minor polish for 4-up density**
- Header band padding `px-3 py-2` (was `px-3.5 py-2.5`) — tighter for narrower cards.
- Quote panel margin `m-2` padding `p-3.5` (was `m-2.5 p-4`).
- Quote text `text-sm` only (drop `sm:text-base`) so 4-up doesn't get oversized type.

## Out of scope

Data fetching, empty state, section heading, backdrop blobs, card structure.
