# Continuation record

The persistent checklist ADDON-19 §15 asks for. **A new session reads this file first**, then [TASKS.md](../TASKS.md)
and [MEMORY.md](MEMORY.md), and continues from "Next action" — it does not repeat the audit. Items are ticked only
with evidence (a test run, a build, a deployment fingerprint).

Scope is frozen at ADDON-22 (D-041): the goal is the complete, deployable mobile app on the existing backend.

## Where the work stands

| Area | State | Evidence |
|---|---|---|
| Database (Supabase `finly`, PostgreSQL 17) | 0001–0014 deployed; 0015 local only | deployment.md fingerprints; 0015 tested locally |
| Accounting engine | Done for the intents in `domain/engine/intents.ts`; F8/F9 per D-039 | `deno task verify` 160 passed / 7 ignored (PGlite); `test:pg17` 81/81; `test:pg18` 81/81 (2026-10-09) |
| Posting service | Done (idempotent, locked, acknowledgement flow, outbox) | `tests/app/posting_test.ts` on all three targets |
| Access model | Step 1 (0014) done; D-038 enforcement, custom roles, delegation not yet | access-model.md §3 |
| Identity service / HTTP API | Not started (`src/http/` is declared in deno.json but absent) | — |
| Flutter app | Template only (`app/lib/main.dart`) | — |

## Plan to a deployable app (in dependency order)

Release 1 — the app works end to end against the real backend:

- [x] D-039 money given with purpose (engine, migration 0015, tests, docs)
- [ ] HTTP foundation: config, problem-details errors, request ids, structured logs, health
- [ ] Identity: one-time bootstrap of the first user, Argon2id sign-in with throttling, short-lived access tokens,
      rotating refresh tokens with reuse detection, sign-out, temporary → permanent password, sessions list
- [ ] D-038 in the database: platform roles grant no firm books; explicit entity-owner roles for recorded owners
- [ ] Entity service: personal book for every user, firm creation with chart of accounts, default fund, money places
      (cash, bank with account holder, wallet), parties
- [ ] Read API: my books, balances by place, transactions (paged), transaction detail, receivables/payables, categories
- [ ] Command API: expense, income, transfer, money given (purpose), loan, settlement, opening position; acknowledge,
      reject, cancel
- [ ] Flutter: theme from design tokens, navigation, secure token storage, sign-in, password change, home, book
      dashboard, places and balances, transactions, entry forms, pending acknowledgements, people, settings
- [ ] Release APK built and verified; API deployed (needs the owner's go-ahead and secrets)

Release 2 — the rest of the frozen scope:

- [ ] D-040 owner-benefit / related-party / high-value approvals
- [ ] Reversal and correction; period close
- [ ] Reports: P&L, balance sheet, cash flow, personal net worth, receivables/payables ageing; PDF/CSV; WhatsApp share
- [ ] Custom roles, role holders, delegation, hierarchy grants (access model steps 2–5)
- [ ] ADDON-20 customizable ledger, formulas, rough-hisab workspace, assets and rate conversions, bank register
- [ ] ADDON-21 assets, investments, loans with schedules, budgets, recurring items, funds
- [ ] ADDON-22 bank statement PDF import and reconciliation

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## External blockers (only the owner can clear)

- Push to GitHub (starts CI).
- Production encryption keys: generate, keep two offline copies, set as function secrets (key-recovery.md).
- Supabase CA certificate download and "Enforce SSL".
- Go-ahead to deploy the API to Supabase Edge Functions.
- A phone with USB debugging for on-device testing.

## Next action

HTTP foundation and the identity service (`backend/src/http/`, `backend/src/app/identity/`).
