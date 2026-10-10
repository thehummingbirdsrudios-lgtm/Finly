# Requirements and traceability

The reconciled requirement catalogue of Finly, built on 2026-10-10 (master plan v3, [PLAN.md](PLAN.md)) from every
source in [source/](source/README.md) — BUILD_PROMPT (BP), add-ons A-01…A-24, gate responses GR-01…GR-06,
rulebooks RB1–RB3 — and the decision records in [DECISIONS.md](DECISIONS.md). Where sources conflict, the latest
explicit owner decision wins; the conflicts and how they were resolved are listed at the end.

**Status:** ✅ done (implemented and proved by the named test) · 🟡 partial · ⬜ not started · ⛔ superseded.
**M** = the milestone in PLAN.md that delivers or completes it. Every commit that changes a row updates it here.

Abbreviations: UMA = ADDON-23; DEC = DECISIONS.md; tests are under `backend/tests/` unless they start with `app/`.

## IAM — identity and access

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| IAM-01 | Separate layers: account sign-in, app unlock, step-up | BP N1 | 🟡 | M9 | sign-in done (`app/identity/service.ts`); unlock/step-up not built |
| IAM-02 | Own identity service (Argon2id, rotating refresh, TOTP); no Supabase Auth | D-023, D-042 | 🟡 | M9 | `crypto/password.ts`, `crypto/token.ts` · `app/identity_test.ts`; TOTP not built |
| IAM-03 | Startup states: splash, init, session check, unlock or login, offline, failures | A-07, A-06, BP N4 | 🟡 | M0, M9 | `app/lib/app.dart` gate · `app/test/startup_test.dart`; unlock state missing |
| IAM-04 | Username + password; throttling; lockout 5 failures, doubling; same answer for unknown users | BP N2, D-042 | ✅ | — | `IdentityService.signIn` · `app/identity_test.ts` |
| IAM-05 | First login: replace temporary password → M-PIN/biometric setup → dashboard | A-06, A-07 | 🟡 | M9 | forced change done (`change_password_screen.dart`); M-PIN step missing |
| IAM-06 | Activation by single-use 24-h code; person sets own password and M-PIN | GR-03 Q3, D-030, UMA §10 | ⬜ | M9 | `account_activation` table only; today a 7-day temporary password |
| IAM-07 | No stored password; Keystore-backed revocable session | BP A5, N3 | ✅ | — | `session_store.dart` (refresh token only) |
| IAM-08 | Returning-user scenarios A–H (biometric, M-PIN, fallbacks, expiry, revoked device) | BP N4 | ⬜ | M9 | |
| IAM-09 | M-PIN create/confirm/change/reset/disable/admin reset; limits; server Argon2id over peppered PIN | BP N5 | ⬜ | M9 | `unlock_credential` table only |
| IAM-10 | Biometric unlock bound to a Keystore key; invalidated on enrolment change | BP N6 | ⬜ | M9 | |
| IAM-11 | Password reset without revealing accounts: admin one-time code + recovery codes | BP N7–N8 | ⬜ | M9 | `recovery_code` table only |
| IAM-12 | TOTP MFA mandatory for Super Admin | BP N8, N13 | ⬜ | M9 | `mfa_factor` table only |
| IAM-13 | Short access tokens, refresh rotation with reuse detection, session list, logout one/all, inactivity | BP N9, D-042 | ✅ | — | `IdentityService` · `app/identity_test.ts`; app sessions screen |
| IAM-14 | Devices: register, trust, revoke, mark lost; new-device flow | BP N10 | 🟡 | M9 | auto-registered on sign-in with real make/model (`core/device.dart`); trust/revoke in M9 |
| IAM-15 | Auto-lock in background; screen-capture protection | BP N11, V5 | 🟡 | M9 | FLAG_SECURE (`MainActivity.kt`); auto-lock missing |
| IAM-16 | Step-up for high-risk actions | BP N12 | ⬜ | M9 | |
| IAM-17 | RBAC + ABAC + record/field rules, server-side; one effective-permission source | BP L1, A-17 §10, D-038 | 🟡 | M1, M10 | `actor_has_permission`, RLS everywhere; scoped roles ignored in some policies (M1) |
| IAM-18 | Independent permissions (view, view amount, create, approve, reverse, export, share, …) | BP L2, A-17 §9 | 🟡 | M10 | 33 keys seeded; most unused |
| IAM-19 | Hidden resources never appear (search, counts, errors) | BP L3 | 🟡 | M14 | RLS hides rows · `db/rls_privacy_test.ts` |
| IAM-20 | Amount modes and detail levels; field visibility | BP L4–L6 | ⬜ | M10 | `access_rule` table only |
| IAM-21 | Confidentiality levels, renameable | BP L7 | 🟡 | M10 | `confidentiality_level` seeded |
| IAM-22 | Deny > allow > role default; exceptions; conditions | BP L8 | 🟡 | M10 | `role_permission` allow/deny |
| IAM-23 | Owner-only visibility; temporary access; break-glass | BP L9 | 🟡 | M10 | tables + guards (`env_access`, `break_glass`) |
| IAM-24 | Context/device policies | BP L10 | ⬜ | M9 | |
| IAM-25 | Aggregates computed only from authorised data | BP L12 | ✅ | — | summaries read through RLS · `http/api_test.ts` |
| IAM-26 | Worker blind entry (Add, My entries, Assigned, Pending) | BP L13 | 🟡 | M6 | entry forms; worker home not built |
| IAM-27 | Private-data firewall (personal banks, reimbursement privacy) | BP L14 | ✅ | — | owner-only places · `db/rls_privacy_test.ts` |
| IAM-28 | View-as-user / permission simulator, never revealing more | BP L15 | ⬜ | M15 | |
| IAM-29 | Personal books private; owner grants audited | BP A4, H13 | ✅ | — | `tg_env_access_guard` · `db/d038_provisioning_test.ts` |
| IAM-30 | Permissions re-checked at commit; revocation invalidates sessions/caches | BP EC5, A-18 §17 | 🟡 | M13 | posting re-authorises in phase 2 · `app/posting_test.ts`; cache wipe in M13 |
| IAM-31 | UI shaped by effective permissions | A-06, A-07 | 🟡 | M10 | `canPost`/`canManage` per book |
| IAM-32 | Isolation tested at API and DB level (IDOR) | BP O, UMA §10 | 🟡 | M1 | `db/rls_privacy_test.ts`; API-level IDOR tests in M1 |

## ADM — administration and users

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| ADM-01 | Seed users created as data (Krish super_admin; Shaileshbhai, Savan admin; Sujal, Devanshu, Heet, Sagar worker) | A-06, A-07, D-010 | 🟡 | owner | `src/main/create_user.ts`; production run blocked for Claude — owner runs it |
| ADM-02 | First credential via a one-time local bootstrap, never in Git/APK/docs/logs | A-06, D-010 | ✅ | — | `.first-login.txt` git-ignored |
| ADM-03 | User management in the app (add, edit, role, suspend, reset, revoke, archive) | A-06, A-07, BP T2 | ⬜ | M9 | |
| ADM-04 | Admin issues activation credentials; never sees passwords, PINs or keys | GR-03 Q3, UMA §10 | 🟡 | M9 | hashes only (`user_credential`) |
| ADM-05 | No impersonation; admin acts as admin; support access consented, scoped, timed, audited | GR-03, GR-05 §1, D-030, D-038 | 🟡 | M9 | `support_session` guard · `db/decisions_test.ts`; no service |
| ADM-06 | Platform administration ≠ access to books | D-038, GR-05 §1 | ✅ | — | 0016 · `db/d038_provisioning_test.ts` |
| ADM-07 | Role families (platform, entity owner/admin, manager, accountant, cashier, worker, auditor, custom) | A-17 §4, A-18 §5 | 🟡 | M10, M15 | 9 roles seeded |
| ADM-08 | Custom role builder with boundary validation and versions | A-17 §5 | ⬜ | M15 | |
| ADM-09 | Role-holder management with scope, expiry, history | A-17 §6 | ⬜ | M10 | |
| ADM-10 | Delegation with expiry and no escalation | A-17 §14, A-18 §11 | ⬜ | M15 | |
| ADM-11 | Membership states and invitations | A-17 §2.6, A-18 §2E | ⬜ | M10 | |
| ADM-12 | Central permission registry; unimplemented permissions never exposed | A-17 §9 | 🟡 | M10 | `permission` table |
| ADM-13 | Masters configurable without code, versioned and audited | BP T1, A-14 | 🟡 | M6, M10 | places, parties, firms via API; categories/funds/projects not editable |
| ADM-14 | Custom fields and conditional forms | BP T5, P3 | ⬜ | M15 | `custom_field_def` table only |
| ADM-15 | Security and visibility centre with rule builder | BP T6 | ⬜ | M15 | |
| ADM-16 | Emergency controls (freeze writes, disable exports, revoke sessions) | BP T7, U4 | 🟡 | M9 | `emergency_control` freeze enforced at journal insert |
| ADM-17 | Admin page inventory | BP P4 #84–103 | ⬜ | M9, M10 | |
| ADM-18 | Link existing books to an account with audited tools, no duplication | GR-03 Q3, UMA §10 | ⬜ | M9 | |
| ADM-19 | A new user or entity works end to end with no code change | A-14, D-035 | 🟡 | M9 | smoke creates user + firm (`db/tools/smoke.ts`); admin path in M9 |

## ENT — entities, firms and ownership

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| ENT-01 | Firms, persons (private books), pools; outside parties have no books | BP AC1, RB3 §2–3 | ✅ | — | `entity` · `db/catalog_test.ts` |
| ENT-02 | Unlimited entities; a new firm works at once | BP H4 | ✅ | — | `create_firm()` · `http/api_test.ts` |
| ENT-03 | Entity types incl. partnership, company, branch, subsidiary, custom | A-17 §2.2 | 🟡 | M10 | 11 types seeded; branches as hierarchy only |
| ENT-04 | Ownership ≠ partnership ≠ creator ≠ membership ≠ role ≠ effective access | A-17 §1, A-18 §1 | ✅ | — | 0014 · `db/ownership_test.ts` |
| ENT-05 | Multiple owners with shares, dates, verification, history | A-17 §7, A-18 §3 | 🟡 | M10 | schema + guards; no API |
| ENT-06 | Creator not automatically owner; atomic, idempotent creation | A-18 §7–8 | ✅ | — | `create_firm(creator_is_owner)` · `db/d038_provisioning_test.ts` |
| ENT-07 | Creation modes A–E with permissions | A-17 §3.3 | ⬜ | M10 | |
| ENT-08 | Hierarchy of any depth, explicit grants | A-17 §3.2–3.5 | 🟡 | M10 | `entity_relationship` cycle guard |
| ENT-09 | Different status per firm; owning several does not merge access | A-18 §6 | ✅ | — | env_access per entity |
| ENT-10 | Ownership/permission change workflows | A-18 §17 | ⬜ | M10 | |
| ENT-11 | ADDON-18 scenarios A–X pass as tests | A-18 §12 | 🟡 | M10 | some in `db/ownership_test.ts` |
| ENT-12 | Per-entity setup: financial year, opening date, policies | A-20 §3.1 | 🟡 | M10 | opening date; FY month unused |
| ENT-13 | Funds with states and views | BP H5 | 🟡 | M6 | default fund only via API |
| ENT-14 | Parties and intermediaries with labels | BP T1, A-20 §11 | ✅ | — | `addParty` · `http/api_test.ts` |
| ENT-15 | Entity switcher with relationship and access | A-17 §11.1 | 🟡 | M5 | books list |
| ENT-16 | Personal book linked to a business without bypassing access | A-18 §12 X | ✅ | — | separate books, acknowledgement (D-029) |

## LOC — places and custody

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| LOC-01 | Place ≠ ledger account; one asset account per entity × place | BP AC1, AC4 | ✅ | — | `location`, balances · engine tests |
| LOC-02 | Unlimited place types; overdraft; bank numbers encrypted and masked | BP H6 | 🟡 | M6 | types + encrypted numbers; overdraft config missing |
| LOC-03 | Owner, access list, key holder — each with history | GR-02 §5 | 🟡 | M10 | tables; API never writes access/holder |
| LOC-04 | Person carrying cash = custody place; holder on cash lines | GR-01 Gate 2 | 🟡 | M1 | holder not set for custodian places (M1 fix) |
| LOC-05 | Handover is a custody event; ownership/fund unchanged | BP H10 | 🟡 | M1, M6 | transit not linked to custody_event (M1) |
| LOC-06 | Receiver confirmation off by default; optional policy via transit | GR-02 §2 | 🟡 | M1 | policy not consulted (M1) |
| LOC-07 | Place disclosure levels | BP L11 | 🟡 | M10 | column exists |
| LOC-08 | Holder disabled while holding cash → exception + reassignment | BP EC5 | ⬜ | M14 | |
| LOC-09 | Custody ≠ ownership ≠ debt | GR-04 §5.6 | ✅ | — | engine custody legs · engine tests |
| LOC-10 | "Where is the money now", never double counted | A-21 §8.3 | 🟡 | M5 | money by place in book overview |
| LOC-11 | Current custodian of each place (data) | DEC F7 | ⬜ | M10 | |
| LOC-12 | Place as a line dimension | BP AC5 | ✅ | — | `journal_line.location_id` |

## ACC — accounting engine

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| ACC-01 | Balanced journals per entity and fund; balances only from posted lines | BP A7, AC0, UMA §2 r1 | ✅ | — | `checkPlan` · engine `money_invariants_test.ts`; DB check of amounts in M14 verifier |
| ACC-02 | Glossary concepts kept distinct | BP AC1 | ✅ | — | engine types |
| ACC-03 | Invariants checked before commit; never auto-fixed | BP AC6 | ✅ | — | `checkPlan`, triggers · `db/ledger_structure_test.ts` |
| ACC-04 | Accrual basis | GR-02 §4 | ✅ | — | `bill` intent · `engine/obligations_test.ts` |
| ACC-05 | Fund balancing | GR-02 §4 | ✅ | — | `engine/funds_legs_test.ts` |
| ACC-06 | Monthly close with closing journals; reopen with privilege | GR-02 §4, BP AC12 | ⬜ | M14 | periods exist; no close |
| ACC-07 | Exact money, no floats (paise since D-045) | BP H14 → D-045 | 🟡 | M2 | whole rupees today |
| ACC-08 | Chart of accounts from templates; extend, never delete | BP AC4 | 🟡 | M4 | templates seeded; no management UI |
| ACC-09 | Full dimension set on lines | BP AC5 | 🟡 | M1 | expense_event/payment method not written (M1) |
| ACC-10 | Explicit cross-entity classification; reciprocity | BP AC3 | ✅ | — | `give` · `engine/give_test.ts` |
| ACC-11 | AES-256-GCM amounts, keys outside DB, hash-chained journals | BP AC7, D-026, D-033 | ✅ | — | `crypto/*` · `crypto/crypto_test.ts` |
| ACC-12 | Separate transaction, posting, due, settlement dates | BP AC8, UMA §2 | 🟡 | M7 | due_date never set |
| ACC-13 | Available money check at commit | BP AC9 | ✅ | — | `PostingService` · `app/posting_test.ts` |
| ACC-14 | Client sends the operation, never balances | BP J1–J2 | ✅ | — | intents API |
| ACC-15 | Atomic commit of journals, balances, items, audit, outbox | BP J4 | ✅ | — | `db/outbox_intent_test.ts` |
| ACC-16 | State machine incl. pending acknowledgement, reversed, corrected | BP J5, D-029 | 🟡 | M3 | reversed/corrected not reachable |
| ACC-17 | Idempotency key on every mutation | BP J3 | ✅ | — | `idempotency_record` · `app/posting_test.ts` |
| ACC-18 | Lock order; two concurrent spends — one wins | BP J3 | ✅ | — | `db/concurrency_test.ts` (PG17/18) |
| ACC-19 | Impact preview | BP G1–G5 | ⬜ | M6 | |
| ACC-20 | Posting rules as versioned code intents + journal preview | BP AC15 → D-050 | 🟡 | M6 | intents versioned; preview missing |
| ACC-21 | Configurable transaction types | BP H8, A-20 §7 | 🟡 | M15 | `txn_type` seeded |
| ACC-22 | Avak/Javak are labels only | BP AC2 | ✅ | — | |
| ACC-23 | Economic substance; never silently classify or create debt | A-16 §2.4, GR-05 | ✅ | — | `CLASSIFICATION_REQUIRED` · `engine/give_test.ts` |
| ACC-24 | Full transaction-family coverage | A-16 §4, RB1–RB3 | 🟡 | M6–M8 | 17 intents |
| ACC-25 | Own / Expense / Transfer / Repayable rules | A-16 §5 | ✅ | — | engine |
| ACC-26 | F8/F9 purpose + repayable | GR-04, GR-05, D-039 | ✅ | — | `engine/give_test.ts` (21) |
| ACC-27 | Firm expense never owner income; non-repayable ≠ giver expense | GR-05, D-039 | ✅ | — | `engine/give_test.ts` |
| ACC-28 | Payer ≠ expense owner; debts only when real | GR-02 | ✅ | — | `engine/expense_test.ts` |
| ACC-29 | Open items, matched settlements, aging, no automatic netting | BP AC11 | 🟡 | M4 | items + settlement · `engine/obligations_test.ts`; aging in M4 |
| ACC-30 | Write-off, forgiveness, waiver with approval | BP AC10 ex14 | ⬜ | M7 | |
| ACC-31 | Refunds, discounts, credit/debit notes, over/under-payment | RB1 §42–45 | ⬜ | M6 | |
| ACC-32 | Prepaid and accrued expenses | RB1 §36–37 | ⬜ | M6 | |
| ACC-33 | Suspense never income; OBE flagged until cleared | BP AC6.13 | 🟡 | M6 | unidentified receipt intent |
| ACC-34 | Opening balances distinct records | BP H15 | ✅ | — | `opening_balance` intent · smoke |
| ACC-35 | Financial year April–March; year-end close | RB2 §89 | ⬜ | M14 | |
| ACC-36 | Allocation adjustment as an explicit journal | BP H5 | ⬜ | M6 | |
| ACC-37 | Common expense: exact manual amounts per entity | GR-02 §1 | 🟡 | M6 | engine supports allocations; app form single allocation |
| ACC-38 | Tax accounts configurable, no compliance claims | RB3 §47, D-051 | ⬜ | M15 | |
| ACC-39 | Foreign currency | RB2 §123 | ⛔ | — | out of scope by D-051 (INR only) |
| ACC-40 | Inventory/fixed assets where a business turns them on | A-16 §4.6 | ⬜ | M8 | fixed assets in M8; inventory deferred |
| ACC-41 | Integrity verifier, never auto-fixes | BP AC7, A-16 §9 | ⬜ | M14 | `integrity_run` table only |
| ACC-42 | Deterministic exception engine | BP J8, AC17 | ⬜ | M14 | |
| ACC-43 | Month Close Assistant | BP J9 | ⬜ | M14 | |
| ACC-44 | Accounting view (journal lines) for finance roles | BP AC16 | 🟡 | M4 | entry detail shows lines |
| ACC-45 | Explain Balance | BP AC13 | ⬜ | M4 | |
| ACC-46 | Transactional outbox with idempotent consumers | A-15 §9 | 🟡 | M14 | outbox written; no consumer |
| ACC-47 | Expense policy per company | BP J7 | ⬜ | M10 | |
| ACC-48 | ADDON-23's ten mandatory accounting rules | UMA §2 | 🟡 | M3–M8 | rules 1–5, 8, 10 covered by engine/tests; 6–7 in M8; 9 in M3 |
| ACC-49 | Reconciliation (expected/actual/difference/resolution) | BP S, A-20 §15 | ⬜ | M12 | `reconciliation` table only |
| ACC-50 | Bank, card, UPI, wallet scenarios | RB3 §44–46 | ⬜ | M6 | |
| ACC-51 | Overdraft / negative-balance rules per account | BP H6, J3 | 🟡 | M6 | `negative_policy` forbid only effective |
| ACC-52 | Credit cards as liabilities | RB3 §45 | ⬜ | M6 | |
| ACC-53 | Capital, drawings, retained earnings, profit allocation | A-16 §4.5 | 🟡 | M6, M14 | capital/drawings via give purposes |
| ACC-54 | Deposits / FDs with maturity and interest | A-21 §7, UMA §1 | ⬜ | M8 | |
| ACC-55 | Owner, partner, worker, supplier, customer, inter-firm ledgers | RB2 §77 | ⬜ | M4 | |

## ENTRY — entry workflows

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| ENTRY-01 | Quick flow with smart defaults | BP P1, UX3 | 🟡 | M6 | entry forms |
| ENTRY-02 | Add menu: transfer, expense, income, receive, handover, reimbursement, advance, adjustment | BP P2 | 🟡 | M6 | 5 kinds today |
| ENTRY-03 | Expense capture fields | BP H9 | 🟡 | M6 | |
| ENTRY-04 | Personal / firm / common expense with exact amounts | GR-02 §1 | 🟡 | M6 | |
| ENTRY-05 | Expense events (trip, visit) grouping items | BP H9 | ⬜ | M6 | |
| ENTRY-06 | Personal expense from firm money: purpose asked | D-039 | ✅ | — | give form purposes |
| ENTRY-07 | Firm expense paid personally → reimbursement | BP AC10 ex4 | 🟡 | M6 | engine |
| ENTRY-08 | Money given with purpose, repayable, both sides | D-037, D-039 | ✅ | — | `entry_form_screen.dart` give |
| ENTRY-09 | Handover with holder chain, optional confirmation | GR-02 §2 | ⬜ | M6 | |
| ENTRY-10 | Advance give/account/return | BP AC10 ex5 | 🟡 | M6 | engine intents; no app form |
| ENTRY-11 | Bill now pay later; income on credit; settlement | BP AC10 ex9–10 | 🟡 | M6 | settle screen; bill/credit income forms missing |
| ENTRY-12 | Capital, withdrawal, unidentified receipt | ENG §5 | 🟡 | M6 | engine; forms missing |
| ENTRY-13 | Opening position with context; empty start | A-20 §3.2 | 🟡 | M10 | opening balance form |
| ENTRY-14 | Every money addition states its source | A-20 §9 | ✅ | — | intents require source |
| ENTRY-15 | Deposit questions | A-20 §10.2 | ⬜ | M6 | |
| ENTRY-16 | Smart conditional forms | BP P3 | 🟡 | M6 | give form conditional fields |
| ENTRY-17 | Single review sheet with impact preview | BP UX3, G5 | ⬜ | M6 | |
| ENTRY-18 | Duplicate warning with reason | BP J3 | ⬜ | M6 | |
| ENTRY-19 | Repeat last, templates, recents | BP UX3 | ⬜ | M6 | |
| ENTRY-20 | Drafts autosaved; posted entries corrected, never edited | BP UX1, UMA §6 | 🟡 | M3, M13 | posted immutable ✅; drafts in M13 |
| ENTRY-21 | Entries into another person's books await acknowledgement | GR-03 Q1, D-029 | ✅ | — | `acknowledge` · `app/posting_test.ts`; inbox screen |
| ENTRY-22 | Detail page with sentence, status, links, audit | BP F4, UMA §6 | 🟡 | M3, M9 | `entry_detail_screen.dart`; audit trail missing |
| ENTRY-23 | Universal entry for all types (method, reference, notes, attachments) | UMA §6 | 🟡 | M6 | |
| ENTRY-24 | Reference `TX-YYYYMMDD-NNNNNN` | BP H7 | ✅ | — | `next_reference` · smoke |
| ENTRY-25 | Batch / spreadsheet daily entry | A-21 §3.3 | ⬜ | M15 | |
| ENTRY-26 | Payment method ≠ account | RB1 §103 | ⬜ | M1, M6 | column never written |

## COR — corrections and reversals

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| COR-01 | Posted history immutable; reverse/correct/adjust only | BP H15, UMA §2 | 🟡 | M3 | immutability triggers · `db/lifecycle_test.ts` |
| COR-02 | Reversal = exact mirror, linked; open period if original closed | BP AC10 ex13 | ⬜ | M3 | `mirror()` unused |
| COR-03 | Correction = reversal + new linked event | BP AC1 | ⬜ | M3 | |
| COR-04 | Blocked while settlements depend on it | BP EC5 | ⬜ | M3 | |
| COR-05 | No double reversal | BP EC5 | 🟡 | M3 | unique index · `db/lifecycle_test.ts` |
| COR-06 | Inter-entity reversal atomic | BP EC5 | ⬜ | M3 | |
| COR-07 | Partial reversal = linked adjustment/refund | OQ Q12 | ⬜ | M3 | |
| COR-08 | Reversal into a deactivated account refused | OQ Q10 | ⬜ | M3 | |
| COR-09 | Impact preview for reversal/correction | BP G5 | ⬜ | M3 | |
| COR-10 | Reverse permission separate; step-up for high value | BP L2, N12 | ⬜ | M3, M9 | `txn.reverse` seeded |
| COR-11 | Drafts/pending void without ledger effect | RB1 §58 | 🟡 | M3 | refused drafts marked failed |
| COR-12 | Reclassification, account merge, debt↔capital | RB2 §134 | ⬜ | M15 | |

## APR — approvals

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| APR-01 | Maker/checker/approver per company, account, type | BP J6 | ⬜ | M10 | tables only |
| APR-02 | Entity policy: owner-benefit, related-party, high-value | GR-05 §4, D-040 | ⬜ | M10 | |
| APR-03 | No self-approval where independence is required | GR-05 §4 | 🟡 | M10 | `tg_approval_guard` · `db/lifecycle_test.ts` |
| APR-04 | Single-owner audited alternative | D-040 | ⬜ | M10 | |
| APR-05 | Material change → re-approval (content hash) | D-040 | ⬜ | M10 | |
| APR-06 | Pending approval holds funds; rejection releases | BP AC9 | ⬜ | M10 | |
| APR-07 | Approver sees only what is needed; races handled | BP J6 | 🟡 | M10 | `db/concurrency_test.ts` two approvers |
| APR-08 | Enforced on every posting route incl. imports | D-040 | ⬜ | M10 | |
| APR-09 | Approvals inbox | IMPL WP2.4 | ⬜ | M10 | |
| APR-10 | Approval and policy changes audited | A-19 §4 | ⬜ | M10 | |
| APR-11 | Default thresholds for seeded firms | — | ⬜ | M10 | owner may change |

## LOAN — loans

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| LOAN-01 | Loans given/taken with anyone incl. banks and NBFCs | RB3 §39, UMA §1, §3 | 🟡 | M7 | `loan` intent · `engine/obligations_test.ts` |
| LOAN-02 | Lent = receivable; borrowed = liability; principal never income/expense | RB2 §36–37, UMA §2 | ✅ | — | accounts 1320/2120 · engine tests |
| LOAN-03 | Agreement separate from disbursement | A-21 §5.1 | ⬜ | M7 | |
| LOAN-04 | Loan record (parties, principal, source, purpose, schedule, interest, evidence, status) | A-21 §5.1, UMA §3 | ⬜ | M7 | |
| LOAN-05 | Partial/multiple repayments; principal/interest/fees separate; EMI split | RB2 §28–29 | 🟡 | M7 | `loan_repayment` split · engine tests |
| LOAN-06 | Interest accrual and earned recorded separately | RB2 §27 | ⬜ | M7 | |
| LOAN-07 | Rate, type, method (simple; compound when chosen); interest-free; unscheduled | UMA §3, D-048 | ⬜ | M7 | |
| LOAN-08 | Schedule; expected vs actual; restructuring history | A-21 §5.2, UMA §3 | ⬜ | M7 | |
| LOAN-09 | Overdue (due date, components, penalty, days) | RB2 §30 | ⬜ | M7 | |
| LOAN-10 | Fees, penalties, early/late payment | UMA §3 | ⬜ | M7 | |
| LOAN-11 | Write-off, waiver, loan↔capital conversion | RB2 §33–35 | ⬜ | M7 | |
| LOAN-12 | Maturity, collateral, documents, status | UMA §3 | ⬜ | M7 | |
| LOAN-13 | Reminders, statements, overdue and aging reports | A-21 §12, UMA §3 | ⬜ | M7, M11 | |
| LOAN-14 | Entrusted cash vs loan vs gift vs advance vs capital kept apart | A-21 §5.3 | ✅ | — | give purposes · `engine/give_test.ts` |
| LOAN-15 | Personal vs company loans never mixed; guarantees separate | A-21 §6 | 🟡 | M7 | books separate |
| LOAN-16 | Lifecycle created → disbursed → partially repaid → repaid | RB3 §39 | ⬜ | M7 | |

## AST — assets and net worth

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| AST-01 | Asset register for personal and business books | A-21 §4, UMA §4 | ⬜ | M8 | |
| AST-02 | Asset details (owner/share, acquisition, holder, quantity, purity, valuation, documents) | A-21 §4.1 | ⬜ | M8 | |
| AST-03 | Holder ≠ owner | A-21 §4.1 | ⬜ | M8 | |
| AST-04 | Asset purchase is not an expense | RB1 §83, UMA §2 r6 | ⬜ | M8 | |
| AST-05 | Sale by quantity × rate; proceeds ≠ profit; gain/loss | A-20 §8.2, UMA §4 | ⬜ | M8 | |
| AST-06 | Asset exchange with balancing cash | A-20 §8.3 | ⬜ | M8 | |
| AST-07 | Executed vs market rate; executed never overwritten | A-20 §8.4 | ⬜ | M8 | |
| AST-08 | Valuation history; estimate never income; book vs market | A-21 §4.2, UMA §4 | ⬜ | M8 | |
| AST-09 | Depreciation, appreciation, revaluation | UMA §4, D-049 | ⬜ | M8 | |
| AST-10 | Net worth = assets − liabilities; liquid vs total; no double counting | A-21 §2.1, UMA §4 | 🟡 | M5, M8 | per-book net position in summary |
| AST-11 | Quantity precision and units | A-20 §8 | ⬜ | M8 | |
| AST-12 | Low-value belongings; staged property consideration | A-21 §4.2 | ⬜ | M8 | |

## PFW — personal finance and wealth (ADDON-21)

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| PFW-01 | Whole-money management per personal book | A-21 §2 | 🟡 | M5–M8 | personal books exist |
| PFW-02 | Personal dashboard, owner-only | A-21 §2.1 | ⬜ | M5 | |
| PFW-03 | Cash flow excludes own transfers | A-21 §8.2 | ⬜ | M4 | |
| PFW-04 | Income types with distinct treatments | A-21 §3.1 | 🟡 | M6 | categories |
| PFW-05 | Editable expense categories | A-21 §3.2 | ⬜ | M10 | |
| PFW-06 | Budgets (planning only) | A-21 §3.4 | ⬜ | M15 | |
| PFW-07 | Earmarked funds are virtual | A-21 §8.1 | ⬜ | M15 | |
| PFW-08 | Investment register (units, cost, income, realised/unrealised) | A-21 §7 | ⬜ | M8 | |
| PFW-09 | Money into a business = capital/loan/reimbursement/… | A-21 §7.2 | ✅ | — | give purposes |
| PFW-10 | Recurring items confirmed, never auto-posted | A-21 §11 | ⬜ | M15 | |
| PFW-11 | Business accounting alongside | A-21 §9 | 🟡 | M4 | |
| PFW-12 | Categorised daily payment/receipt reports | A-21 §9.4 | ⬜ | M4 | |
| PFW-13 | P&L ≠ deposits − withdrawals | A-21 §9.3 | ⬜ | M4 | |
| PFW-14 | Cross-report integrity (P&L, BS, CF, net worth, outstanding) | A-21 §10.7 | ⬜ | M4 | |
| PFW-15 | Distinctions list enforced | A-21 §13 | 🟡 | M8 | |
| PFW-16 | User-configured dashboards through formulas | A-21 §12 | ⬜ | M15 | |
| PFW-17 | Goals; personal distribution view | A-21 §2 | ⬜ | M15 | |

## LED — rough hisab and customisable ledger (ADDON-20)

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| LED-01–05 | Ledger template builder, labels over semantics, typed columns, dropdowns, row grid | A-20 §5 | ⬜ | M15 | |
| LED-06 | Rows post only through validated intents | A-20 §6.6 | ⬜ | M15 | |
| LED-07–13 | Function library, custom functions, formula safety, display-only formulas, scopes, totals, history-safe edits | A-20 §6, §14 | ⬜ | M15 | |
| LED-14–17 | Parent hisab workspace, rough-first entry, clearing, participants | A-20 §11–13 | ⬜ | M15 | |
| LED-18 | Bank-account register with joint holders | A-20 §10.1 | 🟡 | M6 | bank details per place |
| LED-19 | Hisab reconciliation and settlement | A-20 §15 | ⬜ | M15 | |
| LED-20–21 | No evasion help; templates grant no access | A-20 §11, §17 | ⬜ | M15 | |
| LED-22 | §21 example and §22 tests pass | A-20 §21–22 | ⬜ | M15 | |

## IMP — bank statement import and sharing (ADDON-22, ADDON-23 §5)

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| IMP-01 | Import action in bank, entry, ledger and reconciliation screens | A-22 §2 | ⬜ | M12 | |
| IMP-02 | PDF text extraction; OCR for scanned PDFs on the phone | A-22 §2, D-046 | ⬜ | M12 | |
| IMP-03 | CSV and Excel statements | UMA §5 | ⬜ | M12 | |
| IMP-04 | Password-protected PDFs (password never stored); clear errors | A-22 §2 | ⬜ | M12 | |
| IMP-05 | Field extraction with confidence | A-22 §3 | ⬜ | M12 | |
| IMP-06 | Original description/reference kept; nothing invented | A-22 §3 | ⬜ | M12 | |
| IMP-07 | Editable review grid; save and resume | A-22 §4 | ⬜ | M12 | |
| IMP-08 | Account identification; no duplicate account on re-upload | A-22 §5 | ⬜ | M12 | |
| IMP-09 | Deterministic suggestions; scoped audited rules | A-22 §6 | ⬜ | M12 | |
| IMP-10 | Duplicate matching; safe re-imports | A-22 §7 | ⬜ | M12 | |
| IMP-11 | Balance check opening + credits − debits = closing | A-22 §8 | ⬜ | M12 | needs D-045 paise |
| IMP-12 | Staged import; nothing posts without review; atomic idempotent posting | A-22 §9, UMA §5 | ⬜ | M12 | |
| IMP-13 | Source evidence and provenance | A-22 §10 | ⬜ | M12 | |
| IMP-14 | Mapping templates per bank; custom ledgers | A-22 §11 | ⬜ | M12 | |
| IMP-15 | Import summary | UMA §5 | ⬜ | M12 | |
| IMP-16 | Upload security; no statement content in logs | A-22 §16 | ⬜ | M12 | |
| IMP-17 | Never claim untested layouts | A-22 §12 | ⬜ | M12 | |
| IMP-18 | Import existing records (CSV/Excel) | BP R4 | ⬜ | M12 | |
| IMP-19 | Share action on records | A-22 §13 | 🟡 | M11 | entry detail text share |
| IMP-20 | Share flow with formats; never "delivered" | A-22 §14–15 | 🟡 | M11 | |

## RPT — reports

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| RPT-01 | TB, GL, place statement, BS, P&L/I&E, cash flow, fund, aging, inter-entity, custody, expense event | BP AC14, UMA §2 | ⬜ | M4 | |
| RPT-02 | Consolidated view across fully visible entities | BP AC14 | ⬜ | M5 | |
| RPT-03 | Operational reports | BP R3 | ⬜ | M4 | |
| RPT-04 | Custom report builder | BP R3 | ⬜ | M15 | |
| RPT-05 | Same privacy on every output | BP R3 | ✅ | — | reads through RLS |
| RPT-06 | Monthly view; period comparison | BP R2 | 🟡 | M4 | month income/expense in summary |
| RPT-07 | Reports only from posted records | RB2 §182, UMA §2 r10 | ✅ | — | balances from posting only |
| RPT-08 | Receivable, payable, loan, asset, liability, overdue, upcoming | UMA §2 | ⬜ | M4, M7, M8 | |
| RPT-09 | ADDON-20 reports with filters | A-20 §20 | ⬜ | M15 | |
| RPT-10 | Personal net-worth statement | A-21 §10.2 | ⬜ | M5 | |

## DSH — dashboards

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| DSH-01 | Home "where is our money" dashboard | BP R1 | ⬜ | M5 | |
| DSH-02 | Fund, company, personal dashboards | BP R1 | 🟡 | M5 | book overview |
| DSH-03 | Today and this month in/out/net | BP R2 | 🟡 | M5 | month only |
| DSH-04 | Only authorised data; no decorative charts | BP L12 | ✅ | — | |
| DSH-05 | Trends, breakdowns, reconciliation status, exports | UMA §7 | ⬜ | M5 | |
| DSH-06 | No misleading combined balances | A-20 §19 | ⬜ | M5 | |
| DSH-07 | Last-updated indicator | BP K3 | ⬜ | M5, M13 | |

## DOC — documents, sharing, attachments

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| DOC-01 | Only generated documents, never screenshots | BP A3, Q1 | ✅ | — | FLAG_SECURE; text share |
| DOC-02 | Filter before generating; verify & share | BP Q2 | ⬜ | M11 | |
| DOC-03 | Verification bound to a content hash | BP A3, Q3 | ⬜ | M11 | |
| DOC-04 | No auto-send; "handed to WhatsApp" | BP Q3 | ✅ | — | share sheet only |
| DOC-05–07 | Share types, templates, photo proof | BP Q1, Q5, Q6 | ⬜ | M11 | |
| DOC-08 | Designed PDF layout with tests | BP Q7 | ⬜ | M11 | |
| DOC-09–10 | Secure PDF controls; secure viewer | BP Q8 | ⬜ | M15 | |
| DOC-11–13 | Share profiles, partner updates, share history | BP Q9–Q11 | ⬜ | M11, M15 | |
| DOC-14 | Never promise remote destruction | BP Q8 | ✅ | — | |
| DOC-15 | Attachments validated, protected, time-limited, audited | BP U1 | ⬜ | M6 | |
| DOC-16 | Image compression | UMA §8 | ⬜ | M6 | |
| DOC-17 | Required-receipt policy | BP J7 | ⬜ | M10 | |
| DOC-18 | Receipts, vouchers, statements; PDF/CSV/XLSX export | UMA §8 | ⬜ | M11 | |
| DOC-19 | Export permission separate; exports audited | BP R4 | ⬜ | M11 | |
| DOC-20 | Mask sensitive identifiers | A-22 §3 | 🟡 | M11 | bank last-4 only |
| DOC-21 | Share one report without granting access | BP L16 | ⬜ | M11 | |

## SRCH — search

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| SRCH-01–05 | Global search, every attribute, multi-term, grouped results, one-tap actions | BP UX4, P6 | ⬜ | M14 | `search_tsv` unused |
| SRCH-06 | Server-side; blind indexes; amount bands | BP UX4, M | 🟡 | M14 | indexes exist |
| SRCH-07 | Permission filter before ranking/counting | BP L3 | ⬜ | M14 | |
| SRCH-08 | Filters incl. reconciliation status, date ranges | BP P6, UMA §6 | ⬜ | M4, M14 | |
| SRCH-09 | Offline search over the cached subset | BP UX4, D-044 | ⬜ | M13 | |

## NOTIF — notifications

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| NOTIF-01 | Events incl. acknowledgements and approvals | BP R5, D-029 | 🟡 | M14 | "To answer" inbox |
| NOTIF-02 | Per-user configuration; masked/generic modes | BP R5 | ⬜ | M14 | |
| NOTIF-03 | In-app centre; deep links after unlock | BP P4 | ⬜ | M14 | |
| NOTIF-04 | Push (FCM) | DEC S7, D-051 | ⬜ | owner | needs Firebase project |
| NOTIF-05 | Failure never affects posting | BP EC5 | ✅ | — | outbox |
| NOTIF-06 | Reminders (loans, recurring, overdue) | UMA §3 | ⬜ | M7, M14 | |
| NOTIF-07 | Others see changes promptly | A-12, D-031 | 🟡 | M14 | refresh on open |

## OFF — offline (D-044)

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| OFF-01 | Online-only mode available as a policy | D-044 (Option 2) | 🟡 | M13 | app is online-only today |
| OFF-02 | Default: encrypted preloaded cache + offline drafts, auto-sync, server re-validation, "Saved on this phone — Not synced or confirmed" | UMA §11, GR-06 §1, D-044 | ⬜ | M13 | |
| OFF-03 | Server re-validates everything; refusals reviewed; revoked device rejects queue | BP P7, GR-06 | 🟡 | M13 | server re-validates (two-phase submit) |
| OFF-04 | Session expiry mid-form keeps an encrypted draft | BP EC5 | ⬜ | M13 | |
| OFF-05 | Local data encrypted; key in Keystore; wiped on sign-out/revocation | D-044 | ⬜ | M13 | |

## L10N — languages

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| L10N-01 | English, Hindi, Gujarati with in-app switching | BP P8, UMA §9 | ⬜ | M0 | |
| L10N-02 | Indian grouping; no ".00" | BP H14 | ✅ | — | `money.dart` · `app/test/money_test.dart` |
| L10N-03 | Custom labels with translation keys never change behaviour | BP A7, P8 | ⬜ | M15 | |
| L10N-04 | Mukta + Mukta Vaani bundled | D-009 | ⬜ | M0 | |
| L10N-05 | Screen readers speak amounts; 200 % text | BP UX8 | 🟡 | M5 | amounts announced; large-text overflow risk |
| L10N-06 | Language of generated documents | D-051 | 🟡 | M11 | English first |

## SEC — security, audit, backups

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| SEC-01 | Backend is the only authority | BP A5 | ✅ | — | |
| SEC-02 | Field encryption; hashing for secrets; no custom crypto | BP M | ✅ | — | `crypto/*` |
| SEC-03 | KEK outside DB, versioned, rotatable | D-026, D-033 | ✅ | — | `KeyRing` · `crypto/crypto_test.ts` |
| SEC-04 | KEK escrow + production restore drill | GR-03 Q2 | 🟡 | owner | key created; escrow and drill pending |
| SEC-05 | No decrypting secret on Android | BP M | ✅ | — | |
| SEC-06 | Least-privilege roles, RLS, NOINHERIT login | D-025, D-043 | 🟡 | M1 | `db/api_login_test.ts`; RLS defects fixed in M1 |
| SEC-07 | Tamper-evident hash-chained audit | BP U2 | 🟡 | M9 | written; viewer + before/after in M9 |
| SEC-08 | Audit separates admin, user, support actions | GR-03 Q3 | 🟡 | M9 | |
| SEC-09 | Encrypted backups to R2, restore-tested | BP U3, D-015 | 🟡 | M16 | local drill `db/recovery_test.ts`; R2 needs owner credentials |
| SEC-10 | Incident response; failures deny | BP U4 | 🟡 | M16 | |
| SEC-11 | Safe user messages | BP U6 | ✅ | — | RFC 9457 problems · `http/api_test.ts` |
| SEC-12 | Own error reporting, no secrets/amounts | GR-01 §4 | 🟡 | M16 | structured logs |
| SEC-13 | Rate limits, data minimisation, IDOR tests | BP O | 🟡 | M1 | lockout only |
| SEC-14 | TLS verify-full; Enforce SSL | A-19 §6 | 🟡 | owner | sslmode=require |
| SEC-15 | Retention periods | OQ Q8 | ⬜ | M16 | confirm with CA |
| SEC-16 | No compliance claims | UMA §13 | ✅ | — | |
| SEC-17 | No secrets in source/APK/Git/logs/docs | A-01, A-02 | ✅ | — | secret scans before commits |
| SEC-18 | Encrypted on-device data | D-044 | ⬜ | M13 | |

## REL — release

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| REL-01 | Android only, Flutter, minSdk 24 / target 36 | D-001, D-014 | ✅ | — | `aapt dump badging` |
| REL-02 | iOS/web designed for, not built | BP A1 | ✅ | — | |
| REL-03 | Supabase `finly` (Mumbai, PG17) | D-013 | ✅ | — | deployment log |
| REL-04 | API as Edge Function, own auth, pinned CLI | D-043 | ✅ | — | production `/v1/health` ok (2026-10-10) |
| REL-05 | Checksummed migrations; migrator off between deploys; fingerprints | D-027, D-036 | ✅ | — | `docs/operations/deployment.md` §4 |
| REL-06 | PG17/18 verified locally; PGlite fast tests | D-024, D-028 | ✅ | — | `test:pg17`, `test:pg18` |
| REL-07 | Signed APK; key outside Git; debug builds work without the key | D-017 | ✅ | — | `apksigner verify` (CN=Finly); `requireReleaseKey` task (M0) |
| REL-08 | Installed and verified on a device | UMA §15 | ⬜ | owner | needs a phone |
| REL-09 | Play Store guidance | UMA §15, D-051 | ⬜ | M16 | |
| REL-10 | Deployment docs, runbooks, health checks | A-13 §9 | 🟡 | M16 | `docs/operations/*` |
| REL-11 | In-app update check | DEC S10 | ⬜ | M16 | |
| REL-12 | CI: analyze, tests, PG17, APK, secret scan | DEC S9 | 🟡 | M16 | backend CI only; runs after push |
| REL-13 | ₹0/month free tiers | A-01, D-012 | ✅ | — | |
| REL-14 | One verified commit per change; owner pushes | A-05, D-006 | ✅ | — | git log |
| REL-15 | Pre-production gate (Part X) | BP X | ⬜ | M16 | |

## UX, platform, QA

| ID | Requirement | Source | Status | M | Implementation · proof |
|---|---|---|---|---|---|
| UX-01 | Token design system, premium light/dark theme | D-008, A-04, A-09 | 🟡 | M5 | `theme.dart` from tokens · `app/test/tokens_test.dart` |
| UX-02 | Role-aware resumable setup wizard | A-07, BP UX7 | ⬜ | M10 | |
| UX-03 | Every screen has loading/empty/error/offline states | BP K3 | 🟡 | each | `ErrorView` |
| UX-04 | Bottom navigation, no dead ends | BP P2, UX1 | 🟡 | M5 | not-found page offers the way home (M0); new navigation in M5 |
| UX-05 | Tap/time budgets | BP UX2 | ⬜ | M16 | |
| UX-06 | Never colour alone; amount dominant | BP K2 | 🟡 | M5 | status badges have glyph + word + colour (M0, `widgets.dart`) |
| UX-07 | WCAG 2.2 AA; role walkthroughs | BP UX8–9 | 🟡 | M16 | |
| UX-08 | Success only after server confirms; double taps blocked | BP UX5 | ✅ | — | busy guards on every save; refused forms renew their key · `app/test/entry_form_test.dart` |
| UX-09 | Full page inventory | BP P4, UMA §9 | 🟡 | M4–M15 | |
| PLT-01 | No AI anywhere (OCR exception D-046) | BP A2 | ✅ | — | |
| PLT-02 | One DB, one backend, OpenAPI contract | BP A1, S2 | 🟡 | M16 | OpenAPI file missing |
| PLT-03 | Modular architecture with architecture tests | A-02, A-15 | ✅ | — | `architecture/boundaries_test.ts` |
| PLT-04 | Flow map + edge-case matrix per module | BP G1 | 🟡 | each | |
| PLT-05 | No mocks, placeholders or dead buttons | A-01, UMA §16 | ✅ | — | app audit found none |
| PLT-06 | Persistent checklist + continuation file | A-19 §15 | ✅ | — | this file, `TASKS.md`, `CONTINUATION.md` |
| PLT-07 | Reassess, master plan, traceability, then build | ADDON-24 | ✅ | — | PLAN.md v3, this file |
| QA-01 | Tests on real code and PG17 with real connections; nothing claimed unrun | BP V1–V7, UMA §14 | ✅ | — | |
| QA-02 | Suites: RB3 42 tests, F8/F9 matrix, A-18 A–X, A-20 §22, A-21 §16, A-22 §18 | sources | 🟡 | each | F8/F9 matrix done |

## Conflicts and how they were resolved

| # | Conflict | Resolution |
|---|---|---|
| 1 | Offline-first (BP P7, A-01–A-03, UMA §11) vs online-only (A-12, A-13, D-031) | D-044: online database + encrypted cache + offline drafts by default; online-only as a policy (GR-06 §1) |
| 2 | Scope frozen (D-041) vs ADDON-23/24 | D-047: scope re-opened |
| 3 | Whole rupees (BP H14) vs statements/interest in paise (A-22, UMA §3, §5) | D-045: integer paise |
| 4 | Platform admin "full access" (RB3 §7, OQ Q13a) vs D-038 | D-038 confirmed by GR-05 §1; RB3 §7 and Q13(a) superseded |
| 5 | F1–F9 shown open in old tables | Answered by GR-02/04/05; DECISIONS flags table updated 2026-10-10 |
| 6 | Bank import "future" (BP Z, PRD §5) vs required (A-22, UMA §5) | Required (M12); receipt OCR stays future |
| 7 | OCR (machine learning) vs "no AI" (BP A2) | D-046: on-device OCR for statements only, rows always reviewed |
| 8 | Direct APK (D-017) vs Play Store (UMA §15) | D-051: APK; Play Store guidance only |
| 9 | Admin-configurable posting rules (BP AC15) vs code intents | D-050: versioned code intents + journal preview |
| 10 | Branches "future" (BP Z) vs A-17 | A-17 wins: branches as entity hierarchy |
| 11 | Percentage splits (BP H9) vs exact manual amounts (GR-02 §1) | GR-02 wins for common expenses |
| 12 | Stop-and-ask gates (BP C6) vs continue (D-019) | D-019: continue; owner-only actions are listed as blockers |
| 13 | Super Admin creating Super Admins (A-06) vs A-17 §4.1 | Platform-only workflow with MFA, step-up and audit (M9) |
