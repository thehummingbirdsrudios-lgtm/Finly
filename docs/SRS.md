# Finly — Software Requirements Specification

## 1. How to read this

- **Every sentence of the [source documents](source/README.md) is a requirement.** They are incorporated here by
  reference, in full; nothing in them is optional unless marked FUTURE. This SRS gives the requirements stable IDs,
  states the key ones as testable "shall" statements, adds the non-functional targets, and traces every source part
  to the documents and tests that carry it.
- IDs look like `FR-LEDGER-03` (functional) and `NFR-PERF-02` (non-functional). The **Source** column cites the
  build specification part (`H-A AC6`) or add-on (`ADD-06`). Where the source says more, the source governs.
- Each requirement gets one or more tests in [TEST_PLAN.md](TEST_PLAN.md) (`T-…` IDs) as its module is built.

## 2. Glossary (BUILD_PROMPT AC1 — enforced in schema, code, UI and reports)

| Concept | Meaning | Is NOT |
|---|---|---|
| Accounting entity | A party with its own self-balancing books: each firm, each person with personal finance, each configured pool | A user account or a money location |
| Ledger account | A classified bucket in an entity's chart of accounts: asset, liability, equity / net assets, income, expense | The user-facing "Account / Khata" |
| Money location (Account, Khata) | Where value sits: Tijori, Savan Bank, JSK Wallet, Wardrobe. Maps to one asset ledger account per owning entity holding value there | Ownership — one location can hold several entities' money |
| Fund (Hissa) | A designated pool of an entity's net assets, carried as a dimension on every journal line | A location or an entity |
| Ownership | Which entity (and fund) has the economic claim — the books the asset sits in | Physical custody |
| Holder / custodian | The person physically holding cash now | The owner or the handler |
| Master transaction | The real-world event ("₹45,000 Angadiya visit"), ID like `TX-20261008-001245` | A journal entry |
| Journal entry | One balanced accounting record inside a master transaction (Σ Dr = Σ Cr) | A row with an amount |
| Journal line | One debit or credit to one ledger account, with all its dimensions | A transaction |
| Balance | Σ posted lines for an account and dimensions as of a date — derived, never typed | A stored editable number |
| Outstanding (open item) | An unsettled obligation: original, settlements, remaining | The ledger account it posts to |
| Receivable / payable | Asset: someone owes this entity / liability: this entity owes someone | Income / expense |
| Liability | Any present obligation: payables, due-to, reimbursements payable, loans, advances received | Only payables |
| Advance | The giver's asset: money handed out to be accounted for | An expense when given |
| Reimbursement | Payable of the entity that benefited, receivable of the person who paid | A transfer |
| Settlement | A journal that reduces or closes a matched open item | An unrelated payment |
| Transfer | Movement between asset ledger accounts of the same entity; no income or expense | A cross-entity movement |
| Allocation | Assigning an amount to funds, entities or categories | A physical movement |
| Adjustment | An explicit, approved journal correcting a known difference | A balance overwrite |
| Reversal | The exact mirror of an original journal, linked to it | A delete |
| Correction | A reversal plus a new correct journal, linked | An edit of a posted line |
| Reconciliation | Comparing a ledger balance with external or physical truth, investigating, resolving | Changing the ledger to match |
| Closing balance | Opening + period movements of a closed period; the next opening | A typed figure |
| Avak / Javak | Display labels for money into / out of the location being viewed (Credit / Debit in the UI) | Accounting debit and credit — posting rules map them |
| M-PIN | An app-unlock credential for one device | The account password |

## 3. Functional requirements

| ID | The system shall… | Source |
|---|---|---|
| **Scope** | | |
| FR-SCOPE-01 | ship an Android client only, with a client-independent backend, database, financial engine, authorization, security and audit reusable by future web and iOS clients without duplicated logic | A1, ADD-01, ADD-03, ADD-04 |
| FR-SCOPE-02 | contain no AI assistant, LLM call, AI search, natural-language or voice entry; all "intelligence" is deterministic and explainable | A2 |
| FR-SCOPE-03 | be built in Flutter + Dart, Android first | ADD-04 |
| **Authentication, startup, sessions** | | |
| FR-AUTH-01 | keep account sign-in, app unlock (biometric, M-PIN, remembered session) and step-up as three separate checks | N1 |
| FR-AUTH-02 | run startup as launch → splash → initialise → secure session check → configuration check → unlock or sign in → destination, handling first launch, returning user, active and expired session, logout, new device, disabled and locked account, no network and initialisation failure | ADD-07, N4 |
| FR-AUTH-03 | force first-login change of a temporary password, then offer M-PIN and biometric setup | ADD-06, ADD-07, N2 |
| FR-AUTH-04 | never store, display, log or recover a password or M-PIN; hash them; Remember Me stores a revocable session, never the password | A5, N3, N5, N7 |
| FR-AUTH-05 | use the Android platform biometric prompt, store no biometric data, and invalidate local unlock when device security changes | N6 |
| FR-AUTH-06 | provide forgot-password and forgot-M-PIN as reset flows, MFA, recovery codes, device and session lists, remote revocation, lost-device handling, inactivity lock and secure-screen handling | N5–N11 |
| FR-AUTH-07 | require configurable step-up for high-risk actions | N12 |
| **Setup and users** | | |
| FR-SETUP-01 | provide a role-aware first-time setup wizard with progress, Back/Next, Skip only where safe, validation, autosave, confirmation and resume without duplicating data | ADD-07, UX7 |
| FR-USER-01 | create the seed users (Krish: Super Admin + Owner; Shaileshbhai, Savan: Admin; Sujal, Devanshu, Heet, Sagar: Worker) as bootstrap data, never as code | ADD-06, ADD-07, F3 |
| FR-USER-02 | let Super Admin add, edit, change role, configure permissions, activate/deactivate, suspend, reset password, reset M-PIN, revoke devices/sessions and archive users from the app; "remove" archives any user with history | ADD-06, ADD-07, T2, H15 |
| FR-USER-03 | generate a username and temporary password for new users, delivered without plaintext storage or logging | ADD-06, ADD-07 |
| FR-USER-04 | deliver Krish's first temporary password through a one-time local bootstrap, never in source, Git, APK, documents, logs or screenshots | ADD-06, ADD-07 |
| **Authorization and privacy** | | |
| FR-AUTHZ-01 | enforce RBAC + ABAC + resource, record, field, confidentiality, ownership and context rules on the server for every request | L1, A5 |
| FR-AUTHZ-02 | treat discover, view, view amount, view details, create, edit, reverse, approve, reconcile, export, each share format, copy, download, print, attachments, audit and manage as independent permissions | L2, Q4 |
| FR-AUTHZ-03 | keep personal finance visible only to its owner unless the owner grants access; audit every grant and revoke; Super Admin gains no financial visibility from administering | A4, H13 |
| FR-AUTHZ-04 | aggregate only the viewer's authorised data before any total, chart, count, search result, suggestion, notification, export, PDF or message | L12, UX4 |
| FR-AUTHZ-05 | apply explicit deny > explicit allow > role default, with inheritance, exceptions, temporary access and audited break-glass | L8, L9 |
| FR-AUTHZ-06 | shape navigation, screens, buttons, settings, search, totals and data to each person's actual permissions | ADD-06, ADD-07, UX1 |
| FR-AUTHZ-07 | offer View As User and a permission simulator that never reveal more than the simulating admin may see | L15 |
| **Accounting core** | | |
| FR-LEDGER-01 | record every movement of value as one master transaction with balanced double-entry journals per entity and per fund | A7, H7, AC0, AC6 |
| FR-LEDGER-02 | keep the AC1 concepts distinct in schema, logic, UI and reports | A7, AC1 |
| FR-LEDGER-03 | enforce every AC6 invariant before commit and re-verify them with a scheduled, on-demand and pre-close Integrity Verifier; any violation rejects the whole operation | AC6, AC7 |
| FR-LEDGER-04 | require an explicit classification for any value crossing entities and keep inter-entity dues reciprocal | AC3 |
| FR-LEDGER-05 | derive every balance, remaining amount and closing balance from posted lines; store whole rupees as exact integers | H14, H16, AC6 |
| FR-LEDGER-06 | hash-chain journals for tamper evidence | AC7 |
| FR-LEDGER-07 | produce exactly the journal lines of every AC10 worked example | AC10, V2 |
| FR-LEDGER-08 | drive postings from versioned posting-rule templates with a journal preview that can never produce an unbalanced journal | AC15, H7 |
| **Transactions and the engine** | | |
| FR-TXN-01 | accept the requested operation from the client, never resulting balances, and run the full 30-step precondition pipeline before posting | J1, J2 |
| FR-TXN-02 | commit journal, lines, snapshots, open items, allocations and audit in one database transaction, or nothing | J4 |
| FR-TXN-03 | guarantee one posting per idempotency key across double taps, retries, restarts and offline replay | J3, EC5 |
| FR-TXN-04 | follow the allowed-transition state machine Draft → Validating → Pending approval → Approved → Posting → Posted, with Rejected, Failed, Cancelled, Reversed, Corrected | J5, EC5 |
| FR-TXN-05 | support maker/checker/approver segregation and configurable high-value thresholds | J6 |
| FR-TXN-06 | compute available balance as current − reserved − locked − pending outgoing − committed obligations, rechecked at commit | AC9, J3 |
| FR-IMPACT-01 | compute the full impact of every change, show an Impact Preview for important changes, and refuse conflicting changes with a permission-safe explanation and resolution path | G3–G5 |
| **Money domains** | | |
| FR-EXP-01 | support expense types, expense events, fixed/percentage/item splits with the deterministic remainder rule, reimbursements and advances | H9, AC10 |
| FR-OUT-01 | manage receivables, payables, advances, reimbursements and inter-entity dues as open items with matched settlements and aging | H11, AC11 |
| FR-HAND-01 | record cash handover chains with owner, holder and location kept separate | H10 |
| FR-IC-01 | post inter-company movements with configurable inter-company accounts | H12 |
| FR-CORR-01 | never overwrite or delete posted history; use reversal, correction and adjustment; archive referenced master data; lock closed periods | H15, AC8 |
| FR-REC-01 | reconcile cash, vault, bank, fund and ownership with expected, actual, difference, investigation, resolution and history, never silently adjusting | S |
| FR-EXC-01 | detect the J8 exceptions deterministically and explain problem, possible reason, affected authorised records and suggested action, never changing records | J8, AC17 |
| FR-CLOSE-01 | run the month-end close checklist and close periods per AC12 | J9, AC12 |
| **Reports, search, notifications** | | |
| FR-RPT-01 | produce the AC14 statements and the R3 reports with the same privacy model, a report builder and import/export under separate permissions | AC14, R3, R4 |
| FR-SRCH-01 | provide global, permission-filtered search with deterministic multi-term parsing, filters, recents, saved searches and one-tap actions | UX4, P6 |
| FR-NOTIF-01 | send configurable, permission-filtered notifications with full/masked/generic modes and lock-screen policy | R5 |
| **Sharing and documents** | | |
| FR-SHARE-01 | share only generated Message, Photo Proof, PDF, Secure PDF and Secure Viewer content built from authorised data; never screenshots | A3, Q1, Q6 |
| FR-SHARE-02 | require authorisation → recipient verification → exact preview → review → step-up where required → Verify & share, and invalidate verification on any change | A3, Q2, Q3 |
| FR-SHARE-03 | report delivery honestly (no "Sent" without channel confirmation) | Q3 |
| FR-DOC-01 | offer each secure-document control as OFF / DEFAULT ON / MANDATORY with the stricter policy winning, presets, expiry and revocation | Q8 |
| **Experience** | | |
| FR-UX-01 | follow the K-UX priorities, navigation rules, tap budgets, smart defaults, inline validation, error prevention and every K3 state on every screen | A8, K3, K-UX |
| FR-UX-02 | provide the centralised design system — tokens, components, financial visual language, motion language, decoration — with states never shown by colour alone | K, ADD-04, ADD-08, ADD-09 |
| FR-OFF-01 | allow permitted offline preparation with an encrypted queue, server-side re-validation on sync, conflict review and no silent drops | P7, EC5 |
| FR-I18N-01 | support English, Hindi and Gujarati and owner-defined display labels that never change behaviour | P8 |
| **Administration and operations** | | |
| FR-ADMIN-01 | let Super Admin configure every master, rule, template, policy and label without code, versioned and audited | T1, T3–T7 |
| FR-FILE-01 | validate, protect and authorise every attachment | U1 |
| FR-AUDIT-01 | keep a tamper-evident audit log of every event listed in U2 | U2 |
| FR-BKP-01 | run automated, encrypted, integrity-checked, restore-tested backups | U3 |
| FR-API-01 | expose a versioned API with authentication, object- and field-level authorization, validation, idempotency, rate limits, pagination and safe errors; never return hidden fields | O |

## 4. Non-functional requirements

Targets marked *(proposed)* are confirmed at Gate 1 (devices) and Gate 4 (tap budgets).

| ID | Requirement | Source |
|---|---|---|
| NFR-PRIO-01 | When requirements conflict: financial integrity → security → privacy → authorization → data integrity → durability → auditability → reliability → performance → ease of use → visual polish | B2 |
| NFR-SEC-01 | Application-level authenticated encryption of sensitive values; keys never on Android; passwords and PINs hashed; mature libraries only | A5, M |
| NFR-SEC-02 | Zero-trust: least privilege, explicit authorization, defense in depth, secure defaults, complete auditability | B3 |
| NFR-PRIV-01 | Privacy by design and data minimisation; data inventory kept current | A4, ADD-02, [privacy/data-inventory.md](privacy/data-inventory.md) |
| NFR-PERF-01 | Cold start to the unlock screen ≤ 2.0 s on the floor device *(proposed)* | ADD-01, ADD-02 |
| NFR-PERF-02 | 60 fps scrolling and animations on the floor device; no jank or ANRs; no main-thread I/O | ADD-02, ADD-03, ADD-08 |
| NFR-PERF-03 | Posting round trip ≤ 1.5 s p95 on 4G; search results ≤ 500 ms p95 server time *(proposed)* | ADD-02 |
| NFR-COMPAT-01 | Support older Android versions where reasonably possible; minimum SDK fixed at Gate 1 | ADD-01, ADD-02 |
| NFR-A11Y-01 | WCAG 2.2 AA: contrast, 48 dp targets, 200 % text, TalkBack, reduced motion | K2, UX8 |
| NFR-REL-01 | Atomic financial operations; idempotent retries; graceful degradation offline; no silent failure | J4, ADD-02 |
| NFR-OBS-01 | Structured logs, error tracking, health checks and performance measurements without secrets, PII or unauthorised values | O, ADD-02 |
| NFR-MAINT-01 | Clean architecture with one-way dependencies; SOLID; tests per Part V; documentation matches code | ADD-02 |
| NFR-COST-01 | ₹0 per month running cost target on free tiers for private use | ADD-01 |
| NFR-PROC-01 | Every change is a focused, tested, reviewed commit; never continue from an uncommitted change | ADD-05, C2 |

## 5. Traceability

| Source | Carried by |
|---|---|
| A Overrides | All documents; [RULES](RULES.md) §1; FR-SCOPE, FR-AUTHZ-03, FR-SHARE, NFR-SEC |
| B Role, priorities | [RULES](RULES.md); NFR-PRIO-01, NFR-SEC-02 |
| C Execution protocol | [RULES](RULES.md); [TASKS](../TASKS.md) gates |
| D Stack gate | [DECISIONS](DECISIONS.md) — Stack Decision Record |
| E Structure, docs | This repository's layout; [RULES](RULES.md) |
| F Product definition | [PRD](PRD.md) |
| G Flow maps, impact | [FLOWS](FLOWS/README.md); FR-IMPACT-01 |
| G-EC Edge cases | [TEST_PLAN](TEST_PLAN.md) Edge-Case Matrix |
| H Domain model | §2 glossary; FR-LEDGER, FR-EXP, FR-OUT, FR-HAND, FR-IC, FR-CORR; [ARCHITECTURE](ARCHITECTURE.md) |
| H-A Accounting core | §2; FR-LEDGER; [DECISIONS](DECISIONS.md) — Accounting Model Record |
| I Database | [ARCHITECTURE](ARCHITECTURE.md) (schema at Gate 3) |
| J Financial engine | FR-TXN, FR-EXC, FR-CLOSE |
| K Design system | [DESIGN](DESIGN.md); `design-system/`; FR-UX-02 |
| K-UX Simple, fast UX | [DESIGN](DESIGN.md); FR-UX-01, FR-SRCH-01 |
| L Authorization | FR-AUTHZ; [SECURITY](SECURITY.md) |
| M Encryption | NFR-SEC-01; [SECURITY](SECURITY.md) |
| N Authentication | FR-AUTH |
| O Backend and API | FR-API-01; [ARCHITECTURE](ARCHITECTURE.md) |
| P Android app | FR-OFF-01, FR-I18N-01; [DESIGN](DESIGN.md) |
| Q Sharing | FR-SHARE, FR-DOC |
| R Dashboards, reports, notifications | FR-RPT-01, FR-NOTIF-01 |
| S Reconciliation | FR-REC-01 |
| T Super Admin, configuration | FR-ADMIN-01, FR-USER |
| U Files, audit, backup, incidents | FR-FILE-01, FR-AUDIT-01, FR-BKP-01; [SECURITY](SECURITY.md) |
| V Testing | [TEST_PLAN](TEST_PLAN.md) |
| W Build order | [TASKS](../TASKS.md) |
| X Pre-production gate | [TEST_PLAN](TEST_PLAN.md) — release checklist |
| Y Golden rules | [RULES](RULES.md) §1 |
| Z Future | [PRD](PRD.md) §5; [ARCHITECTURE](ARCHITECTURE.md) |
| ADD-01 Free backend, production, Git | FR-SCOPE-01, NFR-COST-01, [DECISIONS](DECISIONS.md), [RULES](RULES.md) |
| ADD-02 Engineering rules | NFR-MAINT, NFR-PERF, NFR-OBS; [RULES](RULES.md) |
| ADD-03 Mobile only | FR-SCOPE-01, NFR-PERF-02 |
| ADD-04 Flutter + Dart | FR-SCOPE-03; [DECISIONS](DECISIONS.md) |
| ADD-05 Commit every change | NFR-PROC-01; [RULES](RULES.md) |
| ADD-06 Users, first login, roles | FR-AUTH-03, FR-USER, FR-AUTHZ-06 |
| ADD-07 Finly branding, startup, wizard | FR-AUTH-02, FR-SETUP-01, FR-USER; `design-system/` brand |
| ADD-08 UI/UX, motion, decoration | FR-UX-02, NFR-PERF-02; [DESIGN](DESIGN.md) |
| ADD-09 Premium theme | FR-UX-02; [DESIGN](DESIGN.md) |
