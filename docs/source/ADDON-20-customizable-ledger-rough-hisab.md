# ADDON-20 — Customizable ledger, rough hisab, assets, banks, people, reconciliation and settlement

Received 2026-10-09 as the file `# FINLY — COMPLETE MASTER PRODUCT,.txt` (moved here unchanged). Recorded verbatim below the line.

---

# FINLY — COMPLETE MASTER PRODUCT, ACCOUNTING AND IMPLEMENTATION PROMPT

## Build a Customizable Financial System Like Excel/Google Sheets, With Real Accounting, Assets, Banks, People, Rough Hisab, Reconciliation and Settlement

**Project:** Finly  
**Repository:** https://github.com/thehummingbirdsrudios-lgtm/Finly  
**Frontend:** Existing Flutter/Dart application for Android  
**Backend:** Inspect the existing implementation and continue using its established architecture  
**Database:** Existing PostgreSQL/Supabase infrastructure where appropriate  
**Production database compatibility target:** PostgreSQL 17

---

# 1. YOUR MISSION

You are continuing development of the existing Finly application.

Your task is to inspect the actual repository, understand its present condition, and implement the remaining application functionality directly in the existing codebase.

Do not merely generate a plan, architecture document, mockup, prototype, or sample code. Build, integrate, test, fix, and verify the real application.

Finly must combine:

1. Personal financial management.
2. Business accounting and separate financial books for multiple entities.
3. Cash, bank accounts, physical assets, and asset-to-money conversions.
4. Complete tracking of where money originates, who owns it, who handles it, where it goes, and where it remains.
5. A customizable Excel/Google Sheets-style ledger that each entity can configure for its own working style.
6. A flexible parent-hisab workflow that contains many individual transactions.
7. Temporary and pending ledgers, custom calculations, and outstanding-balance tracking.
8. Multi-person, multi-bank, and multi-account operations.
9. Reconciliation, settlements, receipts, approvals, and final hisab closing.
10. Accurate financial accounting, access control, audit history, reporting, and controlled sharing.

**The most important product requirement is flexibility:** Finly cannot predict every customer's business, terminology, accounting workflow, ledger columns, or daily-entry pattern. Each authorized user must be able to configure a ledger to suit their actual needs without changing the application's underlying security, accounting integrity, or database architecture.

The final experience should feel as flexible as Excel or Google Sheets, but with the benefits of structured financial records, reusable calculations, traceable assets and money movements, permissions, automated totals, reconciliation, and reliable accounting.

## Mandatory execution rules

- Inspect the repository, Git status, existing specifications, database schema, migrations, backend APIs, Flutter screens, and current tests first.
- Preserve working functionality and confirmed decisions.
- Identify what is implemented, partially implemented, broken, missing, and unverified.
- Implement the work incrementally in dependency order.
- Run available tests, investigate failures, fix them, and rerun relevant checks.
- Never claim a feature or test is complete without evidence.
- Never replace working modules merely to make the architecture look cleaner.
- Never create fake financial data, dummy buttons, disconnected screens, fabricated balances, or placeholder success messages in production workflows.
- Do not hardcode people, firms, banks, ledger layouts, transaction types, the number of rows, or the number of accounts.
- Do not ask the user to repeat decisions that are already specified here.
- If a real business ambiguity cannot be safely resolved, preserve the record as incomplete or route it for review rather than inventing an accounting treatment.
- If a device or external service is unavailable, continue every task that can be completed and verified without it.
- Keep an implementation checklist in the repository so work can continue from the exact stopping point if the session ends.

**Do not stop after the initial audit or implementation plan. Continue implementing and testing the remaining achievable work.**

---

# 2. PRODUCT PHILOSOPHY

Finly's purpose is:

**Your Personal Money. Your Businesses. Every Fund Flow. One Connected System.**

People do their hisab differently. One person maintains columns for debit and credit. Another records expenses and outstanding balances. Another tracks silver weight, purchase rates, selling rates, and cash received. Another records which person holds money, which bank received it, and when a receipt arrived.

Finly must support these differing workflows without forcing all users into one rigid ledger design.

The product must separate two things:

**Customizable user experience:** Each entity can design its own ledger layouts, labels, columns, dropdowns, formulas, reports, and working patterns.

**Authoritative financial system:** The application still maintains validated transactions, source and destination records, account relationships, balances, ownership, asset quantities, classifications, approvals, and audit history.

Customizing a sheet must never break the underlying accounting rules.

A user may change the name of a column or add a custom calculation, but must not be able to bypass authorization, manufacture money, manipulate posted accounting balances through an unvalidated formula, or erase financial history.

---

# 3. THE FIRST-TIME EXPERIENCE: DO NOT ASSUME ANYTHING

When a user first opens Finly or creates a new personal book or business entity, the application must not assume that money, assets, bank accounts, people, or transactions already exist.

The initial state must be genuinely empty until the user creates or imports records.

Do not create fabricated opening cash, sample silver, fictional banks, dummy customers, or invented account balances in a real user's books.

Provide a guided setup process that allows the user to define their starting position accurately.

## 3.1 Entity and book setup

First establish:

- Entity name and type.
- Whether it is a personal book, business, partnership, company, branch, subsidiary, or another supported type.
- Legal/recorded owner relationships.
- Authorized administrators and members.
- Financial year and applicable accounting settings.
- Base currency and any supported additional currencies.
- Required opening date.
- Default ledger template, if the user chooses one.
- Applicable accounting and approval policies.
- Relevant physical locations and cash-storage locations.
- Appropriate privacy and access settings.

Entity creation must not automatically make the creator its legal owner or grant access to unrelated entities.

## 3.2 Opening financial position

Ask whether the user wants to enter an opening position now or complete it later.

Provide structured sections for:

- Cash held physically.
- Cash held in a Tijori or another location.
- Existing bank accounts and their opening balances.
- Gold, silver, and other physical assets.
- Money currently held by another person.
- Receivables and actual outstanding obligations.
- Payables and liabilities.
- Existing loans and advances.
- Property and other assets.
- Opening capital or other applicable opening-balance categories.
- Supporting evidence.

The user may confirm that the entity starts with no opening assets or balances, enter an opening balance, or leave setup incomplete. The application must not silently select one of those possibilities.

## 3.3 Every opening amount needs context

For an opening amount or asset holding, where relevant, record:

- Exact amount or quantity.
- Currency or unit.
- Asset type.
- Actual owner.
- Entity/book to which it belongs.
- Current physical location or bank account.
- Current holder or custodian.
- Source or origin of the funds/assets, if known or applicable.
- Reason or opening-balance explanation.
- Effective date.
- Acquisition cost or valuation basis where relevant.
- Supporting receipt, statement, inventory, or other evidence.
- Whether the figure is confirmed, estimated, or awaiting verification.

If the source or ownership is unknown, preserve that uncertainty explicitly. Do not invent an owner, bank, asset value, income source, loan, or capital entry just to fill a required field.

Allow authorized users to complete missing information later, with an audit trail where appropriate.

**First principle: Finly starts with an empty book, not a fictional financial position. Every real financial value must be entered, imported, or otherwise supported.**

---

# 4. MONEY MUST ALWAYS HAVE A TRACEABLE SOURCE AND DESTINATION

A major Finly requirement is to understand more than an amount.

Whenever money enters, leaves, moves, is deposited, is transferred, is handed over, or is used for an expense, record the facts needed to explain the movement.

For each relevant transaction, the application must answer:

1. How much money was involved?
2. Where did the money originally come from?
3. Who owns the money?
4. Which entity/book does the movement relate to?
5. Where was the money immediately before the movement?
6. Who physically held or controlled it?
7. Who initiated, authorized, or performed the operation?
8. Where did the money go?
9. Who owns or holds the destination account or property?
10. Who is expected to use or benefit from the money?
11. Why did the movement happen?
12. What type of transaction was it?
13. What evidence supports it?
14. Where is the money now?
15. How much has been confirmed, spent, returned, deposited, transferred, or left outstanding?
16. How does the movement relate to other transactions?
17. What was the financial effect on each relevant set of books?

Do not treat all of these as the same field.

For example, the original owner of the money, the person carrying it, the person depositing it, the bank account holder, and the final beneficiary may all be different.

A transfer does not automatically change ownership. Custody does not automatically create income, debt, capital, or expense.

The interface must make these distinctions clear without requiring the user to type the same explanation into multiple free-text boxes.

---

# 5. CUSTOMIZABLE EXCEL/GOOGLE SHEETS-STYLE LEDGER — A CORE FINLY FEATURE

This is one of the most important requirements.

**Every entity must be able to customize its own ledger structure, entry format, labels, columns, dropdowns, formulas, totals, and working pattern.**

Finly cannot predict how every customer wants to record their daily hisab. Some want traditional debit/credit entries. Others want income/expense, received/paid, quantity/rate/value, party-wise balances, or outstanding and pending columns. Some need more than one of these models.

Do not force all customers to use one universal hardcoded ledger.

## 5.1 Ledger templates

Provide a ledger-template builder that lets an authorized user:

- Create a new ledger layout from scratch.
- Start from a built-in template.
- Copy an existing ledger template.
- Edit a user's own templates.
- Rename templates.
- Reorder columns.
- Add or remove permitted columns.
- Define labels and descriptions.
- Select field types.
- Define dropdown options.
- Set required and optional fields.
- Configure default values where appropriate.
- Define validation rules.
- Configure display and calculation settings.
- Preview the resulting ledger.
- Save, duplicate, version, deactivate, or retire templates safely.

A template must be reusable without copying unrelated transaction data, ownership relationships, or user permissions.

Templates and their configuration must have a clearly defined scope, such as an entity, authorized user, or workspace. One entity must not automatically change another entity's private ledger configuration.

Where sharing or copying templates across entities is allowed, revalidate permissions and financial settings in the destination entity.

## 5.2 User-defined column labels

A user should be able to create the column labels they need.

Examples include:

- Date.
- Particulars.
- Person.
- Party.
- Cash In.
- Cash Out.
- Debit.
- Credit.
- Income.
- Expense.
- Deposit.
- Withdrawal.
- Received.
- Paid.
- Quantity.
- Weight.
- Rate.
- Value.
- Current Location.
- Source.
- Destination.
- Bank.
- Account Holder.
- Depositor.
- Beneficiary.
- Expense Type.
- Pending.
- Outstanding.
- Amount Remaining.
- Settlement.
- Receipt.
- Reference.
- Notes.
- Custom user-defined fields.

These are examples, not a hardcoded final column list.

Each entity can choose the appropriate fields and names for its own workflows.

For instance, one business might label a field "Parth Amount," while another calls the equivalent field "Advance Pending." Finly should support both labels while preserving the underlying data types and meanings configured for those fields.

A custom label must not silently change the semantics of a core financial field. The application should distinguish a presentation label from the underlying data model.

## 5.3 Column types

Support appropriate field types, including:

- Text.
- Number.
- Currency amount.
- Quantity.
- Unit.
- Date and time.
- Boolean.
- Single-select dropdown.
- Multi-select where appropriate.
- Linked person/party.
- Linked entity.
- Linked bank account.
- Linked asset.
- Receipt/attachment.
- Reference number.
- Formula/calculated field.
- Status.
- Financially meaningful debit/credit or other validated transaction types.

A free-text field can capture a description, but it must not replace structured bank-account identity, ownership, source/destination relationships, or other critical financial data.

## 5.4 User-defined dropdowns

Users must be able to create, rename, edit, reorder, and deactivate dropdown options within their authorized scope.

Examples:

**Particulars**
- Cash received.
- Cash given.
- Silver sold.
- Silver purchased.
- Bank deposit.
- Bank withdrawal.
- Payment received.
- Expense.
- Return.
- Advance.
- Settlement.
- Custom options created by the user.

**Status**
- Draft.
- Pending.
- Awaiting receipt.
- Partially settled.
- Reconciled.
- Settled.
- Unresolved.
- Other supported statuses.

**Payment method**
- Cash.
- Bank transfer.
- UPI.
- Cheque.
- Cash deposit.
- Another supported method.

**Party/Account**
- A searchable selection from existing authorized records, with an option to create a new record when permitted.

These dropdowns must be configurable rather than an inflexible fixed list.

However, a user must not be able to create a new dropdown option that automatically overrides system authorization, invents a valid accounting classification, or bypasses financial validation.

Where an option maps to a real transaction type or account category, validate that mapping.

## 5.5 Create, edit, and manage rows

In the ledger grid, support:

- Adding rows as required.
- Editing non-posted rows.
- Removing permitted draft rows.
- Reordering rows.
- Duplicating draft rows safely.
- Adding multiple rows quickly.
- Keyboard-friendly data entry.
- Row-level validation.
- Inline notes.
- Search and filtering.
- Grouping and sorting.
- Attaching a receipt to a particular row.
- Saving drafts and returning later.
- Bulk entry for repetitive activities.
- Row-level reconciliation status.
- Row-level outstanding balances.
- Clear visual distinction between draft, posted, settled, and unresolved records.

Users must not be forced to create a new disconnected transaction window for every ordinary ledger line.

For complex transactions, a detailed-entry window should still be available from the relevant row.

Deleting an unposted draft may be allowed according to permissions. Posted financial history must not be silently deleted or rewritten.

## 5.6 Different entities require different patterns

A jewellery business may need weight, purity, and rate columns.

A property business may need property, amount due, agreement value, and settlement columns.

A personal-finance user may need source, expense, paid-to, and remaining balance.

A person managing money carried by intermediaries may need depositor, bank, account holder, current custodian, receipt status, and outstanding cash.

Another business may need its own structure entirely.

Do not implement these examples as isolated hardcoded features. Build a reusable customization system with typed fields, configurable templates, structured links, validated transactions, and reusable calculations.

---

# 6. FORMULAS, FUNCTIONS, TOTALS, OUTSTANDING AND PENDING CALCULATIONS

The ledger must support built-in calculations and user-defined calculations.

Users should not need to calculate every total manually as they would on paper.

**Users must be able to create a new reusable function or calculation by combining, configuring, or reusing existing supported functions through a safe formula builder.**

This is not merely adding a static SUM field. It is a configurable calculation system.

## 6.1 Built-in calculation functions

Provide relevant built-in functions such as:

- Sum.
- Subtraction.
- Addition.
- Multiplication.
- Division with safe error handling.
- Count.
- Minimum and maximum.
- Conditional calculations.
- Conditional sums and counts.
- Difference between two amounts.
- Remaining balance.
- Outstanding amount.
- Pending amount.
- Amount received.
- Amount paid.
- Amount settled.
- Amount returned.
- Amount deposited.
- Quantity remaining.
- Quantity sold.
- Quantity purchased.
- Rate multiplied by quantity.
- Gross amount.
- Fees/charges.
- Net amount.
- Expected versus actual difference.
- Balance before and after a movement.
- Date-based or status-based filtering and aggregation where supported.

The actual supported library should follow the existing architecture and implementation needs. Do not invent a formula that produces financially incorrect results.

## 6.2 Example: pending and outstanding calculations

Suppose a user has created columns for:

- Total amount due.
- Amount received.
- Amount paid/settled.
- Amount returned or credited.
- Remaining outstanding.
- Pending receipt confirmation.
- Status.

Finly should allow the user to configure appropriate formulas.

A basic outstanding calculation, when the selected workflow's semantics support it, could be:

`Outstanding = Amount Due − Valid Allocated Settlements`

A simple remaining cash calculation, when the values represent mutually exclusive movements in the same scope, could be:

`Remaining Cash = Opening Cash + Confirmed Receipts − Confirmed Payments`

A basic pending calculation might be:

`Pending Amount = Expected Amount − Confirmed Amount`

But the system must validate the business meaning of each formula.

For example, an amount awaiting receipt confirmation is not necessarily a financial debt. A deposit in transit is not automatically an expense. A customer balance may require allocations and credits, not just the difference between two unrelated column totals.

Provide appropriate formula templates and explain the assumptions.

## 6.3 Custom function builder

Provide a user-friendly function builder that allows users to:

1. Create a function with a name and description.
2. Select the fields it uses.
3. Select existing supported functions.
4. Combine those functions into a new calculation.
5. Add conditions.
6. Select relevant statuses, categories, parties, date ranges, or entities within the user's permissions.
7. Define the result type, such as currency, quantity, number, Boolean, or text where supported.
8. Set required input fields and sensible handling of missing values.
9. Preview the result using authorized sample records.
10. Validate the formula and display errors.
11. Save the function for reuse.
12. Edit, duplicate, version, or deactivate the function safely.
13. Use it in authorized calculated columns, summaries, or reports.

For example, a user may create a custom function that:

- Sums all confirmed deposits for a selected person.
- Subtracts all valid settlements allocated to that person's outstanding obligation.
- Excludes cancelled or reversed records according to the selected accounting semantics.
- Displays the resulting amount as "Amount Still To Be Settled."

Another user might build a function that totals silver quantity sold and multiplies it by a rate, with clear units and appropriate treatment of fees.

The builder should be understandable to users who are not programmers.

## 6.4 Functions made from other functions

Support composition of existing functions.

A user must be able to select available supported functions and combine them into a new reusable function without having to write application code.

Where feasible, support named reusable parameters, reusable formula templates, scoped function libraries, and dependency tracking.

If an existing function is changed, Finly must identify affected formulas and handle the change safely. Do not allow a change in one shared formula to silently corrupt a user's historic report or posted transaction.

Use versioning and suitable recalculation policies.

## 6.5 Formula and function safety

Do not execute arbitrary user-supplied scripts, SQL, shell commands, or unrestricted source code as a formula.

Implement a constrained, validated expression engine or similarly safe calculation mechanism.

It must prevent:

- Data access outside the user's permissions.
- Secret or credential access.
- Arbitrary code execution.
- Recursive function loops or unbounded recursion.
- Infinite loops and excessive computation.
- Unauthorized cross-entity data aggregation.
- Formula injection or unsafe string execution.
- Silent financial balance manipulation.
- Hidden modifications of posted transactions.

Validate types, units, dependencies, authorization, function versions, and input data.

Set practical calculation limits and provide meaningful errors.

## 6.6 Separate custom calculations from authoritative accounting

This distinction is mandatory.

A user-defined formula may calculate a column, total, estimate, report, or workflow indicator.

It must not automatically create or alter authoritative financial postings unless the operation is explicitly mapped to a supported, authorized, validated financial command.

For example, a custom formula displaying an outstanding amount must not itself create a debt or liability. A formula showing a profit estimate must not automatically recognize accounting income. A custom label named "Expense" does not by itself make a transaction a valid expense.

Keep calculated presentation fields separate from persisted accounting effects.

---

# 7. DEBIT/CREDIT, EXPENSE, INCOME AND CUSTOM TRANSACTION TYPES

Users must be able to configure how they record everyday transactions.

Support appropriate ledger models, including:

- Debit and credit.
- Income and expense.
- Received and paid.
- Source and destination movements.
- Quantity, rate and value.
- Outstanding and settlement.
- User-defined classifications supported by validated mappings.

Not every customer needs the same columns.

An authorized user may create a template with debit/credit columns, while another uses received/paid columns and a third tracks both quantity and amount.

However, a debit is not always a receipt, and a credit is not always a payment. Their financial effects depend on the account type and accounting model.

The system must maintain correct underlying entries even when the user changes the template labels.

If the user enters a rough note first, preserve that draft and ask for additional information when it becomes necessary for posting.

Never force an unsupported income, expense, capital, loan, or asset classification merely because the user selected a similar-sounding label.

---

# 8. PHYSICAL ASSETS AND MONEY CONVERSION

Money is not the only thing users own or hold.

Finly must support gold, silver, property, and other appropriate assets, with quantity, valuation, ownership, custody, and transaction history.

## 8.1 Asset register

For every supported asset, track the applicable information:

- Asset type.
- Asset name/description.
- Actual owner and relevant ownership share.
- Entity/book.
- Current custodian or physical holder.
- Location.
- Quantity and unit.
- Purity/fineness and other relevant characteristics.
- Acquisition date.
- Historical cost, if available.
- Current estimated value and valuation date.
- Valuation method/source.
- Actual purchase or sale rate.
- Supporting documents.
- Transaction and conversion history.
- Remaining quantity.
- Status and notes.

Do not treat a quantity, an estimated market value, an acquisition cost, and actual cash proceeds as interchangeable.

## 8.2 Rate required for asset sales

When an asset is sold, capture the actual agreed transaction rate and its unit.

For example, a silver sale requires the user to specify:

- Which silver holding is involved.
- The actual quantity being sold.
- Unit and applicable purity.
- Rate.
- Whether the rate is per gram, kilogram, or another unit.
- Currency.
- Gross consideration.
- Charges, fees, deductions, or adjustments.
- Net consideration.
- Actual amount received.
- Any balance still receivable.
- Buyer/counterparty.
- Payment method and destination.
- Date and relevant evidence.

Never assume an amount received merely because a rate was entered.

Calculate the expected gross value using compatible units, but preserve actual executed values and valid negotiated adjustments.

## 8.3 Rate required for asset exchange and conversion

When exchanging one asset for another, the user must be able to record the actual agreed rates for the relevant sides of the exchange.

For example, when exchanging silver for gold, capture:

- Quantity of silver given.
- Silver unit and purity.
- Agreed silver rate.
- Quantity of gold received.
- Gold unit and purity.
- Agreed gold rate.
- Currency and rate units.
- Gross value on each side.
- Additional money paid or received.
- Exchange charges or deductions.
- Any difference or balancing consideration.
- Parties involved.
- Actual owner of the assets before and after the exchange.
- Current holder/custodian.
- Relevant valuation or transaction evidence.
- Date and resulting balances.

Do not assume a one-to-one quantity conversion between different assets.

If the transaction includes both an asset exchange and a cash payment, record each component separately and link them to the same underlying exchange.

For any supported conversion, allow the user to choose the applicable rate and its unit. Show the calculated amount transparently.

## 8.4 Market rates versus actual transaction rates

Distinguish:

- Actual negotiated/executed rate.
- Current estimated market rate.
- Historical valuation rate.
- A quoted rate that was not accepted.
- Actual settlement amount.

Do not replace an executed historical rate when market prices later change.

If a market-price source or live rate feature is implemented, identify its source and timestamp. Do not pretend an estimated rate is the actual trade rate.

The rate, quantity, fees, cash received/paid, and remaining balance must be reconcilable.

## 8.5 Other assets

Use an extensible asset framework so users can configure relevant fields for other asset types.

Property transactions, for example, may require an agreed sale price, staged consideration, payments received, balances still receivable, ownership shares, and supporting documents.

Do not force every asset into the same fields as gold or silver, but retain a consistent common framework for identity, ownership, quantity/value, transactions, custody and history.

---

# 9. EVERY ADDITION OF MONEY MUST EXPLAIN WHERE IT CAME FROM

Never let a user add an unexplained amount to a posted cash or bank balance merely by clicking "Add Money."

Support valid ways to record the initial receipt or opening position, depending on the transaction.

Possible sources include:

- Opening balance that existed before record keeping began.
- Sale proceeds.
- Cash received from another person.
- A transfer from a bank account.
- A transfer from another entity.
- A loan actually received.
- Capital introduced where genuinely applicable.
- Remuneration or income actually earned.
- Reimbursement.
- A return of previously handed-over money.
- A refund.
- A gift or donation.
- A supported adjustment or correction.
- Another clearly identified and supported source.

These are examples, not a fixed exhaustive list.

Each relevant receipt should capture:

- Amount and currency.
- Date/time.
- Source person, entity, asset or account.
- Who owns the incoming money under the recorded arrangement.
- Receiving entity/book.
- Receiving account or physical location.
- Person handing over or sending the money.
- Person receiving it.
- Reason/purpose.
- Transaction type/category.
- Supporting receipt or reference.
- Whether the amount is actual, estimated, pending, or disputed.
- Related original transactions, if any.
- Proper accounting treatment.

If the user does not know the source, allow a clearly labelled incomplete record or a review workflow. Do not silently label the amount as income or create fake capital.

## 9.1 Where is the money currently?

Maintain actual current location/custody information when relevant.

Money may be:

- In a specific Tijori.
- At another physical location.
- In a specific bank account.
- With a named person.
- In transit under the responsibility of a named intermediary.
- Held in a supported clearing account pending reconciliation.
- Used for an actual expense.
- Transferred to another identified destination.
- Returned to a source.
- Unlocated and awaiting review.

Do not count the same money simultaneously as available cash in multiple locations.

When custody changes, preserve the movement history and make the latest location/state clear.

---

# 10. MULTIPLE BANKS, EXACT ACCOUNTS AND ACCOUNT HOLDERS

A deposit entry must identify the actual banking destination and relevant people.

A field that says only "Bank A" or "Bank Deposit" is insufficient.

For each applicable operation, identify:

- The source bank/account, if the operation originated from one.
- The bank or institution where the deposit/transfer was processed.
- The branch or cash-deposit machine, if applicable.
- The destination bank holding the receiving account.
- The exact destination account.
- The account holder's identity.
- Whether it is a personal account, firm/entity account, joint account, or another supported relationship.
- Which person or entity owns/holds that account.
- Who owns the original funds being deposited.
- Who physically performs the deposit.
- Who authorizes it.
- Who is intended to use or benefit from the funds.
- The legitimate transaction purpose.
- Date, amount, currency and reference.
- Receipt/evidence and confirmation status.

The processing bank and account-holding bank may be the same, but the schema must not assume that they always are.

## 10.1 Bank-account register

Create a reusable account register.

Each entry may contain:

- Institution/bank.
- Account nickname.
- Account type.
- Linked owner/person/entity.
- Account-holder name as recorded by the institution.
- Personal/business classification.
- Relevant entity.
- Joint-holder relationships where supported.
- Currency.
- Branch and other routing details where needed.
- Securely stored account identifier where operationally necessary.
- Masked account identifier for ordinary UI display.
- Account status and verification information where maintained.
- Associated payment-instrument reference, if applicable.
- Supporting documents where justified.

Do not infer account ownership from the person who created the record or from the entity currently selected.

If an account belongs to someone else, the user must be able to select or create a specific linked person/entity record. "Friend's account" is not sufficient final identification where the exact identity is relevant.

## 10.2 Exact deposit questions

The system must be capable of answering:

1. Which bank processed the operation?
2. Which bank holds the destination account?
3. Which account received the money?
4. Whose account is it?
5. Is it personal, firm-owned, jointly held, or another entity's account?
6. If it belongs to another person, who exactly?
7. Who supplied the original money?
8. Who owns the money?
9. Who physically deposited it?
10. Who authorized the operation?
11. Who is intended to use it?
12. Why was it deposited?
13. What receipt/reference proves the deposit?
14. How much remains unconfirmed or outstanding?
15. How does it connect to the original funds and parent hisab?

Only require fields relevant to the transaction, but preserve the necessary distinctions.

Do not store PINs, CVVs, OTPs, online banking passwords, or other card security credentials.

---

# 11. PEOPLE, INTERMEDIARIES, FRIENDS, RELATIVES AND PAYMENT INSTRUMENTS

A parent hisab must support an arbitrary number of participants.

Participants may include:

- Original owner of funds.
- Entity maintaining the book.
- Person physically holding the money.
- Person handing it over.
- Person receiving it.
- Depositor.
- Bank-account holder.
- Person who authorized the operation.
- Beneficiary or intended user.
- Expense-bearing entity.
- Approver.
- Person confirming a receipt.
- Person making a return or settlement.

One person can perform multiple roles, but those roles must remain distinct.

Do not hardcode relationships such as brother, friend, cousin, worker, owner, or customer as the only allowable types. Let users create appropriate parties and relationship labels while preserving structured financial roles.

Support multiple legitimate payment instruments linked to accounts and identified holders. Keep cardholder, bank, associated account holder, original money owner, and depositor separate.

When a friend, brother, or intermediary assists in handling funds, capture the actual events and obtain relevant confirmation/evidence where needed.

Do not recommend dividing transactions across people, accounts, or banks to evade applicable bank limits, reporting requirements, or compliance controls. Record actual legitimate operations accurately and flag concerning or unsupported situations for review.

---

# 12. THE COMPLETE ROUGH-HISAB WORKSPACE

Create or finish a connected main-hisab workspace.

The user should be able to begin an operation and add all relevant records into it without repeatedly navigating to unrelated modules.

Possible workspace sections include:

1. Overview.
2. Starting balance and opening position.
3. Participants.
4. Assets and conversions.
5. Cash and physical locations.
6. Bank accounts.
7. Custom ledger.
8. Individual transaction entries.
9. Receipts and documents.
10. Pending and outstanding amounts.
11. Reconciliation.
12. Settlement.
13. Final accounting summary.
14. Audit history.

These are views of a connected workflow, not separate duplicate transactions.

Each main hisab must support unlimited relevant child entries within sensible technical limits and must not impose a hardcoded number of people, deposits, assets or receipts.

## 12.1 Main hisab example

Main hisab: **Silver Sale and Multi-Bank Deposit**

The parent record could contain:

1. Opening Tijori cash.
2. Opening silver quantity.
3. Silver sale at an agreed rate.
4. Actual proceeds received.
5. Cash handover to an identified intermediary.
6. Deposit into Bank A's identified account.
7. Deposit into Bank B's different account.
8. Deposit into a named person's personal account.
9. Deposit into another entity's account.
10. Receipts and references.
11. Actual expenses and charges.
12. Cash remaining with the intermediary.
13. A later transfer or return.
14. Outstanding/unconfirmed entries.
15. Reconciliation and final settlement.

Each child entry remains independently identifiable, but the user can inspect the entire operation as one connected hisab.

## 12.2 Detailed-entry forms

Provide context-sensitive forms.

For example:

- "Add money" asks for the actual source and destination.
- "Cash handover" records both custodians and the relevant owner/purpose.
- "Bank deposit" records the bank, exact receiving account, account holder, depositor and evidence.
- "Sell silver" records quantity, rate, consideration and actual settlement.
- "Exchange assets" captures the actual quantity and rate on both sides.
- "Expense" records its purpose, actual payer, expense-bearing entity, beneficiary and approval requirements.
- "Settlement" links to the actual obligation or original item.

Do not force every transaction into one generic amount-and-description form.

## 12.3 Rough entry first, details later

A user should be able to record a quick rough entry when information is incomplete.

Allow them to save a draft and add bank details, account holder, receipt, asset rate, or classification later.

An incomplete draft must remain visibly incomplete and must not silently modify posted balances.

When the user is ready to post, apply the validations necessary for that transaction type.

---

# 13. TEMPORARY LEDGERS, PENDING ITEMS AND CLEARING ACCOUNTS

The system must distinguish between unfinished rough entries and real money that has moved but has not yet reached its final reconciled state.

**Draft is a workflow state. A clearing account is an accounting concept. They are not interchangeable.**

## 13.1 Draft entries

Draft records may have missing information and do not affect final posted balances until properly validated and posted.

## 13.2 In-transit and clearing balances

When an actual financial movement requires a temporary or clearing account, record its actual source, destination, custodian, amount, expected completion, accounting treatment and outstanding balance.

For example, cash may have been handed to a person for legitimate deposits, but receipts have not arrived for all destinations.

Finly must show:

- Original amount handed over.
- Amount deposited and confirmed.
- Amount supported by receipt but not yet matched.
- Amount currently held by the intermediary.
- Actual documented expenses.
- Amount returned.
- Amount awaiting evidence.
- Unexplained balance requiring review.

Never turn a pending item into an expense, receivable, loan, debt, or income merely to clear a temporary ledger.

Every clearing item must remain traceable and eventually be resolved, carried forward through an authorized process, or explicitly marked for review.

---

# 14. CUSTOM LEDGER TOTALS, FORMULAS AND REUSABLE FUNCTIONS

Every template must be able to display relevant totals for its own configuration.

Depending on the selected fields and workflow, show:

- Debit total.
- Credit total.
- Receipts total.
- Payments total.
- Income total.
- Expense total.
- Cash total.
- Bank deposit total.
- Asset quantity total.
- Asset conversion value.
- Gross and net totals.
- Settled amount.
- Pending amount.
- Outstanding amount.
- Remaining balance.
- Unconfirmed amount.
- Reconciled amount.
- Difference or mismatch.
- Counts by status.
- Other authorized custom totals.

Do not assume every ledger uses all of these. Let the user configure which totals appear.

## 14.1 User-configurable summary rows

Users must be able to create their own summary labels and calculate them from selected fields/functions.

For example:

- "Total Silver Sold."
- "Total Cash Deposited."
- "Amount With Savan."
- "Pending Receipts."
- "Bank A Total."
- "Amount To Be Returned."
- "Unsettled Expenses."
- "Final Cash Balance."
- "Outstanding With Party."
- Other user-defined summaries.

The user should be able to name a function/output, select its inputs, configure its scope, and preview the result.

A custom output label does not change the authoritative accounting meaning of the data.

## 14.2 Formula scope

Allow formulas to operate over authorized records in clearly defined scopes:

- Current row.
- Current ledger.
- Current parent hisab.
- Selected party/account/asset.
- Date range.
- Current entity.
- Authorized aggregate reports.

Cross-entity calculations must not bypass permissions or combine independent books without valid authorization and accounting treatment.

## 14.3 Formula lifecycle and reliability

Custom functions and formulas need:

- Validation.
- Type checking.
- Unit checking.
- Clear errors.
- Versioning.
- Dependency tracking.
- Recalculation rules.
- Safe edits.
- Performance limits.
- Permission checks.
- Preview and test.
- Controlled activation/deactivation.

If a formula changes, preserve the historical context of previously posted financial transactions.

Do not allow a later formula edit to silently rewrite historical posted amounts or approval outcomes.

---

# 15. RECONCILIATION AND SETTLEMENT

After entering the rough hisab, users must be able to return to it and compare their records against actual cash, bank accounts, asset quantities, receipts and other evidence.

Support:

- Expected-versus-actual matching.
- Receipt-to-transaction matching.
- Bank-statement matching where implemented.
- Cash and asset quantity checks.
- Partial deposits.
- Partial payments.
- Partial settlements.
- Returned amounts.
- Duplicate detection.
- Missing evidence.
- Unexplained differences.
- Individually settled child entries.
- Parent-level reconciliation status.
- Final closing or authorized carry-forward of unresolved items.

For every outstanding item, display the applicable:

- Original amount.
- Amount confirmed.
- Amount settled/allocated.
- Amount still pending.
- Amount still outstanding.
- Person/entity responsible.
- Source/destination.
- Evidence.
- Date.
- Current status.
- Required next action.

Use appropriate accounting semantics. For instance, pending receipt confirmation is not automatically a legal debt, and an amount being held by someone is not automatically a loan.

## 15.1 Individual settlement

The user must be able to open a single child entry and settle it without incorrectly marking all other entries as complete.

Settlement may be partial where the underlying obligation supports partial payment.

Prevent allocations exceeding authorized available balances unless a specifically supported advance/overpayment workflow permits them.

## 15.2 Finalization

Before a parent hisab is closed, display its starting amounts, relevant asset conversions, deposits, current holders, receipts, expenses, outstanding items, matched and unmatched balances, and final accounting effects.

Do not fabricate adjustments to make the figures balance.

If a legitimate workflow requires carrying unresolved items forward, preserve the amount, source, destination, responsible person, evidence, and reason for unresolved status.

Posted history must remain auditable. Reopening or correcting a completed hisab requires authorization and a controlled process.

---

# 16. ACCOUNTING RULES FOR PERSONAL AND BUSINESS BOOKS

Finly supports personal finance and business accounting. A single real-world operation can affect several books, but each book must retain its correct identity and treatment.

## 16.1 D-038 — Super Admin access: CONFIRMED

Platform administration alone must not grant access to private firm financial books.

- Firm owners receive access through explicit entity-scoped owner roles.
- Platform Super Admin, Platform Admin, Support Operator, entity owner, partner, creator and member are distinct concepts.
- Exceptional support access requires explicit authorization, limited scope and duration, and complete auditing.
- No silent impersonation of owners or business users.
- Platform-only privileges cannot be granted through an entity's custom role builder.
- A user must not automatically access all entities merely because they own or created one entity.

Resolve any conflicting legacy rules in favour of this confirmed decision.

## 16.2 F8/F9 — Firm expense versus owner income

A firm's expense must not automatically become income in the owner's personal books.

The transaction's actual nature may involve remuneration, reimbursement, drawings, distribution, loan, personal benefit, repayment, or another supported category.

Preserve independent book-side classifications when justified. Validate them against the economic substance and entity context. Flag ambiguous or inconsistent classifications for resolution.

## 16.3 F8/F9 — Non-repayable transfers

A transfer that is not repayable and is not classified as drawings or capital must not automatically become the giver's expense.

Require the actual purpose, such as a gift, donation, remuneration, distribution, business expense, reimbursement or another supported category.

Do not automatically treat a gift or owner payment as a business expense. Do not create debt merely because money moved.

## 16.4 Eight-scenario matrix

Implement and test both scenarios:

1. Firm → Owner.
2. Owner → Any Other Entity.

For each, test four combinations of independently selected book-side classifications, covering eight combinations overall.

Validate each combination against the actual purpose, entity relationship, and accounting rules. Do not assume every combination is valid.

## 16.5 Owner-benefit approval

Provide entity-specific approval policies for owner-benefit expenses, related-party transactions and high-value transactions.

Let authorized users configure thresholds, affected categories, eligible approvers and supported exceptions.

Prevent self-approval when independent approval is mandatory. Provide a documented, audited alternative workflow for a single-owner business or when no eligible independent approver is available.

Approval rules must be enforced by the backend and respected by all applicable posting routes.

## 16.6 Traceability without duplicate movements

A transaction can be referenced by multiple linked records or books without counting the same movement twice.

For example, a firm pays ₹20,000 to an owner, who later transfers ₹8,000 to another person. Link the second movement to the first where appropriate, but do not repost the original ₹20,000.

Do not assume what happened to the remaining ₹12,000. Record the actual balance, location, use, return or later transfer.

Keep the underlying movement, individual book postings, allocations, settlement obligations, asset changes and audit events separately identifiable.

---

# 17. ACCESS CONTROL AND CUSTOM ROLES

Inspect the existing authorization implementation and complete missing components.

Support:

- Platform roles.
- Entity-scoped ownership, partnerships and membership.
- Custom entity roles.
- Role holders and assignments.
- Fine-grained permissions.
- Delegation, expiry and revocation.
- Hierarchy-scoped access.
- Entity-specific approval policies.
- Access to sensitive account/financial details.
- Export and sharing permissions.
- Audit trails.

A person creating a role must not silently assign it to themselves. A person cannot grant authority beyond their own authorization.

Saving a custom spreadsheet template or formula must not grant access to the underlying records it references.

Every row, formula, dropdown, report, aggregate, export, and attachment must respect the user's actual data-access scope.

Enforce authorization in the backend, APIs, database policies/RLS, functions, reports and exports. Hiding a button in Flutter is not security.

Support account invitations and safe onboarding. Administrators must not be able to retrieve users' permanent passwords or PINs.

---

# 18. DATABASE AND BACKEND ARCHITECTURE

Inspect existing schemas before creating new models.

Build an integrated domain model that can represent:

- Entities and relationships.
- Users, memberships, roles and grants.
- Parties and transaction participants.
- Asset definitions and holdings.
- Bank institutions and bank accounts.
- Account-holder relationships.
- Locations and custodians.
- Main hisab sessions.
- Individual transaction entries.
- User-configured ledger templates.
- Configurable fields, columns and dropdown options.
- Safe formulas and user-defined functions.
- Formula versions and dependencies.
- Asset sales, exchanges and conversions.
- Underlying money movements.
- Accounting postings.
- Receipts and evidence.
- Outstanding obligations and settlement allocations.
- Reconciliation states.
- Approval policies and decisions.
- Audit records.

These are logical requirements, not an instruction to create one table per bullet. Design normalized, maintainable schema with proper relationships and constraints.

All financial operations must have correct transaction boundaries, idempotency, authorization and consistency.

Use safe decimal/numeric monetary calculations, appropriate quantity precision, database constraints, indexes, migrations and concurrency control.

If Supabase is used, review RLS, grants, RPC authorization, function ownership, `SECURITY DEFINER` usage, and search paths. Do not rely only on privileged service credentials when testing customer access.

Use migrations for schema changes. Do not depend on undocumented manual SQL modifications.

Test the target PostgreSQL 17 environment. If development currently uses another version, do not claim PostgreSQL 17 validation without actually testing it.

---

# 19. FLUTTER UI AND EXPERIENCE

Integrate the functionality into the real Finly application.

The main ledger should feel like a familiar spreadsheet while retaining financial safeguards.

Provide:

- Editable and reorderable custom columns.
- Searchable dropdowns.
- Row-based entry.
- A formula/summary configuration interface.
- User-defined ledger templates.
- A safe custom-function builder.
- Automatic calculation previews.
- Clear totals and remaining balances.
- Asset and rate entry.
- Explicit bank/account-holder information.
- Linked parties, entities and custodians.
- Receipt attachment.
- Draft saving.
- Pending/outstanding status.
- Detailed transaction windows.
- Reconciliation and settlement panels.
- Permission-aware controls.
- Loading, empty, validation, conflict and failure states.
- Responsive and accessible layouts.
- Safe confirmation of posting, reversing and closing.
- Search/filtering for large ledgers.

Minimize unnecessary clicks while preserving financial integrity.

Avoid showing a misleading combined balance that treats estimated asset values, cash, bank balances, unsettled receivables and liabilities as if they were the same type of money.

Use explicit labels and totals that reflect their actual meaning.

All user actions must perform real operations. No fake buttons, dummy balances, fabricated data, disconnected routes, or placeholder success messages.

---

# 20. REPORTS, EXPORTS AND DOCUMENTS

Allow authorized users to view and export:

- Custom ledger reports.
- Debit/credit summaries.
- Income/expense summaries.
- Bank account histories.
- Cash and custody histories.
- Asset quantities and valuations.
- Asset sale/exchange histories.
- Transaction histories.
- Parent-hisab summaries.
- Deposit and receipt summaries.
- Pending/outstanding reports.
- Settlement and reconciliation summaries.
- Custom function results where authorized.

Users should be able to filter by date, account, party, asset, location, status, parent hisab and other configured fields where meaningful.

Support PDF/CSV/printable outputs and controlled WhatsApp-friendly sharing where implemented.

Before sharing, select the intended recipient and data scope, preview the document, and confirm the disclosure. Enforce the same access rules as the application. Mask sensitive account information unless full details are authorized and necessary.

---

# 21. END-TO-END EXAMPLE THAT MUST WORK

The final feature must support the following scenario without hardcoding the people, banks, accounts, or number of entries.

### Step 1 — Start with a real opening position

The user creates/selects an entity and records X cash in a Tijori and four kilograms of silver. The user specifies the applicable owner, entity, location, and supporting opening information.

If no opening assets exist, the user can confirm an empty starting position. Finly does not invent amounts.

### Step 2 — Sell silver

The user records the actual silver quantity sold, purity, rate and unit, agreed consideration, charges, actual cash received, and sale evidence.

The remaining silver quantity and actual financial effects are updated correctly when posted.

### Step 3 — Create one main hisab

The user opens "Silver Sale and Multi-Bank Deposit" and adds related entries to that parent record.

### Step 4 — Record the cash handover

The user records the amount handed to the brother or another authorized intermediary, the source, owner, custodian, purpose, time and required acknowledgment.

### Step 5 — Create multiple deposits

The intermediary performs several legitimate cash deposits.

For every deposit, the user records the actual amount, processing bank/channel, destination bank, destination account, exact account holder, account type/ownership relationship, original funds owner, depositor, purpose, beneficiary, reference and receipt status where applicable.

The deposits can go into the user's own account, a firm's account, or an identified third party's account, depending on the actual event.

### Step 6 — Record incomplete information safely

If a deposit is known but its receipt has not arrived, save the appropriate draft or pending record. Do not invent the receipt, claim confirmation, or incorrectly post an unsupported financial effect.

### Step 7 — Use a customizable ledger

The user selects the ledger template that matches their working style or creates a new one.

They can choose their own column labels, row types, dropdowns, debit/credit or received/paid fields, expense categories, outstanding columns, custom summaries and formulas.

### Step 8 — Calculate totals

The user defines or selects a reusable function that totals the confirmed deposits, excludes invalid statuses where appropriate, and calculates the remaining amount that must be accounted for.

The function is validated and does not alter authoritative books merely by calculating a figure.

### Step 9 — Reconcile

The user matches receipts against deposits, checks the money held by each person, verifies the destination accounts, identifies expenses and returned cash, and investigates mismatches.

### Step 10 — Settle

The user settles each actual outstanding obligation or unresolved item according to its true nature. Amounts still held by a custodian remain distinguishable from liabilities, income or expenses.

### Step 11 — Finalize

Finly displays the complete history and final position, including quantities of silver remaining, actual proceeds, cash/bank balances, deposits, amounts with people, documented expenses, returns, pending items, and unresolved differences.

### Step 12 — Reopen the history

The user can later reopen the parent hisab, inspect each independently traceable movement, read its supporting evidence, understand the formulas used for its summaries, and see the actual effect on the relevant books.

Every posted effect must have happened once, not multiple times.

---

# 22. MANDATORY TEST PLAN

Implement and execute automated tests for the actual application logic.

## A. First-time setup

- A new entity starts without fabricated balances or records.
- A user may confirm no opening position or enter actual opening balances.
- An incomplete opening setup is clearly represented.
- Existing cash, assets and bank balances have explicit ownership/location context where relevant.
- Unknown origin or ownership does not silently become income, debt, or capital.

## B. Custom ledger configuration

- Create a ledger from scratch.
- Create a ledger from a template.
- Add, rename, reorder and remove permitted columns.
- Configure field types and dropdowns.
- Add custom rows and descriptions.
- Save and reopen templates.
- Ensure one entity's template does not silently alter another entity's private configuration.
- Validate that critical financial fields retain their underlying typed meaning.
- Prevent unauthorized access to linked data through custom columns.

## C. Formula and function builder

- SUM and other supported calculations return correct results.
- Outstanding calculations use the correct settlement allocations.
- Pending calculations distinguish unconfirmed amounts from actual debt.
- Custom functions can reuse supported existing functions.
- Formula dependencies and versions work correctly.
- Invalid types and units are rejected.
- Division by zero and missing values are handled safely.
- Formula loops and excessive computations are prevented.
- Users cannot execute arbitrary code or SQL.
- Custom formulas cannot read unauthorized records.
- Editing a formula does not silently rewrite posted historical transactions or accounting records.

## D. Money origin and location

- Record opening cash at a specific physical location.
- Record a new receipt with its actual source and purpose.
- Hand money to a named person.
- Deposit money into a specific bank account.
- Return unused funds.
- Transfer funds between accounts.
- Verify the current location and balance.
- Ensure the same cash is not counted in multiple locations.
- Distinguish custody from ownership.

## E. Asset conversion and exchange

- Sell silver by quantity and rate.
- Validate grams/kilograms and compatible rate units.
- Record charges, actual proceeds and unpaid balances.
- Exchange silver for gold with independent quantities and rates.
- Add balancing cash where actually paid or received.
- Record a property sale with partial payments where supported.
- Reconcile remaining asset quantities.
- Ensure estimated market values are not confused with executed rates or actual cash received.

## F. Bank and people identity

- Deposit into the user's personal account.
- Deposit into a firm-owned account.
- Deposit into an identified third party's account.
- Record a destination bank distinct from the processing bank where applicable.
- Record multiple account holders and intermediaries.
- Distinguish the depositor from the account holder and the owner of the original money.
- Attach and match receipts to the correct entries.
- Mask sensitive identifiers.
- Prevent unsupported account relationships from being silently accepted as verified facts.

## G. Parent hisab and settlement

- Create one parent hisab with many entries.
- Add multiple assets, people, banks, deposits, and receipts.
- Save incomplete drafts and complete them later.
- Reconcile one item without marking others complete.
- Partially settle a valid outstanding amount.
- Reject an invalid over-allocation.
- Handle missing receipts and mismatches.
- Prevent duplicate posting upon repeated requests.
- Reopen a completed record through an authorized workflow.
- Preserve the full audit trail.

## H. Accounting and security

- Test all eight F8/F9 combinations.
- Verify firm expenses do not automatically become owner income.
- Verify gifts and non-repayable transfers are not automatically treated as business expenses or debt.
- Verify configurable owner-benefit approval and self-approval restrictions.
- Verify D-038 Super Admin access restrictions.
- Verify cross-entity data isolation.
- Test direct API/database attempts using least-privileged authenticated users.
- Verify exports, custom functions, reports and attachments cannot bypass authorization.
- Run concurrent financial-operation tests using multiple database connections where feasible.
- Verify atomicity, idempotency and correct reversals.
- Test PostgreSQL 17 compatibility.

## I. Flutter integration

Run the real workflow through the app:

Create entity → establish opening position → create a custom ledger → configure dropdowns and formulas → record cash/assets → record an asset sale or exchange → create the parent hisab → record multiple deposits → add receipts → reconcile → settle → finalize → inspect actual balances and reports.

Test validation, loading, errors, permission-denied states, duplicate taps, failed requests, retries, and persistence after restarting the application.

**Do not report a test as passed unless it was actually executed and passed.**

---

# 23. IMPLEMENTATION ORDER

Inspect the existing code first, then apply the order that best respects its real dependencies.

### Phase 1 — Audit existing implementation
Inspect current modules, specifications, database, API, Flutter routes, tests, Git state and release setup. Identify what already exists and avoid rebuilding finished work.

### Phase 2 — Complete security foundations
Finish authentication, entity access, roles, custom permissions, delegation, hierarchy checks and D-038.

### Phase 3 — Establish the financial data model
Complete entities, opening positions, assets, bank accounts, people, ownership, custody, money movements, transaction links and accounting postings.

### Phase 4 — Build the configurable ledger engine
Implement ledger templates, typed custom fields, dropdowns, row entry, custom labels, formula calculations, the custom-function builder, validation, versioning and totals.

### Phase 5 — Build the parent-hisab workspace
Integrate the parent and child transaction model, quick entry, detailed forms, participants, bank details, asset conversions, attachments, pending entries and temporary ledgers.

### Phase 6 — Implement reconciliation and settlement
Complete matching, outstanding calculations, allocations, receipts, settlement, reversal, carry-forward and finalization.

### Phase 7 — Integrate Flutter
Connect actual backend functionality to the screens. Eliminate placeholder logic and complete real user journeys.

### Phase 8 — Reports and controlled sharing
Complete accurate ledger reports, parent-hisab summaries, account/asset histories, pending reports, PDF/CSV generation and permitted sharing.

### Phase 9 — Verify and fix
Run formatting, static analysis, unit tests, integration tests, database tests, permission checks, concurrency tests and regression tests. Fix failures and rerun the relevant checks.

Build the Android application and verify the artifact. Perform device testing if possible. Verify PostgreSQL 17 compatibility.

### Phase 10 — Documentation and release readiness
Update setup/deployment instructions, migrations, financial and access-control rules, backup/recovery steps, tests, known risks and the continuation checklist.

---

# 24. DEFINITION OF DONE

Finly's customizable-ledger and rough-hisab capabilities are complete only when:

- A new entity starts without fabricated records or financial balances.
- Users can accurately establish their opening position and record the origin/location of existing money and assets.
- Assets support actual purchases, sales, exchanges, rates, quantities, valuation and resulting balances.
- Every applicable bank movement identifies the relevant bank, destination account, exact account holder, depositor, source owner, purpose and beneficiary.
- A parent hisab can contain many individually traceable entries.
- Users can design their own ledger templates, labels, columns, row types, dropdowns and layouts.
- Users can create reusable calculations and compose new functions from supported existing functions.
- Debit/credit, income/expense, pending, outstanding and settlement calculations behave according to validated financial semantics.
- User-defined formulas cannot bypass authorization or silently change posted accounting.
- Rough drafts can be saved and enriched later.
- Actual movements remain distinct from temporary drafts and clearing balances.
- Every relevant receipt is connected to the correct entry.
- Users can reconcile and settle entries individually and then finalize the parent hisab.
- The application correctly handles actual financial classification, ownership, custody and multi-entity traceability.
- Backend/database authorization is enforced independently of UI controls.
- Relevant automated tests pass, failures and limitations are reported honestly, and critical release blockers are documented.
- The Android build is verified to the extent possible, and PostgreSQL 17 compatibility has actually been tested before being claimed.

Finly is not production-ready merely because its interface looks like Excel or because the APK compiles. The data model, formulas, permissions, accounting effects, calculations, settlements, and historical records must all work correctly.

---

# 25. FINAL EXECUTION INSTRUCTIONS

Start by inspecting the current Finly repository and its actual completion state.

Then:

1. Identify existing implementations that can be reused.
2. Create an evidence-based checklist of remaining work.
3. Implement the next incomplete dependency directly in the codebase.
4. Test each coherent implementation step.
5. Fix failures instead of merely documenting them.
6. Continue through the dependent modules.
7. Update specifications, migrations and tests.
8. Maintain a precise continuation record if context or execution limits interrupt the session.
9. Report actual results, executed tests, verified features, unresolved questions and genuine external blockers.

Do not stop after producing another roadmap. Do not create a disconnected spreadsheet demo. Do not assume that every customer's ledger pattern can be predicted in advance.

**Build Finly as a customizable financial workspace where every entity can design its own ledger, every user can define safe reusable calculations, every asset conversion records its actual rate and quantities, and every amount has a traceable source, purpose, owner and current location.**

The user must have the flexibility of Excel/Google Sheets without losing the reliability of a proper financial application.

**Inspect. Implement. Integrate. Test. Fix. Verify. Continue until all achievable in-scope work is complete.**