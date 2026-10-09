# Finly — implementation plan

**Revision 1, 2026-10-09.** How the requirements in [PLAN.md](PLAN.md) get built, in the order they get built. Each
work package (WP) names its database, backend, API, app and test work, and the check that proves it is done.
[TASKS.md](../TASKS.md) ticks the packages off with evidence; [CONTINUATION.md](CONTINUATION.md) says which package is
in progress.

Every package follows the same loop:
- inspect what exists;
- test first where practical;
- implement through the full stack;
- run all suites (PGlite, PostgreSQL 17.11 and 18.6, Flutter analyze and test);
- update the docs;
- one commit per logical change.

A package is not done until its screens work against the real API.

## Ground rules for every package

- **Backend first, then API, then app.** Financial and permission rules live only in the engine, the services and the
  database. The app never calculates an authoritative number.
- **No new money path bypasses the posting service.** New money features become intents planned by the engine and
  posted by `PostingService`, so idempotency, locks, encryption, audit and outbox stay uniform.
- **Reads run as `finly_api` with the actor set**, so row-level security decides visibility.
- **Every mutation endpoint is idempotent.** Entries use the `Idempotency-Key` header; other mutations are designed to
  be safe to repeat.
- **App screens are complete.** Each one handles loading, empty, error, offline, forbidden and conflict states, blocks
  double taps, and shows success only after the server confirms.
- **Migrations are additive.** They are verified on PGlite, PostgreSQL 17 and 18, then deployed with a fingerprint
  check.

---

## R1 — First usable app

### WP1.1 Branding and startup
- **App:** adaptive launcher icon from `finly-launcher-foreground.svg` and `-monochrome.svg` as vector drawables, on the
  `logo-tile` background. Android 12+ splash (`windowSplashScreen*`) plus a pre-12 launch theme. Label "Finly".
  `Branding` constants in one Dart file. Splash → session restore → destination (already routed); an "unreachable
  server" state with retry.
- **Tests:** widget test of the startup gate states. Asset presence is checked by the build.
- **Done when:** `flutter build apk` succeeds and the icon and splash resources are in the APK.

### WP1.2 Least-privilege API login and hosting
- **DB:** `bootstrap/api_login.sql` creates role `finly_app` (LOGIN, NOINHERIT, member of `finly_api`, `finly_auth`,
  `finly_ledger`, `finly_system`; no other rights). A `db:app-login` tool creates its SCRAM verifier, like
  `db_login`.
- **Backend:** Edge Function entry `supabase/functions/api/index.ts` → `api(sql, EnvKekSource)`. It reads
  `FINLY_DATABASE_URL` (the `finly_app` login through the pooler) and the KEKs from function secrets.
- **Docs:** runbook section "Deploy the API" (steps for the owner: secrets, deploy, smoke test `/v1/health`).
- **Tests:** a database test that `finly_app` can do nothing without `set role`, and that its roles have only their
  grants.
- **Done when:** the owner's go-ahead is given, the function is deployed, `/v1/health` returns `ok` over HTTPS, and
  sign-in works.

### WP1.3 Deploy migrations 0015–0017 🔑
- Run `deno task db:migrate`, then compare fingerprints on three channels. Record in the deployment log.

### WP1.4 Release build and seed users 🔑
- **App:** release signing config read from `android/key.properties` (git-ignored); the keystore is created on this
  PC and backed up by the owner. `flutter build apk --release --dart-define=FINLY_API_URL=https://…`.
- **Backend:** `user:create` for each initial user with the owner's go-ahead; passwords only in `.first-login.txt`.
- **Done when:** the APK is installed on a phone, and Krish signs in, sets a password, creates a firm, adds a place
  and records entries.

---

## R2 — Safe daily use

### WP2.1 App lock: M-PIN, biometric, auto-lock, step-up
- **DB:** use `unlock_credential` and `device`. Add `security_event` types if missing.
- **Backend:** `IdentityService.setMpin / changeMpin / verifyMpin / resetMpin`:
  - Argon2id of HMAC(`mpin_pepper` key, PIN);
  - 5 tries, then lockout; a reset needs the password.
  - `POST /v1/auth/unlock` (M-PIN) returns a short step-up proof (session strength 2).
  - Step-up-required errors carry `STEP_UP_REQUIRED`.
- **App:** M-PIN setup after the first password change (skippable unless policy says mandatory), unlock screen
  (keypad), auto-lock on background after a timeout (default 2 minutes; settings: immediate / 1 / 5 minutes),
  biometric unlock. Biometric uses the Android BiometricPrompt via a small Kotlin channel (D-decision in the stack
  record) or `local_auth` if the channel is not ready. The biometric key is invalidated when enrolment changes.
- **Tests:** backend M-PIN tests (lockout, reset, pepper, no plaintext); widget tests for the lock flow.

### WP2.2 Administration of users
- **DB:** use `account_activation`.
- **Backend:**
  - `AdminService`: create user (temporary password or activation code shown once), change roles, suspend,
    reactivate, reset password (new activation code), revoke sessions and devices, archive. Allowed only with
    `users.manage`.
  - Audited as the admin, never as the user (D-030).
  - `POST /v1/auth/activate`: the user's code plus a new password.
- **API:** `/v1/admin/users…`.
- **App:** Admin section (visible with permission): member list, add member (shows the code once with a copy
  button), member detail with actions. A "Have an activation code?" entry on sign-in.
- **Tests:** no admin can read a password; a code works once and expires; suspended users are signed out; actions are
  audited under the admin.

### WP2.3 Recovery and MFA
- **Backend:** recovery codes (hashed) generated at first setup; sign-in with a recovery code forces a password
  change. TOTP for Super Admin (`mfa_factor`, encrypted secret, replay guard). Device revoke / mark lost.
- **App:** security centre (password, M-PIN, recovery codes shown once, devices, sessions); MFA enrolment and the
  MFA step at sign-in.

### WP2.4 Approvals (D-040)
- **DB (0018):** extend `approval_rule` with
  - `kind` (`high_value` | `owner_benefit` | `related_party` | `custom`),
  - `purposes text[]`,
  - `approver_role_id`,
  - `allow_sole_owner_attestation`;
  plus `approval_request` states and an `approval_decision` table (decider, decision, reason, attestation flag,
  content hash).
- **Engine:** `controlsOf(intent, ctx)`: owner-benefit (receiver is an owner and the purpose is personal benefit,
  remuneration, distribution, drawings or a business expense to an owner), related party, and amount.
- **Backend:** after `prepare`, the posting service evaluates the rules. When approval is required: status
  `pending_approval`, outgoing holds placed, nothing posts. `approve` checks the approver is not the creator (or
  attests under the sole-owner rule), checks the content hash matches (a material change means re-approval), then
  posts atomically. `reject` releases the holds.
- **API/App:** approval rules in entity settings; an "Approvals" list in the inbox; approve/reject with reason;
  pending badge on entries.
- **Tests:** self-approval refused; threshold edges; sole-owner attestation audited; editing after approval forces
  re-approval; concurrent approve and reject.

### WP2.5 Reversal and correction
- **Engine:** `reversal` intent → exact mirror journals with `reversal_of_journal_id`. Refused if open items from the
  original are partly settled (`REVERSAL_BLOCKED_BY_SETTLEMENT`) or the entry is already reversed. Posts in the open
  period. A `correction` is a reversal plus a new intent, linked (`corrects`).
- **Backend:** `PostingService.reverse(actor, txnId, reason)` under the same lock order; the original's status
  becomes `reversed`.
- **App:** "Reverse" and "Correct" on entry detail (permission `txn.reverse`), with an impact preview of the affected
  places and dues.
- **Tests:** mirror equality; double-reverse race; reversed open item; balances return exactly.

### WP2.6 The remaining entry workflows
- **App forms** over the existing intents:
  - common expense (several bearers with exact amounts; total must match);
  - personal expense from a firm (withdrawal / owes);
  - firm expense paid personally (creates the reimbursement);
  - handover between places with the holder chain (`transfer` with custody; optional confirmation `transit_confirm`);
  - advance give / account / return;
  - loan given/taken (`loan`) and repayment with principal and interest (`loan_repayment`);
  - bill now and payment later (`bill` + `settlement`);
  - income on credit (customer).
- **Backend:** add `GET /v1/books/:id/fund-options` only if needed by forms.
- **Tests:** an HTTP test per workflow posting real journals; Flutter widget tests for the form validation.

### WP2.7 Review sheet, impact preview, duplicates, quick entry
- **Backend:** `POST /v1/entries/preview` runs `planPosting` against the current context without writing. It returns
  per visible book the lines, money in and out per place, new dues, and warnings (possible duplicate: same type,
  amount and places within 24 h).
- **App:** every form opens a review sheet (what moves where, who owes whom afterwards) before "Record".
  "Repeat last" and recent places first.

### WP2.8 Global search
- **Backend:** `GET /v1/search?q=` across entries (reference, reason, type, date phrases, exact amount via the blind
  index and band), people, places and books. Runs as `finly_api` (RLS first, then rank).
- **App:** search bar on the books screen and in each book; results grouped by type.

### WP2.9 Setup wizard, entity creation flow, locations, funds
- **Backend:**
  - `create_firm` extended with several owners (shares validated ≤ 100 %), partners and initial members.
  - Location access list (`location_access` add/replace) and current holder (`location_holder` history).
  - Fund create and list.
- **App:** first-run wizard (welcome → your books → first business optional → money places → opening position with
  "confirmed/estimated" → done; resumable); entity creation steps; place detail with access and holder; funds list.

### WP2.10 In-app notifications
- **Backend:** an outbox consumer turns events into `notification` rows for the people who may see them;
  `GET /v1/notifications`, mark read.
- **App:** notification centre and badges.

---

## R3 — Complete accounting

| WP | Work |
|---|---|
| 3.1 Period close | **Engine:** closing journals per fund into retained earnings. **Backend:** close/reopen with checklist (trial balance, suspense, pending approvals, verifier clean). **App:** Month Close Assistant. |
| 3.2 Integrity Verifier | **Backend:** a system job (finly_system) recomputing balances from lines, checking chains, trial balance and reciprocity; findings to `integrity_run`/`exception_finding`. **App:** findings list. |
| 3.3 Exception engine | Deterministic rules (duplicates, aging suspense/OBE, unsettled advances and reimbursements, personal-from-business, missing receipts) → findings with problem / reason / affected / action. |
| 3.4 Reconciliation | Cash count and bank reconciliation (`reconciliation` table); resolution only by an approved `cash_adjustment`. |
| 3.5 Statements | **Backend:** report service (authorised data → aggregate): TB, GL, place statement, P&L, BS, cash flow, fund, aging, inter-entity, custody, expense event; Explain Balance. **App:** reports section with period picker. |
| 3.6 Documents and sharing | **Backend:** PDF generation (a vetted pure-TS PDF library, chosen and recorded), CSV; `document` and `share_request` with content hash. **App:** share flow (scope → recipient → format → exact preview → confirm → system share sheet → audit). Photo Proof is rendered in Flutter from server data (`RepaintBoundary` image of a generated card, never a screenshot of a screen). |
| 3.7 Attachments | **Backend:** Supabase Storage via signed URLs, or bytea in the database for small files (decision recorded); type and size limits; permission per access. **App:** attach a receipt (camera or file). |
| 3.8 Audit and grants | Audit viewer; login history; personal-book owner grants (A4); consented support sessions. |
| 3.9 Backups | Encrypted `pg_dump` → Cloudflare R2 (connected tools), a restore drill into a scratch database with the verifier run. |
| 3.10 More accounting | Allocation adjustments, write-off/forgiveness, refunds, interest/EMI schedules. |

## R4 — Configurable access

| WP | Work |
|---|---|
| 4.1 Registry and memberships | Migration: permission metadata (feature, scopes, sensitive, grantable, implemented), membership states, invitations, role scope/versions. |
| 4.2 Effective permissions | `finly.effective_permissions(user, entity)`; `actor_env_ids` and `actor_has_permission` become wrappers; amount and field visibility in read services. |
| 4.3 Role builder and holders | Service validation (cannot grant beyond one's own authority; platform-only permissions excluded); API; app wizard (11 steps) with preview and affected holders. |
| 4.4 Delegation and hierarchy | Delegation records with expiry and onward-delegation limits; hierarchy grants (reporting-only, metadata, amounts, transactions as separate grants). |
| 4.5 Admin tools | Entity switcher, hierarchy screen, entity administration sections, permission simulator, temporary access, break-glass. |
| 4.6 Scenario tests | ADDON-18 scenarios A–X as database and HTTP tests. |

## R5 — Flexible workspace (ADDON-20)

| WP | Work |
|---|---|
| 5.1 Ledger templates | Tables `ledger_template`, `ledger_column` (type, label, semantic role, dropdown list, required, validation, formula), versions; entity-scoped. |
| 5.2 Row grid | `ledger_row` drafts with typed values. A row posts through a mapped intent only when complete. Grid UI with inline editing, search, group and sort. |
| 5.3 Formula engine | Pure TypeScript expression parser and evaluator (whitelisted functions, no recursion beyond a limit, type and unit checking), shared semantics with a Dart evaluator for preview. The server result is authoritative. Composed functions are versioned. |
| 5.4 Rough-hisab workspace | `hisab` parent with child entries, participants, clearing items, reconciliation status and finalisation. |
| 5.5 Assets and conversions | Asset types with units, holdings, sale and exchange intents with executed rates. |
| 5.6 Bank register and reports | Account holders and beneficiaries on deposits; custom report builder. |

## R6 — Whole financial life (ADDON-21, ADDON-22)

| WP | Work |
|---|---|
| 6.1 Wealth | Personal dashboard (liquid vs total), investments, loans with schedules, budgets, earmarks, recurring items. |
| 6.2 Statement import | PDF text extraction in the backend; parser per layout with a review grid; duplicate matching; drafts → engine; balance check. |
| 6.3 Push and secure viewer | FCM push with lock-screen policy; Secure Viewer links with expiry and revocation. |
| 6.4 Languages | Flutter gen-l10n with en/hi/gu; custom labels. |
| 6.5 Certification | PostgreSQL 17 benchmark, monitoring, runbooks, device tests on supported Android versions, accessibility pass. |

---

## Execution order (next steps, in order)

1. WP1.1 Branding and startup.
2. WP1.2 API login role, Edge Function entry and the deploy runbook. Deploying it needs 🔑.
3. WP1.4 Release signing and a release APK build. Installing it needs a phone.
4. WP2.5 Reversal and correction. People need to fix mistakes before daily use.
5. WP2.6 The remaining entry workflows.
6. WP2.7 Review sheet with impact preview.
7. WP2.1 App lock.
8. WP2.2 User administration.
9. WP2.4 Approvals.
10. WP2.8 Search.
11. WP2.9 Setup wizard and entity creation.
12. WP2.10 Notifications.
13. WP2.3 Recovery and MFA.
14. R3 → R6 in table order.

Steps that need the owner (🔑) are prepared fully and then wait only for the go-ahead. Every other package carries on
in the meantime.
