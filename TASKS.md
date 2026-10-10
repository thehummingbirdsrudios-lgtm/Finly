# Tasks

The milestone checklist for [docs/PLAN.md](docs/PLAN.md) (revision 3, 2026-10-10). Requirement-level status lives in
[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). An item is ticked only with evidence: a passing test run, a build, or a
verified deployment. Every item ends in its own commit. Where the last session stopped:
[docs/CONTINUATION.md](docs/CONTINUATION.md).

Legend: `[x]` done · `[~]` in progress · `[ ]` not started · 🔑 needs the owner

## Done before revision 3 (evidence in git history)

- [x] Sources recorded verbatim (`docs/source/`); design-system draft; stack and accounting records
- [x] Database 0001–0017 with RLS, guards, encryption map; deployed to Supabase, fingerprint `4b71e286…`
- [x] Engine (17 intents, F8/F9 purposes), posting service, identity service, HTTP API v1, books and activity services
- [x] Flutter app core: sign-in, books, overview, places, entries, dues/settle, 5 entry kinds, entry detail, inbox,
  sessions; branding; signed release APK
- [x] `finly_app` login; API live as Edge Function `api` (2026-10-10, `/v1/health` ok)

## M0 — Stabilise and record

- [x] Hosted-runtime fix (Node globals), hosted-like `dev:api`, side-effect imports in the architecture graph (0c89369)
- [~] ADDON-23, ADDON-24, GATE-RESPONSE-06 recorded; D-044…D-051; flags table; PLAN v3; REQUIREMENTS.md
- [x] App fixes: H1 refused-form key, M1 startup storage errors, M2 lookups retry, M3 unpostable give, M4 all save
  errors, M5 list race + status badges, M6 device model, M7 debug build without key.properties, empty states,
  not-found exit, chip formatting, sessions double tap
- [ ] L10n: ARB en/hi/gu for every string, Mukta + Mukta Vaani, language setting saved and sent to the server
- [ ] 🔑 Seed accounts (owner runs `deno task user:create …`)

## M1 — Authorisation and integrity defects (0018)

- [ ] Scoped permissions honoured in env-less RLS policies; IDOR tests at API level
- [ ] No self-grants of `env_access` / `user_role`; `user_role_auth` limited
- [ ] `approved`/`cancelled` only with a decided approval request
- [ ] `ensure_periods` actor check; book-scoped `parties()`; wrong-current-password throttle; session settings read
- [ ] Project, payment method, memo and holder written; transit ↔ custody event; handover-confirmation policy

## M2 — Paise (0019)

- [ ] Domain money, intents, checks, wire format, buckets/blind index in paise; migration guard
- [ ] App amount input and display with paise

## M3 — Reversal and correction

- [ ] Engine reversal/correction intents (mirror), service unwinding, rules, routes
- [ ] App reverse/correct with reason and preview

## M4 — Reports and ledgers

- [ ] Reports service: TB, ledgers (account/place/party), P&L, balance sheet, cash flow, aging, Explain Balance, CSV
- [ ] App Reports hub with filters and date ranges

## M5 — Dashboard and net worth

- [ ] Cross-book dashboard, net worth, trends, last-updated; new bottom navigation

## M6 — Entry workflows, journal, attachments

- [ ] Forms for every exposed intent; common expense; credit cards; deposits; reimbursement; handover; expense events
- [ ] Manual journal (finance roles); review sheet with journal preview; duplicate warning; recents
- [ ] Attachments: private storage, encryption, signed URLs, compression

## M7 — Loans (0020)

- [ ] Loan records, terms, schedules, repayments by component, accrual, overdue, restructure, write-off, statements

## M8 — Assets and investments (0021)

- [ ] Asset register, purchase, disposal, depreciation, revaluation, investments, deposits, book vs market

## M9 — Users, activation, app lock, security, audit

- [ ] Admin service and screens; activation codes; M-PIN; biometrics; auto-lock; step-up; recovery codes; TOTP;
  devices; audit viewer; support sessions

## M10 — Approvals, members, ownership

- [ ] D-040 approval policies and inbox; members and grants; owners/partners; place access/holder; setup wizard

## M11 — Documents and sharing

- [ ] PDF receipts, vouchers, statements, reports; CSV/XLSX; verify-and-share; share history

## M12 — Bank statement import

- [ ] On-device parsing (CSV, XLSX, text PDF, OCR), mapping, review grid, duplicates, balance check, staged posting

## M13 — Offline drafts and cache

- [ ] Encrypted cache and draft outbox, auto-sync, review of refusals, policy switch

## M14 — Search, notifications, close, verifier

- [ ] Search; notification centre; month close; Integrity Verifier

## M15 — Workspace and wealth

- [ ] Hisab workspace, ledger templates, formulas; budgets, goals, recurring; custom role builder

## M16 — Release and operations

- [ ] App CI; 🔑 R2 backups + restore drill; update check; Play Store guidance; final APK; runbooks
- [ ] 🔑 Device verification on a phone
