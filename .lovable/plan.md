# Mobile QA: Unified Feedback + Redeem Flow

## Scope
Two routes that share the testimonial pipeline:
- `/share-your-story` (full public form, optional `?code=` prefill)
- `/redeemed/$code` (post-redemption thank-you with inline feedback block)

QA viewport: **393×852** (current preview), spot-check at **360×800**.

## Findings (from code review + screenshot)

### `/share-your-story`
1. **Star tap targets too small.** `h-7 w-7` + `p-0.5` ≈ 32px hit area. Below the 44px iOS guideline; easy mis-taps.
2. **No live validation cue.** Submit only validates on click. Users can fill the form, tap submit, and only then learn they missed a rating. The submit button should also be visibly disabled until rating ≥ 1.
3. **Native file input overflows visually.** The shadcn `Input type="file"` renders the OS "Choose File / No file chosen" string which clips on narrow widths and looks unstyled vs. the rest of the form.
4. **Char counter shows `0/1000` from the start.** Noisy when the textarea is empty — only show once the user types.
5. **Form padding `p-6` + outer `px-5`** = 44px horizontal inset on a 393px screen. Workable but tight; the textarea ends up <320px wide. Drop form padding to `p-5` on mobile.
6. **`verified` badge sits above the form card** — easy to miss. Move it inside the card header so it reads as part of the form context.

### `/redeemed/$code` — `FeedbackBlock`
1. **Star buttons even smaller** (`h-6 w-6` + `p-0.5` + `gap-0.5`) ≈ 28px. Same tap-target issue, worse.
2. **Bridge link logic.** The "share a fuller story publicly →" link only renders when `sharePublicly` is unchecked, and the post-submit "Want to share more publicly? →" only renders after submit. A user who already checked "share publicly" loses the link entirely. Keep a single, always-visible bridge link below the comment block.
3. **`sharePublicly` reveals extra inputs but the card stays the same width** — fine, but the nested `p-2` panel inside an already padded card feels cramped. Bump to `p-3` and add `space-y-2`.
4. **Photo preview is `h-16 w-16`** — too small to confirm the right photo was chosen on a phone. Use `h-20 w-20` and add filename below.
5. **Validation toasts only.** When rating is 0 the submit button is enabled and only fails on click. Disable until rating ≥ 1 (mirrors fix above).
6. **`<input type="checkbox">` is the native control** — inconsistent with the rest of the design system that uses shadcn `Checkbox`. Swap in `Checkbox` for visual consistency and a bigger tap area.

## Plan

### 1. Shared fixes — both forms
- Increase star button hit area to ≥44px: `p-1.5` wrapper, keep visible icon size.
- Disable Submit button until `rating >= 1` (in addition to current toast guard).
- Replace native `<input type="checkbox">` with shadcn `<Checkbox>` on `/redeemed/$code`.

### 2. `/share-your-story` polish
- Move "Verified visit" badge inside the form card, above the rating row.
- Reduce form card padding on mobile: `p-5 sm:p-6`.
- Hide char counter until `quote.length > 0`.
- Wrap the file input in a styled label-button so it reads as one of our buttons rather than the OS default. Show selected filename next to the preview.

### 3. `/redeemed/$code` `FeedbackBlock` polish
- Always render the bridge link to `/share-your-story?code={code}` directly under the textarea, regardless of `sharePublicly` state. Remove the duplicate post-submit link (keep just the "thank you" confirmation).
- Bump nested public-share panel to `p-3 space-y-2`.
- Photo preview `h-20 w-20`, show truncated filename underneath.

### 4. Verify
- Re-screenshot `/share-your-story` at 393×852 and 360×800.
- Walk through redeem flow in the browser using an existing redeemed code (if available in the DB) and screenshot the FeedbackBlock empty / 3-star / share-publicly-checked states.
- Confirm star tap targets, disabled-submit state, and bridge link in all states.

## Out of scope
- No DB schema, RPC, or server-function changes.
- No copy changes beyond the bridge-link consolidation.
- The shared `<TestimonialForm>` component extraction is still deferred (not requested here).

## Files touched
- `src/routes/share-your-story.tsx`
- `src/routes/redeemed.$code.tsx`
