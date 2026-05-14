# Receipt page reorder

Restructure `src/routes/receipt.$code.tsx` into a single vertical column (drop the `lg:grid-cols-[1.05fr_1fr]` two-column layout) with this exact order:

1. **Greeting** — "Hello, {firstName}"
2. **Headline** — "Your treat is waiting."
3. **Treat card** — emoji + reward title + description (existing reward block)
4. **Instructions card** — merge the opening-day notice (`copy.receipt.openingNotice`) and add a line "One reward per person." inside the same card (currently shown as a separate footnote)
5. **QR code card** — scan label, QR, code, "Waiting for staff to scan…" indicator
6. **Share card** — `ShareButton` (full width)
7. **Save / Print button** — full width, below Share
8. *(removed)* "Find my reward by phone" CTA — delete the dashed `Link to="/find"` block
9. *(removed)* "Total treats reserved" community count — delete the `reservedCount` badge + its `useEffect` + `getReservationCount` import
10. **Location card** — existing Sans Sucre / Metro Supermarket strip
11. **Countdown card** — "Opening on" + label + `<Countdown />`, placed last
12. Keep the bottom "One reward per person · sanssucre.ph" link line? → remove the "One reward per person" half (it now lives in the instructions card); keep just the `sanssucre.ph` link as a small footer.

## Technical notes

- Container: keep `min-h-[100dvh]` shell; replace the inner grid with a single `flex flex-col gap-3` stack inside the bordered card. Drop the right-column wrapper styling (`bg-primary/[0.03]`, `border-t`, etc.).
- Remove unused imports after deletions: `Search`, `getReservationCount`, and the `reservedCount` state + polling effect.
- Keep status banner, redeemed banner, header logo, and the realtime/wake-lock effects untouched.
- No business-logic changes; presentation only.
