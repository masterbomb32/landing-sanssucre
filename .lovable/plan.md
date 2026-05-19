# Sans Sucre Color Palette Rebrand

Replace the current rose/cream patisserie palette with the official Sans Sucre brand palette from the attached reference.

## Brand colors (mapped to tokens)

| Brand swatch | Hex | Role |
|---|---|---|
| Bright White | `#FBFAFA` | `--background`, `--card` |
| Neutral Gray | `#B5B1AF` | `--muted-foreground`, `--border`, body dividers |
| Deep Sage Green | `#8FA293` | `--primary` (main brand), foreground accents |
| Sage Green | `#BDCBBA` | `--secondary`, `--muted` |
| Soft Coral | `#F9C5B7` | `--accent` (warm highlight) |
| Classic Gold | `#E9C997` | `--gold` (highlights, hover) |
| Premium Gold | `#C19B5A` | `--gold-deep` (elevated accents, CTA underlines) |
| Foreground text | dark charcoal-sage | derived from Deep Sage |

## Changes (single file: `src/styles.css`)

1. **Replace `:root` token values** with oklch conversions of the brand hexes above. Primary becomes Deep Sage instead of deep rose. Accent becomes Soft Coral. Background becomes Bright White (cool, not warm cream).
2. **Update the custom token block** in `@theme inline`:
   - Remove `--color-rose`, `--color-rose-deep`, `--color-cream` (rose-era leftovers).
   - Add `--color-sage`, `--color-sage-deep`, `--color-coral`, `--color-gold`, `--color-gold-deep`.
3. **Update `.dark` mode** to a sage-charcoal scheme (deep sage background, coral/gold accents) so dark theme stays on-brand instead of generic blue.
4. **Keep typography** (Playfair Display SC + PT Sans) — only colors change.

## Component cleanup

Grep for any hardcoded `rose`, `cream`, `rose-deep` Tailwind utility usages introduced earlier and rename to the new `sage`/`coral`/`gold` tokens. No structural/layout changes.

## Out of scope

- No layout, copy, component, or routing changes.
- The push-notifications build fix from prior turns stays as-is.
- Resuming roadmap/dev work is paused per the user's instruction until this rebrand lands.
