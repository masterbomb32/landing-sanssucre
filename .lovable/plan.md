## Goal

Convert the "What people are saying" grid into a horizontal carousel showing 4 cards at a time on desktop, with prev/next controls and responsive fallbacks.

## Approach

Use the existing shadcn `Carousel` component (`src/components/ui/carousel.tsx`, built on Embla) — already in the project, no new deps.

## Changes (`src/components/testimonials-section.tsx`)

**Replace the grid with `<Carousel>`**
- Wrap items in `<Carousel opts={{ align: "start", loop: items.length > 4 }} className="w-full">`.
- Each card becomes `<CarouselItem className="basis-full sm:basis-1/2 lg:basis-1/4 pl-4">`.
- `<CarouselContent className="-ml-4">` for the negative-margin gutter pattern.
- Add `<CarouselPrevious />` and `<CarouselNext />` — position them outside the track on desktop (`hidden sm:flex`), top-right of the section so they don't overlap cards.

**Responsive visibility per slide**
- Mobile: 1 card per view (`basis-full`)
- sm (≥640px): 2 cards (`sm:basis-1/2`)
- lg (≥1024px): 4 cards (`lg:basis-1/4`)

**Fetch limit**
- Raise Supabase `.limit(6)` → `.limit(12)` so the carousel has enough slides to be worth swiping. If fewer than 5 exist, hide arrows (no scroll needed).

**Card sizing**
- Keep the standardized card (aspect-[4/3] photo, min-h quote panel) from the prior pass — no changes inside `TestimonialCard`.

**Controls layout**
- Place arrow buttons in the section header row, right-aligned next to the heading on desktop. On mobile, rely on swipe (arrows hidden).

## Out of scope

Card visual design, data shape, empty state, section heading copy.
