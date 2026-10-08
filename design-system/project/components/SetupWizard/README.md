# SetupWizard

First-time setup, one step per screen, showing only the steps this person and this system still need.

- Provide: `steps` (`[{id, title, description, optional}]`, already chosen by the server from the configuration and the person's role), `current`, `saved` (autosave status), `resumed`, `nextLabel`, `nextDisabled`, `onBack`, `onNext`, `onSkip`, and the step's form as `children`.
- Owner and Super Admin: account and security → lock this phone → people and users → firms → money places and funds → opening balances → permissions → preferences (optional) → review. A worker: change the temporary password → lock this phone → done.
- Every step validates before Next and autosaves its answers; nothing financial is posted until the review step confirms it, and every save is idempotent, so resuming after an interruption never duplicates a firm, a person or an opening balance.
- Only safe, optional steps offer "Skip for now"; security steps the policy requires cannot be skipped.
- The progress bar marks finished steps in `brand` and the current one in `accent`; screen readers hear "Step 5 of 9, Firms, current".

**In the app:** `SetupWizardPage` — a PageView of step widgets driven by a server-chosen step list, with autosaved drafts.
