# ExplainBalance

Answers "why is this the balance?": opening, every movement, closing — and proves they add up.

- Provide: `title`, `from`/`to` dates, `opening`, `movements` (`[{label, ref, amount, direction}]`), `closing` — all from the server, within the viewer's permissions.
- If opening + movements ≠ closing the card says so and the integrity check is alerted; nothing is ever adjusted to make it fit.
- Every row opens its transaction.

**In the app:** `FyExplainBalance` — Card + a ListView of rows.
