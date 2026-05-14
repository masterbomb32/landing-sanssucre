# Place Share and Save/Print side by side

In `src/routes/receipt.$code.tsx`, wrap the existing `ShareButton` (item 6) and the Save/Print anchor (item 7) in a single `flex gap-2` row directly below the QR code card.

- Share on the left, Save/Print on the right
- Both `flex-1` so they split the row evenly
- Keep `h-10` height; drop `w-full` since flex handles width
- No other ordering or styling changes
