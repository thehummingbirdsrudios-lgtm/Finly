# Tasks

Milestones follow BUILD_PROMPT Part W. **Gates stop the work until the product owner approves.** Every task runs the
loop in [docs/RULES.md](docs/RULES.md) and ends in its own commit.

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · ⛔ gate

## M0 — Foundation (branch `chore/m0-foundation`)

- [x] Repository, ignore rules, attributes
- [x] Build specification and add-ons 01–09 recorded verbatim in `docs/source/`
- [x] Design system draft: tokens (light/dark, WCAG AA checked), brand book, 47 reference components, logo, splash, setup wizard — published for review
- [x] Documentation skeleton: README, TASKS, PRD, SRS (glossary, traceability), RULES, SECURITY (threat-model outline), TEST_PLAN, ARCHITECTURE, DESIGN, DECISIONS, MEMORY, FLOWS, privacy data inventory
- [x] First-session restatement: Part A, the AC1 glossary, AC10 example 4 as journal lines
- [x] Stack Decision Record (Flutter fixed; packages vs built-ins; backend evaluation with current free-tier facts) — `docs/DECISIONS.md`
- [x] Accounting Model Record (AC19, nine decisions) — `docs/DECISIONS.md`
- [x] ⛔ **Gate 1 — technology stack** approved with conditions (D-013..D-017) · ⛔ **Gate 2 — accounting model** resolved by the owner's F1–F7 answers (revision 3, D-021); F8 and F9 await confirmation

## M1 — Architecture and schema

- [ ] Threat model (STRIDE) and data-flow diagrams
- [ ] Client-independent architecture, API contracts and versioning, error model
- [ ] Encryption and key-management design (AC7), backup design
- [x] Database architecture and schema design (add-on 11): ERD levels 1–6, 91 tables, data dictionary, index and RLS design, concurrency, sync, migration and backup strategies, edge-case matrix, open questions — [docs/database/](docs/database/README.md)
- [ ] Migrations implementing the design, database tests (RLS, immutability, constraints, concurrency), benchmark
- ⛔ **Gate 3 — database schema** delivered as documents (D-019, D-025); open questions Q1–Q12 await the owner

## M2 — Design, UX blueprint, edge cases

- [ ] Final design system (after review comments on the draft), revised for add-on 08: a distinct motion language per interaction (navigation, tabs, nav bar, cards, buttons, forms, search, filters, sheets, dialogs, success, error, loading, notifications, financial state changes, expand/collapse, gestures), decoration rules and tokens (depth, surfaces, gradients, highlights, backgrounds, dividers), and empty-state illustrations — all within reduced-motion, contrast and performance limits
- [ ] Theme completed for add-on 09: a colour-blind-safe chart palette (categorical and sequential, distinct from money and state colours), chart styling rules, and the written rationale for the Finly theme (why ledger green, brass, paper surfaces and this type)
- [ ] UX blueprint: navigation map per role, search model, tap and time budgets, key flows
- [ ] Master Edge-Case Matrix (Part G-EC)
- ⛔ **Gate 4 — design system + UX blueprint + edge-case matrix**

## M3 — Foundations in code

- [ ] Docker Desktop + Supabase CLI (asks first), local stack, migrations from the first commit
- [ ] Hosted production project `finly` (asks first), CI on GitHub Actions, private repository (asks first)
- [ ] Backend foundation: config, structured logging, error model, audit engine, encryption service, idempotency
- [ ] Flutter app skeleton: theme generated from `tokens.json`, branding from `brand.json`, navigation shell, runs on the owner's phone

## M4 — Authentication and startup

- [ ] Splash and startup flow, first-time setup wizard (add-on 07)
- [ ] Sign-in, MFA, throttling; forgot password; Remember Me; biometric; M-PIN; devices and sessions; auto-lock; screen privacy; step-up
- [ ] Seed users via one-time local bootstrap; Krish's temporary password delivered only to him (add-ons 06/07)

## M5 — Authorization and configuration

- [ ] Authorization engine (RBAC + ABAC + resource, field, confidentiality, discovery, precedence, owner grants)
- [ ] Permission-aware aggregation; master/configuration system; Super Admin user management

## M6 — Accounting core and the first money movement

- [~] Accounting entities, chart-of-accounts templates, location ↔ ledger mappings, journal engine, posting-rule templates with preview
  - [x] Pure posting planner (`backend/src/domain/engine/`), journal invariants, in-memory reference ledger; 42 tests covering ACCOUNTING-ENGINE §5 and RULEBOOK-03 §72 tests 1–21 (engine level)
  - [ ] Persisted to Postgres through the schema from M1
- [ ] AC6 invariant checker, encrypted balance snapshots, hash chain, Integrity Verifier, Explain Balance
- [ ] Precondition pipeline, available balance, concurrency, idempotency, state machine, Impact + Conflict Engine
- [ ] First end-to-end Avak / Javak / transfer on the phone

## M7 — Full ledger

- [ ] Expenses, expense events, splits; outstanding, reimbursement, advance, settlement, inter-company; handover
- [ ] Reversal, correction, allocation adjustment, opening balances, period locking

## M8 — Reporting

- [ ] Reconciliation, exception engine, month-end close; financial statements; reports and report builder; import/export; notifications

## M9 — Sharing

- [ ] WhatsApp message with the verification pipeline and share profiles; Photo Proof; PDF; Secure PDF, security builder, Secure Viewer, expiry, revocation

## M10 — Production

- [ ] Offline sync; remaining Super Admin tools; multi-language and custom labels
- [ ] Security hardening, backup and restore drill, monitoring, incident runbooks
- [ ] Full test suite (Part V) on supported Android versions; production readiness review (Part X); signed release build
- [ ] Deliver Krish's first-login credentials through the secure bootstrap
