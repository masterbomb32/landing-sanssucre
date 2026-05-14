# Pre-Publish QA Plan

Goal: surface any blockers before you hit Publish. Output will be a single QA report with severity-ranked findings (Blocker / High / Medium / Low) and suggested fixes — no code changes in this pass unless you approve.

## 1. Static & build health
- TypeScript / build check (review latest build output, no manual rerun).
- ESLint pass on `src/`.
- Search for leftover `TODO`, `FIXME`, `console.log`, `dangerouslySetInnerHTML`, `any` casts, hardcoded localhost URLs.
- Verify no edits to protected files (`client.ts`, `types.ts`, `routeTree.gen.ts`, `.env`).

## 2. Routes & links
- Enumerate every route file in `src/routes/`.
- Grep all `<Link to="...">`, `href="..."`, `navigate({ to: ... })` and confirm each target route exists.
- Check `__root.tsx` head/meta, favicons, manifest, sitemap references.
- Confirm each public page has unique `<title>` + meta description + og tags.
- Confirm `<Outlet />` present in every layout route (`__root`, `admin`, any `_authenticated`).

## 3. Security review
- Run Supabase linter.
- Run security scan (RLS coverage on all tables, policy sanity).
- Confirm no `supabaseAdmin` / `client.server` import from client code.
- Confirm server functions validate input with Zod and verify staff PIN where applicable.
- Confirm admin routes gate on `has_role('admin')` server-side, not just UI.
- Confirm no secrets/keys hardcoded in client bundle (only `VITE_SUPABASE_*` publishable values).
- Auth settings: leaked-password protection, email confirmation behavior.

## 4. Core user flows (browser automation)
Walk through each at desktop (1280) and mobile (390) viewports, capture screenshots, log console + network:
- Home → signup form → success → receipt page (QR, share card, save/print card).
- Receipt page → share buttons, print button, download.
- FAQ page loads published items.
- Find / location page.
- Privacy page.
- Share-your-story (testimonial submit).
- Redeemed receipt page (`/redeemed/$code`) with a known code.
- Login → admin (without admin role → blocked; with role → dashboard, copy, faqs, testimonials, redeem/scan station).
- Redeem flow: PIN entry, scanner UI, offline batch outbox.

## 5. Conflict & data checks (read-only DB)
- Duplicate redemption codes? Orphan feedback rows? Signups missing reward_choice?
- FAQs: any unpublished but expected to show? Testimonials similarly.
- Site copy keys present for every key referenced in code.

## 6. Responsive / overflow audit
At 320, 375, 390, 768, 1024, 1280:
- Home hero, countdown, signup form, footer.
- Receipt page (QR + share/save cards side-by-side on wide, stacked on narrow).
- FAQ accordion long answers.
- Admin tables (horizontal scroll vs overflow).
- Header nav wrap behavior.

## 7. Performance / SEO sanity
- Image sizes & `loading="lazy"` on non-hero images.
- JSON-LD validity on FAQ page.
- robots/noindex correct on `/admin*` and `/login`.
- Lighthouse-style spot checks via console + network panel.

## Deliverable
A single QA report posted in chat:
```
BLOCKER (must fix before publish)
  - ...
HIGH
  - ...
MEDIUM
  - ...
LOW / nice-to-have
  - ...
PASSED
  - ...
```
For each finding: file/route, what's wrong, suggested fix. After you review, I'll fix the items you greenlight in a follow-up build pass.

## Notes
- Read-only pass: no migrations, no code edits, no destructive admin actions during browser testing.
- Browser tests against the preview only; will not touch production data via the published URL.
