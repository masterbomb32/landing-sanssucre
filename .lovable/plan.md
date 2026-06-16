## Part 1 — Fix the build (blocker, same root cause as last time)

The import-protection plugin blocks the entire `src/server/` directory from the client bundle. It flagged `redeem.functions.ts` first, but every file in `src/server/` is reachable from a route or component and has the same problem (top-level `supabaseAdmin` import + bad directory). All 10 files need the same treatment as `receipt.functions.ts`.

**Files to move** `src/server/*.functions.ts` → `src/lib/*.functions.ts`:
- `admin.functions.ts`
- `conflict.functions.ts`
- `dashboard.functions.ts`
- `errors.functions.ts`
- `faqs.functions.ts`
- `mailing.functions.ts`
- `redeem.functions.ts`
- `signup.functions.ts`
- `stats.functions.ts`
- `testimonials.functions.ts`

**In each moved file:** remove the top-level `import { supabaseAdmin } from "@/integrations/supabase/client.server"` and add `const { supabaseAdmin } = await import("@/integrations/supabase/client.server");` at the top of every `.handler()` body that uses it. Keep all other logic identical.

**Update all import sites** (`@/server/...` → `@/lib/...`) across:
- `src/routes/redeemed.$code.tsx`
- `src/routes/share-your-story.tsx`
- `src/routes/admin.index.tsx`
- `src/routes/redeem.tsx`
- `src/routes/admin.faqs.tsx`
- `src/routes/admin.mailing.tsx`
- `src/routes/admin.testimonials.tsx`
- `src/routes/faq.tsx`
- `src/routes/admin.errors.tsx`
- `src/routes/index.tsx`
- `src/components/signup-form.tsx`
- `src/components/share-button.tsx`
- `src/hooks/use-error-reporter.ts`
- `src/hooks/use-track-visit.ts`

Then `rm -rf src/server/`.

No behavior change — pure file relocation + lazy import.

## Part 2 — Connecting your existing domain

Quick steps (you do these in the Lovable UI + your registrar):

1. In Lovable: **Project Settings → Project → Domains → Connect Domain**.
2. Type your root domain (e.g. `sanssucre.ph`). After it's added, click **Connect Domain** again and add `www.sanssucre.ph` — they aren't auto-paired.
3. Lovable will show you the records to add. At your registrar's DNS panel, create:
   - **A** `@` → `185.158.133.1`
   - **A** `www` → `185.158.133.1`
   - **TXT** `_lovable` → the `lovable_verify=...` value shown in the dialog
4. **Delete any old A/CNAME** on `@` or `www` pointing somewhere else — conflicts block verification.
5. If you proxy through Cloudflare or similar, tick **Advanced → "Domain uses Cloudflare or a similar proxy"** in the connect dialog (switches it to CNAME verification).
6. Wait. Status goes Verifying → Setting up → Active. Usually minutes; can take up to 72 hours.
7. In the Domains list, mark one as **Primary** (recommend the root; `www` will redirect).

### Once it's Active, I'll update on the next turn:
- `BASE_URL` in `src/routes/sitemap[.]xml.ts` (currently `https://landing-sanssucre.lovable.app`)
- canonical + og:url in every route's `head()`
- any hardcoded `landing-sanssucre.lovable.app` references

### What I need from you to tailor the steps
1. The exact domain (e.g. `sanssucre.ph` or a subdomain like `signup.sanssucre.ph`).
2. Your DNS registrar (GoDaddy, Namecheap, Cloudflare, Google Domains, etc.) — so I can give you the exact place to add records.
3. Whether you're fronting the domain with Cloudflare (orange-cloud proxy on).

Approve the plan and I'll fix the build immediately. Drop the domain + registrar in your next message and I'll guide you through the DNS step screen-by-screen.
