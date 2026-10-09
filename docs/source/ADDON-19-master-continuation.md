# ADDON-19 — Master continuation prompt: continue until the complete application is implemented, integrated, tested and verified

Received 2026-10-09, pasted into the chat together with [GATE-RESPONSE-05](GATE-RESPONSE-05-d038-f8f9-approvals.md).
Recorded verbatim below the line.

---

FINLY — MASTER CONTINUATION PROMPT
Continue Existing Development Until the Complete Application Is Implemented, Integrated, Tested, and Verified
You are continuing development of Finly, an online-first personal finance and business accounting application. Your responsibility is to continue from the project's actual current state and bring the entire application to production-grade engineering quality.
Do not merely create a plan, explain what needs to be built, generate example code, or recommend the next steps. Inspect the existing project and implement the remaining work directly in the repository.
1. Non-negotiable execution instructions

1. Inspect the existing repository, Git status, recent commits, current implementation, project documentation, architecture decisions, database schema, migrations, tests, Flutter screens, backend services, and deployment configuration before making changes.
2. Identify what is genuinely complete, partially implemented, broken, missing, or unverified. Do not rely solely on previous progress summaries.
3. Continue from the existing codebase. Preserve valid implementations and confirmed decisions. Do not restart the project, replace working modules unnecessarily, or create parallel implementations of existing functionality.
4. Implement, integrate, execute tests, investigate failures, fix defects, and rerun the relevant tests. Do not stop after producing a roadmap or completing only the currently discussed module.
5. Work in dependency order. Complete security-critical foundations before dependent features, and connect every implemented module to the actual application.
6. Do not ask me to reconfirm decisions already documented below. Resolve ordinary implementation details independently. If a genuine business or accounting ambiguity cannot safely be resolved, implement a safe validation or review workflow, document the issue, and continue all work that does not depend on the unresolved decision.
7. Never claim that something works, is secure, is production-ready, or has passed tests without evidence. Report exactly what was executed, what passed, what failed, what remains, and what could not be verified.
8. Preserve unrelated user changes. Inspect Git status before modifying files, avoid destructive commands, and use appropriately scoped commits when authorized and practical.
9. Do not finish with another list of suggested tasks while implementation remains possible. Continue through the next dependent tasks in the same session until all achievable work is complete or a real external blocker prevents further progress.
10. Do not wait for a phone or device if it is disconnected. Continue backend, database, integration, automated testing, and other available work. Record the device-specific checks that still require the device.

2. Project identity and technology
Product: Finly — a connected personal finance and business accounting platform.
Repository: `https://github.com/thehummingbirdsrudios-lgtm/Finly`
Current application direction:

* Flutter and Dart for the Android application.
* A properly structured backend/API and authentication layer.
* Supabase as the connected backend platform where appropriate, with PostgreSQL as the financial data source of truth.
* PostgreSQL 17 compatibility is the target for production validation.
* Architecture should support future iOS and web clients without duplicating financial rules, identity, permission logic, or accounting operations.

First verify the technologies, dependencies, migrations, environment, and current working configuration already used by the repository. Adapt the implementation to the existing architecture when it is sound.
Never expose database credentials, service-role keys, passwords, signing keys, tokens, encryption keys, or other secrets in application code, Git history, logs, APKs, or documentation.
If local development configuration already contains database connection details, use the existing configuration safely. Treat development credentials as development-only, and never reuse them as production credentials.
3. Product objective: build the complete Finly application
Finly is not merely bookkeeping software, a personal expense tracker, or a generic accounting package. It combines personal financial management, multi-entity business accounting, money-flow tracking, ownership-aware records, settlements, and granular access controls.
The product should enable users to manage:

* Personal money, accounts, funds, income, expenses, liabilities, receivables, and financial obligations.
* Multiple independent businesses, firms, partnerships, companies, branches, subsidiaries, and other supported entity types.
* Business books that remain separate even where the same person owns or manages multiple entities.
* Money moving between personal books, firms, accounts, funds, custodians, and other entities.
* Transactions whose origin, destination, purpose, ownership, economic classification, outstanding amount, settlement, or reversal must remain traceable.
* Relationships between personal and business records without duplicating the underlying financial movement.
* Multiple users, entity-specific roles, custom permissions, delegation, approval controls, and hierarchy-scoped access.
* Reports, statements, exports, printable documents, PDFs, notifications, and controlled sharing.
* A straightforward, premium-quality Flutter interface suitable for practical everyday use.

Product principle: Your Personal Money. Your Businesses. Every Fund Flow. One Connected System.
Do not interpret this positioning as permission to combine separate legal entities' books or disclose data across them.
4. Confirmed mandatory decisions
These decisions are authoritative. Incorporate them into the applicable architecture documents, business rules, database design, backend implementation, UI, migrations, and tests.
D-038 — Super Admin access: CONFIRMED
Platform administration alone must not grant access to a firm's private financial books.

* Platform Super Admin, Platform Admin, Support Operator, entity owner, entity administrator, partner, and custom entity-role holder are distinct concepts.
* Firm owners must receive access through explicit, entity-scoped owner roles.
* Super Admin must not automatically see, search, export, or inspect a firm's private financial records simply because the account has platform privileges.
* Exceptional support access requires explicit authorization, documented purpose, restricted permissions, an appropriate scope, an expiry or duration limit, and a complete audit trail.
* Support access must not silently impersonate the owner or another business user. Record the actual operator and distinguish any authorized support action from actions performed by the account holder.
* Super Admin must never retrieve users' passwords, PINs, biometric information, or private encryption keys.
* Platform-only privileges must not be assignable through an entity's custom role builder.

Inspect for conflicting legacy rules, including any previous rule that gives Super Admin unconditional financial-book access. Reconcile the documentation and implementation with this newer, confirmed decision.
F8/F9 — Independent book-side classification and economic substance: MODIFY THE RULE
Every relevant transfer must represent the actual economic event. Independent classifications on different book sides are allowed where appropriate, but selecting a classification in the UI must never force an invalid accounting treatment.
Firm expense versus owner's personal income
A firm's expense must not automatically become income in the owner's personal books.
For example, when a firm pays an owner, the valid treatment may be remuneration, reimbursement, drawings, distribution, a loan, a personal benefit, repayment, or another supported category. The application must classify the event according to its actual substance, the participating entities, and applicable accounting rules.
Requirements:

* Preserve separate book-side classification decisions.
* Validate the selected classifications together against the actual transaction and entity context.
* Do not force a firm's expense to become the owner's personal income.
* Do not assume every payment to an owner is a business expense, taxable income, capital contribution, liability, or distribution.
* When the transaction's purpose or supporting evidence is ambiguous, flag it for clarification or authorized review.
* Present understandable validation messages explaining the inconsistency and what information is needed to resolve it.

Non-repayable money transfers
A transfer that is not repayable and is not classified as drawings or capital must not automatically be treated as the giver's expense.
Require the actual purpose of the transfer, such as a gift, donation, remuneration, distribution, business expense, reimbursement, or another supported category.
Requirements:

* Distinguish repayment expectation from transaction purpose.
* Do not automatically classify a non-repayable transfer as an expense, gift, donation, capital movement, or income.
* Validate classifications against the entity types, legal/accounting relationships, and documented purpose.
* Do not automatically classify a gift or an owner's payment as a business expense.
* Where the evidence or economic substance does not support the chosen classification, block posting or route the record to a resolution workflow rather than silently manufacturing an accounting entry.

Owner-benefit expense approval: CONFIGURABLE CONTROL
Provide entity-specific approval policies for expenses benefiting an owner, related-party transactions, and high-value transactions.

* Let appropriately authorized entity administrators configure whether approval is required, the relevant categories, thresholds, required approver roles, and applicable exceptions.
* Require independent approval whenever the entity's policy demands it.
* Prevent self-approval when independent approval is required.
* Make approval decisions, policy changes, submission, rejection, resubmission, and posting auditable.
* Support a controlled, documented, audited alternative workflow for a single-owner business or when no eligible independent owner/approver is available.
* Do not silently bypass approval requirements because there is only one owner.
* Ensure thresholds and approval rules are enforced on the backend, not only in Flutter.
* Prevent changes to a submitted transaction or its approval policy from silently invalidating an existing approval. Require reapproval when a material change makes it necessary.

F8/F9 — Maintain traceability without duplicating the movement
Preserve traceability between the firm's books and the owner's personal books without duplicating the underlying financial movement or automatically creating income, debt, capital, or expense classifications that the actual transaction does not support.
The application must distinguish:

* Transaction identity and purpose.
* Originating and receiving accounts/funds.
* Source and destination entities.
* Legal/economic ownership of the money.
* Person making the payment and recipient.
* Current custodian or holder of the money.
* Which entity bears an expense.
* Whether money is repayable and who owes whom.
* Book-side classification and the actual economic substance.
* Original transaction, linked transactions, allocations, settlement, reversal, and audit history.

Use explicit relationship or linkage records where appropriate. A link between two records must not create a second posting of the same underlying movement.
Additional financial scenarios that must be preserved
Consider both distinct transfer scenarios, with independently selected classifications for their two sides:

1. Firm → Owner: firm-side classification × owner's personal-side classification.
2. Owner → Any Other Entity: owner's side classification × recipient entity's side classification.

Cover all four classification combinations within each scenario, for eight scenario combinations in total. Validate each combination against the real transaction purpose rather than assuming that every combination is automatically valid.
Example: a firm transfers ₹20,000 to an owner, and the owner later transfers ₹8,000 to another person or entity. The second transfer must be traceable to the first when appropriate, but it must not repost the original ₹20,000 movement. The remaining amount must be represented correctly unless another valid movement changes it.
Do not create debt merely because money moved between entities. Do not infer capital, drawings, expense, income, reimbursement, remuneration, liability, or receivable without the necessary economic basis.
Build and test an explicit matrix for all eight scenarios, including valid, invalid, ambiguous, partially settled, reversed, and repeated-request cases as relevant.
5. Complete and enforce the access-control system
Authorization is a core part of the application, not a cosmetic feature.
Keep these concepts separate:
Platform authority ≠ legal ownership ≠ partnership ≠ entity creator ≠ entity membership ≠ application role ≠ permission grant ≠ role holder ≠ parent-child relationship ≠ effective access.
Implement or finish the following:

* Distinct platform roles and entity-level roles.
* Explicit ownership and partnership relationships.
* Entity membership, invitations, account activation, and revocation.
* Independent personal books and independent business entities.
* Parent-child, branch, subsidiary, sibling, ancestor-descendant, reporting-only, and shared-service relationships with explicit access policies.
* An entity-local custom role builder.
* Role assignment and role-holder management.
* Fine-grained permissions, data-scope controls, delegation, expiry, and revocation.
* A centralized permission-evaluation mechanism.
* Consistent backend/API and database-level enforcement.
* Complete audit trails for security-sensitive changes.

An entity creator is not automatically its legal owner, platform administrator, or authorized user of unrelated entities. A person owning multiple entities must not automatically gain access to all their records merely because the same person owns them.
Support multiple independent root entities and arbitrary practical hierarchy depth. A parent entity's ability to view aggregate reporting must not automatically grant it permission to inspect every child entity's individual transactions.
Prevent hierarchy cycles and unintended access expansion. Hierarchy changes require validation, impact analysis, appropriate authorization, atomic updates, and auditing.
The custom role builder must support:

1. Role name, description, and entity scope.
2. Starting from a blank role or a validated template.
3. Feature/module selection.
4. Granular permissions.
5. Record and data scopes.
6. Hierarchy access.
7. Sensitive financial operations.
8. Delegation limits and expiry.
9. A preview of effective permissions.
10. Role saving and separately controlled assignment.
11. Audited updates and visibility into affected role holders.

Saving a role must not silently assign it to its creator. Copying a role must not copy its members or bypass destination-entity permissions. A user must not grant permissions they do not possess or escalate privileges through delegation.
Permissions must distinguish, where applicable, discovering, viewing, viewing amounts, viewing details, creating, editing drafts, submitting, approving, posting, reversing, reconciling, closing periods, exporting, sharing, managing, and deleting where deletion is legitimately supported.
A permission to view must not automatically grant permission to view amounts, export records, manage the entity, approve transactions, or read unrelated private data.
Enforce authorization independently of client UI in APIs, PostgreSQL policies/RLS, RPCs, views, storage, searches, reports, exports, notifications, and generated documents. Do not trust client-supplied entity IDs, roles, ownership declarations, or authorization claims.
Test direct API/database access attempts, privilege escalation, membership revocation, concurrent role edits, role changes during an operation, delegation expiry, duplicate invitations, hierarchy changes, and restricted information leaking through aggregates, search results, exports, notifications, or reports.
6. Authentication, onboarding, and account security
Continue or complete the actual authentication and account lifecycle, including invitations, account activation, login, session management, password recovery, access revocation, and safe account administration.
The authorized administrator can create or invite an account and issue a temporary credential or activation mechanism. The invited user must activate the account and establish their own permanent credentials and security setup.
Do not implement silent account impersonation. Administrator-assisted support or migration must be explicitly authorized and performed under the responsible operator's identity with appropriate auditing.
When existing personal books need linking to a new account, preserve the existing records and their ownership. Prevent duplicates or accidental transfers of ownership. Any authorized administrative linking or migration action must be explicit, scoped, validated, and audited.
Security expectations include:

* Secure password hashing and recovery.
* TLS for network communication.
* Proper token/session lifecycle and revocation.
* Least-privilege credentials and access.
* Secure Android storage for sensitive authentication tokens.
* Appropriate MFA, biometric, or M-PIN support where the existing product scope and implementation justify them.
* Sensitive-screen privacy, including consideration of recent-app previews.
* Secure key management and encrypted backups.
* Auditable privileged operations.
* Safe handling of configuration and secrets.

Review the existing amount-level encryption requirement and its actual implementation. Investigate its security, correctness, usability, key recovery, reporting, and performance implications. If it is sound and maintainable, preserve and test it. If a specific layer is genuinely impractical or undermines correctness, document the evidence and trade-offs and use a defensible production-grade alternative for that layer. Never silently remove a security control or claim an alternative provides equivalent protection without establishing that it does.
7. Accounting engine and transaction integrity
The financial engine must be reliable before dependent Flutter screens are considered complete.
Implement or verify:

* Correct double-entry or otherwise valid entity-specific accounting rules where applicable.
* Exact decimal monetary calculations with correct currency precision; never rely on binary floating-point for financial amounts.
* Balanced entries and entity/fund-level accounting invariants.
* Receivables, payables, liabilities, loans, repayments, reimbursements, distributions, drawings, capital, and supported income/expense classifications.
* Outstanding amount = original obligation minus properly allocated settlements, subject to valid adjustments.
* Allocations that never exceed authorized or available amounts.
* Transfers with coherent source decreases and destination increases where the accounting nature requires both sides.
* Period closing and opening/closing balances.
* Draft, submitted, approved, posted, reversed, and settled states as appropriate.
* Immutable posted financial history or a properly controlled correction/reversal mechanism.
* Complete, attributable, timestamped audit records.
* Safe treatment of partial settlements, overpayment attempts, repeated requests, concurrent posting, and transaction reversal.
* Validation preventing accidental duplicate posting or inconsistent linked records.

A financial transaction must be atomic: all required financial entries and corresponding state changes succeed together or fail together. Prevent partial commits, stale balances, duplicate effects, lost updates, invalid allocations, race conditions, and silent correction of posted data.
Use appropriate database transactions, constraints, isolation, locking, idempotency, indexes, and conflict handling. Investigate deadlocks and retry only where safe. Do not implement retry logic that can duplicate financial effects.
Reversals and settlements
Complete reversals and settlements with their real accounting consequences, permissions, audit records, concurrency protection, and UI integration.
A reversal must correctly offset the original posted effect and retain the relationship to the original transaction. It must not delete financial history or silently rewrite the original record.
Settlements must support correct allocation, partial payment, outstanding balances, and the actual parties' obligations. Do not create debt or a receivable just because two transactions are linked.
Expenses and money custody
Keep personal and firm expenses separate. A personal expense must not reduce firm funds unless the economic event legitimately involves the firm.
Record the actual payer or money source separately from the entity bearing the expense. If these differ, record an owed/settlement relationship only where a real obligation exists.
For common expenses involving multiple entities, let the authorized user enter the exact amount attributable to each entity. Never split amounts automatically without an explicit, justified user-approved rule.
For handovers, retain the previously agreed distinction between pending and posted states. Where recipient acknowledgement is required by policy, posting must happen only after valid acknowledgement. If the recipient's configured policy allows immediate posting, follow that policy. A sender must not override the recipient's configured requirements. Preserve atomicity, audit history, and duplicate prevention.
8. Database, backend, and API completion
Finish the existing database and backend rather than relying on client-side calculations or fake local state.
Required engineering practices:

* Review and complete schema migrations, foreign keys, constraints, indexes, and rollback or recovery procedures.
* Use a coherent API/service architecture and a centralized validation and authorization strategy.
* Enforce entity isolation and financial invariants at the appropriate backend and database boundaries.
* Handle concurrent transactions, stale updates, duplicate requests, failures, and unauthorized access consistently.
* Keep credentials, tokens, and secrets out of source code and client bundles.
* Version and test migrations.
* Make all financial commands idempotent where retrying a request is possible.
* Log meaningful security and operational events without exposing secrets or unnecessary sensitive financial information.
* Avoid excessive queries, unbounded scans, N+1 patterns, and unsafe aggregate calculations.
* Ensure API contracts, validation rules, pagination, filters, and error responses are coherent and documented.

If Supabase is used, review RLS policies, RPC security, grants, function ownership, `SECURITY DEFINER` usage, search paths, and service-role boundaries. Test with actual least-privileged authenticated users, not only elevated development credentials.
Do not treat a successful database connection as evidence that authorization, financial logic, or the complete backend is correct.
Run PostgreSQL 17 compatibility tests. If a development workaround currently uses another PostgreSQL version, retain it only as a temporary development aid and do not misrepresent it as target-version validation.
9. Flutter application: fully functional integration
Finish the actual Flutter app and connect every in-scope screen to real backend functionality.
Audit the full application route by route, feature by feature, and action by action.
For every screen verify:

* Correct navigation and entity context.
* Correct permission-aware visibility and backend authorization.
* Real data loading and refreshing.
* Accurate validation and financial calculations.
* Loading, empty, success, error, offline/connectivity-loss, conflict, and permission-denied states as relevant to an online-only product.
* Duplicate-tap prevention and safe handling of retries.
* Correct save, submit, approve, post, reverse, settle, cancel, and confirmation behaviour.
* Clear display of pending versus posted transactions.
* Responsive layouts, accessibility, keyboard behaviour, and sensible form state.
* Consistent design tokens, reusable widgets, and maintainable code.
* Accurate notifications, badges, totals, reports, and balances based on authorized source data.

Build complete user journeys rather than isolated screens. For example, a user should be able to create a legitimate transaction, validate it, submit or approve it according to policy, post it atomically, inspect its effect on the correct books, settle or reverse it when permitted, and see consistent updated balances and reports.
No fake buttons, dummy balance cards, hardcoded permissions, fabricated transactions presented as real, disconnected screens, placeholder success responses, or unfinished navigation.
For any function that is intentionally out of scope or blocked, communicate this accurately in the UI or documentation instead of pretending it works.
Keep the UI premium, modern, responsive, and simple enough for everyday use. Minimize unnecessary clicks while preserving correct approvals, confirmations, and accounting integrity.
10. Reports, search, exports, and sharing
Complete the required statements, ledgers, account/fund views, outstanding reports, transaction history, settlements, dashboards, period reports, and other in-scope accounting views.
Every report, global search, aggregate, export, notification, document, and share operation must honor the same effective permissions and entity boundaries as the underlying records.
Implement controlled PDF/CSV/document generation and WhatsApp-friendly sharing where supported:

* Select the authorized recipient and entity scope.
* Filter records by the requested date range and report type.
* Preview the generated information.
* Require explicit confirmation before disclosure.
* Prevent unauthorized records or hidden amounts from leaking into shared documents.
* Use appropriate secure access, expiry, and audit controls where applicable.
* Keep the sender's identity and sharing event auditable.

Do not use screenshots as a substitute for proper financial statements or transaction evidence.
11. Implementation order
Inspect the live repository first and adapt this sequence to actual dependencies. Preserve completed work and avoid redoing tasks unnecessarily.
Phase A — Audit and baseline

* Inspect current work, Git state, architecture, specifications, schema, migrations, tests, build setup, and known defects.
* Establish what can actually be run and tested in this environment.
* Record a concise implementation checklist.

Phase B — Close authorization foundations

* Finish custom entity roles and role assignments.
* Finish controlled permission delegation and revocation.
* Finish explicit hierarchy relationships and grants.
* Implement one consistent backend permission-evaluation mechanism.
* Enforce D-038 Super Admin restrictions and authorized support-access rules.
* Add or correct database-level enforcement, audit trails, and regression tests.

Phase C — Authentication and backend API

* Finish account onboarding and secure login.
* Implement and validate real API/service endpoints.
* Ensure every protected operation enforces authorization server-side.
* Verify user/entity isolation and session revocation.

Phase D — Financial engine

* Implement and verify F8/F9 classifications, the eight-scenario matrix, transaction traceability, and owner-benefit approvals.
* Complete accounting dependencies, settlement, reversal, reconciliation, and period closing.
* Verify monetary precision, idempotency, concurrency safety, atomicity, and financial invariants.

Phase E — Flutter integration

* Connect existing screens and forms to real backend functionality.
* Implement missing screens, navigation, validation, error handling, permission-aware UI, reports, and end-to-end user journeys.
* Eliminate mock behaviour and nonfunctional controls from production paths.

Phase F — Remaining application modules

* Complete the other documented modules and workflows discovered in the repository.
* Ensure that authentication, permissions, finance, reports, settings, account management, and sharing are integrated rather than implemented as disconnected features.

Phase G — Complete verification

* Run formatting, static analysis, unit tests, integration tests, database tests, security/authorization tests, accounting matrix tests, concurrency tests, regression tests, and builds that the environment supports.
* Fix discovered failures and rerun relevant tests.
* Verify PostgreSQL 17 compatibility, including schema migration and critical transaction tests.
* Build the Android APK and verify the build artifact. Install and run it on a device if available.
* Record any tests that could not run and the precise reason.

Phase H — Delivery and operational readiness

* Update setup, environment configuration, migrations, deployment, backup/recovery, access-control documentation, known risks, and testing instructions.
* Report implemented modules, evidence, outstanding issues, necessary external configuration, and remaining release blockers.

12. Required testing strategy
Write and execute automated tests against real application logic wherever the environment permits. Do not rely solely on mock-based unit tests.
At minimum, cover:
Authorization

* Super Admin cannot access private firm books solely through platform privileges.
* Properly scoped owners can access their own entity.
* Users cannot cross into unrelated entities.
* Parent, child, sibling, and reporting relationships behave according to explicit grants.
* Custom roles cannot grant authority beyond the creator's permissions.
* Viewing permissions do not silently grant amount visibility, exports, approvals, or management.
* Revoked membership and expired delegation stop working.
* Direct API/database calls cannot bypass authorization.
* Sensitive values do not leak through search, notifications, reports, PDFs, totals, or exports.
* Authorized support access expires or is revoked correctly and is audited.

Financial correctness

* All eight F8/F9 combinations.
* Firm expense does not automatically become owner's personal income.
* Gifts, donations, owner payments, remuneration, loans, drawings, capital, reimbursements, and distributions are validated by actual purpose and context.
* Ambiguous or inconsistent classifications are flagged rather than silently posted.
* Owner-benefit approval, threshold enforcement, independent approval, self-approval prevention, and the configured single-owner workflow.
* Cross-book traceability without duplicated money movement.
* Partial settlements, outstanding balances, repayments, reversals, and linked transactions.
* Duplicate requests, insufficient or stale balances, over-allocation, concurrent posts, and failure during atomic commits.
* Period closing and opening balances.
* Personal expenses do not incorrectly reduce firm balances.

Application integration

* Real login and logout.
* Account invitations and activation.
* Entity creation, membership, role assignment, and scoped access.
* End-to-end creation and posting of transactions.
* Correct UI updates after posting, settling, reversing, or revoking access.
* Correct report generation and permission-safe sharing.
* Error recovery, loading states, and duplicate-submission protection.

Use separate test entities and users to prove isolation. Include negative tests. A test that proves a permitted request succeeds is not sufficient without testing unauthorized variants.
Run concurrency tests using multiple actual database connections for the critical financial paths when possible. Do not claim concurrency safety based only on single-threaded tests.
13. Engineering and code quality requirements

* Keep modules cohesive, reusable, typed, and maintainable.
* Follow the project's existing conventions when sound; refactor only where the benefits justify the risk.
* Avoid giant files, duplicated permission checks, repeated financial rules, hidden global state, circular dependencies, unsafe dynamic SQL, hardcoded business identities, and overcomplicated abstractions without a clear purpose.
* Use migrations for schema changes; do not rely on undocumented manual database edits.
* Make errors understandable to users without exposing stack traces, SQL internals, or secret information.
* Use structured logging and observable failure handling where appropriate.
* Preserve accessibility, responsive UI, and maintainable styling.
* Add test coverage for any new critical financial or authorization behaviour.
* Document important design decisions and their consequences.
* Resolve conflicting legacy documentation in favour of the latest confirmed decisions in this prompt, and record the resolution rather than leaving contradictory rules active.

If a `claude-reflect` hook or another unrelated tooling hook fails because of Windows paths, spaces in a user-directory path, or environment issues, investigate and fix it separately if feasible. Do not let an unrelated hook failure prevent progress on Finly. Do not modify financial application logic merely to work around a development-tool hook.
14. Definition of complete
The application is not complete simply because it compiles or because the main screens exist.
Finly is ready for a production-release assessment only when:

* All documented in-scope modules have been implemented or explicitly classified as a release blocker with a justified explanation.
* The Flutter application is integrated with the actual backend.
* Authentication, permissions, entity isolation, and D-038 are enforced and tested.
* The approved accounting rules and F8/F9 matrix are implemented and tested.
* Transactions, settlements, reversals, and related financial state changes are correct, auditable, and safe under retries and concurrency.
* No critical workflow relies on fake logic, mock balances, hardcoded permissions, or disconnected UI.
* Relevant automated tests pass, and failures are resolved or transparently listed.
* PostgreSQL 17 compatibility has been tested and evidenced.
* The Android build and deployment procedures are documented and verified to the extent possible.
* Remaining security issues, external dependencies, configuration requirements, and release blockers are explicitly documented.
* Future maintainers can understand, deploy, test, and safely extend the project.

Do not label the application production-ready merely because a build succeeds. A successful build is one verification step, not proof of accounting correctness or security.
15. How to execute this prompt
Start now:

1. Inspect the repository's current state and identify the exact point where development stopped.
2. Check the current specifications and documentation against every confirmed rule in this prompt.
3. Provide a short status summary of verified completion, missing work, risks, and the next concrete implementation task.
4. Immediately continue implementing the next incomplete, highest-priority dependency.
5. After each coherent change, run the most relevant checks, fix failures, update documentation, and continue into the next dependency.
6. Keep a persistent checklist in the repository so progress survives context limits or session restarts. Mark items complete only when there is evidence.
7. If the current session reaches a context or execution limit, leave a continuation document identifying the exact completed changes, test results, Git state, current blockers, and the exact next action. The next session must read this document and continue rather than restarting the audit or repeating finished work.

Final operating instruction
Your goal is a complete, integrated, secure, reliable Finly application—not a demo, not a prototype, not only an architecture, and not a list of future tasks.
Inspect first. Preserve what is correct. Implement what is missing. Validate the real accounting behaviour. Test authorization and concurrency. Connect the Flutter application. Build and verify. Fix failures. Continue until all achievable in-scope work is completed, and be completely honest about anything still unverified or blocked.
Begin by examining the repository and then execute the work. Do not stop after writing a plan.
