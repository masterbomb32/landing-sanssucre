## Landing page redesign — cinematic full-bleed hero

### Direction (confirmed)
Use **only** the new wide, atmospheric `redvelvetontable.png` as a cinematic, premium hero. Drop the old transparent muffin entirely.

### What changes

**1. Asset swap**
- Copy `user-uploads://redvelvetontable.png` → `src/assets/red-velvet-hero.png`
- Generate optimized `red-velvet-hero.webp` (target < 150KB) with `cwebp -q 80`
- Delete `src/assets/red-velvet.webp` and `src/assets/red-velvet.png` (no longer used)

**2. New cinematic hero**

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│   [ LOGO — large ]                                 │
│                                                    │
│   GRAND OPENING                                    │
│                                                    │
│   A sweet welcome,                                 │
│   just for you.                                    │
│                                                    │
│   Reserve your reward in under a minute.           │
│                                                    │
│   [ Claim my reward ]   [ Share ]                  │
│                                                    │
│      ( wide red velvet countertop photo )          │
│         full-bleed background, premium feel        │
└────────────────────────────────────────────────────┘
```

- **Full-viewport hero**: `min-h-[85vh]` desktop, `min-h-[70vh]` mobile
- Image rendered as a `<picture>` (webp + png) absolutely positioned behind content with `object-cover`, `object-position: center right` on desktop and `center` on mobile so the muffin stays in frame at all widths
- **Warm gradient overlay** (cream → transparent, left → right on desktop; bottom → transparent on mobile) to keep copy legible over the countertop without washing out the photo
- **Logo lives inside the hero** as the heading element (h-14 mobile, h-20 desktop), no separate header bar — cleaner, more premium
- Subtle bottom fade into the page background for a seamless transition into the form section

**3. Copy** (unchanged tone, slightly tightened)
- Eyebrow: "GRAND OPENING"
- Headline: "A sweet welcome, just for you."
- Sub: "Reserve your reward in under a minute. Visit Sans Sucre on opening day and we'll have something sweet waiting."
- CTAs: "Claim my reward" (primary) + Share button

**4. Fix hydration error** (quietly)
`SignupForm` has a stray paragraph node causing an SSR/client mismatch. Rewrap the privacy note + submit button cleanly so hydration matches.

**5. Performance**
- New WebP hero (~80–120KB target)
- Preload hero WebP in `__root.tsx` (`<link rel="preload" as="image" type="image/webp">`)
- `fetchPriority="high"` + `decoding="async"` on the hero `<img>`
- Logo: keep `fetchPriority="high"` since it's now part of the LCP block
- Form section stays below the fold, no preload needed there

### Files touched
- `src/assets/red-velvet-hero.png` (new)
- `src/assets/red-velvet-hero.webp` (new)
- `src/assets/red-velvet.webp`, `src/assets/red-velvet.png` (deleted)
- `src/routes/index.tsx` (hero rebuilt around the new image)
- `src/components/signup-form.tsx` (fix hydration mismatch)
- `src/routes/__root.tsx` (preload new hero webp)