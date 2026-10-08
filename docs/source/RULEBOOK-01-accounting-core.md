# ACCOUNTING CORE RULEBOOK

## MASTER ADD-ON FOR THE FINANCE APP

Add this as the **core accounting and ledger engine** of the finance application.

Do not treat this as another UI feature.

These rules must control the underlying:

- Journal engine
- Ledger engine
- Account balances
- Debit/credit logic
- Double-entry accounting
- Sub-ledgers
- Trial balance
- Adjustments
- Settlements
- Closing entries
- Reversals
- Corrections
- Inter-firm accounting
- Owner/partner accounting
- Tax accounting
- Asset accounting
- Inventory accounting
- Receivable/payable accounting
- Audit trail

The system must follow proper double-entry accounting while still supporting the application's custom source/owner/destination model.

---

# 1. FUNDAMENTAL ACCOUNTING EQUATION

The accounting engine must maintain:

**ASSETS = LIABILITIES + EQUITY**

Expanded:

**ASSETS = LIABILITIES + CAPITAL + RETAINED EARNINGS + INCOME − EXPENSES − DRAWINGS**

Every posted transaction must preserve the accounting equation.

No transaction may create or destroy accounting value without a corresponding accounting effect.

---

# 2. DOUBLE-ENTRY GOLDEN RULE

Every posted accounting transaction must have:

**TOTAL DEBITS = TOTAL CREDITS**

A journal entry may contain:

- One debit + one credit
- One debit + multiple credits
- Multiple debits + one credit
- Multiple debits + multiple credits

But:

**TOTAL DEBIT AMOUNT MUST ALWAYS EQUAL TOTAL CREDIT AMOUNT**

If not:

**DO NOT POST THE TRANSACTION.**

Show a validation error.

---

# 3. THE THREE TRADITIONAL GOLDEN RULES

The system should understand the traditional accounting rules.

## Personal Account

**Debit the receiver.**

**Credit the giver.**

Examples:

Person receives money → Debit person.

Person gives money → Credit person.

---

## Real Account

**Debit what comes in.**

**Credit what goes out.**

Examples:

Cash comes into business → Debit Cash.

Cash leaves business → Credit Cash.

Laptop comes into business → Debit Laptop/Asset.

Asset leaves business → Credit Asset.

---

## Nominal Account

**Debit all expenses and losses.**

**Credit all incomes and gains.**

Examples:

Travel Expense → Debit.

Rent Expense → Debit.

Salary Expense → Debit.

Sales Income → Credit.

Commission Income → Credit.

Interest Income → Credit.

---

# 4. MODERN ACCOUNTING RULE

For the actual accounting engine, use the modern classification as the primary computational rule.

| Account Type   | Increase | Decrease | Normal Balance |
| -------------- | -------- | -------- | -------------- |
| Asset          | Debit    | Credit   | Debit          |
| Contra-Asset   | Credit   | Debit    | Credit         |
| Liability      | Credit   | Debit    | Credit         |
| Equity/Capital | Credit   | Debit    | Credit         |
| Revenue/Income | Credit   | Debit    | Credit         |
| Expense        | Debit    | Credit   | Debit          |
| Drawings       | Debit    | Credit   | Debit          |
| COGS           | Debit    | Credit   | Debit          |

The traditional golden rules may be shown conceptually, but the ledger engine must calculate balances consistently using account classification.

---

# 5. ACCOUNT TYPES

The Chart of Accounts must support at least:

## A. ASSET ACCOUNTS

Examples:

- Cash
- Bank
- UPI
- Wallet
- Accounts Receivable
- Inventory
- Prepaid Expense
- Security Deposit
- Loan Receivable
- Employee Advance
- Owner Receivable
- Inter-firm Receivable
- Fixed Asset
- Vehicle
- Machine
- Laptop
- Furniture
- Building
- Land
- Other Asset

Normal balance:

**DEBIT**

---

# 6. CONTRA-ASSET ACCOUNTS

These reduce asset value.

Examples:

- Accumulated Depreciation
- Allowance for Doubtful Receivables
- Other contra-assets

Normal balance:

**CREDIT**

Example:

Machine cost = ₹1,00,000

Accumulated depreciation = ₹20,000

Net asset value = ₹80,000

---

# 7. LIABILITY ACCOUNTS

Examples:

- Accounts Payable
- Supplier Payable
- Salary Payable
- Tax Payable
- GST Payable
- TDS Payable
- Owner Payable
- Worker Payable
- Inter-firm Payable
- Loan Payable
- Credit Card Payable
- Advance Received
- Other Liability

Normal balance:

**CREDIT**

Increase liability → Credit.

Decrease liability → Debit.

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

# 9. DRAWING / WITHDRAWAL ACCOUNTS

Owner taking business money personally is not automatically a business expense.

It should normally be represented through:

**Drawings / Owner Withdrawal / Owner Receivable**

Normal balance:

**DEBIT**

Example:

Owner takes ₹20,000 for personal use.

Dr Owner Drawings ₹20,000
Cr Firm Cash ₹20,000

This reduces business equity rather than incorrectly increasing business expense.

---

# 10. REVENUE / INCOME ACCOUNTS

Examples:

- Sales
- Service Revenue
- Commission
- Brokerage
- Interest Income
- Rental Income
- Other Income
- Asset Sale Gain
- Miscellaneous Income

Normal balance:

**CREDIT**

Income earned → Credit.

Income reversal → Debit.

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
- Repairs
- Bank Charges
- Insurance
- Depreciation
- Interest Expense
- Tax Expense
- Miscellaneous Expense

Normal balance:

**DEBIT**

Expense incurred → Debit.

Expense reversal → Credit.

---

# 12. COGS / COST OF SALES

Cost of goods sold is an expense/cost account.

Normal balance:

**DEBIT**

Under a perpetual inventory system:

Purchase/receipt of inventory:

Dr Inventory
Cr Cash/Payable

Sale of inventory also creates cost recognition:

Dr Cost of Goods Sold
Cr Inventory

The sales side is separate:

Dr Cash/Receivable
Cr Sales Revenue

---

# 13. CASH ACCOUNT RULE

Cash is an asset.

Normal balance:

**DEBIT**

Cash received:

**Debit Cash**

Cash paid:

**Credit Cash**

Cash cannot become negative unless the application's accounting policy explicitly permits an overdraft or negative cash condition and records it properly.

A negative physical cash balance should normally trigger an exception.

---

# 14. BANK ACCOUNT RULE

Bank is normally an asset account.

Money deposited:

**Debit Bank**

Money withdrawn:

**Credit Bank**

Bank charges:

Dr Bank Charges Expense
Cr Bank

Bank interest received:

Dr Bank
Cr Interest Income

Bank balance must be reconcilable against the external bank statement.

---

# 15. ACCOUNTS RECEIVABLE

Customer owes business.

Receivable is an asset.

Normal balance:

**DEBIT**

Credit sale:

Dr Accounts Receivable
Cr Sales Revenue

Customer pays:

Dr Cash/Bank
Cr Accounts Receivable

Customer partial payment:

Only reduce the outstanding amount by the amount actually received.

---

# 16. ACCOUNTS PAYABLE

Business owes supplier.

Payable is a liability.

Normal balance:

**CREDIT**

Bill received:

Dr Expense / Inventory / Asset
Cr Accounts Payable

Payment:

Dr Accounts Payable
Cr Cash/Bank

Partial payment:

Only reduce payable by the amount actually paid.

---

# 17. ADVANCE PAID

An advance paid to someone is NOT automatically an expense.

Until consumed/adjusted, it is normally an asset or recoverable balance.

Example:

Firm gives worker ₹50,000 advance.

Dr Worker Advance ₹50,000
Cr Cash ₹50,000

Worker uses ₹35,000 for approved business expense:

Dr Business Expense ₹35,000
Cr Worker Advance ₹35,000

Remaining:

₹15,000

Worker returns ₹15,000:

Dr Cash ₹15,000
Cr Worker Advance ₹15,000

Advance balance = ₹0

---

# 18. ADVANCE RECEIVED

Money received before the business has earned/released the corresponding income is generally a liability until recognized.

Example:

Customer gives ₹50,000 advance.

Dr Cash ₹50,000
Cr Customer Advance / Unearned Revenue ₹50,000

When revenue is recognized:

Dr Customer Advance
Cr Revenue

Only recognize income when the underlying accounting condition is satisfied.

---

# 19. LOAN RECEIVABLE

Business gives loan.

Loan receivable is an asset.

Example:

Firm gives worker ₹1,00,000 loan.

Dr Worker Loan Receivable ₹1,00,000
Cr Cash ₹1,00,000

Worker repays ₹20,000 principal:

Dr Cash ₹20,000
Cr Worker Loan Receivable ₹20,000

---

# 20. LOAN PAYABLE

Business receives loan.

Loan payable is a liability.

Example:

Bank lends firm ₹5,00,000.

Dr Bank ₹5,00,000
Cr Bank Loan Payable ₹5,00,000

Repayment:

Dr Loan Payable
Cr Bank

Interest must be handled separately when applicable.

---

# 21. OWNER LOAN TO FIRM

Owner lends money to firm.

This is not automatically capital and not automatically income.

Example:

Dr Bank/Cash
Cr Loan Payable to Owner

When repaid:

Dr Loan Payable to Owner
Cr Bank/Cash

If classified as capital instead, it must be explicitly treated as capital.

---

# 22. OWNER CONTRIBUTION / CAPITAL

Owner introduces capital.

Example:

Owner puts ₹2,00,000 into firm.

Dr Cash/Bank ₹2,00,000
Cr Owner Capital ₹2,00,000

Do NOT classify capital contribution as sales income.

---

# 23. OWNER WITHDRAWAL

Owner takes money for personal use.

Example:

Dr Owner Drawings ₹30,000
Cr Cash ₹30,000

Do NOT automatically classify it as business expense.

---

# 24. PERSONAL MONEY USED FOR FIRM EXPENSE

Example:

Owner personally pays ₹10,000 firm travel expense.

Business has incurred expense but has not paid from business funds.

Dr Travel Expense ₹10,000
Cr Owner Payable / Owner Reimbursement ₹10,000

Later firm reimburses owner:

Dr Owner Payable ₹10,000
Cr Cash/Bank ₹10,000

---

# 25. FIRM MONEY USED FOR PERSONAL EXPENSE

Example:

Firm pays owner's personal expense ₹10,000.

Depending on the application's classification:

Dr Owner Drawings / Owner Receivable ₹10,000
Cr Cash/Bank ₹10,000

Do not blindly classify this as business expense.

---

# 26. WORKER PERSONAL USE OF FIRM MONEY

If firm money is given to a worker for personal/own use:

Dr Worker Recoverable / Worker Own Balance
Cr Cash/Bank

The amount becomes the worker's responsibility according to the application's settlement rules.

This is consistent with the previously defined rule that **Own/Personal is a real deduction entry**, not just a note.

---

# 27. WORKER BUSINESS EXPENSE

If firm gives money to worker specifically for a business expense:

At advance stage:

Dr Worker Advance
Cr Cash

After approved expense:

Dr Business Expense
Cr Worker Advance

Do not create unnecessary personal balances.

---

# 28. FIRM A PAYS FIRM B EXPENSE

This is a key inter-firm rule.

Example:

Firm A pays ₹50,000 for Firm B's expense.

Possible accounting:

Firm B:

Dr Expense ₹50,000
Cr Inter-firm Payable to Firm A ₹50,000

Firm A:

Dr Inter-firm Receivable from Firm B ₹50,000
Cr Cash/Bank ₹50,000

This is one real-world event represented across multiple ledgers.

Do not create unrelated duplicate transactions.

The application's earlier architecture already requires one master event to generate these linked ledger effects.

---

# 29. FIRM B REPAYS FIRM A

Firm B pays ₹50,000.

Firm B:

Dr Inter-firm Payable to Firm A
Cr Cash/Bank

Firm A:

Dr Cash/Bank
Cr Inter-firm Receivable from Firm B

Inter-firm outstanding becomes zero.

---

# 30. BILATERAL INTER-FIRM BALANCES

Suppose:

Firm A owes Firm B ₹50,000.

Firm B owes Firm A ₹20,000.

Do not treat them as unrelated forever.

The system should be able to show:

A → payable ₹50,000
A → receivable ₹20,000

Net position:

A owes B ₹30,000.

Authorized users may perform a net settlement/offset where legally/accountingly appropriate.

---

# 31. MULTI-FIRM EXPENSE ALLOCATION

Example:

Total expense = ₹45,000.

Allocation:

Firm A = ₹30,000
Firm B = ₹5,000
Personal = ₹10,000

The accounting engine must create the appropriate expense/allocation effects.

The sum MUST equal:

**₹45,000**

No automatic equal split.

Allocation must remain explicit.

---

# 32. PARTIAL PAYMENT

Bill = ₹1,00,000.

Paid = ₹40,000.

After payment:

Payable = ₹60,000.

Do not mark the whole bill as paid.

---

# 33. PARTIAL RECEIPT

Customer owes ₹1,00,000.

Receives ₹35,000.

Receivable remaining:

₹65,000.

The system must retain the original outstanding amount and link the payment to it.

---

# 34. MULTIPLE PAYMENTS AGAINST ONE ITEM

Invoice = ₹1,00,000.

Payments:

₹20,000
₹30,000
₹50,000

Outstanding after each:

₹80,000
₹50,000
₹0

All payment records remain separately traceable.

---

# 35. ONE PAYMENT AGAINST MULTIPLE ITEMS

One ₹1,00,000 payment may settle:

- Supplier bill ₹50,000
- Worker payable ₹20,000
- Advance recovery ₹30,000

The settlement allocation must show exactly where the ₹1,00,000 was applied.

---

# 36. EXPENSE ACCRUAL

Expense belongs to current period but has not yet been paid.

Example:

Salary expense ₹1,00,000 incurred but unpaid.

Dr Salary Expense ₹1,00,000
Cr Salary Payable ₹1,00,000

When paid:

Dr Salary Payable
Cr Bank/Cash

---

# 37. PREPAID EXPENSE

Money paid first, expense belongs to future period.

Example:

Insurance ₹1,20,000 paid for 12 months.

Initial:

Dr Prepaid Insurance ₹1,20,000
Cr Bank ₹1,20,000

Monthly recognition:

Dr Insurance Expense ₹10,000
Cr Prepaid Insurance ₹10,000

After 12 months:

Prepaid balance = ₹0.

---

# 38. DEPRECIATION

Asset cost should not normally be immediately treated entirely as period expense when capitalization/depreciation applies.

Example:

Machine ₹10,00,000.

Purchase:

Dr Machine Asset ₹10,00,000
Cr Bank ₹10,00,000

Monthly depreciation:

Dr Depreciation Expense
Cr Accumulated Depreciation

The asset's original cost remains traceable.

Accumulated depreciation is maintained separately.

---

# 39. ASSET SALE

Example:

Asset cost = ₹1,00,000

Accumulated depreciation = ₹40,000

Net book value = ₹60,000

Sold for ₹70,000.

The system must:

- Remove original asset cost
- Remove accumulated depreciation
- Record cash/receivable
- Calculate gain/loss

Gain = ₹10,000.

Do not simply record ₹70,000 as income without removing the asset carrying value.

---

# 40. BAD DEBT / RECEIVABLE WRITE-OFF

Customer receivable = ₹50,000.

Approved write-off:

Dr Bad Debt Expense ₹50,000
Cr Accounts Receivable ₹50,000

If later recovered:

Dr Cash
Cr Bad Debt Recovery / appropriate income account

Do not silently rewrite the original invoice.

---

# 41. PROVISION / ALLOWANCE

Where applicable, the engine should support provisions/allowances.

Example:

Expected doubtful receivable = ₹10,000.

Dr Bad Debt / Provision Expense
Cr Allowance for Doubtful Receivables

The exact statutory/accounting treatment should be configurable by accounting framework.

---

# 42. DISCOUNT

Discount can affect:

- Revenue
- Purchase cost
- Expense
- Receivable
- Payable
- Tax base

Do not assume every discount is simply "other income."

The exact treatment depends on whether the discount is granted/received and where it belongs in the transaction.

---

# 43. REFUND

Refund must be linked to the original financial event whenever possible.

Example:

Original expense:

Dr Expense ₹10,000
Cr Cash ₹10,000

Refund ₹3,000:

Dr Cash ₹3,000
Cr Expense / Refund-related account ₹3,000

Do not create an unrelated transaction with no link to the original expense.

---

# 44. CREDIT NOTE

A credit note should adjust the underlying receivable/payable/revenue/expense relationship rather than behaving like an unrelated cash receipt.

Example:

Customer credit note reduces amount receivable.

Supplier credit note reduces amount payable or purchase-related value as applicable.

---

# 45. DEBIT NOTE

Debit note should create the appropriate adjustment to the underlying transaction relationship.

Its accounting effect depends on whether the business is issuing or receiving the document.

Do not hardcode one debit rule for every debit-note situation.

---

# 46. GST / TAX ACCOUNTING STRUCTURE

Tax accounts should be separate from the base expense/revenue when applicable.

Possible accounts include:

- Input GST
- Output GST
- CGST
- SGST
- IGST
- TDS Payable
- TDS Receivable
- Other Tax Payable
- Other Tax Receivable

Tax treatment must be configurable.

Do not hardcode one tax treatment for every transaction type.

---

# 47. TAX-INCLUSIVE VALUE

If total invoice value is ₹11,800 including 18% GST:

The system must split:

Base value

-

Tax

\=

Gross value

The accounting engine must maintain the exact components rather than treating the full ₹11,800 as pure expense/revenue.

---

# 48. TAX-EXCLUSIVE VALUE

If base expense = ₹10,000 and GST = ₹1,800:

Total payable = ₹11,800.

The accounting entry must reflect the applicable expense and tax accounts separately when eligible/applicable.

---

# 49. ROUNDING

Accounting values may require rounding.

Support:

- Currency precision
- Tax rounding
- Line-level rounding
- Invoice-level rounding
- Rounding adjustment

Never allow rounding differences to silently break:

**Debit = Credit**

A rounding adjustment account may be required where appropriate.

---

# 50. CURRENCY

Every monetary posting should carry:

- Currency
- Amount
- Exchange rate where applicable
- Base currency amount

Example:

USD 100

Exchange rate = ₹83

Base amount = ₹8,300

If settled at another rate, the difference must be represented as an exchange gain/loss where applicable.

---

# 51. JOURNAL ENTRY TYPES

The engine should support different journal categories.

### Standard Journal

Normal transaction.

### Compound Journal

Multiple debits/credits.

### Adjusting Journal

Accruals, depreciation, provisions, corrections.

### Reversing Journal

Automatically reverses a previous adjustment where required.

### Closing Journal

Closes temporary revenue/expense accounts.

### Opening Journal

Creates opening balances.

### Transfer Journal

Moves balances between accounts.

### Settlement Journal

Clears receivable/payable/advance balances.

### Reclassification Journal

Moves a balance from one account/classification to another.

### Correction Journal

Corrects a previous posted transaction through a traceable adjustment.

### Reversal Journal

Reverses the accounting effect of a previous posting.

---

# 52. JOURNAL ENTRY STATUS

A journal/transaction may be:

- Draft
- Submitted
- Pending Approval
- Approved
- Posted
- Partially Settled
- Fully Settled
- Reversed
- Cancelled
- Rejected
- Voided where appropriate

Once posted, it should not be silently changed.

---

# 53. JOURNAL ENTRY STRUCTURE

Every journal should contain:

- Journal ID
- Transaction/Event ID
- Posting date
- Entry date/time
- Description
- Currency
- Exchange rate where applicable
- Source
- Destination
- Account
- Debit
- Credit
- Entity
- Firm
- Cost center
- Project/purpose
- Tax information
- Reference
- Document
- Created by
- Approved by
- Posted by
- Reversal reference
- Parent/related transaction
- Audit history

---

# 54. JOURNAL LINE RULE

Each individual journal line must contain:

**Account + Debit OR Credit + Amount**

Do not put both debit and credit amount on the same line.

For a standard journal line:

Either:

Debit > 0 and Credit = 0

OR:

Credit > 0 and Debit = 0

Amount must not be negative.

---

# 55. NEVER USE NEGATIVE AMOUNTS TO HIDE ACCOUNTING DIRECTION

Prefer:

Debit ₹10,000

instead of:

Debit -₹10,000

and:

Credit ₹10,000

instead of:

Credit -₹10,000

Direction should be represented by the debit/credit side.

For reversals, reverse the sides.

---

# 56. REVERSAL RULE

Original:

Dr Expense ₹10,000
Cr Cash ₹10,000

Reversal:

Dr Cash ₹10,000
Cr Expense ₹10,000

Do not modify the original entry.

Keep:

Original Transaction

-

Reversal Transaction

linked together.

---

# 57. CORRECTION RULE

If a posted transaction was wrong:

Do NOT overwrite history.

Instead:

Original entry remains.

Create:

- Reversal
- Correct replacement
- Adjustment

linked to the original.

The audit history must show:

**Original → Correction → Final state**

---

# 58. VOID / CANCEL RULE

A draft may normally be deleted/cancelled according to permissions.

A posted accounting transaction should generally be:

- Reversed
- Voided through an accounting mechanism
- Adjusted

rather than physically erased.

The original must remain traceable.

---

# 59. LEDGER

A ledger is the account-wise history of postings.

Example:

## Cash Ledger

Opening = ₹1,00,000

Receipt = ₹50,000

Payment = ₹20,000

Closing:

₹1,00,000 + ₹50,000 − ₹20,000

\= ₹1,30,000

The ledger must retain the underlying entries.

---

# 60. LEDGER ACCOUNT BALANCE

Every ledger account should maintain:

- Opening balance
- Debit movements
- Credit movements
- Closing balance

For a debit-normal account:

**Closing = Opening + Debits − Credits**

For a credit-normal account:

**Closing = Opening + Credits − Debits**

The system must know the normal balance type from the account master.

---

# 61. LEDGER TYPES

Support at minimum:

### General Ledger

Main accounting ledger.

### Cash Ledger

Detailed cash movement.

### Bank Ledger

Bank account movements.

### Accounts Receivable Ledger

Customer-wise outstanding.

### Accounts Payable Ledger

Supplier-wise outstanding.

### Owner Ledger

Owner contribution, withdrawal, payable/receivable.

### Partner Ledger

Partner-wise balances.

### Worker/Employee Ledger

Advances, reimbursements, salary, recoverables.

### Inter-Firm Ledger

Firm-to-firm receivable/payable.

### Loan Ledger

Principal, repayment, interest.

### Advance Ledger

Outstanding advances.

### Tax Ledger

GST/TDS/tax balances.

### Inventory Ledger

Quantity and value movements.

### Fixed Asset Ledger

Asset cost, depreciation, disposal.

### Location/Cash-Control Ledger

Physical storage and responsible-holder movements.

---

# 62. SUB-LEDGER VS GENERAL LEDGER

Where detailed party tracking is required, use sub-ledgers.

Example:

General Ledger:

**Accounts Receivable = ₹5,00,000**

Sub-ledger:

Customer A = ₹2,00,000

Customer B = ₹1,50,000

Customer C = ₹1,50,000

Total:

₹5,00,000

The sub-ledger total must reconcile to the related control account.

---

# 63. CONTROL ACCOUNT RULE

If a control account exists in the General Ledger, its detailed sub-ledger total must reconcile to it.

Examples:

- Accounts Receivable control
- Accounts Payable control
- Inventory control
- Payroll payable control
- Tax control

Difference should trigger reconciliation.

---

# 64. TRIAL BALANCE

The system must generate a trial balance.

For every ledger account show:

- Opening debit/credit
- Period debit
- Period credit
- Closing debit/credit

Core validation:

**Total Debits = Total Credits**

A difference means there is a posting/data-integrity problem.

---

# 65. PROFIT & LOSS

Temporary revenue and expense accounts ultimately affect profit/loss.

Revenue generally increases profit.

Expense generally decreases profit.

The system should not treat:

- Capital contribution
- Loan received
- Owner transfer
- Inter-firm transfer
- Normal liability creation

as revenue.

Similarly, do not treat:

- Loan principal repayment
- Owner withdrawal
- Inter-firm settlement

as ordinary business expense unless the transaction's actual nature says so.

---

# 66. BALANCE SHEET CLASSIFICATION

The system must correctly classify:

### Assets

What the business owns/controls or is entitled to receive.

### Liabilities

What the business owes.

### Equity

Owner/partner residual interest.

### Revenue

Income earned.

### Expenses

Costs incurred.

Classification must come from the account master and transaction rules, not from screen names alone.

---

# 67. TEMPORARY VS PERMANENT ACCOUNTS

### Temporary accounts

Normally include:

- Revenue
- Expenses
- Gains
- Losses

These are closed/transferred as part of period-end accounting.

### Permanent accounts

Normally include:

- Assets
- Liabilities
- Equity

These carry forward into the next accounting period.

---

# 68. CLOSING ENTRY

At period end, temporary accounts must be closed according to the accounting framework.

Conceptually:

Revenue accounts → closed to Profit/Loss

Expense accounts → closed to Profit/Loss

Profit/Loss → transferred to appropriate equity/retained earnings structure

Permanent balance-sheet accounts remain.

---

# 69. OPENING BALANCE

Next accounting period opening balances must derive from the previous closing balances.

Example:

Previous month closing Cash = ₹1,30,000

Next month opening Cash = ₹1,30,000

Do not manually create a different balance without an authorized adjustment.

---

# 70. ACCRUAL ACCOUNTING RULE

Where accrual accounting is used:

Record the economic event in the period to which it belongs, not only when cash physically moves.

Examples:

- Expense incurred before payment
- Revenue earned before collection
- Salary accrued before payment
- Interest accrued before payment

Cash movement and accounting recognition can therefore occur at different times.

---

# 71. CASH ACCOUNTING VS ACCRUAL ACCOUNTING

The app should support an explicit accounting basis/configuration where required.

Do not mix the two silently.

Under accrual:

Expense may exist before cash payment.

Revenue may exist before cash collection.

Under cash accounting:

Recognition is more closely tied to actual cash movement.

The selected accounting basis must affect reports consistently.

---

# 72. SOURCE / DESTINATION VS DEBIT / CREDIT

This distinction is extremely important.

The application's business transaction model:

**SOURCE → DESTINATION**

is not the same thing as:

**DEBIT → CREDIT**

Example:

Firm A money pays Firm B expense.

Business meaning:

**Source = Firm A cash**

**Destination = Firm B expense**

Accounting may produce:

Firm B Expense → Debit

Firm A Cash → Credit

and:

Firm B Inter-firm Payable → Credit

Firm A Inter-firm Receivable → Debit

So:

**SOURCE/DESTINATION describes the real-world movement.**

**DEBIT/CREDIT describes accounting effects.**

Do NOT merge these concepts into one database field.

---

# 73. ONE REAL-WORLD EVENT CAN CREATE MULTIPLE JOURNAL LINES

Example:

Firm A pays Firm B expense ₹50,000.

One master event:

**TXN-001**

Possible ledger effects:

Firm A Cash → Credit ₹50,000

Firm A Inter-firm Receivable → Debit ₹50,000

Firm B Expense → Debit ₹50,000

Firm B Inter-firm Payable → Credit ₹50,000

These are four accounting lines.

But they represent:

**ONE real-world economic event**

All lines must share the master event ID.

---

# 74. PERSONAL / FIRM SEPARATION

Personal money and firm money must not silently mix.

Whenever personal money pays business expense:

Create the appropriate owner/individual payable/reimbursement relationship.

Whenever firm money pays personal use:

Create appropriate withdrawal/receivable logic.

Never simply change the firm cash balance without recording why.

---

# 75. INTER-ENTITY ACCOUNTING

When Entity A pays on behalf of Entity B:

Entity A may have:

**Receivable from B**

Entity B may have:

**Payable to A**

When settled:

Both balances reduce.

This applies to:

- Firms
- Owners
- Workers
- Partners
- Other entities

where economically appropriate.

---

# 76. SETTLEMENT IS NOT THE SAME AS ORIGINAL TRANSACTION

Example:

Firm A pays Firm B expense ₹50,000.

Original event creates:

Firm B Payable = ₹50,000.

Later Firm B pays Firm A ₹50,000.

That second event is:

**Settlement**

It is NOT a new ₹50,000 expense.

The system must not double-count the expense.

---

# 77. TRANSFER IS NOT EXPENSE

Firm A → Firm B ₹1,00,000 cash transfer.

If it is genuinely only a transfer:

Do not record ₹1,00,000 as expense.

It should move the relevant asset/fund/inter-entity balances.

Likewise:

Bank → Cash

is not an expense.

Cash → Bank

is not income.

Owner → Firm capital

is not revenue.

Firm → Owner withdrawal

is not ordinary expense.

---

# 78. LOAN PRINCIPAL IS NOT EXPENSE/INCOME

Loan received:

Not revenue.

Loan principal repaid:

Not ordinary expense.

Interest may be expense/income separately.

---

# 79. CAPITAL IS NOT REVENUE

Owner capital contribution:

Not sales income.

Partner capital contribution:

Not sales income.

Share/capital issue:

Not ordinary operating revenue.

---

# 80. DRAWING IS NOT ORDINARY BUSINESS EXPENSE

Owner personal withdrawal:

Not ordinary operating expense.

It affects equity/owner balance according to the accounting structure.

---

# 81. INVENTORY VALUE RULE

Inventory movement must track:

- Quantity
- Unit cost
- Total value
- Location
- Entity
- Ownership
- Movement

Do not confuse:

**Quantity movement**

with:

**Expense recognition**

Under perpetual inventory accounting, inventory can remain an asset until sold/consumed according to the relevant accounting treatment.

---

# 82. INVENTORY TRANSFER

Firm A location → Firm A location:

Usually transfer inventory location/value, not expense.

Firm A → Firm B:

May require:

- Transfer
- Sale
- Inter-firm transaction
- Other appropriate treatment

depending on the real economic event.

Do not automatically classify every stock movement as expense.

---

# 83. FIXED ASSET VS EXPENSE

The system must distinguish:

**Capital expenditure**

from

**Revenue/operating expense**

Example:

Buying a machine may create an asset.

Routine repair may be an expense.

The classification should be configurable and reviewable rather than based only on the word used by the user.

---

# 84. COST CENTER / PROJECT ACCOUNTING

An expense can belong to:

- Firm
- Department
- Branch
- Project
- Client
- Product
- Cost center
- Purpose

These dimensions should not replace the accounting account.

Example:

Account = Travel Expense

Cost Center = Sales Team

Project = Mumbai Visit

Firm = Firm A

All are separate dimensions.

---

# 85. DIMENSIONS MUST NOT REPLACE LEDGER ACCOUNTS

Do not create thousands of ledger accounts just because there are many:

- People
- Projects
- Firms
- Locations
- Categories

Use dimensions/sub-ledgers where appropriate.

The Chart of Accounts should remain manageable.

---

# 86. ACCOUNT HIERARCHY

The Chart of Accounts should support hierarchy.

Example:

Assets
→ Current Assets
→ Cash & Cash Equivalents
→ Cash
→ Firm A Cash
→ Tijori

Or:

Expenses
→ Travel
→ Hotel
→ Domestic Hotel

The hierarchy must support reporting without breaking underlying ledger identity.

---

# 87. ACCOUNT MASTER FIELDS

Each account should have:

- Account ID
- Account name
- Account code
- Account type
- Parent account
- Normal balance
- Firm/entity
- Currency
- Active/inactive
- Control account flag
- Sub-ledger type
- Tax applicability where relevant
- Cost center support
- Project support
- Opening balance
- Created date
- Updated date
- Created by
- Audit history

---

# 88. OPENING BALANCE RULE

Opening balances must be explicitly entered/imported or derived from previous closing balances.

Opening balances must themselves balance.

Example:

Assets ₹10,00,000

Liabilities + Equity ₹10,00,000

If not balanced, the system must flag the opening migration/setup.

Do not silently invent balancing numbers.

---

# 89. ACCOUNT NORMAL BALANCE

Every account must know whether its normal balance is:

**Debit**

or

**Credit**

Examples:

Debit-normal:

- Cash
- Bank
- Receivables
- Inventory
- Expenses
- Drawings
- Fixed Assets

Credit-normal:

- Payables
- Loans
- Capital
- Revenue
- Accumulated Depreciation

---

# 90. BALANCE SIGN RULE

Do not determine account meaning merely from whether a numeric balance is positive or negative.

An account may legitimately have an unusual balance.

The account's classification determines how the balance should be interpreted.

Example:

A liability with a debit balance may mean:

- Overpayment
- Credit balance reversal
- Advance
- Adjustment
- Data error

It should trigger the appropriate interpretation/reconciliation rather than being hidden.

---

# 91. NO SILENT NETTING

Do not automatically net unrelated balances.

Example:

Customer A receivable ₹50,000

Customer B payable ₹30,000

Do not combine them into a single ₹20,000 number.

Netting should only happen when economically/legal-accounting appropriate and explicitly supported.

---

# 92. ROUND-TRIP VALUE RULE

For every money movement:

**Value leaving one place must appear somewhere else.**

Example:

Firm Cash ↓ ₹50,000

That ₹50,000 must be represented by:

- Expense
- Asset
- Receivable
- Loan
- Transfer
- Settlement
- Withdrawal
- Other valid accounting destination

Never allow:

**Cash ↓ ₹50,000**

with no corresponding accounting explanation.

---

# 93. BALANCE INTEGRITY RULE

For every posted transaction:

**Debits = Credits**

For every fund movement:

**Source decrease = destination increase**, adjusted for the exact accounting nature.

For every settlement:

**Outstanding after = outstanding before − allocated settlement ± approved adjustments**

For every allocation:

**Sum of allocations = transaction total**

For every month:

**Opening = Previous Closing**

---

# 94. DUPLICATE POSTING RULE

The same real-world event must not accidentally be posted twice.

Use:

- Unique transaction ID
- Idempotency key where applicable
- External reference
- Document number
- Payment reference
- Bank transaction reference

The system should detect likely duplicates.

---

# 95. POSTED ENTRY IMMUTABILITY

After posting:

Do not directly overwrite:

- Amount
- Account
- Date
- Entity
- Firm
- Owner
- Tax
- Settlement
- Source
- Destination

unless the accounting architecture explicitly treats the change as a controlled correction.

Prefer:

**Original → Reversal/Adjustment → Correct Entry**

---

# 96. PERIOD LOCK

Once a period closes:

Normal users must not edit posted accounting data from that period.

Authorized users may reopen or post controlled adjustments depending on permissions.

Every reopening must be audited.

---

# 97. AUDIT RULE

Every accounting mutation must preserve:

- Who
- What
- When
- Before
- After
- Why
- Related transaction
- Approval
- Reversal
- Document

Accounting history must remain reconstructable.

---

# 98. APPROVAL RULE

The system may support:

**Maker → Checker → Poster**

Example:

User creates transaction.

Manager approves.

System posts.

A user must not automatically be allowed to approve their own transaction if the configured control policy requires maker/checker separation.

High-value transactions may require additional approval levels.

---

# 99. BANK RECONCILIATION RULE

Bank ledger and bank statement are separate sources.

Reconciliation should match:

- Date
- Amount
- Reference
- Bank transaction ID
- Description

Possible states:

- Unmatched
- Matched
- Partially matched
- Duplicate
- Unknown
- Adjusted
- Reconciled

Never delete a ledger entry merely because the bank statement does not match it.

Investigate first.

---

# 100. CASH RECONCILIATION RULE

Ledger cash may differ from physical cash.

Example:

Ledger = ₹1,00,000

Physical = ₹98,000

Difference = ₹2,000

The system should create an authorized reconciliation/adjustment process.

Do not simply change ledger cash to ₹98,000 without recording why.

---

# 101. LOCATION ACCOUNTING

If cash moves:

Tijori → Drawer

That is normally a movement of the same cash, not a new expense.

Example:

Dr Drawer ₹20,000
Cr Tijori ₹20,000

The total physical cash remains ₹20,000.

---

# 102. CURRENT HOLDER IS NOT ACCOUNT OWNER

Example:

Tijori owner = Firm

Authorized access = Krish + Father

Current holder = Father

Father gives key to Krish.

Current holder changes.

Ownership does not automatically change.

Accounting and access systems must remain separate.

---

# 103. PAYMENT METHOD IS NOT ACCOUNT TYPE

"UPI" is a payment method/channel.

"Bank Account" is an account/fund.

Do not confuse:

**How money moved**

with

**Where money was held.**

Example:

UPI payment from HDFC bank account.

Payment method = UPI

Source account = HDFC Bank

---

# 104. DOCUMENT IS NOT ACCOUNTING

Invoice, receipt, screenshot, bill, etc. are supporting evidence.

A document does not automatically create a journal entry.

The accounting event must be intentionally interpreted and posted.

---

# 105. CATEGORY IS NOT LEDGER ACCOUNT

Example:

Category:

Travel → Hotel

Accounting account:

Travel Expense

Firm:

Firm A

Project:

Mumbai Visit

These are different dimensions.

Do not force one field to perform all roles.

---

# 106. SOURCE OF MONEY IS NOT ACCOUNTING OWNER

Example:

Source = Firm B Bank

Expense Owner = Firm A

The source account determines where money came from.

Expense ownership determines whose expense it is.

These must remain separate.

---

# 107. VALUE ALLOCATION RULE

Suppose total transaction = ₹1,00,000.

Allocation:

Firm A ₹40,000
Firm B ₹30,000
Personal ₹20,000
Worker ₹10,000

Total = ₹1,00,000

Valid.

If allocation becomes:

₹40,000 + ₹30,000 + ₹20,000 + ₹5,000

Total = ₹95,000

Invalid.

Do not automatically assign the remaining ₹5,000.

---

# 108. TAX ALLOCATION RULE

For multi-entity expenses, tax may also require allocation.

The application must not assume tax is always allocated exactly like the gross expense.

Tax treatment should be configurable.

---

# 109. SETTLEMENT ALLOCATION RULE

A settlement can only reduce an outstanding balance by the amount actually allocated to it.

If outstanding = ₹50,000

Settlement = ₹20,000

Remaining = ₹30,000.

If the payment is ₹50,000 but only ₹20,000 is allocated to this item, this item remains ₹30,000 outstanding.

The remaining ₹30,000 must be allocated elsewhere or remain unapplied.

---

# 110. UNAPPLIED PAYMENT

A payment may be received before knowing what it belongs to.

Example:

Bank receives ₹50,000.

Unknown customer/invoice.

Do not guess.

Record as:

**Unidentified / Unapplied Receipt**

Then later assign it.

Status:

**Unidentified → Investigating → Assigned → Reconciled**

---

# 111. UNAPPLIED RECEIPT DOES NOT BECOME RANDOM INCOME

Do not classify every unknown cash/bank receipt as income.

Unknown money should remain identifiable as an unresolved balance until properly classified.

---

# 112. UNPAID BILL DOES NOT MEAN NO ACCOUNTING

Under accrual accounting:

Bill received:

Dr Expense/Asset/Inventory
Cr Payable

Cash has not moved yet.

This is valid accounting.

---

# 113. PAYMENT DOES NOT CREATE THE EXPENSE A SECOND TIME

If the expense was already recorded when the bill was received:

Payment should clear payable.

Do NOT record another expense.

Example:

Bill:

Dr Expense ₹10,000
Cr Payable ₹10,000

Payment:

Dr Payable ₹10,000
Cr Cash ₹10,000

Final expense remains ₹10,000, not ₹20,000.

---

# 114. ADVANCE PAYMENT DOES NOT AUTOMATICALLY CREATE EXPENSE

Example:

Firm pays supplier ₹50,000 advance.

Dr Supplier Advance ₹50,000
Cr Bank ₹50,000

Later supplier bill = ₹45,000.

Recognize applicable expense/inventory and adjust the advance.

Remaining ₹5,000 becomes:

- Refund receivable
- Future advance
- Other appropriate balance

It must not disappear.

---

# 115. OVERPAYMENT

Payable = ₹50,000

Firm accidentally pays ₹55,000.

The extra ₹5,000 should become an identifiable:

**Supplier Receivable / Advance**

unless corrected/refunded.

Do not silently write off the extra amount.

---

# 116. UNDERPAYMENT

Payable = ₹50,000

Firm pays ₹45,000.

Remaining payable:

₹5,000

Do not mark full payment unless an authorized discount/write-off adjustment explains the difference.

---

# 117. WRITE-OFF

Write-off must be an explicit accounting event.

Support:

- Receivable write-off
- Payable write-off
- Loan write-off
- Advance write-off
- Cash shortage adjustment
- Inventory shortage adjustment

Every write-off requires:

- Amount
- Reason
- Approver
- Date
- Account
- Audit trail

---

# 118. FORGIVENESS / WAIVER

A balance may be voluntarily forgiven.

This should not be silently treated as a payment.

Example:

Customer owes ₹50,000.

Business approves ₹10,000 waiver.

Remaining receivable:

₹40,000

The ₹10,000 adjustment must be recorded separately.

---

# 119. OFFSET / SET-OFF

Two balances may sometimes be legally/accountingly offset.

Example:

A owes B ₹50,000.

B owes A ₹20,000.

Authorized offset:

Net = ₹30,000

The system must preserve the original balances and record the offset event.

Do not erase the original receivables/payables.

---

# 120. RELATED TRANSACTIONS

Every derived accounting entry should be linkable to:

- Parent transaction
- Original transaction
- Settlement
- Reversal
- Adjustment
- Invoice
- Payment
- Document

The user should be able to navigate:

**Original transaction → ledger entries → settlement → reversal/correction**

---

# 121. TRANSACTION ID RULE

One real-world event:

**ONE MASTER EVENT ID**

It can generate:

- Journal header
- Multiple journal lines
- Multiple entity effects
- Multiple ledger effects
- Settlement records
- Audit records

But all remain linked.

---

# 122. DO NOT CREATE DUPLICATE ECONOMIC VALUE

If a single ₹50,000 event creates:

Cash reduction ₹50,000

Expense ₹50,000

Payable ₹50,000

Do NOT interpret those three numbers as ₹1,50,000 of separate spending.

They are connected accounting effects.

---

# 123. JOURNAL VS LEDGER

### Journal

Chronological record of accounting events.

### Ledger

Account-wise record of those journal postings.

### Sub-ledger

Detailed party/item-level record supporting a control account.

### Trial Balance

Summary of ledger debit/credit balances.

### Financial Statements

Reports generated from the accounting structure.

The architecture should preserve these relationships.

---

# 124. CHART OF ACCOUNTS RULE

Do not hardcode one universal Chart of Accounts for every business.

Allow authorized admins to:

- Create
- Edit
- Rename
- Reclassify where permitted
- Activate
- Deactivate
- Archive
- Create parent/child accounts

But protect historical accounting meaning.

---

# 125. ACCOUNT DEACTIVATION

A ledger account used historically may be deactivated.

It should remain visible in historical transactions.

It should not be selectable for new transactions unless intentionally reactivated.

---

# 126. ACCOUNT MERGING

If accounts are merged:

Do not destroy historical identity without preserving traceability.

Example:

Hotel Expense A

Hotel Expense B

Future use may be combined under:

Hotel Expense

Historical transactions must remain auditable.

---

# 127. ACCOUNT RECLASSIFICATION

Example:

Expense was incorrectly classified as Office Expense.

Correction:

Office Expense → Travel Expense

Use controlled reclassification/adjustment.

Do not silently rewrite historical reports.

---

# 128. MONTH-END RECONCILIATION

Before closing a month, system should check:

- Cash
- Bank
- Receivables
- Payables
- Advances
- Loans
- Owners
- Partners
- Workers
- Inter-firm balances
- Inventory
- Assets
- Tax
- Unidentified transactions
- Suspense/reconciliation accounts
- Trial balance

---

# 129. MONTH CLOSE VALIDATION

Month should not close normally if there is an unresolved:

- Unbalanced journal
- Invalid ledger
- Broken allocation
- Broken account reference
- Critical reconciliation issue
- Missing required approval
- Invalid opening/closing balance

The application may allow authorized override with reason and audit trail.

---

# 130. SUSPENSE / UNKNOWN ACCOUNT

The system may need a temporary controlled suspense account for genuinely unidentified amounts.

But:

**Suspense is not a permanent dumping ground.**

Every suspense balance should be investigated and cleared.

---

# 131. ERROR ACCOUNTING RULE

Never solve a software error by simply changing a balance.

Every financial correction should create an explainable accounting event.

---

# 132. RECONCILIATION ADJUSTMENT

When reality differs from the ledger:

Create:

**Reconciliation Adjustment**

with:

- Reason
- Amount
- Account
- Date
- Person
- Approval
- Evidence
- Audit trail

---

# 133. HISTORICAL INTEGRITY

A later master-data change must not rewrite old accounting reality.

Examples:

- Firm renamed
- Worker removed
- Partner leaves
- Account deactivated
- Location ownership changes
- Access revoked
- Category renamed

Historical transactions must remain traceable.

---

# 134. PERIOD COMPARISON

The system should allow:

- Daily
- Weekly
- Monthly
- Quarterly
- Yearly

comparison of:

- Revenue
- Expense
- Cash
- Receivables
- Payables
- Profit
- Assets
- Liabilities

without changing the underlying ledger.

---

# 135. ACCOUNTING PRINCIPLES TO ENFORCE

Where applicable, the system should be designed around:

- Business entity principle
- Dual-aspect principle
- Accrual principle
- Matching principle
- Accounting-period principle
- Going-concern assumption
- Consistency
- Prudence/conservatism where applicable
- Materiality
- Full disclosure
- Substance over form
- Historical/appropriate measurement according to configured accounting framework

These are conceptual controls; exact statutory treatment should remain configurable by jurisdiction/accounting framework.

---

# 136. NO MAGIC BALANCES

Never allow the following without a corresponding accounting explanation:

- Cash suddenly increases
- Cash suddenly decreases
- Owner balance changes
- Worker balance changes
- Supplier balance changes
- Customer balance changes
- Inter-firm balance changes
- Loan balance changes
- Inventory value changes
- Asset value changes
- Tax balance changes

Every change must originate from a transaction, adjustment, opening balance, or authorized accounting process.

---

# 137. VALUE FLOW RULE

Every transaction should answer:

### Before

What was the balance?

### Event

What happened?

### Debit/Credit

Which accounts changed?

### After

What is the new balance?

Example:

Cash before = ₹1,00,000

Expense = ₹20,000

Cash after = ₹80,000

Expense balance increases by ₹20,000.

---

# 138. ACCOUNTING EVENT EXAMPLE

Transaction:

Firm A pays ₹20,000 hotel expense.

Business model:

Source = Firm A Cash

Destination = Hotel Expense

Owner = Firm A

Category = Hotel

Accounting:

Dr Hotel Expense ₹20,000

Cr Firm A Cash ₹20,000

Balances:

Cash −₹20,000

Expense +₹20,000

Debit = Credit = ₹20,000

---

# 139. ACCOUNTING EVENT WITH PAYABLE

Bill arrives but is unpaid:

Dr Hotel Expense ₹20,000

Cr Supplier Payable ₹20,000

Later payment:

Dr Supplier Payable ₹20,000

Cr Bank ₹20,000

The expense is recorded only once.

---

# 140. PERSONAL PAYMENT FOR FIRM EXPENSE

Owner pays ₹20,000 personally.

Dr Hotel Expense ₹20,000

Cr Owner Payable ₹20,000

Later reimbursement:

Dr Owner Payable ₹20,000

Cr Firm Bank ₹20,000

---

# 141. FIRM PAYMENT FOR PERSONAL EXPENSE

Firm pays ₹20,000 personal expense.

Dr Owner Drawings / Owner Receivable ₹20,000

Cr Firm Bank ₹20,000

Not ordinary business expense.

---

# 142. CASH TRANSFER BETWEEN LOCATIONS

₹50,000 moved from Tijori to Drawer:

Dr Drawer ₹50,000

Cr Tijori ₹50,000

Total company cash remains:

₹50,000

Only location changes.

---

# 143. BANK TO CASH

₹50,000 withdrawn from bank:

Dr Cash ₹50,000

Cr Bank ₹50,000

This is not business expense.

---

# 144. CASH TO BANK

₹50,000 deposited:

Dr Bank ₹50,000

Cr Cash ₹50,000

This is not income.

---

# 145. OWNER CAPITAL VS OWNER LOAN

If owner gives ₹1,00,000:

The user/system must specify:

**Capital**

OR

**Loan**

Do not automatically assume one.

Capital:

Dr Cash
Cr Owner Capital

Loan:

Dr Cash
Cr Owner Loan Payable

They have different accounting meaning and must remain separate.

---

# 146. PAYMENT VS SETTLEMENT

A payment is a money movement.

A settlement answers:

**Which outstanding balance did this payment clear?**

One payment may settle:

- One item
- Multiple items
- Part of one item

The payment transaction and settlement allocation should remain linked but conceptually distinct.

---

# 147. ACCOUNTING TREATMENT VS USER LANGUAGE

A user may say:

"Given worker ₹20,000."

That phrase alone does not tell the accounting treatment.

The system must determine whether it is:

- Advance
- Salary
- Personal/Own
- Business expense
- Loan
- Reimbursement
- Transfer
- Settlement
- Other

Do not infer accounting treatment from simple language alone when ambiguity exists.

---

# 148. NO AUTOMATIC ASSUMPTIONS

The engine must not automatically assume:

- Payer = owner
- Transfer = expense
- Capital = income
- Loan = income
- Withdrawal = expense
- Advance = expense
- Payment = expense
- Receipt = income
- Personal = expense
- Firm payment = firm expense

The actual economic nature determines accounting treatment.

---

# 149. ACCOUNTING VALIDATION CHECKLIST

Before posting, validate:

### Transaction

- Valid date
- Valid entity
- Valid firm
- Valid source
- Valid destination
- Valid amount

### Accounting

- Valid accounts
- Debit/credit valid
- Journal balanced
- Allocation balanced
- Tax balanced
- Currency valid
- Period open

### Settlement

- Outstanding exists
- Allocation valid
- Settlement amount valid

### Permission

- User authorized
- Approval requirements satisfied

### Data integrity

- No duplicate transaction
- No broken reference
- No invalid master
- No orphan ledger entry

---

# 150. GOLDEN RULES — FINAL MASTER LIST

The accounting engine must enforce these rules:

1. **Every posted journal must balance.**

2. **Total Debits = Total Credits.**

3. **Every financial event must have a traceable accounting effect.**

4. **Every money movement must have a clear source and destination.**

5. **Source of money is separate from expense owner.**

6. **Business meaning and accounting effect are separate layers.**

7. **One real-world event may generate multiple journal lines.**

8. **One real-world event must have one master transaction/event ID.**

9. **Do not double-count linked ledger effects as separate economic events.**

10. **Asset increases are normally debits.**

11. **Asset decreases are normally credits.**

12. **Liability increases are normally credits.**

13. **Liability decreases are normally debits.**

14. **Equity increases are normally credits.**

15. **Equity decreases are normally debits.**

16. **Revenue increases are normally credits.**

17. **Expense increases are normally debits.**

18. **Drawings normally carry a debit balance.**

19. **Cash received → debit Cash.**

20. **Cash paid → credit Cash.**

21. **Receivable created → debit Receivable.**

22. **Receivable collected → credit Receivable.**

23. **Payable created → credit Payable.**

24. **Payable paid → debit Payable.**

25. **Advance paid is not automatically an expense.**

26. **Advance received is not automatically revenue.**

27. **Loan principal is not ordinary income/expense.**

28. **Capital contribution is not ordinary revenue.**

29. **Owner withdrawal is not automatically ordinary business expense.**

30. **Payment of an already-recorded bill does not create a second expense.**

31. **Settlement does not recreate the original expense.**

32. **Transfer does not automatically mean expense.**

33. **Unknown money must not automatically become income.**

34. **Personal money paying firm expense creates the appropriate firm payable/reimbursement relationship.**

35. **Firm money paying personal expense creates the appropriate personal/owner/worker relationship.**

36. **Inter-firm payments must preserve receivable/payable relationships where applicable.**

37. **Multi-firm allocation must equal the transaction total.**

38. **No automatic equal split unless explicitly configured.**

39. **No balance may change without an underlying accounting event.**

40. **No negative amount should be used to hide debit/credit direction.**

41. **Reversals must reverse accounting sides rather than erase the original.**

42. **Posted transactions must not be silently overwritten.**

43. **Corrections must remain linked to the original.**

44. **Historical accounting history must remain reconstructable.**

45. **Master-data changes must not destroy historical accounting meaning.**

46. **Closed periods must be protected from ordinary editing.**

47. **Opening balance must come from authorized opening data or previous closing balance.**

48. **Previous closing balance must correctly become next opening balance.**

49. **Sub-ledgers must reconcile to their control accounts.**

50. **Trial balance must balance.**

51. **Cash ledger must be reconcilable to physical cash.**

52. **Bank ledger must be reconcilable to bank statement.**

53. **Inter-firm balances must reconcile on both sides.**

54. **Owner/partner/worker balances must reconcile to their supporting entries.**

55. **Inventory ledger must reconcile with inventory records/physical counts according to the configured system.**

56. **Every outstanding balance must have a responsible entity.**

57. **Every settlement must identify what it settles.**

58. **Every adjustment must have a reason and audit trail.**

59. **Every write-off requires authorization and accounting treatment.**

60. **Every reversal must preserve the original transaction.**

61. **Account classification determines debit/credit behavior.**

62. **Category, project, firm, location, source, owner, and account are separate dimensions.**

63. **Payment method is not the same thing as account.**

64. **Document is evidence; it is not automatically accounting.**

65. **Current holder is not the same as owner.**

66. **Access is not the same as ownership.**

67. **Personal environment is not the same as firm environment.**

68. **Accounting balances must always be explainable.**

69. **No magic balance changes.**

70. **No hidden accounting logic.**

---

# 151. CORE ACCOUNTING FLOW

The complete accounting pipeline should conceptually be:

**REAL-WORLD EVENT**

↓

**TRANSACTION**

↓

**SOURCE / DESTINATION / OWNER / ENTITY / PURPOSE**

↓

**ACCOUNTING TREATMENT**

↓

**JOURNAL ENTRY**

↓

**DEBIT + CREDIT**

↓

**GENERAL LEDGER / SUB-LEDGER**

↓

**TRIAL BALANCE**

↓

**RECONCILIATION / ADJUSTMENT**

↓

**PERIOD CLOSE**

↓

**FINANCIAL REPORTS**

Every stage must remain traceable.

---

# 152. FINAL ENGINE PRINCIPLE

Build the application so that the user can think in simple business language:

**"Firm A paid ₹50,000 for Firm B's hotel expense."**

The system should internally understand:

**Source = Firm A**

**Destination = Hotel Expense**

**Expense Owner = Firm B**

**Firm A = cash reduction**

**Firm B = expense**

**Firm B = payable to Firm A**

**Firm A = receivable from Firm B**

**Journal = balanced**

**Master Event ID = TXN-XXXX**

**Audit = recorded**

The user should not need to manually understand double-entry bookkeeping for every simple transaction, but the underlying engine MUST correctly generate the accounting entries.

The application UI may be simple.

The accounting engine must be rigorous.

---

# FINAL ACCOUNTING ARCHITECTURE RULE

The finance application has two connected layers:

## BUSINESS TRANSACTION LAYER

**WHO → GAVE → WHAT → TO WHOM → FOR WHOM → WHY → WHERE → HOW MUCH → SETTLEMENT**

## ACCOUNTING LAYER

**WHICH ACCOUNTS → DEBIT → CREDIT → LEDGER → BALANCE → RECONCILIATION → REPORT**

These layers must be linked through a single master transaction/event ID.

**Never collapse them into one concept.**

That separation is what allows the application to handle simple expenses as well as complicated cases involving multiple firms, owners, workers, personal money, inter-firm balances, advances, loans, locations, settlements, taxes, and corrections without breaking accounting integrity.
