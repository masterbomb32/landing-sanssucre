## Plan: Correct the testimonials carousel UI

### Problems to fix
- The carousel still behaves like a single centered card instead of a multi-card row.
- Tablet is also showing one card instead of two.
- Card heights vary because image aspect ratios and quote areas are not locked consistently.
- The image area can become too tall, making the card feel larger than the page section.

### Next steps
1. **Replace the fragile carousel sizing with explicit slide widths**
   - Use non-conflicting basis classes with Tailwind arbitrary values:
     - Mobile: `basis-full`
     - Tablet: `md:basis-1/2`
     - Desktop: `lg:basis-1/4`
   - Remove centering constraints that make each card look like a single featured card.
   - Use a full-width carousel track with consistent gutters.

2. **Standardize every testimonial card**
   - Give each card a fixed responsive height instead of letting image/quote content decide it.
   - Use a compact card target: roughly 250–270px wide on desktop when 4 are visible.
   - Lock the photo area height, then let images crop with `object-cover`.
   - Lock the quote area height and clamp text so long testimonials do not expand the card.

3. **Improve image loading behavior**
   - Keep the first four images eager/high priority.
   - Add explicit image dimensions and fixed rendered container sizes to prevent layout shift.
   - Use `object-cover` with a fixed photo frame so portrait/landscape uploads don’t reshape cards.

4. **Move carousel controls out of the card area**
   - Put previous/next buttons near the section heading or just outside the carousel track.
   - Avoid giant empty side space with arrows floating at page edges.

5. **Verify in the preview before calling it done**
   - Desktop around 1190px: confirm 4 cards side-by-side.
   - Tablet around 768–834px: confirm 2 cards side-by-side.
   - Mobile: confirm 1 card and swipe-friendly layout.
   - Confirm all cards are equal height and no card dominates the page.

### Technical change scope
- Update only `src/components/testimonials-section.tsx`.
- Do not change testimonial data, database rules, routes, or unrelated page sections.