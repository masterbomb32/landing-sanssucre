# Connect sanssucre.ph — staged cutover plan

You want the current site at sanssucre.ph to stay live for ~1 week while we get the Lovable build wired up. The safe way is a **two-phase rollout**: connect a subdomain now to test the Lovable app end-to-end, then flip the root + www over when you're ready to retire the old site.

Pick a staging subdomain to use this week — recommended: **`new.sanssucre.ph`** (or `app.`, `preview.`, etc.). Below assumes `new.`.

---

## Phase 1 — This week (old site stays up)

### A. In Lovable
1. Project Settings → Project → Domains → **Connect Domain**.
2. Enter `new.sanssucre.ph`.
3. Leave the Cloudflare/proxy checkbox **unchecked** (we'll confirm in a moment — see "Cloudflare check" below).
4. Lovable shows two DNS records to add — typically:
   - A record: name `new`, value `185.158.133.1`
   - TXT record: name `_lovable.new`, value `lovable_verify=…` (copy the exact value Lovable shows)

### B. In Namecheap
1. Log in → Domain List → click **Manage** next to `sanssucre.ph`.
2. Open the **Advanced DNS** tab.
3. **Do not touch** any existing records for `@` (root) or `www` — that's what keeps your current site live.
4. Click **Add New Record** twice and add exactly what Lovable showed:
   - Type: `A Record`, Host: `new`, Value: `185.158.133.1`, TTL: Automatic
   - Type: `TXT Record`, Host: `_lovable.new`, Value: `lovable_verify=…`, TTL: Automatic
5. Save (green checkmark on each row).

### C. Cloudflare check
You weren't sure about proxy. Quick way to tell:
- In Namecheap → Domain tab, look at **Nameservers**. If they're something like `kirk.ns.cloudflare.com` / `kate.ns.cloudflare.com`, your DNS is at Cloudflare, not Namecheap — in that case you'd add the records in the Cloudflare dashboard instead, and you should tick the proxy checkbox in Lovable and set the new record to **DNS only (grey cloud)** in Cloudflare for verification.
- If nameservers are `dns1.registrar-servers.com` / `dns2.registrar-servers.com` (Namecheap BasicDNS), ignore Cloudflare entirely and follow step B above.

### D. Wait + verify
- Status in Lovable Domains will go Verifying → Setting up → **Active** (usually 10–60 min on Namecheap, up to 72h worst case).
- Once Active, open `https://new.sanssucre.ph` — that's your Lovable app, SSL and all. Your old site at `sanssucre.ph` and `www.sanssucre.ph` is untouched.

Use this week to test the Lovable app on `new.sanssucre.ph`.

---

## Phase 2 — Cutover day (retiring the old site)

When you're ready to make Lovable the live site at the root:

### A. In Lovable
1. Domains → **Connect Domain** again, enter `sanssucre.ph`.
2. Connect a second time for `www.sanssucre.ph`.
3. Lovable will show A + TXT records for each (same IP `185.158.133.1`, separate `_lovable` / `_lovable.www` TXT values).
4. After both go Active, set `sanssucre.ph` as **Primary** so `www` redirects to root.

### B. In Namecheap (Advanced DNS)
1. **Delete** every existing A / CNAME / ALIAS / URL Redirect record on host `@` and host `www` that points at your current host.
2. Add:
   - A record, Host `@`, Value `185.158.133.1`
   - A record, Host `www`, Value `185.158.133.1`
   - TXT record, Host `_lovable`, Value from Lovable
   - TXT record, Host `_lovable.www`, Value from Lovable
3. **Leave email records alone** — MX, and any TXT for SPF/DKIM/DMARC stay exactly as they are. We're only changing web traffic.
4. (Optional) Remove the temporary `new` A record and `_lovable.new` TXT once you no longer need the staging subdomain.

### C. Verify
- `https://sanssucre.ph` and `https://www.sanssucre.ph` both load the Lovable app, with `www` redirecting to root.
- Email still works (test by sending one to your domain mailbox).

---

## After cutover — code updates I'll handle for you

Once the root domain is Active, on your say-so I'll update in one batch:
- `BASE_URL` in the sitemap → `https://sanssucre.ph`
- Canonical + `og:url` in every route head() → `https://sanssucre.ph/...`
- Any hardcoded `landing-sanssucre.lovable.app` references in copy/metadata
- `robots.txt` Sitemap directive (if/when you want one)

Nothing in code needs to change during Phase 1 — the Lovable app works on any connected domain immediately.

---

## What I need from you to proceed

1. Confirm the staging subdomain name (default: `new.sanssucre.ph`).
2. Check Namecheap → Domain tab → Nameservers and tell me what's listed, so I know whether DNS lives at Namecheap or Cloudflare before you add records.

Once you confirm those, switch me to Build mode and I'll walk through each click with you.
