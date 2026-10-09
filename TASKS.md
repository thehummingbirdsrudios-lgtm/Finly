# Tasks

The checklist for [docs/PLAN.md](docs/PLAN.md) (the plan of record since 2026-10-09; scope frozen at ADDON-22,
D-041). An item is ticked only with evidence: a passing test run, a build, or a verified deployment. Every item ends
in its own commit. Where the last session stopped: [docs/CONTINUATION.md](docs/CONTINUATION.md).

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · 🔑 needs the owner

## Done before this plan (evidence in git history and docs/MEMORY.md)

- [x] Specification, add-ons 01–22, gate responses 01–05 recorded verbatim (`docs/source/`)
- [x] Design-system draft (tokens, components, logo); stack and accounting model records
- [x] Database: migrations 0001–0017, RLS everywhere, guards, encryption map; data dictionary; catalog parity tests
- [x] Supabase project `finly`; 0001–0014 deployed and fingerprint-verified
- [x] Accounting engine: 17 intents, F8/F9 with purpose (D-039), invariants
- [x] Posting service: idempotent, locked, encrypted, acknowledgement flow (D-029), outbox, monthly periods
- [x] D-038: platform roles open no books; explicit scoped owner/admin roles
- [x] Identity service: sign-in, temporary → own password, rotating refresh tokens, lockout, sessions
- [x] HTTP API v1 with books and activity services; architecture rules (`src/main` composition root)
- [x] Flutter app: theme from tokens, API client, sign-in, books, overview, places, entries, dues/settle, entry forms,
  entry detail, inbox, new business, add place, settings/sessions

## R1 — First usable app

- [ ] Branding: launcher icon (adaptive + monochrome), Android 12 splash, app name, from `design-system` assets
- [ ] Splash/startup flow polish; error states for an unreachable server
- [ ] Least-privilege API login role (`finly_app`): member of finly_api/finly_auth/finly_ledger only, script + docs
- [ ] Release signing setup (key outside Git) and a release APK build against a configured `FINLY_API_URL`
- [ ] 🔑 Deploy migrations 0015–0017 to Supabase (fingerprint-verified)
- [ ] 🔑 Host the API (Supabase Edge Function) with the KEK and DB secrets set by the owner
- [ ] 🔑 Seed the initial users through the bootstrap (temporary passwords delivered only to the owner)
- [ ] Device check: install, sign in, set password, create firm, add place, record entries

## R2 — Safe daily use

- [ ] App lock: auto-lock, M-PIN (create/confirm/change/reset/lockout), biometric unlock, step-up
- [ ] Super Admin user management (add/edit/role/suspend/reset/revoke/archive), activation codes
- [ ] Password reset by administrator code; recovery codes; TOTP MFA for Super Admin; devices (revoke, lost)
- [ ] Approvals per entity policy (D-040) with self-approval prevention and single-owner alternative
- [ ] Reversal and correction
- [ ] Entry workflows: common expense with exact per-entity amounts, personal-from-firm, reimbursement, handover with
  holder chain, advance give/account/return, loan given/taken with repayments, bill and payment, income on credit
- [ ] Review sheet with impact preview; duplicate warning; repeat last / recents
- [ ] Global search (server-side, permission-filtered)
- [ ] First-time setup wizard; opening position with context; entity creation flow with owners and partners
- [ ] Location access list (add/replace) and current holder; funds; categories per entity
- [ ] In-app notification centre

## R3 — Complete accounting

- [ ] Period close and Month Close Assistant; reopening with privilege and audit
- [ ] Integrity Verifier and deterministic exception engine
- [ ] Cash and bank reconciliation with adjustment journals
- [ ] Statements (TB, GL, place statement, P&L, balance sheet, cash flow, fund, aging, inter-entity, custody, expense
  event) and Explain Balance
- [ ] PDF and CSV generation; Photo Proof; share pipeline with content-hash verification; share history
- [ ] Receipts and attachments (protected storage)
- [ ] Audit viewer; login history; personal-finance owner grants; consented support sessions
- [ ] Encrypted backups to Cloudflare R2 with a restore drill
- [ ] Allocation adjustments, write-off/forgiveness, refunds, interest/EMI

## R4 — Configurable access

- [ ] Permission registry, membership states, invitations, role versions (migration 0018+)
- [ ] `effective_permissions` used by RLS, API and UI; amount and field visibility; confidentiality levels
- [ ] Custom role builder, role holders, delegation, hierarchy grants, change requests
- [ ] Entity switcher, hierarchy and administration screens; simulator / View-As; temporary access; break-glass
- [ ] ADDON-18 scenarios A–X as tests

## R5 — Flexible workspace

- [ ] Ledger templates, typed columns, dropdowns, row grid with drafts
- [ ] Safe formula engine and composed functions
- [ ] Rough-hisab workspace with clearing items, reconciliation and settlement
- [ ] Asset register, rate-based sale and exchange; bank-account register with holders
- [ ] Custom report builder; optional tax, inventory and fixed-asset accounts

## R6 — Whole financial life

- [ ] Wealth dashboard, investments, loans with schedules, budgets, earmarks, recurring items
- [ ] Bank statement PDF import with review grid, duplicate matching and reconciliation
- [ ] Push notifications with lock-screen policy; Secure Viewer links
- [ ] Hindi and Gujarati; custom labels
- [ ] Performance benchmark on PostgreSQL 17; monitoring; incident runbook; device certification
