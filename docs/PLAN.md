# Finly — the consolidated plan

**Revision 1, 2026-10-09.** Written after re-reading every source in [docs/source/](source/README.md): the build
specification, add-ons 01–22, gate responses 01–05 and rulebooks 01–03. The scope is frozen at ADDON-22 (D-041).
This file replaces the old milestone list as the plan of record. [TASKS.md](../TASKS.md) is its checklist, and
[CONTINUATION.md](CONTINUATION.md) records where the last session stopped.

**Precedence when sources differ** (BUILD_PROMPT A6): Part A of the build specification first; then the stricter
security, privacy and integrity reading; then the latest owner decision. Later decisions that override earlier text
are listed in §3.

---

## 1. What Finly is

Finly is a private family-and-business financial operating system:

- one person's own money;
- any number of separate businesses, partnerships, pools and branches;
- every movement of money between them.

It is built as an Android app (Flutter) on one online backend and one PostgreSQL database. A web or iOS client could
be added later without duplicating any rule.

People see *money in, money out, from where, to where, who held it, why*. Underneath, every movement is a balanced
double-entry journal in each book it touches. Every amount is whole rupees, encrypted at rest, and explainable months
later.

**Never negotiable:**
- the backend is the only authority;
- no AI;
- no screenshot as proof, and no external share without preview and explicit confirmation;
- personal finance is private to its owner, and platform administration sees no one's books (A4, D-038);
- nothing posts unless every check passes, and then it posts atomically, exactly once;
- no fake data, no dead buttons, no "success" before the server confirms.

---

## 2. Who uses it and what they must be able to do

| Person | Needs (from BUILD_PROMPT F2, ADDON-06/07, ADDON-21) |
|---|---|
| **Owner / Super Admin** (Krish in the seed) | Run the platform. Own and run several firms. See their whole financial life (net worth, cash by place, who owes whom, what each firm earned and spent). Never see another person's books without that person's grant. |
| **Admin** (Shaileshbhai, Savan in the seed) | Run the firms they are given, with the rights they are given; nothing more |
| **Worker** (Sujal, Devanshu, Heet, Sagar in the seed) | Record entries in assigned places quickly ("blind entry"); see only what is assigned |
| **Family member with own books** (Father) | Their own personal books, private by default; accept or reject entries others record into them |
| **Partner / accountant / auditor** | Exactly the reports and operations their role in that firm allows |

The seed people are **data**, created by the one-time bootstrap. They are never in code (ADDON-14).

---

## 3. Decisions that shape the build (all confirmed — not to be re-asked)

| Topic | Decision | Source |
|---|---|---|
| Client | Flutter + Dart, Android first (minSdk 24, Android 7.0+); iOS and web later on the same API | ADDON-04, D-001, D-014 |
| Backend | Own Deno TypeScript API with its own identity service, on PostgreSQL 17 in the dedicated Supabase project `finly` | D-023, D-034, ADDON-13 |
| **Online only** | No local database, no offline mode, no offline queue. Overrides BUILD_PROMPT P7 and ADDON-02/03 offline text. | ADDON-12, D-031 |
| Money | INR whole rupees as exact integers; no paise, no floats; any multi-currency workflow is out of scope (BUILD_PROMPT H14) | H14, ADDON-16 §2.2 |
| Encryption | AES-256-GCM amounts, blind indexes and hash chains with KEK-derived keys outside the database. Kept, not replaced. Production KEK escrow and a production restore drill are needed before launch. | D-026, D-033, GR-03 Q2 |
| Accounting basis | Accrual (bills when they arrive), every entry balances per fund, monthly close with closing entries | GR-02 F4–F6 |
| Expenses | The payer is never assumed to be the bearer. Personal, firm and common expenses each take exact amounts per entity, with no automatic split. A settlement relationship exists only where an obligation is real. | GR-02, ADDON-19 §7 |
| Handovers | Receiver confirmation is OFF by default and can be switched on | GR-02 F2 |
| Others' personal books | Entries wait for that person's acknowledgement by default. They may switch to immediate posting; the giver cannot override this. | GR-03 Q1, D-029 |
| Accounts | The Super Admin creates or invites an account; the person activates it and sets their own password. No impersonation. Support sessions are consented. Existing books are linked, never duplicated. | GR-03 Q3, D-030 |
| Money given (F8/F9) | Two independent transactions. Purpose, whether it is repayable, and each side's Own/Expense treatment are all explicit and validated together. Income is never mirrored from the other side's expense, and no debt arises unless the money is repayable. | GR-04, GR-05, D-037, D-039 |
| Super Admin | Platform roles open no firm's books. Owners act through explicit, scoped owner roles. | GR-05 §1, D-038 |
| Owner-benefit approval | An entity policy (thresholds, purposes, approver roles); no self-approval; an audited single-owner alternative | GR-05 §4, D-040 |
| Locations | Owner, authorised access list (add vs replace) and current key holder are separate; a location may be unassigned | GR-02 F7 |
| Distribution | A release-signed APK installed directly on the phones | D-017 |
| Backups | Encrypted, to the owner's existing Cloudflare R2 (via the connected tools) | D-015 |
| Errors | Own structured logging and diagnostics; never secrets, tokens or amounts in logs | D-016 |

---

## 4. Where things stand (verified 2026-10-09)

| Layer | State | Evidence |
|---|---|---|
| Database | 17 migrations, about 101 tables; RLS on every table; guards; D-038 enforced (0016); books provisioned by the database. 0001–0014 are deployed to Supabase, **0015–0017 are not yet deployed.** | Catalog-fingerprint parity on 3 channels at 0014 |
| Accounting engine | 17 intents (transfer, transit confirm, expense, bill, give with purpose, income, unidentified receipt, advance give/account, loan, loan repayment, capital, withdrawal, settlement, offset, opening balance, cash adjustment) | 69 engine tests including the F8/F9 matrix and RULEBOOK-03 §72 tests 1–21 |
| Posting service | Idempotent, global lock order, encrypted journals and balances, acknowledgement flow, outbox, automatic monthly periods | Integration tests on PGlite, PostgreSQL 17.11 and 18.6 |
| Identity | Sign-in, temporary → own password, rotating refresh tokens with reuse detection, lockout, sessions | 10 tests, mutation-checked |
| HTTP API v1 | Auth, books, places, parties, summary, open items, entries (list, detail, submit), acknowledge/reject, lookups, firm creation | 5 end-to-end HTTP tests; verify 182 passed / 7 ignored; PG17 and PG18 103/103 |
| Flutter app | Sign-in, forced password change, books, book overview, places, entries, dues and settle, entry forms (spent, received, moved, opening, given), entry detail with share sheet, inbox, new business, add place, settings and sessions | `flutter analyze` clean; 11 unit tests. **Not yet built as an APK or run on a device.** |
| Not started | Approvals, reversal/correction, period close, reconciliation, statements/reports, PDF/secure sharing, notifications, attachments, M-PIN/biometric/app lock, password recovery/MFA, admin user management, custom roles/delegation/hierarchy UI, global search, setup wizard, customizable ledger (ADDON-20), wealth modules (ADDON-21), bank statement import (ADDON-22), Integrity Verifier and exception engine, backups, deployment, i18n, branding assets | — |

---

## 5. Requirement map

Each module lists what the sources require, then its status: ✅ done and tested, 🟡 partly done, ⬜ not started.
"R1"–"R6" refer to the release order in §6.

### 5.1 Identity, sessions and app security — BUILD_PROMPT N, ADDON-06/07, GR-03 Q3
- ✅ Username/password sign-in (Argon2id), throttling and lockout, same answer for unknown users.
- ✅ Temporary password → forced change (activates the account). Rotating refresh tokens. Sessions list and revocation.
- ⬜ R1 Splash and startup flow: session check → configuration check → unlock or login → destination.
- ⬜ R2 App lock: auto-lock on background with a configurable timeout. M-PIN create/confirm/change/forgot/reset/lockout (hashed with a pepper; the table exists). Biometric unlock through Android with device-security-change detection. Step-up for high-risk actions.
- ⬜ R2 Forgot password: a reset by an administrator through a one-time activation code (no email/SMS channel exists). Self-service recovery codes.
- ⬜ R2 MFA (TOTP) mandatory for Super Admin; device list with revoke and "mark lost".
- ⬜ R3 Consented support sessions (0010 table) from the app.

### 5.2 People, users and administration — BUILD_PROMPT T2/T4, ADDON-06/07, ADDON-17 §6
- ✅ One-time first-account bootstrap (`deno task user:create`; the password goes only to a git-ignored file).
- ⬜ R1 Seed the initial users (Krish, Shaileshbhai, Savan, Sujal, Devanshu, Heet, Sagar) as data through the bootstrap.
- ⬜ R2 Super Admin user management in the app: add (generated temporary password or activation code shown once), edit, change role, activate/deactivate, suspend, reset password, reset M-PIN, revoke devices and sessions, archive.
- ⬜ R2 Role-aware UI from effective permissions, not role names.

### 5.3 Access model — BUILD_PROMPT L, ADDON-17, ADDON-18, D-038
- ✅ Ownership, partnership, affiliation and hierarchy as separate records (0014). D-038 enforced (0016). Explicit `entity_owner` / `entity_admin` roles. Firm creation where the creator says whether they are an owner (0017).
- ⬜ R4 Permission registry with metadata and scopes. Membership states and invitations. Role versions. Custom role builder (11 steps) with boundary validation. Role holders with expiry. Delegation records. Hierarchy grants (parent/child/sibling/reporting, never full access by default). Change requests for ownership.
- ⬜ R4 One effective-permission function (`effective_permissions`) used by RLS, API and UI. Amount and field visibility (L4–L6). Confidentiality levels. Explicit deny wins.
- ⬜ R4 UI: entity switcher, hierarchy, entity administration sections, role builder, role holders, change preview. Permission simulator / View-As for authorised admins. Temporary access and break-glass.
- ⬜ R3 Personal-finance owner grants (A4) from the owner's settings.

### 5.4 Entities and master data — BUILD_PROMPT H4–H6/T, ADDON-18 §8, ADDON-20 §3, GR-02 F7
- ✅ Personal books per user. Firm/pool creation, books provisioned empty (no invented balances). Money places with bank details (encrypted numbers, last 4 digits shown). Parties outside Finly.
- ⬜ R2 Full entity creation flow: details, several owners with shares, partners, initial access, permission review, confirm.
- ⬜ R2 Location access list (add vs replace) and current key holder with history. Funds per entity (create, default, earmark). Categories managed per entity.
- ⬜ R3 Custom fields and labels (Avak/Javak, Tijori, Hissa…), en/hi/gu.
- ⬜ R2 First-time setup wizard (ADDON-07, ADDON-20 §3). Opening position with context per amount (owner, place, holder, source, evidence, confirmed/estimated). "Start empty" confirmed explicitly.

### 5.5 Accounting engine and posting — BUILD_PROMPT H-A/J, ADDON-16, rulebooks
- ✅ Intents above; posting pipeline; available balance with holds; acknowledgement; outbox.
- ⬜ R2 Approvals (D-040): entity approval policies (owner-benefit, related-party, high-value thresholds, approver roles), pending-approval state, no self-approval, single-owner attested alternative, re-approval on material change.
- ⬜ R2 Reversal and correction: an exact mirror journal linked to the original; blocked while settlements depend on it; lands in the open period; "Already reversed" under races.
- ⬜ R3 Period close per entity and month (closing journals, carry-forward) with the Month Close Assistant checklist; reopening with privilege, reason and audit.
- ⬜ R3 Integrity Verifier: balances = lines, chains intact, trial balance, reciprocity, sub-ledgers = control. A scheduled run plus a run before close.
- ⬜ R3 Exception engine (deterministic): duplicates, aging suspense and opening-balance equity, unsettled advances and reimbursements, personal-from-business, missing receipts.
- ⬜ R3 Allocation adjustment between entities and funds. Write-off and forgiveness. Refunds. Discounts, credit and debit notes. Interest on loans with EMI schedules (ADDON-21 §5–6, RULEBOOK-02).
- ⬜ R5 Tax structure (GST/TDS) as configurable accounts only, never claiming compliance (ADDON-16 §13). Inventory and fixed assets/depreciation only where a business turns them on (ADDON-16 §4.6 "where supported").

### 5.6 Everyday money workflows in the app — BUILD_PROMPT P, ADDON-19 §9, ADDON-21 §3
- ✅ Spent, received, moved, opening balance, money given (purpose, repayable, both sides), settle a due, acknowledge/reject.
- ⬜ R2 Expense with several payers and bearers (common expense with exact amounts per entity; personal expense from a firm with withdrawal/owes; firm expense paid personally → reimbursement).
- ⬜ R2 Handover with holder chain and optional confirmation. Advance given/accounted/returned. Loan given/taken with repayments (principal and interest separate). Bill now, pay later. Income on credit.
- ⬜ R2 Quick entry: repeat last, recents and favourites, smart defaults. Review sheet with Impact Preview before commit. Duplicate warning.
- ⬜ R3 Receipts and attachments: upload, protected storage, attach to an entry, required-receipt policy.

### 5.7 Customizable ledger and rough hisab — ADDON-20
- ⬜ R5 Ledger templates per entity: typed columns, labels over stable meanings, dropdowns, required/optional, validation, preview, versioning.
- ⬜ R5 Row entry grid: drafts that never touch posted balances; detailed forms per row; posting through the same engine.
- ⬜ R5 Safe formula engine: a constrained expression language with no code, SQL or loops. Composed functions with versions and dependencies; type and unit checks; computed only over the viewer's authorised rows; display only, never postings.
- ⬜ R5 Parent hisab workspace: participants, assets and conversions, cash and places, banks, child entries, receipts, pending and outstanding, clearing items, reconciliation, settlement, final summary, audit.
- ⬜ R5 Assets with quantities and units (gold, silver, property…), rate-based sale and exchange with executed versus market rates, remaining quantity.
- ⬜ R5 Bank-account register with exact account holder, owner, processing bank versus account bank, depositor, beneficiary.

### 5.8 Personal finance and wealth — ADDON-21
- 🟡 Net position, money, receivables and payables per book (summary).
- ⬜ R6 Personal dashboard: liquid money vs total wealth, net worth, month income/expense excluding transfers and loans, upcoming payments and receipts, overdue.
- ⬜ R6 Asset and investment register (cost vs estimate vs proceeds; realised vs unrealised). Loans given/taken with schedules and overdue tracking. Budgets as planning records. Funds/earmarks that move no money. Recurring and scheduled items confirmed when due.

### 5.9 Reconciliation and bank statements — BUILD_PROMPT S, ADDON-22
- ⬜ R3 Cash count: expected, actual, difference, investigation, resolution only by an approved adjustment journal, history. Bank reconciliation with matched and unmatched entries.
- ⬜ R6 Bank statement PDF import: secure upload, text extraction (OCR only where feasible), review grid, account identification, duplicate matching against existing entries, mapping into custom ledgers, opening + credits − debits = closing check, import as drafts and then post through the engine.

### 5.10 Reports and statements — BUILD_PROMPT AC14/R, ADDON-21 §9–10
- 🟡 Book summary and entry list (detail).
- ⬜ R3 Statements per entity and fund: trial balance, general ledger, place statement (Avak/Javak), P&L, balance sheet, cash flow, fund statement, receivable/payable aging, inter-entity, custody/holder, expense event. Explain Balance. Monthly view. Consolidated view only across fully visible entities. All built as authorised data → aggregate.
- ⬜ R5 Custom report builder; dashboard configuration.

### 5.11 Sharing and documents — BUILD_PROMPT Q, ADDON-22 §13–15
- 🟡 Text summary through the share sheet after a confirmation preview (entry detail).
- ⬜ R3 Share pipeline: authorised scope → recipient → share profile → generate → exact preview → confirm (and step-up when policy requires) → hand-off → audit. The verification is bound to a content hash, and any change invalidates it.
- ⬜ R3 Generated PDF (statements, entry proofs, ledgers) and CSV. Photo Proof card rendered from data. Secure PDF controls (password, encryption, watermark, expiry) with OFF / DEFAULT ON / MANDATORY policy; the Secure Viewer link is R6.
- ⬜ R3 Share history. Never "sent" unless the channel confirms it.

### 5.12 Notifications, audit and search
- ⬜ R2 In-app notification centre (from the outbox): pending acknowledgements, approvals, security events. Push (FCM) is R6, with a lock-screen policy.
- ⬜ R3 Audit viewer (permission-aware). Login history.
- ⬜ R2 Global search across entries, people, places and references, permission-filtered on the server.

### 5.13 Design, UX and branding — BUILD_PROMPT K/K-UX, ADDON-07/08/09
- ✅ Token-generated theme (light/dark), shared components, all async states.
- ⬜ R1 Finly launcher icon, adaptive icon and Android 12 splash from the brand SVGs. App name "Finly".
- ⬜ R2 Context path in titles; review sheets; motion per interaction within reduced-motion limits; tap budgets measured; accessibility pass (TalkBack, 200 % text).
- ⬜ R6 Hindi and Gujarati; custom labels.

### 5.14 Operations — ADDON-13 §9, BUILD_PROMPT U3/X
- ✅ Migration runner with fingerprint verification; CI workflow (unrun until pushed); architecture tests.
- ⬜ R1 Deploy migrations 0015–0017. A least-privilege API login role. Host the API (Supabase Edge Function — needs the owner's go-ahead). Build and verify a release APK pointed at it.
- ⬜ R1 Production KEK generation and escrow (owner). Release signing key (owner keeps it).
- ⬜ R3 Encrypted backups to Cloudflare R2 with a restore drill. Integrity checks after restore.
- ⬜ R6 Monitoring and alerts; incident runbook; performance benchmark on PostgreSQL 17; device testing on the owner's phones.

---

## 6. Release order

Each release ends with: all automated suites green (PGlite, PostgreSQL 17, PostgreSQL 18, Flutter), the docs and this
plan updated, and an APK built. Device checks are done whenever a phone is connected.

| Release | Content | Exit criteria |
|---|---|---|
| **R1 — First usable app** | Today's app + branding/splash + migrations 0015–0017 deployed + API hosted + seed users + signed release APK | Krish signs in on a phone, sets his password, creates a firm, adds a place, records and sees entries |
| **R2 — Safe daily use** | App lock (M-PIN, biometric), admin user management, password reset by code, MFA for Super Admin, approvals (D-040), reversal/correction, the remaining entry workflows (common expense, handover, advance, loan with repayment, bill), review sheet with impact preview, global search, setup wizard, entity creation flow, location access/holder, funds, in-app notifications | Every BUILD_PROMPT N/T2 flow works; nothing posted can be edited, only reversed |
| **R3 — Complete accounting** | Period close + Month Close Assistant, Integrity Verifier, exception engine, reconciliation, statements, PDF/CSV, share pipeline with Photo Proof, attachments, audit viewer, backups to R2, personal-finance grants, support sessions, custom labels | Every AC10 example visible in statements; trial balance ties per entity and period; a restore drill passes |
| **R4 — Configurable access** | Permission registry, effective permissions, custom role builder, role holders, delegation, hierarchy grants, amount/field visibility, simulator / View-As | ADDON-18 scenarios A–X pass as tests |
| **R5 — Flexible workspace** | Customizable ledger, safe formula engine, rough-hisab workspace, assets and rate conversions, bank-account register, custom report builder, optional tax/inventory/fixed-asset accounts | The ADDON-20 §21 end-to-end example works on a phone |
| **R6 — Whole financial life** | Wealth dashboard, investments, loans with schedules, budgets, recurring items, bank statement PDF import, push notifications, Secure Viewer, hi/gu, performance and device certification | ADDON-21 §16 and ADDON-22 §18 test lists pass |

R1 comes first because it puts the real app in the owner's hands. After that, the order follows the dependencies:
security and posting safety → accounting completeness → configurable access → flexible workspace → breadth.

---

## 7. Interpretations recorded (not owner decisions; open to correction)

1. **Inventory, fixed assets and tax** are implemented as optional, per-business features in R5 (ADDON-16 says "where
   supported"). Tax uses configurable accounts and never claims statutory compliance.
2. **Multi-currency** stays out (H14, whole INR). Foreign amounts are recorded in INR at the actual rupee value.
3. **Password reset** uses an administrator-issued one-time code plus the person's own new password, plus
   self-service recovery codes. Email/SMS reset waits until a delivery channel exists.
4. **OCR** for scanned statements is attempted only where a reliable library runs in the backend. Text-based PDFs come
   first (ADDON-22 §2 "where technically feasible").
5. **Entries for another Finly user's personal books** need a money place that only that person can see. Until the
   acknowledgement screen lets the receiver choose their own side, the app explains this instead of failing silently.
6. **API hosting:** Supabase Edge Functions (Deno — the same runtime as the backend) is the default. It needs the
   owner's go-ahead and secrets set in the dashboard.

---

## 8. What only the owner can do

- Push the repository (starts CI): `git push -u origin feat/database`.
- Generate and escrow the production KEK; set it with the API secrets in Supabase (docs/operations/key-recovery.md).
- Go-ahead to deploy migrations 0015–0017 and the API function.
- Keep the release signing key safe (it is created on this PC, never committed).
- Download Supabase's CA certificate; turn on Enforce SSL.
- Connect a phone with USB debugging for device testing.

---

## 9. How the work is done (unchanged)

Inspect → map dependencies → plan → implement → build → test → review → fix → regression test → docs/memory → verify
Git → one commit per logical change.

- Tests run against the real schema on PGlite, PostgreSQL 17.11 and 18.6.
- Critical behaviour is mutation-checked.
- No test is reported as passing unless it ran.
