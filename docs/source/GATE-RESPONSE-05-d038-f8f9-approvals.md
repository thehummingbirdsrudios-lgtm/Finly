# GATE-RESPONSE-05 — D-038 confirmed; F8/F9 rules modified; owner-benefit approval

Received 2026-10-09 in reply to the session report that asked for three decisions (D-038 Super Admin access, the
three F8/F9 points in [accounting/F8-F9-model.md §6](../accounting/F8-F9-model.md)). Recorded verbatim below the line.
The same message carried [ADDON-19](ADDON-19-master-continuation.md) and pointed at the file recorded as
[ADDON-20](ADDON-20-customizable-ledger-rough-hisab.md); it ended with "Contiue start completing the mobile app".

---

1. **Super Admin access (D-038): CONFIRMED.** Platform administration alone must not grant access to a firm's private financial books. Firm owners must receive access through explicit entity-scoped owner roles. Any exceptional support access must be explicitly authorized, limited in scope and duration, and audited. Do not silently impersonate owners or business users.
2. **F8/F9 — Firm expense versus owner personal income: MODIFY THE RULE.** A firm's expense must not automatically become income in the owner's personal books. The accounting treatment on each side must reflect the actual nature of the transaction, including remuneration, reimbursement, drawings, distribution, loan, personal benefit, or another valid category. Preserve independently selected book-side classifications, but validate them against the transaction's economic substance. Flag ambiguous or inconsistent cases for resolution.
3. **F8/F9 — Non-repayable money transfers: MODIFY THE RULE.** A transfer that is not repayable and is not classified as drawings or capital must not automatically be treated as the giver's expense. Require the transaction's actual purpose, such as a gift, donation, remuneration, distribution, business expense, or other supported category. Validate the classification against the entity type and accounting rules. Do not automatically classify a gift or an owner payment as a business expense.
4. **Owner-benefit expense approval: CONFIGURABLE CONTROL.** Provide entity-specific approval policies for expenses benefiting an owner. Require independent approval for personal-benefit, related-party, or high-value transactions where the entity's policy demands it. Prevent self-approval when independent approval is required. Support configured thresholds and an audited alternative workflow for a single-owner business or when no other owner is available.
5. Preserve transaction traceability between the firm's books and the owner's personal books without duplicating the underlying financial movement or automatically creating income, debt, capital, or expense classifications that the actual transaction does not support.
