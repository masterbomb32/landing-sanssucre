## Goal
Redesign the Thank You / Redeemed page (`/redeemed/$code`) into a single-screen, no-scroll, responsive card that invites visitors to follow Sans Sucre on Instagram & Facebook, and offers a contextual mailing-list CTA based on whether they shared an email at signup.

## UX Behavior

```
┌─────────────────────────────┐
│  ✓ Redeemed (status strip)  │
│  Thank you, {firstName}     │
│  🧁  Reward title           │
│  ───────────────────────    │
│  Follow us:  [IG]  [FB]     │
│  ───────────────────────    │
│  ⭐⭐⭐⭐⭐ rate visit       │  (compact)
│  ───────────────────────    │
│  Mailing-list block (one    │
│   of two variants below)    │
└─────────────────────────────┘
```

**Mailing-list block — two variants:**
- **No email at signup** → "Join our mailing list for future rewards & events" + email input + Subscribe button.
- **Email already on file** → "You're on the list as `m***@gmail.com` — we'll email you about future rewards & events." (reminder, no input).

After subscribing/feedback, the variant collapses into a small confirmation row to keep the card single-screen.

## Layout Rules
- Card uses `h-[100dvh]` with `overflow-hidden`; inner content uses tight vertical spacing (`space-y-3`) and small font sizes on mobile, scaling up at `sm:`.
- Reward emoji slightly smaller; remove the "Location" block and "Future rewards" body block (replaced by mailing-list section, which serves the same purpose).
- Star rating + textarea collapsed: rating-only by default; textarea reveals after a star click (toggle), keeping initial card height short.
- Share button kept but moved into the social row as a smaller icon button.

## Technical Changes

### 1. `src/routes/redeemed.$code.tsx`
- Loader additionally returns `hasEmail: boolean` and a masked email string (computed server-side; never expose full email to other viewers — the `code` URL is essentially a bearer token so this is acceptable for the recipient).
- New compact layout (`h-[100dvh] flex flex-col` + centered card, no scroll).
- Add `<SocialLinks />` row (Instagram + Facebook icons from lucide, links open in new tab; URLs read from `siteCopy.social`).
- Add `<MailingListBlock />` with two variants based on `hasEmail`.
- Keep existing `<FeedbackBlock />` but make it more compact (rating only by default; comment textarea collapsible).

### 2. `src/server/receipt.functions.ts`
- Update `fetchReceipt` to also return `email` (so loader can derive `hasEmail` + masked display). Already a single-recipient bearer URL.

### 3. New server function: `src/server/mailing.functions.ts`
- `subscribeMailingList({ code, email })` — validates code exists, updates `signups.email` if currently null (via `supabaseAdmin`), inserts a row in a new `mailing_subscriptions` table for analytics.

### 4. Database migration
- New table `mailing_subscriptions`:
  - `id uuid pk`, `signup_id uuid not null`, `email text not null`, `source text` (e.g. `thank_you_page`), `created_at timestamptz default now()`
  - RLS: anon/auth can INSERT (with length checks); admins can SELECT.
  - Unique on `signup_id` to prevent duplicates.

### 5. `src/lib/site-copy.ts`
- Add `social: { instagramUrl, facebookUrl, instagramHandle, facebookHandle }`.
- Add `mailingList: { headingNoEmail, bodyNoEmail, placeholder, submit, headingHasEmail, bodyHasEmail, success }`.
- Update `thankYou` copy to be terser to fit single screen.

### 6. `src/routes/admin.copy.tsx` (if it lists editable keys)
- Surface the new `social.*` and `mailingList.*` keys so admins can edit URLs/copy without code changes.

### 7. `src/routes/admin.index.tsx` (analytics)
- Add a small "Mailing list signups" metric card sourced from `mailing_subscriptions` count (and breakdown of how many came from thank-you page vs already-had-email).

## Out of Scope
- Sending actual marketing emails (just capturing consent + email).
- Double opt-in flow (can be added later if needed).

## Open Question
Do you have the actual Instagram & Facebook URLs to wire up now, or should I use placeholder URLs (`https://instagram.com/sanssucre.ph`, `https://facebook.com/sanssucre.ph`) that you can edit later from `/admin/copy`?