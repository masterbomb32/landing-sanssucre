## Goal

1. Redesign `/receipt/$code` so all info fits on one screen (no scroll) on mobile and desktop, while staying responsive.
2. Remove QR code; keep only the Code-128 barcode.
3. Keep all other receipt features (status banner, reward block, code, location, share, save/print, redeemed link).
4. Verify the `/redeemed/$code` thank-you page renders Share button, Feedback (stars + comment), and "What's next" — and ensure feedback is recorded in the DB and "What's next" copy is editable.

## Current state (verified)

- Feedback **is already wired to the database**: `submitFeedback` in `src/server/redeem.functions.ts` inserts into `public.feedback` (with unique-per-signup constraint). RLS allows anon insert; admin can read all.
- "What's next" copy keys `futureRewards.heading` and `futureRewards.body` **are already editable** from `/admin/copy` and read via `useSiteCopy()` on the redeemed page.
- Share button **is already rendered** on `/redeemed/$code`.
- So the user likely didn't see them because the page is too tall to fit the viewport, or they hadn't redeemed a code yet to land on that page. We'll tighten the layout so everything fits and is obvious, and add a quick admin check.

## Changes

### 1. `src/routes/receipt.$code.tsx` — one-page compact receipt

Restructure so the card fits within `100dvh` without inner scroll on common devices (e.g. 375×667 up). Approach:

- Wrap the page in a `min-h-[100dvh] flex flex-col` container with reduced vertical padding (`py-3 sm:py-6`).
- Shrink the header logo (h-10 sm:h-12), tighten card paddings (`px-5 py-5 sm:px-8 sm:py-6`).
- Remove the QR block entirely (and `qrcode.react` import).
- Make the barcode the centerpiece: `height={56}`, `width={1.6}`, `displayValue={false}`, on a white tile.
- Combine reward + code into a tighter two-row group:
  - Row A: emoji + reward title (single line, `text-base`/`text-lg`).
  - Row B: barcode tile with code label below.
- Compress location + issued date into a single 2-row info strip (icons + small text) instead of two separate cards.
- Reduce font sizes for headings (`text-2xl sm:text-3xl`) and tighten margins (`mt-3` instead of `mt-7`).
- Keep status banner, "already redeemed" banner (compacted to one line with a link), Share + Save/Print buttons (side-by-side, `h-9`), and fineprint.
- Use `overflow-hidden` on outer wrapper so we never get a scrollbar; on very small screens (<360px height landscape edge case) allow scroll as a fallback via `@media (max-height: 600px) { overflow-y:auto }`.

Target reference layout (top → bottom inside the card):

```text
[Status banner — 1 line]
Hello, {first} · "Your treat is waiting." (compact)
[Reward emoji + title + 1-line desc]
[Barcode tile]
   CODE: ABCD-EFGH-1234
[📍 Sans Sucre — Inside Metro, ATC]
[📅 Issued {date} (PHT)]
[Share]   [Save / Print]
fine print
```

### 2. `src/routes/redeemed.$code.tsx` — verify + minor polish

Functionality is already correct; we'll:

- Confirm Share button stays visible above the fold (already there).
- Make sure the "What's next" block is rendered (already there) and pulls from `useSiteCopy()` (already does).
- Add a small "Saved ✓" hint after feedback submit (already done via `feedbackThanks`).
- No DB or server changes needed — feedback already persists to `public.feedback`.

If the user reports the page is too long, apply same compaction principles (smaller paddings, tighter spacing). Otherwise leave as-is.

### 3. Admin: confirm "What's next" is editable

`/admin/copy` already exposes:

- `futureRewards.heading`
- `futureRewards.body`

No changes needed. We'll mention this in the response so the user knows where to edit it.

### 4. Quick QA after build

- Open `/receipt/<code>` at 375×667 and 414×896 — confirm no scroll.
- Open `/redeemed/<code>` for a redeemed signup — submit a 5-star rating + comment, confirm row appears in `public.feedback` (we'll query to verify).
- Confirm Share dialog opens on desktop (where Web Share API is unavailable).

## Files touched

- `src/routes/receipt.$code.tsx` — major restructure (remove QR, compact layout).
- (No changes required to `redeemed.$code.tsx`, `admin.copy.tsx`, `submitFeedback`, or DB.)

## Out of scope

- SMS/email notifications (item #8 from the original list).
- Sticky CTA, countdown, signup counter (separate enhancement).
