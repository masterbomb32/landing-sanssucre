# Tighten /faq preview access

## Problem

Today's preview gating is client-side only. The deeper issue: RLS on `faqs` is row-level, and rows with `published = true` are readable by anon. The columns `draft_question`, `draft_answer`, `has_draft` live on those same rows — so anyone can run:

```
supabase.from('faqs').select('draft_question,draft_answer').eq('published', true)
```

and read in-progress drafts directly, regardless of `?preview=1`. The admin gate in `faq.tsx` is cosmetic.

## Fix

Move draft reads off the public PostgREST surface entirely and gate them through an admin-only server function.

### 1. Database migration — column-level lockdown

Revoke `SELECT` on the three draft columns from `anon` and `authenticated`. RLS still governs row visibility for `question`/`answer`/`published`/`sort_order`; drafts become invisible to PostgREST callers. `supabaseAdmin` (service role) bypasses this and keeps working for server functions.

```sql
REVOKE SELECT (draft_question, draft_answer, has_draft)
  ON public.faqs FROM anon, authenticated;
```

No data migration, no RLS policy change.

### 2. New server function — `getFaqsForPreview`

In `src/server/faqs.functions.ts`:
- `requireSupabaseAuth` + `assertAdmin`.
- Uses `supabaseAdmin` to select all FAQs (incl. unpublished) with draft columns, ordered by `sort_order`.
- Returns merged shape: `{ id, question, answer, has_draft, published }` where question/answer fall back to live when draft is empty. Non-admin callers get `NOT_ADMIN` thrown.

Also add `getFaqsForAdmin` (same auth, returns the raw rows incl. draft columns) so the admin editor still has draft fields to render — it can no longer rely on the anon client.

### 3. `src/routes/faq.tsx` — remove client-side admin gate

- Always fetch the public list via `supabase.from('faqs').select('id,question,answer').eq('published', true)`. No draft columns requested.
- If `?preview=1`: call `useServerFn(getFaqsForPreview)` inside the effect. On success → render those rows + show the amber "Preview mode" banner. On failure (unauthenticated or non-admin) → silently fall back to the published list, no banner. This guarantees: even if a non-admin guesses the URL, the server rejects and they see the live page.
- Drop the `has_role` RPC call from the client.

### 4. `src/routes/admin.faqs.tsx` — read via server function

- Replace the direct `supabase.from('faqs').select(...)` load with `useServerFn(getFaqsForAdmin)`. Same shape, draft columns included. Editing/saving/publishing already go through server functions, so no other changes needed.

### 5. Verify

- Run `supabase--read_query` as anon-like: confirm selecting `draft_question` from `faqs` errors with permission denied. (Admin client still works.)
- Hit `/faq?preview=1` when logged out → published-only content, no banner.
- Hit `/faq?preview=1` as admin → drafts visible, banner shown.
- Admin FAQ editor still loads rows with draft fields.

## Files

- New migration: revoke draft column grants.
- Edit `src/server/faqs.functions.ts`: add `getFaqsForPreview`, `getFaqsForAdmin`.
- Edit `src/routes/faq.tsx`: server-fn-gated preview, remove client RPC.
- Edit `src/routes/admin.faqs.tsx`: load via server function.

## Out of scope

Splitting drafts into a separate table, scheduled publish, diff highlighting, applying the same pattern to `site_settings`.
