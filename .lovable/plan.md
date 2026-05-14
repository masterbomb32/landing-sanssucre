# Sprint C — Batch 2 Plan

Build 6 self-contained features now (no external credentials needed), then queue 4 credential-gated features for a final batch.

## Build now (in this order)

### 1. Conflict-resolution UI (Day 3)
- Replace silent "already redeemed" toast on `/redeem` with a modal showing: original redeemed_at timestamp, staff who redeemed (if known), reward, customer name.
- Actions: **Close** / **Log conflict** (writes to `redemption_audit` with `action='conflict'` + optional note).
- Files: `src/routes/redeem.tsx`, new `src/components/ConflictModal.tsx`.

### 2. QR code on receipt (part of Day 6)
- Add `qrcode` npm package.
- Render QR encoding the redemption code on `/receipt/$code`, sized for phone screens.
- Print-friendly (black on white, no shadows).
- Files: `src/routes/receipt.$code.tsx`.

### 3. Referral tracking (Day 7)
- Read `?ref={code}` on landing → store in sessionStorage.
- On signup success, if ref present and resolves to a valid signup, insert into `referrals` (referrer_signup_id, referred_signup_id) via a new server fn `recordReferral`.
- Show "Share your link" card on `/thanks` with `?ref={their_code}` deep link + native share.
- Admin: "Top referrers" card on `/admin` (count of `referrals` grouped by referrer).
- Files: new `src/server/referrals.functions.ts`, edit `src/routes/index.tsx`, `src/routes/thanks.tsx`, `src/routes/admin.index.tsx`.

### 4. Privacy + FAQ (Day 8)
- New route `src/routes/privacy.tsx` — content from `site_settings.privacy_html` (editable in `/admin/copy`), PH-DPA-aligned default copy seeded.
- New route `src/routes/faq.tsx` — accordion fed by `faqs` table (already exists, seeded).
- Inject `FAQPage` JSON-LD on `/faq`.
- Footer links to `/privacy` and `/faq`.
- Admin: new `/admin/faqs` to add/edit/reorder/publish FAQs (uses `upsertFaq`, `deleteFaq` server fns).
- Files: `src/routes/privacy.tsx`, `src/routes/faq.tsx`, `src/routes/admin.faqs.tsx`, new `src/server/faqs.functions.ts`, edit footer + `/admin/copy`.

### 5. Testimonials (Day 9)
- Landing section: rotating quotes from `testimonials` where `published=true`, plus a static press-logo strip (4 placeholder SVGs).
- New route `/share-your-story` — public form (name, quote, optional photo upload to `testimonial-photos` bucket). Inserts as `published=false`.
- Admin moderation at `/admin/testimonials`: list pending → publish/delete/reorder.
- Files: new `src/components/TestimonialsSection.tsx`, `src/routes/share-your-story.tsx`, `src/routes/admin.testimonials.tsx`, new `src/server/testimonials.functions.ts`.

### 6. Scroll-reveal sticky CTA (part of Day 10)
- Mobile-only fixed bottom CTA "Claim your reward" → scrolls to signup form on `/`.
- Appears after scrolling past hero (~400px), hides on `/receipt`, `/redeem`, `/admin/*`, `/thanks`.
- Smooth fade in/out via framer-motion.
- Files: new `src/components/StickyCTA.tsx`, mounted in `__root.tsx` with route check.

## Then (credentials-gated — separate batch)

After this batch is approved & built, I'll proceed with the final 4:
- **Push notifications** — needs VAPID keys (I'll generate, then `add_secret` for `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`).
- **Email confirmation** — needs Lovable Emails domain setup dialog.
- **SMS via Twilio** — needs Twilio connector via `standard_connectors--connect`.
- **Google Maps** — needs `GOOGLE_MAPS_API_KEY` secret (Maps Embed API enabled).
- **QA & v1.3 publish** — Lighthouse pass, smoke test, publish.

## Technical notes
- All new server fns use `requireSupabaseAuth` + admin check where appropriate (testimonial moderation, FAQ edit, referrer report). Public submission fns (`recordReferral`, public testimonial insert) use anon RLS already in place.
- All new routes get unique `head()` metadata for SEO.
- No schema changes needed — Day 1 migrations already created `referrals`, `testimonials`, `faqs`, `testimonial-photos` bucket.
- Dependencies to add: `qrcode` + `@types/qrcode`.

Approve to start building.
