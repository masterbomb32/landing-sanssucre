## Landing page: brand assets, fonts, responsive polish, privacy

### 1. Brand assets

- Copy uploads into the project:
  - `user-uploads://sanssucreph_logo.png` → `src/assets/sanssucre-logo.png`
  - `user-uploads://red_velvet_transparent.png` → `src/assets/red-velvet.png`
- Remove the placeholder `src/assets/hero-bakery.jpg` import from the landing page.
- Add a small site header with the Sans Sucre logo (left-aligned, ~40px tall on mobile, ~56px on desktop, eager-loaded). Logo also added to footer.
- Replace the hero background image with a clean composition:
  - Left column: headline + sub copy + CTAs.
  - Right column: the red velvet PNG floating on the cream background (transparent, no overlay needed). On mobile it stacks above the copy at a smaller size.
- Drop the dark gradient overlay since the new hero uses a transparent product shot on cream — keeps the brand light and airy.

### 2. Typography (Playfair Display SC + PT Sans)

- Replace the current Cormorant + Inter Google Fonts import in `src/styles.css` with:
  ```
  https://fonts.googleapis.com/css2?family=Playfair+Display+SC:wght@400;700;900&family=PT+Sans:wght@400;700&display=swap
  ```
- Update the design tokens:
  - `--font-display: "Playfair Display SC", ui-serif, Georgia, serif;`
  - `--font-sans: "PT Sans", ui-sans-serif, system-ui, sans-serif;`
- Note on "Canva Sans": it is a proprietary Canva-only font and is **not available on the public web**. Closest free web equivalents (any can be swapped in later): **Inter**, **Work Sans**, or **DM Sans**. PT Sans (your second choice) covers the body type role, so Canva Sans is not needed.
- Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous">` and `rel="preconnect"` to fonts.googleapis.com in the root route `head()` so fonts start downloading earlier.

### 3. Responsiveness

- Hero headline: `text-4xl sm:text-5xl lg:text-6xl` (down from `text-5xl/6xl/7xl`) so it fits the 713px viewport without wrapping awkwardly.
- Reduce vertical padding on mobile: `py-10 sm:py-20 lg:py-28`.
- Hero: switch to a 1‑col layout under `md`, 2‑col on `md+` (copy left, product right).
- Form card: `p-5 sm:p-8`, reward grid stays `sm:grid-cols-3` but each card gets `min-h-0` and tighter padding on mobile.
- CTAs: full‑width on mobile (`w-full sm:w-auto`), inline on desktop. Keep "Claim my reward" as the primary, "Share" as outline.
- Add a sticky bottom CTA on mobile only (`md:hidden fixed bottom-0`) that scrolls to `#claim` — keeps the action one tap away while scrolling.
- Verify tap targets ≥ 44px (radio cards already qualify).

### 4. Privacy note + page

- Under the signup form replace the current single line with a two-line privacy block:
  > We respect your privacy. Your details are used only to deliver your reward and occasional Sans Sucre updates. We never sell or share your data. [Read our privacy notice](/privacy).
- Add the same short note above the submit button (compact form-level disclosure) referencing `/privacy`.
- Create `src/routes/privacy.tsx` with a simple, readable privacy notice covering: what we collect (name, mobile, optional email, reward choice, anonymous visit analytics), purpose (reward fulfillment + future marketing), retention, the user's right to opt out / request deletion, and a contact email placeholder. Linked from the footer too.

### 5. Performance recommendations (and what we'll do now)

Applied in this change:

- **Preconnect to Google Fonts** + `display=swap` (already on) so text renders immediately with a fallback while the brand font loads.
- **Convert the red velvet PNG to WebP** during the copy step (`cwebp` via nix) to cut image weight ~60–70%. Keep the PNG as fallback via `<picture>`.
- **Mark the hero image `fetchpriority="high"` and `loading="eager"`**; everything below the fold (`loading="lazy"`, `decoding="async"`).
- **Preload the logo and hero** with `<link rel="preload" as="image">` in the root `head()`.
- **Remove the unused `hero-bakery.jpg`** so it's not bundled.
- **Code-split the share dialog**: lazy-import `ShareButton`'s Dialog so the homepage bundle stays small (only loads when the user taps Share).
- **Defer barcode + scanner libraries** to their respective routes only (already the case — confirming they're not pulled into `/`).

Recommendations for after deployment (no code change needed now, just so you know):

- **Deploy on a CDN edge** (Vercel/Netlify/Cloudflare Pages) — first byte from the nearest PoP to PH users.
- **Enable Brotli compression** (default on the above hosts).
- **HTTP/2 + cache headers**: hashed assets get `Cache-Control: public, max-age=31536000, immutable` automatically.
- **Use a proper OG share image** (~1200×630 WebP/JPEG ≤ 200KB) so social previews load fast.
- **Run Lighthouse** post-deploy; target ≥ 90 on mobile. The biggest levers are image weight and font strategy, both addressed above.
- **Consider a service worker** later for return-visit instant loads (overkill for now).

### Files to add/edit

- add `src/assets/sanssucre-logo.png`, `src/assets/red-velvet.png` (+ `.webp`)
- edit `src/styles.css` (font import + tokens)
- edit `src/routes/__root.tsx` (preconnect + preload)
- edit `src/routes/index.tsx` (header with logo, new hero, responsive classes, sticky mobile CTA, privacy note, footer logo)
- edit `src/components/signup-form.tsx` (inline privacy line above submit)
- add `src/routes/privacy.tsx`
- delete `src/assets/hero-bakery.jpg`

### Open questions (not blockers — placeholders used otherwise)

- Privacy contact email (default placeholder: `hello@sanssucre.ph`).
- Confirm "Canva Sans" → use **PT Sans** for body and ignore Canva Sans, or do you want a third font role (e.g. accent)? Default: just Playfair Display SC + PT Sans.
