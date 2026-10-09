# ADDON-15 — Final master development prompt: interconnected, independent, dependency-aware

Received 2026-10-09, recorded verbatim. Applies together with BUILD_PROMPT and every earlier add-on; the stricter
reading wins.

---

FINLY — FINAL MASTER DEVELOPMENT PROMPT
Enterprise-Grade, Fully Integrated Android Finance & Accounting Application
OBJECTIVE
Build Finly, a complete, fully functional, secure, scalable, maintainable, and production-ready Flutter + Dart Android finance and accounting application.
Follow professional software engineering, enterprise architecture, PostgreSQL database engineering, financial accounting, cybersecurity, and industrial-grade UI/UX practices.
The entire application must operate as one coherent system. All related components must be interconnected, and all genuine business dependencies must be respected. At the same time, every module must remain independently testable, maintainable, replaceable where appropriate, and extensible.
Core architectural principle: High cohesion, low coupling, explicit dependencies, strong data integrity, and reliable integration across the entire application.
Do not build a prototype, disconnected screens, isolated backend services, placeholder modules, or partially implemented workflows. Complete the application end-to-end, integrate every required feature, verify the relationships between modules, and test the complete system before declaring it production-ready.
1. Unified Architecture: Multi-Dependency, Interconnected and Independent
Treat architecture and dependency management as fundamental engineering requirements, not optional code organization.
A single operation may depend on multiple users, entities, accounts, funds, permissions, records, services, financial calculations, database constraints, audit entries, and reports. Design the system to handle these complex dependencies explicitly and reliably.
1.1 Independent modules
Divide the application into clearly defined business modules and technical layers with specific responsibilities.
Each module must have:

* A clearly defined purpose and scope.
* Well-defined public interfaces and contracts.
* Private internal implementation details.
* Explicit inputs, outputs, dependencies, and side effects.
* Independent unit tests.
* Defined validation and authorization requirements.
* Documented dependencies on other modules.
* Controlled rules for exposing and modifying its data.
* Clear error handling and recovery behavior.

A change inside one module must not unnecessarily break unrelated modules. Internal implementation changes should not force changes throughout the application when the public contract remains unchanged.
Examples of potential modules include authentication, users, entities, memberships, permissions, accounts, funds, transactions, expenses, transfers, settlements, accounting ledgers, reports, file attachments, notifications, and audit history. Determine the final module boundaries from the actual requirements rather than splitting everything into excessive tiny modules.
1.2 Interconnected modules
Modules must communicate through defined interfaces, application services, repository contracts, database relationships, or controlled events, according to the nature of the dependency.
When one operation affects multiple modules, ensure every required downstream effect is handled correctly.
For example, a posted financial transaction might affect:

* The transaction record and its status.
* The source and destination accounts or funds.
* The associated accounting journal and ledger.
* The relevant balances and outstanding obligations.
* Entity-level financial summaries.
* Audit history and permitted notifications.
* Reports and other derived views.

Do not update one component while leaving dependent components inconsistent.
1.3 Interdependent modules
Use explicit dependency relationships wherever the correctness of one module or workflow depends on another.
Examples:

* Transactions depend on authentication, permissions, valid entities, and applicable accounts or funds.
* Transfers depend on valid source and destination records and appropriate financial rules.
* Expenses may depend on allocations, payment sources, entities, and settlement relationships.
* Accounting postings depend on validated transaction data and accounting rules.
* Reports depend on the authoritative underlying financial data and the viewer's permissions.
* Role-aware screens depend on effective permissions enforced by the backend.
* Archives and deletions depend on existing relationships, historical records, and retention rules.
* Reversals depend on the original posted transaction and its current state.
* Notifications depend on a successfully recorded operation and the recipient's authorization.

Declare these dependencies and validate them before the operation commits.
1.4 Do not create unnecessary coupling
Interconnected does not mean every module should directly depend on every other module.
Do not create all-to-all dependencies, giant shared services, circular imports, direct access to another module's private database logic, or duplicated implementations of the same business rules.
Establish clear dependency direction, stable contracts, dependency inversion, and appropriate interfaces.
A module should depend only on the capabilities it actually needs. When two modules need to share a capability, expose an appropriate shared contract or service rather than importing each other's internal implementation.
Avoid both extremes:

* Excessive isolation that causes disconnected workflows and duplicated data.
* Excessive coupling that causes one change to break the entire application.

Choose an appropriate architecture based on actual business dependencies, consistency requirements, complexity, and maintainability.
2. Multi-Dependency Management and Impact Analysis
Every significant operation must identify and validate its complete set of dependencies before execution.
Do not assume that an operation affects only the record currently visible on the screen.
2.1 Dependency identification
For each important business operation, identify:

* Required parent records and related records.
* Required users, permissions, memberships, and entity relationships.
* Input values and their validation rules.
* Records that may be created, updated, or transitioned.
* Financial balances and calculations affected.
* Downstream modules that must be updated or notified.
* Database constraints and transaction boundaries.
* Possible concurrent changes and conflicting operations.
* Audit and security requirements.
* Failure conditions and rollback or recovery actions.

Document direct dependencies, indirect dependencies, optional dependencies, conditional dependencies, and forbidden dependencies where applicable.
2.2 Dependency graph
Maintain an understandable representation of the system's important dependencies.
Use dependency graphs, architecture diagrams, module maps, schema relationships, and workflow diagrams where they provide practical value.
The dependency model must help developers determine:

* Which modules rely on another module.
* What might break when an interface or schema changes.
* Which tests must run after a change.
* Which data records may be affected by an operation.
* Which workflows require atomic consistency.
* Which effects can be processed asynchronously.
* Where circular dependencies or architectural violations exist.

Use architecture checks and automated tests to detect dependency cycles, inappropriate imports, broken public contracts, and violations of established module boundaries.
2.3 Impact analysis before changes
Before modifying an existing feature, database schema, shared interface, permission rule, financial calculation, or API contract:

1. Identify the affected component.
2. Find its direct dependents.
3. Trace relevant indirect dependencies.
4. Determine the potential effects on financial data and permissions.
5. Identify migration, compatibility, and deployment implications.
6. Update the necessary modules, documentation, and tests.
7. Run targeted tests and broader regression tests according to the impact.
8. Verify that previously working dependent features remain correct.

Do not patch a visible error without investigating its root cause and related effects.
2.4 Dependency lifecycle
Validate dependencies when creating, updating, approving, posting, reversing, archiving, or removing records.
Do not allow an operation to proceed merely because the UI opened successfully. The relevant records, permissions, relationships, and state transitions must still be valid when the backend processes the request.
Handle missing, deleted, archived, changed, revoked, or concurrently modified dependencies safely.
3. Complete Flutter Android Application
Inspect the existing source code, repository structure, documentation, project decisions, dependencies, database configuration, connected services, and unfinished work before changing anything.
Build the entire required application end-to-end, including:

* Authentication, account creation, invitations, onboarding, and session management.
* Dynamic users, memberships, entities, ownership, and configurable relationships.
* Role-aware dashboards, navigation, menus, search, and notifications.
* Accounts, funds, transactions, transfers, expenses, bills, advances, reimbursements, settlements, receivables, payables, and liabilities.
* Relevant financial journals, ledgers, balances, statements, reports, reconciliations, approvals, and audit history.
* Configurable settings and all other features required by the existing project specifications.

Determine the final feature scope from the actual product requirements. Do not invent unnecessary features or silently omit required existing features.
Every implemented screen, button, service, form, API, and workflow must be connected to the appropriate business logic and backend.
No fake financial balances, dummy actions, disconnected screens, misleading success messages, or placeholder logic in functionality presented as complete.
4. Centralized Online Database Only
Supabase with PostgreSQL is the primary database solution, and Supabase is already connected to Claude through MCP.
Inspect and use the existing Supabase connection, database configuration, schema, migrations, and project setup first.
If Supabase cannot satisfy a genuine production requirement, evaluate another suitable production-grade online PostgreSQL solution and document the technical reason before changing the architecture.
Strict online-only requirements

* No local database.
* No offline mode.
* No offline transaction queue.
* No offline financial processing.
* Internet access is mandatory for retrieving, creating, and updating financial records.
* The central online database is the single source of truth.
* Authorized users must see consistent, current data across devices and sessions.
* Network interruptions must show clear error states.
* Never report a financial operation as successful until the backend confirms the result.

Secure session credentials may be stored using appropriate Android security facilities, but local storage must not function as a financial database or offline record cache.
Never expose database passwords, Supabase service-role keys, privileged credentials, or server secrets in the Android application, client-side code, logs, Git history, or publicly accessible configuration.
Use a secure backend architecture and least-privilege credentials to ensure that clients cannot bypass server-side business rules.
5. Production-Grade PostgreSQL Architecture
Design the database to support multiple users, multiple entities, concurrent financial operations, growing datasets, and changing requirements.
Apply the appropriate concepts from professional relational database engineering.
Data structure and integrity
Use primary keys, foreign keys, unique constraints, check constraints, appropriate normalization, validated relationships, and referential integrity.
Use exact monetary representations with suitable precision and rounding rules. Never use binary floating-point arithmetic for authoritative financial calculations.
Keep distinct concepts separate, including user identity, entity ownership, memberships, accounts, funds, transaction history, accounting entries, money custody, physical location, outstanding obligations, and balances.
Transactions and concurrency
Implement:

* ACID transactions and appropriate isolation levels.
* Atomic commits and rollbacks.
* Row locking and suitable optimistic concurrency controls.
* Deadlock detection, prevention strategies, and safe recovery.
* Race-condition prevention and conflicting-update detection.
* Idempotency and duplicate-request protection.
* Correct transaction boundaries and dependency validation.
* Appropriate unique constraints and database-enforced invariants.

Prevent duplicate postings, lost updates, inconsistent balances, invalid relationships, double spending, and partial financial commits.
Choose isolation levels, locks, and retry strategies based on the operation's actual dependencies. Handle deadlocks and concurrent modifications without duplicating a successful financial transaction.
Performance and operational reliability
Use appropriate indexes, query planning, query optimization, connection pooling, bounded queries, pagination, and efficient data retrieval.
Implement versioned migrations, controlled schema changes, secure backups, recovery procedures, monitoring, and operational diagnostics.
Use PostgreSQL Row-Level Security (RLS) and appropriate database privileges to protect confidential data and isolate entities.
Test against the actual production-compatible PostgreSQL version and document unverified compatibility.
6. Fully Dynamic and Configurable System
Never hardcode individual person names, firm names, business names, entity names, account names, fund names, locations, user assignments, permission assignments, or user-specific relationships into application logic.
Such information must be dynamic and managed through authorized workflows and the online database.
Support a flexible and extensible number of users, entities, accounts, funds, locations, roles, permissions, and relationships, subject to documented technical or service limits.
Use stable database identifiers rather than names as identity or authorization mechanisms.
Allow authorized users to create, update, assign, link, manage, archive, and remove configurable records where permitted and appropriate.
When a new user, entity, account, role, or relationship is introduced, it must integrate correctly with all relevant modules without source-code changes or application redeployment.
Keep seed data separate from production business logic.
Configurable business rules must remain within explicit validation boundaries. Administrative settings must never bypass essential security requirements or financial invariants.
7. Authoritative Role-Based Permissions Across UI, Backend and Database
The database, backend, and Flutter UI must operate with one authoritative authorization model.
Use dynamic role-based access control (RBAC), complemented by attribute-based access control (ABAC) where contextual rules are necessary.
Manage users, memberships, roles, permissions, ownership, delegation, and effective access through the online system.
Support granular permissions for discovering entities, viewing records, viewing amounts, viewing sensitive details, creating, editing, archiving, approving, reversing, reconciling, exporting, sharing, and managing users and permissions.
UI permission behavior
The UI must dynamically reflect effective authorization.
Menus, screens, buttons, fields, financial amounts, search results, reports, charts, notifications, autocomplete results, exports, and shared information must show only what the user is authorized to access.
The backend must independently authorize every protected operation. The database must enforce appropriate security policies.
A hidden button is not a security boundary. Never return confidential information to an unauthorized client simply because the UI intends to hide it.
Permission changes and revocations must be reflected through reliable refresh or invalidation mechanisms. Subsequent operations must use the current effective permissions, including when an existing screen remains open.
Support different permission levels for different users and entities without hardcoded role checks scattered throughout the source code.
Test authorization at the UI, API, and database levels, including direct requests that bypass the application interface.
8. Financial Accounting and Business Logic
Financial accuracy takes priority over implementation shortcuts and visual convenience.
Implement the accounting concepts appropriate to Finly's actual scope, including:

* Chart of accounts, journals, ledgers, balances, and trial balances.
* Double-entry accounting wherever applicable.
* Income, expenses, assets, liabilities, equity, receivables, and payables as appropriate.
* Funds, transfers, source and destination accounts, advances, reimbursements, and settlements.
* Personal and business transactions with their correct accounting treatment.
* Bills, unpaid expenses, allocation rules, reconciliation, period closing, and financial reporting.
* Traceable fund movements, ownership relationships, and outstanding obligations.
* Controlled corrections and reversals with preserved audit history.

Distinguish the person who pays, the entity bearing the expense, the source of money, the owner of a fund, the custodian of an asset, and the location where it is held.
For common expenses, follow the defined business rules and obtain explicit allocations where required. Never automatically split amounts unless an expressly authorized rule requires it.
Financial calculations must use exact monetary representations and validated rounding rules.
Maintain consistent balances, appropriate journal entries, valid allocations, accurate outstanding amounts, and reconcilable reports.
Never silently rewrite posted financial history. Correct mistakes through controlled, traceable corrections or reversals.
Material financial operation lifecycle
Every material financial operation must follow the appropriate sequence:
User Action → Authentication → Authorization → Input Validation → Dependency Validation → Financial Impact Analysis → Conflict Detection → Atomic Database Transaction → Integrity Verification → Audit Recording → Confirmed UI Update.
If any required step fails, roll back the complete atomic operation, report the failure safely, and leave no partial financial posting.
The online backend and database must be authoritative for financial results. Do not treat a client-calculated balance as the final result.
9. Cross-Module Consistency, Cascading Effects and Recovery
Whenever a module changes data on which other modules depend, calculate the full impact and apply the required consequences correctly.
For example, posting a transaction may affect the source fund, destination fund, journal entries, ledger balances, outstanding obligations, reports, audit history, and notifications.
Implement appropriate mechanisms for each dependency type:

* Synchronous dependency: Required validation or business processing that must succeed before the main operation can commit.
* Atomic dependency: Related database changes that must succeed or fail together.
* Asynchronous dependency: Non-critical downstream work that can safely occur after the main commit, such as refreshing a derived report or delivering a notification.
* Conditional dependency: Work required only when specific business rules, permissions, or transaction types apply.
* Optional dependency: A feature that may be unavailable without invalidating the core operation, provided the business rules permit it.
* External dependency: A connected service that requires timeouts, failure handling, and appropriate recovery.

Do not mark a main financial operation successful before its required atomic changes are committed.
For reliable asynchronous backend processing, use appropriate mechanisms such as durable event records, transactional outbox patterns, idempotent consumers, retry limits, and observable processing states. These are backend reliability mechanisms, not permission to add an offline database or offline transaction queue to the Android application.
Ensure asynchronous work cannot silently duplicate entries, lose required financial effects, or report inconsistent states indefinitely.
Use explicit state machines for complex workflows such as approvals, transfers, settlements, reversals, and multi-step operations.
Document which effects are atomic, which occur after the commit, and what recovery process applies when downstream processing fails.
10. Professional Industrial-Grade UI/UX
Build a polished, commercially deployable Android finance application with a consistent design system.
Prioritize clarity, trust, accessibility, financial accuracy, responsiveness, intuitive navigation, and minimal unnecessary interactions.
Use reusable components for typography, spacing, layouts, forms, dialogs, amounts, balances, transaction cards, filters, charts, reports, and confirmation screens.
Provide clear loading, empty, validation, success, error, unauthorized, session-expired, network-failure, and transaction-conflict states.
Prevent accidental duplicate submissions and only display financial success after backend confirmation.
Use purposeful animations and microinteractions without slowing down financial workflows.
Support appropriate Android screen sizes, keyboard behavior, application lifecycle handling, accessibility, and light/dark themes.
Ensure dashboard totals, charts, reports, search results, notifications, and exports remain consistent with authorized backend data.
UI components must respond to actual data, configuration, dependencies, and effective permissions. Do not create duplicated screens for every individual user or entity.
11. Security, Privacy and Auditability
Implement security throughout the entire system.
Use secure authentication, protected sessions, least-privilege authorization, strict entity isolation, backend validation, database-enforced policies, safe input handling, and appropriate API protections.
Protect secrets, use TLS, secure Android credential storage, and manage encryption keys appropriately.
Never store passwords, PINs, biometric secrets, or privileged credentials in recoverable plaintext.
Maintain appropriate audit history for sensitive financial and administrative operations without exposing confidential values or credentials unnecessarily.
Support permission revocation, session invalidation, secure sharing, controlled exports, and protected backup and recovery procedures.
Test direct API access, cross-entity data leakage, privilege escalation, unauthorized exports, and attempts to bypass UI restrictions.
Never claim a security control is effective unless its implementation and relevant behavior have been verified.
12. Performance, Scalability and Reliability
Optimize the complete system, including Flutter rendering, state management, backend services, authorization, database access, and financial processing.
Use suitable indexes, optimized queries, pagination, connection pooling, bounded requests, request debouncing, efficient rendering, and controlled memory usage.
Measure real performance rather than guessing.
Test simultaneous users, conflicting financial operations, database connection limits, deadlocks, timeouts, retries, network interruptions, and service failures.
Retry safely without duplicating successful financial transactions.
Handle failures with clear user feedback and without exposing sensitive internal details.
Design for growth while acknowledging real infrastructure, database, connection, and service limits.
13. Testing and Quality Assurance
Test modules independently and test the complete dependency chain between them.
Use unit, integration, database, API, UI, end-to-end, regression, concurrency, security, and architecture tests as appropriate.
Include tests for:

* Multiple users and roles across multiple entities.
* Permission grants, changes, revocations, and unauthorized direct requests.
* Cross-entity isolation and confidential financial information.
* Transaction creation, posting, editing, approval, reversal, and reconciliation.
* Concurrent transfers, race conditions, duplicate submissions, deadlocks, and conflicting updates.
* Missing, archived, changed, or invalid dependencies.
* Incorrect amounts, insufficient balances, precision boundaries, and allocation failures.
* Database failures, network interruptions, timeouts, expired sessions, and recovery.
* Ledger consistency, outstanding balances, reports, and period closing.
* New users, roles, entities, accounts, and configurable relationships.
* Cascading changes across dependent modules.
* Breaking interface changes, dependency cycles, and regression failures.
* Android release builds and real backend integration.

For important workflows, verify:
Input → Validation → Authorization → Dependency Graph → Impact Analysis → Conflict Handling → Financial Result → Atomic Commit or Rollback → Audit → Downstream Effects → UI Result.
Run tests against the actual target database environment wherever required.
Report tests as passed only after execution. Clearly identify blocked tests, skipped tests, unresolved defects, and unverified behavior.
14. Engineering Workflow, Dependency Discipline and Git
Follow this continuous development loop:
Inspect → Map Dependencies → Plan → Implement → Build → Test → Review → Fix → Regression Test → Update Documentation → Verify Git Changes → Commit → Continue.
Before modifying a module or shared contract, investigate affected dependents and identify required updates.
After each logical change:

1. Review the implementation against the module's responsibilities and architecture boundaries.
2. Check direct and indirect dependencies for compatibility.
3. Verify data integrity, security, and financial implications.
4. Run relevant unit, integration, and regression tests.
5. Update architecture documentation, API contracts, schema diagrams, and dependency information where needed.
6. Review the Git diff for unintended changes and sensitive information.
7. Commit the verified logical change.
8. Continue to the next incomplete requirement.

Use focused commits, clear naming, consistent code style, appropriate version control, and maintainable documentation.
Do not introduce circular dependencies, bypass module interfaces, duplicate shared business rules, or weaken security to make an integration easier.
Do not discard working functionality or rewrite major architecture without first understanding its dependencies and consequences.
If a device or external service is temporarily unavailable, continue independent tasks and document the remaining verification requirements.
15. Final Delivery and Acceptance Criteria
Deliver the complete Finly Android application with all required functionality implemented and integrated.
Required outcomes:

* Fully working Flutter Android application.
* Secure centralized online PostgreSQL database.
* Verified schema, migrations, and production configuration.
* Dynamic users, entities, memberships, relationships, roles, and permissions.
* Consistent UI, backend, and database authorization.
* Correct financial workflows and auditable accounting operations.
* Explicit dependency management and impact analysis.
* Independent modules with strong cohesion and low coupling.
* Reliable cross-module updates, transaction boundaries, and recovery.
* Automated tests and verified integration results.
* Working Android release build and documented deployment procedures.
* Configuration, operational monitoring, backup and recovery guidance, and documented unresolved limitations.

Definition of done: Every required feature works correctly; every required dependency is respected; interconnected workflows preserve consistent financial and authorization states; independent modules remain maintainable; changes are tested for their direct and indirect effects; and the complete application has been verified through actual builds and tests.
Do not declare completion simply because the APK builds, individual screens appear correct, or isolated modules pass their unit tests.
Build the complete application, verify the entire dependency chain, test all critical interactions, fix discovered issues, and report the actual completion status honestly.
