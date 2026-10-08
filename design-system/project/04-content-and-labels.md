# Content and labels

## Message patterns

Use the spec's own sentences; vary them only to name the specific thing.

| Situation | Message |
|---|---|
| Missing destination | Please select where the money is going. |
| Network failure on save | Transaction could not be saved. Please check your internet connection and try again. |
| Possible duplicate | This transaction appears to be a duplicate. Please review it before saving. |
| No permission | You do not have permission to view this account. |
| Insufficient balance | This transfer cannot be completed because the available balance is insufficient. |
| Conflict | Cannot change this transaction. This change would create an inconsistency between the fund balance and the account balance. |
| Unknown commit outcome | Still checking whether your entry was posted. We will not post it twice. |
| Empty list | No transactions yet. Add your first money movement. / No outstanding amount. / No bank accounts added yet. / No personal expenses recorded this month. |
| Worker blind entry saved | Entry recorded successfully. |
| Expired secure document | This secure document has expired. |
| Revoked secure document | This document is no longer available. |
| Generic lock-screen notice | A financial update requires your attention. |

Error formula: **what happened + what to do**, without revealing hidden data. Conflict formula: **what conflicts, where, why, what it would affect, how to fix it.**

## Dates, times and numbers

- In the app: `08 Oct 2026 · 10:15 AM`; "Today" and "Yesterday" for recent rows; sticky date headers in lists.
- In messages and PDFs: `08-10-2026`, with the day (`Thursday`) and time (`10:15 AM`).
- 12-hour clock with AM/PM. Server time is the truth; the device time is kept only as metadata.
- Large amounts are always written in full with Indian grouping (`₹12,00,000`); "lakh" and "crore" appear only in the rounded and range visibility modes.
- Transaction IDs read as `TX-20261008-001245` in the `figure` style.

## Display labels

The owner can rename what things are called. A label changes the words on screen, in proofs and in search; it never changes accounting, permissions or IDs.

| Concept | Default label | Common custom label |
|---|---|---|
| Money in to a place | Money in / Credit | Avak |
| Money out of a place | Money out / Debit | Javak |
| Vault | Vault | Tijori |
| Fund | Fund | Hissa |
| Account / money location | Account | Khata |
| Wallet | Wallet | Rokda Wallet |
| Worker | Worker | Operator |

Search matches the default label, the custom label and the Hindi and Gujarati terms for each.

## Languages

- English, Hindi and Gujarati from translation keys; no sentence is assembled from fragments.
- Mixed scripts sit on one line comfortably (Mukta and Mukta Vaani share one design).
- Allow about 40% text expansion. Buttons wrap to two lines before they truncate; amounts never truncate.
- Digits stay Western Arabic (0–9) in every language, with Indian grouping, so amounts read the same across the family.
