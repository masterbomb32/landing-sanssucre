
# Sans Sucre — Test Environment Build Plan

We'll build everything end-to-end inside the current Lovable preview (which acts as the test environment). Once you're happy with it, publishing to **www.sanssucre.ph** is just a domain connection — no code changes needed.

---

## What you get

A complete, testable flow:

```text
Landing  →  Pick treat  →  Form  →  Receipt (QR + barcode)
                                        │
                                        ├─→  SMS to customer
                                        ├─→  Email receipt
                                        └─→  Saved to CRM database
                                                  │
                                                  └─→  Admin dashboard
```

---

## Scope (what I'll build)

### 1. Reward picker — already in place, will polish
- Keep the 3 reward cards on the landing page form
- Replace placeholder emoji/copy with real treat names and short descriptions (you'll provide; until then I'll use elegant placeholders matching the brand)

### 2. Share with image (Open Graph card)
- Generate a branded **1200×630 share image** (logo + tagline + hero photo) saved as `public/og-image.jpg`
- Wire `og:image` and `twitter:image` (large card) into both the root and home routes
- Update `ShareButton` copy to be shorter and warmer
- When pasted in WhatsApp / Messenger / Facebook / iMessage, the unfurl will show the image, title, and description

### 3. Signup form — already in place
- Name, mobile (PH validation already there), optional email, reward choice
- No changes needed beyond minor copy tweaks

### 4. Elegant receipt page (`/receipt/$code`)
Replace the current minimal receipt with a branded page that matches the landing aesthetic:
- Sans Sucre logo, warm cream background, serif display headline
- Customer name, chosen reward (with emoji + description)
- **QR code** (encodes the redemption code) — primary scan target
- **Barcode** (Code-128) underneath — fallback for POS scanners
- Human-readable code in monospace
- "Show this at the counter" instruction
- Store location block (Metro Supermarket, ATC) with both partner logos
- Share button (so the customer can invite friends)
- "Save to phone" hint (works as a screenshot)

Libraries: `qrcode.react` (QR) + `jsbarcode` via `react-barcode` (barcode) — both lightweight, client-rendered.

### 5. SMS delivery
- Use **Twilio** (connector available, no manual API key juggling)
- Server function `sendReceiptSms` triggered right after signup insert
- Message: `"Hi {name}! Your Sans Sucre treat is reserved. Code: {CODE}. Show this on opening day at Metro Supermarket, ATC. {link to receipt}"`
- We'll need: a Twilio account + a sender number (PH-capable or Alphanumeric Sender ID). I'll guide you when we get there.

### 6. Email receipt
- Set up **Lovable's built-in app email** infrastructure (no third-party API key needed)
- Branded React Email template: logo, reward, QR image (rendered server-side), code, location, share link
- Triggered alongside SMS (only if the optional email field was filled)
- Requires you to add an email domain (e.g. `notify.sanssucre.ph`) — I'll walk you through DNS

### 7. Database / CRM
- `signups` table already stores: name, mobile, email, reward_choice, redemption_code, redeemed_at, created_at — that's the CRM core
- Add a `notification_log` table to track SMS + email send status (sent / failed / timestamp) so you can debug deliverability
- Add a `notes` text column on `signups` for future CRM annotations

### 8. Admin view (`/admin`)
Password-protected dashboard (Lovable Cloud auth, email + Google sign-in):
- **Stats cards**: total signups, signups today, redemptions, redemption rate
- **Reward breakdown**: count per treat (so you can prep stock)
- **Signups table**: name, mobile, email, reward, code, status (reserved / redeemed), signup time
- **Search** by name / mobile / code
- **CSV export** for the full list
- **Mark as redeemed** button (calls existing `redeem_signup` RPC) — handy for in-store staff
- **Notification status** column showing if SMS/email went through
- One-time bootstrap: first user to sign up at `/admin/setup` becomes admin; uses the `user_roles` pattern (separate table, `has_role()` security-definer function) — the only safe way to do roles

### 9. Edit copy without code
- All landing copy already lives in `src/lib/site-copy.ts` — easy to edit there
- I'll add an `/admin/copy` page where you can edit hero text, form copy, footer, and share text from a UI; saves to a `site_settings` table; landing reads it with sensible fallbacks to the file defaults
- Means you can tweak wording on the live site without redeploying

### 10. Receipt page polish
Already covered in §4 — same elegance as the landing page.

---

## What you're missing (gaps I'd flag)

These aren't blockers but worth deciding before launch:

1. **Real reward names + photos.** Emoji is charming but a small product photo per reward would make the picker irresistible.
2. **Anti-abuse.** Right now the form has no rate limit — one person could submit 100 times. Add: one signup per mobile (DB unique constraint) + simple IP rate limit on the server function. Strongly recommended.
3. **Capacity cap / reward inventory.** If you're only giving away 200 of treat A, the form should stop offering it once full. Easy to add a `quantity_remaining` column.
4. **Opening date / countdown.** No date is shown anywhere. A countdown adds urgency and clarity.
5. **Redemption window.** What happens if someone shows up 3 weeks late? Add an expiry date to codes.
6. **Staff redemption flow.** Admin can mark redeemed, but a quick `/scan` page where staff scans the QR and instantly marks it redeemed is much faster at the counter.
7. **Privacy & consent.** Privacy page exists; we should add an explicit checkbox + Philippine Data Privacy Act (RA 10173) reference for SMS marketing consent if you'll re-market to these contacts later.
8. **Terms of the promo.** "One per person", expiry, substitution policy — a short T&Cs page linked from the form.
9. **Double-opt-in for SMS marketing.** If you want to text customers *after* the opening promo, you legally need explicit opt-in for marketing (separate from the transactional receipt SMS).
10. **Analytics.** Page visits are logged but you have no funnel view (visit → form start → form submit → redemption). I can add a tiny funnel chart on the admin page.
11. **Backup / export schedule.** The CRM data should be exportable on a schedule, not just on-demand. I can wire a weekly CSV email to you.
12. **Domain email warm-up.** A brand-new sending domain has poor deliverability for the first few days. Plan to send the first ~50 emails to friendly inboxes (yourself, team) before launch day.
13. **SMS cost & sender ID.** Twilio PH SMS isn't free; budget ~₱1–2 per message. Decide on Alphanumeric Sender ID (`SansSucre`) vs a long number.
14. **Mobile receipt as wallet pass?** Apple Wallet / Google Wallet passes look very premium for an opening-day promo, but add 1–2 days of work. Defer for v2.
15. **Image assets.** The hero is one photo of red velvet. For the OG card and reward thumbnails, you'll want 3–4 more product shots.

---

## Deployment to www.sanssucre.ph

Once you approve the build in the Lovable preview:

1. Click **Publish** in Lovable → site goes live at `*.lovable.app`
2. In Project Settings → Domains → connect `www.sanssucre.ph`
3. Add the DNS records Lovable shows you at your domain registrar
4. Wait for verification (~minutes to a few hours)
5. Done — same code, same database, custom domain

The "test environment" and "production" are the same Lovable project. If you want a fully separate staging copy, we can fork the project later, but for an opening-day promo it's overkill.

---

## Build order (what I'll do, in order)

1. Database additions (`notification_log`, `site_settings`, `user_roles`, unique mobile constraint)
2. QR + barcode receipt page
3. OG share image + meta tags
4. Auth + admin shell (sign in, role check, layout)
5. Admin dashboard (stats, table, search, CSV)
6. Admin copy editor
7. Twilio SMS integration (will pause to set up the connector with you)
8. Email infra + branded receipt template (will pause for domain setup)
9. Notification log wiring + admin status column
10. Final polish + QA pass on mobile

I'll pause for your input at the SMS step (Twilio account) and the email step (domain DNS). Everything else I can do straight through.

---

## Technical notes

- **Stack**: existing TanStack Start + Lovable Cloud (Supabase). No new framework.
- **Roles**: separate `user_roles` table + `has_role()` SECURITY DEFINER function (only safe pattern).
- **RLS**: admin-only SELECT on `signups`, `notification_log`; public INSERT on signups stays as-is.
- **QR encodes**: the full receipt URL `https://sanssucre.ph/receipt/{CODE}` — staff can scan with any phone camera, opens the receipt for verification.
- **Idempotency**: each notification send keyed by `signup_id + channel` so retries don't double-send.
- **Server functions** for all writes (Twilio, email, role checks). No secrets ever reach the browser.

Approve and I'll start building.
