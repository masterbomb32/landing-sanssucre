## Phase 6 — FAQ draft + preview

Schema already has `draft_question`, `draft_answer`, `has_draft` on `faqs`. Wire them into server fns, admin UI, and public page.

### Server (`src/server/faqs.functions.ts`)

- Extend `UpsertSchema` with optional `draft_question`, `draft_answer` (same length rules as live; `draft_answer` allows empty/null when clearing). Live `question`/`answer` remain required so existing rows always have a public version.
- `upsertFaq`: when draft fields are provided and differ from live, set `has_draft = true`; when explicitly cleared (null), set both draft cols to null and `has_draft = false`.
- New `publishFaqDraft({ id })`: copy `draft_question`/`draft_answer` → `question`/`answer`, null the drafts, set `has_draft = false`, bump `updated_at`. Admin-only.
- New `discardFaqDraft({ id })`: null both drafts, `has_draft = false`. Admin-only.
- All new fns follow existing `requireSupabaseAuth` + `assertAdmin` pattern, use `supabaseAdmin`.

### Admin UI (`src/routes/admin.faqs.tsx`)

Per-row editor changes:
- Add `draft_question`, `draft_answer`, `has_draft` to the `Faq` interface and the initial select.
- Replace single Question/Answer fields with a two-column "Live | Draft" view on `sm:` (stacked on mobile). Live side is read-only (shows what `/faq` currently serves). Draft side is editable.
- Editing the draft fields and clicking **Save draft** calls `upsertFaq` with the draft cols populated.
- Show a "Draft pending" amber chip when `has_draft` is true.
- Action buttons when `has_draft`: **Publish draft** (calls `publishFaqDraft`, then reloads), **Discard draft** (calls `discardFaqDraft` with confirm).
- Keep existing Published/Draft visibility toggle, sort order, Delete.
- "New FAQ" creates a row with live `question`/`answer` seeded as today (so the public page never breaks), `has_draft = false`.

### Public preview (`src/routes/faq.tsx`)

- Read `?preview=1` from search; if present AND viewer is admin (`has_role` check via `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })` after `getSession()`), fetch all FAQs incl. drafts and render `draft_question`/`draft_answer` when `has_draft`, otherwise the live values. Non-admins silently fall back to the published view.
- Add a small fixed "Preview mode — showing drafts" banner at top when preview is active.
- Admin FAQ editor gets a "Preview on /faq" link → `/faq?preview=1` (opens in new tab).

### Out of scope (deferred)

- `site_settings` draft mirroring — separate change; this PR is FAQ-only as requested.
- Diff highlighting between live and draft.
- Scheduled publish.

### Files touched

- edit `src/server/faqs.functions.ts` (extend upsert + 2 new fns)
- edit `src/routes/admin.faqs.tsx` (dual-column editor, draft actions, preview link)
- edit `src/routes/faq.tsx` (admin-gated preview mode + banner)

No new dependencies, no migrations (schema already in place).
