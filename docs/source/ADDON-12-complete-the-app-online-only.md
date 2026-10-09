# Add-on 12 — Continue building until the complete app is production-ready; online database only

Received 2026-10-09, recorded verbatim: the owner's add-on prompt, then a reminder sent while work was in progress.

---

ADD-ON PROMPT — CONTINUE BUILDING FINLY UNTIL THE COMPLETE APP IS PRODUCTION-READY
Continue from the current implementation and complete the entire Finly application, following the Master Prompt, system design, database schema, accounting rules, security requirements, edge-case scenarios, and all confirmed decisions.
Your next components are the posting service, encryption service, integrity checker, sign-in service, API, and application screens. These are the next steps, not the final deliverable.
Complete the Entire System
Implement and integrate every required layer in the correct dependency order:

1. Financial Posting Engine: Double-entry accounting where applicable, ledger entries, fund allocations, transfers, expenses, outstanding balances, reimbursements, advances, settlements, reversals, corrections, approvals, and atomic financial transactions.
2. Encryption and Security: Secure financial data handling, key management and recovery, authentication, session management, password/M-PIN security, device management, and secure storage.
3. Financial Integrity Checker: Validate accounting invariants, detect mismatches, duplicates, missing entries, incorrect balances, concurrency conflicts, and inconsistencies. Never silently modify financial records to hide discrepancies.
4. Authentication and Authorization: Complete sign-in, first-time activation, existing-book linking, configurable global and entity-specific roles, hierarchical permissions, ownership, access delegation, and backend-enforced confidentiality.
5. Backend and APIs: Complete the required API endpoints, validation, authorization, database transactions, pagination, error handling, idempotency, audit logging, and reliable integration with PostgreSQL.
6. Flutter Android Application: Build every required screen and connect it to real backend functionality. Complete navigation, dashboards, transaction entry, accounts, funds, entities, expenses, outstanding balances, reconciliation, reports, user management, permissions, security, and settings.
7. Remaining System Features: Implement the required notifications, audit history, document/receipt handling, WhatsApp sharing, PDF generation, offline operation, synchronization, conflict resolution, and other features specified in the project documentation.
8. Production Readiness: Complete database migrations, configuration, deployment procedures, backups and recovery, error reporting, performance optimization, accessibility, and operational documentation.

Treat this as a complete end-to-end system. Do not leave buttons, screens, APIs, or workflows disconnected, mocked, or dependent on placeholder data.
Mandatory Engineering Workflow
For each logical change, follow:
READ → PLAN → IMPLEMENT → BUILD → TEST → REVIEW → FIX → REGRESSION TEST → UPDATE DOCUMENTATION/MEMORY → REVIEW GIT DIFF → COMMIT → CONTINUE
Maintain traceable Git history and keep the project buildable at meaningful milestones.
Use the actual PostgreSQL installation for database integration, concurrency, and performance testing. Verify compatibility with PostgreSQL 17 as required. Test the encryption and recovery design, financial posting invariants, permissions, offline synchronization, and realistic end-to-end user journeys.
Do not mark any feature complete until its implementation and relevant tests have been verified.
Completion Criteria
The project is complete only when:

* All required modules are implemented and integrated.
* Financial calculations, ledger entries, ownership, balances, and settlements remain consistent.
* Authentication, permissions, privacy, encryption, and audit requirements are enforced.
* All major screens and user workflows function with real data.
* Database migrations, integration tests, concurrency tests, and regression tests pass for the verified target environment.
* Critical edge cases and failure paths have been tested.
* The Android application builds successfully and is ready for installation and deployment.
* Remaining documented risks or external deployment requirements are explicitly identified.
* Technical documentation and project memory accurately reflect the final implementation.

Execution Rules
Continue building immediately. Do not stop after producing a plan, architecture, individual services, APIs, or an initial set of screens. Complete the integration, test the entire application, fix discovered issues, and proceed through the remaining modules.
Do not repeatedly ask questions already answered in the project documents or confirmed in this conversation. For genuinely unresolved accounting rules, retrieve the original questions, ask only what is necessary, and continue unrelated work.
If the Android phone disconnects, continue development and automated testing without it. Use the phone later for installation, device-specific testing, debugging, and performance profiling.
If a genuine blocker occurs, investigate practical alternatives first. Report the precise blocker and continue all work that does not depend on it.
Do not weaken financial correctness or security simply to finish faster. Follow the previously authorized encryption fallback only if investigation establishes that the original amount-encryption approach is impractical.
FINAL OBJECTIVE: FINISH THE COMPLETE, INTEGRATED, PRODUCTION-READY FINLY ANDROID APPLICATION—not merely its underlying services. Build, test, verify, fix, and document until every required module is complete.

---

**Reminder:** Finly is a **Flutter + Dart Android mobile app** for financial management, optimized for performance, smooth UI, and fast API/database operations. Use **Supabase or another suitable production-grade online database** for multiple users. **No local database**; financial data must be stored and managed centrally online with secure authentication, permissions, and reliable synchronization. Build the complete, secure, scalable app and verify production deployment readiness.

---

Second reminder, received the same day (verbatim):

**Database Architecture Reminder:** Finly is a **Flutter + Dart Android app using a centralized online database only**, such as Supabase/PostgreSQL or another suitable production-grade solution. **Online-only operation: no local database, no offline mode, no offline transaction queue.** Users must have an internet connection to access and update financial data. Changes must be securely saved to the central database and reflected across authorized users in real time or through reliable updates.

Apply all relevant production-grade database architecture concepts: **ACID transactions, transaction isolation, deadlock prevention and recovery, concurrency control, row locking, optimistic locking, race-condition prevention, atomic commits and rollbacks, idempotency, normalization, constraints, indexing, query optimization, connection pooling, pagination, row-level security (RLS), multi-tenant isolation, migrations, backups, recovery, monitoring, and scalability.** Prevent duplicate entries, lost updates, inconsistent balances, partial commits, and unauthorized access. Handle simultaneous users, network failures, database errors, and transaction conflicts safely. Prioritize financial accuracy, security, reliability, and performance. Thoroughly test the complete system before declaring it production-ready.
