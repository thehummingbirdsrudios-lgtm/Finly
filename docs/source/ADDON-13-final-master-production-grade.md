# ADDON-13 — Final master add-on: production-grade Android finance application

Received 2026-10-09, recorded verbatim. Applies together with BUILD_PROMPT and every earlier add-on; the stricter
reading wins.

---

FINLY — FINAL MASTER ADD-ON PROMPT
Production-Grade Android Finance Application
Objective: Build Finly as a complete, fully functional, secure, scalable, and production-ready Flutter + Dart Android finance and accounting application. Follow the standards of a professional software engineering team building enterprise-grade financial software. This is not a prototype, UI demo, or partially completed application.
1. Complete Application Development
Implement the entire application end-to-end, including all required screens, authentication, user onboarding, dashboard, financial workflows, entities, accounts, funds, transactions, expenses, transfers, settlements, reports, permissions, audit logs, and integrations required by the project. Inspect the existing repository, documentation, decisions, connected services, and unfinished work before making changes.
Do not stop after creating the database, API, authentication, individual services, or basic screens. Every feature must work with real data and connect correctly across the frontend, backend, and database.
2. Database and Online-Only Architecture
Supabase + PostgreSQL is the primary database solution and is already connected to Claude through MCP. Inspect and use the existing Supabase connection and configuration first. Use another suitable production-grade online PostgreSQL solution only if a genuine technical requirement makes it necessary, and document the reason.

* Online-only operation: no local database, offline mode, or offline transaction queue.
* An internet connection is mandatory for accessing and updating financial records.
* The central online database is the single source of truth for all financial information.
* Ensure consistent updates across authorized users and devices.
* Securely store authentication credentials or tokens using appropriate platform security, but never persist financial records locally as an offline data store.
* Never expose database credentials, service-role keys, or privileged secrets in the Android application, source control, logs, or client-side code.

Use professional database design: normalized schemas, clear entity relationships, primary and foreign keys, constraints, migrations, appropriate numeric precision, indexing, optimized queries, connection pooling, pagination, data retention, backups, disaster recovery, monitoring, and documented recovery procedures.
Apply relevant PostgreSQL concepts including ACID transactions, isolation levels, row locking, concurrency control, optimistic locking, deadlock prevention and recovery, race-condition prevention, atomic commits and rollbacks, and idempotency. Prevent duplicate postings, lost updates, double spending, inconsistent balances, and partial financial transactions. Make financial writes atomic and handle simultaneous users safely.
3. Enterprise-Grade Software Architecture
Follow professional software engineering standards:

* Use Clean Architecture, SOLID principles, modular feature-based organization, separation of concerns, and low coupling with high cohesion.
* Separate presentation, domain/business logic, application services, repository contracts, infrastructure, and database access appropriately.
* Keep financial calculations independent from UI components.
* Use strongly typed models, consistent naming, validation, error handling, dependency management, and clear interfaces.
* Implement reliable state management, safe asynchronous execution, lifecycle-aware code, and predictable state transitions.
* Design reusable, testable modules that are maintainable and extensible without unnecessary complexity.
* Implement structured logging, operational monitoring, actionable error messages, configuration management, versioned migrations, and documented APIs.
* Use version control properly, make small logical commits, review changes, and keep technical documentation current.

Avoid giant unmaintainable files, duplicated business logic, circular dependencies, hard-coded business rules, unsafe shortcuts, unnecessary abstractions, and tightly coupled components.
4. Professional Industrial-Grade UI/UX
Design the Android application to the standard of a polished, commercially deployed financial product.
Prioritize clarity, trust, financial accuracy, usability, accessibility, responsiveness, and efficiency over decorative visuals.

* Establish a consistent design system with typography, spacing, colors, iconography, reusable components, themes, and clear information hierarchy.
* Use intuitive financial dashboards, readable amounts, clear transaction histories, understandable forms, and predictable navigation.
* Minimize unnecessary taps and make common tasks fast without hiding important financial information or confirmations.
* Build reusable components for amounts, balances, accounts, transaction cards, filters, date ranges, summaries, charts, dialogs, and form validation.
* Provide polished loading, empty, success, error, permission-denied, expired-session, network-unavailable, and transaction-conflict states.
* Prevent accidental duplicate submissions and show clear results only after the backend confirms the operation.
* Use subtle, purposeful animations and microinteractions without slowing down financial workflows.
* Support different Android screen sizes, keyboard behavior, accessibility needs, and appropriate light/dark themes.
* Keep charts, totals, reports, search results, and dashboards consistent with authorized backend data.

Do not use placeholder content, fake balances, decorative but meaningless charts, dead buttons, misleading success messages, or disconnected screens. Every visible control must perform its intended action or be clearly identified as unavailable.
5. Financial Accounting and Business Rules
Treat financial correctness as the highest priority. Follow recognized accounting principles and sound Chartered Accountant–level accounting practices appropriate to the app's actual scope.

* Apply double-entry bookkeeping wherever applicable and enforce balanced journal entries.
* Maintain a clear chart of accounts, journals, ledgers, trial balances, and financial reports where required.
* Keep ownership, account, fund, money source, custodian/holder, physical location, transaction, ledger entry, balance, receivable, payable, liability, and outstanding obligations as distinct concepts.
* Track the actual source and destination of money for transfers and settlements.
* Maintain separate treatment of personal and business transactions.
* Handle bills, unpaid expenses, advances, reimbursements, allocations, settlements, reversals, corrections, reconciliation, and period closing correctly.
* For common expenses, require explicit allocation amounts for each participating entity; never automatically split amounts unless a specific authorized business rule explicitly requires it.
* Distinguish the person who paid an expense from the entity or person to whom the expense belongs.
* Preserve immutable financial audit history. Correct mistakes through controlled, auditable correction or reversal procedures rather than silently overwriting posted transactions.
* Prevent unauthorized negative balances, over-allocation, duplicate settlement, unbalanced entries, and conflicting financial updates.
* Use exact monetary representations suitable for financial calculations. Never use binary floating-point values for authoritative monetary arithmetic.
* Validate that balances, ledgers, statements, reports, and entity totals reconcile consistently.

Every material financial operation must follow this sequence:
User Action → Authentication → Authorization → Input Validation → Dependency Validation → Financial Impact Calculation → Conflict Detection → Atomic Database Transaction → Integrity Verification → Audit Recording → Confirmed UI Update.
If a required step fails, roll back the complete financial operation and explain the failure safely. Do not silently leave partial financial changes.
6. Security, Permissions, and Multi-User Isolation
Implement security as a backend-enforced requirement, not merely a UI restriction.
Use secure authentication, least-privilege authorization, role-based and attribute-based access controls, appropriate Row-Level Security policies, protected APIs, secure session handling, input validation, rate limiting where appropriate, and audited administrative actions.
Support granular permissions for viewing amounts, viewing details, creating, editing, approving, reversing, reconciling, exporting, sharing, managing members, and delegating permissions.
Strictly isolate each user's and entity's permitted data. A global administrator role must not automatically expose confidential financial information or passwords. Enforce delegation boundaries, prevent unauthorized privilege escalation, and record sensitive administrative actions.
Test access control at both API and database levels, including direct API calls that bypass the UI.
7. Performance, Reliability, and Scalability
Optimize for multiple simultaneous users and growing financial datasets.
Use efficient queries and indexes, pagination, appropriate caching only where safe, bounded network requests, request debouncing, efficient Flutter rendering, background processing where suitable, and disciplined memory, battery, and network usage.
Measure real performance instead of guessing. Test slow queries, connection limits, transaction contention, database outages, timeouts, retries, network interruptions, permission changes during operations, and recovery after failed requests. Use safe retry policies that cannot duplicate financial postings.
Because Finly is online-only, communicate connection failures clearly and preserve transaction integrity. Never silently switch to offline financial processing.
8. Testing and Quality Assurance
Build and execute a complete testing strategy:

* Unit tests: Financial calculations, domain rules, validation, permissions, and state transitions.
* Integration tests: Authentication, APIs, migrations, database operations, and end-to-end financial workflows.
* Concurrency tests: Multiple database connections, deadlocks, conflicting updates, simultaneous postings, and duplicate requests.
* Security tests: Tenant isolation, authorization bypass, session handling, secrets, and unauthorized data access.
* UI tests: Navigation, forms, validation, loading/error states, accessibility, and real backend interactions.
* Regression tests: All existing features after every material change.
* Release tests: Android release configuration, production settings, and deployment readiness.

Test normal operations, invalid values, zero and negative amounts, precision boundaries, insufficient funds, duplicate submissions, concurrent transfers, failed approvals, reversals, archived dependencies, reconciliation errors, interrupted network requests, expired sessions, and database failures.
Do not claim tests passed unless they were actually executed. Clearly report blocked tests, unresolved defects, and unverified integrations.
9. End-to-End Delivery Requirements
Follow this engineering cycle continuously:
Inspect → Plan → Implement → Build → Test → Review → Fix → Regression Test → Update Documentation → Verify Git Changes → Commit → Continue.
Maintain existing product decisions and documented requirements. Resolve outstanding questions using their original context instead of inventing assumptions. Continue working on independent tasks while genuine external blockers are resolved.
Deliver the complete Android application with all required modules integrated, a working release build, verified database migrations, secure production configuration, deployment instructions, backup and recovery guidance, and clear documentation of any remaining limitations.
Final acceptance criteria: Finly must be a complete, professionally engineered, secure, responsive, maintainable, performance-tested Android finance application backed by a centralized online PostgreSQL database. Financial operations must preserve accounting integrity under concurrent use, UI/UX must be production quality, and all critical functionality must be verified through real builds and tests.
Do not declare the project finished merely because the APK builds. Finish the implementation, integrate all required functionality, run the necessary verification, fix discovered defects, and report the actual completion status honestly.

---

## How it was applied (2026-10-09)

- The only existing Supabase project (`vepari`) belongs to a different application with live users and orders. The
  owner chose a **dedicated new Supabase project `finly`** (free plan, $0/month, ap-south-1, PostgreSQL 17) so that
  Finly's data, sign-ins, backups and restores stay separate (D-034).
