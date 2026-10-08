# MASTER ACCOUNTING ENGINE
## COMPLETE ACCOUNTING, LEDGER, JOURNAL, DEBIT/CREDIT, VALUE FLOW & GOLDEN RULES

Add this as the **core accounting engine specification** of the finance application.

This is not only a UI requirement.

These rules must control the underlying:

- Accounting engine
- Double-entry engine
- Journal engine
- General ledger
- Sub-ledgers
- Accounts
- Account balances
- Receivables
- Payables
- Owner balances
- Partner balances
- Worker balances
- Inter-firm balances
- Loans
- Advances
- Capital
- Withdrawals
- Income
- Expenses
- Assets
- Inventory
- Tax
- Settlements
- Reconciliation
- Period closing
- Opening balances
- Corrections
- Reversals
- Audit trail
- Reporting

The system must be designed as a proper accounting engine, while still keeping the application's simple business-language transaction experience.

---

# 1. CORE ACCOUNTING PRINCIPLE

The accounting engine must always maintain:

**ASSETS = LIABILITIES + EQUITY**

Expanded:

**ASSETS = LIABILITIES + CAPITAL + RETAINED EARNINGS + INCOME − EXPENSES − DRAWINGS**

Every accounting event must preserve the accounting equation.

No balance may change without an explainable accounting event.

---

# 2. DOUBLE-ENTRY RULE

Every posted journal must satisfy:

**TOTAL DEBIT = TOTAL CREDIT**

A journal may contain:

- One debit + one credit
- One debit + multiple credits
- Multiple debits + one credit
- Multiple debits + multiple credits

But the final posted journal must always balance.

If:

**Debit ≠ Credit**

the transaction must not be posted.

---

# 3. THREE TRADITIONAL GOLDEN RULES

The system should understand the traditional accounting rules.

## Personal Account

**Debit the receiver.**

**Credit the giver.**

Example:

Person receives money → Debit person.

Person gives money → Credit person.

---

## Real Account

**Debit what comes in.**

**Credit what goes out.**

Example:

Cash comes in → Debit Cash.

Cash goes out → Credit Cash.

Machine comes in → Debit Machine.

Machine goes out → Credit Machine.

---

## Nominal Account

**Debit all expenses and losses.**

**Credit all incomes and gains.**

Example:

Rent Expense → Debit.

Travel Expense → Debit.

Salary Expense → Debit.

Sales Income → Credit.

Interest Income → Credit.

---

# 4. MODERN ACCOUNT CLASSIFICATION

The computational accounting engine must use account classification.

| Account Type | Increase | Decrease | Normal Balance |
|---|---|---|---|
| Asset | Debit | Credit | Debit |
| Contra Asset | Credit | Debit | Credit |
| Liability | Credit | Debit | Credit |
| Equity | Credit | Debit | Credit |
| Revenue | Credit | Debit | Credit |
| Expense | Debit | Credit | Debit |
| Drawings | Debit | Credit | Debit |
| COGS | Debit | Credit | Debit |

The system must know the account type before determining the accounting effect.

---

# 5. ASSET ACCOUNTS

Examples:

- Cash
- Bank
- UPI
- Wallet
- Accounts Receivable
- Inventory
- Employee Advance
- Supplier Advance
- Owner Receivable
- Partner Receivable
- Inter-firm Receivable
- Loan Receivable
- Prepaid Expense
- Security Deposit
- Fixed Assets
- Machine
- Laptop
- Furniture
- Vehicle
- Building
- Land
- Other Assets

Normal balance:

**DEBIT**

Asset increases → Debit.

Asset decreases → Credit.

---

# 6. CONTRA-ASSET ACCOUNTS

These reduce asset values.

Examples:

- Accumulated Depreciation
- Allowance for Doubtful Receivables
- Other Contra Assets

Normal balance:

**CREDIT**

Example:

Asset cost = ₹10,00,000

Accumulated depreciation = ₹2,00,000

Net book value = ₹8,00,000

---

# 7. LIABILITY ACCOUNTS

Examples:

- Accounts Payable
- Supplier Payable
- Worker Payable
- Salary Payable
- Owner Payable
- Partner Payable
- Inter-firm Payable
- Loan Payable
- Bank Loan
- Credit Card Payable
- GST Payable
- TDS Payable
- Customer Advance
- Other Liability

Normal balance:

**CREDIT**

Liability increases → Credit.

Liability decreases → Debit.

---

# 8. EQUITY / CAPITAL ACCOUNTS

Examples:

- Owner Capital
- Partner Capital
- Share Capital
- Retained Earnings
- Reserves
- Other Equity

Normal balance:

**CREDIT**

Capital introduced → Credit.

Capital withdrawn → Debit.

---

# 9. DRAWINGS / OWNER WITHDRAWAL

Owner taking firm money for personal use is not automatically an operating expense.

Normally represent it as:

- Drawings
- Owner Withdrawal
- Owner Receivable
- Appropriate partner withdrawal account

Example:

Owner takes ₹30,000 personally.

**Dr Owner Drawings ₹30,000**

**Cr Cash ₹30,000**

Do not classify this as normal business expense unless there is a specific valid accounting reason.

---

# 10. REVENUE / INCOME ACCOUNTS

Examples:

- Sales
- Service Revenue
- Commission
- Brokerage
- Interest Income
- Rental Income
- Other Operating Income
- Other Income
- Gain on Asset Sale
- Miscellaneous Income

Normal balance:

**CREDIT**

Revenue increases → Credit.

Revenue reversal → Debit.

---

# 11. EXPENSE ACCOUNTS

Examples:

- Travel
- Hotel
- Food
- Petrol
- Transport
- Rent
- Salary
- Labour
- Electricity
- Internet
- Marketing
- Professional Fees
- Insurance
- Repairs
- Bank Charges
- Depreciation
- Interest Expense
- Tax Expense
- Other Expenses

Normal balance:

**DEBIT**

Expense increases → Debit.

Expense reversal → Credit.

---

# 12. COGS / COST OF SALES

COGS is normally an expense/cost account.

Normal balance:

**DEBIT**

Inventory purchase:

Dr Inventory

Cr Cash/Payable

When inventory is sold under perpetual inventory accounting:

Dr Cost of Goods Sold

Cr Inventory

Sales transaction separately:

Dr Cash/Receivable

Cr Sales Revenue

The system must not confuse sales revenue with inventory cost.

---

# 13. CASH ACCOUNT RULES

Cash is an asset.

Normal balance:

**DEBIT**

Cash received:

**Dr Cash**

Cash paid:

**Cr Cash**

Cash movement must always have an explanation.

The system must not allow unexplained cash disappearance.

---

# 14. BANK ACCOUNT RULES

Bank is normally an asset account.

Money deposited:

**Dr Bank**

Money withdrawn:

**Cr Bank**

Bank charges:

**Dr Bank Charges Expense**

**Cr Bank**

Bank interest received:

**Dr Bank**

**Cr Interest Income**

Bank balance must be reconcilable with the external bank statement.

---

# 15. RECEIVABLE RULE

A receivable means someone owes the business.

Examples:

- Customer
- Owner
- Worker
- Partner
- Another firm
- Loan borrower
- Other entity

Receivable is an asset.

Normal balance:

**DEBIT**

Receivable created → Debit.

Receivable collected → Credit.

---

# 16. PAYABLE RULE

A payable means the business owes someone.

Examples:

- Supplier
- Owner
- Worker
- Partner
- Another firm
- Bank
- Tax authority

Payable is a liability.

Normal balance:

**CREDIT**

Payable created → Credit.

Payable settled → Debit.

---

# 17. BILL RECEIVED BUT NOT PAID

Under accrual accounting:

Example:

Supplier bill = ₹20,000

**Dr Expense / Inventory / Asset ₹20,000**

**Cr Supplier Payable ₹20,000**

No cash has moved yet.

Later payment:

**Dr Supplier Payable ₹20,000**

**Cr Bank/Cash ₹20,000**

Do NOT record the expense again when paying the bill.

---

# 18. PAYMENT MUST NOT CREATE A SECOND EXPENSE

If the expense already exists:

Bill:

Dr Expense ₹10,000

Cr Payable ₹10,000

Payment:

Dr Payable ₹10,000

Cr Bank ₹10,000

Final expense remains:

**₹10,000**

Not ₹20,000.

---

# 19. ADVANCE PAID

An advance is not automatically an expense.

Example:

Firm gives worker ₹50,000 advance.

**Dr Worker Advance ₹50,000**

**Cr Cash ₹50,000**

Worker later uses ₹35,000 for approved firm expenses:

**Dr Business Expense ₹35,000**

**Cr Worker Advance ₹35,000**

Remaining:

₹15,000

Worker returns ₹15,000:

**Dr Cash ₹15,000**

**Cr Worker Advance ₹15,000**

Advance closes to zero.

---

# 20. ADVANCE RECEIVED

Money received before the business earns the related revenue can be treated as an advance/liability.

Example:

Customer pays ₹50,000 advance.

**Dr Cash ₹50,000**

**Cr Customer Advance / Unearned Revenue ₹50,000**

When revenue is recognized:

**Dr Customer Advance**

**Cr Revenue**

Do not automatically classify every advance receipt as income.

---

# 21. LOAN RECEIVABLE — FIRM GIVES LOAN

If the firm gives a loan, the principal is an asset.

Example:

Firm gives Worker ₹1,00,000 loan.

**Dr Worker Loan Receivable ₹1,00,000**

**Cr Cash ₹1,00,000**

Worker repays ₹20,000 principal:

**Dr Cash ₹20,000**

**Cr Worker Loan Receivable ₹20,000**

---

# 22. VERY IMPORTANT — FIRM TAKES / BORROWS A LOAN

The finance engine MUST support the opposite situation:

**Firm receives a loan.**

This is a liability.

The firm may borrow from:

- Bank
- Owner
- Partner
- Another firm
- Individual
- Financial institution
- Other lender

### Example — Firm borrows ₹5,00,000 from Bank

When money is received:

**Dr Bank ₹5,00,000**

**Cr Bank Loan Payable ₹5,00,000**

The firm has received cash.

But this is NOT income.

It creates a liability.

---

# 23. FIRM BORROWS FROM ANOTHER FIRM

Example:

Firm A lends ₹1,00,000 to Firm B.

Firm A:

**Dr Inter-firm Loan Receivable ₹1,00,000**

**Cr Cash/Bank ₹1,00,000**

Firm B:

**Dr Cash/Bank ₹1,00,000**

**Cr Inter-firm Loan Payable ₹1,00,000**

Firm B did NOT earn ₹1,00,000 income.

Firm A did NOT record ₹1,00,000 expense.

It is a loan relationship.

---

# 24. FIRM BORROWS FROM OWNER

Example:

Owner lends ₹2,00,000 to Firm A.

Firm:

**Dr Cash/Bank ₹2,00,000**

**Cr Owner Loan Payable ₹2,00,000**

This is not automatically capital.

The transaction must explicitly indicate whether it is:

- Capital contribution
- Owner loan
- Advance
- Other valid classification

---

# 25. FIRM BORROWS FROM PARTNER

Example:

Partner lends ₹3,00,000.

Firm:

**Dr Bank ₹3,00,000**

**Cr Partner Loan Payable ₹3,00,000**

Partner:

**Dr Loan Receivable from Firm ₹3,00,000**

**Cr Bank/Cash ₹3,00,000**

---

# 26. FIRM TAKES BANK LOAN

Support:

- Loan creation
- Loan approval
- Loan disbursement
- Loan payable
- Processing fee
- Interest
- EMI
- Principal repayment
- Interest repayment
- Overdue amount
- Restructuring
- Refinance
- Loan closure

Example:

Loan approved = ₹10,00,000

Actual disbursement = ₹9,80,000 after eligible deductions/fees.

The system must preserve the distinction between:

- Loan principal
- Fees
- Interest
- Net cash received

Do not simply record all ₹10,00,000 as cash if only ₹9,80,000 was actually received.

---

# 27. LOAN INTEREST

Loan principal is not ordinary expense.

Interest is separately accounted for.

Example:

Interest accrued ₹10,000.

**Dr Interest Expense ₹10,000**

**Cr Interest Payable ₹10,000**

When paid:

**Dr Interest Payable ₹10,000**

**Cr Bank ₹10,000**

Exact treatment can be configured according to the accounting framework.

---

# 28. LOAN EMI

An EMI can contain:

- Principal
- Interest
- Fees
- Other charges

The system must split the components.

Example:

EMI = ₹25,000

Principal = ₹20,000

Interest = ₹5,000

Entry:

**Dr Loan Payable ₹20,000**

**Dr Interest Expense ₹5,000**

**Cr Bank ₹25,000**

Do not reduce the entire ₹25,000 from principal.

---

# 29. LOAN PARTIAL REPAYMENT

Loan outstanding = ₹5,00,000

Firm repays ₹1,00,000 principal.

Remaining:

**₹4,00,000**

The system must preserve the repayment history.

---

# 30. LOAN OVERDUE

If payment becomes overdue:

Track:

- Original due date
- Amount due
- Principal
- Interest
- Penalty/late fee where applicable
- Days overdue
- Payment status
- Outstanding amount

Do not simply alter the original loan balance.

Create the appropriate additional accounting event.

---

# 31. LOAN RESTRUCTURING

Support:

- New repayment schedule
- Revised interest
- Extension
- Partial settlement
- Modification
- Refinancing
- Restructured principal

Preserve the original loan history.

---

# 32. LOAN REFINANCING

A loan may be replaced/refinanced by another loan.

The system must keep:

- Old loan
- New loan
- Settlement of old liability
- New liability
- Related fees/interest where applicable

Do not simply change the old loan amount.

---

# 33. LOAN WRITE-OFF / FORGIVENESS

A loan balance may be written off or forgiven where properly authorized.

This must create a separate accounting event.

Do not simply set outstanding loan to zero.

Record:

- Original balance
- Amount written off
- Reason
- Approver
- Date
- Accounting treatment
- Audit history

---

# 34. LOAN CONVERTED TO CAPITAL

A valid loan may be converted to equity/capital.

Example:

Owner loan = ₹2,00,000

Conversion:

**Dr Owner Loan Payable ₹2,00,000**

**Cr Owner Capital ₹2,00,000**

This is not a cash receipt because no new cash moved.

---

# 35. CAPITAL CONVERTED TO LOAN

Where permitted:

**Dr Owner Capital**

**Cr Owner Loan Payable**

Again, this is a classification/economic change, not new cash.

---

# 36. LOAN PRINCIPAL IS NOT INCOME

Very important:

Firm receives loan ₹10,00,000.

Do NOT:

**Dr Bank ₹10,00,000**

**Cr Income ₹10,00,000**

Correct concept:

**Dr Bank ₹10,00,000**

**Cr Loan Payable ₹10,00,000**

The business has cash, but also a liability.

---

# 37. LOAN PRINCIPAL REPAYMENT IS NOT NORMAL EXPENSE

Repaying ₹1,00,000 principal:

**Dr Loan Payable**

**Cr Bank**

Do not classify principal repayment as ordinary expense.

Interest may be separately recognized as expense.

---

# 38. OWNER CAPITAL

Owner puts ₹2,00,000 into firm as capital.

**Dr Cash/Bank ₹2,00,000**

**Cr Owner Capital ₹2,00,000**

Do not classify this as revenue.

---

# 39. OWNER LOAN VS OWNER CAPITAL

The user must be able to distinguish:

**Capital**

from

**Loan**

Example:

₹2,00,000 from owner as capital:

Dr Bank

Cr Owner Capital

₹2,00,000 from owner as loan:

Dr Bank

Cr Owner Loan Payable

These are not interchangeable.

---

# 40. OWNER WITHDRAWAL

Owner withdraws ₹30,000 for personal use.

**Dr Owner Drawings / Receivable**

**Cr Cash/Bank**

Do not automatically classify it as firm operating expense.

---

# 41. PERSONAL MONEY USED FOR FIRM EXPENSE

Owner personally pays ₹10,000 firm expense.

**Dr Firm Expense ₹10,000**

**Cr Owner Payable ₹10,000**

Later reimbursement:

**Dr Owner Payable ₹10,000**

**Cr Firm Cash/Bank ₹10,000**

---

# 42. FIRM MONEY USED FOR PERSONAL EXPENSE

Firm pays ₹10,000 of owner's personal expense.

**Dr Owner Drawings / Owner Receivable ₹10,000**

**Cr Firm Cash/Bank ₹10,000**

The expense should not automatically be treated as business expense.

---

# 43. WORKER PERSONAL / OWN MONEY

If firm money is given to worker for personal/own use:

**Dr Worker Recoverable / Worker Own Balance**

**Cr Cash/Bank**

The worker becomes responsible for the amount.

It can later be settled.

"Own / Personal" is a real financial deduction entry.

It is not a note-only record.

---

# 44. WORKER BUSINESS EXPENSE

If firm gives worker money for business expense:

At advance stage:

**Dr Worker Advance**

**Cr Cash**

After approved expense:

**Dr Business Expense**

**Cr Worker Advance**

---

# 45. NON-OWNER DECISION RULE

When money/expense is being given to a non-owner, ask the owner every time.

Do NOT permanently assume the answer.

Ask:

### HOW IS THE MONEY GIVEN?

- Directly from Firm
- Through Owner

### WHAT IS IT?

- Own / Personal
- Expense

This creates four core cases.

---

# 46. DIRECT + OWN/PERSONAL

Flow:

**Firm → Non-owner**

Treatment:

**Own / Personal**

The firm's balance decreases immediately.

The non-owner becomes responsible for the money.

Settlement may occur later.

---

# 47. DIRECT + EXPENSE

Flow:

**Firm → Expense / Non-owner**

Treatment:

**Expense**

The business expense is final.

Do not create an unnecessary personal balance.

---

# 48. THROUGH OWNER + OWN/PERSONAL

Flow:

**Firm → Owner → Non-owner**

Treatment:

**Own / Personal**

Generate linked ledger entries.

The firm's money decreases.

The owner-side transfer is preserved.

The personal/own responsibility can later be settled.

---

# 49. THROUGH OWNER + EXPENSE

Flow:

**Firm → Owner → Non-owner**

Treatment:

**Expense**

Generate linked entries:

Firm → Owner

Owner → Expense/Non-owner

Final expense treatment applies.

---

# 50. SOURCE OF MONEY VS EXPENSE OWNER

These fields must NEVER be merged.

Example:

Firm B pays Firm A expense.

Source:

**Firm B**

Expense Owner:

**Firm A**

These are different facts.

---

# 51. MULTI-FIRM EXPENSE

Total expense:

₹45,000

User chooses:

Firm A = ₹30,000

Firm B = ₹5,000

Personal = ₹10,000

Total allocation:

₹45,000

Valid.

No automatic equal split.

---

# 52. ALLOCATION VALIDATION

If total expense = ₹45,000

and allocations are:

Firm A = ₹30,000

Firm B = ₹5,000

Personal = ₹8,000

Total allocation:

₹43,000

The system must reject the posting.

Do not silently assign the remaining ₹2,000.

Rule:

**SUM OF ALLOCATIONS = TOTAL TRANSACTION VALUE**

---

# 53. PARTIAL PAYMENT

Bill:

₹1,00,000

Paid:

₹40,000

Remaining:

₹60,000

Do not mark the bill fully paid.

---

# 54. PARTIAL RECEIPT

Customer owes:

₹1,00,000

Customer pays:

₹35,000

Remaining receivable:

₹65,000

---

# 55. MULTIPLE PAYMENTS AGAINST ONE BALANCE

Outstanding:

₹1,00,000

Payments:

₹20,000

₹30,000

₹50,000

Final:

₹0

Every payment remains individually traceable.

---

# 56. ONE PAYMENT SETTLES MULTIPLE ITEMS

One payment = ₹1,00,000

Can settle:

Supplier Bill = ₹50,000

Worker Payable = ₹20,000

Advance = ₹30,000

The system must record settlement allocation.

Do not create a new ₹1,00,000 expense simply because a settlement occurred.

---

# 57. SETTLEMENT IS DIFFERENT FROM ORIGINAL TRANSACTION

Original:

Firm B incurred expense ₹50,000.

Later:

Firm B pays Firm A ₹50,000.

The payment is a **settlement**.

It is not another expense.

---

# 58. INTER-FIRM EXPENSE

Firm A pays Firm B expense ₹50,000.

Firm A:

**Dr Inter-firm Receivable ₹50,000**

**Cr Cash/Bank ₹50,000**

Firm B:

**Dr Expense ₹50,000**

**Cr Inter-firm Payable ₹50,000**

One economic event.

Multiple ledger effects.

One master event ID.

---

# 59. INTER-FIRM LOAN

Firm A loans ₹1,00,000 to Firm B.

Firm A:

**Dr Loan Receivable from Firm B**

**Cr Cash/Bank**

Firm B:

**Dr Cash/Bank**

**Cr Loan Payable to Firm A**

Do not classify this as revenue or expense.

---

# 60. INTER-FIRM ADVANCE

Firm A gives Firm B ₹1,00,000 as advance.

Firm A:

**Dr Inter-firm Advance Receivable**

**Cr Cash/Bank**

Firm B:

**Dr Cash/Bank**

**Cr Inter-firm Advance**

Later the advance is adjusted against an appropriate expense/purchase/settlement.

---

# 61. INTER-FIRM TRANSFER

Firm A transfers money to Firm B and there is no expense, loan, or advance.

The system must identify this as a transfer according to the configured business relationship.

Do not automatically classify it as expense or income.

---

# 62. BILATERAL INTER-FIRM BALANCE

Example:

Firm A owes Firm B:

₹50,000

Firm B owes Firm A:

₹20,000

Track both separately.

If authorized net settlement is allowed:

Net amount:

₹30,000

The original balances remain traceable.

---

# 63. EXPENSE ACCRUAL

Expense incurred but not yet paid.

Example:

Salary = ₹1,00,000

**Dr Salary Expense ₹1,00,000**

**Cr Salary Payable ₹1,00,000**

Later payment:

**Dr Salary Payable**

**Cr Bank**

---

# 64. PREPAID EXPENSE

Example:

Annual insurance = ₹1,20,000

At payment:

**Dr Prepaid Insurance ₹1,20,000**

**Cr Bank ₹1,20,000**

Monthly:

**Dr Insurance Expense ₹10,000**

**Cr Prepaid Insurance ₹10,000**

---

# 65. ACCRUAL PRINCIPLE

Where accrual accounting is enabled:

Recognize the economic event in the accounting period to which it belongs, even when cash movement occurs later.

Examples:

- Expense incurred before payment
- Revenue earned before collection
- Salary accrued before payment
- Interest accrued before payment

---

# 66. PAYMENT METHOD VS ACCOUNT

These are different.

Example:

Payment method:

**UPI**

Source account:

**HDFC Bank**

Do not confuse the payment channel with the underlying fund/account.

---

# 67. SOURCE / DESTINATION VS DEBIT / CREDIT

These are also different concepts.

### Business transaction layer

**SOURCE → DESTINATION**

### Accounting layer

**DEBIT → CREDIT**

Example:

Firm A pays Firm B expense.

Business meaning:

Source = Firm A Cash

Destination = Firm B Expense

Accounting effects may include:

Firm B Expense → Debit

Firm A Cash → Credit

Firm B Inter-firm Payable → Credit

Firm A Inter-firm Receivable → Debit

Never merge source/destination with debit/credit.

---

# 68. ONE REAL-WORLD EVENT CAN CREATE MANY JOURNAL LINES

Example:

Firm A pays Firm B expense ₹50,000.

One master event:

**TXN-001**

Possible accounting lines:

Firm A Inter-firm Receivable → Debit ₹50,000

Firm A Cash → Credit ₹50,000

Firm B Expense → Debit ₹50,000

Firm B Inter-firm Payable → Credit ₹50,000

Total Debit:

₹1,00,000

Total Credit:

₹1,00,000

Balanced.

But this is still:

**ONE REAL-WORLD EVENT**

---

# 69. NO DOUBLE-COUNTING

Do not interpret linked ledger effects as separate economic spending.

Example:

Cash reduction ₹50,000

Expense ₹50,000

Payable ₹50,000

Receivable ₹50,000

These are not ₹2,00,000 of spending.

They are connected accounting representations of one event.

---

# 70. JOURNAL ENTRY TYPES

Support:

- Standard Journal
- Simple Journal
- Compound Journal
- Adjusting Journal
- Reversing Journal
- Closing Journal
- Opening Journal
- Transfer Journal
- Settlement Journal
- Reclassification Journal
- Correction Journal
- Reversal Journal
- Tax Adjustment Journal
- Accrual Journal
- Depreciation Journal
- Provision Journal
- Loan Journal
- Capital Journal

---

# 71. JOURNAL STATUS

Support:

- Draft
- Submitted
- Pending Approval
- Approved
- Posted
- Partially Settled
- Fully Settled
- Rejected
- Cancelled
- Reversed
- Voided where appropriate

---

# 72. JOURNAL STRUCTURE

Every journal should support:

- Journal ID
- Master Event ID
- Transaction ID
- Date
- Posting date
- Entry timestamp
- Description
- Currency
- Exchange rate
- Source
- Destination
- Account
- Debit
- Credit
- Entity
- Firm
- Project
- Cost center
- Purpose
- Tax
- Payment method
- Document
- Created by
- Approved by
- Posted by
- Reversal reference
- Related transaction
- Audit data

---

# 73. JOURNAL LINE RULE

Each journal line should contain:

- Account
- Entity where applicable
- Debit OR Credit
- Amount

Do not use negative values to disguise accounting direction.

Prefer:

Debit ₹10,000

or:

Credit ₹10,000

not:

Debit -₹10,000

---

# 74. JOURNAL BALANCE RULE

Before posting:

**SUM(DEBIT) = SUM(CREDIT)**

If not:

**BLOCK POSTING**

---

# 75. ACCOUNT BALANCE RULE

For debit-normal accounts:

**Closing Balance = Opening + Debits − Credits**

For credit-normal accounts:

**Closing Balance = Opening + Credits − Debits**

Account classification determines the normal balance.

---

# 76. DO NOT INTERPRET ACCOUNT MEANING FROM SIGN ALONE

A liability can temporarily have a debit balance.

An asset can temporarily have a credit balance.

That may represent:

- Overpayment
- Advance
- Adjustment
- Reversal
- Error
- Unusual legitimate balance

The system must investigate/classify the reason rather than hiding it.

---

# 77. LEDGER TYPES

Support at least:

### General Ledger

Main accounting ledger.

### Cash Ledger

Cash movement.

### Bank Ledger

Bank movement.

### Accounts Receivable Ledger

Customer/entity receivables.

### Accounts Payable Ledger

Supplier/entity payables.

### Owner Ledger

Owner contribution, withdrawal, payable, receivable, loan.

### Partner Ledger

Partner-related balances.

### Worker Ledger

Worker advances, expenses, recoverables, salary and settlements.

### Inter-Firm Ledger

Firm-to-firm balances.

### Loan Ledger

Principal, interest and repayments.

### Advance Ledger

Advance balances.

### Tax Ledger

Tax balances.

### Inventory Ledger

Inventory quantity and value.

### Fixed Asset Ledger

Asset cost, depreciation and disposal.

### Location/Cash Control Ledger

Physical money location and control.

---

# 78. SUB-LEDGER RULE

Example:

General Ledger:

Accounts Receivable = ₹5,00,000

Sub-ledger:

Customer A = ₹2,00,000

Customer B = ₹1,50,000

Customer C = ₹1,50,000

Total:

₹5,00,000

The sub-ledger total must reconcile with the control account.

---

# 79. CONTROL ACCOUNT RULE

Support control accounts for:

- Accounts Receivable
- Accounts Payable
- Inventory
- Payroll
- Tax
- Other detailed sub-ledger relationships

Detailed records must reconcile with the controlling account.

---

# 80. TRIAL BALANCE

The application must generate a Trial Balance.

For every account:

- Opening balance
- Debit movement
- Credit movement
- Closing balance

Final validation:

**Total Debits = Total Credits**

---

# 81. PROFIT & LOSS

Revenue generally increases profit.

Expenses generally decrease profit.

Do not classify these as normal revenue:

- Loan received
- Capital contribution
- Inter-firm loan received
- Normal transfer
- Customer advance before revenue recognition

Do not classify these as ordinary business expense:

- Loan principal repayment
- Owner withdrawal
- Capital repayment
- Inter-firm settlement
- Normal bank-to-cash transfer

---

# 82. BALANCE SHEET

Classify correctly into:

### Assets
Resources/rights controlled by the business.

### Liabilities
Amounts owed by the business.

### Equity
Residual interest/capital.

The accounting engine must generate the balance sheet from ledger data.

---

# 83. TEMPORARY ACCOUNTS

Normally:

- Revenue
- Expenses
- Gains
- Losses

are temporary accounts for period-end purposes.

---

# 84. PERMANENT ACCOUNTS

Normally:

- Assets
- Liabilities
- Equity

carry into the next accounting period.

---

# 85. CLOSING ENTRIES

At period end:

- Revenue accounts are closed/transferred according to the selected accounting framework.
- Expense accounts are closed/transferred.
- Profit/loss is transferred to the appropriate equity/retained earnings structure.
- Balance-sheet accounts continue forward.

---

# 86. OPENING BALANCE RULE

Next period opening balance must come from:

**Previous period closing balance**

Example:

Previous closing cash:

₹1,30,000

Next opening cash:

₹1,30,000

Do not create unexplained opening differences.

---

# 87. MONTH CLOSE

Before month close, check:

- Cash
- Bank
- Receivables
- Payables
- Advances
- Loans
- Owner balances
- Partner balances
- Worker balances
- Inter-firm balances
- Inventory
- Assets
- Tax
- Unidentified money
- Suspense/reconciliation balances
- Trial balance
- Pending approvals
- Critical reconciliation issues

---

# 88. MONTH-CLOSE RULE

Once closed:

Normal users should not freely edit posted records in that period.

Authorized users may reopen or create controlled post-close adjustments.

Every reopening must be audited.

---

# 89. YEAR-END

Support:

- Financial year close
- Opening balance creation
- Profit/loss carry-forward
- Capital balances
- Asset carry-forward
- Inventory carry-forward
- Receivables
- Payables
- Loans
- Advances
- Inter-firm balances
- Pending settlements
- Audit adjustments

---

# 90. REVERSAL RULE

Never delete the accounting meaning of an already-posted transaction.

Original:

Dr Expense ₹10,000

Cr Cash ₹10,000

Reversal:

Dr Cash ₹10,000

Cr Expense ₹10,000

Original and reversal must be linked.

---

# 91. CORRECTION RULE

If a posted entry was wrong:

Do not silently overwrite it.

Use:

- Reversal
- Adjustment
- Correct replacement
- Reclassification

The chain must remain:

**Original → Correction → Final accounting state**

---

# 92. PARTIAL REVERSAL

If only ₹3,000 of ₹10,000 is wrong:

Do not reverse all ₹10,000 unless that is the actual correction.

Create the appropriate partial reversal/adjustment.

---

# 93. NO SILENT BALANCE EDITING

Never allow a user to simply type:

Cash = ₹80,000

and make the system accept it without accounting support.

A change must come from:

- Transaction
- Adjustment
- Opening balance
- Reconciliation
- Reversal
- Other authorized accounting event

---

# 94. VALUE FLOW RULE

Every decrease in value must have a destination.

Example:

Firm cash decreases ₹50,000.

The ₹50,000 must become:

- Expense
- Asset
- Receivable
- Loan
- Advance
- Transfer
- Settlement
- Withdrawal
- Other valid accounting destination

No unexplained disappearance.

---

# 95. VALUE CONSERVATION RULE

For every internal transfer:

**Value leaving Source = Value entering Destination**

Example:

Tijori → Drawer ₹50,000

Dr Drawer ₹50,000

Cr Tijori ₹50,000

Total business cash remains unchanged.

Only location changes.

---

# 96. BANK TO CASH

₹50,000 withdrawn:

**Dr Cash ₹50,000**

**Cr Bank ₹50,000**

This is a transfer.

Not expense.

---

# 97. CASH TO BANK

₹50,000 deposited:

**Dr Bank ₹50,000**

**Cr Cash ₹50,000**

This is a transfer.

Not income.

---

# 98. CASH LOCATION TRANSFER

Example:

Tijori → Office Drawer.

The accounting engine must support the location dimension independently from the accounting account.

The location changes.

The total underlying cash does not become an expense.

---

# 99. LOCATION OWNERSHIP / ACCESS / HOLDER

These must remain separate:

### Ownership
Who owns the location/fund.

### Authorized Access
Who can access it.

### Current Holder/Controller
Who currently physically controls it.

Example:

Tijori

Owner = Firm

Authorized Access = Krish + Father

Current Holder = Father

Later:

Current Holder = Krish

Access remains:

Krish + Father

Ownership remains unchanged.

---

# 100. ACCOUNT ≠ LOCATION

"Cash" can be the accounting asset.

"Tijori" can be the physical location.

"Father" can be current holder.

"Krish + Father" can be authorized access.

Do not merge these into a single field.

---

# 101. CATEGORY ≠ ACCOUNT

Example:

Category:

Travel → Hotel

Accounting Account:

Travel Expense

Firm:

Firm A

Project:

Mumbai Visit

Location:

Tijori

These are different dimensions.

---

# 102. PROJECT / COST CENTER DIMENSIONS

Support separate dimensions such as:

- Firm
- Branch
- Department
- Project
- Cost Center
- Client
- Product
- Purpose

Do not create a separate accounting account for every possible project/person/category.

Use dimensions/sub-ledgers where appropriate.

---

# 103. ASSET PURCHASE

Example:

Machine = ₹10,00,000

**Dr Machine Asset ₹10,00,000**

**Cr Bank ₹10,00,000**

Do not automatically classify the full purchase as ordinary expense.

---

# 104. DEPRECIATION

Example:

Monthly depreciation = ₹20,000

**Dr Depreciation Expense ₹20,000**

**Cr Accumulated Depreciation ₹20,000**

---

# 105. ASSET SALE

Suppose:

Asset Cost = ₹1,00,000

Accumulated Depreciation = ₹40,000

Net Book Value = ₹60,000

Sale = ₹70,000

The system must:

- Remove asset cost
- Remove accumulated depreciation
- Record cash/receivable
- Calculate gain/loss

Gain:

₹10,000

Do not simply record ₹70,000 as revenue.

---

# 106. INVENTORY PURCHASE

Example:

Inventory ₹50,000

**Dr Inventory ₹50,000**

**Cr Cash/Payable ₹50,000**

Inventory remains an asset until consumed/sold according to the accounting model.

---

# 107. INVENTORY SALE

For sale:

**Dr Cash/Receivable**

**Cr Sales Revenue**

And under perpetual inventory accounting:

**Dr COGS**

**Cr Inventory**

---

# 108. INVENTORY TRANSFER

Location A → Location B.

This should normally be a stock transfer, not expense.

Firm A → Firm B can be:

- Transfer
- Sale
- Inter-firm movement
- Other configured economic event

depending on the actual event.

---

# 109. PREPAID VALUE

A prepaid amount is an asset until the expense is recognized.

Do not expense the entire future-period value immediately where prepaid accounting applies.

---

# 110. RECEIVABLE WRITE-OFF

Customer owes ₹50,000.

Approved write-off:

**Dr Bad Debt Expense ₹50,000**

**Cr Accounts Receivable ₹50,000**

The write-off must be authorized and auditable.

---

# 111. LATER RECOVERY OF WRITTEN-OFF BALANCE

If ₹20,000 is later recovered:

**Dr Cash ₹20,000**

**Cr Appropriate Recovery/Income Account ₹20,000**

The recovery must remain linked to the historical write-off where appropriate.

---

# 112. OVERPAYMENT

Payable = ₹50,000

Firm pays ₹55,000.

The extra ₹5,000 must remain identifiable as:

- Supplier receivable
- Supplier advance
- Refund receivable
- Other valid balance

Do not make it disappear.

---

# 113. UNDERPAYMENT

Payable = ₹50,000

Firm pays ₹45,000.

Remaining payable = ₹5,000

Only a valid discount, waiver, write-off, or adjustment can remove the remaining ₹5,000.

---

# 114. DISCOUNT

Support:

- Purchase discount
- Sales discount
- Supplier discount
- Customer discount
- Cash discount
- Percentage discount
- Fixed discount
- Discount before tax
- Discount after tax
- Partial discount
- Later discount adjustment

Exact accounting treatment must depend on transaction context.

---

# 115. REFUND

Every refund should be linked to its original transaction where possible.

Example:

Original:

Dr Expense ₹10,000

Cr Cash ₹10,000

Refund = ₹3,000

Dr Cash ₹3,000

Cr Appropriate Expense/Refund account ₹3,000

Do not create an unrelated receipt with no history.

---

# 116. CREDIT NOTE

Credit notes must adjust the relevant:

- Revenue
- Receivable
- Expense
- Payable
- Tax

relationship.

Do not automatically treat a credit note as cash received.

---

# 117. DEBIT NOTE

Debit notes must be accounted according to:

- Who issued it
- Who received it
- Underlying transaction
- Whether it changes income, expense, receivable, payable or tax

Do not use one hardcoded entry for all debit-note scenarios.

---

# 118. TAX ACCOUNTS

Support configurable accounts for:

- Input GST
- Output GST
- CGST
- SGST
- IGST
- TDS Payable
- TDS Receivable
- Other Tax Payable
- Other Tax Receivable

---

# 119. TAX-INCLUSIVE AMOUNT

If total invoice = ₹11,800 including GST:

System must calculate:

Base Value

+

Tax

=

Gross Value

Do not treat ₹11,800 as pure expense/revenue.

---

# 120. TAX-EXCLUSIVE AMOUNT

Base = ₹10,000

GST = ₹1,800

Gross = ₹11,800

The relevant expense/revenue and tax components must be separately represented where applicable.

---

# 121. TAX CORRECTIONS

Support:

- Tax correction
- Tax reversal
- Tax adjustment
- Credit note
- Debit note
- Incorrect GST classification
- Incorrect TDS treatment
- Later correction

Every correction must remain auditable.

---

# 122. ROUNDING

Support:

- Currency precision
- Tax rounding
- Line rounding
- Invoice rounding
- Rounding adjustment

Rounding must never break:

**Debit = Credit**

---

# 123. FOREIGN CURRENCY

Support:

- Foreign currency expense
- Foreign currency income
- Foreign currency advance
- Foreign receivable
- Foreign payable
- Foreign loan
- Exchange-rate difference
- Settlement at different exchange rate
- Bank conversion fee
- Foreign bank charges
- Revaluation

Store:

- Original currency amount
- Currency
- Exchange rate
- Base currency amount

---

# 124. FOREIGN EXCHANGE DIFFERENCE

Example:

Receivable originally recognized at ₹8,300.

Collected later at ₹8,500.

The ₹200 difference must be represented appropriately as an exchange gain.

Likewise a decrease can create an exchange loss.

Do not silently modify the original receivable.

---

# 125. UNKNOWN MONEY

If money arrives and the owner/purpose is unknown:

Examples:

- Unknown bank credit
- Unknown UPI
- Unknown cash
- Unknown refund

Do not automatically classify it as revenue.

Use:

**Unidentified → Investigating → Assigned → Reconciled**

---

# 126. SUSPENSE ACCOUNT

A suspense/unidentified account may temporarily hold genuinely unknown balances.

But:

**Suspense must not become a permanent dumping ground.**

Every suspense amount should eventually be:

- Identified
- Reclassified
- Settled
- Adjusted
- Written off with authorization

---

# 127. RECONCILIATION

Support reconciliation between:

- Cash ledger vs physical cash
- Bank ledger vs bank statement
- Customer balance vs customer statement
- Supplier balance vs supplier statement
- Worker balance vs worker records
- Owner balance
- Partner balance
- Inter-firm balances
- Inventory vs physical stock
- Location vs physical cash

---

# 128. CASH DIFFERENCE

Ledger:

₹1,00,000

Physical:

₹98,000

Difference:

₹2,000

Do not silently change cash to ₹98,000.

Create an authorized reconciliation/adjustment process.

---

# 129. BANK DIFFERENCE

Ledger:

₹5,00,000

Bank statement:

₹4,95,000

Investigate:

- Unrecorded payment
- Bank charge
- Duplicate transaction
- Failed/reversed transaction
- Timing difference
- Other discrepancy

Then record the appropriate adjustment.

---

# 130. WORKER BALANCE RECONCILIATION

System says worker holds:

₹20,000

Actual:

₹17,000

Difference:

₹3,000

Do not directly rewrite the worker balance.

Create a reconciliation process.

---

# 131. ACCESS / ACCOUNTING SEPARATION

Access controls do not change historical accounting.

A person losing access to Firm A does not erase:

- Their old transactions
- Old approvals
- Old balances
- Old audit history

---

# 132. MASTER DATA VS TRANSACTIONS

Master Data defines the structure.

Transactions represent real-world events.

Examples of masters:

- Firms
- People
- Accounts
- Locations
- Categories
- Tax rules
- Payment methods
- Roles
- Permissions
- Transaction rules
- Settlement rules
- Projects
- Cost Centers

A transaction uses those masters.

---

# 133. MASTER DATA DEACTIVATION

If a master is no longer used:

Prefer:

**Deactivate / Archive**

instead of destructive deletion where history depends on it.

Historical transactions must remain intact.

---

# 134. ACCOUNT RECLASSIFICATION

If an expense was wrongly classified:

Original remains traceable.

Create appropriate adjustment:

Office Expense → Travel Expense

Do not silently rewrite the original posted record.

---

# 135. ACCOUNT MERGING

If two accounts are merged for future use:

Historical transactions must retain their original identity/traceability.

Future transactions can use the new account.

---

# 136. POSTED TRANSACTION IMMUTABILITY

After posting, do not silently change:

- Amount
- Date
- Firm
- Entity
- Owner
- Account
- Source
- Destination
- Tax
- Category
- Location
- Settlement relationship

Use controlled adjustment/reversal processes.

---

# 137. AUDIT TRAIL

For every material financial change record:

- User
- Date/time
- Action
- Old value
- New value
- Reason
- Approval
- Related transaction
- Original transaction
- Reversal
- Document

The system must be able to reconstruct what happened.

---

# 138. APPROVAL

Support:

- Maker/checker
- Approval
- Rejection
- High-value approval
- Multi-level approval where configured
- Self-approval restriction where configured

A transaction should not become posted merely because someone created it if approval is required.

---

# 139. PAYMENT VS SETTLEMENT

Payment:

**Money actually moves.**

Settlement:

**The payment is allocated against one or more outstanding obligations.**

They are linked but not necessarily the same object.

---

# 140. SETTLEMENT STATUS

Support:

- No settlement
- Pending
- Partially settled
- Fully settled
- Over-settled
- Adjusted
- Cancelled
- Reversed

---

# 141. SETTLEMENT VALIDATION

If outstanding:

₹50,000

Settlement:

₹20,000

Remaining:

₹30,000

The system must not mark it fully settled.

---

# 142. SETTLEMENT ALLOCATION

A single payment may be allocated to:

- One invoice
- Multiple invoices
- One advance
- One payable
- Multiple balances

The allocation must be explicitly recorded.

---

# 143. NO AUTOMATIC NETTING

Do not automatically offset unrelated balances.

Example:

Customer A owes firm ₹50,000.

Supplier B is owed ₹30,000.

Do not turn this into one ₹20,000 balance.

Only perform a valid offset where the parties and accounting conditions support it.

---

# 144. LOAN VS ADVANCE VS EXPENSE

The system must distinguish these.

### Loan

Creates a formal receivable/payable.

### Advance

Temporary amount expected to be adjusted/used/returned.

### Expense

Recognized cost.

Do not classify them interchangeably.

---

# 145. CAPITAL VS LOAN VS INCOME

The system must distinguish:

### Capital

Equity.

### Loan

Liability/receivable.

### Income

Revenue/gain.

Example:

Firm receives ₹5,00,000:

Could be:

- Owner capital
- Owner loan
- Bank loan
- Customer advance
- Sales revenue
- Another firm loan

The accounting treatment depends on the actual event.

Do not guess.

---

# 146. TRANSFER VS EXPENSE VS WITHDRAWAL

These are different.

### Transfer

Moves value.

### Expense

Consumes value for business/personal purpose.

### Withdrawal

Moves business value out for owner/personal use.

The system must not classify every outgoing payment as expense.

---

# 147. PAYMENT FROM WRONG ACCOUNT

Example:

Firm A expense is accidentally paid from Firm B bank account.

The system must preserve:

Source = Firm B

Expense Owner = Firm A

and create the appropriate inter-firm receivable/payable relationship where applicable.

Do not rewrite the source merely to make the report look simpler.

---

# 148. PAYMENT FROM PERSONAL ACCOUNT

Example:

Krish personally pays Firm A expense.

Source:

Krish Personal Bank

Expense Owner:

Firm A

Firm A owes/has payable to Krish where reimbursement is applicable.

---

# 149. MULTIPLE FUND PAYMENT

Expense = ₹1,00,000

₹40,000 Cash

₹60,000 Bank

The transaction engine must support multiple funding sources when required.

Total funding must equal the transaction amount.

---

# 150. MULTIPLE DESTINATION PAYMENT

One source may fund multiple purposes/entities.

Example:

One ₹1,00,000 cash release:

Firm A Expense = ₹40,000

Firm B Expense = ₹30,000

Personal = ₹20,000

Worker Advance = ₹10,000

Total = ₹1,00,000

Each portion needs its own accounting meaning.

---

# 151. EXPENSE OWNER CAN DIFFER BY LINE

A single transaction/event may have multiple allocations.

Each allocation may have:

- Owner
- Amount
- Firm
- Category
- Tax
- Settlement

Do not force the whole transaction into one owner.

---

# 152. EXPENSE CATEGORY APPLIES TO ACTUAL EXPENSE

Category should apply to the actual expense line/share.

For a visit:

Hotel ₹12,000 → Hotel

Food ₹4,000 → Food

Petrol ₹3,000 → Travel/Petrol

Courier ₹2,000 → Courier

Do not force one category over the entire trip.

---

# 153. OWNER / PARTNER LEDGER

Owner/partner ledger can contain:

- Capital
- Loan
- Withdrawal
- Reimbursement
- Advance
- Personal expense
- Receivable
- Payable
- Settlement
- Profit distribution
- Adjustment

Do not combine all owner transactions into one vague balance.

---

# 154. WORKER LEDGER

Worker ledger can contain:

- Salary
- Advance
- Expense reimbursement
- Personal/Own amount
- Loan
- Business cash
- Return
- Settlement
- Payable to worker
- Worker owes firm

The worker may simultaneously have:

**Firm owes worker**

and

**Worker owes firm**

These should remain separately traceable.

---

# 155. SUPPLIER LEDGER

Track:

- Bills
- Advances
- Payments
- Credit notes
- Debit notes
- Refunds
- Adjustments
- Outstanding payable
- Settlements

---

# 156. CUSTOMER LEDGER

Track:

- Invoices
- Advances
- Payments
- Credit notes
- Debit notes
- Refunds
- Receivables
- Settlements
- Write-offs
- Adjustments

---

# 157. INTER-FIRM LEDGER

Each firm-to-firm relationship should be visible from both sides.

Example:

Firm A:

Receivable from Firm B = ₹50,000

Firm B:

Payable to Firm A = ₹50,000

The two sides should reconcile.

---

# 158. ACCOUNTING PERIOD RULE

Every posted entry belongs to an accounting period.

Support:

- Current period
- Prior period
- Future period
- Closed period
- Reopened period

Do not allow backdated posting into closed periods without authorization.

---

# 159. LATE ENTRY

A transaction can be entered today with an earlier accounting date.

The system must preserve both:

- Transaction/entry timestamp
- Accounting/posting date

This is important for audit.

---

# 160. BACKDATED TRANSACTION

If an entry belongs to an earlier period:

- Validate period status
- Check permissions
- Preserve original creation time
- Use proper adjustment if the period is closed
- Update affected reporting appropriately

---

# 161. FUTURE-DATED TRANSACTION

Support future-dated instructions only where the accounting workflow permits them.

Do not allow a future transaction to incorrectly affect current posted balances before its accounting date.

---

# 162. DOCUMENT RULE

Documents such as:

- Invoice
- Bill
- Receipt
- Payment proof
- Screenshot
- PDF
- Bank statement
- Tax document
- Credit note
- Debit note

are supporting evidence.

A document itself does not automatically mean an accounting entry exists.

The accounting event must be recorded separately.

---

# 163. DUPLICATE TRANSACTION RULE

Detect/warn about:

- Duplicate bill
- Duplicate payment
- Duplicate bank import
- Duplicate UPI
- Duplicate expense
- Duplicate transfer
- Duplicate invoice
- Duplicate receipt

Use:

- Transaction ID
- External reference
- Bank reference
- Payment reference
- Document number
- Other identifiers

---

# 164. TRANSACTION ID / MASTER EVENT ID

Every real-world economic event must have a stable master ID.

Example:

**EVENT-000001**

It may produce many journal lines.

All related records must link back to that event.

---

# 165. GENERATED LEDGER EFFECTS

A master transaction may generate:

- General ledger entries
- Party ledger entries
- Inter-firm entries
- Cash/location entries
- Tax entries
- Settlement entries
- Audit entries

All must remain linked.

---

# 166. NO ORPHAN LEDGER ENTRIES

Every generated accounting line must point back to:

- Master event
- Journal
- Transaction
- Appropriate source/reference

Do not create unexplained orphan balances.

---

# 167. VALUE INTEGRITY

The engine must preserve:

**Debit = Credit**

and:

**Opening + Movements = Closing**

and:

**Allocation Total = Transaction Total**

and:

**Settlement Applied ≤ Available Outstanding**, unless an explicit over-settlement is supported.

---

# 168. ACCOUNTING INTEGRITY

No transaction may:

- Create money from nothing
- Destroy money without explanation
- Create income from a loan
- Create expense from a transfer
- Create expense twice
- Erase a payable without settlement/adjustment
- Erase receivable without collection/adjustment
- Erase loan without repayment/conversion/write-off
- Erase capital without valid equity transaction

---

# 169. RECEIVABLE / PAYABLE DIRECTION RULE

Always know:

**Who owes whom?**

Example:

Firm A owes Firm B.

Do not allow a vague "Outstanding ₹50,000."

Store:

**Debtor = Firm A**

**Creditor = Firm B**

Likewise:

Worker owes Firm A.

Store the direction explicitly.

---

# 170. LOAN DIRECTION RULE

Always know:

### Lender

Who gave the loan?

### Borrower

Who received the loan?

### Principal

How much?

### Outstanding

How much remains?

### Interest

How much is applicable?

### Due schedule

When is repayment due?

### Status

What is its current state?

This applies to:

- Firm → Person
- Person → Firm
- Firm → Firm
- Bank → Firm
- Firm → Worker
- Owner → Firm
- Firm → Owner

---

# 171. ADVANCE DIRECTION RULE

Always know:

- Who gave the advance
- Who received it
- Why
- Original amount
- Used amount
- Remaining amount
- Returned amount
- Settlement
- Status

---

# 172. RECONCILIATION ADJUSTMENT

Any accounting difference must have:

- Amount
- Date
- Reason
- Account
- User
- Approval where required
- Evidence
- Related reconciliation

Do not silently overwrite balances.

---

# 173. WRITE-OFF RULE

Write-off must be an accounting event.

Support:

- Receivable write-off
- Payable write-off
- Loan write-off
- Advance write-off
- Cash shortage
- Inventory shortage

Each should require proper authority.

---

# 174. WAIVER / FORGIVENESS

If an outstanding amount is forgiven:

Do not classify it as a payment.

Example:

Customer owes ₹50,000.

₹10,000 waived.

Remaining = ₹40,000.

The ₹10,000 waiver must be separately recorded.

---

# 175. RECONCILIATION STATUS

Support:

- Unreconciled
- Investigating
- Matched
- Partially matched
- Adjusted
- Reconciled

---

# 176. PERSONAL / FIRM SEPARATION

Personal and firm financial worlds must remain separate.

Personal activity must not automatically become firm activity.

Firm activity must not automatically become personal activity.

Crossing between them must create an explicit transaction relationship.

---

# 177. INDIVIDUAL / FIRM ACCESS MODEL

Every individual remains a separate entity.

Each individual has their own personal/home environment.

Firm access is separate.

Example:

Partner 1 → Firm A + Firm B + Firm C

Partner 2 → Firm A

Partner 3 → Firm A + Firm C

Being a partner in Firm A does not automatically give someone access to another person's personal environment.

---

# 178. FULL ADMIN

Full admin can manage the permitted environment including:

- Firms
- People
- Accounts
- Locations
- Transactions
- Master data
- Permissions
- Reports
- Reconciliation
- Settings

But personal/private environments remain subject to the defined privacy/access model unless explicit permission exists.

---

# 179. MASTER DATA ACCESS

Authorized administrators can manage:

- Firms
- Entities
- Individuals
- Workers
- Accounts
- Locations
- Categories
- Payment methods
- Tax rules
- Roles
- Permissions
- Transaction rules
- Settlement rules
- Projects
- Departments
- Cost centers
- Document types

---

# 180. ACCOUNTING REPORTS

Generate:

- General Ledger
- Cash Ledger
- Bank Ledger
- Trial Balance
- Profit & Loss
- Balance Sheet
- Cash Flow
- Accounts Receivable
- Accounts Payable
- Owner Ledger
- Partner Ledger
- Worker Ledger
- Inter-Firm Ledger
- Loan Report
- Advance Report
- Tax Report
- Inventory Report
- Fixed Asset Report
- Settlement Report
- Reconciliation Report
- Audit Report
- Month Closing Report

---

# 181. REPORT FILTERS

Reports should support filtering by:

- Date
- Month
- Year
- Firm
- Entity
- Person
- Account
- Category
- Project
- Cost center
- Location
- Transaction type
- Payment method
- Settlement status
- Loan
- Advance
- Tax status

Permissions must be respected.

---

# 182. REPORTING MUST COME FROM LEDGER DATA

Do not independently calculate balances differently in each screen.

The reports should use the same authoritative accounting ledger/data model.

Otherwise:

Dashboard balance ≠ ledger balance

must never happen.

---

# 183. DASHBOARD BALANCE RULE

If dashboard shows Cash:

₹1,00,000

the underlying cash ledger must calculate the same balance.

Dashboard is a view.

Ledger is the source of accounting truth.

---

# 184. OFFLINE TRANSACTION RULE

When offline:

- Generate stable transaction ID
- Store transaction locally
- Preserve creation timestamp
- Sync later
- Prevent duplicate posting
- Handle conflicts
- Preserve audit history

---

# 185. SYNC DUPLICATE RULE

If a transaction has already been synchronized, retrying the same transaction must not create another financial posting.

Use stable IDs/idempotency.

---

# 186. SYNC CONFLICT RULE

If the same transaction is changed on multiple devices:

Do not silently choose one value if that could destroy accounting history.

Use controlled conflict handling.

---

# 187. SECURITY RULE

The accounting engine must enforce permissions before:

- Viewing sensitive data
- Creating transaction
- Editing draft
- Posting
- Approving
- Settling
- Reversing
- Reopening period
- Managing master data
- Exporting data
- Managing users

---

# 188. HISTORICAL INTEGRITY

When:

- User leaves
- Partner leaves
- Worker leaves
- Firm access is revoked
- Account is deactivated
- Category is changed
- Location changes holder
- Firm is renamed
- Master is archived

historical transactions remain intact and reconstructable.

---

# 189. NO SILENT RECLASSIFICATION

Changing the name/category/master must not silently rewrite old accounting logic.

Future use can change.

Historical accounting remains traceable.

---

# 190. ACCOUNTING BASIS

The system should have an explicit accounting basis/configuration where required.

Do not silently mix:

- Cash accounting
- Accrual accounting

The selected accounting model should be applied consistently to reporting and recognition.

---

# 191. ACCOUNT HIERARCHY

Support:

Parent Account

→ Child Account

Example:

Expenses

→ Travel

→ Hotel

→ Domestic Hotel

Or:

Assets

→ Current Assets

→ Cash & Cash Equivalents

→ Cash

The account hierarchy is for classification/reporting.

The underlying account ID remains unique.

---

# 192. ACCOUNT MASTER

Each account should contain:

- Account ID
- Account Code
- Account Name
- Account Type
- Parent Account
- Normal Balance
- Firm/Entity
- Currency
- Active/Inactive
- Control Account
- Sub-ledger Type
- Tax applicability
- Cost center applicability
- Project applicability
- Opening balance
- Created By
- Created Date
- Updated By
- Updated Date
- Audit history

---

# 193. LOCATION MASTER

Each location should contain:

- Location ID
- Name
- Type
- Owner
- Authorized users
- Current holder/controller
- Status
- Currency
- Associated funds/accounts
- Created/updated history

Examples:

- Tijori
- Drawer
- Locker
- Wardrobe
- Office
- Cash in Hand

---

# 194. PERSON MASTER

Each individual should contain:

- Individual ID
- Name
- Role
- Personal environment
- Firm memberships
- Permissions
- Worker relationships
- Owner/partner relationships
- Status
- Historical associations

---

# 195. FIRM MASTER

Each firm should contain:

- Firm ID
- Firm name
- Firm type
- Partners/owners
- Accounts
- Locations
- Workers
- Tax configuration
- Accounting settings
- Status
- Historical identity

---

# 196. TAX MASTER

Tax rules must be configurable.

Do not permanently hardcode one tax treatment for every transaction.

---

# 197. PAYMENT MASTER

Payment methods can include:

- Cash
- Bank
- UPI
- Card
- Cheque
- Wallet
- Other

Payment method is separate from source account.

---

# 198. PERIOD MASTER

The system should maintain:

- Financial year
- Accounting period
- Open/closed status
- Opening date
- Closing date
- Close status
- Reopen history

---

# 199. ACCOUNTING ERROR CATEGORIES

Support detection of:

- Wrong amount
- Wrong account
- Wrong date
- Wrong firm
- Wrong entity
- Wrong owner
- Wrong source
- Wrong destination
- Wrong category
- Wrong tax
- Wrong location
- Duplicate
- Missing entry
- Incorrect allocation
- Incorrect settlement
- Incorrect loan
- Incorrect advance
- Incorrect opening balance

---

# 200. FINAL GOLDEN RULES — NON-NEGOTIABLE

The finance application must enforce these rules:

1. **Every posted journal must balance.**
2. **Total Debits must equal Total Credits.**
3. **Every transaction must have an explainable accounting effect.**
4. **Every money movement must have a source and destination.**
5. **Source of money and expense owner are separate.**
6. **Who paid does not automatically equal who owns the expense.**
7. **Business transaction meaning and accounting entry are separate layers.**
8. **One real-world event may generate multiple journal lines.**
9. **One real-world event must have one master transaction/event ID.**
10. **Do not double-count linked accounting effects.**
11. **Asset increase normally = Debit.**
12. **Asset decrease normally = Credit.**
13. **Liability increase normally = Credit.**
14. **Liability decrease normally = Debit.**
15. **Equity increase normally = Credit.**
16. **Equity decrease normally = Debit.**
17. **Revenue increase normally = Credit.**
18. **Expense increase normally = Debit.**
19. **Drawings normally = Debit.**
20. **Cash received = Debit Cash.**
21. **Cash paid = Credit Cash.**
22. **Receivable created = Debit Receivable.**
23. **Receivable collected = Credit Receivable.**
24. **Payable created = Credit Payable.**
25. **Payable settled = Debit Payable.**
26. **Advance paid is not automatically expense.**
27. **Advance received is not automatically revenue.**
28. **Loan received is not income.**
29. **Loan principal repayment is not ordinary expense.**
30. **Loan interest is separately accounted for.**
31. **Firm taking a loan creates a liability.**
32. **Firm giving a loan creates a receivable.**
33. **Owner capital is not revenue.**
34. **Owner withdrawal is not automatically business expense.**
35. **Payment of an already-recorded bill does not create another expense.**
36. **Settlement does not recreate the original expense.**
37. **Transfer is not automatically expense.**
38. **Bank-to-cash transfer is not expense.**
39. **Cash-to-bank transfer is not income.**
40. **Unknown money must not automatically become income.**
41. **Personal money paying firm expense must create the appropriate relationship.**
42. **Firm money paying personal expense must create the appropriate personal/owner relationship.**
43. **Own/Personal is a real deduction/financial entry.**
44. **Own/Personal may remain outstanding and later be settled.**
45. **Expense is final unless an explicit receivable/payable/settlement relationship exists.**
46. **Through Owner can create two linked entries.**
47. **Direct Firm → Expense can be one-way.**
48. **Multi-firm allocation must be manually controlled.**
49. **Allocation total must equal transaction total.**
50. **Do not automatically split values equally.**
51. **Every outstanding balance must have a responsible party.**
52. **Every settlement must specify what it settles.**
53. **Every loan must identify lender and borrower.**
54. **Every loan must separately track principal and interest.**
55. **Every advance must track given, used, remaining and returned/settled amounts.**
56. **Receivable/payable direction must always be clear.**
57. **Inter-firm receivable and payable must reconcile.**
58. **Sub-ledgers must reconcile with control accounts.**
59. **Trial Balance must balance.**
60. **No balance may change without an accounting event.**
61. **No magic balances.**
62. **No unexplained cash movement.**
63. **No unexplained receivable/payable movement.**
64. **No unexplained loan movement.**
65. **No unexplained capital movement.**
66. **No unexplained inventory movement.**
67. **No unexplained asset movement.**
68. **Posted transactions must not be silently overwritten.**
69. **Corrections must use adjustment/reversal mechanisms.**
70. **Original posted transactions must remain traceable.**
71. **Historical accounting must survive master-data changes.**
72. **Access changes must not delete historical transactions.**
73. **Personal environment and firm environment are separate.**
74. **Individual identity, access, ownership and permissions are separate.**
75. **Account and location are separate.**
76. **Payment method and source account are separate.**
77. **Category and accounting account are separate.**
78. **Document and accounting event are separate.**
79. **Current holder and owner are separate.**
80. **Authorized access and current holder are separate.**
81. **Closing balance becomes next opening balance.**
82. **Closed periods must be protected.**
83. **Post-close corrections require authorization and audit.**
84. **Every adjustment requires a reason.**
85. **Every reversal preserves original history.**
86. **Every write-off requires authorization.**
87. **Every unidentified transaction must remain identifiable until resolved.**
88. **Suspense must not become permanent.**
89. **Reconciliation differences require explicit investigation/adjustment.**
90. **Every ledger effect must point to its master event.**
91. **Every journal line must belong to a journal/event.**
92. **No orphan accounting lines.**
93. **No duplicate posting of the same real-world event.**
94. **Offline retry must not duplicate accounting value.**
95. **Accounting reports must come from authoritative ledger data.**
96. **Dashboard balances must agree with ledger balances.**
97. **Historical records must remain reconstructable.**
98. **The system must preserve the full source → destination → owner → account → debit/credit → settlement → audit chain.**
99. **Do not hardcode accounting treatment where the economic nature can legitimately differ.**
100. **The accounting engine must always preserve financial integrity before UI convenience.**

---

# 201. FINAL ACCOUNTING FLOW

The application should work conceptually like this:

**REAL-WORLD EVENT**

↓

**BUSINESS TRANSACTION**

↓

**SOURCE**

↓

**DESTINATION**

↓

**OWNER / ENTITY / FIRM**

↓

**PURPOSE / CATEGORY / DIMENSIONS**

↓

**ACCOUNTING TREATMENT**

↓

**JOURNAL**

↓

**DEBIT + CREDIT**

↓

**GENERAL LEDGER**

↓

**SUB-LEDGER / PARTY LEDGER**

↓

**SETTLEMENT / OUTSTANDING**

↓

**RECONCILIATION**

↓

**PERIOD CLOSE**

↓

**FINANCIAL REPORTS**

↓

**AUDIT HISTORY**

---

# 202. FINAL MASTER PRINCIPLE

The user should be able to enter a simple business statement:

**"Firm B gave Firm A ₹5,00,000 as a loan."**

The system must internally understand:

**Lender = Firm B**

**Borrower = Firm A**

**Loan Principal = ₹5,00,000**

**Firm A Bank/Cash = +₹5,00,000**

**Firm A Loan Payable = +₹5,00,000**

**Firm B Loan Receivable = +₹5,00,000**

**Firm B Bank/Cash = −₹5,00,000**

**Income = ₹0**

**Expense = ₹0**

**Master Event ID = one unique ID**

**Journal = balanced**

Later, when Firm A repays ₹1,00,000 principal:

Firm A:

**Dr Loan Payable ₹1,00,000**

**Cr Bank ₹1,00,000**

Firm B:

**Dr Bank ₹1,00,000**

**Cr Loan Receivable ₹1,00,000**

Remaining loan:

**₹4,00,000**

If interest of ₹10,000 is paid separately:

Firm A:

**Dr Interest Expense ₹10,000**

**Cr Bank ₹10,000**

Firm B:

**Dr Bank ₹10,000**

**Cr Interest Income ₹10,000**

The system must therefore distinguish:

**LOAN PRINCIPAL**

from

**INTEREST**

from

**CASH MOVEMENT**

from

**ACCOUNTING INCOME/EXPENSE**

from

**SETTLEMENT**

---

# FINAL IMPLEMENTATION INSTRUCTION

Do not implement these as hundreds of disconnected special-case screens.

Build a reusable accounting engine around:

**ENTITY**

**ACCOUNT**

**SOURCE**

**DESTINATION**

**AMOUNT**

**CURRENCY**

**OWNER**

**FIRM**

**ALLOCATION**

**TRANSACTION TYPE**

**JOURNAL**

**DEBIT**

**CREDIT**

**CATEGORY**

**PURPOSE**

**PROJECT**

**COST CENTER**

**LOCATION**

**CURRENT HOLDER**

**RECEIVABLE/PAYABLE**

**LOAN**

**ADVANCE**

**SETTLEMENT**

**TAX**

**DOCUMENT**

**APPROVAL**

**PERIOD**

**AUDIT**

Every financial scenario should ultimately resolve into valid accounting entries.

The UI can remain simple and business-friendly.

The underlying accounting engine must be rigorous.

The final system must always preserve:

**WHO GAVE THE MONEY → WHERE THE MONEY CAME FROM → WHO RECEIVED IT → WHERE IT WENT → WHO OWNS IT → WHICH FIRM/ENTITY → WHICH ACCOUNT → DEBIT/CREDIT EFFECT → WHETHER ANYONE OWES ANYTHING → HOW IT IS SETTLED → HOW IT IS RECONCILED → HOW IT IS REPORTED → COMPLETE AUDIT HISTORY**

And the most important accounting rule remains:

# SOURCE OF MONEY ≠ EXPENSE OWNER

# DEBIT/CREDIT ≠ SOURCE/DESTINATION

# TRANSFER ≠ EXPENSE

# LOAN ≠ INCOME

# CAPITAL ≠ INCOME

# PRINCIPAL REPAYMENT ≠ EXPENSE

# PAYMENT ≠ AUTOMATICALLY EXPENSE

# SETTLEMENT ≠ ORIGINAL TRANSACTION

# ACCESS ≠ OWNERSHIP ≠ CURRENT HOLDER

# MASTER DATA ≠ TRANSACTIONS

# ONE REAL-WORLD EVENT = ONE MASTER EVENT ID + ALL REQUIRED LINKED ACCOUNTING EFFECTS

Implement the system so that these rules are enforced by the accounting engine, not merely displayed as suggestions in the UI.