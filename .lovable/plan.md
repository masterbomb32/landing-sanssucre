## Sprint C — Batch 2 polish

Two small UX fixes from QA. Frontend-only, no schema or server changes.

---

### 1. FAQ — admin items don't appear on `/faq`

**Root cause:** When admins click **New FAQ** in `src/routes/admin.faqs.tsx`, the new row is created with `published: false` (line 79). The public `/faq` page filters on `published=true`, so nothing shows until the admin manually toggles the **Live** switch and saves again. This was easy to miss — the toggle is small and the default contradicts the table default (`published=true`).

**Fix (in `src/routes/admin.faqs.tsx`):**
- Change `onCreate` to insert with `published: true` so new entries are immediately visible.
- Make the Live/Draft state more prominent: replace the small switch with a labeled badge-style toggle (e.g. green "Published" / amber "Draft" pill next to the Save button), so admins clearly see whether an entry is visible to the public.
- After **Save**, refresh and keep the editor open (already does); also surface a subtle "Visible at /faq" hint when published.

No data migration needed — existing draft FAQs stay drafts; the admin can flip them on.

---

### 2. Testimonials — unclear what the photo should be

**Root cause:** The "Photo (optional, max 5MB)" field on `/share-your-story` doesn't tell the user *what* to upload — selfie, group photo, or a shot of their treat? Submissions will be inconsistent and harder to moderate.

**Fix (in `src/routes/share-your-story.tsx`):**
- Rename the field to **"Add a photo of yourself or your Sans Sucre treat"**.
- Add a one-line helper under the field: *"A clear photo of you, or of the item you ordered. Square or portrait works best."*
- Add a small thumbnail preview after a file is selected so the user can confirm the right photo was picked.
- Keep the 5MB cap and the "optional" label.

No change to the storage bucket, RLS, or the `testimonials` table.

---

### Files touched

- `src/routes/admin.faqs.tsx` — default `published: true` on create + clearer Live/Draft indicator
- `src/routes/share-your-story.tsx` — clearer photo label, helper text, thumbnail preview

### Out of scope (already queued for Batch 3)

Push notifications, Email confirmation, SMS via Twilio, Google Maps, QA pass + v1.3 publish.
