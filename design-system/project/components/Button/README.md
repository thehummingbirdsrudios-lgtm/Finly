# Button

Actions. One primary button per screen or sheet, in the same place every time: the bottom, in thumb reach.

- Provide: `children` (a verb: "Save", "Confirm & post", "Verify & share"), `variant` (`primary`, `secondary`, `quiet`, `danger`), optional `icon`, `loading` + `loadingLabel` ("Posting…"), `disabled`, `block` to fill the row, `size="sm"` inside cards.
- `danger` only for reversing, revoking or discarding — never for ordinary saves.
- A disabled button the user knows about always has a reason nearby ("Choose where the money is going").
- Minimum height 48px. Pressing scales to 97% for 90ms.

**In the app:** `FyButton` — FilledButton / OutlinedButton / TextButton themed by FyTheme.
