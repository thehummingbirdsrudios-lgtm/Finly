# BalanceCard

A total and where it sits, built only from what the viewer may see.

- Provide: `title`, optional `path`, `amount` (the authorised total from the server), `parts` (`[{label, amount}]`, authorised parts only), `privacy`, `updated`, `stale`.
- The server aggregates the viewer's authorised data and then sends the total. Never draw a remainder, an "Other" segment or a gap that hints at hidden money. In the three cards below, the same Mint money is seen by Krish (₹12,00,000), Father (₹8,00,000) and a worker (₹3,00,000) — BUILD_PROMPT L12.
- The bar is decoration; the legend carries every value in words.

**In the app:** `FyBalanceCard` — Card + a custom allocation bar (Row of Flexible).
