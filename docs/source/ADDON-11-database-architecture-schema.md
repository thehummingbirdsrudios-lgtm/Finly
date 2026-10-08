# ADDON-11 — Database architecture and schema

Received 2026-10-08, recorded verbatim. The owner sent the master prompt followed by two add-ons in one message.

---

FINLY — DATABASE ARCHITECTURE & SCHEMA MASTER PROMPT
You are acting as a Principal Database Architect + Financial Systems Architect + Senior Software Architect + PostgreSQL Expert + Security Architect + Performance Engineer.
Your job is to design the complete production-grade database architecture and schema for Finly.
The database is the core foundation of the entire Finly system. Do not treat it as simple CRUD storage.
1. SOURCE OF TRUTH
Before designing anything:

1. Read the complete Finly Master Prompt.
2. Read ALL provided MD documentation.
3. Read the finance/accounting rules.
4. Read the edge-case documentation.
5. Understand the complete business/domain model.
6. Identify every entity, relationship, dependency, financial rule, permission rule, security rule, workflow, and data lifecycle requirement.

Do not invent business rules that conflict with the provided requirements.
Where something is genuinely undefined, identify it as an open decision instead of silently assuming.
2. DATABASE TECHNOLOGY
Use PostgreSQL/Supabase as the primary database direction, unless technical evaluation proves another genuinely free solution is substantially better.
Design the database using professional PostgreSQL/database engineering practices.
The database must support:
Android now → iOS later → Web later
All clients must use the same authoritative backend/database/business rules.
3. DESIGN THE COMPLETE DOMAIN MODEL
Identify and properly model every required concept.
At minimum evaluate:
Identity & Security

* Users
* Profiles
* Roles
* Permissions
* Role permissions
* User permissions
* Devices
* Sessions
* Authentication/security events
* MFA/security configuration
* M-PIN/biometric-related state where appropriate
* Login history

Organizations & Entities

* Firms/companies
* People
* Owners
* Workers
* Partners
* Customers
* Vendors
* Other configurable entities
* Entity relationships

Financial Structure

* Funds
* Accounts
* Account types
* Banks
* Wallets
* Cash
* Physical locations
* Tijori/vault
* Ownership
* Custody
* Authorized access
* Current holder/key controller

Keep these concepts separate where required:
Ownership ≠ Fund ≠ Account ≠ Physical Location ≠ Holder ≠ Access
Transactions

* Master transactions
* Ledger entries
* Transfers
* Expenses
* Income
* Deposits
* Withdrawals
* Handovers
* Reimbursements
* Advances
* Adjustments
* Reversals
* Corrections
* Inter-company transactions
* Settlements
* Approvals

Expenses
Support:
Personal Expense
Firm Expense
Common Expense
Any registered entity as expense owner
Always be able to distinguish:
Who paid / whose money was used
from:
Who the expense belongs to
One expense may have multiple allocations.
Example:
₹45,000:

* Firm A → ₹30,000
* Firm B → ₹5,000
* Personal → ₹10,000

The allocation must support exact manually entered amounts.
Do not assume equal splitting.
Outstanding & Settlement
Model:

* Receivables
* Payables
* Reimbursements
* Advances
* Amounts owed
* Inter-company balances
* Settlement records
* Remaining/outstanding amounts

Accounting
Support:

* Double-entry accounting where applicable
* Debit/Credit
* Journal/ledger
* Assets
* Liabilities
* Receivables
* Payables
* Expenses
* Income
* Owner withdrawals
* Advances
* Reimbursements
* Adjustments
* Reversals
* Corrections
* Period closing
* Opening/closing balances

The database must preserve accounting integrity.
4. FINANCIAL INTEGRITY
Never design financial tables as independent CRUD records.
Financial operations must maintain consistent relationships between:
Transaction → Ledger → Fund → Account → Ownership → Expense Allocation → Outstanding → Settlement → Reconciliation → Reports → Audit
Critical financial changes must be atomic.
A failed operation must not leave:

* Source updated but destination not updated
* Ledger updated but balance not updated
* Fund updated but transaction missing
* Allocation totals inconsistent
* Outstanding incorrect
* Partial reversal
* Broken relationships

Use proper ACID transactions, constraints, locking/concurrency strategy, idempotency, and transactional boundaries.
5. FLOW / IMPACT MODEL
For every important financial record, identify its possible downstream effects.
Use:
CREATE → VALIDATE → DEPENDENCY CHECK → IMPACT ANALYSIS → CONFLICT CHECK → POST → LEDGER EFFECT → BALANCE EFFECT → FUND EFFECT → OUTSTANDING EFFECT → REPORT EFFECT → AUDIT
For:

* Edit
* Reverse
* Correct
* Reallocate
* Change ownership
* Change account
* Change fund
* Settlement
* Reconciliation

the database architecture must support consistent propagation.
Never silently modify dependent financial history.
6. DATABASE NORMALIZATION
Apply professional normalization principles.
Avoid:

* duplicated facts
* conflicting sources of truth
* unnecessary repeated data
* inconsistent relationships
* update anomalies
* delete anomalies

But do not blindly normalize everything.
Where performance requires controlled denormalization, document:
WHY → WHAT → SOURCE OF TRUTH → HOW IT STAYS CONSISTENT
Never introduce denormalization without a clear reason.
7. COMPLETE ERD
Create a complete Entity Relationship Diagram.
Show:

* Every major table
* Primary keys
* Foreign keys
* One-to-one relationships
* One-to-many relationships
* Many-to-many relationships
* Junction tables
* Optional relationships
* Required relationships
* Ownership relationships
* Financial relationships
* Audit relationships

The ERD must explain the actual architecture, not merely show table names.
8. PRIMARY & FOREIGN KEYS
Use professional key strategy.
For every table define:

* Primary key
* Foreign keys
* Unique constraints
* Required/nullable fields
* Referential actions
* Natural/business identifiers where required
* Internal stable identifiers

Do not use display names as database identity.
Names such as:
Mint, JSK, Krish, Tijori
must remain editable business data, not hard-coded database identity.
9. CONSTRAINTS
Use database-level constraints wherever appropriate.
Examples:

* NOT NULL
* UNIQUE
* CHECK
* FOREIGN KEY
* Referential integrity
* Valid status transitions where enforceable
* Amount validation
* Allocation totals
* Date/time consistency
* Positive/negative amount rules
* Currency consistency
* Ownership relationships
* Valid transaction relationships

Do not rely only on Flutter validation.
10. MONEY & NUMERIC TYPES
Never use inappropriate floating-point types for financial amounts.
Choose appropriate exact numeric/decimal representation.
Define:

* Currency
* Precision
* Scale
* Rounding rules
* Allocation rules
* Exchange-rate handling if required

All financial calculations must remain deterministic and auditable.
11. INDEX STRATEGY
Do not create random indexes.
First identify real Finly query patterns:

* Global search
* Transaction search
* User search
* Company filtering
* Fund filtering
* Account filtering
* Date filtering
* Amount filtering
* Outstanding
* Reports
* Dashboard
* Reconciliation
* Audit
* Permission checks
* Mobile synchronization
* Notifications
* Sharing history

Then design:
single-column indexes + composite indexes + partial indexes + unique indexes
where justified.
For every important index document:
QUERY → INDEX → EXPECTED BENEFIT
Avoid excessive indexes because they increase storage and write cost.
Use query-plan analysis where possible.
12. PERFORMANCE ARCHITECTURE
Design for fast real-world usage.
Optimize:

* Query performance
* Joins
* Indexes
* Pagination
* Filtering
* Sorting
* Search
* API payload size
* Selective field retrieval
* Aggregations
* Dashboard queries
* Reports
* Mobile synchronization

Avoid loading huge datasets into the mobile application.
Use server-side filtering, sorting and pagination.
Design efficient database views/materialized views only where genuinely useful and document their refresh/consistency model.
13. CONCURRENCY
Finly may have multiple users operating simultaneously.
Handle:

* Concurrent transactions
* Same account updates
* Same fund updates
* Duplicate requests
* Double submission
* Stale data
* Race conditions
* Simultaneous edits
* Reconciliation conflicts

Use appropriate:
transactions + row locking/optimistic concurrency + versioning + idempotency
where required.
Never allow concurrent operations to corrupt financial balances.
14. SECURITY & RLS
Security must exist at the database/backend level.
Design:

* Row Level Security
* Authorization boundaries
* User/resource relationships
* Firm access
* Fund access
* Account access
* Confidential records
* Owner-only records
* Personal finance privacy
* Admin access
* Super Admin access

Frontend hiding is not security.
Every query must return only data the authenticated user is authorized to access.
Prevent indirect leakage through:

* totals
* counts
* search
* autocomplete
* reports
* charts
* notifications
* exports
* sharing
* aggregates

15. PERSONAL FINANCE PRIVACY
Personal finance must be private by default.
Model permissions so:
Owner → controls own personal finance
and other users cannot automatically access:

* balances
* transactions
* funds
* reports
* search results
* personal details

unless explicitly authorized.
Company access must never automatically grant personal-finance access.
16. AUDIT ARCHITECTURE
Create proper audit structures for sensitive operations.
Track where appropriate:

* Who
* What
* When
* Before
* After
* Reason
* Device/session
* IP/security metadata where appropriate
* Related transaction
* Related approval
* Related share
* Related reversal/correction

Financial history must be traceable.
Do not silently overwrite important historical financial data.
17. STATUS & LIFECYCLE DESIGN
Do not use uncontrolled text statuses everywhere.
Design appropriate:

* status models
* state transitions
* lifecycle rules
* archival rules

Financial records should support states such as:
Draft → Validating → Pending Approval → Approved → Posting → Posted
and where applicable:
Rejected → Failed → Cancelled → Reversed → Corrected
Never delete important posted financial history destructively.
18. SOFT DELETE / ARCHIVING
For referenced master data, prefer:
Active → Inactive → Archived
rather than destructive deletion.
Do not allow deleting data that would break financial history.
Define deletion policies table-by-table.
19. PERIOD CLOSING
Support monthly accounting periods.
Model:

* Accounting period
* Opening balance
* Closing balance
* Closing entries
* Period status
* Locked period
* Reopening authorization if required

Once a financial period is closed, prevent unsafe historical modification.
20. OFFLINE & SYNC
The mobile application may operate with unreliable connectivity.
Design the backend/database model to support safe:
Local → Pending Sync → Server Validation → Commit → Sync Result
Handle:

* duplicate requests
* retry
* conflict
* stale data
* failed sync
* partial connectivity
* authorization changes while offline

Offline mode must never bypass server-side financial validation.
21. FILES & PROOF
Design secure relationships for:

* Receipts
* Generated photo proof
* PDF
* Secure PDF
* Secure viewer
* Attachments
* Share records

Do not store unnecessary sensitive file data directly inside relational tables.
Use secure object storage with authorization and controlled access.
22. SHARING
Model:

* Share request
* Recipient
* Recipient verification
* Share profile
* Visible fields
* Security settings
* Expiry
* Revocation
* Verification
* Final confirmation
* Share audit

The database must support the required secure sharing workflow.
23. CONFIGURATION / MASTER DATA
The system must be configurable.
Do not hard-code:

* Firms
* People
* Roles
* Expense types
* Transaction types
* Funds
* Accounts
* Locations
* Categories
* Tags
* Statuses
* Confidentiality levels
* Workflows
* Approval rules
* Share profiles

Use stable IDs and configurable master tables where appropriate.
24. MIGRATIONS
All schema changes must use version-controlled migrations.
Never:

* manually change production schema without migration
* drop tables casually
* destroy financial data
* rewrite history
* make irreversible migrations without backup/rollback planning

Every migration must be:
reviewable + testable + reproducible + documented
25. BACKUP & RECOVERY
Design for:

* automated backups
* encrypted backups
* backup integrity
* retention
* recovery testing
* disaster recovery
* migration failure recovery
* accidental deletion recovery
* database corruption recovery

Backups must not depend on storing encryption keys inside the same database.
26. DATA DICTIONARY
For every important table create documentation containing:
Table purpose
Column
Type
Nullable
Default
Meaning
Source of truth
Foreign key
Constraint
Security sensitivity
Index
Lifecycle
Make the documentation understandable to future developers.
27. DATABASE DIAGRAMS
Produce:
Level 1 — System Architecture
Client → API/Backend → Database → Storage → Backup
Level 2 — Domain ERD
Major business entities and relationships.
Level 3 — Financial ERD
Transactions → Ledger → Funds → Accounts → Ownership → Allocations → Outstanding → Settlement.
Level 4 — Security ERD
Users → Roles → Permissions → Resources → Sessions → Devices → Audit.
Level 5 — Sharing ERD
Transaction/Report → Share → Recipient → Verification → Security → Expiry/Revocation → Audit.
Level 6 — Detailed Schema
Every table and relationship.
28. TEST THE DATABASE DESIGN BEFORE APPROVAL
Before finalizing the schema, simulate realistic scenarios including:

* ₹50,000 transfer
* insufficient balance
* reserved funds
* firm-to-firm transfer
* personal expense
* firm expense
* common expense
* ₹45,000 multi-entity allocation
* firm money → another firm's expense
* firm money → personal expense
* handover
* custody change
* location access change
* reimbursement
* advance
* settlement
* reversal
* correction
* reconciliation difference
* monthly closing
* concurrent transactions
* duplicate transaction
* offline sync
* permission denial
* personal-data privacy
* secure sharing
* archived firm/account/fund
* failed transaction
* partial failure

Verify that the schema can represent each case without hacks or inconsistent data.
29. DATABASE REVIEW CHECKLIST
Before implementation approval, verify:
Correct?
Normalized appropriately?
Fast?
Secure?
Auditable?
ACID-safe?
Concurrency-safe?
Mobile-friendly?
Scalable?
Migration-safe?
Backup-safe?
Future iOS/Web ready?
Edge cases covered?
Financially correct?
No duplicate source of truth?
No unnecessary complexity?
30. REQUIRED OUTPUT BEFORE CODING
Do not immediately start creating random tables.
First produce:

1. Database Architecture Document
2. Complete ERD
3. Table List
4. Detailed Schema
5. Data Dictionary
6. Relationship Map
7. Financial Ledger Model
8. Index Strategy
9. Security/RLS Model
10. Transaction & Concurrency Strategy
11. Migration Strategy
12. Backup/Recovery Strategy
13. Offline/Sync Data Strategy
14. Database Edge-Case Matrix
15. Query/Performance Strategy
16. Open Questions / Decisions Required

Then review the architecture against the Master Prompt + MD documentation.
Only after the design is internally consistent should you generate the actual PostgreSQL/Supabase migrations and database implementation.
FINAL RULE
DO NOT DESIGN THE DATABASE AS A SIMPLE STORAGE LAYER.
Design it as the authoritative financial and business data foundation of Finly.
The database must be:
CORRECT + FAST + SECURE + CONSISTENT + AUDITABLE + SCALABLE + MAINTAINABLE + FINANCIALLY SOUND + PRODUCTION-READY.
Understand first. Model completely. Validate the architecture. Then implement.

---

**ADD-ON — COMPLETE DATABASE ARCHITECTURE & ERD FIRST**

Treat the **database as the core foundation of Finly**.

Before building the application features, act as a **senior database architect + software architect + financial systems architect** and design the complete production database from the **Master Prompt + all MD documentation**.

Create the **full database architecture and complete ERD/relationship diagram**, not just a list of tables.

Clearly define:

**Entities → Tables → Primary Keys → Foreign Keys → Relationships → Cardinality → Constraints → Indexes → Composite Indexes → Transactions → Audit History → Security/RLS → Data Lifecycle → Migrations**

Model every required Finly concept, including:

**Users, Roles, Permissions, Firms, Entities, Funds, Accounts, Locations, Ownership, Custody, Holders, Transactions, Ledger Entries, Expenses, Expense Allocations, Outstanding, Receivables, Payables, Reimbursements, Advances, Settlements, Approvals, Reconciliation, Reports, Sharing, Security, Notifications, Configuration, Master Data, Audit Logs, Sessions, Devices, and all required relationships.**

Apply professional database and software-engineering principles:

**normalization + correct denormalization where performance requires it + data integrity + referential integrity + constraints + ACID transactions + concurrency control + idempotency + least privilege + RLS/authorization + auditability + migration safety + backup/recovery + scalability + maintainability.**

Design indexes from **actual Finly search, filter, sort, dashboard, report, transaction, and mobile API query patterns**. Optimize for **very fast reads without unnecessarily slowing writes**.

Financial data must remain **atomically consistent**. No transaction may leave balances, ledger entries, fund allocations, ownership, outstanding, or related records partially updated.

Also design:

**API-friendly query structure + pagination + selective loading + efficient joins + caching strategy + offline/sync support + archival strategy + secure sensitive-data handling**

Generate and maintain:

**ERD/Database Diagram + Schema Documentation + Data Dictionary + Migration Files + Index Strategy + Security/RLS Design + Seed/Initial Data Design + Database Rules**

Do not create the schema blindly. First:

**UNDERSTAND MASTER PROMPT → UNDERSTAND MD RULES → IDENTIFY ENTITIES → MODEL RELATIONSHIPS → DESIGN ERD → ANALYZE QUERIES → DESIGN INDEXES → DESIGN SECURITY → DESIGN TRANSACTIONS → REVIEW FOR EDGE CASES → IMPLEMENT → TEST → BENCHMARK → OPTIMIZE**

The database must be **secure, financially correct, highly performant, maintainable, production-grade, and ready for Android now plus future iOS/Web clients**.

**Get the database structure and architecture right before building dependent features.**

---

**ADD-ON — PRODUCTION-READY DATABASE SCHEMA**

Design the database schema **exactly according to the complete Finly system design, Master Prompt, accounting rules, security rules, and edge cases**.

Build it like a **principal database architect**: correct relationships, normalized structure, proper constraints, exact financial data types, strong referential integrity, optimized indexes, ACID-safe transactions, concurrency protection, RLS/security, auditability, migrations, backup/recovery, and fast query performance.

The schema must be the **authoritative source of truth** for Finly and support all current and future requirements without hacks, duplicated sources of truth, inconsistent balances, broken relationships, or unnecessary complexity.

Before implementation:

**UNDERSTAND → MODEL → ERD → VALIDATE FINANCIAL FLOWS → QUERY/INDEX DESIGN → SECURITY DESIGN → EDGE-CASE REVIEW → IMPLEMENT → TEST → BENCHMARK**

Only finalize the schema when it is **financially correct, secure, fast, maintainable, scalable, migration-safe, and production-ready**.
