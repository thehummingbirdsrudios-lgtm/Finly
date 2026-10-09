# Gate response 03 — Final decisions, database configuration and required technical actions

Received 2026-10-09, recorded verbatim **with one redaction**: the local development database password the owner
typed is replaced by `[redacted]`. The repository is public; the value lives only in the git-ignored
`backend/.env.local` on the owner's machine.

---

Finly — Final Decisions, Database Configuration & Required Technical Actions
Use the decisions below as confirmed requirements. Update `08-open-questions.md`, the relevant accounting and security documentation, project memory, database architecture, and implementation plan accordingly.
Do not ask me to reconfirm decisions already provided here. Continue implementing confirmed requirements while investigating unresolved questions.
Q1 — Entries in Someone Else's Personal Books
Decision: Option B is the default. The receiving person can change their preference to Option A.
Option A — Immediate posting: When money is given to another person as their own, the entry posts immediately in the recipient's personal books and the recipient is notified.
Option B — Acknowledgement required: The entry remains pending until the recipient acknowledges it.
Implement the following rules:

* Option B must be the default.
* The receiving person controls whether to switch to Option A for their own personal books.
* The person giving the money cannot override the receiver's preference.
* Store this preference in the receiving person's personal-book settings.
* Clearly distinguish pending entries from finalized ledger entries.
* When acknowledgement is required, post the relevant financial effects atomically after acknowledgement.
* Record the appropriate notifications, timestamps, acknowledgement status, and audit history.
* Prevent duplicate posting, concurrent acknowledgement conflicts, and inconsistent balances.
* Preserve the original event and its history if an entry is rejected, corrected, or cancelled.

Apply this consistently wherever money or financial entries affect another person's personal books.
Q2 — Encryption of Financial Amounts
Investigate the best practical, production-grade encryption architecture before deciding to remove amount-level encryption.
Finly's existing specification requires sensitive financial amounts to remain encrypted. The current design means PostgreSQL cannot directly perform ordinary arithmetic on encrypted ciphertext.
Evaluate whether the existing design can safely support financial calculations through the backend financial engine, atomic posting, protected balance calculations, scheduled integrity checking, and suitable indexing.
Review the official PostgreSQL documentation:

* https://www.postgresql.org/docs/17/encryption-options.html
* https://www.postgresql.org/docs/17/pgcrypto.html

Preferred solution: retain amount-level encryption
Keep amount-level encryption if it can be implemented securely and performantly.

1. Use established authenticated encryption; do not invent cryptographic algorithms.
2. Keep encryption keys separate from the database, APK, frontend, source code, Git history, and ordinary application configuration.
3. Evaluate a reputable managed key-management service or secure key vault, using envelope encryption where appropriate.
4. Implement key versioning, rotation, access auditing, encrypted backups, and tested disaster recovery.
5. Allow decryption only through authorized backend operations.
6. Benchmark realistic workloads and verify that financial calculations, transaction posting, reports, outstanding balances, and reconciliation remain correct.
7. Ensure failed decryption, lost keys, and integrity-check failures cannot silently corrupt data or cause partial financial posting.

Encryption-key backup and recovery
Before production launch:

* Establish a secure, documented key-recovery strategy.
* Where supported, maintain a protected offline recovery copy of recoverable key material, separate from encrypted data and protected by independent access controls.
* Where keys are non-exportable or provider-managed, use the provider's documented recovery or disaster-recovery process.
* Preserve the key versions required to decrypt historical records and retained backups.
* Test actual recovery and restoration before approving production deployment.

If recovery is not proven to work, do not declare the encryption architecture production-ready.
Authorized fallback: change the encryption approach if necessary
If serious technical investigation demonstrates that amount-level encryption is impractical or compromises financial correctness, reliability, or acceptable performance, you are authorized to remove that specific encryption layer and implement a different production-grade security architecture without waiting for another approval.
Before taking this fallback:

1. Investigate practical alternatives and test them.
2. Explain why the existing encryption approach cannot meet the requirements.
3. Document the security trade-offs, threat model, and residual risks.
4. Implement the strongest practical alternative, including encrypted database/storage volumes and backups, TLS, strict server-side authorization, database access restrictions, secure key management, audit logs, least privilege, and tested recovery.
5. Update the security specification and project documentation to reflect the implementation actually deployed.

Do not pretend storage encryption is equivalent to application-level encryption. Do not leave financial amounts casually exposed, and do not claim the original encryption requirement is satisfied if it has been removed.
Final objective: reliable financial calculations, strong practical confidentiality, secure key recovery, and production-grade performance.
Q3 — Logins for People Who Already Have Financial Books (Q11, Q13)
Decision: The Superadmin creates or invites the account, but my father activates and accesses his own account.
Implement the following workflow.
1. Preserve existing books
If my father already has personal books, ledgers, transactions, balances, or other financial records in Finly, preserve all existing data and link it to his correct account.
Do not create duplicate records, incorrectly change ownership, or alter historical financial meaning.
2. Account creation
The Superadmin can create or invite my father's account and issue a temporary password or one-time activation credential.
3. Account activation
My father must sign in himself, verify his identity as required, and establish his permanent password/PIN and available security settings.
Temporary credentials must expire or become invalid after use.
4. No impersonation
The Superadmin must never sign in as my father, use his credentials to impersonate him, or perform actions that appear to have been performed by him—even during initial setup.
5. Authorized administrative setup
The Superadmin may link existing books, perform migrations, and complete authorized administrative configuration using separate administrative tools.
Every action must be recorded under the Superadmin's own identity.
6. Authorized assistance
If my father needs help accessing or configuring his account, provide a separate, explicitly authorized and appropriately restricted support process.
Record who accessed the account, the reason, when it occurred, the duration, and the actions performed, as appropriate.
7. Security and audit
Maintain a complete audit trail distinguishing Superadmin actions from actions performed by my father.
The Superadmin must never be able to retrieve my father's permanent password, PIN, or biometric credentials.
Final requirement: The Superadmin manages account creation and authorized administrative setup; my father controls his own login identity and credentials. Existing books must remain intact and correctly linked.
Apply this workflow to both existing users who already have financial records and newly created users.
Q4 — F8 and F9 From the Accounting Model
F8 and F9 remain unconfirmed because I need to understand exactly what each question means before deciding.
Before requesting my decision, retrieve their original wording and context from `08-open-questions.md` and the relevant accounting model.
For each question, provide:

1. The exact original question.
2. A brief explanation in simple language.
3. Realistic examples using Finly's money, funds, entities, and ledger entries.
4. The available options and the consequences of each option for accounting, ownership, balances, liabilities, receivables/payables, and settlements, wherever relevant.
5. Your recommended option and a brief explanation of why it fits the existing requirements.

Do not invent my answers or silently change the accounting rules.
Continue implementing confirmed requirements. Pause only the specific work that genuinely depends on F8 or F9.
PostgreSQL — Use the Existing Windows Installation Now
PostgreSQL has already been downloaded on my Windows machine. Use the existing installation now instead of treating the lack of a real PostgreSQL instance as an unresolved blocker.
Database connection details
Use these details to attempt a local connection:

* Host: `localhost` / `127.0.0.1`
* Port: `5432`
* Database password: `[redacted]`
* Database username: Detect the configured PostgreSQL username from the existing installation or local configuration.
* Database name: Inspect the existing databases and select the appropriate development database. Create a dedicated test database if required and authorized.

Do not assume that the password alone is sufficient to connect. Verify the actual username, authentication method, database name, server status, and installed version.
Verify the installation

1. Locate the PostgreSQL installation on Windows.
2. Check the available PostgreSQL client tools and Windows database service.
3. Determine whether the service is running and start it if necessary and authorized.
4. Connect using the supplied connection details.
5. Verify the actual server version through PostgreSQL itself.
6. If connection fails, inspect the service, logs, port configuration, authentication settings, and database username. Investigate and resolve the issue rather than merely reporting that PostgreSQL is unavailable.

Security requirement: Treat `[redacted]` as a local development credential only. Do not hard-code it into application source, Git commits, an APK, production configuration, or logs. Use suitable local secret handling and strong, securely managed credentials for production.
Run the pending database tests
Once the actual PostgreSQL server is available:

1. Run all database migrations against the real server.
2. Run the complete database test suite, including constraints, transactions, and rollback behavior.
3. Run the two-connection concurrency tests.
4. Test simultaneous financial posting, duplicate requests, idempotency, locking, conflicting updates, and financial consistency.
5. Run the database query benchmark and record the actual measurements.
6. Investigate slow queries and improve indexing or query plans where justified.
7. Fix failures and rerun the relevant tests.

PostgreSQL 17 compatibility
The production target is PostgreSQL 17.
The existing in-process test database was upgraded to PostgreSQL 18 because the previous PGlite version crashed on errors raised by database checks. The migrations are intended to avoid PostgreSQL 18-only features, but compatibility must be verified against the real production version.
Therefore:

* Do not assume that a successful PostgreSQL 18 test proves PostgreSQL 17 compatibility.
* If the installed Windows server is PostgreSQL 17, use it for the required migration, integration, concurrency, and benchmark tests.
* If the installed server is another major version, use a real PostgreSQL 17 instance locally or in CI for the final compatibility checks.
* Configure CI to test migrations, database constraints, integration behavior, concurrency, and relevant regressions against PostgreSQL 17.
* Report the actual tested version and results.

Reference: https://www.postgresql.org/docs/17/regress.html
Do not claim that a test passed until it has actually been executed successfully.
Execution Requirements
After recording these decisions:

1. Update `08-open-questions.md`, accounting/security documents, database documentation, and project memory.
2. Investigate and implement the best workable encryption architecture, applying the authorized fallback only if necessary.
3. Verify the existing Windows PostgreSQL installation and connect using the provided development connection details.
4. Run the database migrations, full database tests, concurrency tests, and query benchmark.
5. Verify PostgreSQL 17 compatibility separately if the local server is not PostgreSQL 17.
6. Fix all discovered issues and rerun the relevant tests.
7. Review financial integrity, permissions, encryption, key recovery, migrations, and query performance.
8. Maintain a clean, traceable Git history. Review each change, update relevant documentation, and commit tested, logically grouped changes.
9. Continue building Finly while F8/F9 remain unresolved. Do not stop unrelated development because a specific accounting decision is pending.
10. Report actual accomplishments, test results, unresolved risks, and genuine blockers accurately.

Priority Order
Financial correctness → Security → Data integrity → Reliability → Performance → Maintainability.
The goal is a genuinely production-ready Finly system—not simply passing tests, suppressing errors, or declaring unfinished features complete.
