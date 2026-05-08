# Goal

`/receipt/$code` must fit within `100dvh` on every device (mobile ~375×667+, tablet ~768×1024, desktop ≥1280×720) with **no vertical scrolling**. Currently the card overflows on short viewports because of stacked sections (countdown strip, greeting, reward block, QR, opening notice, live count, location, actions, find-CTA, fine print).

# Approach

Keep the same content but tighten the layout so the card always equals viewport height. Use a fluid scale (clamp) for spacing/typography and a 2-column layout on wider screens so vertical content shrinks.

## Layout changes

1. **Shell**
   - Replace `min-h-[100dvh]` + `py-3/py-5` with a fixed `h-[100dvh]` flex column and `overflow-hidden`.
   - Remove the bottom `← sanssucre.ph` link from the flow on short viewports (move into the card footer line, same row as "One reward per person").
   - Remove the `@media (max-height: 640px)` override that allowed scroll — we want no scroll, ever.

2. **Responsive card width**
   - Mobile: `max-w-md` (current).
   - Tablet (`md:`): `max-w-2xl`, single column still but tighter.
   - Desktop (`lg:`): `max-w-4xl` two-column grid inside the card:
     - Left column: header strip + greeting + reward + opening notice + location + actions + find-CTA.
     - Right column: QR block + countdown strip + live community count.
   - Status banner + "Already redeemed" banner span both columns at top.

3. **Density**
   - Convert vertical paddings from fixed `py-3/py-4/py-5` to `py-[clamp(0.5rem,1.5vh,1rem)]`.
   - Reduce gaps between blocks via `space-y-[clamp(0.5rem,1.2vh,0.875rem)]` instead of per-block `mt-3`.
   - QR size: `clamp(120px, 22vh, 168px)` so it shrinks on short screens.
   - Logo height: `clamp(28px, 4.5vh, 44px)`.
   - Title font-size: `clamp(1.05rem, 2.6vh, 1.5rem)`.

4. **Trim non-essentials on short viewports**
   - Hide `reward.description` (line-clamp-2 paragraph) below `h-[640px]`.
   - Collapse "Save / Print" + "Share" into icon-only buttons on `h-[640px]`.
   - The brightness toast already self-dismisses — no change.

5. **No content removed** — every element stays present at all breakpoints, just rescaled / repositioned.

## Verification

- Test in preview at 375×667, 390×844, 768×1024, 1024×768, 1280×720, 1440×900.
- Confirm `document.documentElement.scrollHeight === window.innerHeight` on each.
- Take screenshots of mobile + desktop.

## Files

- `src/routes/receipt.$code.tsx` — restructure JSX + classes only. No business logic, no data fetch changes.
- `src/styles.css` — none needed (using inline clamp + Tailwind arbitrary values).

## Out of scope

- `/redeemed/$code` page (separate layout).
- Copy text changes.
- Server functions / data flow.
