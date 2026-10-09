# ADDON-21 — Complete personal finance, wealth, assets, liabilities, loans, investments and business accounting

Received 2026-10-09 as the file `# FINLY ADD-ON — COMPLETE PERSONAL.md` (moved here unchanged). Recorded verbatim below the line.

---

**# FINLY ADD-ON — COMPLETE PERSONAL FINANCE, WEALTH, ASSET, LIABILITY, LOAN, INVESTMENT AND BUSINESS ACCOUNTING MANAGEMENT**



**## 1. Mandatory instruction**



**Integrate this entire specification into the existing Finly application, database architecture, accounting engine, customizable ledger, reports, permissions, and Flutter UI.**



**\*\*Finly must manage the complete financial life of a person as well as all their businesses. It must not be limited to expenses, bank accounts, or basic bookkeeping.\*\***



**The system must account for money, assets, liabilities, income, expenses, investments, money lent to others, money borrowed from others, money held by other people, recurring payments, charges, receivables, payables, and financial movements across personal and business books.**



**The objective is to help the user understand:**



**- How much money they have.**

**- Where every amount is located.**

**- What assets they own and what those assets are worth.**

**- What they owe and what others owe them.**

**- How much they spend personally.**

**- How much they earn.**

**- How much they invest.**

**- How much they have lent to others.**

**- How much they have borrowed.**

**- What payments they must make in the future.**

**- What money they expect to receive.**

**- How their wealth changes over time.**

**- How each business performs financially.**

**- How all these financial activities connect without incorrectly mixing separate personal and business books.**



**Implement this as a complete extension of the existing Finly architecture. Reuse existing entities, customizable ledger layouts, formulas, accounts, party records, asset models, transaction relationships, reconciliation, and settlement functionality wherever appropriate.**



**Do not create a separate disconnected personal-finance application inside Finly.**



**---**



**# 2. Personal finance and whole-money management**



**Provide a complete personal financial management module for each authorized personal book.**



**The user should be able to maintain their entire financial position in one place, including:**



**- Physical cash.**

**- Cash held in a Tijori or another location.**

**- Multiple bank accounts.**

**- Wallets and supported payment accounts.**

**- Money held by other people.**

**- Personal income.**

**- Personal expenses.**

**- Regular household expenses.**

**- Daily purchases and payments.**

**- Personal assets and valuables.**

**- Investments.**

**- Money lent to other people.**

**- Money borrowed from other people or financial institutions.**

**- Receivables and payables.**

**- Credit obligations.**

**- Subscriptions and recurring bills.**

**- Emergency funds and earmarked savings.**

**- Financial goals.**

**- Expected future payments.**

**- Upcoming receipts.**

**- Net worth and cash flow.**



**The system must support the real financial activities of the user rather than limiting them to a predefined list of expense categories.**



**Users should be able to configure their own personal ledgers, categories, columns, dropdowns, calculations, and reports using the existing Excel/Google Sheets-style customization system.**



**## 2.1 Personal financial dashboard**



**Build a dashboard showing the user's overall financial position with clear separation between different types of values.**



**Include relevant summaries such as:**



**- Total available cash.**

**- Total balances in personal bank accounts.**

**- Money held in other locations.**

**- Confirmed personal income.**

**- Personal expenses.**

**- Investments held.**

**- Loans given to others.**

**- Amounts expected to be received.**

**- Personal loans and other liabilities.**

**- Upcoming payment obligations.**

**- Assets and their latest recorded valuations.**

**- Total assets.**

**- Total liabilities.**

**- Net worth.**

**- Monthly income versus expenses.**

**- Money invested during a selected period.**

**- Money recovered from loans.**

**- Amounts overdue or awaiting reconciliation.**



**Use the following conceptual distinction:**



**\*\*Net worth = Assets − Liabilities\*\***



**\*\*Personal cash flow = Actual cash received − Actual cash paid during the selected period\*\*, with transfers between the user's own accounts excluded from income and expense totals.**



**These formulas must use the underlying transaction semantics. They must not double-count assets, loans, transfers, or linked records.**



**A person lending money to someone generally records an asset/receivable when a valid loan exists, not an ordinary personal expense. Repayment of principal generally reduces that receivable rather than becoming fresh income. Any actual interest or other earned amount must be recorded separately according to the applicable accounting treatment.**



**A positive net worth does not necessarily mean the user has sufficient immediately available cash. Show liquid funds and total wealth separately.**



**---**



**# 3. Complete personal income and expense management**



**Personal transactions must support more than a simple income-versus-expense form.**



**## 3.1 Personal income**



**Support configurable income types, including:**



**- Salary.**

**- Business drawings or distributions where appropriately applicable.**

**- Remuneration.**

**- Freelance or professional income.**

**- Rent received.**

**- Interest actually earned.**

**- Investment income.**

**- Dividends or distributions where supported.**

**- Refunds.**

**- Gifts received.**

**- Reimbursements.**

**- Loan proceeds received, correctly distinguished from income.**

**- Return of money previously handed to someone.**

**- Sale proceeds from personal assets.**

**- Other user-defined income or receipt categories.**



**These categories do not all have the same accounting treatment. The application must distinguish actual income from transfers, reimbursements, return of principal, borrowing, and asset realization.**



**## 3.2 Personal expenses**



**Support configurable expense categories, including:**



**- Food and groceries.**

**- Housing and rent.**

**- Electricity and utilities.**

**- Mobile and internet.**

**- Travel and transportation.**

**- Fuel.**

**- Shopping and personal purchases.**

**- Clothing.**

**- Healthcare-related expenditure.**

**- Education and learning.**

**- Entertainment and subscriptions.**

**- Home maintenance.**

**- Family expenses.**

**- Gifts and donations.**

**- Bank charges.**

**- Payment-processing fees.**

**- Interest paid.**

**- Loan charges.**

**- Personal asset maintenance.**

**- Property expenses.**

**- Professional or service charges.**

**- Other user-defined categories.**



**Categories must be editable and extensible. Do not hardcode a fixed list as the only valid classification system.**



**For every actual expense, capture the relevant details:**



**- Date.**

**- Amount and currency.**

**- Expense category.**

**- Particulars or description.**

**- Person or organization paid.**

**- Actual payer.**

**- Source account, cash location, or other funding source.**

**- Personal entity/book.**

**- Payment method.**

**- Related asset or obligation where relevant.**

**- Receipt or supporting evidence.**

**- Whether the expense is recurring.**

**- Notes and approval status if applicable.**



**Keep the person paying an expense distinct from the person or entity that economically bears it.**



**If a firm pays an owner's personal expense, do not automatically record it as an ordinary business expense. Validate whether the transaction represents reimbursement, drawings, remuneration, a personal benefit, a receivable, or another supported treatment.**



**## 3.3 Daily expense entry**



**Provide fast entry in the main personal-finance workspace.**



**Users should be able to enter a transaction in a few actions, select a custom category, choose the payment account, add a note, attach a receipt, and save.**



**Support batch entry and spreadsheet-style editing for multiple daily transactions.**



**Allow draft entry before all information is available, but do not post unsupported accounting effects.**



**## 3.4 Personal budgets**



**Where appropriate, support configurable budgets for:**



**- Monthly expenses.**

**- Individual expense categories.**

**- Household and family spending.**

**- Planned purchases.**

**- Travel.**

**- Savings goals.**

**- Investment contributions.**

**- Other user-defined financial targets.**



**Show actual spending against the configured budget and calculate differences correctly.**



**Budgets are planning records, not actual cash transactions. Creating a budget must not reduce account balances or create an expense.**



**---**



**# 4. Complete personal asset management**



**The user must be able to record personal ownership of practically relevant assets, not only money in bank accounts.**



**Supported asset categories should include, as appropriate:**



**- Cash.**

**- Bank balances.**

**- Gold.**

**- Silver.**

**- Land.**

**- Residential property.**

**- Commercial property.**

**- A house or flat.**

**- Vehicles.**

**- Phones and other electronics.**

**- Computers and equipment.**

**- Jewellery.**

**- Other physical valuables.**

**- Investments.**

**- Loans or money receivable from other people.**

**- Other user-defined asset types.**



**The same extensible asset architecture should support assets owned by businesses, with independent book and ownership context.**



**## 4.1 Asset details**



**Depending on the asset type, record:**



**- Asset name and description.**

**- Asset type/category.**

**- Actual legal or recorded owner.**

**- Personal or business entity.**

**- Ownership share, where relevant.**

**- Purchase or acquisition date.**

**- Acquisition cost.**

**- Actual purchase transaction.**

**- Current physical holder.**

**- Location.**

**- Asset identifier or safe reference.**

**- Quantity, units, weight, purity, or other applicable measurements.**

**- Current estimated value.**

**- Valuation date.**

**- Valuation method and source.**

**- Maintenance and related expenses.**

**- Insurance or other relevant recurring costs, where applicable.**

**- Supporting documents.**

**- Asset sale, transfer, exchange, and disposal history.**

**- Remaining quantity or ownership share, where applicable.**



**Do not assume the person holding an asset owns it.**



**## 4.2 Examples**



**\*\*Phone:\*\* Record the phone as an asset when that treatment is appropriate for the user's financial records. Capture its purchase amount, purchase date, owner, funding source, current estimated value if tracked, related expenses, and eventual disposal or sale.**



**The application should allow users to track lower-value personal belongings as well, even where they choose not to include them in a formal accounting balance sheet.**



**\*\*Land:\*\* Record the property identity, ownership share, acquisition cost, date acquired, supporting documents, current estimated valuation, associated liabilities, purchase/sale history, and relevant expenses.**



**\*\*Gold or silver:\*\* Track quantity, unit, purity, acquisition rate, historical cost, current estimated valuation, actual sale rate, cash proceeds, and remaining quantity.**



**Keep a recorded valuation separate from actual cash. Changes in an estimate must not be presented as cash income.**



**## 4.3 Asset purchases and disposals**



**An asset purchase must record what was acquired, how much was paid, which account funded it, and who owns the asset.**



**An asset sale must record the asset disposed of, actual quantity or ownership share, agreed sale rate where applicable, charges, consideration, actual proceeds, receivables, and resulting ownership/balance changes.**



**The entire purchase/sale history should be traceable. Do not automatically treat the total proceeds from selling an asset as profit.**



**---**



**# 5. Loans given to other people — money lent for a period**



**This is a mandatory financial workflow.**



**A user may give money to a friend, relative, business, or another person for a specific period and expect repayment.**



**Finly must distinguish this from gifting money, paying an expense, investing in a business, depositing money into an account, or entrusting cash temporarily.**



**## 5.1 Create a loan given**



**Capture:**



**- Lender.**

**- Borrower.**

**- Actual ownership of the funds before disbursement.**

**- Personal or business book.**

**- Amount lent.**

**- Currency.**

**- Date money was actually given.**

**- Actual source bank/account/cash location.**

**- Delivery method.**

**- Purpose.**

**- Agreed repayment date or schedule, if any.**

**- Interest arrangement, if any.**

**- Whether repayment is required.**

**- Supporting agreement or evidence.**

**- Guarantor or collateral details only if relevant and lawfully maintained.**

**- Status and outstanding principal.**



**A scheduled repayment date or interest rate is not proof that the money was actually disbursed. Record the agreement separately from the actual transfer.**



**If the user has only created an agreement but has not yet transferred money, show the commitment as pending rather than as an already disbursed loan asset.**



**## 5.2 Repayment tracking**



**Allow:**



**- One full repayment.**

**- Multiple partial repayments.**

**- Principal and interest recorded separately.**

**- Repayment by bank transfer or cash.**

**- Revised repayment dates where legitimately agreed.**

**- Missed or overdue payments.**

**- Extension or restructuring history.**

**- Partial waiver where valid.**

**- Full or partial reversal/correction through an audited workflow.**

**- Final settlement and closure.**



**Calculate the outstanding principal from actual disbursement and valid principal allocations.**



**Do not add principal repayments to ordinary income.**



**Record actual interest received separately and apply appropriate accounting treatment.**



**If the loan is overdue, show the outstanding amount and days/dates overdue without silently changing the contractual amount.**



**Do not automatically classify a non-repayable amount as a loan. The user must record whether a repayment obligation genuinely exists.**



**## 5.3 Money entrusted to someone versus a loan**



**Provide separate workflows for:**



**- Loan given.**

**- Temporary cash custody/handover.**

**- Reimbursement advance.**

**- Expense advance.**

**- Gift.**

**- Donation.**

**- Investment.**

**- Business capital.**

**- Other supported transfers.**



**Do not create a debt simply because the user handed money to another person.**



**If a person receives cash only to deposit it into a bank or carry it for a task, the underlying purpose and ownership should be recorded. The amount is not automatically a loan to that person.**



**---**



**# 6. Loans borrowed and other personal liabilities**



**The user must also manage money borrowed from other people and financial institutions.**



**Support:**



**- Personal loans from friends or relatives.**

**- Bank loans.**

**- Other supported borrowing arrangements.**

**- Home loans and property-linked borrowing.**

**- Vehicle financing.**

**- Business loans associated with the correct business entity.**

**- Other liabilities and contractual payment obligations.**



**Record the relevant lender, borrower, receiving account, original principal, actual disbursement, date, agreement, rate, repayment schedule, fees and charges, actual payments, remaining principal, accrued or payable interest where applicable, and supporting documents.**



**The user must be able to record partial repayments and distinguish principal from interest and fees.**



**Loan proceeds are not automatically ordinary income. Principal repayment is not automatically an expense in its entirety. The system must calculate the appropriate accounting effects for the supported transaction and entity type.**



**Do not mix the user's personal loan liability with a company's loan liability merely because the same person owns the business.**



**If a person personally guarantees a company's borrowing, represent the guarantee relationship separately where the product supports it. Do not duplicate the entire business liability in the person's personal books without a justified accounting basis.**



**Show upcoming payments and overdue obligations with their actual outstanding components.**



**---**



**# 7. Investments and capital allocation**



**Provide a complete investment register and investment activity history appropriate to the supported products.**



**Investment categories may include:**



**- Gold or silver acquired for investment.**

**- Land or property held as an investment.**

**- Shares or supported securities.**

**- Mutual funds or similar investment products where implemented.**

**- Deposits or supported interest-bearing instruments.**

**- Private business investments.**

**- Capital contributed to a business or venture.**

**- Other user-defined investment types.**



**Do not presume that every product or market connection is available. The system should still allow manual investment records with purchase date, amount, units, cost and supporting documents.**



**## 7.1 Investment transactions**



**Record the actual transaction:**



**- Investment type.**

**- Investment/asset identity.**

**- Owner and personal/business book.**

**- Acquisition date.**

**- Amount invested.**

**- Quantity or units.**

**- Price/rate and its units where applicable.**

**- Fees and charges.**

**- Funding source.**

**- Broker/counterparty or relevant institution.**

**- Current recorded quantity.**

**- Historical cost.**

**- Current estimated value and valuation date.**

**- Income/distributions received where applicable.**

**- Further purchases.**

**- Partial or full disposals.**

**- Actual proceeds.**

**- Realized gain/loss calculated using an appropriate method.**

**- Supporting evidence.**



**Allow users to distinguish realized results from changes in estimated market value.**



**Changing an estimated valuation must not create an actual cash receipt.**



**## 7.2 Money invested in a business**



**When a person transfers money into a business, Finly must determine the transaction's actual nature rather than assuming it is an investment, expense, loan, or capital contribution.**



**Support the appropriate recorded forms, such as:**



**- Equity/capital contribution.**

**- Loan to the business.**

**- Reimbursement.**

**- Expense paid on behalf of the business.**

**- Purchase of a recorded ownership interest.**

**- Another valid supported arrangement.**



**Record the source, receiving entity, amount, date, terms and supporting documentation.**



**Maintain separate personal and business books. Link relevant records without duplicating the same underlying financial movement.**



**## 7.3 Investment reporting**



**Provide summaries of:**



**- Total invested amount.**

**- Current recorded value.**

**- Net additions and withdrawals.**

**- Actual income or distributions received.**

**- Realized gain/loss.**

**- Unrealized valuation change where available.**

**- Asset quantity/units.**

**- Cash still awaiting investment.**

**- Outstanding obligations associated with an investment.**



**Clearly disclose when figures are estimated, manually entered, stale, or unsupported by a live external data source.**



**---**



**# 8. Personal accounts, funds, and money allocation**



**Finly must help users manage the entirety of their money across multiple locations and purposes.**



**Provide a clear distinction between:**



**- Accounts: where financial balances are recorded.**

**- Cash locations: where physical cash is held.**

**- Funds or allocations: how money is earmarked for a purpose.**

**- Assets: what the user owns.**

**- Liabilities: what the user owes.**

**- Receivables: what other people/entities actually owe the user.**

**- Custody: who currently holds money or assets.**

**- Investments: funds or assets acquired for an investment purpose.**



**## 8.1 Personal fund management**



**Allow users to create configurable funds or allocations such as:**



**- Daily spending.**

**- Emergency fund.**

**- Household money.**

**- Travel.**

**- Education.**

**- Upcoming bills.**

**- Savings goal.**

**- Planned purchase.**

**- Investment reserve.**

**- Other custom purposes.**



**When a user earmarks ₹10,000 for travel, Finly must not pretend that the user has spent ₹10,000 or physically moved it into another bank account.**



**Distinguish virtual budget/fund allocation from an actual transfer or asset movement.**



**If the user transfers money into a separate bank account to hold that fund, record the real transfer while preserving the fund allocation relationship as appropriate.**



**## 8.2 Transfers between personal accounts**



**Transfers between the user's own accounts must preserve the amount and reduce/increase the appropriate account balances.**



**They must not automatically count as personal income or expense.**



**Support partial transfers, transfer fees, multi-step movements, failed transactions, and relevant settlement states.**



**Prevent the same money from being counted simultaneously in source and destination as though the user has received new wealth.**



**## 8.3 Current location of money**



**Show where the user's money is currently recorded:**



**- In each bank account.**

**- In each physical cash location.**

**- Held by an identified person.**

**- In a valid clearing/in-transit state.**

**- Allocated to a purpose.**

**- Invested in a recorded asset.**

**- Used to settle an actual expense or liability.**



**An earmarked budget is not additional money. A transfer between locations does not create additional net worth.**



**---**



**# 9. Complete business accounting and firm expense management**



**Finly's business accounting features must work alongside personal financial management, with separate books and correct economic relationships.**



**Support:**



**- Business income and revenue.**

**- Sales and receipts.**

**- Purchases.**

**- Operating expenses.**

**- Employee or contractor payments where applicable.**

**- Rent.**

**- Utilities.**

**- Travel and transport.**

**- Bank charges.**

**- Payment processing charges.**

**- Interest and financing costs.**

**- Equipment and other asset purchases.**

**- Asset depreciation where supported and appropriate to the accounting model.**

**- Inventory and cost of goods sold where supported.**

**- Professional fees.**

**- Supplier payments.**

**- Customer receipts.**

**- Refunds and credit adjustments.**

**- Receivables and payables.**

**- Loans and capital movements.**

**- Inter-entity transactions.**

**- Settlement and reconciliation.**

**- Profit and loss.**

**- Balance sheet.**

**- Cash flow.**

**- Financial reports.**



**All categories must remain configurable and extensible.**



**## 9.1 Firm expense entries**



**Every business expense must record the actual economic event and relevant supporting facts, including:**



**- Date.**

**- Amount.**

**- Currency.**

**- Expense category.**

**- Purpose/particulars.**

**- Supplier or recipient.**

**- Actual payer.**

**- Source account/fund.**

**- Entity bearing the expense.**

**- Beneficiary where relevant.**

**- Related asset, transaction or project if applicable.**

**- Payment method.**

**- Receipt or invoice.**

**- Approval requirement.**

**- Actual payment and settlement status.**

**- Taxes and charges where the applicable implementation supports them.**

**- Notes and audit history.**



**The actual payer and expense-bearing entity may differ.**



**If a person personally pays a genuine business expense, record the payment source and the business expense separately, establishing a reimbursement or payable only when a real obligation exists.**



**If the firm pays an owner's personal expense, validate its actual nature. Do not automatically report it as an ordinary business expense.**



**## 9.2 Daily business transactions**



**Support quick entry for:**



**- Cash received.**

**- Customer payments.**

**- Supplier payments.**

**- Daily expenses.**

**- Bank charges.**

**- Sales.**

**- Purchases.**

**- Reimbursements.**

**- Asset acquisitions.**

**- Loans.**

**- Capital introduced.**

**- Amounts due.**

**- Amounts received against outstanding invoices or obligations.**

**- Settlements.**

**- Refunds and reversals.**



**The spreadsheet-style ledger and main-hisab workflow should be usable for these ordinary daily activities without requiring the complicated multi-bank workflow every time.**



**## 9.3 Business profit and loss**



**Produce accurate profit-and-loss statements for the selected period, entity and reporting scope.**



**The report should distinguish:**



**- Revenue and other supported income.**

**- Cost of goods sold where supported.**

**- Operating expenses.**

**- Other expenses.**

**- Interest and financing costs.**

**- Depreciation or other non-cash expenses where supported.**

**- Appropriate gains and losses.**

**- Net result according to the configured accounting rules.**



**Do not calculate profit simply as all bank deposits minus all bank withdrawals.**



**Loans received, capital contributions, transfers between accounts, asset acquisitions, repayment of loan principal, and other balance-sheet movements must not automatically be included as revenue or expense.**



**Similarly, money received from selling an asset must not automatically be treated as full profit.**



**Use actual accounting entries and the appropriate reporting basis for the supported business and transaction type.**



**## 9.4 Daily payment/receipt reports**



**Provide reports that show, for a selected day or period:**



**- Money received.**

**- Money paid.**

**- Cash and bank movements.**

**- Actual income and expenses.**

**- Outstanding receipts.**

**- Pending payments.**

**- Bank charges and fees.**

**- Asset transactions.**

**- Loans and repayments.**

**- Transfers between accounts.**

**- Other supported movements.**



**These totals must remain categorized. "Money moved", "income earned", "expense incurred", "asset acquired", and "loan principal repaid" are not interchangeable figures.**



**---**



**# 10. P\&L, BALANCE SHEET, CASH FLOW AND NET WORTH MUST AGREE**



**The application must maintain a consistent financial model that supports appropriate reports.**



**## 10.1 Profit and loss**



**Reports actual income, revenue, expenses, and other applicable results over the selected period.**



**## 10.2 Balance sheet / financial position**



**Shows the supported classification of assets, liabilities and equity or net position as applicable to the entity.**



**For a personal book, provide a suitable personal net-worth statement. For a business, use its supported accounting/reporting basis.**



**## 10.3 Cash flow**



**Shows actual cash and bank inflows/outflows categorized according to the user's needs, excluding internal transfers from income/expense calculations when appropriate.**



**## 10.4 Accounts and funds**



**Show balances by bank account, physical location, and properly defined fund/allocation.**



**## 10.5 Receivables and payables**



**Show actual outstanding amounts owed to or by the person/entity, with original records, settlement history, due dates, and status.**



**## 10.6 Assets and investments**



**Show acquisition cost, actual transaction history, and recorded estimates separately.**



**## 10.7 Cross-report integrity**



**The same underlying financial events must feed all applicable reports consistently.**



**A deposit must not count simultaneously as new income, an asset purchase, and a cash transfer unless the actual economic facts support those separate effects.**



**Do not create duplicate totals when the same event appears in a parent hisab, linked transaction, settlement view, custom ledger, or external-account view.**



**---**



**# 11. RECURRING TRANSACTIONS, FUTURE PAYMENTS AND EXPECTED RECEIPTS**



**Support scheduled and recurring records, including:**



**- Rent.**

**- Subscriptions.**

**- Salaries or recurring business payments where relevant.**

**- Loan repayments.**

**- Installments.**

**- Expected interest.**

**- Recurring contributions to a savings/investment allocation.**

**- Regular utility bills.**

**- Expected customer receipts.**

**- Recurring service charges.**

**- Other user-defined schedules.**



**Distinguish an expected/scheduled transaction from an actual transaction.**



**Creating a future payment schedule must not immediately deduct money from the account.**



**When a scheduled event becomes due, the user must be able to confirm, adjust, partially complete, skip, or cancel it according to permissions and business rules.**



**Actual transactions must be recorded with their actual dates and amounts, not silently assumed to match the schedule.**



**Handle date changes, skipped periods, partial payments, overdue items, and duplicate-generation prevention.**



**---**



**# 12. REPORTING AND USER-CUSTOMIZED DASHBOARDS**



**Use Finly's configurable ledger and formula system for personal and business reports.**



**Users may configure their own:**



**- Dashboard cards.**

**- Summary totals.**

**- Report columns.**

**- Date ranges.**

**- Groups and filters.**

**- Expense categories.**

**- Investment views.**

**- Loan-aging reports.**

**- Upcoming-payment views.**

**- Outstanding balances.**

**- Personal wealth summaries.**

**- Entity-wise P\&L.**

**- Asset summaries.**

**- Custom formula-based views.**



**Every report must respect entity access controls.**



**Custom formulas may summarize authorized data but must not bypass permissions or change authoritative financial balances.**



**---**



**# 13. MANDATORY ACCOUNTING DISTINCTIONS**



**Finly must keep the following distinctions explicit throughout personal and business finance:**



**- Money owned versus money held.**

**- Cash versus bank balance.**

**- Transfer versus income.**

**- Expense versus asset acquisition.**

**- Asset purchase cost versus estimated market value.**

**- Actual sale proceeds versus profit.**

**- Loan principal versus interest.**

**- Money lent versus an expense.**

**- Money borrowed versus income.**

**- Principal repayment versus interest expense.**

**- Earmarked funds versus money actually transferred.**

**- Scheduled payment versus actual payment.**

**- Expected receipt versus actual receipt.**

**- Personal expense versus business expense.**

**- Owner benefit versus ordinary operating expense.**

**- Capital contribution versus loan to a business.**

**- Reimbursement versus income.**

**- Receivable versus custody balance.**

**- Payable versus planned expenditure.**

**- Draft versus posted financial transaction.**

**- Clearing balance versus final settled transaction.**

**- Reported estimate versus confirmed financial result.**



**The application must validate the selected classifications against the real transaction.**



**When the purpose is unknown or conflicting, save an incomplete record or require resolution instead of manufacturing a classification.**



**---**



**# 14. SECURITY, OWNERSHIP AND ENTITY SEPARATION**



**Preserve all previously confirmed Finly authorization requirements, especially D-038:**



**- Platform administration alone must not grant access to a firm's private financial books.**

**- Firm owners require explicit entity-scoped owner roles.**

**- Exceptional support access must be authorized, limited in scope and duration, and audited.**

**- Do not silently impersonate owners or business users.**

**- Personal books and business books must remain separate.**

**- Ownership, custody, membership, partnership, platform roles and transaction permissions remain distinct.**

**- Enforce permissions in the backend/database, not just in the UI.**

**- Exports, formulas, reports, attachments, custom columns and dashboards must use authorized data only.**



**A person owning several entities must not automatically gain access to every entity merely because they are the same person.**



**Personal and business transaction links must not bypass access controls or duplicate financial movements.**



**---**



**# 15. IMPLEMENTATION INTEGRATION**



**Do not implement these additions as disconnected features.**



**Integrate them with the existing Finly modules:**



**- Opening balance and entity setup.**

**- Customizable ledger templates and functions.**

**- Main hisab and multi-entry transaction workspace.**

**- People and counterparties.**

**- Bank accounts and fund/location management.**

**- Assets and rate-based conversions.**

**- Loans and settlements.**

**- Personal income and expenses.**

**- Business accounting and P\&L.**

**- Reports and dashboards.**

**- Authentication and authorization.**

**- Audit trail and document sharing.**



**Inspect the existing database and service architecture first. Extend appropriate existing models rather than creating duplicate versions of accounts, transactions, assets, parties or settlements.**



**Make the financial operations atomic, idempotent, auditable, and safe under concurrency.**



**Use appropriate decimal precision for currency and quantity precision for assets.**



**Do not rely on Flutter-only calculations for authoritative financial effects.**



**Do not put secrets in source code, logs, APKs or documentation. Preserve the PostgreSQL 17 compatibility target and test it in the actual target environment.**



**---**



**# 16. REQUIRED TESTS**



**Add and execute tests that verify:**



**\*\*Personal money management:\*\* opening balances, bank transfers, daily expenses, income, budgets, account balances, current cash locations, personal financial summaries and net worth.**



**\*\*Asset management:\*\* phones, land, gold, silver, asset purchase cost, current estimated value, actual sale proceeds, rate/quantity arithmetic, and ownership transfers.**



**\*\*Loans:\*\* money lent, pending disbursement, multiple repayments, principal/interest separation, overdue schedules, money borrowed and remaining liabilities.**



**\*\*Investments:\*\* funding source, actual acquisition, additional purchases, distributions, partial sales, realized outcomes, valuation changes and cross-entity isolation.**



**\*\*Business accounting:\*\* correct expense categorization, sales and receipts, bank charges, outstanding invoices/obligations, profit-and-loss calculations, asset purchases, capital and loans.**



**\*\*Reports:\*\* consistent financial figures across P\&L, cash flow, balance sheet, account balances, personal net worth and outstanding reports.**



**\*\*Customization:\*\* ledger templates, custom columns/dropdowns, reusable functions and formula safety.**



**\*\*Security:\*\* D-038, entity isolation, scoped access, direct API/database permission enforcement, and restricted sharing.**



**\*\*Integrity:\*\* duplicate requests, concurrent postings, reversals, partial settlement, stale balances, exact monetary arithmetic and database transaction atomicity.**



**Do not claim a test passed unless it actually ran and passed.**



**---**



**# 17. REQUIRED EXECUTION BEHAVIOUR**



**1. Inspect the existing repository and determine what has already been implemented.**

**2. Add this personal-finance and whole-money-management specification to the existing Finly requirements and implementation checklist.**

**3. Identify dependencies and implement missing functionality in a logical order.**

**4. Reuse the existing ledger, asset, transaction, party, bank-account, and settlement systems where appropriate.**

**5. Implement the backend and database rules before relying on UI behaviour.**

**6. Integrate the real functionality into Flutter.**

**7. Test calculations, accounting classifications, account balances, security and end-to-end workflows.**

**8. Fix failures and rerun the relevant tests.**

**9. Update documentation and maintain an accurate continuation checklist.**

**10. Report actual completion, test evidence, unresolved issues and genuine external blockers.**



**\*\*Do not stop after writing a plan or creating a few screens. Implement the complete achievable functionality directly in the current Finly project.\*\***



**# FINAL PRODUCT GOAL**



**Finly must give the user a complete view of their financial life:**



**\*\*Personal cash + bank accounts + daily expenses + income + personal funds + assets + liabilities + loans given + loans taken + investments + property + gold/silver + money held by others + future payments + outstanding receipts + all businesses + firm expenses + revenue + profit/loss + settlements + complete transaction history.\*\***



**Every amount must retain its real meaning. Every asset must have a traceable history. Every loan must track its actual obligation. Every expense must affect the correct book. Every business must have its own reliable accounts. Every customizable ledger must remain secure and financially consistent.**



**\*\*Build this as one integrated Finly system, not as a collection of disconnected finance screens.\*\***

