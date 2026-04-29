## Problem

Right now, when staff scans the QR and marks the reward redeemed, the customer is still looking at their QR page (`/receipt/$code`). Nothing on their phone changes — they'd have to manually refresh to see the small "Leave feedback →" link, then tap it to reach the thank-you page (`/redeemed/$code`) with feedback, share buttons, social links, and the mailing-list block.

That's not discoverable. Customers will close the tab thinking they're done.

## Solution: live "redeemed" detection on the customer's QR page

Make `/receipt/$code` watch for the redemption in real time. The instant staff scans, the customer's phone automatically transitions into the thank-you experience — no refresh, no extra tap.

### How it works

1. **Realtime channel** — when the QR page loads and the reward is *not* yet redeemed, subscribe to a Supabase Realtime channel filtered to `signups` UPDATE events for this row's `id`. The moment `redeemed_at` flips from null → timestamp, we navigate the customer to `/redeemed/$code`.
2. **Polling fallback** — Realtime occasionally drops on flaky in-store WiFi. Add a lightweight 5-second poll using the existing `fetchReceipt` server function as a backup. Stops as soon as redemption is detected (or after 30 minutes idle to save battery).
3. **Smooth transition** — instead of a hard redirect, briefly show a celebratory "✅ Redeemed! Loading your thank-you…" overlay for ~800ms, then `router.navigate({ to: "/redeemed/$code" })`. Feels intentional, not jarring.
4. **If the page loads and is already redeemed** — skip the QR view entirely and go straight to `/redeemed/$code`. (Today it shows the QR with a tiny banner; that's the wrong default for someone returning after redemption.)

### Required DB change

Enable realtime on the `signups` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.signups;
ALTER TABLE public.signups REPLICA IDENTITY FULL;
```

The existing RLS policy on `signups` (anon SELECT is not allowed — only admins can read) means realtime payloads filtered for anon users won't expose other rows. But for the customer's own QR page we don't actually need the payload contents — we only need the *event* — so we can subscribe and then re-fetch via `fetchReceipt` (which is server-side and bypasses RLS for the specific code lookup) to get the fresh `redeemed_at`.

### Files to edit

- `src/routes/receipt.$code.tsx` — add realtime subscription + 5s polling + auto-redirect on redemption; if loader already returns a redeemed row, redirect immediately.
- `supabase/migrations/<new>.sql` — enable realtime publication for `signups`.

### Files NOT changed

- `/redeemed/$code` already has feedback, social links, share, and mailing list — it's the correct destination.
- Staff redeem flow stays as-is (the existing "Show customer thank-you" button there is now redundant for in-person flow but still useful for edge cases like a customer who closed the tab — leave it).

### UX detail

A small "Waiting for staff to scan…" pulse indicator under the QR code makes it clear the page is live. When detected, the indicator becomes a green check with "Redeemed! Taking you to your thank-you page…" for ~800ms before navigation.

### Edge cases handled

- Customer reloads after redemption → loader sees `redeemed_at`, redirects immediately to `/redeemed/$code`.
- Realtime fails to connect → 5s polling still catches it within ~5s.
- Customer leaves tab open for hours → polling stops after 30 min to spare battery; reload re-arms it.
- Network blip during redemption → next poll catches it.
