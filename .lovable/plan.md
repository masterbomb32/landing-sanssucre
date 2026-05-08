# Fix admin error + full E2E smoke test

## 1. Fix the `permission denied for function has_role` error

**Root cause.** During the security hardening pass, `EXECUTE` on `public.has_role(uuid, app_role)` was revoked from `anon` and `authenticated`. The admin gate in `src/routes/admin.tsx` calls `supabase.rpc("claim_admin_if_first")`, which internally calls `has_role`. The nested call fails the permission check, so every admin page load shows the red toast.

**Fix.** Add a migration that re-grants `EXECUTE` on `has_role` to `authenticated` only (still revoked for `anon`). `has_role` is `SECURITY DEFINER`, read-only, and only returns a boolean — it's safe for any logged-in user to call against their own `auth.uid()`. Pattern matches the standard Supabase RBAC recipe.

```sql
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
```

Verify by reloading `/admin` — toast should disappear and Dashboard / Edit copy / Scan station should load normally.

## 2. End-to-end smoke test (run before resuming features)

Goal: catch regressions across the full customer + staff + admin flow on the **published** site (`https://landing-sanssucre.lovable.app`). Each step has a clear pass criterion.

### A. Public landing page
1. Open the home page in an incognito window.
2. Pass: hero text plays the rise animation, **live reservation count** renders a number (not "—"), **countdown** shows opening date (not blank).
3. Pick a reward → fill name + mobile (use a throwaway PH number) → submit.
4. Pass: redirected to `/receipt/{CODE}`.

### B. Receipt page
1. On the receipt: QR renders, code is visible, "save this for opening day" copy is shown, **Find my reward** CTA is obvious.
2. Pass: countdown strip + community live count both render.
3. Copy the code, then close the tab.

### C. Find my reward
1. Open `/find` in a new incognito tab.
2. Enter the same mobile number → submit.
3. Pass: redirected back to the same `/receipt/{CODE}`.
4. Negative case: enter a fake number → "not found" message; spam 6+ tries → throttle toast appears.

### D. Staff redeem (test mode first)
1. Sign in at `/login` as the staff/admin account → go to `/redeem`.
2. Toggle **Test mode ON**. Type the code from step B → confirm.
3. Pass: success state appears, but DB is unchanged (verify by re-querying in step F).
4. Toggle **Test mode OFF**. Redeem the code for real.
5. Pass: success state, then 30s **Undo** window is visible and clickable.
6. Try redeeming the same code again → "already redeemed" with original timestamp.

### E. Redeemed thank-you page
1. From the receipt page (after real redemption), refresh or visit `/redeemed/{CODE}`.
2. Pass: full-bleed red velvet hero with no white overlay, "Redeemed" badge, no QR.

### F. Admin dashboard
1. Go to `/admin`.
2. Pass: no permission toast (after fix in section 1), counters update (Today, Redeemed, Redemption rate), **Traffic Overview** shows OS + Device bars, page auto-refreshes every ~30s.
3. Go to `/admin/copy` → edit `opening.label` → save → reload home page → confirm new label shows.
4. Revert the copy change.

### G. Backend sanity (psql, read-only)
Run a few quick queries to confirm data integrity:
- `select count(*) from signups;` — matches the live count on the home page.
- `select count(*) from signups where redeemed_at is not null;` — matches Dashboard "Redeemed".
- `select * from redemption_audit order by created_at desc limit 5;` — shows the redeem + any unredeem from step D.

### H. Mobile viewport pass
1. Set preview viewport to ~390×844 (iPhone).
2. Walk through A → C again. Pass: no horizontal scroll, hero text fits, signup form is reachable without zoom.

### I. SEO / share preview
1. View page source on `/` → confirm `<title>`, `og:image`, `twitter:image` are present.
2. Pass: meta tags resolve to the opening-day social image.

## What to do with results
- If any step fails, capture the failing step letter + screenshot/console error and we fix that before continuing development.
- If everything passes, we resume from the pending-features list (security hardening → Phase 1 staff ops → Phase 2 landing polish).

## Technical notes (for the implementer)
- The fix is a single migration file, no app code changes.
- After the migration, no need to touch `src/routes/admin.tsx` or `claim_admin_if_first()`.
- The smoke test is manual; we can later wire a Playwright spec for the customer happy path, but that's out of scope for this pass.
