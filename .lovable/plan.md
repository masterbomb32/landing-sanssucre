# Sprint C — Final Batch

Five features remain from the Sprint C roadmap. All need at least one credential or external setup step from you. I'll pause at each gate, set things up once you provide what's needed, then continue.

## Stage 1 — Push notifications (staff alerts)

**Goal:** Logged-in staff get a web push when a new signup arrives or a code is redeemed.

- `staff_push_subscriptions` table already exists from Sprint C Day 1.
- Add server fns in `src/server/push.functions.ts`:
  - `registerStaffPush({ endpoint, p256dh, auth, userAgent })` — `requireSupabaseAuth`, upserts row keyed by `endpoint`.
  - `unregisterStaffPush({ endpoint })` — admin-or-self delete.
  - `sendStaffPush({ title, body, url })` — admin-only, fan-out using `web-push` over `fetch` (no Node addon — implement VAPID signing with WebCrypto so it works on Cloudflare Workers).
- Hook `sendStaffPush` into:
  - end of `submitSignup` → "New signup: {name} · {reward}" → `/admin`
  - end of `redeem_signup` server fn wrapper → "Code redeemed: {name}" → `/admin`
- Update `public/sw.js` to handle `push` and `notificationclick` events.
- Add a "Enable notifications" toggle on `/admin/index.tsx` that calls `Notification.requestPermission()`, then `registration.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })`, then `registerStaffPush`.
- Expose `VITE_VAPID_PUBLIC_KEY` to the client (public by design); keep `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` server-only.

**Credential gate:** I generate the VAPID keypair locally and prompt you to paste the three secrets (`VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:owner@sanssucre.ph`).

## Stage 2 — Email confirmation on signup

**Goal:** Customer receives a branded confirmation email immediately after signup, including their redemption code.

- Trigger the email-domain setup dialog (you'll choose the sender subdomain, e.g. `notify.sanssucre.ph`).
- Scaffold the shared email queue infrastructure (one-time).
- Scaffold a transactional email server route + React Email template (`signup-confirmation.tsx`) with: greeting, reward, redemption code (mono-spaced), link to `/receipt/$code`, opening date, unsubscribe link.
- Wire the send call into `submitSignup` (server fn) after the row insert. Failure to enqueue must NOT block signup — log and continue.
- Add subject + body copy to `/admin/copy` so non-devs can edit (uses existing `site_settings` pattern, falls back to template default).

**Credential gate:** You complete the email-domain dialog and add the DNS records at your registrar. Setup continues automatically while DNS verifies — I'll keep building.

## Stage 3 — SMS via Twilio

**Goal:** Same confirmation, sent as an SMS to the PH mobile they signed up with.

- Trigger the Twilio connector flow; you pick the account + verified sender number.
- Add `src/server/sms.functions.ts` with `sendSignupSms(signupId)` that calls Twilio Messages API through the connector gateway (form-urlencoded, `+63` normalization already exists).
- Hook into `submitSignup` next to the email call. Either channel failing is non-fatal; both are logged to `notification_log` (table already exists).
- Add an admin guard: skip SMS if `mobile` failed validation or `voided_at` is set.
- Recommend you turn on Twilio SMS Pumping Protection + Geo Permissions (PH only) after connecting.

**Credential gate:** You complete the Twilio connector picker. No raw secrets needed — gateway handles it.

## Stage 4 — Google Maps / Visit-us section

**Goal:** Landing page section with embedded map, address, hours, "Get directions" deep links.

- Add `<VisitUsSection />` mounted on `/` between testimonials and FAQ.
- Embedded Google Maps iframe (Maps Embed API — `key` is public, restrict by HTTP referrer to your domains).
- Address + hours pulled from `site_settings` (new keys `address`, `hours_json`, `phone`) — editable in `/admin/copy`.
- "Open in Google Maps" + "Open in Waze" + tap-to-call buttons.
- JSON-LD `LocalBusiness` schema injected via route `head()`.
- Footer gets address/phone too.

**Credential gate:** Add `VITE_GOOGLE_MAPS_API_KEY` (Maps Embed API enabled, HTTP-referrer restricted to your two `*.lovable.app` URLs + your custom domain).

## Stage 5 — QA + v1.3 publish

- Run the dev-server log + security linter once.
- Walk through landing → signup → email/SMS receipt → redeem → testimonial submit → admin push toast → admin moderation in the preview.
- Lighthouse pass (mobile, the viewport you're previewing in): aim ≥90 on perf/accessibility/best-practices/SEO.
- Update `Feature_Summary.md` to v1.3 status.
- Suggest publishing the frontend changes.

## Out of scope (deferred to Sprint D)

Multi-device staff sync, custom date-range picker, waitlist + per-reward caps, EN/FIL i18n, staff leaderboard, daily ops digest, A/B reward copy, POS webhook, exit-intent modal, GA4 + Meta Pixel, per-route OG images, real product photography.

## Order of operations

1. Approve plan → I start Stage 1 code + ask for the 3 VAPID secrets.
2. After secrets land → finish Stage 1, then open the email-domain dialog for Stage 2.
3. After DNS submitted → scaffold email infra + templates, wire into signup.
4. Trigger Twilio connector for Stage 3 → wire SMS.
5. Ask for the Maps key for Stage 4 → build Visit-us section.
6. QA + recommend publish.

I'll pause for your input at every credential gate; everything else proceeds without interruption.
