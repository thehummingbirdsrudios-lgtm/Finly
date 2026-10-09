# ADDON-16 — Universal financial accounting, edge cases and integrity specification

Received 2026-10-09, recorded verbatim below the line.

---

# FINLY — UNIVERSAL FINANCIAL ACCOUNTING, EDGE CASES & INTEGRITY SPECIFICATION

## 1. Objective

Build a complete, production-grade financial accounting engine that correctly handles real-world transactions across multiple firms, owners, partners, workers, personal accounts, funds, locations, and other dynamically created entities.

The engine must correctly calculate and preserve:

- Cash and bank balances.
- Assets, liabilities, receivables, and payables.
- Income, expenses, profits, losses, and capital.
- Owner contributions, drawings, distributions, and loans.
- Transfers between accounts, funds, people, and entities.
- Advances, reimbursements, settlements, and outstanding amounts.
- Shared expenses and inter-entity transactions.
- Inventory, purchases, sales, returns, and adjustments where supported.
- Journal entries, ledgers, trial balances, financial statements, and reconciliation.
- Transaction history, approvals, corrections, reversals, and audit records.

**Core requirement:** Finly must calculate accounting consequences from the actual transaction, the parties involved, the selected classification, the ownership and repayment arrangement, and the applicable accounting rules. It must never guess a financial relationship merely because money moved.

All people, firms, accounts, funds, locations, categories, roles, currencies, and other entities must be configurable and database-driven wherever appropriate. Avoid hardcoded assumptions about specific users, entity types, or business arrangements.

---

# 2. Fundamental Accounting Principles

### 2.1 Double-entry accounting

Every posted journal entry must balance within its applicable legal entity and accounting currency:

**Total Debits = Total Credits**

A transaction involving multiple entities may require separate balanced journals in each entity's books, connected through an explicit inter-entity relationship.

Never balance unrelated entities against one another simply to make a combined total appear correct.

### 2.2 Exact financial calculations

- Use exact decimal or integer-minor-unit representations appropriate to each currency.
- Never use binary floating-point arithmetic for financial posting.
- Define currency precision and rounding rules explicitly.
- Preserve the original amount, currency, exchange rate, converted amount, and rounding adjustment where applicable.
- Reject invalid amounts, unsupported precision, and currency mismatches unless an explicit conversion workflow exists.

### 2.3 Accounting classification

Keep these concepts separate:

1. What physically happened to the money.
2. Who owned or controlled the money before and after the transaction.
3. Which entity paid.
4. Which entity received the money.
5. Which entity benefited from the transaction.
6. Whether the transaction is income, expense, asset, liability, equity, or transfer.
7. Whether repayment is expected.
8. Who owes whom.
9. Which accounting period the transaction belongs to.
10. Whether the transaction is authorized, approved, posted, settled, reversed, or reconciled.

A single transaction may affect several of these concepts, but they must not be treated as interchangeable.

### 2.4 Economic substance over labels

A user-selected label is not sufficient to establish the correct accounting treatment.

For example, selecting “Expense” does not automatically make an amount a deductible business expense. Selecting “Own” does not automatically create a loan. A transfer does not automatically represent income or expenditure.

If the selected classification conflicts with the actual arrangement, show the conflict and require clarification or an authorized correction before posting.

### 2.5 No silent financial changes

Never silently:

- Change a transaction's classification.
- Create or remove a repayment obligation.
- Change the beneficiary or ownership of money.
- Alter another partner's capital.
- Change a posted amount or currency.
- Move an entry to another accounting period.
- Forgive or write off a debt.
- Delete a posted journal.
- Convert an expense into a loan or vice versa.
- Reconcile an unexplained difference.

Every material change must follow an explicit, authorized, auditable workflow.

---

# 3. Universal Transaction Lifecycle

Every financial operation must follow a consistent lifecycle.

1. **Initiation:** Identify the user action and intended transaction.
2. **Authentication:** Verify the user's identity and session.
3. **Authorization:** Check permissions for every affected entity and record.
4. **Input validation:** Validate parties, amounts, currency, dates, accounts, and classifications.
5. **Dependency validation:** Check related accounts, funds, entities, periods, permissions, and existing obligations.
6. **Economic classification:** Determine whether the operation is a transfer, expense, income, asset purchase, loan, repayment, contribution, distribution, correction, or another supported transaction.
7. **Impact analysis:** Calculate the expected effect on all relevant books, balances, capital, outstanding amounts, and reports.
8. **Conflict detection:** Identify duplicate submissions, insufficient funds, locked periods, concurrent changes, incompatible classifications, and invalid settlements.
9. **Confirmation:** Show the material financial consequences and obtain required confirmation or approval.
10. **Atomic posting:** Persist all required journal entries, links, and related records in one database transaction where appropriate.
11. **Integrity verification:** Ensure journals balance and financial invariants hold.
12. **Audit recording:** Record the actor, timestamp, transaction ID, classification, approvals, and relevant before/after values.
13. **Response:** Return the authoritative result from the server.
14. **Reconciliation and reporting:** Update derived views and reports using the posted source records.
15. **Correction lifecycle:** Handle any later error through an authorized reversal, adjustment, or replacement transaction.

If a required stage fails, do not leave a partially posted financial operation.

---

# 4. Complete Transaction Type Coverage

Finly must support the following transaction families where relevant to the business.

## 4.1 Cash and account movements

- Cash deposit and withdrawal.
- Bank deposit and withdrawal.
- Cash-to-bank and bank-to-cash transfers.
- Transfers between bank accounts.
- Transfers between cash boxes, safes, and other funds.
- Transfers between custodians.
- Cash handovers and receipt confirmations.
- Cash found, cash shortage, and cash overage.
- Transfers between locations.
- Restricted funds and reserved funds.
- Opening balances and authorized balance corrections.

A transfer between accounts owned by the same entity is generally not income or expense. It changes the location or form of the asset.

If money moves between different legal entities, determine whether the transaction is a loan, capital contribution, distribution, reimbursement, sale, expense settlement, or another valid arrangement.

## 4.2 Income and receipts

- Sales revenue.
- Service revenue.
- Interest income.
- Other operating and non-operating income.
- Customer advances.
- Customer deposits.
- Loan proceeds.
- Owner contributions.
- Partner contributions.
- Refunds received.
- Receivables collected.
- Income received in cash or bank.
- Income earned but not yet received, where accrual accounting is supported.

A receipt of money is not automatically income. A loan received, customer advance, owner contribution, and collection of an existing receivable have different accounting consequences.

## 4.3 Expenses and payments

- Business operating expenses.
- Personal expenses.
- Owner-related expenses.
- Employee expenses.
- Travel and transport expenses.
- Shared expenses.
- Supplier payments.
- Rent and utilities.
- Taxes and fees.
- Asset purchases.
- Prepaid expenses.
- Accrued expenses.
- Refunds and expense reversals.
- Expenses paid by a person on behalf of an entity.
- Expenses paid by one entity for another entity.

An expense paid in cash and an expense incurred but unpaid are different events. The unpaid amount may create a liability rather than reduce cash immediately.

## 4.4 Loans, advances, and debts

- Firm lends to owner.
- Owner lends to firm.
- Firm lends to another firm.
- Owner lends to another person.
- Person lends to firm.
- Employee advances.
- Salary advances.
- Customer advances.
- Supplier advances.
- Short-term and long-term loans.
- Interest-bearing and interest-free loans.
- Partial repayment.
- Full repayment.
- Interest payments.
- Debt forgiveness.
- Write-off of unrecoverable receivables.
- Loan restructuring.
- Debt reclassification with authorization.

For every obligation, store the creditor, debtor, principal, currency, origin, date, due date if applicable, repayments, outstanding balance, interest terms if relevant, status, and linked records.

## 4.5 Ownership and capital

- Owner contribution.
- Partner contribution.
- Additional capital contribution.
- Owner drawings.
- Partner drawings.
- Profit allocation.
- Loss allocation.
- Distribution of profits.
- Capital withdrawal.
- Capital transfer between partners where legally and contractually permitted.
- Capital adjustment.
- Admission or exit of a partner.
- Ownership percentage changes.
- Owner-related loans.
- Conversion of an authorized debt into capital or drawings.

Do not assume that every owner withdrawal is a business expense or that every payment to an owner is a distribution. The actual legal and economic arrangement determines the treatment.

## 4.6 Purchases, sales, and inventory

Where inventory functionality is supported:

- Purchase orders and supplier bills.
- Goods received before the bill.
- Bills received before goods.
- Partial deliveries.
- Partial invoices.
- Supplier advances.
- Customer orders and deposits.
- Partial sales.
- Sales returns.
- Purchase returns.
- Damaged or missing stock.
- Inventory adjustments.
- Cost of goods sold.
- Stock transfers between locations.
- Inventory valuation.
- Taxes and discounts.
- Credit notes and debit notes.

Do not record a purchase, payment, inventory receipt, and supplier liability as four unrelated expenses. Link them to the same underlying purchase workflow and recognize each financial effect at the correct stage.

## 4.7 Inter-entity transactions

- Firm-to-owner.
- Owner-to-firm.
- Firm-to-firm.
- Firm-to-worker.
- Worker-to-firm.
- Owner-to-person.
- Person-to-owner.
- Shared expenses.
- Reimbursements.
- Loans between entities.
- Transfers through an intermediary.
- Custody transfers.
- Cross-entity debt settlement.
- Cross-entity adjustments.

Every inter-entity transaction must identify the actual payer, recipient, beneficiary, asset custodian, debtor, creditor, and expense-bearing entity where applicable.

---

# 5. Own, Expense, Transfer, and Repayable Classification Rules

These classifications must be available where applicable, without forcing every transaction into the same model.

## 5.1 Own

“Own” is a business-defined classification whose precise meaning must be documented in Finly. It must not automatically mean income, capital, drawings, or a loan.

Before posting, determine the actual economic event:

- Is ownership changing?
- Is the recipient receiving money for personal use?
- Is the recipient expected to repay it?
- Is the amount an owner's distribution or withdrawal?
- Is the amount merely moving between accounts?
- Does the transaction create or settle a liability?

If the word “Own” is ambiguous for a particular workflow, display the exact intended accounting treatment rather than relying on the label alone.

## 5.2 Expense

For an expense, identify:

- Paying entity.
- Expense-bearing entity.
- Expense beneficiary.
- Category.
- Amount and currency.
- Payment source.
- Whether it has already been recognized.
- Whether another party owes reimbursement.
- Whether the expense is final or provisional.
- Whether supporting evidence is required.

If a person pays a firm's expense from personal funds, the firm may owe that person reimbursement. If a firm pays a person's genuine personal expense, it may be a drawing, loan, benefit, or another owner-related treatment rather than an ordinary business expense.

## 5.3 Transfer

A transfer moves money between accounts or custodians. It does not automatically create income, expense, profit, or loss.

For transfers involving multiple entities, determine the appropriate relationship and create the required linked entries in each entity's books.

## 5.4 Repayable

A repayable amount must identify the actual debtor and creditor.

- Creditor records a receivable.
- Debtor records a payable.
- Both records link to the same obligation.
- Repayments reduce the outstanding principal appropriately.
- Interest and fees are separate components where applicable.
- Forgiveness, write-off, and conversion require explicit authorized treatment.

Do not infer a loan merely because one party received money.

---

# 6. Comprehensive Edge Cases and Expected Behavior

## 6.1 Amount and input problems

| Scenario | Required behavior |
|---|---|
| Amount is zero | Reject unless a zero-value record is explicitly supported for a legitimate purpose. |
| Amount is negative | Reject for ordinary transactions; use a dedicated reversal or adjustment workflow. |
| Amount exceeds allowed precision | Apply documented currency precision rules or require correction. |
| Amount is extremely large | Check limits, arithmetic safety, account limits, and database constraints. |
| Amount is greater than available funds | Reject or require an authorized overdraft/credit arrangement. |
| Currency is missing | Require a currency. |
| Currencies differ | Require an explicit exchange-rate and conversion workflow. |
| Exchange rate is missing | Reject foreign-currency posting unless a permitted rate source or approved manual rate is supplied. |
| Rounding creates a difference | Apply documented rounding rules and record authorized adjustments explicitly. |
| Amount changes after preview | Recalculate the entire impact and require renewed confirmation when material. |
| Decimal or formatted text is malformed | Reject without partially saving anything. |
| Duplicate amount is entered intentionally | Allow it if it is a legitimate separate transaction; never deduplicate by amount alone. |

## 6.2 Account and fund problems

| Scenario | Required behavior |
|---|---|
| Source account does not exist | Reject. |
| Destination account does not exist | Reject or require authorized account creation before posting. |
| Account is archived | Reject new transactions unless a specifically authorized historical workflow permits them. |
| Account is locked | Reject or route to the authorized unlock/approval process. |
| Funds are insufficient | Reject unless an authorized overdraft or credit rule permits the operation. |
| Funds are reserved | Do not treat reserved funds as freely available. |
| Source and destination are the same account | Reject a meaningless transfer or use a specifically defined adjustment operation. |
| Account ownership changes | Preserve historical ownership and apply new ownership only according to the effective date and authorized process. |
| Fund is restricted | Prevent unauthorized use and show the restriction. |
| Cash custodian differs from account owner | Track custody separately from ownership. |
| Account balance differs from ledger | Block unsafe posting if integrity is compromised and initiate reconciliation. |

## 6.3 Party and ownership problems

| Scenario | Required behavior |
|---|---|
| Payer and beneficiary differ | Record both separately. |
| Owner transfers firm money to a worker | Determine whether it is an expense, advance, loan, reimbursement, distribution, or other valid treatment. |
| Owner transfers money to another firm | Determine the actual inter-entity relationship. |
| Receiver is an intermediary | Record custody and the actual ultimate recipient where required. |
| Receiver does not owe the intermediary | Do not create an artificial debt to the intermediary. |
| Receiver owes the original firm | Record the obligation to the firm, not automatically to the intermediary. |
| One party belongs to multiple entities | Require explicit selection of the relevant entity and capacity. |
| Ownership or partnership share is ambiguous | Require clarification before making ownership-related postings. |
| A partner disputes a transaction | Preserve the original record and route it through the approved dispute process. |
| Entity is deleted or archived after posting | Preserve historical references and prohibit broken ledger relationships. |
| Person changes role | Do not rewrite the historical economic relationship automatically. |

## 6.4 Expense classification problems

| Scenario | Required behavior |
|---|---|
| Personal expense paid from firm money | Require the appropriate withdrawal, receivable, benefit, or other supported treatment. |
| Firm expense paid from personal money | Record the expense and any actual reimbursement obligation. |
| Expense belongs to another firm | Record the correct beneficiary and any inter-entity settlement. |
| Shared expense | Allocate only using explicitly selected amounts or an approved allocation method. |
| Expense has no category | Require a category if the workflow requires one. |
| Expense category is archived | Preserve historical use; prevent invalid new selection. |
| Expense is paid twice | Detect likely duplicate and warn; allow confirmed legitimate payments. |
| Expense was already reimbursed | Prevent duplicate reimbursement. |
| Expense was already posted | Do not post it again merely because a payment is made. |
| Expense is refunded | Record the refund against the original expense or an appropriate adjustment. |
| Expense is disputed | Preserve its status and supporting evidence; do not silently remove it. |
| Expense is not tax-deductible or tax treatment is uncertain | Do not claim deductibility without the appropriate tax configuration and evidence. |

## 6.5 Receivable and payable problems

| Scenario | Required behavior |
|---|---|
| Receivable is created | Record the corresponding debtor relationship and underlying event. |
| Payable is created | Record the corresponding creditor relationship and underlying event. |
| Only one side of a linked debt is saved | Roll back the transaction or use a formally designed pending workflow that cannot be mistaken for a posted obligation. |
| Partial repayment occurs | Reduce the outstanding amount by the settled component only. |
| Full repayment occurs | Mark the obligation settled after successful posting. |
| Repayment exceeds the outstanding amount | Reject or explicitly classify the excess as a separate transaction. |
| Repayment is duplicated | Detect the duplicate idempotency key or settlement reference. |
| Debt is forgiven | Record an authorized forgiveness or write-off with the proper accounting treatment. |
| Debt is written off | Preserve the original receivable and record the write-off separately. |
| Debt is disputed | Preserve the outstanding record and mark the dispute without silently deleting the debt. |
| Due date passes | Update overdue status without changing principal automatically. |
| Creditor and debtor disagree on balance | Flag the discrepancy and reconcile linked records. |
| Debt is converted into capital | Require explicit approval and a separate authorized conversion entry. |
| Debt is reclassified | Preserve the original entry and use a controlled reclassification process. |

## 6.6 Transfers and handovers

| Scenario | Required behavior |
|---|---|
| Sender submits a transfer twice | Use idempotency controls to prevent duplicate posting. |
| Receiver has not acknowledged a required handover | Keep it pending and do not show it as completed. |
| Receiver rejects the handover | Preserve the rejection and follow the return or dispute workflow. |
| Sender and receiver report different amounts | Flag the mismatch and prevent finalization under the relevant policy. |
| Cash is handed over but not yet deposited | Track custody separately from bank deposit. |
| Transfer passes through multiple people | Record each custody movement without inventing debts. |
| Transfer is cancelled before posting | Cancel it without ledger effects. |
| Transfer is cancelled after posting | Use an authorized reversal or compensating transaction. |
| Transfer is delayed | Keep pending and completed states distinct. |
| Money is lost during custody | Record the shortage and investigate; do not automatically charge an individual without the required determination. |

## 6.7 Shared expenses and allocations

| Scenario | Required behavior |
|---|---|
| One expense belongs to multiple entities | Record explicit allocations. |
| Allocation total is less than the expense | Require the remaining amount to be allocated or explicitly left unallocated under a supported workflow. |
| Allocation total exceeds the expense | Reject. |
| Allocation percentage and amount disagree | Recalculate using the documented allocation method and show the result. |
| One participant is unavailable | Preserve the unresolved allocation and prevent invalid finalization where required. |
| A participant disputes their share | Preserve the original allocation and use an authorized adjustment workflow. |
| One entity pays on behalf of several entities | Record the payer separately from the entities bearing the expense and the actual settlement obligations. |
| Shared expense is partially refunded | Allocate the refund consistently with the original allocation or an explicitly approved adjustment. |
| One entity pays another entity's share | Record the resulting payable/receivable if an obligation exists. |

## 6.8 Dates and accounting periods

| Scenario | Required behavior |
|---|---|
| Transaction date is in the future | Allow only where the workflow explicitly supports scheduled or future-dated entries. |
| Transaction is entered late | Preserve both the actual transaction date and the recording timestamp. |
| Date is invalid | Reject. |
| Time zone changes the displayed date | Store timestamps consistently and preserve the correct business accounting date. |
| Accounting period is closed | Reject ordinary posting to that period; use the authorized adjustment process. |
| User attempts to backdate | Enforce permissions, materiality controls, and audit history. |
| Transaction is entered twice on different dates | Investigate likely duplication without assuming equal amounts are duplicates. |
| Financial year changes | Apply configured year-end and opening-balance rules. |
| Opening balance is imported | Validate it against the approved migration or opening-balance reconciliation. |
| A period is reopened | Require authorization, preserve the original close, and record all resulting changes. |

## 6.9 Corrections, reversals, and cancellations

| Scenario | Required behavior |
|---|---|
| Draft is wrong | Permit editing according to permissions before posting. |
| Posted amount is wrong | Reverse or adjust through an authorized correction workflow. |
| Posted classification is wrong | Preserve the original journal and record the correction. |
| Posted transaction must be cancelled | Use a compensating reversal; do not erase history. |
| Only one related entry needs correction | Analyze all dependencies and correct the complete accounting relationship. |
| Original transaction has already been settled | Recalculate settlement consequences before permitting correction. |
| Original transaction belongs to a closed period | Use the authorized current-period adjustment or reopening process. |
| Reversal is attempted twice | Prevent duplicate reversal. |
| Reversal exceeds the original amount | Reject. |
| Correction would create a negative or invalid balance | Block posting or require a valid approved treatment. |

---

# 7. Database, Concurrency, and Transaction Integrity

Finly is an online, multi-user finance application. Multiple users may view or modify the same financial records simultaneously.

The database and backend must enforce financial integrity, not merely rely on Flutter UI validation.

## 7.1 Atomicity

A financial operation involving multiple journal lines, linked debts, allocations, or settlement records must commit all required components together or roll back together.

Do not allow a transfer to reduce the source without recording the destination, or create a receivable without the corresponding payable where both are required.

## 7.2 Deadlocks

Deadlocks can occur when concurrent transactions acquire locks in conflicting orders.

- Define a consistent lock-acquisition order for affected accounts, entities, obligations, and journal records.
- Keep database transactions short.
- Avoid unnecessary network calls while holding locks.
- Detect deadlock errors and safely retry eligible operations.
- Limit retry attempts and apply backoff.
- Never retry a financial posting without idempotency protection.
- Record and investigate repeated deadlocks.

A deadlock must not cause duplicate posting or partial financial updates.

## 7.3 Concurrent balance changes

Example: Two users try to spend ₹8,000 from the same account with only ₹10,000 available.

The backend must serialize or otherwise safely coordinate the balance-affecting operations. It must not approve both simply because each request initially observed ₹10,000.

Use appropriate row locking, conditional updates, serializable transactions, or another proven concurrency-control design.

## 7.4 Duplicate requests and network retries

A user may tap twice, refresh a page, lose connectivity after submitting, or retry because the response was delayed.

- Assign a unique idempotency key to each logical posting request.
- Enforce uniqueness in the database.
- Return the original result for a recognized duplicate request.
- Do not rely only on button disabling or client-side checks.
- Distinguish a failed request from a committed request whose response was lost.

## 7.5 Isolation and consistency

Select transaction isolation and locking strategies based on the actual invariants and queries.

Test concurrent posting, settlement, reversals, account locking, permission changes, and period closing.

Avoid both unsafe race conditions and excessive locking that makes the app slow.

## 7.6 Database constraints

Enforce appropriate constraints for:

- Required fields and valid status transitions.
- Foreign keys and entity ownership.
- Unique transaction and idempotency identifiers.
- Valid currency and precision.
- Balanced journal postings through a controlled posting process.
- Positive settlement amounts and settlement limits.
- Allocation totals and supported rounding.
- Valid relationships between receivables and payables.
- Audit record consistency.
- Referential integrity for archived and historical records.

Do not depend exclusively on frontend validation.

## 7.7 Online-only behavior

Finly uses an online PostgreSQL-backed architecture, such as the existing Supabase connection or another suitable production-grade service.

- No local financial database.
- No offline financial posting.
- No offline transaction queue.
- No local source of truth for financial balances.
- Do not display an operation as posted until the server confirms it.
- If a request times out, check its authoritative server-side status before resubmitting.
- If the server or network is unavailable, explain that the operation could not be confirmed and allow safe retry.
- Refresh financial balances and records from authoritative server data.

Non-sensitive UI preferences may be handled separately, but must never become an alternative financial ledger.

---

# 8. Security, Permissions, and Privacy

## 8.1 Authorization

Every operation must validate permissions against the actual affected entity and record.

Check authorization for:

- Viewing a balance.
- Viewing transaction details.
- Creating or editing transactions.
- Posting, approving, reversing, or settling.
- Changing account ownership.
- Managing users and roles.
- Changing classifications or financial periods.
- Exporting or sharing financial information.
- Accessing another entity's personal or business records.

The UI must reflect permissions, but the backend and database remain the security boundaries.

## 8.2 Permission changes during an operation

If a user's access is revoked or materially changed while a transaction is being processed, the backend must apply a documented authorization policy at the authoritative posting boundary.

Do not trust a stale permission decision stored in the mobile client.

## 8.3 Confidential information

- Return only fields the user is authorized to access.
- Filter search results, autocomplete, totals, charts, exports, and reports by permissions.
- Do not reveal hidden financial information through error messages or aggregate totals.
- Protect credentials, session tokens, encryption keys, and sensitive personal information.
- Do not place production secrets in source code, logs, APKs, or Git.
- Audit sensitive exports, shares, role changes, and financial administration.

## 8.4 Audit trail

Record material actions with the actor, timestamp, transaction identifier, affected entity, action type, and relevant before/after values.

Protect audit records from unauthorized alteration. Corrections must append the required history rather than erase the original financial event.

---

# 9. Reconciliation and Financial Integrity Monitoring

Finly must regularly validate its accounting data.

Check that:

1. Every posted journal balances.
2. Account balances agree with their underlying posted ledger entries.
3. Linked receivables and payables are consistent.
4. Settlements do not exceed obligations.
5. Allocations reconcile to their parent transaction.
6. Transfers have all required entries.
7. Reversals correctly offset the intended original entries.
8. Opening and closing balances reconcile.
9. Cash custody balances agree with recorded movements.
10. Reports agree with their authoritative ledger sources.
11. No posted entry references a missing entity or account.
12. No duplicate posting exists for a single logical operation.

When a mismatch is detected:

- Identify the affected records.
- Preserve the evidence.
- Flag the affected account, entity, or transaction.
- Prevent unsafe operations where necessary.
- Notify authorized users.
- Provide a reconciliation workflow.
- Correct the issue only through an authorized, auditable process.

Never silently change a ledger balance to make a discrepancy disappear.

---

# 10. Financial Reports and Consequence Propagation

Every posted transaction must propagate correctly to all relevant views.

Depending on the transaction, update:

- Cash and bank balances.
- Account and fund ledgers.
- General ledger.
- Trial balance.
- Income and expense reports.
- Profit and loss statement.
- Balance sheet.
- Cash-flow statement where supported.
- Receivables and payables.
- Outstanding and overdue reports.
- Owner and partner capital accounts.
- Inter-entity balances.
- Expense allocations.
- Inventory and cost of goods sold where supported.
- Reconciliation reports.
- Audit history.
- Authorized dashboards and notifications.

Not every transaction affects every report. For example, collecting an existing receivable changes cash and receivables but does not automatically create new revenue.

Derived totals must come from authoritative posted entries or correctly maintained, verifiable projections—not independent hardcoded calculations.

---

# 11. Failure Handling and Recovery

For every financial operation, test failures at each stage:

- Authentication failure.
- Authorization failure.
- Validation failure.
- Missing or archived dependency.
- Insufficient funds.
- Concurrent update.
- Deadlock.
- Database constraint violation.
- Database timeout.
- Network timeout.
- Server restart.
- Duplicate request.
- Partial external-service failure.
- Audit persistence failure.
- Report generation failure.
- Permission revocation.
- Period closure during processing.

Define which failures require full rollback, which may leave a clearly identified pending workflow, and which can be retried safely.

Never show “successful” merely because the user tapped a button. The UI must distinguish draft, pending, processing, posted, failed, reversed, settled, and reconciled states as appropriate.

If the posting result is uncertain due to a timeout, retrieve the authoritative operation status before retrying.

---

# 12. Testing Matrix

Test every supported transaction family against the following dimensions.

**Amounts:** zero, negative, minimum, maximum, decimal precision, rounding, and very large values.

**Accounts:** valid, missing, locked, archived, insufficient balance, reserved balance, and ownership changes.

**Parties:** same person, different people, owner, partner, worker, firm, multiple entities, intermediary, and external counterparty.

**Classifications:** Own, Expense, transfer, income, receivable, payable, withdrawal, contribution, and all supported repayment arrangements.

**Lifecycle:** draft, confirm, approve, post, partially settle, fully settle, reverse, correct, reconcile, archive, and close period.

**Concurrency:** duplicate taps, duplicate requests, simultaneous withdrawals, concurrent settlements, deadlocks, permission changes, and account locking.

**Network:** slow response, lost response, disconnected server, timeout after commit, retry, and reconnect.

**Security:** unauthorized account, cross-entity access, restricted fields, revoked permissions, expired session, and unauthorized export.

**Data integrity:** missing journal lines, duplicate entries, broken links, incorrect allocations, unbalanced journals, invalid settlements, and stale reports.

For every test case, verify:

`INPUT → VALIDATION → AUTHORIZATION → DEPENDENCIES → IMPACT ANALYSIS → CONFLICT CHECK → JOURNAL CALCULATION → ATOMIC POSTING OR ROLLBACK → AUDIT → REPORTS → USER FEEDBACK`

Do not claim that a test passed unless it was actually executed and its result verified.

---

# 13. Accounting Standards, Tax, and Jurisdiction

Finly must support configurable accounting policies and reporting requirements appropriate to the jurisdictions and business entities using the app.

Do not hardcode universal tax rates, deductibility assumptions, statutory deadlines, or legal conclusions.

Where statutory or tax treatment is required:

- Determine the relevant jurisdiction and entity type.
- Use verified, current rules and the correct effective dates.
- Preserve source documents and supporting evidence.
- Separate bookkeeping classifications from tax treatment.
- Support accountant review and authorized adjustments.
- Document unresolved compliance dependencies.

The accounting engine must not claim that a classification is legally compliant or tax-deductible solely because a user selected it.

---

# 14. Architecture and Engineering Requirements

Implement these rules across the complete system.

- Use clear architectural boundaries between UI, application logic, domain rules, financial posting, data access, and integrations.
- Keep financial calculations deterministic, testable, and independent of UI widgets.
- Centralize posting and classification rules so screens cannot implement contradictory accounting behavior.
- Use PostgreSQL transactions, constraints, indexes, and appropriate concurrency control.
- Use server-side authorization and secure database access.
- Design for multiple concurrent users and changing permissions.
- Keep transactions short and optimize queries based on measured workloads.
- Avoid N+1 queries, unbounded lists, repeated expensive calculations, and unnecessary network requests.
- Use pagination, efficient indexes, and suitable cached projections where appropriate, without allowing stale financial data to be treated as authoritative.
- Use versioned database migrations and reproducible environments.
- Back up data and test restoration procedures.
- Use structured, privacy-safe logs and production monitoring.
- Version accounting rules and migration logic when behavior changes.
- Maintain automated unit, integration, regression, concurrency, authorization, and end-to-end tests.
- Keep financial invariants documented and enforced centrally.
- Never use mock balances, fake success responses, or placeholder posting logic in production paths.

---

# 15. Required Deliverables

Before declaring the financial engine production-ready, deliver:

1. A complete accounting domain model and data dictionary.
2. An entity relationship diagram and dependency map.
3. A transaction classification and consequence matrix.
4. Documented journal-entry rules for every supported transaction family.
5. A complete receivable/payable and settlement model.
6. An edge-case and error-handling catalogue.
7. A permissions and data-confidentiality matrix.
8. A database integrity and concurrency strategy.
9. Automated financial invariant tests.
10. A concurrency and duplicate-request test suite.
11. Reconciliation and audit mechanisms.
12. Financial report validation tests.
13. Backup and recovery verification.
14. A list of unsupported cases and unresolved accounting decisions.
15. Verified deployment and operational documentation.

## Final Acceptance Rule

Finly must never treat a financial transaction as merely a form submission that updates a balance.

Every transaction must have a defined economic meaning, authorized parties, validated dependencies, correct journal consequences, safe atomic persistence, complete audit history, and consistent reporting.

**Priority order:**

1. Financial correctness.
2. Data integrity.
3. Security and privacy.
4. Reliable multi-user operation.
5. Correct accounting consequences.
6. Performance and scalability.
7. Maintainability and extensibility.
8. UI/UX quality.

Build and verify the entire financial lifecycle, including valid scenarios, invalid scenarios, ambiguous arrangements, failures, concurrency, corrections, and recovery. Where the actual accounting treatment is unclear, ask for a decision or require authorized review rather than inventing a rule.
