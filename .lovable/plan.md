# Sans Sucre — Development Timeline, Checklist & Feature-Freeze Policy

Assumes opening day = **Mon 15 Jun 2026** (today: Sun 10 May 2026 → ~5 weeks runway). Adjust dates if opening shifts.

---

## Timeline at a glance

```
Week of   Phase                                         Gate at end of week
-------   --------------------------------------------  -----------------------------
May 11    SPRINT A — Pre-launch security (5.3 + 5.4)    Security freeze
May 18    SPRINT B — Phase 1 staff ops (1.3 + 1.4)      Staff-flow freeze
May 25    SPRINT C — Phase 2 landing polish             Content freeze
Jun 01    SPRINT D — Phase 3 SEO/share + Phase 4 lite   Code freeze
Jun 08    SPRINT E — Hard freeze, QA, soak, dry-run     Launch-ready freeze
Jun 15    LAUNCH WEEK — monitor only, hotfix-only       Post-launch retro
Jun 22+   Phase 4 full analytics + nice-to-haves        Resume normal dev
```

Each sprint is one calendar week. If a sprint slips, the next sprint absorbs the slip — do **not** parallel-track new features into a sprint mid-week.

---

## Sprint A — Pre-launch security (May 11 – May 17) — ✅ SHIPPED

- [x] **5.4a** Staff PIN moved to admin-only `staff_settings` + `verify_staff_pin` (anon, 50ms delay) + `update_staff_pin` (admin only). PinPad rewritten to verify via RPC. Admin copy editor now has a separate "Update PIN" panel.
- [x] **5.4b** `mailing_subscriptions` public INSERT policy dropped. All writes now go through the `subscribeMailingList` server fn which validates the redemption code via the admin client.
- [x] **5.3** Security headers added in `src/start.ts` request middleware: CSP (with frame-ancestors for Lovable preview), HSTS preload, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`camera=(self)` for QR scanner).
- [x] HIBP leaked-password protection enabled in Lovable Cloud auth.
- [x] DNS / Cloudflare hardening doc → `.lovable/dns-recommendations.md` (owner action).

**Manual verification owed before merging Sprint B:**
- Staff PIN: enter PIN at `/redeem`, confirm unlock; rotate PIN at `/admin/copy`, confirm new PIN works and old one fails.
- Mailing list: subscribe from `/redeemed/$code`, confirm row appears in admin → mailing subscriptions.
- Headers: open `https://landing-sanssucre.lovable.app` in devtools → Network → response headers contain `content-security-policy`, `strict-transport-security`, `permissions-policy`.

---

## Sprint B — Phase 1 staff operations (May 18 – May 24)

- [ ] **1.3** Admin manual edit of signup (mobile/email/name) with `edited_at / edited_by / edit_reason` columns + `updateSignup` server fn + dialog in `/admin`
- [ ] **1.4** Offline fallback for `/redeem`: Service Worker shell cache + IndexedDB `offline_queue` + background sync (Metro basement WiFi is unreliable)
- [ ] Dashboard date-range filter (Today / Yesterday / 7d / 30d / 90d / Custom)
- [ ] Dashboard country breakdown (replace "coming soon")

**Exit gate:** end-to-end staff dry-run on a phone with airplane mode toggled mid-scan.

---

## Sprint C — Phase 2 landing polish (May 25 – May 31)

Conversion-focused. Needs creative assets.

- [ ] **2.3** Trust strip (Metro Alabang + ATC logos) under hero
- [ ] **2.4** Reward preview gallery (one image per reward; AI-generate placeholders, swap if real photos arrive)
- [ ] **2.5** FAQ accordion + `FAQPage` JSON-LD
- [ ] **2.6** Lazy-loaded Google Maps embed + "Get directions" deep link
- [ ] **2.7** Founder / about block (one photo + 2–3 sentences)
- [ ] **2.9** Exit-intent (desktop mouseleave) + mobile 70%-scroll nudge, suppressed if signed up

**Exit gate:** Lighthouse mobile ≥ 90 perf / 100 SEO / 100 a11y on `/`.

---

## Sprint D — Phase 3 SEO/share + Phase 4 lite (Jun 1 – Jun 7)

- [ ] **3.1** DPA consent line under feedback (RA 10173 + link to `/privacy`)
- [ ] **3.2** Branded OG image (1200×630) "Free opening day treat — Sans Sucre @ Metro Alabang" + Twitter card meta
- [ ] **3.2** Per-route `head()` for `/find`, `/privacy`, `/redeemed/$code`
- [ ] **3.3** `LocalBusiness` JSON-LD (root) + `Event` opening-day JSON-LD (home)
- [ ] **3.4** "Tag us @sanssucre.ph" prompt in share sheet
- [ ] **4.1 (lite)** Add the 7 funnel events (`landing_view, form_focus, signup_submitted, receipt_view, code_redeemed, feedback_submitted, mailing_list_joined`) — instrumentation only, chart can wait

**Exit gate:** share preview rendered in WhatsApp + Messenger + iMessage screenshots match.

---

## Sprint E — Hard freeze, QA, dry-run (Jun 8 – Jun 14)

**No new features.** Bugfix + content tweaks only.

- [ ] Full smoke test (sections A–I in `.lovable/plan.md`) on iOS Safari, Android Chrome, desktop Chrome/Safari
- [ ] Load test signup → receipt → redeem with 50 fake codes
- [ ] Staff dry-run at the actual store with the actual phone
- [ ] Monitor Cloud logs + DB for warnings; clear linter
- [ ] Backup: export `signups` snapshot before opening day
- [ ] Print fallback: laminated card with PIN + "what to do if internet dies"
- [ ] On-call rotation defined (who fixes what, where the secrets live)

**Exit gate:** zero open P0/P1 bugs. Sign-off from owner.

---

## Launch week (Jun 15 – Jun 21) — hotfix only

- [ ] Real-time monitoring of `redemption_audit` + `client_errors`
- [ ] Daily check-in: signup count, redeem count, error count, feedback themes
- [ ] **No code merges except hotfixes** (1-line, reviewed, tested in preview first)

---

## Post-launch (Jun 22+)

- [ ] **4.1 full** Funnel chart in admin dashboard
- [ ] **4.2** Client-side error tracker (`/api/public/log-error` + `client_errors` table + admin panel)
- [ ] Earlier ideas: persistent brightness tip, customer-side reward photo previews
- [ ] Retrospective + new roadmap

---

## Feature-freeze policy (recommended)

Three escalating freezes. Communicate the date for each in the team chat.

| Freeze | When | What it means |
|---|---|---|
| **Content freeze** | End of Sprint C (May 31) | No new pages, no new copy fields. Existing copy still editable via `/admin/copy`. |
| **Code freeze** | End of Sprint D (Jun 7) | No new features merged. Schema migrations only for bugfixes. UI tweaks limited to spacing/typo. |
| **Hard freeze** | End of Sprint E (Jun 14) | Hotfix-only. Every change must have: 1-line scope, preview-tested, owner sign-off, rollback plan. Schema migrations forbidden. |

### Rules during freeze

1. **One in-progress task at a time.** No parallel branches.
2. **Every change ships behind a known-good preview.** Test on the real device before promoting to production.
3. **Schema changes are the highest-risk** — none after code freeze. If absolutely required, add a column nullable, never drop/rename.
4. **Copy changes go through `/admin/copy`**, not code edits. That's why the editable-copy system exists.
5. **Any "while we're at it..." idea goes to the post-launch backlog.** No exceptions during freezes — that's how launches break.
6. **Define the rollback.** Lovable's version history = your rollback. Note the last-good version ID at the start of each launch-week day.

### Branch / version hygiene

- Tag the last-good preview at the start of each freeze (`pre-content-freeze`, `pre-code-freeze`, `pre-launch`).
- Keep a one-page runbook in `.lovable/runbook.md` (admin login, PIN reset, how to revoke a code, who to call).

---

## Out of scope (explicit non-goals before launch)

- Customer accounts / login (codes are the identity)
- Multi-store support
- Loyalty / repeat-visit mechanics
- Native app
- Paid ads instrumentation beyond UTM capture

These go to post-launch backlog so the freeze stays meaningful.
