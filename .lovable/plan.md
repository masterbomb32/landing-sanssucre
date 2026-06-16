## Part 1 — Fix the build error (blocker)

The build is failing because `src/server/receipt.functions.ts` is imported by three route files, but the template blocks the whole `src/server/` directory from client bundles — and the file also imports `client.server` at the top, which pulls the service-role key toward the browser graph.

**Changes:**
1. Move `src/server/receipt.functions.ts` → `src/lib/receipt.functions.ts` (client-safe path).
2. Replace the top-level `import { supabaseAdmin } from "@/integrations/supabase/client.server"` with `await import(...)` inside each `.handler()` body, so the admin client never appears in the client graph.
3. Update the three imports:
   - `src/routes/redeemed.$code.tsx`
   - `src/routes/find.tsx`
   - `src/routes/receipt.$code.tsx`
   from `@/server/receipt.functions` → `@/lib/receipt.functions`.
4. Delete the old file.

No behavior change — same functions, same validation, same throttle.

## Part 2 — Custom domain setup (your actual question)

You buy/connect the domain in Lovable, then either let Lovable manage DNS (if bought through Lovable) or add records at your registrar.

### Option A — Buy the domain through Lovable (easiest)
1. **Project Settings → Project → Domains → Buy new domain**.
2. Search, pick, pay. Lovable auto-connects it and manages DNS for you.
3. SSL provisions automatically; site is live on the new domain in a few minutes.
4. Later, manage MX/SPF/DKIM/DMARC via **⋯ → Configure → Manage DNS records** on that same domain.

### Option B — Connect a domain you already own
1. Publish the project first (required before a custom domain can attach). Your current published URL is `landing-sanssucre.lovable.app`.
2. **Project Settings → Project → Domains → Connect Domain**.
3. Enter the domain (e.g. `sanssucre.ph`). Add **both** entries in Lovable — the root AND `www` — they aren't auto-paired.
4. At your registrar, create:
   - **A** record, name `@`, value `185.158.133.1`
   - **A** record, name `www`, value `185.158.133.1`
   - **TXT** record, name `_lovable`, value provided in the dialog (`lovable_verify=...`)
5. If you front the domain with Cloudflare or another proxy, tick **Advanced → "Domain uses Cloudflare or a similar proxy"** so it uses CNAME verification instead.
6. Remove any old A/CNAME on `@` or `www` pointing elsewhere — conflicts block verification.
7. Wait for DNS propagation (usually minutes, up to 72 hours). Lovable auto-issues SSL.
8. In the Domains list, choose which one is **Primary** (other redirects to it). Recommend `sanssucre.ph` primary, `www` redirects.

### Status meanings you'll see
- **Verifying** — waiting on DNS propagation, no action.
- **Setting up** — verified, SSL issuing.
- **Active** — live.
- **Offline / Failed** — DNS mismatch or SSL issuance failed; fix records and **Retry**.

### After it goes Active
- I'll update SEO metadata (canonical, og:url, sitemap, robots) to point at the new domain.
- Then we can knock out the email receipt + recovery, which needs the domain in place to set up Lovable Emails on a subdomain like `notify.sanssucre.ph`.

### What I need from you
- The exact domain you'll use (e.g. `sanssucre.ph`).
- Whether you're buying through Lovable or connecting an existing one.
- If existing: who your registrar is (GoDaddy, Namecheap, Cloudflare, etc.) so I can give you registrar-specific tips.
