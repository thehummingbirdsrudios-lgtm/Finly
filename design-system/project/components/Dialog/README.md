# Dialog

A short interruption for an irreversible or risky decision. Everything else uses a bottom sheet.

- Provide: `title` (a question), `body` (the consequence), `actions` (the safe choice first, the risky one last), optional `tone="danger"` and `icon`.
- No "Are you sure?" chains: one dialog, then done.

**In the app:** `FyDialog` — AlertDialog.
