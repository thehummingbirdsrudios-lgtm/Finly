# Finly — master plan

**Revision 3, 2026-10-10.** Written after the owner asked to stop and reassess everything from the beginning
([ADDON-24](source/ADDON-24-reassess-from-the-beginning.md)): every source in [docs/source/](source/README.md) was
re-read (BUILD_PROMPT, add-ons 01–24, gate responses 01–06, rulebooks 01–03), the backend, database and app were
audited directly, and every requirement was reconciled into [REQUIREMENTS.md](REQUIREMENTS.md) — the traceability
checklist, with status, implementation and proof per requirement. [TASKS.md](../TASKS.md) tracks the milestones
below; [CONTINUATION.md](CONTINUATION.md) records where the last session stopped. Revision 1 (2026-10-09) is in git
history; the older [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) remains a source of package detail only.

**Precedence when sources differ** (BUILD_PROMPT A6): Part A of the build specification first; then the stricter
security, privacy and integrity reading; then the latest explicit owner decision.

---

## 1. What Finly is

A private family-and-business financial operating system: one person's own money, any number of businesses,
partnerships, pools and branches, and every movement of money between them. An Android app (Flutter) on one online
API and one PostgreSQL database. People see *money in, money out, from where, to where, who held it, why*;
underneath, every movement is a balanced double-entry journal in each book it touches, every amount is exact (paise,
D-045), encrypted at rest and explainable months later.

**Never negotiable:** the backend is the only authority; no AI (the on-device OCR of D-046 is the one recorded
exception); no screenshot as proof and no external share without preview and confirmation; personal finance is private
to its owner and platform administration sees no one's books (D-038); nothing posts unless every check passes, and then
atomically, exactly once; no fake data, dead buttons, or "success" before the server confirms — and an offline draft is
never shown as saved to the books (D-044).

## 2. Who uses it

| Person | Needs |
|---|---|
| **Owner / Super Admin** (Krish in the seed) | Run the platform; own and run several firms through explicit owner roles; see the whole of their own financial life; never another person's books without that person's grant |
| **Admin** (Shaileshbhai, Savan) | Run the firms they are given, with the rights they are given |
| **Worker** (Sujal, Devanshu, Heet, Sagar) | Record entries in assigned places quickly; see only what is assigned |
| **Family member with own books** | Their own private books; accept or reject entries others record into them |
| **Partner / accountant / auditor** | Exactly the reports and operations their role in that firm allows |

The seed people are data, created by the one-time bootstrap, never code (ADDON-14).

## 3. Decisions that shape the build (not to be re-asked)

| Topic | Decision | Record |
|---|---|---|
| Client | Flutter + Dart, Android (minSdk 24, target 36); iOS/web later on the same API | D-001, D-014 |
| Backend | Deno TypeScript API with its own identity service, as the Supabase Edge Function `api`, on PostgreSQL 17 (`finly`), login `finly_app` | D-023, D-034, D-043 |
| Offline | Online database + encrypted preloaded cache + offline drafts by default; "online only" as a policy | D-044 (supersedes D-031) |
| Money | Integer paise, INR only, decimal strings on the wire | D-045, D-051 |
| Statements | Parsed on the phone (CSV, XLSX, text PDF); scanned PDFs by on-device OCR; every row reviewed | D-046 |
| Accounting | Double entry per entity and fund; accrual; monthly close; purposes for money given; no automatic debts or income | D-037, D-039, GR-02 |
| Access | Platform admin ≠ book access; explicit entity roles; no impersonation; consented support sessions | D-038, D-030 |
| Approvals | Entity policy for owner-benefit, related-party and high-value items; no self-approval | D-040 |
| Entries into others' books | Wait for the owner's acknowledgement by default | D-029 |
| Posting rules | Versioned code intents with a journal preview | D-050 |
| Loans, assets | Loan conventions D-048; depreciation/valuation D-049 | D-048, D-049 |
| Delivery | Signed APK; Play Store guidance only; in-app notifications first; English PDFs first | D-017, D-051 |
| Encryption | AES-256-GCM per value, keys from the KEK outside the database; Argon2id passwords | D-026, D-033, D-042 |

## 4. State at the start of revision 3 (audited 2026-10-10)

- **Working and tested:** posting core (17 intents, 16 exposed, idempotent two-phase submit, locks, encrypted
  balances, hash chains, acknowledgements, outbox); identity (sign-in, rotation, lockout, sessions); firms and D-038
  provisioning; places, parties. 192 backend tests. App: sign-in, forced password change, books, overview, entries,
  dues/settle, five entry kinds, entry detail, inbox, sessions; 13 tests. Production: migrations 0001–0017, `finly_app`,
  API live (`/v1/health` ok).
- **Schema without code:** reversal, approvals, period close, verifier, reports, attachments, sharing, notifications,
  search, audit viewer, bank import, MFA, M-PIN, activation codes, support sessions.
- **Missing entirely:** loan terms and schedules, asset register, workspace (ADDON-20), budgets/goals/recurring
  (ADDON-21), backups, languages, offline.
- **Defects found:** scoped roles ignored by some RLS policies; self-grant possible; `finly_api` can mark approved
  without an approval; several dimensions never written (project, payment method, memo, holder); transit not linked to
  its custody event; app refused-form key reuse (H1) and dropped decimal point (H2); see REQUIREMENTS.md.

## 5. Build sequence

Every milestone: small increments, one tested commit each; backend `verify` + `test:pg17` + `test:pg18`; app
`flutter analyze` + `flutter test`; hosted-like smoke (`dev:api` + `smoke`, extended each milestone); deploy with
`edge:deploy` and a production health check; migrations through the checksummed runner with three-channel
fingerprints. New strings go into the ARB files. REQUIREMENTS.md rows updated in the same commit.

| M | Milestone | Contents |
|---|---|---|
| M0 | Stabilise and record | Hosted-runtime fix; app bugs H1, M1–M7; sources ADDON-23/24, GR-06; D-044…D-051; this plan; REQUIREMENTS.md; l10n infrastructure (en/hi/gu ARB, Mukta fonts, language setting) |
| M1 | Authorisation and integrity defects (0018) | Scoped permissions in RLS; no self-grants; restrict `user_role_auth`; approval required for approved/cancelled; `ensure_periods` actor check; book-scoped parties; password-change throttle; session settings from `system_setting`; write project/payment method/memo/holder; transit ↔ custody event; handover policy |
| M2 | Paise (0019) | Money type, intents, wire format, buckets, app input and display in paise |
| M3 | Reversal and correction (0020) ✅ | Mirror journals, unwind balances/items/holds, settlement block, once only, open period, routes, app actions with preview (D-052) |
| M4 | Reports and ledgers | TB, account/place/party ledgers with running balances, P&L, balance sheet, cash flow, aging, Explain Balance, as-of and ranges, CSV; Reports hub |
| M5 | Dashboard and net worth | Home dashboard across permitted books, net worth (book vs market), trends, last-updated; new navigation |
| M6 | Entry workflows, journal, attachments | Remaining intents as forms, common expense, credit cards, deposits, reimbursement, handover, expense events, manual journal, review sheet with journal preview, duplicates, recents; attachments in private storage |
| M7 | Loans (0021) | Terms, schedules (D-048), disbursement, repayments by component, accrual, overdue, restructure, write-off, statements, reminders |
| M8 | Assets and investments (0022) | Register, purchase (capitalised), disposal gain/loss, depreciation, revaluation, investments, deposits, book vs market |
| M9 | Users, activation, lock, security, audit | Admin service, single-use activation codes, M-PIN, biometrics, auto-lock, step-up, recovery codes, TOTP for super admin, devices, audit viewer, support sessions |
| M10 | Approvals, members, ownership | D-040 policies and inbox; members and grants; owners/partners; place access and holder; setup wizard |
| M11 | Documents and sharing | PDF receipts, vouchers, statements, reports; CSV/XLSX; preview → verify → share; history |
| M12 | Bank statement import | CSV/XLSX/text PDF/OCR on the phone, mapping templates, review grid, duplicates, balance check, staged posting, reconciliation |
| M13 | Offline drafts and cache (D-044) | Encrypted cache and draft outbox, auto-sync, review of refusals, policy switch |
| M14 | Search, notifications, close, verifier | Permission-filtered search; notification centre; month close and assistant; Integrity Verifier |
| M15 | Workspace and wealth | ADDON-20 hisab workspace, ledger templates, safe formulas; budgets, goals, recurring; custom role builder |
| M16 | Release and operations | App CI, R2 backups + restore drill, update check, Play Store guidance, final APK, runbooks |

## 6. Owner actions (work continues around them)

1. Create the seven accounts (blocked for Claude by the permission system):
   `cd backend` → `deno task user:create FINLY_SUPABASE_APP_URL <username> "<Name>" <role>`.
2. Escrow `%USERPROFILE%\.finly\finly-kek-v1.txt`; back up `finly-release.jks` + `app/android/key.properties`.
3. Push to GitHub; Supabase CA certificate + "Enforce SSL"; R2 credentials (M16); Firebase project (push).
4. Review the drafted Hindi and Gujarati text; connect a phone for device verification.

## 7. Verification

Backend `deno task verify`, `test:pg17`, `test:pg18`; app `flutter analyze`, `flutter test`; hosted-like smoke;
production health after each deploy; release APK with `apksigner verify` and `aapt dump badging`. A build is reported
as a build, a deploy as a deploy, and an installation only when it happened on a phone.
