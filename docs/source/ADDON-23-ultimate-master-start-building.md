# ADDON-23 — Ultimate master add-on: complete finance management app, start building

Received 2026-10-10 as a message ending "Contiue", after the session report on the API deployment. It re-opens the
scope frozen by D-041 (see D-047). Recorded verbatim below the line.

---

FINLY — ULTIMATE MASTER ADD-ON PROMPT
Complete Finance Management Mobile App — Start Actual Development and Coding Immediately
PRIMARY DIRECTIVE: STOP PLANNING. START BUILDING.
Start actual development of the complete Finly Finance Management App immediately using Flutter. Inspect the existing project, understand its current implementation, and directly start writing, modifying, integrating, running, and testing the actual application code.
My objective is a complete, professional, production-ready financial management application that I can install on my phone, use with real financial data, and deploy. I need the complete working product, not a prototype, UI demo, design concept, basic MVP, incomplete codebase, or another development plan.
Implement every agreed feature, every required screen, every backend operation, every accounting rule, every database relationship, and every critical user workflow. Continue coding, integrating, testing, debugging, and building until the application is complete to the extent technically possible.
Do not stop after explaining what you will build. Execute the work directly in the existing project.
1. Complete Personal and Business Finance Management
Finly must manage my entire financial life in one connected system, covering personal finances, family finances where authorized, and business finances.
Implement complete tracking and management of:

* Personal and business income, expenses, savings, and available funds.
* Cash in hand, bank accounts, wallets, and other financial accounts.
* Funds received, funds paid, money transferred, and money held temporarily.
* Money lent to individuals, family members, businesses, or other parties.
* Money borrowed from individuals, banks, NBFCs, financial institutions, and businesses.
* Loans taken by my own firm and loans taken personally.
* Loans given by my firm and loans given personally.
* Investments, deposits, securities, and other financial assets.
* Land, properties, jewellery, gold, silver, vehicles, equipment, and other valuable assets.
* Credit cards, overdrafts, unpaid bills, outstanding liabilities, and financial obligations.
* Accounts receivable, accounts payable, advances, deposits, and prepayments.
* Interest earned, interest paid, principal repayments, installments, overdue amounts, and maturity dates.
* Business capital, personal capital, owner withdrawals, drawings, retained earnings, and applicable profit allocations.
* All other legitimate financial inflows, outflows, transfers, assets, liabilities, and commitments.

Every amount must have a clear classification and traceable transaction history. I must be able to understand where all my money is, what I own, what I owe, who owes me, where my money went, and how my total financial position changes over time.
2. Complete Accounting Engine
Implement a proper accounting engine rather than simply storing transaction descriptions and amounts.
Support double-entry bookkeeping, with an appropriate chart of accounts and account classifications for assets, liabilities, equity or capital, income, expenses, receivables, payables, loans, investments, and other required categories.
Implement:

* Journal entries with debit and credit lines.
* General ledger and individual account ledgers.
* Party-wise ledgers and account-wise transaction histories.
* Opening balances, closing balances, and balance-forward calculations.
* Trial balance and balance-sheet generation.
* Profit and loss statements and income and expenditure reports.
* Cash flow statements and cash and bank summaries.
* Receivables, payables, loan outstanding, asset, and liability reports.
* Account reconciliation and discrepancy detection.
* Proper accounting dates, transaction dates, due dates, settlement dates, and financial periods.
* Reversals, corrections, adjustments, and audit history.
* Appropriate treatment of transfers, asset purchases, loan principal, loan interest, investment movements, and capital contributions.
* Financial period closing and reliable historical reporting.

Mandatory accounting rules:

1. Every posted journal entry must balance: total debits must equal total credits.
2. Transfers between accounts must not be incorrectly counted as income or expenses.
3. Loan principal repayment must be distinguished from interest expense.
4. Money lent must be recorded as a receivable or other appropriate asset, not automatically as an expense.
5. Money borrowed must be recorded as a liability, not automatically as income.
6. Asset purchases must be classified correctly and must not automatically be treated as ordinary expenses.
7. Investment purchases and sales must be represented correctly without double-counting the underlying cash movement.
8. Outstanding amounts must reconcile with the underlying posted transactions.
9. Corrections must retain sufficient history to trace what changed and why.
10. Reports must be calculated from the underlying accounting records, not from manually maintained totals.

Implement accounting logic centrally, validate all critical rules automatically, and create automated tests for the calculations.
3. Complete Loan and Lending Management
Build a dedicated loan management module covering money I lend, money I borrow, personal loans, business loans, and loans taken by any of my firms.
Each loan record should support the applicable fields:

* Lender, borrower, counterparty, and account ownership.
* Original principal amount and disbursement date.
* Principal outstanding and repayment history.
* Interest rate, interest type, calculation method, and applicable period.
* Simple or compound interest when appropriate and explicitly configured.
* Installment amount, frequency, due dates, and payment schedule.
* Partial payments, early repayments, late payments, and overdue amounts.
* Fees, penalties, applicable charges, and adjustments.
* Maturity date, security or collateral details, and supporting documents.
* Loan status, reminders, and settlement details.

Distinguish the principal from interest, show how every outstanding balance was calculated, and support loans without interest or without a fixed repayment schedule.
Provide a transaction timeline, printable or shareable statements, upcoming payment reminders, overdue reports, and reconciliation between expected and actual balances.
4. Complete Asset, Liability and Net Worth Management
Build an asset and liability register that connects financial records to the accounting engine.
Support cash, bank balances, receivables, investments, properties, land, precious metals, jewellery, vehicles, equipment, deposits, personal loans given, business assets, credit obligations, borrowings, payables, and other relevant categories.
Store purchase or acquisition value, acquisition date, ownership, linked account, supporting documents, disposal or settlement information, and current estimated value when applicable.
Where required, support asset valuation history, depreciation, appreciation, disposal gains or losses, and revaluation adjustments with appropriate accounting treatment.
Calculate net worth from correctly classified assets and liabilities, show its historical changes, and distinguish recorded book value from user-provided market estimates. Prevent the same asset or liability from being counted twice.
5. Bank Statement PDF and File Import
Implement actual bank statement import functionality.
Users must be able to upload bank statement PDFs and supported CSV or Excel files from their devices. The application must parse the available data and display extracted transactions in a review screen before posting them.
Implement:

* Extraction of transaction dates, descriptions, reference numbers, debit amounts, credit amounts, and balances when present.
* Recognition of opening balance, closing balance, and statement period when available.
* Support for appropriate text-based and scanned PDFs where technically feasible, using OCR when required.
* Statement preview and extraction confidence or validation warnings.
* Editable transaction details before import.
* Suggestions for linked bank accounts, counterparties, existing ledgers, and categories.
* Duplicate detection based on appropriate transaction identifiers and matching rules.
* Reconciliation of imported entries with existing transactions.
* Detection of missing, inconsistent, or incorrectly extracted values.
* Import summaries showing accepted, skipped, duplicated, and rejected entries.
* Clear error handling for encrypted, corrupted, unsupported, or partially readable files.

Never silently post unverified transactions. Preserve the source file or appropriate import reference when permitted, and maintain an auditable record of the import and its results.
Imported entries must integrate with the same accounting engine used by manually entered transactions.
6. Complete Transaction and Ledger Management
Implement a universal transaction-entry system with forms appropriate to transaction type.
Support income, expenses, transfers, journal entries, loans given, loans received, repayments, interest, investments, asset purchases, asset disposals, advances, deposits, receivables, payables, capital contributions, drawings, and other relevant financial events.
Every applicable transaction must be linked to the relevant accounts, parties, date, amount, payment method, reference, notes, attachments, and accounting entries.
Support editing, deletion or reversal according to posting status and authorization rules. Financial records must never be silently altered or permanently removed in ways that break historical reporting or auditability.
Include global search, filters, date ranges, party-wise views, account-wise views, transaction categories, reconciliation status, attachments, and a complete transaction detail page.
7. Complete Dashboard, Analytics and Reporting
Implement interactive financial dashboards based on real database records.
Provide:

* Total assets, total liabilities, and net worth.
* Total available cash and bank balances.
* Income and expense summaries.
* Personal versus business financial summaries.
* Money lent and borrowed, with outstanding balances.
* Investment summaries and asset valuations.
* Receivables, payables, overdue amounts, and upcoming obligations.
* Monthly, quarterly, and annual financial trends.
* Account-wise and party-wise breakdowns.
* Cash flow analysis and account reconciliation status.
* Transaction search, audit history, and financial report exports.

Every figure and chart must be connected to real calculations and live application data. Filtering a report must update the appropriate totals. Avoid hardcoded dashboard figures and decorative charts that do not reflect actual records.
8. Receipts, Attachments, PDF Reports and WhatsApp Sharing
Implement real document generation and sharing.
Support receipts, transaction vouchers, party-wise ledger statements, loan statements, account statements, financial summaries, and reports in appropriate formats.
Provide PDF, CSV, and spreadsheet exports where appropriate. Implement device-native sharing so users can share selected receipts, statements, reports, or summaries through WhatsApp and other installed apps.
Support photos and relevant document attachments for transactions, loans, assets, and counterparties. Compress images appropriately and manage file access securely.
Before sharing, make sure the user can verify the document and that it contains only the selected information, without accidentally exposing unrelated private financial records.
9. Complete Flutter Mobile App and UI/UX
Build and integrate all necessary screens, navigation, forms, dashboards, list views, detail pages, settings, and reports.
The app must look and behave like a polished, professional finance product. Use a consistent design system, intuitive navigation, readable financial tables, clear amounts and currency formatting, responsive layouts, and accessible controls.
Implement:

* Login, activation, recovery, and profile setup.
* Dashboard and navigation.
* Accounts, chart of accounts, and account ledgers.
* Transactions, journal entries, and party ledgers.
* Income, expenses, transfers, and financial categories.
* Loan management, repayments, and schedules.
* Assets, liabilities, and net worth.
* Bank statement import and reconciliation.
* Reports, attachments, exports, and sharing.
* User and role management.
* Audit logs, security settings, notifications, and app settings.

Every visible action must work. Implement real validation, loading indicators, success and error feedback, empty states, pagination or appropriate list-loading behavior, confirmation for sensitive actions, and recovery from failed operations.
Support English, Hindi, and Gujarati where applicable, with clean language switching and consistent formatting. Do not leave broken navigation, decorative buttons, placeholder forms, or incomplete workflows.
10. Superadmin, Users and Existing Financial Books
Implement the previously agreed account creation and security process.
The Superadmin may create or invite accounts, issue temporary activation credentials, manage account status, and perform authorized administrative operations.
For a user who already has financial books in Finly, preserve the existing records, ownership, historical entries, and relationships. Link or migrate those books to the correct account without duplicates or accidental reassignment.
The account owner must activate the account, establish their own permanent credentials, and control their own identity.
Enforce the following:

* The Superadmin must not be able to retrieve a user's permanent password or PIN.
* The Superadmin must not silently impersonate a user or perform actions under the user's identity.
* Account creation does not automatically grant unrestricted access to private financial records.
* Administrative access must be separated from financial-data access through explicit permissions.
* Any exceptional support access must follow an appropriately authorized, restricted, time-limited, and auditable process.
* Record the actual actor, action, time, reason where applicable, and relevant details.
* Keep Superadmin actions distinct from actions performed by the account owner.
* Enforce role-based access on the backend, not merely by hiding buttons in the mobile UI.
* Isolate user and tenant data so unauthorized users cannot read or modify another user's records.

Implement account recovery and administrative support without requiring the Superadmin to know or control the user's permanent credentials.
11. Offline-First Operation and Synchronization
Implement a reliable offline-capable architecture appropriate for the application's workflows.
Support local persistence for permitted operations, an explicit synchronization status, and reliable synchronization when internet access returns.
Handle failed requests, retries, duplicate submissions, interrupted uploads, concurrent edits, synchronization conflicts, and application restarts without losing valid financial entries.
Use stable transaction identifiers, suitable idempotency controls, database constraints, and a clearly defined conflict-resolution strategy.
Make it clear when a record is saved locally versus confirmed by the backend. Never display unsynchronized data as successfully synchronized when it has not been.
Protect sensitive local data appropriately and implement backup, restoration, schema migration, and data integrity checks.
12. Backend, Database and Software Architecture
Inspect the existing codebase, its configured backend, database, packages, authentication, storage, and integrations before deciding what must change.
Preserve working components and build on the existing architecture wherever feasible. Avoid unnecessary rewrites that could lose working functionality or existing financial data.
Implement the complete backend and data layer required by the agreed features, including:

* Database schema and relationships.
* Migrations and safe schema upgrades.
* Authentication and authorization.
* Account and tenant isolation.
* Transaction posting and accounting calculations.
* Server-side validation and database constraints.
* Document uploads and secure storage.
* Reporting and export operations.
* Audit logs.
* Error handling, logging, and operational diagnostics.
* Reliable handling of concurrent operations.
* Environment configuration and secure secret management.

Choose technology appropriate to the existing project rather than introducing unnecessary frameworks or services.
Never assume that a screen is functional because it displays sample data. Connect every implemented feature to its actual service, database, and business logic.
13. Security, Privacy and Data Integrity
Treat all financial information as sensitive.
Implement secure password handling, appropriate session management, protected API access, least-privilege authorization, server-side permission checks, secure document access, input validation, and protection against unauthorized data access and manipulation.
Use established cryptographic and authentication libraries. Never hardcode production passwords, API secrets, private keys, or service credentials in source code.
Create an audit trail for important financial and administrative operations. Protect the integrity of posted transactions, accounting history, and balances.
Implement safe backups and test restoring the data. Include appropriate safeguards for financial data export, account deletion, account recovery, and sensitive administrative actions.
Do not claim legal, regulatory, or security certification unless it has actually been independently verified. Identify any jurisdiction-specific compliance requirements that remain to be reviewed before commercial production deployment.
14. Testing, Debugging and Real Verification
Write and run tests throughout development.
At a minimum, test:

* Accounting debit-credit balancing and posting.
* Income, expenses, transfers, loans, interest, repayments, assets, and liabilities.
* Correct running balances and net worth calculations.
* Opening and closing balances, date ranges, and report accuracy.
* Bank statement extraction, duplicate detection, import review, and reconciliation.
* Database migrations and existing-data preservation.
* Authentication, account activation, and password recovery.
* Superadmin permissions and user data isolation.
* Unauthorized API requests and cross-account access attempts.
* Offline transactions, synchronization, retries, and conflict resolution.
* PDF generation, exports, attachments, and sharing flows.
* Form validation, errors, navigation, and other critical mobile workflows.
* Android builds and release configuration.

Fix actual errors in the code and rerun the relevant tests. Do not suppress errors merely to obtain a successful build.
Report honestly which tests ran, what passed, what failed, and which external dependencies remain unresolved.
15. Android Build and Production Deployment
Produce an installable, release-ready Android APK and configure the application for proper deployment.
Complete the applicable steps:

1. Resolve code, dependency, compilation, and static-analysis errors.
2. Configure development and production environments.
3. Configure the backend, database, permissions, and storage.
4. Supply safe environment-variable and secret-configuration guidance.
5. Run automated tests and critical end-to-end workflows.
6. Build the Android release APK.
7. Install and verify the APK where the available environment permits.
8. Document first-time setup, account creation, backend deployment, data migration, backup restoration, and release procedures.
9. Explain how to create a signed production build and prepare the application for Google Play or other required distribution channels.
10. Identify any required third-party credentials, service subscriptions, signing keys, or deployment permissions that must be supplied externally.

Do not report deployment as complete if the application has only been compiled locally. Distinguish a successful build from a verified installation and a live production deployment.
16. Mandatory Development Execution Rules
START CODING IMMEDIATELY.

* Inspect the real project files and current implementation first.
* Begin editing and implementing the actual code in the current project.
* Use the existing application state, available tools, and established architecture.
* Work module by module, integrating actual functionality rather than generating disconnected code.
* Create missing files and services, modify existing code, run commands and tests where available, and fix discovered problems.
* Maintain a practical implementation checklist and track incomplete requirements.
* Prioritize the core accounting engine, reliable persistence, financial correctness, authentication, and data security before cosmetic refinements.
* Do not stop at the login screen, dashboard, database design, API plan, or initial scaffolding.
* Do not replace missing functionality with fake transactions, mock API responses, static balances, nonfunctional buttons, or placeholder screens.
* Do not ask for approval at every development stage. Make reasonable engineering decisions and continue.
* If a required service, credential, permission, or tool is unavailable, complete the independent work and document the specific blocker. Do not fabricate credentials, external access, successful builds, or test results.
* Preserve existing financial data and working functionality during modifications.
* Keep testing and correcting the actual implementation until the requested features are completed or a genuine technical or external blocker prevents further progress.

17. Final Definition of Done
Finly is not complete merely because the code compiles or the UI looks attractive.
The application must have its required mobile screens, working financial logic, connected backend, reliable database, complete accounting operations, loan and asset management, bank statement import, accurate reports, appropriate permissions, data protection, error handling, and tested core workflows.
The Android application must be buildable and installable. Required external setup must be documented, and every remaining limitation must be disclosed clearly.
FINAL OBJECTIVE: Deliver a complete, genuinely working, production-grade Finly finance management application that I can install, configure, use with real financial data, and deploy. Implement every agreed feature, start actual development and coding immediately, and continue building, integrating, testing, and fixing until all achievable work is complete. Do not stop at plans or promises—work directly on the application and verify the results.
