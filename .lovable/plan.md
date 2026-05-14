## Sprint C — Opening-week polish & growth (May 25 – Jun 7)

Goal: close the remaining ops gaps from Sprint B, add the trust/SEO content the landing page is missing, and ship two growth loops (referral + email confirmation). Roadmap-only items from `Feature_Summary.md` are deferred to Sprint D+.

---

### Scope (13 features, grouped by theme)

#### A. Admin & Ops (4)
1. **CSV Export** — `/admin` toolbar button. Server fn `exportSignups({ from, to })` streams CSV (name, mobile, email, reward, code, created_at, redeemed_at). Respects current date filter. Admin-only.
2. **Conflict-resolution UI** — replace the silent "already redeemed" toast on `/redeem` with a dialog showing who/when redeemed, plus a "Mark as my redemption" override that writes a `redemption_audit` note. Drains from the offline outbox into a "Needs review" tray instead of disappearing.
3. **Push Notifications** — Web Push for staff `/redeem` device. Notify on (a) new signup while station is open, (b) sync conflict needing review. VAPID keys stored as secrets; SW already exists, extend with `push` + `notificationclick` handlers. Subscription stored in new `staff_push_subscriptions` table.
4. **Soft-delete / void signup** — admin row action "Void". Adds `voided_at`, `voided_by`, `void_reason` to `signups`. Voided rows excluded from KPIs and from the offline redemption cache. Audited in `signup_edits`.

#### B. Customer comms (3)
5. **Email/SMS confirmation on signup** — fire-and-forget from `createSignup`. Email via Lovable Emails (queue-based); SMS via Twilio connector when mobile is PH and SMS is enabled in `site_settings`. Templates editable in `/admin/copy`. Logged to existing `notification_log`.
6. **QR code on receipt page** — render the redemption code as QR (via `qrcode` lib, client-side SVG). Scanner already accepts the same string, so no `/redeem` change needed. Print-friendly layout.
7. **Referral tracking** — receipt page gets a "Share & earn" block with a unique `?ref={code}` link. New `referrals` table (`referrer_signup_id`, `referred_signup_id`, `created_at`). On signup, if `?ref=` cookie present, link them. Admin dashboard adds a "Top referrers" card.

#### C. Landing page trust & SEO (5)
8. **Privacy Page** — replace the current stub at `/privacy` with a real PH-DPA-aligned policy (data collected, retention, contact). Editable copy block in `/admin/copy`.
9. **Customer testimonials & press logos** — new section on `/` between hero and signup. Pulls from new `testimonials` table (name, quote, photo_url, source, published). Press logos as static SVG strip.
10. **Testimonials submission page/form** — `/share-your-story` route. Collects name, quote, optional photo (Supabase Storage bucket `testimonials`). Inserts as `published=false`; admin moderates in `/admin/testimonials`.
11. **FAQ section** — collapsible accordion on `/` + standalone `/faq` route with JSON-LD `FAQPage` schema. New `faqs` table (`question`, `answer`, `sort_order`, `published`). Seeded with 8 starter Q&As; full CRUD in `/admin/faqs`.
12. **Scroll-reveal sticky CTA** — mobile-only sticky bottom bar ("Reserve your reward") that fades in after the user scrolls past the hero. Hides on `/receipt`, `/redeem`, `/admin`.
13. **Map / directions** — new "Visit us" section on `/` with embedded map (OpenStreetMap iframe — no API key, no tracking) + address, hours, "Get directions" deep links (Google/Apple/Waze). Hours stored in `site_settings`.

---

### Order of work (10 working days)

```text
Day 1   Migrations: signups.voided_*, referrals, testimonials,
        faqs, staff_push_subscriptions, storage bucket
Day 2   #1 CSV Export  +  #4 Soft-delete
Day 3   #2 Conflict-resolution UI + outbox review tray
Day 4   #3 Push Notifications (VAPID + SW + subscribe UI)
Day 5   #5 Email confirmation (Lovable Emails) — domain check first
Day 6   #5 SMS confirmation (Twilio connector) + #6 QR on receipt
Day 7   #7 Referral tracking (cookie, link, admin card)
Day 8   #8 Privacy + #11 FAQ (data + UI + JSON-LD)
Day 9   #9 Testimonials section + #10 submission form + moderation
Day 10  #12 Sticky CTA + #13 Map + QA pass + Lighthouse + publish v1.3
```

---

### Technical notes (for the engineer, skip if non-technical)

- **Schema additions**: new tables `referrals`, `testimonials`, `faqs`, `staff_push_subscriptions`; columns `voided_at/voided_by/void_reason` on `signups`; storage bucket `testimonials` (public read, admin write).
- **RLS**: testimonials/faqs public-read where `published=true`, admin-write. Referrals admin-read. Push subscriptions admin-only.
- **New server fns**: `exportSignups`, `voidSignup`, `subscribeStaffPush`, `sendSignupNotifications`, `submitTestimonial`, `moderateTestimonial`, `upsertFaq`. All use `requireSupabaseAuth` + admin check where appropriate.
- **Confirmation emails**: requires Lovable Emails domain — will trigger the email-domain setup dialog on day 5 if not yet configured.
- **Twilio SMS**: requires `standard_connectors--connect` to Twilio; ask user before day 6.
- **No Edge Functions** — all logic stays in TanStack server fns per stack rules.
- **SEO wins bundled in**: each new route (`/faq`, `/share-your-story`, `/privacy`) gets its own `head()` with title/desc/og. FAQ gets JSON-LD.

---

### Deferred to Sprint D / roadmap (from Feature_Summary)

Multi-device staff session sync, custom date-range picker, waitlist + per-reward inventory caps, EN/FIL i18n, staff leaderboard, daily ops digest email, A/B test reward copy, POS webhook, exit-intent modal, GA4 + Meta Pixel, per-route OG images (auto-gen), real product photography swap.

---

### Definition of done

- Admin can export, void, and moderate testimonials/FAQs.
- Staff device receives a push when a new signup arrives, and conflicts surface in a review tray.
- A new signup gets an email (and SMS if enabled) within 30s; QR on receipt scans cleanly.
- `/`, `/faq`, `/share-your-story`, `/privacy` each have unique `head()` metadata; FAQ JSON-LD validates in Rich Results Test.
- Mobile sticky CTA appears after hero, never overlaps the form.
- Map + hours visible on landing, "Get directions" opens correct app on iOS/Android.
- Lighthouse mobile ≥ 90 on Performance, SEO, Best Practices.

---

### Open questions before kickoff

1. SMS sender — keep Twilio, or skip SMS for v1.3 and ship email-only?
2. Testimonials moderation — do you want notifications when a new one is submitted?
3. Map provider — OpenStreetMap (free, no key) or Google Maps embed (needs API key)?
