## Sprint B — Phase 1 staff ops (May 18–24)

Goal: make opening-day operations resilient (basement WiFi) and give you the admin tooling to fix data on the fly. Three deliverables, ordered by launch risk.

---

### 1. Offline `/redeem` (highest launch risk first)

The shop's WiFi can drop. Staff must still be able to scan and hand over rewards, with redemptions reconciled when the connection comes back.

- **Service worker** (`public/sw.js` + Vite registration in `src/start.ts` client entry):
  - Precache the `/redeem` route shell, JS/CSS chunks, logo, beep sound.
  - Network-first for `/redeem`, cache-first for static assets.
  - Skip caching for Supabase API calls — those go through the queue below.
- **Local redemption cache** (IndexedDB via a small `idb-keyval` helper, no new heavy deps):
  - On unlock, prefetch a slim list of valid unredeemed codes (id, code, name, reward_choice, created_at) into IDB. Refresh every 60s while online.
  - Scanner first checks IDB. If the code matches an unredeemed local row → show success card immediately, mark it locally redeemed, enqueue an "intent" `{code, redeemed_at, staff_session, client_id}` into an outbox.
  - If not found locally and offline → show an "Offline — accepted, will sync" badge but still hand over (configurable safety: only allow if code passes a checksum / matches the prefetched set; otherwise show "Cannot verify offline").
- **Outbox sync**:
  - Background sync via `navigator.onLine` + `online` event + 10s polling fallback.
  - New server fn `redeemBatch({ items })` that loops `redeem_signup` per item, returning per-item `{ ok | already | invalid }`. Reuses existing RPC, so no SQL change.
  - On conflict (already redeemed by someone else): toast "Code already used at HH:mm by another staff" — staff will already have handed over the reward; this is acknowledged as the trade-off of offline mode.
- **UI affordances**:
  - Header pill flips green ("Online · synced") / amber ("Offline · 3 queued") / red ("Sync error").
  - Manual "Sync now" button.
  - Lock screen warns if the local code cache is older than 10 minutes.

### 2. Admin: manual edit signup

Today the only way to fix a typo or wrong reward choice is the database. Add an inline edit row in `/admin` (the existing signups table).

- New server fn `updateSignup({ id, name?, mobile?, email?, reward_choice? })` with admin-role middleware (re-use the `has_role` check pattern; add `requireAdmin` middleware that builds on `requireSupabaseAuth`).
- Validation: same Zod rules as `createSignup` (PH mobile, valid reward id).
- Signups row gets an "Edit" pencil → opens a dialog with the four fields, "Save" calls the fn, optimistically updates the table, audit log row inserted.
- New `signup_edits` audit table: `id, signup_id, edited_by, before jsonb, after jsonb, created_at`. Migration adds the table + RLS (admin select only).
- Soft "delete" is out of scope; staff will continue to ignore mis-scans.

### 3. Dashboard: date filter + country breakdown

`/admin` currently shows lifetime totals. Add:

- **Date range filter** (Today / 7d / 30d / All / custom range picker — uses the existing `Calendar` component). Filter applies to: signups count, redemptions count, conversion %, top rewards.
- **Country breakdown card**: derive from `page_visits.country` (already populated by `logVisit` via Cloudflare headers — confirm during build; if not, add `request.cf.country` capture in `logVisit`). Top 8 countries + "Other", as a compact horizontal bar list.
- All aggregations move to a single `getDashboardStats({ from, to })` server fn so the UI does one round-trip per filter change.

---

### Order of work

1. **Day 1–2:** Offline `/redeem` (service worker + IDB cache + outbox + UI). Test by toggling Network panel offline mid-scan.
2. **Day 3:** Admin manual edit signup + audit table.
3. **Day 4:** Dashboard date filter + country breakdown.
4. **Day 5:** Buffer + manual QA on a real phone in airplane mode + Publish.

### Out of scope (defer to Sprint C or later)

- Push notifications, conflict-resolution UI beyond a toast, multi-device sync of staff sessions, exporting signups to CSV from the dashboard.

### Files touched (high level)

- New: `public/sw.js`, `src/lib/redeem-cache.ts`, `src/lib/redeem-outbox.ts`, `src/server/admin.functions.ts`, `src/server/dashboard.functions.ts`, supabase migration for `signup_edits`.
- Edited: `src/routes/redeem.tsx`, `src/routes/admin.index.tsx`, `src/start.ts` (SW registration), `src/server/redeem.functions.ts` (batch endpoint).

### Definition of done

- Airplane-mode scan on a phone shows green success card and queues; reconnecting drains the queue with a visible counter going to zero.
- Admin can change a name/mobile/reward on a signup and a row appears in `signup_edits`.
- Dashboard "Last 7 days" filter changes all four KPIs and the country card lists at least PH plus any visitors from elsewhere.
