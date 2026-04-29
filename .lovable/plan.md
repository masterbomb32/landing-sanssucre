
# Staff Redemption Page — Plan

A focused, camera-first page for staff to redeem rewards in seconds, plus a customer-facing "redeemed" page with feedback and share, and automatic thank-you SMS + email.

---

## 1. New Routes

### `/redeem` — Staff scan station (PIN-locked)
- **Lock screen**: 4–6 digit numeric PIN keypad (large buttons, mobile-first). PIN stored as `staff_redeem_pin` in `site_settings` (settable from `/admin/copy` or new `/admin/settings`). Unlock persists in `sessionStorage` until tab closes.
- **Scanner**: Camera opens immediately on unlock using `@zxing/browser` (reads **both QR codes and Code-128 barcodes** in one scanner — same library covers both formats on the receipt).
- **Manual fallback**: Text input below the camera to type the 12-char code (for damaged prints / camera issues).
- **On scan**: 
  - Calls `redeem_signup(p_code)` RPC.
  - On success → big green confirmation card: customer name, reward (emoji + title), time issued. Auto-clears after 4s and re-arms scanner.
  - On `ALREADY_REDEEMED` → red card with original redemption time. Manual "Continue" to re-arm.
  - On `INVALID_CODE` → amber card "Code not found." Re-arms after 2s.
- **Header**: lock icon (re-lock), small running counter "Redeemed today: N", staff name optional.
- **Mobile-first** (staff will use phones/tablets at the counter).

### `/redeemed/$code` — Customer-facing thank-you page
- Shown by linking from `/redeem` or auto-opens on staff device to show the customer; also reachable directly (the receipt page redirects here once `redeemed_at` is set, so the customer's existing receipt link becomes the thank-you page after redemption).
- Branded to match landing page elegance (same fonts, colors, logo).
- Contents:
  - "Enjoy your [reward]!" header with emoji
  - Customer first name, redeemed timestamp
  - **Share button** (reuses existing `ShareButton`) with new copy: "I just claimed my Sans Sucre opening day treat 🧁"
  - **Feedback** — inline 1–5 star rating + optional one-line comment, submits to new `feedback` table
  - "What's next" copy block (future rewards / events teaser) — editable from `/admin/copy`
  - Footer with location

### `/admin/redemptions` (small addition to admin nav)
- Live list of today's redemptions (already covered partially in dashboard, but a focused view helps on opening day).
- *(Optional — can drop if you want to keep scope tight.)*

---

## 2. Database Changes

```sql
-- 1. Feedback table
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null references public.signups(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (signup_id)  -- one feedback per redemption
);
alter table public.feedback enable row level security;
create policy "Anyone can submit feedback once" on public.feedback
  for insert to anon, authenticated with check (
    char_length(coalesce(comment,'')) <= 500
  );
create policy "Admins view feedback" on public.feedback
  for select to authenticated using (has_role(auth.uid(),'admin'));

-- 2. Seed PIN + future-rewards copy in site_settings (via admin UI; no migration needed beyond table that exists).
```

Mobile-uniqueness is **already enforced** (existing unique constraint on `signups.mobile`) — that satisfies your requirement #10.
The `redeem_signup` RPC already enforces "claim once" with `FOR UPDATE` locking — satisfies #9.

---

## 3. Notifications (Thank-you SMS + Email)

After `redeem_signup` succeeds, the staff page calls a new server function `sendThankYou({ signupId })` which:
- **SMS** via **Twilio connector** (gateway): "Thanks for visiting Sans Sucre, [Name]! We'd love your feedback: [link to /redeemed/CODE]"
- **Email** (only if email present) via **Lovable Emails** transactional template `redemption-thank-you`: branded HTML matching the receipt aesthetic, with feedback link + share CTA.
- Both logged to `notification_log` (already exists) with `channel='sms'|'email'` and status.
- Idempotent: skip if a row with `signup_id + channel='sms'/'email' + status='sent'` already exists.

**Prerequisites I'll need from you** (will prompt at build time):
1. **Twilio connector** — connect via the connection picker (1 click). Then I need your Twilio **From** number (PH-enabled, e.g. Alphanumeric Sender ID "SansSucre" or a +63 number).
2. **Email domain** — I'll trigger the domain setup dialog so emails come from `notify.sanssucre.ph` (one-time DNS setup at your registrar; sending works the moment DNS verifies).

---

## 4. Technical Details

**Packages to add**: `@zxing/browser` (~80kb, supports QR + Code-128 in one decoder loop).

**Scanner UX**:
- `getUserMedia({ video: { facingMode: 'environment' } })` — back camera on phones.
- One decode loop reads both QR and 1D barcodes simultaneously.
- Visual: live video with corner brackets overlay, soft "beep" on successful read (Web Audio API, no asset).
- Permission denied → friendly message + manual entry stays available.

**Files to create**:
- `src/routes/redeem.tsx` (PIN lock + scanner)
- `src/routes/redeemed.$code.tsx` (customer thank-you + feedback)
- `src/components/scanner.tsx` (camera + decode logic)
- `src/components/pin-pad.tsx` (numeric keypad)
- `src/server/redeem.functions.ts` (`sendThankYou`, `submitFeedback`)
- `src/lib/email-templates/redemption-thank-you.tsx`
- One migration for `feedback` table

**Files to edit**:
- `src/routes/admin.tsx` — add "Scan station" link → `/redeem`
- `src/routes/admin.copy.tsx` — fields for staff PIN + future-rewards copy
- `src/lib/site-copy.ts` — add `futureRewards` and `thankYou` blocks
- `src/routes/receipt.$code.tsx` — when `redeemed_at` is set, show a banner linking to `/redeemed/$code`

---

## 5. What You're Missing — Things I'd Add Before Opening Day

These aren't in your list but you'll regret skipping them:

1. **Offline / poor-signal fallback** — Metro Alabang basement has spotty cell signal. Cache the day's signups in `localStorage` so staff can validate codes locally and queue redemptions to sync when back online. *(Recommend.)*
2. **Sound + haptic feedback on scan** — staff won't be looking at the screen between customers. A "ding" on success, "buzz" on duplicate. *(Easy win.)*
3. **Audit log of who redeemed what, when** — currently `redeem_signup` doesn't log staff identity. If you have multiple cashiers, add an optional `redeemed_by_pin_label` so you know which station processed it. *(Recommend if >1 staff.)*
4. **Daily cap / rate-limit on the scanner** — protects against a stuck loop accidentally redeeming hundreds. *(Low effort.)*
5. **Pre-opening "test mode" toggle** — lets you scan without actually marking redeemed, so you can drill staff. *(Recommend.)*
6. **"Wrong customer" undo** — staff mis-scans the wrong receipt. Add a 30-second "Undo last redemption" button on `/redeem`. *(Strongly recommend — human error happens.)*
7. **Print queue / reprint receipt** — customer forgot her phone. Staff types mobile → finds signup → reprints code. Add a "Look up by mobile" tab next to the scanner.
8. **Feedback aggregation in `/admin`** — small bar chart of star ratings + recent comments. *(Quick win once feedback exists.)*
9. **Brightness boost prompt** — on iOS, remind customer to max screen brightness so the camera can read the QR/barcode (especially in supermarket fluorescent light).
10. **Privacy + Data Privacy Act consent on feedback** — you're collecting comments tied to identity. One-line consent under the textarea.
11. **Single Twilio safety controls** — enable **SMS Pumping Protection** + restrict **SMS Geo Permissions to Philippines only** in your Twilio console before going live. Otherwise an attacker spamming your form burns your Twilio balance overnight.
12. **Soft-launch dry run** — invite 10 friends to do the full signup→redeem flow at the actual store on a test day. You will find at least 3 things you didn't think of.

---

## Build Order (after you approve)

1. DB: feedback table + migration
2. Scanner component + `/redeem` route + PIN lock
3. `/redeemed/$code` customer page + feedback submission
4. Twilio connector hookup + thank-you SMS
5. Email domain setup + thank-you email template
6. Admin: PIN + future-rewards copy editors, "Scan station" nav link
7. Receipt page → thank-you page redirect after redemption

I'll build straight through and stop only at the Twilio connector picker and the email-domain setup dialog (both need one click from you).

**Approve to proceed, or tell me which "missing" items to include / drop.**
