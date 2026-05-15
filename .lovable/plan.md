# Unify customer feedback & "Share your story"

## What exists today

Two parallel submission paths writing to the same `testimonials` table:

### A. Redeem-flow feedback — `/redeemed/$code` → `FeedbackBlock`
- Server fn `submitFeedback` → RPC `submit_testimonial_for_code`
- Verified by redemption code → links `signup_id`, name auto-filled from signup
- UX: 5 stars → comment textarea → tiny "Share my story publicly" checkbox → optional photo
- Fields written: `rating`, `comment` → `quote`, `signup_id`, `name`, `photo_url`, `comment_only` (true unless box ticked)
- Confirmation: one-line inline "Thanks!"
- No location/"source" field
- No link to `/share-your-story`

### B. Public story form — `/share-your-story`
- Direct browser `supabase.from("testimonials").insert(...)` under the anon INSERT RLS policy
- Anonymous: no `signup_id`, no `rating`, `comment_only=false`
- Fields collected: name, quote, source (location), photo
- Confirmation: full success card mentioning moderation
- Entry points: testimonials section CTA + footer link — never offered to verified customers

## The disconnect (user-visible)

1. **Two different forms for the same outcome.** A customer who taps the public "Share your story" CTA gets a richer form (location, big photo upload, clear consent copy). A customer who just redeemed gets a cramped inline checkbox they're likely to miss.
2. **Stars are lost on the public path.** Anyone arriving via `/share-your-story` cannot leave a rating, so admin's "Feedback only" filter and rating stats only ever reflect redeem-flow submissions.
3. **Location is lost on the redeem path.** Public testimonials show "Maria — Alabang"; redeem-promoted ones show only the name.
4. **Inconsistent confirmation & expectations.** Public path explicitly says "in moderation"; redeem path just says "Thanks!" — same backend behavior, different mental model.
5. **No bridge between the two.** A verified customer is never invited to write a richer story; an anonymous storyteller is never asked for a rating or proof of visit.
6. **Validation drift.** Redeem path requires ≥5 char comment only when "share publicly" is ticked. Public path requires ≥5 chars unconditionally. Photo size check (5MB) is duplicated in two places.
7. **Two write paths, two trust models.** Redeem writes via a SECURITY DEFINER RPC tied to a code; public writes via anon RLS. Easy to drift out of sync (already has slightly different field constraints).

## Proposed unified UX

### Single shared `<TestimonialForm>` component
One React component with three optional capabilities, controlled by props:
- `rating` (always shown; required on redeem path, optional/hidden on public path — pick one and stick to it)
- `name` (prefilled + read-only when `signup` is known, editable when anonymous)
- `comment / quote` (single field, single validator: ≥5 chars when sharing publicly, optional when private)
- `source` / "Where you're from" (shown on both, optional)
- `photo` (shown on both, optional, single 5MB validator + single uploader helper)
- `sharePublicly` (checkbox; on the public route it's hidden and forced-true)

Used by both `/redeemed/$code` and `/share-your-story`. Eliminates the form-quality gap.

### Two flows, one component, one server fn

```text
                    ┌──────────────────────────────┐
  /redeemed/$code → │ <TestimonialForm mode="redeem">  ──┐
                    └──────────────────────────────┘    │
                                                        ├─► submitTestimonial({ code?, ...payload })
  /share-your-story →│ <TestimonialForm mode="public"> ──┘         │
                    └──────────────────────────────┘              ▼
                                                       RPC submit_testimonial
                                                       (extends current
                                                        submit_testimonial_for_code:
                                                        code optional; when present →
                                                        signup_id + comment_only flag;
                                                        when absent → anon path with
                                                        same validation in one place)
```

Replaces the direct browser insert on `/share-your-story` with the same server fn used by redeem. One validation surface, one trust model, one place to evolve.

### Cross-flow bridges
- On the redeemed receipt, when the user clicks 4–5 stars, gently expand the form to suggest "Share your story publicly" with the same fields as the public page (location + photo). When they pick 1–3 stars, keep it private and offer a short follow-up textarea — no public option.
- On `/share-your-story`, if the visitor pastes/enters a redemption code (or arrives with `?code=…`), upgrade the submission to a verified one (links `signup_id`, prefills name).
- After a verified private rating, the inline "Thanks!" gains a secondary link: "Want to share more? → /share-your-story?code=…" so they can opt in later.

### Consistent confirmation
Both paths end on the same success state: short headline + "Our team reviews each story before publishing" + return link. Removes the expectation gap.

## Admin impact
Minimal. The unified write still produces `testimonials` rows with the existing columns (`rating`, `signup_id`, `comment_only`, `source`, `photo_url`). The current admin filters (Pending / Published / Feedback only / All) and Promote action keep working — and "Feedback only" finally includes story-form submissions that carry a rating.

## Technical section

Files to touch:
- **New** `src/components/testimonial-form.tsx` — shared form (fields, validators, photo upload helper).
- **Edit** `src/routes/redeemed.$code.tsx` — replace `FeedbackBlock` with `<TestimonialForm mode="redeem" code={code} signupName={data.name} />`.
- **Edit** `src/routes/share-your-story.tsx` — replace inline form + direct insert with `<TestimonialForm mode="public" code={searchParams.code} />`. Accept `?code=` to upgrade to verified.
- **Edit** `src/server/redeem.functions.ts` — rename/extend `submitFeedback` → `submitTestimonial`, accept optional `code`, `name`, `source`. Keep RLS-safe: when `code` present, call existing RPC; when absent, insert via anon-safe path with the same Zod validation.
- **DB (optional, additive)** extend `submit_testimonial_for_code` (or add `submit_testimonial`) so the public path no longer relies on the anon INSERT RLS policy — single trust boundary. Eventually the anon INSERT policy on `testimonials` can be tightened.
- **Edit** `src/components/testimonials-section.tsx` & `src/routes/index.tsx` footer — keep the `/share-your-story` CTAs; no schema-visible change.

Validation rules (single source of truth in the shared component + server fn):
- `name`: 1–100 chars
- `quote`: 5–1000 chars when `share_publicly`, optional otherwise
- `rating`: 1–5 integer; required on redeem mode, hidden on public mode (or optional — decide once)
- `source`: 0–100 chars
- `photo`: ≤5MB, image/*, uploaded to existing `testimonial-photos` bucket

Out of scope: visual redesign of either page, changes to admin moderation UI, changes to mailing list or share buttons.

## Open questions before building
1. On `/share-your-story` (anonymous visitors), do you want to **require a star rating**, **make it optional**, or **hide it entirely**? This is the biggest UX call.
2. Should the redeem-flow form **always** show the location + photo fields (matching the public form), or only after the user ticks "share publicly"?
3. Should we accept `?code=` on `/share-your-story` to let verified customers land directly on the richer form with their name prefilled?
