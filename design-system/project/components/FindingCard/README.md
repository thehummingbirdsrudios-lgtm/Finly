# FindingCard

A finding from the rule-based exception engine: problem, possible reason, affected records, suggested action.

- Provide: `problem`, `reason`, `affected` (only records the viewer may see), `action`, `severity` (`review` or `critical`), `when`, `onReview`, `onDismiss`.
- Findings warn and suggest. They never change a record; corrections go through their own reviewed flow.

**In the app:** `FyFindingCard` — Card.
