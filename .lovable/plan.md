
## Scope
Security work paused. Building four feature areas. No DB migrations.

---

## 1. Shared infrastructure

### 1a. Opening date (admin-editable)
Reuse `site_settings` (no schema change).

Add to `src/routes/admin.copy.tsx` `FIELDS`:
- `opening.date` — ISO string, default `2026-06-15T10:00:00+08:00` (label: "Opening date & time (ISO, PHT)")
- `opening.label` — friendly label, default `June 15, 2026 · 10:00 AM` (label: "Opening date display label")
- `receipt.openingNotice` — default: "To claim your reward on opening day, remember the code or get a printed copy from our staff at the store."

Mirror defaults in `src/lib/site-copy.ts` under new `opening` and `receipt` blocks so `useSiteCopy()` picks them up.

### 1b. Public reservation count
New `src/server/stats.functions.ts` exporting `getReservationCount` (`createServerFn`, GET) → uses `supabaseAdmin` to `SELECT count(*)` from `signups`. Returns `{ total }`. No PII.

### 1c. Countdown component
`src/components/countdown.tsx` — props `{ targetISO: string; label?: string; compact?: boolean }`. Renders DD : HH : MM : SS, tick each second, falls back to "We're open!" when the target has passed. Uses semantic tokens (no hardcoded colors). Respects `prefers-reduced-motion` (disables the second-by-second flash, keeps the digits).

### 1d. UA parser util
`src/lib/parse-ua.ts` — no-dep parser → `{ os: "Windows"|"macOS"|"iOS"|"Android"|"Linux"|"Other", device: "Mobile"|"Tablet"|"Desktop" }`.

---

## 2. Receipt page (`src/routes/receipt.$code.tsx`)

UI cleanup + new modules. Switch from static `siteCopy` to `useSiteCopy()`.

**New blocks (in order top→bottom inside the card):**
1. Status banner (existing — kept).
2. **Opening strip** — large display: `OPENING ON {opening.label}` + `<Countdown targetISO={opening.date} />` underneath. Subtle bg accent (`bg-primary/5`).
3. Hello + headline (kept, condensed margin).
4. Reward block (kept).
5. QR card (kept; trim padding + drop "Or read out the code above" line).
6. **Opening notice** card with icon + `siteCopy.receipt.openingNotice` text (the "remember the code or get a copy from staff" message).
7. **Community live count** pill: "🎟 You're #{N} in the Alabang Town community reserving a treat" (polled every 10s via `getReservationCount`). Falls back gracefully if fetch fails (hidden).
8. Compact info strip — merge the MapPin + Calendar lines into one row; move "Issued …" into a small "Details" disclosure.
9. Actions row (Share + Save/Print, unchanged).
10. **Lost-this-page CTA** — replaces the small "Back to sanssucre.ph" link with a clearly visible outline button: "Lost this page? → Find my reward by phone" linking to `/find`.

**Cleanup:** tighten paddings (`py-4` → `py-3` between sections), single divider style, drop the duplicate "One reward per person" if it now appears twice.

---

## 3. Redeemed / thank-you page (`src/routes/redeemed.$code.tsx`)

- Add **red velvet photo** as a top banner inside the card (full-bleed, ~160px tall, rounded top corners). Uses `red-velvet-hero.webp` + `.png` via `<picture>` with `loading="eager"`.
- **No white overlay / no gradient wash** — show the photo at full saturation. Only the green "Redeemed" pill stays as a small chip overlaid on top-right of the image.
- Logo moves directly under the banner (centered) instead of inside it, so the photo reads cleanly.
- Everything below (reward block, social, mailing list, feedback) stays as is.

---

## 4. Admin dashboard (`src/routes/admin.index.tsx`)

### 4a. Traffic breakdown — OS + Device
Inside the existing **Traffic** card, add two horizontal bar lists below the existing stats:
- **By OS** (Windows / macOS / iOS / Android / Linux / Other) — derived from `page_visits.user_agent` via `parse-ua.ts`.
- **By Device** (Mobile / Tablet / Desktop).

Each row: label · bar (% of total visits) · count.

**Country**: deferred — show a single small grey row "Country breakdown coming soon" so the slot exists but doesn't lie. (Country requires a server-side capture path we don't want to add in this pass.)

### 4b. Auto-refresh
Add a 30s interval re-running `load()` so dashboard stays current without manual refresh.

(Date-range filter — Today / Yesterday / 7d / 30d / 90d / Custom — deferred to a follow-up to keep this batch shippable. Will note in plan summary.)

---

## 5. Main page (`src/routes/index.tsx`)

- **Subtle text motion on refresh**: stagger fade+translate on hero eyebrow → headline line1 → headline line2 → sub → CTA. Implemented as CSS keyframes in `src/styles.css` (`@keyframes hero-rise`) + Tailwind utility classes with per-element `animation-delay` (e.g. `[animation-delay:120ms]`). Respects `prefers-reduced-motion`.
- **Live reservation counter**: pill above the CTA — "🎟 {N} treats reserved in the Alabang Town community" — fetched via `getReservationCount`, polled every 10s. Hidden if 0 or fetch fails.
- **Countdown module**: compact `<Countdown />` between sub copy and CTA: `Opens in 12d 04h 32m 18s · {opening.label}`.

---

## Files touched

```
new   src/components/countdown.tsx
new   src/lib/parse-ua.ts
new   src/server/stats.functions.ts
edit  src/lib/site-copy.ts                (add opening.* + receipt.openingNotice)
edit  src/routes/admin.copy.tsx           (add opening.date, opening.label, receipt.openingNotice)
edit  src/routes/admin.index.tsx          (OS + device breakdown, auto-refresh)
edit  src/routes/index.tsx                (motion, live count, countdown)
edit  src/routes/receipt.$code.tsx        (countdown, opening notice, community pill, find-my-reward CTA, UI cleanup, useSiteCopy)
edit  src/routes/redeemed.$code.tsx       (red velvet hero banner, no overlay)
edit  src/styles.css                      (hero-rise keyframes)
```

No DB migrations, no RLS changes, no new dependencies.

---

## Defaults I'm assuming (override anytime in admin → Edit copy)
- Opening date: `2026-06-15T10:00:00+08:00`
- Opening label: `June 15, 2026 · 10:00 AM`
- Live count text frames it as the **Alabang Town community**, per your note.
