# DNS / domain hardening recommendations — sanssucre.ph

These are owner actions on the DNS registrar / Cloudflare side. Lovable can't
toggle them for you. Do them once, before launch marketing.

## At the registrar

- [ ] **DNSSEC** — enable on `sanssucre.ph`. Most PH registrars expose this
      as a one-click toggle; some require pasting a DS record from Cloudflare.
- [ ] **CAA record** — restrict who can issue TLS certs:
      ```
      sanssucre.ph.  CAA  0 issue "letsencrypt.org"
      sanssucre.ph.  CAA  0 issue "pki.goog"
      sanssucre.ph.  CAA  0 iodef "mailto:security@sanssucre.ph"
      ```
- [ ] **Auto-renew + registrar lock** on the domain.

## On Cloudflare (if proxying)

- [ ] SSL/TLS mode: **Full (strict)**.
- [ ] **Always Use HTTPS** + **Automatic HTTPS Rewrites** ON.
- [ ] **Bot Fight Mode** ON.
- [ ] WAF rule: challenge any request to `/admin/*` from non-PH IPs.
- [ ] Rate-limit rule: 10 req / 10s per IP on `/api/*` (best-effort).
- [ ] Page Rules / Cache: bypass cache for `/admin/*`, `/redeem`, `/api/*`.

## Email (only when transactional mail is wired)

If/when we send email from `@sanssucre.ph`:

- [ ] **SPF** — `v=spf1 include:<provider> -all`
- [ ] **DKIM** — provider-supplied selector
- [ ] **DMARC** — start at `p=none; rua=mailto:dmarc@sanssucre.ph`, tighten
      to `p=quarantine` after one week of clean reports.

## Verify

- DNSSEC: <https://dnssec-analyzer.verisignlabs.com/sanssucre.ph>
- CAA / SPF / DMARC: <https://mxtoolbox.com/SuperTool.aspx>
- Headers (after deploy): <https://securityheaders.com/?q=landing-sanssucre.lovable.app>