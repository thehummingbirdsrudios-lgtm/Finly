# AmountInput

The amount keypad: whole rupees only, Indian grouping as you type, the available balance beside it when the viewer may see it.

- Provide: `value`/`onChange` (an integer or null), optional `available` (only when the viewer may see that balance), `availableLabel` ("Available in Tijori"), `approvalAbove` (the configured approval threshold), `error` from the server.
- No decimal key, no minus key: negative and fractional amounts cannot be typed. A `000` key speeds up lakhs.
- Inline messages while typing: "Enter an amount", "More than the available balance.", "Above ₹1,00,000 — this entry will need approval."
- The server rechecks the balance at commit; the number shown here is guidance, never the authority.

**In the app:** `FyAmountInput` — a custom keypad (GridView of InkWell keys), no system keyboard.
