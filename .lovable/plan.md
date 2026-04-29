## Plan

We will switch the receipt back to a QR-first redemption flow while keeping the receipt compact enough to fit on one page.

### 1. Receipt page: replace barcode with QR code

Update `/receipt/$code` so the main scan target is a large QR code again.

The receipt will keep:
- Single-page compact layout
- Status banner
- Customer greeting
- Reward block
- Manual redemption code text
- Location and issued date
- Share button
- Save / Print button
- Redeemed-state link to the thank-you/feedback page

The Code-128 barcode will be removed from the receipt UI.

Target layout:

```text
[Status banner]
Hello, {first name}
Your treat is waiting.
[Reward summary]
[Large QR code]
CODE: MWAE2H8FGD3E
[Location + issued date]
[Share] [Save / Print]
Fine print
```

The QR code will encode the receipt/redemption URL or code in a way the existing scanner can process. The current redeem logic already supports scanned receipt URLs and raw codes.

### 2. Keep manual code entry on the staff redeem page

Keep the manual code input on `/redeem` exactly as the fallback path.

Small copy update:
- Change scanner instruction from “Point the camera at the customer’s QR code or barcode” to “Point the camera at the customer’s QR code.”
- Keep “Or enter code manually” below it.

### 3. Scanner behavior

The scanner already supports QR code. We can keep Code-128 support in the scanner internally, but QR will become the primary expected scan method.

Recommended minor adjustment:
- Put QR code first in the scanner format hints again.
- Keep Code-128 as optional backup support in case older receipts or physical scanners are used.

### 4. Responsive one-page handling

The receipt will remain compact:
- QR code size will scale by viewport.
- On very short screens, the receipt will keep the existing fallback that allows scrolling rather than clipping content.
- Manual code text will remain visible and readable even if QR scan fails.

### Files to update

- `src/routes/receipt.$code.tsx`
  - Remove `react-barcode` import and barcode block.
  - Add `QRCodeSVG` from `qrcode.react`.
  - Add large QR tile with manual code below.

- `src/components/scanner.tsx`
  - Prioritize QR code detection again.
  - Keep Code-128 as backup if desired.

- `src/routes/redeem.tsx`
  - Update instruction copy to QR-first.

### No database changes needed

This change does not need a migration. Existing redemption, thank-you page, feedback recording, share tracking, and dashboard analytics remain unchanged.