## Plan: rebuild the testimonials section from the attached references

I will stop using the current feature-panel/chip layout and rebuild the section as a reference-matched testimonial carousel/card showcase.

### What will change

1. **Use one consistent testimonial card design**
   - Sage green card background.
   - Rounded card corners similar to the reference.
   - Large image at the top of each card.
   - Stars, quote, and name underneath.
   - Fixed card dimensions so cards do not stretch, collapse, or become random sizes.

2. **Make “Share Your Own Story” part of the same card system**
   - It will no longer be a big separate desktop/tablet panel.
   - It will become a matching carousel card/CTA card, sized like the testimonial cards.
   - This keeps the section visually consistent with the uploaded examples.

3. **Desktop layout: match `1.png`**

```text
[ arrow ]  [ card ] [ card ] [ card ] [ card ]  [ arrow ]
```

- Four cards visible across desktop.
- Equal card widths and heights.
- Arrows outside the card row.
- No oversized single card.
- No wrapping into a grid.

4. **Tablet layout: match `2.png`**

```text
partial previous   [ card ] [ card ]
```

- Horizontal carousel behavior.
- Two main cards visible.
- A neighboring card can be partially visible/faded at the edge, like the reference.
- Cards remain the same visual style as desktop.

5. **Mobile layout: match the phone reference**

```text
[ card ]
[ card ]
[ card ]
```

- Single-column vertical card feed.
- Cards centered and large enough to feel like the phone mockup.
- No desktop arrows on mobile.
- Users scroll vertically through stories.

### Technical details

- Update only `src/components/testimonials-section.tsx`.
- Remove the current compact chip layout and the separate feature panel.
- Use CSS-based responsive layouts instead of count/state logic that keeps breaking:
  - mobile: stacked vertical cards
  - tablet: horizontal scroll with two-card sizing
  - desktop: carousel row with four fixed cards
- Keep the current testimonial data source.
- Keep lazy loading for images except the first visible cards.
- Keep the existing `/share-your-story` route for the CTA card.

### Verification

After implementation, verify:

- Desktop shows four equal cards across, like `1.png`.
- Tablet shows two main cards with carousel/overflow feel, like `2.png`.
- Mobile shows stacked single-column cards, like the phone screenshot.
- The “Share Your Own Story” CTA is visible but not presented as one giant separate card.