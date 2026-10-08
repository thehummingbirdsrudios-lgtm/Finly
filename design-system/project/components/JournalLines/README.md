# JournalLines

The accounting view of an entry: its balanced journal lines, for finance roles only (BUILD_PROMPT AC16).

- Provide: `entity`, `journalId`, `lines` (`[{account, side: 'Dr' | 'Cr', amount, dims}]`).
- Normal users never see Dr and Cr; they see Money in and Money out. This view exists to prove every posting balances.
- An unbalanced journal is shown as blocked and can never be posted.

**In the app:** `FyJournalLines` — Table.
