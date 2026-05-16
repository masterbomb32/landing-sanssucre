# Finish all pending work

Grouped into 6 phases so each ships independently. Order is "highest user value, lowest risk first."

## Phase 1 — Admin table ergonomics
- **Bulk void/restore**: row checkboxes + sticky action bar on `/admin` (Void selected with shared reason, Restore selected). Reuses existing `voidSignup`/`unvoidSignup` server fns in a loop with per-row outcome toast.
- **Hide voided toggle**: persisted in `localStorage`, default ON. Voided rows stay queryable when toggled off.
- **Redemption audit viewer**: new `/admin/audit` route — paginated table of `redemption_audit` (action, code, signup name, timestamp). Read-only.

## Phase 2 — Expanded CSV exports
- Add filters to signup export: date range (created_at) + status (all / active / redeemed / voided).
- New exports on `/admin`:
  - Testimonials CSV (name, rating, quote, source, published, created_at).
  - Mailing list CSV (email, source, signup name, subscribed_at).
  - Redemption audit CSV (matches viewer).
- All client-side blob downloads, filename includes date + filter suffix.

## Phase 3 — Mailing list admin
- New `/admin/mailing` route: list subscriptions, search by email, CSV export (shared with Phase 2), one-click unsubscribe (soft delete via new `unsubscribed_at` column).
- Migration: add `unsubscribed_at timestamptz` to `mailing_subscriptions`, admin-only update policy.

## Phase 4 — Staff station improvements
- "Today's redemptions" panel on `/redeem`: shows last N redeems from current session + server-fetched today list (name, reward, time, undo if within 30s window).
- Uses existing `redemption_audit` for the server fetch, filtered to `action='redeem'` and `created_at >= today`.

## Phase 5 — Shared form + mobile QA pass
- Extract `<TestimonialForm>` from `/share-your-story` and `/redeemed/$code` into `src/components/testimonial-form.tsx`. Props: `mode: "public" | "redeem"`, `code?`, `prefillName?`. Eliminates parallel code.
- Mobile QA at 393px for: `/admin` (tables), `/redeem` (scanner + PIN), `/admin/testimonials`, `/admin/mailing`, `/admin/audit`. Fix any clipping/tap-target issues found.

## Phase 6 — Content moderation polish
- FAQ + site copy: add draft/preview state.
  - Migration: add `draft_question`, `draft_answer` to `faqs`; add draft mirror keys to `site_settings`.
  - Admin UI: edits save to draft fields; "Preview" toggle on public pages (admin-only via `has_role`); "Publish" button promotes draft → live.

## Out of scope (explicitly deferred)
- Email/SMS notification on void (no provider wired yet — would need separate Twilio/Resend secret + template work; ask before adding).
- Automated test suite (separate initiative — needs framework decision).

## Technical notes
- All new server fns follow `requireSupabaseAuth` + `has_role(_user_id, 'admin')` check, matching `updateSignup`/`voidSignup` pattern.
- All new tables/columns get RLS: admin select/update, no public access.
- New routes use `_authenticated` layout for the gate.
- Migration files: one per phase that needs schema changes (Phase 3, Phase 6).
- No new dependencies needed.

## Suggested execution order
Phase 1 → 2 → 3 → 4 → 5 → 6. Each phase is independently shippable; stop between phases if priorities shift.
