## Landing page polish — round 3

Five things to fix, plus one structural improvement (editable copy).

---

### 1. Swap in the new Sans Sucre logo

- Copy `user-uploads://sanssucrephlogo1.png` → `src/assets/sanssucre-logo.png` (overwrite existing).
- All current references (`hero` and `footer`) pick it up automatically — no code change needed beyond the file replace.

### 2. Add Metro Supermarket × Alabang Town Center branding

- Copy `user-uploads://metroretaillogo.png` → `src/assets/metro-logo.png`
- Copy `user-uploads://atclogo.png` → `src/assets/atc-logo.png`

**Where they appear:**

- **Hero** — a small, elegant "location chip" directly under the headline:

  ```text
  ─────────────────────────────────────
   [metro logo]  ×  [atc logo]
   Find us at Metro Supermarket,
   Alabang Town Center
  ─────────────────────────────────────
  ```

  Logos rendered at ~h-6 (mobile) / h-8 (desktop), greyscale-friendly on the cream overlay, separated by a thin "×". Sits between the sub-paragraph and the CTAs so it reinforces the "where" without stealing focus from the reward.

- **Footer** — same pair of logos, slightly larger, with the line: *"Inside Metro Supermarket · Alabang Town Center"*.

Tone of the new copy (rewritten, not pasted from your note):
- Hero chip: **"Find us inside Metro Supermarket — Alabang Town Center."**
- Footer: **"You'll find Sans Sucre tucked inside Metro Supermarket at Alabang Town Center."**

### 3. Reduce "Reserve your reward" repetition

Current count of that exact phrase: **3** (hero sub, hero CTA, form heading). New treatment:

| Slot | Before | After |
|---|---|---|
| Hero sub | "Reserve your reward in under a minute…" | "Pick your treat. Show up on opening day. We'll have it waiting." |
| Hero CTA | "Reserve my reward →" | **"Pick my treat →"** |
| Sticky mobile pill | "Reserve now" | **"Pick my treat"** |
| Form section heading | "Reserve your reward" | **"Almost there — just your details"** |
| Form submit button | "Claim my reward" | unchanged (final action verb) |

Result: zero phrase repeats, and the language gets warmer / more concrete ("treat" matches a bakery brand better than "reward").

### 4. Privacy link appears 3× — consolidate

Currently:
1. Inline paragraph under the form (long sentence + "Read our privacy notice" link)
2. The form's own privacy micro-copy (in `signup-form.tsx`)
3. Footer "Privacy" link

**Plan:** keep **one** discoverable link in the footer, plus one tiny inline mention next to the submit button (where consent is actually given — required by good UX/PH DPA practice).

- ❌ Remove the long privacy paragraph block under the form card.
- ✅ Keep the footer "Privacy" link (standard placement users expect).
- ✅ Replace the form's privacy micro-copy with a single tight line:
  *"By submitting, you agree to our [privacy notice](/privacy)."*

That's 2 mentions total, each with a distinct purpose (consent + standard footer link) — not 3 redundant ones.

### 5. Make the copy editable from one file

Right now copy is sprinkled across `index.tsx`, `signup-form.tsx`, and `__root.tsx`. To let you (or anyone non-technical) tweak wording without hunting through components:

**Create `src/lib/site-copy.ts`** — a single typed config object:

```ts
export const siteCopy = {
  brand: { name: "Sans Sucre", tagline: "Opening Day Rewards" },
  hero: {
    eyebrow: "Grand Opening",
    headline: { line1: "A sweet welcome,", line2: "just for you." },
    sub: "Pick your treat. Show up on opening day. We'll have it waiting.",
    location: "Find us inside Metro Supermarket — Alabang Town Center.",
    primaryCta: "Pick my treat →",
  },
  stickyCta: "Pick my treat",
  form: {
    heading: "Almost there — just your details",
    sub: "Tell us where to send your unique code. Show it at the shop on opening day.",
    consent: "By submitting, you agree to our",
    consentLinkLabel: "privacy notice",
    submit: "Claim my reward",
  },
  footer: {
    location: "You'll find Sans Sucre tucked inside Metro Supermarket at Alabang Town Center.",
    rights: "© {year} Sans Sucre · sanssucre.ph",
  },
  meta: {
    title: "Sans Sucre — Opening Day Rewards",
    description: "Sign up, pick a reward, and visit us on opening day to claim it.",
  },
} as const;
```

`index.tsx`, `signup-form.tsx`, `share-button.tsx`, and `__root.tsx` all import from this one file. To change any wording later: open `src/lib/site-copy.ts`, edit, save. Done.

---

### Files touched

- `src/assets/sanssucre-logo.png` (replaced — new file)
- `src/assets/metro-logo.png` (new)
- `src/assets/atc-logo.png` (new)
- `src/lib/site-copy.ts` (new — single source of truth for all copy)
- `src/routes/index.tsx` (use `siteCopy`, add location chip with both logos, footer logos, remove redundant privacy block)
- `src/components/signup-form.tsx` (use `siteCopy`, replace privacy paragraph with single inline consent line)
- `src/routes/__root.tsx` (use `siteCopy.meta` for title/description)
- `src/components/share-button.tsx` (use `siteCopy.brand` for share title/text)
- `.lovable/plan.md` (refresh notes)

No DB or backend changes. No new dependencies.