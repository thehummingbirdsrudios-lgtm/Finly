# StatusBadge

One word and one icon for where a transaction is in its life, or which way money moved.

- Provide: `status` — `money-in`, `money-out`, `transfer`, `draft`, `pending`, `posting`, `posted`, `rejected`, `blocked`, `reversed`, `corrected`, `outstanding`, `settled`, `reconciled`, `exception`, `overdue`, `queued`, `syncing`, `sync-failed`; optional `label` to apply a custom display label (Avak, Javak) without changing the meaning.
- The same badge appears in lists, details, reports, proof cards and PDFs.
- Rows show a badge for every state except Posted; detail screens show all states.

**In the app:** `FyStatusBadge` — a DecoratedBox + Icon + Text.
