# StepUpSheet

One inline check before a sensitive action: large transfer, confidential share, permission change.

- Provide: `action` (exactly what will happen), `reason` (why the check is needed), `onVerify`, `onCancel`, `onUsePin`, `failed`.
- If the check fails, nothing happens and the sheet says so.

**In the app:** `FyStepUpSheet` — showModalBottomSheet + local_auth.
