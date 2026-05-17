## Goal
Replace the generic 404 page with an on-brand, elegant "page not found" experience that feels like part of Sans Sucre.

## Design Direction
- Warm, inviting patisserie tone — not cold or technical
- Use the brand's display font (Playfair Display SC) for the headline and PT Sans for body copy
- Leverage existing semantic tokens: `bg-background`, `text-foreground`, `text-primary`, `text-muted-foreground`, `border`
- Add a subtle decorative element (e.g. a small pastry/cupcake icon or ornamental divider) to reinforce the brand without needing new assets
- Keep layout centered, generous whitespace, mobile-first

## What Will Change
- `src/routes/__root.tsx` — rewrite the `NotFoundComponent` to match the Sans Sucre aesthetic while keeping the same structural behavior (`min-h-screen`, centered, `Link to="/"` home CTA)

## Out of Scope
- New images or illustration assets
- Animation beyond simple CSS transitions
- Changes to the root layout shell or router config

## Verification
- Navigate to a nonexistent route (e.g. `/nonexistent`) and confirm the 404 renders correctly on mobile and desktop.
