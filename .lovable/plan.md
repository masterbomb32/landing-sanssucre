## Feature verification report

Audit of the 8 production-readiness items against the current codebase. Status legend: ✅ done · ⚠️ partial · ❌ missing.

### 1. Full Supabase migration ⚠️ partial
- All persistent data (signups, redemptions, testimonials, FAQs, mailing, audit, push subs, settings) lives in Supabase with RLS — verified in `<supabase-tables>`.
- IndexedDB (`idb-keyval`) is still used **intentionally** in `src/lib/redeem-cache.ts` and `src/lib/redeem-outbox.ts` for the offline staff scanner (cached unredeemed codes + redeem outbox). This is a feature, not unstable mixed storage.
- `localStorage`/`sessionStorage` usage is limited to: Supabase auth session (`client.ts`, required), visitor ID (`visitor.ts`), and referral code passthrough (`signup-form.tsx`). All non-critical.
- **Verdict:** no actual "mixed storage instability". If the concern is the offline outbox, that's by design. Nothing to migrate.

### 2. Email receipt / recovery ❌ missing
- `signup.functions.ts` accepts an optional email but **never sends anything**. No email infra (`email_send_log`, `process-email-queue`, auth-email-hook) is set up.
- Recovery exists only via `/find` (phone lookup) — no email link with the redemption code.
- **Gap:** customers who lose the receipt link and don't remember their phone are stuck.
- **Fix needed:** set up Lovable Emails domain → scaffold a transactional email → send "Your Sans Sucre reward code" on signup with link to `/receipt/{code}`. Add a "resend by email" action on `/find`.

### 3. Security hardening ⚠️ partial
Strong:
- All tables have RLS with role-based admin policies via `has_role()` security-definer.
- Server-side Zod validation on every server fn input; PH mobile regex; length caps.
- Staff PIN verified server-side with timing-delay; bcrypt-style stored in `staff_settings`.
- Service role key isolated in `client.server.ts`.

Gaps:
- **No rate limiting** on `createSignup`, `submitPublicStory`, `logVisit`, `logShare` — anyone can flood inserts (RLS allows anon insert with length checks only).
- **No CAPTCHA / bot protection** on the public signup form.
- **`page_visits` / `share_events`** accept anon inserts with no per-visitor throttle.
- **Leaked-password HIBP** check not enabled on auth (admin login).
- **No security scan run yet** — recommend running `security--run_security_scan` before launch.

### 4. Real analytics funnel ⚠️ partial
- Raw events captured: `page_visits` (path, referrer, country, visitor_hash), `share_events` (channel, path), `signups`, `redemption_audit`, `referrals`.
- `useTrackVisit` fires on mount per path.
- **Gap:** no funnel view in admin. `admin.index.tsx` shows signup totals/redeem rate but no visit→signup→redeem→testimonial conversion chart. No drop-off by source/referrer.
- **Fix:** add a `funnel` server fn that joins `page_visits` distinct visitors → `signups` → `redeemed_at not null` → `testimonials`, and a chart card on admin home. Optionally group by `referrer` host and `country`.

### 5. Publish + domain setup ⚠️ partial
- Project is published: `https://landing-sanssucre.lovable.app` is live.
- No custom domain attached (project_urls shows none).
- `.lovable/dns-recommendations.md` exists — domain choice presumably documented.
- **Fix:** user needs to connect a custom domain via Project Settings → Domains, then we wire canonical `<link>` + og:url to it.

### 6. Error tracking ❌ missing
- No Sentry / PostHog / error logger wired. `errorMiddleware` not registered in `src/start.ts` (`requestMiddleware: []`).
- `useTrackVisit` swallows errors with `.catch(() => {})`. Server fns throw to client but nothing is captured centrally.
- **Fix:** add a lightweight `error_log` table + server fn `logClientError`, install a global window error / unhandledrejection listener, and add an `errorMiddleware` to `requestMiddleware` that writes server-fn errors to that table. Surface in admin.

### 7. CSV export ✅ done
- `src/lib/csv.ts` + admin buttons in `admin.index.tsx`:
  - Signups CSV (respects current status filter): created_at, name, mobile, email, reward, code, redeemed_at, voided_at, void_reason.
  - Testimonials CSV: created_at, name, rating, quote, source, published, comment_only.
- **Minor polish suggestion:** add CSV escaping for commas/quotes/newlines in `downloadCsv` (current implementation likely naive — worth a quick look) and add a "redemptions only" preset for opening-day staff.

### 8. Staff workflow polish ⚠️ partial
Already in place:
- PIN-gated staff station (`/redeem`), QR scanner, offline cache of unredeemed codes (`redeem-cache.ts`), redeem outbox with retries (`redeem-outbox.ts`), batch RPC `redeem_signup`, 30-second unredeem window, web-push notifications to staff (`use-staff-push`, VAPID keys configured).
- Admin pages: audit log, copy editor, FAQs, mailing, testimonials moderation.

Gaps worth polishing before opening day:
- No visible "outbox pending: N" badge on `/redeem` for staff awareness.
- No "today's redeemed count" live tile on the scanner screen.
- No printable name+reward chit after successful scan (handy for the counter).
- No quick-search by last 4 digits of code/mobile from `/redeem` when scanner fails.

---

### Recommended next steps (ordered for launch)

1. **Run security scan** + fix anything critical, enable HIBP password check.
2. **Connect custom domain** (user action) → I'll wire canonical + og tags.
3. **Add email receipt + recovery** (Lovable Emails domain → transactional template → send on signup + "resend" on `/find`). Biggest customer-facing gap.
4. **Add error tracking table + middleware** + admin error log view.
5. **Add rate limiting** on public-insert server fns (per-IP + per-visitor) to harden against floods.
6. **Add funnel view** to admin home.
7. **Staff polish**: outbox badge, today's count tile, optional name chit, code-tail search.
8. **CSV polish**: proper escaping + redeemed-only preset.

Items 1, 2, and 3 unblock launch. The rest can ship in a fast follow.