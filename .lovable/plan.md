# Sans Sucre Opening Day Rewards — Plan

A signup-and-redeem rewards site for Sans Sucre's opening day. Customers scan a marketing QR (on tarpaulins, standees, IG/FB), pick a reward, get a unique redemption code via email + SMS, and staff redeem it on opening day with a webcam scan.

## Customer flow

**1. Landing page (`/`)** — the page the marketing QR points to
- Hero with brand visuals, opening-day messaging, social share button (Web Share API + WhatsApp/FB/copy-link fallback).
- Signup form: Name (required), Mobile number (required, PH format validation), Email (optional).
- Pick 1 of 3 rewards (placeholder cards — easy to edit later).
- "Claim my reward" submit.

**2. Receipt page (`/receipt/:code`)**
- Styled "receipt" with customer name, chosen reward, and a unique **redemption barcode** (Code 128) — visually distinct from the marketing QR so customers don't confuse them.
- Clear note: *"Show this on opening day at the store to claim your reward."*
- Buttons: Download as image, Share, Re-send email/SMS.
- Same code is also sent via email (with barcode image inline) and SMS (short link to the receipt page).

**3. Thank-you page (`/redeemed/:code`)**
- Shown after staff successfully redeems the code.
- Friendly thank-you, open invitation to visit again, social links, footer mention that a loyalty program is coming soon.

## Staff flow

**4. Staff scanner (`/scan`)** — single shared password
- Password gate stored as a server secret; sets a short-lived signed cookie.
- Webcam barcode scanner (Code 128).
- On scan: shows customer name + chosen reward + big **"Confirm Redeemed"** button.
- After confirm: code is marked one-time-used, customer is shown the thank-you page on their phone if they're refreshing.
- Re-scanning a used code shows "Already redeemed on {date}". Invalid code shows clear error.

## Admin flow

**5. Admin dashboard (`/admin`)** — same password gate
- **Signups table**: name, mobile, email, reward, signup date, redeemed status. Filters + search. **Export to CSV**.
- **Analytics**: total page visits, unique visitors, repeat visitors, total signups, signups per reward, redemption rate, daily trend chart. Tracking is first-party (no third-party cookies) — uses a hashed visitor ID stored in localStorage + server-side page-view logging, so it works on the marketing QR landings from tarpaulins, standees, IG, and FB equally.
- **Loyalty announcement broadcast**: after opening day, one click to send the entire customer list a "Join our loyalty program" email + SMS using a template you can edit. Built now, used later.

## Notifications

- **Email**: Lovable's built-in email infrastructure (branded thank-you with barcode + receipt link).
- **SMS**: Twilio connector. Short message: *"Thanks for joining Sans Sucre's opening day! Your reward: {short link}"*.
- Sends fire immediately on signup; failures are logged but don't block the receipt.

## Codes — why barcode for redemption

- **Marketing QR** (printed on tarpaulin/standee/IG/FB) → links to `/` (landing page). Same QR for everyone.
- **Customer redemption code** → unique **Code 128 barcode** per signup. Different shape and purpose, so customers don't confuse the marketing QR with their personal claim. Barcodes also scan reliably on phone screens via webcam.

## Responsive design

Mobile-first layouts (most signups will come from phones via IG/FB/QR scans), with adapted layouts for tablet and desktop. Staff scanner is optimized for laptop/tablet webcam use.

## Data model (Lovable Cloud / Supabase)

- `signups`: id, name, mobile, email, reward_choice, redemption_code (unique), redeemed_at, created_at.
- `page_visits`: id, visitor_hash, path, referrer, user_agent, created_at — feeds analytics.
- RLS: signups + analytics tables are admin-only; receipt page reads via a server function keyed on the redemption code.

## Deployment to `www.sanssucre.ph/rewards`

The code lives in GitHub from day one (Lovable's GitHub integration auto-syncs every change). After dev & testing, you'll have these deployment options — I'll write a short DEPLOY.md in the repo covering each:

1. **Easiest — Lovable hosting + custom subdomain.** Publish on Lovable, point `rewards.sanssucre.ph` at it. Lovable handles SSL automatically. (A subdomain, not a `/rewards` subpath.)
2. **Vercel / Netlify + custom subpath.** Deploy the GitHub repo to Vercel or Netlify, then on your existing `sanssucre.ph` host (likely WordPress) add a reverse-proxy rule mapping `/rewards/*` to the Vercel/Netlify deployment. This gives you the exact `www.sanssucre.ph/rewards` URL you want.
3. **Self-host the Node build.** Run `npm run build` and deploy the output to any Node host (Cloudflare Workers, Fly.io, Railway, your own VPS) and reverse-proxy `/rewards` to it.

Note on Supabase: Supabase is the **database** (it's what Lovable Cloud uses under the hood), not a website host. The Supabase database stays the same regardless of where the frontend is deployed — only environment variables need to be copied.

## Out of scope (intentionally)

- Per-user staff accounts (single shared password is enough).
- Multi-language support.
- Active marketing campaigns (broadcast tool is built but not used until after opening).

## What I'll need from you after approval

- A staff password (you'll set it as a secret).
- Twilio account (to connect via the Twilio connector) + a sender phone number.
- Brand assets when ready (logo, colors) — otherwise I'll use a clean bakery-appropriate palette.
- Final reward names whenever you have them — placeholders work until then.
