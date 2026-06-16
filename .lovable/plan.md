# Phase 1 — Connect `new.sanssucre.ph` (staging)

DNS lives at **Namecheap PremiumDNS** (no Cloudflare). All records go in Namecheap's **Advanced DNS** tab. Your existing `sanssucre.ph` and `www` stay untouched this whole phase.

## Step 1 — Add the subdomain in Lovable

1. Lovable → **Project Settings → Domains → Connect Domain**.
2. Enter exactly: `new.sanssucre.ph`
3. Leave the "Domain uses Cloudflare or a similar proxy" box **unchecked**.
4. Lovable will show two records. They'll look like:
   - **A record** — Name: `new` — Value: `185.158.133.1`
   - **TXT record** — Name: `_lovable.new` — Value: `lovable_verify=XXXXX` (copy the exact value Lovable gives you)
5. Keep that dialog open — you'll need the TXT value.

## Step 2 — Add the records in Namecheap

1. Namecheap → **Domain List → sanssucre.ph → Manage → Advanced DNS** tab.
2. Click **Add New Record** twice and create:

   | Type        | Host           | Value                 | TTL       |
   |-------------|----------------|-----------------------|-----------|
   | A Record    | `new`          | `185.158.133.1`       | Automatic |
   | TXT Record  | `_lovable.new` | `lovable_verify=XXXXX`| Automatic |

3. Click the green checkmark on each row to save.
4. **Do not touch** any existing `@`, `www`, MX, or TXT records — those keep the current site and email running.

## Step 3 — Wait + verify

- Back in Lovable's Domains page, the status moves: **Verifying → Setting up → Active** (usually 5–30 min, occasionally longer).
- When it shows **Active**, open `https://new.sanssucre.ph` — it should serve your Lovable app with a valid SSL cert.
- Old site at `sanssucre.ph` / `www.sanssucre.ph` continues serving the existing content the whole time.

## What I'll do after staging is verified

Nothing in code yet — Phase 1 is DNS only. When you're ready to cut over (Phase 2), I'll:
- Walk you through swapping the `@` and `www` records in Namecheap.
- Update `BASE_URL` in the sitemap and the canonical/`og:url` tags across routes to `https://sanssucre.ph`.

Reply once `new.sanssucre.ph` shows **Active** in Lovable, or if anything in the flow looks different from the steps above.
