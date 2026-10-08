# Add-on 02 — Professional software engineering, mobile engineering & production rules

> Received from the product owner on 2026-10-08, first session. Verbatim. Extends `BUILD_PROMPT.md`;
> where it is stricter, it wins (BUILD_PROMPT A6.2).

---

**ADD-ON — PROFESSIONAL SOFTWARE ENGINEERING, MOBILE ENGINEERING & PRODUCTION RULES**

Build and maintain this application like a **senior software architect + senior Android/mobile engineer + backend engineer + database engineer + security engineer + QA engineer + DevOps engineer**.

Apply **all relevant professional software-engineering principles and best practices** throughout the entire project.

### CORE ENGINEERING PRINCIPLES

Follow:

**KISS, DRY, SOLID, YAGNI, Separation of Concerns, Single Responsibility, Composition over Inheritance, Encapsulation, Abstraction, Modularity, Reusability, High Cohesion, Low Coupling, Immutability where appropriate, Explicit Dependencies, Fail-Fast, Defensive Programming, Least Privilege, Secure by Design, Privacy by Design, Testability, Maintainability, Observability, Backward Compatibility, and Graceful Degradation.**

Do not over-engineer unnecessarily, but do not take shortcuts that create technical debt, security problems, data corruption, performance problems, or future architectural limitations.

### ARCHITECTURE

Use a **clean, modular, scalable architecture** with clear separation between:

**UI → Presentation/State → Domain/Business Logic → Data → API/Backend → Database**

Business rules must not be duplicated across screens.

Keep financial, permission, security, validation, and critical business logic in the appropriate centralized layers.

Use reusable components and shared services instead of copying logic.

Maintain clear dependency direction and prevent circular dependencies.

### MOBILE ENGINEERING

Build the Android application specifically for **real mobile conditions**.

The UI must remain:

**FAST + SMOOTH + RESPONSIVE + STABLE + TOUCH-FRIENDLY + LOW-MEMORY + LOW-BANDWIDTH FRIENDLY**

Prevent:

**UI jank, ANRs, freezes, unnecessary recompositions/rebuilds, memory leaks, battery drain, excessive network requests, excessive database queries, blocking operations, crashes, race conditions, and unnecessary background work.**

Never execute heavy work on the main/UI thread.

Use appropriate:

**async processing, background workers, caching, pagination, lazy loading, batching, debouncing, throttling, lifecycle-aware operations, connection management, efficient state management, database indexing, query optimization, image compression, file streaming, and memory management.**

Handle Android lifecycle changes correctly:

**rotation/configuration changes, background/foreground transitions, process death, low memory, interrupted requests, network changes, app restart, and session expiry.**

### PERFORMANCE

Performance must be engineered, measured, and continuously verified.

Test and optimize:

**startup → login → navigation → scrolling → search → filtering → large datasets → database queries → financial calculations → offline mode → sync → file generation → PDF → image handling → sharing → background/foreground transitions → memory → CPU → battery → network usage.**

Do not guess about bottlenecks. **Profile, measure, identify the root cause, optimize, and verify again.**

Performance must remain acceptable on **older compatible Android devices**, not only high-end phones.

### DATABASE & DATA ENGINEERING

Design the database professionally:

**normalized where appropriate, indexed correctly, referentially consistent, transactional, auditable, secure, migration-safe, and optimized for the actual workload.**

Use proper:

**primary keys, foreign keys, constraints, indexes, transactions, uniqueness rules, validation, migrations, backups, recovery, and concurrency handling.**

Never allow financial data corruption through race conditions, duplicate requests, stale balances, partial writes, or unsafe migrations.

### API & BACKEND

Use:

**validated inputs, typed contracts, authentication, authorization, idempotency, rate limiting where appropriate, pagination, filtering, safe error handling, transactional operations, timeout handling, retries where safe, structured logging, and consistent API responses.**

Never trust client-side validation alone.

The backend must remain the authoritative security and financial boundary.

### FINANCIAL ENGINEERING

Never implement financial functionality as simple CRUD.

Preserve:

**financial invariants, atomicity, auditability, traceability, ownership, balances, fund allocation, ledger effects, outstanding amounts, reconciliation, reversals, corrections, approvals, and dependency propagation.**

Every financial mutation must be validated and committed atomically.

No silent overwrites or partial financial updates.

### SECURITY

Use **security-by-design and defense-in-depth**.

Apply:

**least privilege, explicit authorization, secure authentication, secure session management, encryption, secure secret handling, secure storage, input validation, output filtering, audit logging, access control, device/session security, protected files, secure sharing, and secure recovery procedures.**

Never store secrets in source code, APKs, Git, logs, local preferences, or unsafe storage.

Never rely on frontend hiding for security.

### ERROR & FAILURE ENGINEERING

Every important operation must safely handle:

**invalid input, missing data, permission denial, authentication failure, expired session, network failure, timeout, server failure, database failure, duplicate request, concurrency conflict, stale data, offline state, sync conflict, insufficient balance, invalid dependency, unavailable resource, interrupted operation, and unexpected failure.**

Show the user a clear recovery path.

Never silently fail.

Never partially save a financial operation.

### EDGE CASES

Do not build only the happy path.

Systematically identify and test **realistic edge cases and combinations of conditions** across users, permissions, companies, funds, accounts, transactions, ownership, balances, offline/sync, sharing, security, approvals, reconciliation, and concurrent activity.

Create and maintain an **edge-case matrix** and ensure important combinations are covered by tests.

### TESTING

Use the appropriate combination of:

**unit tests + integration tests + database tests + API tests + financial tests + permission tests + security tests + UI tests + E2E tests + concurrency tests + offline/sync tests + recovery tests + regression tests + performance tests.**

Test both:

**expected behavior AND failure behavior.**

Do not mark a feature complete because the screen opens. Verify the entire workflow end-to-end.

### CODE QUALITY

Write code that is:

**readable, predictable, maintainable, testable, documented where necessary, strongly structured, consistently formatted, and easy for another professional developer to understand.**

Use meaningful names.

Avoid:

**magic numbers, duplicated logic, giant functions, unnecessary global state, hidden side effects, dead code, commented-out code, fragile hacks, excessive nesting, unnecessary abstractions, and tightly coupled modules.**

Refactor when complexity becomes difficult to maintain.

### OBSERVABILITY

Build appropriate:

**structured logging, error tracking, audit trails, diagnostics, health checks, performance measurements, and actionable failure information.**

Never log passwords, secrets, encryption keys, private financial values, or other sensitive information unnecessarily.

### BACKWARD COMPATIBILITY

Support the required older Android versions wherever reasonably possible.

Do not break existing supported devices when introducing new functionality.

Use compatible APIs and provide safe fallbacks where needed.

### OFFLINE-FIRST & SYNC

Assume mobile connectivity can fail.

Design safe:

**local state → offline queue → sync → retry → conflict detection → reconciliation → final consistency**

without duplicate financial posting or lost transactions.

Offline behavior must never bypass authorization or financial validation.

### GIT & DEVELOPMENT DISCIPLINE

Use Git professionally from the beginning.

Maintain:

**clean working tree + focused commits + meaningful commit messages + reviewable diffs + traceable history + safe rollback.**

Before every commit:

**git status → git diff → test → review → commit**

Never commit:

**secrets, credentials, private keys, sensitive financial data, generated junk, or known broken code.**

Keep `.gitignore`, environment configuration, migrations, documentation, and versioning properly maintained.

### CHANGE MANAGEMENT

Before modifying existing functionality:

**UNDERSTAND → TRACE DEPENDENCIES → IDENTIFY IMPACT → PLAN → IMPLEMENT → TEST → REVIEW**

Never change one financial/business rule without checking all dependent features, calculations, reports, permissions, APIs, database relationships, and UI behavior.

### DOCUMENTATION

Keep important technical documentation synchronized with the implementation.

Document:

**architecture, database design, APIs, financial rules, security decisions, permission model, important workflows, edge cases, deployment, testing, and architectural decisions.**

Documentation must reflect the actual code.

### PROFESSIONAL DEVELOPMENT LOOP

For every meaningful feature or change:

**READ → UNDERSTAND → INSPECT → MAP DEPENDENCIES → PLAN → IMPLEMENT → BUILD → RUN → TEST → PROFILE → REVIEW → FIX → REGRESSION TEST → DOCUMENT → COMMIT**

Do not optimize only for “making it work.”

Optimize for:

**CORRECTNESS + SECURITY + PERFORMANCE + RELIABILITY + MAINTAINABILITY + USABILITY + TESTABILITY + FUTURE EXTENSIBILITY**

The final system must feel and behave like a **professionally engineered production mobile application**, not an AI-generated prototype.
