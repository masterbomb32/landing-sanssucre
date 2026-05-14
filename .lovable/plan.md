
## Goal

Today there are two parallel "voice of the customer" systems:

- **feedback** — 1–5 star rating + optional comment, captured on the redeemed receipt page, tied to a signup, private, shown only in admin.
- **testimonials** — name + quote + optional source/photo, captured on the standalone "Share your story" page, moderated, shown publicly on the home page.

They're two tables, two forms, two admin screens, two stats panels. We'll consolidate them into **one dataset** (`testimonials`) with one capture flow and one admin moderation surface.

## Unified model

Extend the existing `testimonials` table (keep its name — it's what the public sees) so a row can represent either a private feedback rating, a public testimonial, or both:

```text
testimonials
  id, name, quote, source, photo_url, sort_order,
  created_at, updated_at,
  + rating          smallint  null   (1..5, was on feedback)
  + signup_id       uuid      null   (links a feedback/testimonial to a signup; unique when not null)
  + comment_only    boolean   default false   (true = private feedback comment, never publish)
  published         boolean   default false
```

Rules:
- `rating` may exist without `quote` (pure star rating from the redeem flow).
- `quote` may exist without `rating` (pure testimonial from "Share your story").
- A row tied to a `signup_id` can be promoted to public by an admin (publish + ensure name/quote present).
- `comment_only = true` rows are never shown publicly even if `published` is flipped (safety rail for ratings the guest didn't intend to share).

## Capture flow changes

**Redeemed receipt page (`/redeemed/$code`)** — replace the current FeedbackBlock with a single combined step:

1. Stars (1–5) — same as today.
2. After a rating is picked, reveal:
   - "Tell us more" textarea (was the existing comment field).
   - **New** opt-in: *"Share this publicly as a testimonial"* checkbox. When checked, show name (prefilled from signup) + optional photo upload (reuses existing `testimonial-photos` bucket).
3. Submit writes ONE row to `testimonials`:
   - Always: `rating`, `signup_id`, `comment` → stored as `quote` (or new `comment` column — see Technical), `name` from signup.
   - If opt-in unchecked: `published=false`, `comment_only=true`. Row is private feedback — admin sees it under "Pending / Feedback only".
   - If opt-in checked: `published=false`, `comment_only=false`, optional `photo_url`. Goes into the standard moderation queue.

**"Share your story" page (`/share-your-story`)** — unchanged form, still inserts a testimonial with `signup_id=null`, `rating=null`, `comment_only=false`.

## Admin changes

Collapse into a **single screen** at `/admin/testimonials` (rename label to "Voices" or keep "Testimonials"):

- Filters: `Pending public` · `Published` · `Feedback only` · `All`.
- Each row shows: stars (if any), quote/comment, name, source OR signup link, photo, submitted date.
- Actions: Publish / Unpublish, Delete, edit sort order, **Promote to public** (for `comment_only` rows that the admin wants to feature — flips `comment_only=false`, requires name/quote).
- Remove the standalone "Recent comments" block from `/admin` dashboard; replace its data source with `testimonials` filtered by `rating IS NOT NULL`.
- Stats panel on `/admin` (avg rating, distribution, response rate) reads from `testimonials WHERE rating IS NOT NULL` instead of `feedback`.

## Public homepage

`TestimonialsSection` query unchanged in shape — still `published=true`. New filter: also require `comment_only=false` (defensive). No visual change to the cards.

## Data migration

One-shot migration moves existing `feedback` rows into `testimonials`:

- For each `feedback` row: insert into `testimonials` with `signup_id`, `rating`, `comment` → into the new `comment` column (and mirror into `quote` for back-compat if we keep `quote` NOT NULL — see Technical), `name` from joined signups, `published=false`, `comment_only=true`.
- Then drop the `feedback` table and its RLS policies.

## Technical notes

Schema migration:
- `ALTER TABLE testimonials ADD COLUMN rating smallint CHECK (rating BETWEEN 1 AND 5)`, `signup_id uuid`, `comment_only boolean NOT NULL DEFAULT false`.
- `CREATE UNIQUE INDEX testimonials_signup_id_key ON testimonials(signup_id) WHERE signup_id IS NOT NULL` (preserves the one-feedback-per-signup invariant).
- Relax `quote` to nullable (rating-only rows have no quote), OR keep NOT NULL and store the comment text (or empty placeholder) there. Recommended: make `quote` nullable and add a CHECK that `rating IS NOT NULL OR quote IS NOT NULL`.
- Update RLS:
  - Public SELECT: `published = true AND comment_only = false`.
  - Public INSERT: keep current (anonymous can submit unpublished); add allowance for anonymous insert when `signup_id` is set + matches a redeemed signup (enforced via a SECURITY DEFINER RPC instead, to avoid leaking signup ids — see below).
- Add RPC `submit_testimonial_for_code(p_code, p_rating, p_comment, p_quote, p_name, p_photo_url, p_share_publicly)` — server function (not edge) calls it with `supabaseAdmin`. Replaces `submitFeedback`.

Server functions:
- Rewrite `src/server/redeem.functions.ts::submitFeedback` → `submitTestimonialFromRedeem` writing into `testimonials`.
- Rewrite `fetchFeedbackStatus` to check `testimonials` by `signup_id`.
- Keep `moderateTestimonial` / `deleteTestimonial`; add `promoteToPublic` (sets `comment_only=false`).

Frontend:
- Update `RedeemedPage` FeedbackBlock to the new combined component (stars → comment + opt-in → optional name/photo → submit).
- Update `/admin/index.tsx` Feedback panel + "Recent comments" to read from `testimonials`.
- Delete `/admin` references to the `feedback` table; remove `FeedbackRow` interface.
- `share-your-story` page — no change beyond the new column defaults.

Out of scope:
- No change to signups, redemption, mailing list, or share events.
- No new fonts, colors, or layout changes to the public testimonial cards.
- Existing `testimonial-photos` storage bucket reused as-is.

## Rollout order

1. Migration: add columns, indexes, CHECK; backfill from `feedback`; drop `feedback`.
2. Server functions: new submit + status; update admin functions.
3. Redeemed page UI rewrite.
4. Admin moderation screen + dashboard stats rewrite.
5. Verify homepage testimonials still render and a fresh redeem-flow submission appears in the admin queue.
