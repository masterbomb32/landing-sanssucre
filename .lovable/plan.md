## Three improvements

### 1. Staff redeem confirmation: dismissible + configurable duration

**Problem**: The success card auto-clears after 4.5s — too fast. Staff can't pause it, and the duration isn't configurable.

**Changes:**
- `src/lib/site-copy.ts` — add `staff.redeemHoldSeconds` (default `8`).
- `src/routes/admin.copy.tsx` — add a new field "Staff redeem confirmation hold (seconds, 0 = stay until dismissed)" with numeric validation (0–60). Saved into `site_settings` under key `staff.redeem_hold_seconds`.
- `src/routes/redeem.tsx`:
  - On mount, also load `staff.redeem_hold_seconds` (alongside the PIN load) and store as a number state.
  - Replace the hardcoded `setTimeout(..., 4500)` on success with the configured value. If `0`, do **not** auto-clear — staff dismisses manually.
  - Add a visible **countdown** ("Auto-clears in 6s…") that ticks down, and a prominent **"Done — next customer"** button that's already present (`onContinue`). Also add a **"Pause"** toggle that cancels the timer so staff can hold the screen indefinitely on a busy moment.
  - The "already redeemed" / "invalid" / "error" states keep their existing short timeouts (those don't need holding).

### 2. Faster QR scanning (barcode-reader feel)

**Problem**: zxing's `decodeFromVideoElement` decodes frames at a leisurely cadence and waits for full multi-format hint matching, which feels slow vs. a hardware scanner.

**Changes to `src/components/scanner.tsx`:**
- **QR-only hints** in this redeem flow: drop `CODE_128` from `POSSIBLE_FORMATS` (we're QR-only now). Less work per frame = faster decodes.
- Switch from `BrowserMultiFormatReader.decodeFromVideoElement` to a **manual `requestAnimationFrame` loop** using `BrowserQRCodeReader` + a single `<canvas>`:
  - Each frame, draw the center crop of the video into a small canvas (~512×512), then run `decodeFromImageData`. Decoding a smaller, centered region is dramatically faster and matches the "aim at the bracket" UX.
  - Keep the existing 1.5s same-result debounce.
- **Lower video resolution** to `1280×720` ideal (down from 1080p). 720p decodes ~2× faster on phones with no real loss for QR.
- **Request continuous autofocus + torch capability**: after `getUserMedia`, call `track.applyConstraints({ advanced: [{ focusMode: "continuous" }] })` (try/catch — not all devices support it). Add a small **torch toggle button** in the overlay if `track.getCapabilities().torch === true` — huge difference in dim store lighting.
- **Visual+audio confirmation** stays (`playBeep(true)`), and the bracket overlay flashes green for 250ms on a successful decode for instant feedback.

Net effect: aim → decode in ~100–300ms instead of 1–2s, much closer to a Zebra/Honeywell scanner feel.

### 3. Customer "find my QR code" on opening day

**Problem**: Customers will lose the receipt link/email and need to retrieve their QR on-site.

**Approach: phone-number lookup with a one-time SMS-style verification — but kept simple for opening day.** Since we already collected mobile, customers re-enter the same PH mobile to recover their code. Privacy guard: we throttle, don't reveal whether a number exists, and only display the QR after a successful match.

**Changes:**

- **New route `src/routes/find.tsx`** ("Find my reward"):
  - Single field: PH mobile number, plus a "Find my reward" button.
  - On submit, calls a new server function `findReceiptByMobile`. On success, redirects to `/receipt/$code` (the existing QR page). On no-match, shows a generic "We couldn't find a reward for that number. Double-check or sign up at the top." (no enumeration leak).
  - Tasteful copy explaining: "Lost your link? Enter the mobile number you signed up with."
  - Editable copy keys added to `site-copy.ts` and `admin.copy.tsx` (`findMyReward.heading`, `.body`, `.submit`, `.notFound`).

- **New server function `src/server/receipt.functions.ts` → `findReceiptByMobile`**:
  - Input: `{ mobile: string }`, normalized via the same `normalizeMobile` used in signup.
  - Looks up `signups.redemption_code` where `mobile = normalized`. If not found, returns `{ found: false }`. If found, returns `{ found: true, code }`.
  - **Rate limiting**: simple in-memory or `notification_log`-backed throttle by mobile (max 5 attempts / 10 min) to deter scraping. For opening day a soft in-memory map is sufficient; we'll add a comment noting this.

- **Surfaced entry points** so customers can find this:
  - **Receipt page** (`src/routes/receipt.$code.tsx`): no change needed — they already have their link.
  - **Landing page** (`src/routes/index.tsx`): add a small text link under the hero CTA — "Already signed up? Find my reward →" linking to `/find`.
  - **Sticky mobile CTA**: leave as-is.
  - **Footer**: add "Find my reward" link.
  - **404 / not-found** on `/receipt/$code`: add a "Find my reward by phone number" button.

### Technical summary

Files created:
- `src/routes/find.tsx`

Files edited:
- `src/lib/site-copy.ts` — add `staff.redeemHoldSeconds`, `findMyReward.*`.
- `src/routes/admin.copy.tsx` — add hold-seconds field + find-my-reward copy fields.
- `src/routes/redeem.tsx` — load hold setting, configurable timer + countdown + pause.
- `src/components/scanner.tsx` — manual rAF decode loop, 720p, torch + autofocus, optional QR-only mode prop.
- `src/server/receipt.functions.ts` — add `findReceiptByMobile` server function with throttling.
- `src/routes/index.tsx` — add "Find my reward" link in hero + footer.
- `src/routes/receipt.$code.tsx` — add link in `notFoundComponent`.

No database migrations required — uses existing `signups.mobile` and `site_settings`.

### Open question

For the customer lookup, do you want an extra verification step (send a 6-digit code via SMS to the matched mobile) before showing the QR, or is a direct mobile-match lookup acceptable for opening day? Direct match is faster and free; SMS verification is more secure but requires wiring up an SMS provider. I'd recommend **direct match + throttling** for opening day given the short event window and low value of the rewards — happy to switch to OTP if you prefer.