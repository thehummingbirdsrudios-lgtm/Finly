# Tasks

Milestones follow BUILD_PROMPT Part W. **Gates stop the work until the product owner approves.** Every task runs the
loop in [docs/RULES.md](docs/RULES.md) and ends in its own commit.

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · ⛔ gate

## M0 — Foundation (branch `chore/m0-foundation`)

- [x] Repository, ignore rules, attributes
- [x] Build specification and add-ons 01–07 recorded verbatim in `docs/source/`
- [x] Design system draft: tokens (light/dark, WCAG AA checked), brand book, 47 reference components, logo, splash, setup wizard — published for review
- [~] Documentation skeleton: README, TASKS, PRD, SRS (glossary, traceability), RULES, SECURITY (threat-model outline), TEST_PLAN, ARCHITECTURE, DESIGN, DECISIONS, MEMORY, FLOWS, privacy data inventory
- [ ] First-session restatement: Part A, the AC1 glossary, AC10 example 4 as journal lines
- [ ] Stack Decision Record (Flutter fixed; packages vs built-ins; backend evaluation with current free-tier facts)
- [ ] Accounting Model Record (AC19, nine decisions)
- ⛔ **Gate 1 — technology stack** · ⛔ **Gate 2 — accounting model**

## M1 — Architecture and schema

- [ ] Threat model (STRIDE) and data-flow diagrams
- [ ] Client-independent architecture, API contracts and versioning, error model
- [ ] Encryption and key-management design (AC7), backup design
- [ ] Database schema: ERD, tables, constraints, encryption map, index plan, invariants
- ⛔ **Gate 3 — database schema**

## M2 — Design, UX blueprint, edge cases

- [ ] Final design system (after review comments on the draft)
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

- [ ] Accounting entities, chart-of-accounts templates, location ↔ ledger mappings, journal engine, posting-rule templates with preview
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
