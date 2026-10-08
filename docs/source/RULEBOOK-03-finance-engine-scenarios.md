# MASTER ADD-ON PROMPT — COMPLETE FINANCE ENGINE, MASTER DATA, ACCESS & SCENARIO COVERAGE

Add this as a **major extension to the existing finance application**.

Do NOT simplify, remove, replace, or break existing working functionality.

First understand the existing application architecture, database, transaction flow, permissions, UI, and current accounting logic. Then integrate the following requirements into the existing system in a clean, production-grade way.

The objective is to make the finance engine capable of handling **real-world money movement, ownership, multiple firms, personal finances, workers, owners, locations, settlements, bills, advances, loans, assets, inventory, tax, reconciliation, corrections, permissions, audit history, offline sync, and complex mixed transactions**.

---

# 1. CORE SYSTEM PRINCIPLE

Do NOT build the application around only:

- Income
- Expense
- Transfer

The underlying system must be able to understand:

**WHO GAVE THE MONEY → WHERE DID IT COME FROM → WHO RECEIVED IT → WHERE DID IT GO → WHO OWNS IT → WHICH FIRM/ENTITY IT BELONGS TO → WHAT IS IT FOR → WHERE IS THE MONEY → WHO CONTROLS IT → IS ANYONE OBLIGATED TO SETTLE → WHICH LEDGERS ARE AFFECTED**

The finance engine should use a flexible transaction model instead of creating hundreds of unrelated transaction types.

Core transaction structure should support:

**SOURCE → DESTINATION → AMOUNT → OWNER → FIRM/ENTITY → ACCOUNT/FUND/LOCATION → PURPOSE/CATEGORY → SETTLEMENT → DATE → TAX → DOCUMENT → AUDIT**

---

# 2. INDIVIDUAL / ENTITY MODEL

Every person must exist as a separate individual entity.

Possible entities include:

- Individual
- Owner
- Partner
- Worker
- Employee
- Family member
- Customer
- Supplier
- Agent
- Angadiya
- Other person
- Other business
- Personal entity
- Firm
- Company
- Partnership
- Bank account
- Cash account
- Wallet
- UPI account
- Credit card account
- Loan account
- Other account/entity

The same physical person may have different roles in different contexts.

Example:

- Owner in Firm A
- Partner in Firm B
- Worker/employee in another firm
- Personal individual in their own environment

Do not force one person to become multiple unrelated users merely because their role changes.

At the same time, do NOT merge two different people into one account or one entity.

---

# 3. PERSONAL / HOME ENVIRONMENT

Every individual must have their own separate private personal/home environment.

Their personal environment can contain their permitted:

- Personal transactions
- Personal accounts
- Personal cash
- Personal locations
- Workers they manage
- Entities they create
- Other records they are permitted to manage

Personal/home environments must remain separate between individuals.

Example:

Partner 1 → their own personal/home environment

Partner 2 → their own personal/home environment

Partner 2 must NOT automatically see Partner 1's personal/home transactions simply because both are partners in the same firm.

---

# 4. FIRM ACCESS IS SEPARATE FROM PERSONAL ACCESS

A person may have access to:

- Firm A only
- Firm A + Firm B
- Firm A + Firm B + Firm C
- Multiple firms
- Personal environment + one firm
- Personal environment + multiple firms

Example:

Partner 1 → Firm A + Firm B + Firm C

Partner 2 → Firm A only

Partner 3 → Firm A + Firm C

A person must only see/manage firms to which they have access.

Being a partner in Firm A does NOT automatically grant access to another person's private/home environment.

---

# 5. MULTIPLE PARTNERS IN ONE FIRM

A firm can have multiple partners.

Example:

Firm A → Partner 1 + Partner 2 + Partner 3

They can all access Firm A according to their individual permissions.

But they remain separate individual entities.

Do NOT combine partners into one entity.

---

# 6. INDIVIDUALS CAN CREATE THEIR OWN ENTITIES / WORKERS

Inside their permitted environment, an individual may create and manage their own:

- Workers
- People
- Accounts
- Locations
- Entities
- Other records

Example:

Partner 1 creates Worker A.

Partner 1 manages Worker A.

Partner 2 must NOT automatically gain access to Worker A's private environment simply because Partner 2 is also a partner of Firm A.

Access must be explicitly granted.

---

# 7. FULL ADMIN ACCESS

A person can be given full app/admin-level access.

Full admin access means access to the entire permitted application environment, including:

- All permitted firms
- All individuals/entities
- Workers
- Accounts
- Cash/storage locations
- Transactions
- Permissions
- Settings
- Master data
- New entity creation
- New structure creation
- User management
- Firm management
- Reporting
- Reconciliation
- Month close/reopen where authorized

Admin should manage the whole permitted environment, rather than being artificially limited to one firm.

---

# 8. KEEP THESE CONCEPTS SEPARATE

Do NOT merge the following into one permission:

### Individual Identity
Who the person is.

### Personal/Home Environment
That person's private personal data.

### Firm Membership / Access
Which firms they can access.

### Role / Permissions
What they can do.

### Admin Access
Whether they can manage the entire permitted environment.

These are separate concepts.

---

# 9. ACCESS PERMISSION SCENARIOS

Support permissions such as:

- View
- Create
- Edit
- Delete/archive
- Approve
- Reject
- Transfer
- Settle
- Reconcile
- Close month
- Reopen month
- Manage masters
- Manage users
- Manage firms
- Manage locations
- Manage workers
- View reports
- Export data
- Full admin

Also support:

- Personal-only access
- Firm-only access
- Multiple-firm access
- Limited worker access
- View-only
- Create-only
- Edit access
- Approval access
- Settlement access
- Cash/location access
- Financial reporting access
- Selected-record access

Access can be:

- Added
- Removed
- Replaced
- Transferred
- Revoked

Historical transactions must remain intact when access changes.

---

# 10. MASTER DATA SYSTEM

"Master" means the configurable building blocks that define how the finance system works.

Authorized administrators must be able to ADD / EDIT / UPDATE / DEACTIVATE / ARCHIVE / DELETE where safe.

Master categories should include:

### Entities
- Add entity
- Edit entity
- Update entity
- Deactivate/archive entity
- Change entity type/role

### Firms / Businesses
- Add firm
- Edit firm
- Update firm
- Deactivate/archive firm

### People
- Add owner
- Add partner
- Add worker
- Add employee
- Add other person
- Edit details
- Change role
- Deactivate person
- Change permissions

### Accounts
- Add account
- Edit account
- Update account
- Deactivate/archive account
- Change account type/ownership

### Locations
- Add location
- Edit location
- Update location
- Deactivate/archive location
- Configure ownership
- Configure authorized access
- Configure current holder/controller

Examples:

- Tijori
- Drawer
- Locker
- Wardrobe
- Office cash
- Cash in hand

### Categories
- Add category
- Edit category
- Update category
- Deactivate/archive category

Examples:

- Travel
- Hotel
- Food
- Transport
- Rent
- Labour
- Material
- Utility
- Marketing
- Professional fees
- Other business expense

### Expense / Transaction Rules
- Add scenario
- Add rule
- Edit rule
- Update rule
- Deactivate rule
- Change transaction handling logic

### Settlement Rules
- Add
- Edit
- Update
- Deactivate

### Tax Rules
- GST
- CGST
- SGST
- IGST
- TDS
- Other configurable tax rules

### Payment Methods
- Cash
- Bank
- UPI
- Card
- Cheque
- Wallet
- Other

### Other Masters
- Document types
- Departments
- Projects
- Cost centers
- Purposes
- Branches
- Products
- Assets
- Other configurable financial structures

---

# 11. MASTER DATA SAFETY

Master data changes must NOT destroy historical financial records.

Example:

Master:

Tijori exists.

Later Tijori is deactivated.

Old transactions using Tijori must still show correctly.

Prefer:

**Deactivate / Archive**

instead of physically destroying historical references.

Support:

- Create
- Edit
- Rename
- Update
- Deactivate
- Archive
- Restore
- Duplicate detection
- Merge where appropriate
- Transfer/reassign where appropriate
- Remove from future use

Historical transactions must retain their historical meaning.

---

# 12. ACCOUNT / FUND / MONEY STORAGE

Money can exist in:

- Firm cash
- Personal cash
- Bank
- UPI
- Wallet
- Credit card
- Tijori
- Drawer
- Locker
- Wardrobe
- Owner-held cash
- Worker-held cash
- Vehicle cash
- Other physical location
- Unassigned cash

Possible scenarios:

- Cash in hand
- Cash in Tijori
- Cash in drawer
- Cash in locker
- Cash with owner
- Cash with worker
- Cash moved between locations
- Cash moved to bank
- Cash withdrawn from bank
- Cash missing
- Cash excess
- Physical cash differs from ledger
- Unknown cash location
- Unassigned cash
- Multiple currencies in one location

---

# 13. LOCATION OWNERSHIP / ACCESS / HOLDER

For every physical money/storage location, maintain these separately:

### Owner
Who owns the location/fund.

### Authorized Access
Who is allowed to access it.

### Current Holder / Controller
Who currently physically holds the key, cash, or control.

These are NOT the same thing.

Example:

Tijori

Owner → Firm / Owner

Authorized Access → Krish + Father

Current Holder → Father

Later:

Father gives key/control to Krish.

Current Holder → Krish

Authorized Access remains:

Krish + Father

Do NOT automatically change access merely because the current holder changes.

---

# 14. ACCESS CHANGE — TWO CORE SITUATIONS

### ADD

Current:

Krish + Father

Add Person C:

Krish + Father + C

Existing people remain.

### REPLACE

Current:

Krish + Father

Krish is replaced by Person C:

Father + C

Do not invent a separate business rule beyond these two core access changes.

---

# 15. UNASSIGNED LOCATIONS

A location may have:

- One responsible person
- Multiple responsible people
- No responsible person

Example:

Cash in Hand → currently unassigned.

The system must support this.

---

# 16. BASIC MONEY MOVEMENT

Support:

- Firm → Owner
- Owner → Firm
- Firm → Worker
- Worker → Firm
- Firm → Person
- Person → Firm
- Owner → Worker
- Worker → Owner
- Owner → Person
- Person → Owner
- Firm A → Firm B
- Firm B → Firm A
- Person → Person
- Bank → Cash
- Cash → Bank
- Location A → Location B
- Multiple sources → one destination
- One source → multiple destinations

Each movement must have a clear source and destination.

Money cannot simply disappear from a fund without an accounting effect.

---

# 17. SOURCE OF MONEY AND EXPENSE OWNER MUST BE SEPARATE

This is one of the most important rules.

For EVERY expense:

### Source of Money
Where the money actually came from.

### Expense Owner
Who the expense actually belongs to.

These must be separate fields.

Examples:

### Example A
Firm A money → Firm A expense

Source = Firm A

Expense Owner = Firm A

### Example B
Firm B money → Firm A expense

Source = Firm B

Expense Owner = Firm A

Firm A owes/settles with Firm B if required.

### Example C
Personal money → Firm A expense

Source = Personal

Expense Owner = Firm A

Firm A owes the person.

### Example D
Firm A money → Personal expense

Source = Firm A

Expense Owner = Personal

Personal/withdrawal treatment applies.

Never assume that the payer automatically owns the expense.

---

# 18. EXPENSE OWNERSHIP

Every expense must identify who it belongs to.

Possible owner:

- Personal
- Firm A
- Firm B
- Firm C
- Other entity
- Multiple firms/entities

Examples:

₹10,000 hotel expense → Firm A

or

₹45,000 total:

- Firm A = ₹30,000
- Firm B = ₹5,000
- Personal = ₹10,000

The user manually specifies allocation.

Do NOT automatically split equally.

---

# 19. MULTI-ENTITY / MULTI-FIRM EXPENSES

Support:

- Two firms
- Three firms
- More than three firms
- Firm + Personal
- Firm A + Firm B + Personal
- Firm + Other Entity
- Multiple entities in any custom combination

Each allocation can have:

- Entity
- Amount
- Category
- Tax treatment
- Settlement requirement

The allocation total MUST equal the full transaction amount.

If:

Total = ₹45,000

Allocation = ₹30,000 + ₹5,000 + ₹8,000

Then:

Allocated = ₹43,000

The system must show a validation error.

Do NOT automatically make the missing ₹2,000 belong to someone.

---

# 20. EXPENSE ALLOCATION CHANGES

Support:

- Allocation changed before settlement
- Allocation changed after settlement
- Entity added later
- Entity removed
- Allocation transferred from one entity to another
- Original allocation corrected through proper adjustment/reversal when required

Never silently destroy the original accounting history.

---

# 21. TRAVEL / VISIT / ANGADIYA EXPENSES

A trip, visit, or Angadiya activity may contain many separate expenses.

Examples:

- Travel
- Hotel
- Food
- Petrol
- Local transport
- Parking
- Courier
- Labour
- Shopping
- Samples
- Gifts
- Business expense
- Personal expense

Each individual expense must be able to have its own:

- Expense owner
- Source of money
- Category
- Amount
- Tax treatment
- Settlement requirement

Example:

Hotel ₹12,000 → Firm A

Food ₹4,000 → Personal

Petrol ₹3,000 → Firm B

Courier ₹2,000 → Firm A

Do NOT force an entire trip/visit into one expense owner.

---

# 22. NON-OWNER PAYMENT LOGIC

When money/expense is being given to a non-owner, ASK THE OWNER EVERY TIME.

Do NOT set a permanent default treatment for the owner.

Ask:

### Question 1 — How is the money given?

- Directly from Firm
- Through Owner

### Question 2 — What is it treated as?

- Own / Personal
- Expense

This creates four core cases.

---

# 23. NON-OWNER CASE 1 — DIRECT + OWN/PERSONAL

Flow:

**Firm → Non-owner**

Treatment:

**Own / Personal**

Meaning:

The firm's money is deducted immediately.

The non-owner becomes responsible for the amount.

It remains a financial balance that can be settled later.

This is NOT a memo-only entry.

It is a real deduction/accounting entry.

---

# 24. NON-OWNER CASE 2 — DIRECT + EXPENSE

Flow:

**Firm → Expense / Non-owner**

Treatment:

**Expense**

Meaning:

It is a final business expense.

No personal owner transaction is created.

No settlement is automatically created.

---

# 25. NON-OWNER CASE 3 — THROUGH OWNER + OWN/PERSONAL

Flow:

**Firm → Owner → Non-owner**

Treatment:

**Own / Personal**

Create two linked ledger effects:

1. Firm → Owner
2. Owner → Non-owner

The amount is deducted from the firm and becomes the personal responsibility associated with the owner-side transaction.

Settlement may happen later.

---

# 26. NON-OWNER CASE 4 — THROUGH OWNER + EXPENSE

Flow:

**Firm → Owner → Non-owner**

Treatment:

**Expense**

Create linked entries:

1. Firm → Owner
2. Owner → Expense / Non-owner

The business expense is recorded.

No unnecessary personal settlement should be created.

---

# 27. NON-OWNER EDGE CASES

Support:

- Same worker receives different payments with different treatments
- Worker has outstanding Own amount
- Worker also has legitimate Firm Expense reimbursement
- Worker returns Own money
- Worker returns unused expense advance
- Worker spends more than advance
- Worker spends less than advance
- Expense later approved
- Expense later rejected
- Personal treatment later changed to business
- Business treatment later changed to personal
- Treatment changed before month close
- Treatment changed after month close using adjustment/reversal

---

# 28. OWNER / PERSONAL MONEY SCENARIOS

Support:

- Owner takes firm money for personal use
- Owner gives firm money to another person for personal purpose
- Owner gives firm money to worker for personal purpose
- Owner gives money to family/personal entity
- Owner withdraws Firm A money
- Owner gives withdrawn money to another owner
- Owner gives withdrawn money to non-owner
- Owner later returns full amount
- Owner later returns part amount
- Owner spends part and returns remainder
- Owner personal money directly given to worker
- Owner personal money used for firm expense

---

# 29. WORKER / EMPLOYEE SCENARIOS

Support:

- Salary payable
- Salary paid
- Salary advance
- Travel advance
- Business cash advance
- Personal-use money
- Expense reimbursement
- Worker submits expense
- Expense approved
- Expense rejected
- Worker returns money
- Worker returns partial amount
- Worker owes firm
- Firm owes worker
- Worker manages cash
- Worker manages a location
- Worker works for multiple firms
- Salary split across firms
- Bonus
- Commission
- Employee loan
- Worker leaves with balance
- Worker has both receivable and payable
- Final worker settlement

---

# 30. HANDOVER

Normal handover does NOT require receiver confirmation.

Example:

A → B ₹50,000

Simply record the transfer.

Receiver confirmation may exist as an optional feature, but it must NOT be a mandatory workflow.

Support:

- Cash handover
- Document handover
- Asset handover
- Key/control handover
- Responsibility handover
- Worker-to-worker handover
- Owner-to-owner handover
- Location-controller handover
- Partial handover
- Full handover
- Physical handover entered later
- Ledger transfer entered before physical handover
- Cancelled handover
- Reversed handover
- Wrong person
- Wrong fund
- Wrong location

---

# 31. SETTLEMENT ENGINE

Any transaction can result in something being owed.

Possible outstanding relationships:

- Owner owes Firm
- Firm owes Owner
- Worker owes Firm
- Firm owes Worker
- Firm A owes Firm B
- Firm B owes Firm A
- Customer owes Firm
- Firm owes Supplier
- Supplier owes refund
- Loan receivable
- Advance recoverable

Statuses:

- No settlement
- Pending
- Partially settled
- Fully settled
- Over-settled
- Adjusted
- Cancelled
- Reversed

Support:

- Partial settlement
- Full settlement
- Multiple settlements against one item
- One payment settling multiple items
- One item settled using multiple payments
- Settlement amount different from original amount
- Discount during settlement
- Interest during settlement
- Settlement cancelled
- Settlement reversed
- Wrong transaction linked
- Settlement after month close
- Settlement in a different month from original transaction

---

# 32. INTER-FIRM SCENARIOS

Support:

- Firm A pays Firm B expense
- Firm B pays Firm A expense
- Firm A gives advance to Firm B
- Firm B returns advance
- Firm A lends to Firm B
- Firm B repays loan
- Firm A transfers cash to Firm B without treating it as expense
- Firm A buys asset for Firm B
- Firm A pays employee cost benefiting Firm B
- Shared rent
- Shared travel
- Shared hotel
- Shared Angadiya expense
- Shared salary/admin
- Shared utility
- Shared software subscription
- Shared vehicle
- Shared office
- Shared bank charges
- Shared professional fees
- Custom inter-firm allocation
- Temporary payment on behalf of another firm
- Permanent bearing of another firm's expense
- Reimbursement between firms
- Net settlement between firms

Example:

Firm A pays Firm B expense ₹50,000.

System should be able to show:

Firm A cash ↓ ₹50,000

Firm B expense ↑ ₹50,000

Firm B owes Firm A ₹50,000

---

# 33. ADVANCES

Support advances to:

- Worker
- Owner
- Partner
- Supplier
- Customer
- Another firm
- Other person

Advance lifecycle:

**Given → Used → Remaining → Returned / Settled**

Support:

- Fully consumed
- Partially consumed
- Unused and returned
- Actual expense greater than advance
- Actual expense lower than advance
- Advance outstanding for months
- Disputed advance
- Cancelled advance
- Advance converted to final expense
- Expense wrongly entered as advance
- Advance wrongly entered as expense
- Correction later

---

# 34. BILL / INVOICE SCENARIOS

Support:

- Bill received but unpaid
- Bill received and immediately paid
- Expense incurred before bill arrives
- Bill arrives later
- Advance paid before bill
- Bill amount different from advance
- Multiple bills against one expense
- One bill across multiple firms
- Taxable + non-taxable components
- Discount
- Additional charge
- Partially disputed bill
- Cancelled bill
- Replaced bill
- Credit note
- Debit note
- Duplicate bill
- Wrong date
- Wrong month
- Personal bill
- Firm bill
- Shared bill
- Multi-firm bill

Bills should be recorded when received, before payment where applicable.

---

# 35. PAYMENT METHODS / PAYMENT EXCEPTIONS

Support:

- Cash
- Bank transfer
- UPI
- Card
- Cheque
- Wallet
- Other

Payment states:

- Normal
- Partial
- Advance
- Failed
- Reversed
- Duplicated
- Refunded
- Pending

Edge cases:

- Wrong account
- Wrong firm account
- Personal account used for business
- Another firm's account used
- Payment entered twice
- Payment failed after record creation
- Payment reversed later
- Bank charge added separately

---

# 36. CUSTOMER / RECEIVABLE SCENARIOS

Support:

- Customer owes firm
- Customer advance
- Partial payment
- Full payment
- Overpayment
- Underpayment
- Refund
- Credit
- Wrong invoice allocation
- Unidentified customer payment
- Balance adjustment
- Bad debt
- Doubtful receivable
- Write-off
- Written-off amount later recovered
- Customer dispute
- Customer settlement

---

# 37. SUPPLIER / PAYABLE SCENARIOS

Support:

- Supplier bill
- Supplier payable
- Supplier payment
- Partial payment
- Full payment
- Supplier advance
- Supplier refund
- Supplier credit note
- Supplier debit note
- Wrong supplier payment
- Duplicate supplier payment
- Supplier balance adjustment
- Supplier settlement
- Payable written off
- Supplier changes identity/bank details

---

# 38. OWNER / PARTNER ACCOUNTING

Support:

### Money entering firm
- Capital contribution
- Temporary loan
- Advance

### Money leaving firm
- Withdrawal
- Reimbursement
- Loan
- Personal expense
- Profit distribution

Partner scenarios:

- Contribution
- Withdrawal
- Reimbursement
- Expense
- Loan
- Settlement
- Share
- Adjustment
- Exit balance
- Capital changes

Support:

- Owner contributes cash
- Owner contributes bank money
- Owner contributes asset
- Owner contributes inventory
- Owner withdraws capital
- Multiple owners contribute different amounts
- Owner contribution incorrectly classified as income
- Owner withdrawal incorrectly classified as expense
- Withdrawal partially returned
- Capital converted to loan
- Loan converted to capital

---

# 39. LOAN ENGINE

Firm can give loans to:

- Owner
- Partner
- Worker
- Customer
- Another firm
- Other person

Firm can receive loans from:

- Owner
- Partner
- Bank
- Another firm
- Other person

Loan lifecycle:

**Created → Disbursed → Partially Repaid → Fully Repaid**

Also support:

- Interest added
- Interest paid
- Overdue
- Restructured
- Written off
- Reversed
- Principal repayment
- Interest repayment
- Principal + interest combined
- Refinancing
- Loan converted into capital
- Capital converted into loan
- Interest accrued but unpaid

---

# 40. INCOME

Support:

- Sales income
- Service income
- Commission
- Brokerage
- Interest income
- Other income
- Refund income
- Asset sale income
- Miscellaneous income

Income can be received through:

- Cash
- Bank
- UPI
- Credit sale
- Customer advance
- Multiple payment sources

Support:

- Income belonging to another firm
- Income received personally on behalf of firm
- Worker receiving money for firm
- Income in wrong firm account
- Income split across multiple firms
- Income received before delivery
- Cancelled sale
- Refund against previous sale
- Credit note

---

# 41. REFUNDS

Support:

- Supplier refund
- Customer refund
- Expense refund
- Personal refund
- Card refund
- UPI refund
- Bank refund
- Partial refund
- Full refund
- Refund mapped to wrong transaction
- Refund after month close

---

# 42. INVENTORY

If inventory is supported, handle:

- Purchase
- Sale
- Stock received
- Stock issued
- Stock transfer
- Stock return
- Damaged stock
- Lost stock
- Short stock
- Excess stock
- Free sample
- Personal-use stock
- Firm-to-firm stock transfer
- Stock adjustment
- Opening stock
- Closing stock
- Physical stock mismatch
- Stock purchased personally by owner
- Firm stock used personally
- Stock given away
- Stock used for business expense
- Raw material → finished goods
- Goods received without invoice
- Invoice before goods
- Goods returned before payment
- Payment before goods received

---

# 43. ASSETS

Support:

- Asset purchase
- Asset sale
- Asset transfer
- Asset assigned to worker
- Asset assigned to firm
- Asset assigned to location
- Asset returned
- Asset lost
- Asset damaged
- Asset sold
- Asset scrapped
- Depreciation
- Accumulated depreciation
- Impairment
- Repair vs capital expenditure
- Asset bought using loan
- Asset bought partly by owner + firm

Examples:

- Laptop
- Machine
- Furniture
- Vehicle
- Equipment

---

# 44. BANKING

Support:

- Firm A bank account
- Firm B bank account
- Personal bank account
- Joint account
- Bank account used by multiple firms
- Account owned by one entity but used by another

Bank scenarios:

- Cash deposit
- Cash withdrawal
- Bank-to-bank transfer
- Bank-to-UPI
- Bank payment
- Bank receipt
- Bank charges
- Interest received
- Interest charged
- Failed transfer
- Reversed transfer
- Unknown transaction
- Duplicate transaction
- Old transaction imported later
- Bank reconciliation
- Bank statement mismatch

---

# 45. CARD

Support:

- Personal card used for firm expense
- Firm card used for business
- Firm card used personally
- Card payment pending
- Card bill received
- Card bill paid
- Card refund
- Card reversal
- EMI
- Card charges

---

# 46. DIGITAL PAYMENTS

Support:

- UPI received
- UPI sent
- Wallet received
- Wallet sent
- Pending
- Failed
- Reversed
- Wrong UPI account
- Personal UPI used for firm
- Firm UPI used personally
- Settlement pending

---

# 47. TAX / GST / TDS

Tax rules must be configurable.

Support:

- GST-inclusive
- GST-exclusive
- CGST
- SGST
- IGST
- UTGST where applicable
- Input GST
- Output GST
- Reverse charge
- GST-exempt
- Non-GST
- Partial ITC
- ITC unavailable
- Missing GST details
- Incorrect GSTIN
- Credit note
- Debit note
- Invoice cancellation
- E-invoice applicable
- E-invoice not applicable
- E-invoice rejected
- E-invoice cancelled
- IRN reference
- GST correction
- TDS applicable
- TDS not applicable
- TDS deducted
- TDS not deposited
- TDS paid
- TDS refund/adjustment
- Different TDS treatment by payment type
- Resident/non-resident payee
- Wrong TDS treatment corrected

---

# 48. FOREIGN CURRENCY

Support:

- Foreign currency expense
- Foreign currency income
- Foreign currency advance
- Foreign currency receivable
- Foreign currency payable
- Exchange-rate difference
- Settlement at different exchange rate
- Foreign bank fee
- Currency conversion fee
- Revaluation
- Date-of-transaction rate
- Settlement-date rate

---

# 49. DATE / PERIOD SCENARIOS

Support:

- Same-day entry
- Late entry
- Backdated entry
- Future-dated entry
- Transaction entered for previous month
- Bill received in one month, paid in another
- Expense incurred in one month, bill received later
- Advance in one month, expense in another
- Settlement in another month
- Entry after month close
- Correction after month close
- Correction after financial year close
- Incorrect opening balance
- Incorrect closing balance

---

# 50. MONTH CLOSING

When a month closes, balances must continue into the next month.

Carry forward:

- Cash
- Bank
- Receivables
- Payables
- Advances
- Loans
- Inter-firm balances
- Owner balances
- Worker balances
- Inventory
- Assets

Month-close situations:

- Normal close
- Unpaid bills
- Pending settlements
- Pending advances
- Pending owner balances
- Pending worker balances
- Inter-firm outstanding
- Reconciliation mismatch
- Month locked
- Authorized reopen
- Adjustment after close

Default accounting rule:

**Closing balance of previous month → Opening balance of next month**

---

# 51. FINANCIAL YEAR END

Support:

- Year close
- Opening balance creation
- Profit/loss carry-forward
- Capital balance
- Asset carry-forward
- Inventory carry-forward
- Receivable carry-forward
- Payable carry-forward
- Loan carry-forward
- Pending settlement carry-forward
- Audit adjustments
- Locked historical period
- Authorized reopening/revision

---

# 52. CORRECTION / REVERSAL

Never silently overwrite important posted accounting transactions.

Possible correction:

- Wrong amount
- Wrong date
- Wrong entity
- Wrong firm
- Wrong owner
- Wrong source fund
- Wrong destination
- Wrong category
- Wrong location
- Wrong payment method
- Wrong tax
- Duplicate entry
- Missing entry
- Incorrect allocation
- Incorrect settlement
- Incorrect person
- Incorrect holder
- Incorrect access

Use:

- Correction
- Adjustment
- Reversal
- Replacement

with proper audit history.

Original transaction should remain traceable.

---

# 53. REVERSALS

Support reversal of:

- Payment
- Transfer
- Expense
- Refund
- Loan
- Bank transaction
- Duplicate entry
- Wrong entry

Support:

- Full reversal
- Partial reversal

Do not erase the original accounting history.

---

# 54. RECONCILIATION

The app must support reconciliation between system records and reality.

### Cash

Ledger = ₹1,00,000

Physical = ₹98,000

Difference = ₹2,000

### Bank

Ledger balance differs from bank statement.

### Person

Worker should have ₹20,000

Actual = ₹17,000

### Firm

Inter-firm receivable/payable mismatch.

### Supplier

Supplier says ₹50,000 due.

System says ₹45,000.

### Customer

Customer says payment was made but system does not show it.

### Location

Tijori balance does not match physical cash.

### Inventory

Physical stock differs from system stock.

Support:

- Reconciliation
- Difference detection
- Adjustment
- Investigation
- Resolution
- Authorized write-off

Do not silently manipulate balances.

---

# 55. UNIDENTIFIED MONEY

Money may arrive without knowing what it belongs to.

Examples:

- Unknown bank credit
- Unknown cash receipt
- Unknown UPI payment
- Unknown refund

Status:

**Unidentified → Investigating → Assigned → Reconciled**

---

# 56. MISSING / EXCESS MONEY

Support:

- Cash shortage
- Cash excess
- Worker shortage
- Location shortage
- Bank mismatch
- Unrecorded expense
- Duplicate withdrawal
- Wrong transfer
- Wrong account entry

Create a proper adjustment/reconciliation process.

Do not simply edit a balance.

---

# 57. DUPLICATE DETECTION

Detect/warn about:

- Duplicate bill
- Duplicate payment
- Duplicate bank import
- Duplicate UPI transaction
- Duplicate expense
- Duplicate transfer
- Duplicate customer
- Duplicate supplier
- Duplicate firm
- Duplicate employee
- Duplicate document

---

# 58. DOCUMENTS

Transactions can have:

- Invoice
- Bill
- Receipt
- Payment proof
- Bank statement
- Screenshot
- Photo
- PDF
- Cheque image
- Tax document
- Credit note
- Debit note

Document states:

- Missing
- Duplicate
- Wrong document
- Replaced
- Multiple documents
- Deleted where allowed
- Access restricted

---

# 59. AUDIT TRAIL

For important actions record:

- Created by
- Created date/time
- Edited by
- Edited date/time
- Approved by
- Approved date/time
- Reversed by
- Reversed date/time
- Previous value
- New value
- Reason
- Related transaction
- Supporting document

Historical audit information must remain available even when a user/entity is deactivated.

---

# 60. OFFLINE / SYNC

The application should be able to handle offline usage where applicable.

Support:

- Transaction created offline
- Multiple transactions created offline
- Device reconnects
- Sync success
- Partial sync
- Sync failure
- Retry
- Same transaction edited on two devices
- Conflict
- Duplicate sync
- Network interruption during save
- Master deactivated while device was offline

Every transaction must have a stable unique ID so sync does not create duplicates.

---

# 61. SECURITY

Support:

- Login
- Logout
- Password reset
- Device change
- Session expiration
- Account lock
- Role change
- Firm access revocation
- Personal data isolation
- Firm data isolation
- Admin access
- Audit logs
- Sensitive transaction permissions
- Export permissions
- Delete permissions

---

# 62. DATA DELETION RULES

For accounting data:

Draft transactions may be deleted where appropriate.

Posted transactions should generally NOT be hard deleted.

Instead use:

- Void
- Reversal
- Adjustment
- Correction

Master records may be deactivated/archived.

Historical transactions must remain.

Audit history must remain.

---

# 63. SPECIAL MIXED TRANSACTIONS

The engine must be able to represent complex chains such as:

### A
Firm A → Owner → Worker → Personal expense

### B
Firm A → Worker → Firm B expense

### C
Personal money → Firm A expense

### D
Firm A → Firm B expense → Firm B owes Firm A

### E
Firm A → Owner → Firm B expense

### F
Firm A → Worker → expense shared by Firm A + Firm B

### G

₹1,00,000 movement:

- Firm A = ₹40,000
- Firm B = ₹30,000
- Personal = ₹20,000
- Worker advance = ₹10,000

### H

One payment settles:

- Old advance
- Supplier bill
- Worker payable

at the same time.

The underlying engine must be able to represent all these combinations without creating fragile custom logic for each one.

---

# 64. CORE TRANSACTION DATA MODEL

At minimum, the transaction/event model should support:

- Transaction ID
- Parent/Event ID
- Date
- Entry date/time
- Source entity
- Source account/fund
- Source location
- Destination entity
- Destination account/fund
- Destination location
- Amount
- Currency
- Transaction type
- Expense owner
- Expense allocation
- Firm
- Category
- Purpose
- Project
- Current holder
- Settlement required
- Settlement status
- Related transaction ID
- Receivable/payable relationship
- Tax information
- Payment method
- Document
- Approval status
- Created by
- Approved by
- Reversed by
- Audit history

---

# 65. ONE REAL-WORLD EVENT = ONE MASTER TRANSACTION/EVENT ID

A single real-world event can affect multiple ledgers.

Example:

Firm A money ₹50,000 is used for Firm B's expense.

Underlying event:

Source = Firm A Cash

Destination = Expense

Amount = ₹50,000

Expense Owner = Firm B

Category = Travel

Settlement = Firm B owes Firm A

Transaction ID = TXN-001

The system may reflect this event in:

- Firm A ledger
- Firm B ledger
- Expense ledger
- Inter-firm settlement ledger
- Cash/location ledger
- Audit trail

These must NOT be treated as five unrelated real-world transactions.

They are multiple ledger effects of ONE underlying event.

---

# 66. GOLDEN RULES — NEVER BREAK THESE

1. **Source of money and expense owner are separate.**

2. **Who paid does not automatically mean they own the expense.**

3. **Own / Personal is a real financial deduction entry.**

4. **Own / Personal is not merely a memo. The money is deducted immediately and can later be settled.**

5. **Expense is a final expense unless an explicit receivable/payable/settlement relationship exists.**

6. **Through Owner may require two linked ledger entries.**

7. **Direct Firm → Expense can be one-way.**

8. **Multi-firm allocation is manually controlled.**

9. **Do not automatically split expenses equally.**

10. **Every money movement must have a clear source and destination.**

11. **Every outstanding amount must have a responsible owner.**

12. **Every settlement must link back to the item(s) being settled.**

13. **Access rights, ownership, and current physical holder are separate.**

14. **Personal/home environments and firm environments are separate.**

15. **Every individual remains a separate individual entity.**

16. **An individual can have access to multiple firms.**

17. **Full admin can manage the entire permitted environment.**

18. **Firm access must not automatically expose another person's private/home data.**

19. **One real-world event may affect multiple ledgers.**

20. **One underlying event should have one master transaction/event ID.**

21. **Posted transactions should not be silently overwritten.**

22. **Corrections must use adjustment/reversal/audit mechanisms.**

23. **Historical financial entries must survive access, role, entity, and master-data changes.**

24. **Closing balance becomes next month's opening balance.**

25. **Masters define the system structure; transactions record actual financial events.**

---

# 67. VALIDATION RULES

The system must validate before posting transactions.

Examples:

- Allocation total must equal transaction total.
- Source account must have sufficient balance where required.
- Source and destination must be known.
- Expense owner must be known for an expense.
- Firm/entity ownership must be explicit where needed.
- Settlement owner must be explicit.
- Invalid permission must block unauthorized action.
- Closed periods must not accept normal edits.
- Duplicate transactions should warn/block where appropriate.
- Deactivated masters cannot be used for new transactions unless explicitly permitted.
- Historical transactions must remain readable.
- Every generated ledger effect must point to its parent transaction/event.
- No transaction should create an unexplained balance movement.

---

# 68. REPORTING

Reports should be generated from the transaction/ledger engine.

Support:

- Daily cash report
- Monthly expenses
- Firm-wise expenses
- Person-wise expenses
- Category-wise expenses
- Source-wise money movement
- Location-wise cash
- Worker outstanding
- Owner outstanding
- Partner outstanding
- Supplier payable
- Customer receivable
- Inter-firm balances
- Loan report
- Advance report
- Settlement report
- Tax report
- Bank reconciliation
- Cash reconciliation
- Profit & Loss
- Balance Sheet
- Cash Flow
- Audit report
- Month-close report

Reports must respect user permissions and environment isolation.

---

# 69. ACCOUNTING EXAMPLES THE SYSTEM MUST HANDLE

### Example 1 — Normal Firm Expense

Firm A Cash → ₹20,000 → Travel Expense

Expense Owner = Firm A

---

### Example 2 — One Firm Pays Another Firm's Expense

Firm B Cash → ₹50,000 → Firm A Expense

Expense Owner = Firm A

Settlement:

Firm A owes Firm B ₹50,000

---

### Example 3 — Personal Money Pays Firm Expense

Personal Money → ₹10,000 → Firm A Expense

Firm A owes the individual ₹10,000.

---

### Example 4 — Firm Money Used Personally

Firm A Cash → Personal Expense

Personal/Withdrawal treatment.

---

### Example 5 — Mixed Expense

Total = ₹45,000

Firm A = ₹30,000

Firm B = ₹5,000

Personal = ₹10,000

No equal split.

---

### Example 6 — Worker Own/Personal

Firm A → Worker → Own/Personal ₹20,000

Firm balance decreases.

Worker becomes responsible.

Can be settled later.

---

### Example 7 — Worker Business Expense

Firm A → Worker → Business Expense ₹20,000

Final expense.

No unnecessary personal settlement.

---

### Example 8 — Through Owner + Own

Firm A → Owner → Worker

Treatment = Own/Personal

Two linked entries.

---

### Example 9 — Through Owner + Expense

Firm A → Owner → Worker

Treatment = Expense

Two linked entries.

---

### Example 10 — Location Control

Tijori:

Authorized Access = Krish + Father

Current Holder = Father

Later current holder = Krish

Access list remains unchanged.

---

# 70. IMPLEMENTATION INSTRUCTION

Do not create isolated special-case code for every scenario.

Build reusable components around:

### Entity
Who is involved?

### Account/Fund
Where does the money exist?

### Location
Where is it physically stored?

### Source
Who/account provided the money?

### Destination
Who/account received it?

### Ownership
Who owns the transaction/expense?

### Allocation
How much belongs to each entity?

### Transaction Type
Expense, transfer, advance, loan, income, refund, withdrawal, capital, settlement, asset purchase, liability payment, etc.

### Settlement
Does anyone still owe anything?

### Documents
What proof belongs to the transaction?

### Permissions
Who can see or modify it?

### Audit
What changed and who changed it?

This reusable structure should handle the scenario combinations instead of creating hundreds of unrelated database structures.

---

# 71. IMPORTANT: DO NOT BREAK EXISTING DATA

When adding this functionality:

- Preserve existing transactions.
- Preserve existing users.
- Preserve existing firms.
- Preserve existing balances where valid.
- Preserve existing historical records.
- Do not silently migrate values into a different meaning.
- If migration is required, create a deterministic migration with auditability.
- Do not delete existing financial history.
- Do not make irreversible schema changes without considering historical data.

---

# 72. ACCEPTANCE TEST

Before considering the finance engine complete, test at minimum:

1. Firm A pays Firm A expense.
2. Firm A pays Firm B expense.
3. Firm B pays Firm A expense.
4. Personal pays Firm expense.
5. Firm pays Personal expense.
6. One expense belongs to two firms.
7. One expense belongs to three or more entities.
8. Firm + Personal mixed expense.
9. Direct Firm → Worker → Own.
10. Direct Firm → Worker → Expense.
11. Firm → Owner → Worker → Own.
12. Firm → Owner → Worker → Expense.
13. Worker returns money.
14. Worker submits partial expense.
15. Worker spends less than advance.
16. Worker spends more than advance.
17. Owner withdraws and later returns money.
18. Firm A and Firm B owe each other and settle.
19. One settlement closes multiple outstanding items.
20. One outstanding item is settled through multiple payments.
21. Cash physically differs from ledger.
22. Bank statement differs from ledger.
23. Current location holder changes without access changing.
24. New location user is added without removing existing access.
25. Existing location access is replaced.
26. User loses firm access but historical records remain.
27. Personal environment remains private.
28. Multiple partners access same firm independently.
29. One individual accesses multiple firms.
30. Full admin accesses the entire permitted environment.
31. Master is deactivated while old transactions still exist.
32. Wrong posted transaction is corrected through reversal/adjustment.
33. Duplicate transaction is detected.
34. Month closes with outstanding bills.
35. Settlement occurs in a later month.
36. Transaction is entered offline and synced later.
37. Sync conflict is handled without duplicate accounting.
38. Unknown bank receipt is investigated and assigned.
39. Asset is transferred between firms.
40. Inventory is transferred between locations.
41. Tax treatment is corrected.
42. Foreign currency transaction settles at a different exchange rate.

The system should successfully represent these without breaking ledger integrity, permission isolation, historical records, or transaction traceability.

---

# FINAL INSTRUCTION

Treat everything above as a **master finance-engine requirement layer**.

Do not merely add UI screens.

Update the underlying:

- Data model
- Transaction engine
- Ledger engine
- Entity relationships
- Permission system
- Master-data system
- Settlement engine
- Reconciliation system
- Audit system
- Reporting logic
- Month-close logic
- Offline/sync handling
- Validation rules

The final system must preserve this complete chain:

**WHO GAVE THE MONEY → SOURCE FUND → WHO RECEIVED IT → DESTINATION → WHO OWNS IT → FIRM/ENTITY → CATEGORY/PURPOSE → LOCATION → CURRENT HOLDER → SETTLEMENT/OBLIGATION → TAX → DOCUMENT → LEDGER EFFECTS → AUDIT HISTORY**

Most importantly:

**SOURCE OF MONEY ≠ EXPENSE OWNER**

and

**ACCESS ≠ OWNERSHIP ≠ CURRENT HOLDER**

and

**PERSONAL ENVIRONMENT ≠ FIRM ENVIRONMENT**

and

**ONE REAL-WORLD EVENT MAY CREATE MULTIPLE LINKED LEDGER EFFECTS, BUT IT MUST REMAIN TRACEABLE THROUGH ONE MASTER TRANSACTION/EVENT ID.**

Implement this as a robust, extensible finance engine, not as a collection of disconnected special cases.