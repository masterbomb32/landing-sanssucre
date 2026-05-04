# Fix duplicate "Pick my treat" CTAs on mobile

## Problem
On mobile, two identical CTAs are visible at once:
1. The hero's **"Pick my Treat →"** button (inside the hero section)
2. The **sticky bottom "Pick my treat"** button (fixed at bottom of viewport)

Currently the sticky CTA only hides when the *form* is in view. But on a tall hero, the user sees both buttons stacked while still at the top of the page — redundant and visually noisy (as circled in your screenshot).

## Desired behavior
- **At the top of the page (hero in view):** sticky CTA is **hidden**. Only the hero's primary CTA shows.
- **After scrolling past the hero:** sticky CTA **slides up** into view.
- **When the form/claim section is in view:** sticky CTA hides again (already works).

This matches the original intent — the sticky button is a *reminder* once the hero CTA scrolls off-screen, not a duplicate of it.

## Implementation (in `src/routes/index.tsx`)

1. Add a ref to the hero `<section>` (e.g. `heroRef`).
2. Add a second `IntersectionObserver` that tracks when the hero leaves the viewport, storing `heroVisible` state.
3. Update the sticky CTA's visibility condition from:
   ```
   formVisible ? hidden : shown
   ```
   to:
   ```
   (heroVisible || formVisible) ? hidden : shown
   ```
4. Keep the existing slide/fade transition (`translate-y-20 opacity-0` ↔ `translate-y-0 opacity-100`) so the reveal feels smooth.
5. No changes to the hero CTA, form, or copy — just the sticky button's reveal logic.

## Files touched
- `src/routes/index.tsx` (only)

## Out of scope
- Desktop layout (sticky CTA is already `md:hidden`).
- Copy changes — both buttons keep their existing labels.
