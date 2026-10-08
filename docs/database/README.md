# Finly database — architecture and schema (Gate 3)

The design required by [add-on 11](../source/ADDON-11-database-architecture-schema.md), written before any migration
and reviewed against the [source documents](../source/README.md). Per D-019 the gate is delivered as reviewable
documents and flagged to the owner, and development continues. The migrations in `backend/db/migrations/` implement
this design.

## The required outputs (add-on 11 §30)

| # | Output | Where |
|---|---|---|
| 1 | Database architecture document | [01-architecture.md](01-architecture.md) |
| 2 | Complete ERD | [02-erd.md](02-erd.md) — levels 2–6; level 1 in 01 §1.3 |
| 3 | Table list | [03-schema.md](03-schema.md#table-list) |
| 4 | Detailed schema | [03-schema.md](03-schema.md) |
| 5 | Data dictionary | design level in [03-schema.md](03-schema.md); column level generated from the live catalog into [DATA-DICTIONARY.md](DATA-DICTIONARY.md) |
| 6 | Relationship map | [02-erd.md](02-erd.md#relationship-map-add-on-11-30-item-6) |
| 7 | Financial ledger model | [01-architecture.md §1.6](01-architecture.md#16-the-financial-ledger-model-add-on-11-item-7) |
| 8 | Index strategy | [04-index-performance.md](04-index-performance.md) |
| 9 | Security / RLS model | [05-security-rls.md](05-security-rls.md) |
| 10 | Transaction and concurrency strategy | [06-transactions-concurrency-sync.md](06-transactions-concurrency-sync.md) |
| 11 | Migration strategy | [01-architecture.md §1.13](01-architecture.md#113-migrations-add-on-11-item-24) |
| 12 | Backup / recovery strategy | [01-architecture.md §1.14](01-architecture.md#114-backup-and-recovery-add-on-11-item-25) |
| 13 | Offline / sync data strategy | [06-transactions-concurrency-sync.md §6.6](06-transactions-concurrency-sync.md#66-offline-and-sync-p7-rulebook-03-60) |
| 14 | Database edge-case matrix | [07-edge-case-matrix.md](07-edge-case-matrix.md) |
| 15 | Query / performance strategy | [04-index-performance.md](04-index-performance.md) |
| 16 | Open questions / decisions required | [08-open-questions.md](08-open-questions.md) |

## The design in ten lines

1. PostgreSQL 17, own `finly` schema, no extensions, no Supabase-only features; clients never touch the database.
2. One real-world event = one `txn`; its business legs in `txn_leg`; its accounting in immutable, balanced,
   hash-chained `journal` + `journal_line` — one journal per entity per step.
3. Ownership (entity's books), fund, ledger account, location, holder and access are six separate columns or tables.
4. Every amount is encrypted with keys that never enter the database; balances live in encrypted snapshots updated in
   the same transaction under row locks; the Integrity Verifier recomputes them.
5. The database itself refuses: changes to posted history, lines in another entity's account or fund, one-sided
   journals, closed periods, inactive accounts, postings during a write freeze, grants into someone's personal books.
6. Five least-privilege roles; client roles have nothing; row-level security walls off environments, personal finance,
   hidden funds and locations, and own-user data.
7. Every posting is one database transaction with a fixed lock order; idempotency keys and `client_ref` make retries
   and offline sync exactly-once.
8. Open items with explicit debtor and creditor; settlements are many-to-many allocations; remaining is derived.
9. Masters are archived, never deleted; names are labels over stable IDs; configuration is data and is audited.
10. Plain-SQL, forward-only, checksummed migrations; nightly encrypted dumps to R2 with monthly restore drills.

## Review checklist (add-on 11 item 29)

| Question | Answer | Evidence |
|---|---|---|
| Correct? | Yes — follows revision 3 of the accounting model and RULEBOOK-01..03; every posting is produced by the tested engine | 01 §1.6; ACCOUNTING-ENGINE.md; 42 engine tests |
| Normalised appropriately? | 3NF; seven documented, constraint-protected copies, each with a reason | 01 §1.6 denormalisation register |
| Fast? | Every screen query has an index; balances from snapshots; keyset pagination | 04 |
| Secure? | Least-privilege roles, RLS, encryption with off-database keys, hashed secrets | 05 |
| Auditable? | Hash-chained audit written in the same transaction; commit refused without it | 05 §5.8 |
| ACID-safe? | One operation = one transaction; deferred structural checks at commit | 06 §6.1–6.2 |
| Concurrency-safe? | Row locks in a global order, version checks, unique keys on every race | 06 §6.3–6.4 |
| Mobile-friendly? | Pagination, selective fields, `change_seq` delta sync, idempotent offline queue | 04, 06 §6.6 |
| Scalable? | Years of headroom on the free plan; UUIDv7 keys; partitioning of `audit_log` and `journal_line` by year possible later without changing the model | 04 §4.1 |
| Migration-safe? | Forward-only, checksummed, tested on an empty database every run; expand/contract | 01 §1.13 |
| Backup-safe? | Encrypted dumps, keys elsewhere, monthly restore drill with the verifier | 01 §1.14 |
| Future iOS / web ready? | Nothing client-specific in the database; one API | 01 §1.3 |
| Edge cases covered? | 40 scenarios traced, each with its test | 07 |
| Financially correct? | Invariants owned by the database, the engine or the verifier — none unowned | 01 §1.6 |
| No duplicate source of truth? | Every copy listed with its source and its consistency mechanism | 01 §1.6 |
| No unnecessary complexity? | No extensions, no materialised views, no enum types, no polymorphic keys; one generic lookup table made type-safe | 01, 03 |

## Review against the source documents

| Requirement | Met by |
|---|---|
| A1 one database, client-independent | 01 §1.2–1.3 |
| A4 personal finance owner-private, Super Admin excluded | 05 §5.5 (database trigger + RLS) |
| A5, M amounts encrypted, keys never on Android or in the database | 05 §5.7 |
| A7 / H1 / AC1 distinct concepts | 01 §1.6 table |
| H5 fund states, reservations, allocation adjustments | `balance_hold`, `allocation_adjustment` intent |
| H15 immutable history, reversal, correction, archiving, opening balances, period locking | 01 §1.7–1.9, triggers |
| AC6 invariants | 01 §1.6 enforcement table |
| AC7 snapshots, verifier, hash chain | `balance_*`, `journal.content_hash`, `integrity_run` |
| AC8 separate dates | `txn.value_date`, `entered_at`, `submitted_at`, `approved_at`, `posted_at`; `journal.posted_at` |
| AC11 open items, remaining derived | `open_item`, `settlement_allocation` |
| AC12 / J9 period close | `accounting_period`, `period_close_run`, `balance_period.closing_enc` |
| I1 principles, I2 entity list | 03 coverage table |
| J2–J5 precondition gate, atomic commit, state machine | 06 §6.2, 01 §1.7 |
| J6 maker/checker, segregation | `approval_rule`, `approval_request` trigger |
| L1–L16 authorisation | 05 (database part); the API policy engine (M5) |
| N sessions, devices, M-PIN, MFA, recovery | Identity tables, 03 |
| P7 offline | 06 §6.6 |
| Q sharing with verification bound to a content hash | 01 §1.11, 02 level 5 |
| R5 notifications without leakage | `notification` stores no amounts |
| S reconciliation | `reconciliation`, `bank_statement_*` |
| T configuration | 01 §1.12 |
| U1–U3 files, audit, backup | 01 §1.10, §1.14; 05 §5.8 |
| RULEBOOK-03 §2–§9 environments and access | `entity.managed_in_env_id`, `env_access`, `entity_membership` |
| RULEBOOK-03 §13–§15 owner / access / holder, Add / Replace, unassigned | `location_ownership`, `location_access`, `location_holder` |
| RULEBOOK-03 §60 offline cases | 06 §6.6 |
| RULEBOOK-03 §64 core transaction data model | `txn`, `txn_leg`, `txn_entity`, `txn_link`, `open_item` |
| Owner F1–F7, revision 3 | 01 §1.6; engine |

## Gate 3 status

Design complete and internally consistent; open questions in [08](08-open-questions.md). Implementation continues
under D-019; the owner may change any open answer later through a normal forward migration.
