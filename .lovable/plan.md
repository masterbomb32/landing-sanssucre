
# Sans Sucre — Pre-launch Hardening & Polish Plan

Grouped into **5 phases** so we can ship in order of operational risk. Each item is sized **S/M/L** and notes the files it touches.

---

## Phase 1 — Staff operations (must-have for opening day)

### 1.1 Undo last redemption (30s window) — **S**
- Add a `redeemed_at` clear path: new `unredeem_signup(p_code, p_window_seconds)` Postgres function (SECURITY DEFINER) that only succeeds if `now() - redeemed_at < window`.
- After a successful scan in `src/routes/redeem.tsx`, store the redeemed code in component state and show a small **"Undo (29s)"** ghost button next to "Done — next customer". Counts down with the existing `countdown` ticker.
- On undo: call RPC, play a soft beep, toast "Reverted", refresh today's count.
- Audit: write a row to a new `redemption_audit` table (action: `redeem` | `unredeem`, actor: pin-session id, code).

### 1.2 Pre-opening test mode toggle — **S**
- Add boolean `staff.test_mode` to `site_settings` (admin/copy editor adds it).
- When ON: `redeem.tsx` shows a yellow "TEST MODE" banner; the redeem RPC is **not** called — instead we run a fake success flow with a synthetic name/reward picked from `REWARDS`. No DB writes, no count change.
- Lets you drill staff (PIN entry → scan → confirmation → undo) without burning real codes.

### 1.3 Admin manual edit of a signup — **M**
- New row action in `src/routes/admin.index.tsx` table: **Edit** (pencil icon) → opens a Dialog with editable name, mobile, email, reward.
- Backend: `updateSignup` server function (admin-auth-middleware enforced) that revalidates with the same Zod schema as signup creation and writes via `supabaseAdmin`.
- Add an `edited_at`, `edited_by`, `edit_reason` column to `signups` (require a short reason string — e.g. "Customer showed ID, mistyped mobile"). Reason is stored for accountability.
- UX copy in dialog: *"Ask the customer for a valid ID before editing. This change is logged."*
- The "fill out a new form" path is already supported (signup form on `/`); we add a small note in the dialog pointing to it as the simpler option.

### 1.4 Offline fallback for spotty signal — **M**
- Service worker (`public/sw.js`) registered from root: precache the `/redeem` shell, logo, fonts, and a tiny offline JSON of recently-issued codes (last 48h, refreshed every 5 min while online — pulled via a new `recentCodes` server function returning **only hashed prefixes + redeemed flag**, never PII).
- When `navigator.onLine === false` or the RPC fails: queue the redemption in IndexedDB (`offline_queue`) and show a yellow "Queued — will sync" badge.
- Background sync loop: on reconnect, replay queued redemptions sequentially via the normal RPC. Conflict (already redeemed) shows a small reconciliation toast.
- Brightness: this only protects the staff `/redeem` flow, which is what matters in the basement. Customer pages still need network.

### 1.5 Brightness + screen-on hint on receipt — **S**
- On `src/routes/receipt.$code.tsx`, when the page mounts on mobile:
  - Request `navigator.wakeLock` (screen stays on).
  - Show a one-time toast: *"Tip: max your brightness for a faster scan."*
  - Optional: CSS `filter: brightness(1.05)` on the QR card itself.

---

## Phase 2 — Customer-side trust & conversion (landing page)

### 2.1 Live signup counter — **S**
- New server function `getPublicSignupCount` returns `{ count, capped: true }` (cap at the real number; no rounding shenanigans).
- Shown in hero as: *"327 sweet treats already claimed"*. Polls every 30s, with a subtle count-up animation.
- If count < 25, hide it (avoid "be the first" awkwardness on day 1) — admin can override via `site_settings.public.show_counter_min`.

### 2.2 Countdown to opening day — **S**
- Add `opening_day_iso` to `site_settings` (admin/copy editor).
- New `<OpeningCountdown />` component in hero showing `D : H : M` ticking down. After opening day passes, swap to *"We're open! Come visit."*

### 2.3 Partner/press logos in hero footer strip — **S**
- Move the existing Metro + ATC logos from the page footer into a **trust strip** directly under the hero CTA: *"In partnership with"*. Keep them in the footer too.

### 2.4 Reward preview gallery — **S**
- Replace emoji-only reward cards in `src/components/signup-form.tsx` with **small product photos** (use existing `red-velvet-hero` style — generate or upload one image per reward into `src/assets/rewards/`).
- Falls back to emoji if image missing.

### 2.5 FAQ section — **S**
- New collapsible accordion below the form: "When can I claim?", "Do I need to bring ID?", "What if I lose my code?" (point to `/find`), "Can I gift it?", "How do I find Sans Sucre?".
- Schema.org `FAQPage` JSON-LD for SEO.

### 2.6 Map embed + directions — **S**
- New `<FindUs />` section: an embedded Google Maps iframe pinned to Metro Alabang + a "Get directions" deep link. Mention basement floor + nearest entrance.
- Lazy-load the iframe (only mounts when scrolled into view) to keep LCP fast.

### 2.7 Story / about block — **S**
- One-photo founder note above the FAQ. Single editable copy field.

### 2.8 Sticky mobile CTA — **already shipped** ✅ (verified in `src/routes/index.tsx`)

### 2.9 Exit-intent / scroll-depth nudge — **S**
- On desktop: `mouseleave` toward top → small toast "Don't leave empty-handed — claim your treat".
- On mobile: at 70% scroll depth without form interaction → same toast.
- Suppressed if user already has a receipt cookie or signed up.

---

## Phase 3 — Customer journey polish

### 3.1 DPA consent under feedback — **S**
- In `src/routes/redeemed.$code.tsx` (the thank-you / feedback page), add small print under the textarea:
  *"By submitting, you consent to Sans Sucre processing this feedback per our [Privacy Notice](/privacy). RA 10173 (Data Privacy Act)."*

### 3.2 OG image + per-route metadata — **S**
- Generate a branded OG image with text **"Free opening day treat — Sans Sucre @ Metro Alabang"** (1200×630). Store at `public/og-image.png`.
- Per-route `head()` updates: `/find`, `/privacy`, `/redeemed/$code` get unique titles + descriptions.
- Twitter card meta tags.

### 3.3 Schema.org JSON-LD — **S**
- Root layout: inject `LocalBusiness` (name, address, phone, hours, geo).
- Home: inject `Event` (opening day) referencing the same date used by the countdown.

### 3.4 IG tag prompt on share — **S**
- In `<ShareButton />` thank-you context: prepend *"Tag us @sanssucre.ph 💛"* above the share options.

---

## Phase 4 — Analytics & observability

### 4.1 Conversion-funnel events — **S**
- Extend `share_events` channel enum (or create `funnel_events` table) with:
  `landing_view, form_focus, signup_submitted, receipt_view, code_redeemed, feedback_submitted, mailing_list_joined`.
- Wire the `useTrackVisit` pattern to fire these at the right moments. Already half-done (`page_visits`, `share_events`) — this fills the gaps.
- Admin dashboard: add a **funnel chart** (visit → submitted → redeemed → feedback) using simple Tailwind bars.

### 4.2 Client-side error tracking — **S**
- Lightweight: a global `window.onerror` + `unhandledrejection` listener that POSTs to a new `/api/public/log-error` route (with rate-limit-style debounce client-side; not server-side per project rules).
- Stored in a new `client_errors` table with: message, stack (truncated 2KB), userAgent, path, visitor_hash.
- Admin dashboard: "Recent client errors" panel with count + last 20.
- Avoids Sentry dependency for now; can swap later.

---

## Phase 5 — Security hardening (deployment, DNS, injection, abuse)

### 5.1 SQL injection — **status: already safe**
- All DB writes go through Supabase JS client (parameterised) or SECURITY DEFINER functions with typed args. No raw string SQL anywhere. Confirmed in `signup.functions.ts`, `receipt.functions.ts`, `redeem.functions.ts`.
- **Action:** add a lint rule note in repo + keep it that way. Nothing to change.

### 5.2 XSS — **mostly safe, one tightening**
- React escapes by default. No `dangerouslySetInnerHTML` in the codebase (verified).
- The new JSON-LD scripts (Phase 3.3) MUST be JSON-stringified server-side and inserted via a `<script type="application/ld+json">` whose content comes from a trusted constant (no user input).
- Feedback comments displayed in admin: pass through React text node, never `innerHTML`.

### 5.3 CSP + security headers — **M**
- Add response headers via TanStack Start root or a small middleware:
  - `Content-Security-Policy`: `default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; frame-src https://www.google.com` (Maps).
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(self), geolocation=()` (camera needed for `/redeem`).
  - `X-Frame-Options: SAMEORIGIN`

### 5.4 RLS audit — **status: good, one gap**
- `signups` UPDATE is admin-only ✅
- `feedback` INSERT is open but bounded by length ✅
- `mailing_subscriptions` INSERT open ✅ — but currently lets anyone insert any `signup_id`. **Fix:** add a CHECK / trigger that requires either a matching `signups.redemption_code` proof or move the write behind a server function that verifies the code. (We already use a server function for mailing — convert any direct client inserts to go through it.)
- `site_settings` SELECT is public ✅ — but PIN is stored here. **Fix:** move `staff.redeem_pin` into a separate `staff_settings` table that's admin-only, or hash it. Today the staff PIN is readable by anyone with the publishable key. **High priority before launch.**

### 5.5 DNS, DDoS, abuse — **M (partially out of our hands)**
- Cloudflare Workers (the deploy target) gives us baseline DDoS protection automatically.
- Recommend the user enables in their DNS provider:
  - **DNSSEC** on `sanssucre.ph`
  - **CAA record** restricting cert issuers
  - **SPF / DKIM / DMARC** if they'll send mail from the domain (currently not, but they will once they wire transactional email).
- Cloudflare dashboard recommendations (we'll document, user toggles): "Under Attack" mode toggle, Bot Fight Mode, Challenge for `/redeem` from non-PH IPs, geo-block `/admin` to PH only.
- **No application-level rate limiting** per project policy — but we already have an in-memory throttle on `findReceiptByMobile` which is best-effort and acceptable.

### 5.6 Auth & secrets — **status: good**
- Service role key only ever imported via `client.server.ts` ✅
- Admin routes gated by `has_role(uid, 'admin')` ✅
- Recommend enabling **Leaked Password Protection (HIBP)** on the auth provider — one-click toggle in Cloud settings.
- Recommend setting **OTP expiry to 10 minutes** if the user adds magic-link auth later.

### 5.7 Input validation — **status: good**
- All server functions use Zod with min/max + format. Already conformant with the input-validation guidelines. No changes needed.

### 5.8 Camera permission scope — **S**
- The QR scanner currently requests camera on `/redeem`. Add explicit `Permissions-Policy` (above) and ensure we **stop the MediaStream tracks** on unmount and on PIN-lock. Verified `Scanner` already does this; just keeping it on the checklist.

---

## Suggested ship order

1. **Today/tomorrow:** 1.1 Undo, 1.2 Test mode, 1.5 Brightness/wakelock, 5.4 PIN-in-public-settings fix, 5.3 CSP headers.
2. **Next:** 1.3 Manual edit, 1.4 Offline queue, 2.1 Counter, 2.2 Countdown, 2.5 FAQ, 2.6 Map.
3. **Polish:** 2.4 Reward photos, 2.3 Trust strip, 2.7 Story, 2.9 Exit-intent, 3.x metadata/SEO/DPA.
4. **After launch:** 4.x analytics + error tracking (so we have data from day 1, but it's not blocking).

---

## What I'll need from you

- The **opening day date + time** (for countdown).
- One **product photo per reward** (or approval to AI-generate placeholders).
- One **founder photo + 2-3 sentence story** (or approval to draft + you edit).
- Confirmation we can move the staff PIN out of the public `site_settings` table (this means the PIN becomes admin-only readable — staff still log in with it via the existing PinPad after we add a tiny `verifyStaffPin` server function).
- Decision on test mode UX: banner + fake confirmations only, or also a "test code" prefix like `TEST-XXXX`?

If you say "do all of phase 1 + 5.4 + 5.3 first", I'll start there. Otherwise tell me which subset to ship first and I'll execute.
