# ConflictMessage

When a change is refused: what conflicts, where, why, what it would affect, and how to fix it. Nothing is partly saved.

- Provide: `title`, `what`, `where`, `why`, `impact`, `resolutions` (`[{label, onClick}]`, the best path first), optional `note`.
- Say only what the viewer is allowed to know; never name hidden records or amounts.

**In the app:** `FyConflictMessage` — a DecoratedBox block.
