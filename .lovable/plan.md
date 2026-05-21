## Recommended direction

The issue is not just the card styling anymore: the live preview is currently falling back to the empty-state card because no eligible published testimonial cards are being loaded/displayed on the homepage. Instead of continuing to fight the carousel, I recommend replacing this section with a more reliable **“Share your own story” showcase** that works well whether there are 0, 1, or many stories.

## Best UX option: editorial story wall + CTA

Replace the carousel with a static responsive showcase:

```text
Desktop
[ Featured story / invitation panel ] [ Story card ] [ Story card ] [ Story card ]

Tablet
[ Featured story / invitation panel ] [ Story card ]
[ Story card ]                    [ Story card ]

Mobile
[ Featured invitation panel ]
[ Story card ]
[ Story card ]
```

### Why this is better
- No carousel width bugs or hidden single-slide behavior.
- Desktop naturally shows 4 columns when stories exist.
- Tablet naturally shows 2 columns.
- Mobile shows 1 column.
- Card heights can be equal using CSS grid instead of carousel slide sizing.
- The CTA stays visible and useful even when there are no testimonials yet.

## What I would implement

### 1. Remove carousel dependency from this section
- Stop using `Carousel`, `CarouselContent`, and `CarouselItem` in `src/components/testimonials-section.tsx`.
- Use a plain CSS grid instead:
  - `grid-cols-1`
  - `md:grid-cols-2`
  - `lg:grid-cols-4`

### 2. Turn “Share your own story” into the lead card
- Make the first card a branded invitation card, not a small fallback box.
- It should say something like:
  - “Your Sans Sucre moment belongs here.”
  - “Share a photo, a few words, or a favorite treat from opening day.”
- CTA button: “Share your story”.

### 3. Show testimonial cards beside it when available
- Display up to 3 testimonial cards next to the CTA on desktop, making 4 total visible cards.
- If there are 4+ testimonials, show 4 story cards and move the CTA below as a centered button.
- If there are 0 testimonials, show a polished 3-card preview/invitation layout instead of one lonely card.

### 4. Lock all card proportions
- Fixed card min-height.
- Fixed image area height.
- Quote text clamped to 3 lines.
- Same header/footer sizing on every card.
- No card can grow taller because of long text or photo aspect ratio.

### 5. Improve image loading
- First visible story images use eager loading and explicit dimensions.
- All image containers keep stable dimensions before images load.
- Images use `object-cover`, so portrait/landscape uploads do not distort the grid.

## Fallback design when no testimonials exist

Instead of showing only one centered card, show a complete invitation section:

```text
[ Share your story CTA ] [ Opening day memory prompt ] [ Favorite treat prompt ] [ Photo moment prompt ]
```

This makes the section look intentional even before real customer stories exist.

## Files to change

- `src/components/testimonials-section.tsx` only.

## Verification checklist

After implementation:
- Desktop around 1190px: 4 equal-width cards/tiles visible.
- Tablet around 768px: 2 equal-width cards/tiles visible.
- Mobile: 1 card per row.
- No carousel arrows.
- No oversized testimonial cards.
- Empty state no longer looks like a broken single-card carousel.