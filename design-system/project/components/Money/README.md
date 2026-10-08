# Money

The amount, always the strongest element on its screen: whole rupees, Indian grouping, a sign and a colour that both say the direction.

- Provide: `amount` (a whole-rupee integer from the server), `direction` (`in`, `out`, `transfer`, or none for a plain balance), `size` (`hero`, `lg`, `md`, `sm`), `visibility` (`full`, `rounded`, `range`, `hidden`, `existence`), `struck` for a reversed original.
- `+ ₹50,000` is money into the place being viewed (Avak); `− ₹50,000` is money out (Javak); a transfer has no sign. The sign and the arrow beside the amount carry the meaning; colour only repeats it.
- Never show paise, `.00`, a hyphen as the minus, or a negative balance as `-₹`. Values that are not whole rupees render "Amount unavailable".
- Masked modes are rendered from text the server sends (`display`). The client never receives the full amount for a field the viewer may not see, so the rounded and range helpers here exist only for previews.
- Screen readers hear the amount in words: "plus fifty thousand rupees, money in".

**In the app:** `FyMoney` — Text with the amount text styles + Semantics(label: words).
