# TransactionCard

One money movement, readable months later: from → to, amount, reason, when, who, and its state.

- Provide: `tx` — `{id, from, to, amount, direction, reason, date, time, handler, status, privacy, visibility, display}` — and `onClick` to open the detail.
- The route reads as a sentence: "Mint → Tijori". The amount is right-aligned and is the strongest element.
- Reversed entries keep their amount, struck through, with a Reversed badge; the reversal is its own card.
- A worker's blind entry shows "Amount hidden" for amounts they may not see.

**In the app:** `FyTransactionCard` — a Card + InkWell, Hero on the amount into the detail screen.
