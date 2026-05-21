## Recommended next step

Stop trying to make the current testimonial cards behave like a carousel/grid. It has already failed too many times and the homepage is suffering. I would replace the section with a simpler **Share Your Own Story showcase** that does not depend on exact card-count math.

## The real issue

The section keeps failing because we are mixing two goals:

1. Showing customer testimonials.
2. Promoting the “Share your own story” action.

Trying to force those into a card carousel/grid has caused oversized cards, inconsistent breakpoints, slow image perception, and confusing “always 4” behavior.

## Better approaches

### Option A — Recommended: Featured story + small story rail

Use one controlled feature area instead of equal testimonial cards.

```text
Desktop/tablet
[ Share your own story feature panel ]
[ small story ] [ small story ] [ small story ] [ small story ]

Mobile
[ Share your own story feature panel ]
[ small story ]
[ small story ]
```

Why this is safer:
- The CTA is always the main message.
- Testimonial cards become small supporting proof, not giant page sections.
- If there are 1, 2, 4, or 12 testimonials, the layout still looks intentional.
- No carousel width bugs.
- No oversized photo cards.

### Option B — Compact quote wall

Remove large photos entirely from the homepage and show compact quote tiles.

```text
[ Share your story CTA ]
“Quote...” — Name     “Quote...” — Name
“Quote...” — Name     “Quote...” — Name
```

Why this works:
- Fastest loading option.
- No image layout problems.
- Testimonials look clean and editorial.
- Best if the goal is trust, not photo browsing.

### Option C — Photo mosaic + CTA overlay

Show a cropped photo collage with a strong CTA.

```text
[ Photo ][ Photo ][ Photo ][ Photo ]
[        Share your own story        ]
[ Photo ][ Photo ][ Photo ][ Photo ]
```

Why this works:
- More visual and social.
- Photos feel like community moments.
- Text testimonials can be hidden behind a “Read stories” link or shown below.

### Option D — Move full testimonials to a separate page

Homepage only shows a small invitation section:

```text
Share your Sans Sucre moment
[ Share your story ] [ Read stories ]
```

Then `/share-your-story` or a new stories page can show all full-size testimonial cards.

Why this works:
- Homepage stays focused on claiming the treat.
- No more giant testimonial section blocking the funnel.
- Full stories still exist, but not as a homepage layout risk.

## My recommendation

Implement **Option A: Featured story + small story rail**.

It solves the core UX problem without removing social proof:
- The main card is the “Share your own story” invitation.
- Testimonials become compact supporting cards.
- Desktop and tablet do not need to show “exactly 4 cards at a time.” They show a stable story rail that can wrap naturally.
- Mobile remains clean.

## Implementation plan

### 1. Replace the current testimonial grid/cards
- Remove the current large photo testimonial card layout from the homepage section.
- Do not use the carousel.
- Do not use equal-height giant cards.

### 2. Build a “Share Your Own Story” feature panel
- Large but controlled invitation panel.
- Clear CTA: “Share your story”.
- Short copy only.
- Use brand sage/gold styling from the existing design system.

### 3. Add compact testimonial chips/cards
- Each story card uses:
  - Small square/circle thumbnail, or initials if no image.
  - Name.
  - Short clamped quote, max 2 lines.
  - Optional source.
- No large images on homepage.
- No card can grow taller because of long text.

### 4. Responsive behavior
- Desktop: feature panel plus compact story rail.
- Tablet: same layout, story rail wraps into 2 columns if needed.
- Mobile: feature panel first, then compact story cards stacked.

### 5. Data behavior
- If there are testimonials: show up to 4 compact stories.
- If there are no testimonials: show 3 prompt cards instead of fake/broken testimonials.
- The CTA remains visible in all cases.

### 6. Verification
- Check desktop, tablet, and mobile in the preview.
- Confirm the section never becomes one giant card.
- Confirm images no longer cause slow perceived loading because they are thumbnails only.
- Confirm the CTA is clear and not hidden below oversized testimonials.

## Files to change

- `src/components/testimonials-section.tsx` only.

No database changes. No route changes. No generated route file edits.