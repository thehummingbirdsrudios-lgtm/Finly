# Project memory

Running context between sessions. Newest entries first in §3. Read with [TASKS.md](../TASKS.md) before any work.

## 1. Where we are

- **Milestones:** M0 done; Gates 1 and 2 resolved (D-013..D-018, D-021); the accounting engine is built and tested
  (`backend/src/domain/engine`, 49 tests); **M1 database: design and implementation done** — 96 tables, 10 migrations,
  generated data dictionary ([docs/database/](database/README.md), D-025..D-035). Owner decided Q1 (acknowledgement,
  D-029), Q2 (keep amount encryption, D-033), Q3 (activation by the person, D-030), online only (D-031). **Waiting for
  the owner:** F8 and F9 ([F8-F9-explained.md](F8-F9-explained.md)).
- **Branches:** work on `feat/database`; `main` is fast-forwarded after each verified milestone. Remote `origin` =
  github.com/thehummingbirdsrudios-lgtm/Finly (public). **Nothing pushed yet:** this PC's saved GitHub credentials belong
  to another account (TheDevKriish → 403); the owner signs in and runs `git push -u origin main`.
- **Next:** the persistence layer (posting service writing the schema in one transaction, encryption service, Integrity
  Verifier), then the identity service and the HTTP API, then the Flutter app screens.
- **Backend verification:** `cd backend && deno task verify` (format, lint, types, all tests on PGlite 0.5.8 =
  PostgreSQL 18.3), then `deno task test:pg17` and `deno task test:pg18` on the owner's real servers (PostgreSQL 17.11
  on port 5435, 18.6 on 5432; URLs only in the git-ignored `backend/.env.local`, D-032). Concurrency and the
  dump/restore recovery drill run only on real servers.
- **Android build here:** Gradle needs `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<a writable folder>` in this
  sandbox, otherwise "Unable to establish loopback connection".
- **Design system draft:** [Finly Design System artifact](https://claude.ai/artifact/TS2kABqmbQoASrgxM6r79J), source in
  `design-system/`. Revision for add-ons 08 and 09 is planned for M2, before Gate 4.
- **Machine:** Flutter 3.47.6 / Dart 3.13.5 at `D:\flutter\flutter`; Android SDK at `C:\Android\sdk`; JDK 21;
  Node 24; Deno 2.9. **Not yet:** Docker, Supabase CLI, a connected phone.
- **Supabase (D-034):** dedicated project **`finly`**, id `joidjmwfajbeivyffymb`, ap-south-1, PostgreSQL 17, free plan,
  created 2026-10-09 through the Supabase MCP with the owner's approval. The org's other project `vepari` is a
  different live app — never touch it.

## 2. First-session restatement (BUILD_PROMPT, "First session — what to do now", step 1)

**Part A in one paragraph.** Build the whole production system from nothing, Android only, with a backend, database,
financial engine, authorization, security and audit that a future web and iOS client reuse unchanged — one database,
one backend, one financial truth. No AI of any kind; "intelligence" is deterministic rules. Proof is only ever
generated (message, photo proof, PDF, secure PDF, secure viewer) and shared only after authorisation, recipient
verification, an exact preview, review, step-up where required and an explicit Verify & share; any change after
review voids it. Personal finance is private to its owner; nobody else, Super Admin included, sees it without the
owner's audited grant. The backend is the only authority; every mutation passes the full precondition gate and the
impact and conflict engine; sensitive values are encrypted with keys that never reach the phone; passwords and PINs
are hashed and never retrievable. When anything is uncertain: stop, deny or require review. Conflicts resolve to the
stricter reading, and every movement of value is a balanced double-entry journal with the AC1 concepts kept apart.
The app must still feel simple and fast, and every realistic combination of conditions has a defined, tested outcome.

**The glossary** is [SRS.md](SRS.md) §2: entity ≠ ledger account ≠ money location ≠ fund ≠ ownership ≠ holder ≠
master transaction ≠ journal entry ≠ journal line ≠ balance ≠ open item ≠ receivable/payable ≠ liability; Avak and
Javak are display labels for money into and out of the viewed location, mapped to debits and credits by posting rules.

**AC10 example 4 — the Angadiya visit as journal lines.** Krish pays ₹45,000 personally (Travel 10,000 · Hotel 12,000 ·
Food 5,000 · Local 3,000 · Firm charges 8,000 · Other 7,000); Mint bears 30,000, JSK 5,000, Krish 10,000.

| Entity | Dr | Cr |
|---|---|---|
| Krish (personal) | Personal expenses (by category) 10,000 · Reimbursement receivable – Mint 30,000 · Reimbursement receivable – JSK 5,000 | Bank or Cash – Krish (the concrete account chosen in the form) 45,000 |
| Mint | Expenses (by category) 30,000 | Reimbursement payable – Krish 30,000 |
| JSK | Expenses (by category) 5,000 | Reimbursement payable – Krish 5,000 |

Each entity balances on its own (45,000 = 45,000; 30,000 = 30,000; 5,000 = 5,000). Open items: Mint owes Krish 30,000;
JSK owes Krish 5,000. Settling Mint's: [Mint] Dr Reimbursement payable – Krish 30,000 / Cr Bank – Mint 30,000;
[Krish] Dr Bank – Krish 30,000 / Cr Reimbursement receivable – Mint 30,000 — the open item closes and links to the
original expense. How each entity's share is broken down by category is an open question for the owner (DECISIONS F1) — the spec gives categories only for the whole ₹45,000.

**Ambiguities found:** see [DECISIONS.md](DECISIONS.md), Accounting Model Record revision 2 — F1 (Angadiya category split) and flags F2–F7.

## 3. Session log

### 2026-10-09 — Session 4

- Gate response 03 (Q1–Q4, local PostgreSQL), add-on 12 (complete the app, online only), add-on 13 (final master:
  Supabase via MCP, enterprise architecture and UI/UX, full test strategy), add-on 14 (everything is data) — all
  recorded verbatim in `docs/source/`.
- Encryption investigated and kept (D-033): benchmarks, recovery drill on PostgreSQL 17.11; production KEK escrow and
  the production restore drill remain with the owner.
- Migration 0010: acknowledgement (setting, per-person request, no posting while pending), activation codes, consented
  support sessions, online-only removals. Review found 4 gaps (backdated activation time, extendable support window,
  self-withdrawal, request after posting) — fixed with regression tests. PGlite 107 passed; PostgreSQL 17.11 and 18.6
  52/52 each.
- Created the Supabase project `finly` (owner's choice over sharing `vepari`).

### 2026-10-09 — Session 3 (continued)

- Owner sent the database master prompt (add-on 11): designed the database first — the 16 required outputs in
  `docs/database/` — then implemented it.
- An independent architecture review found 2 blockers and 9 major issues; all fixed in design, migrations and engine
  (engine: funds on open items, settlement kinds, leg references — commit 9187e41). Tests then found two policy loops
  and a leg-without-fund leak, also fixed.
- PGlite 0.3.3 crashed on every PL/pgSQL error; upgraded to 0.5.8 (PostgreSQL 18.3) after checking its age and licence.
- 9 migrations, 93 tables, 40 database tests (ledger structure, privacy/RLS, lifecycle, catalog parity with the design
  document, the engine and the generated dictionary). Mutation checks: breaking the engine or the owner-grant guard
  makes the intended tests fail.

### 2026-10-08 — Session 2

- Owner approved Gate 1 with conditions (D-013..D-017: portable Supabase use, Android 7.0+, backups on the owner's
  existing Cloudflare R2 via the connected tools, own error reporting, direct signed APK). Add-on 10: continue to a
  complete app, stopping only at external blockers (D-019).
- Gate 2 not yet approved. Accounting Model Record rewritten (revision 2): custody as full history (person-custody
  locations, custodian history for places, custody events with confirmation, Cash in transit); Angadiya split left
  Open with three options as concrete entries (F1); flags F2–F7 waiting for the owner.
- **Next:** create the R2 backup bucket via the Cloudflare tools; scaffold the Flutter app (`app/`) and the backend
  (`supabase/`); try a debug APK build — Android SDK licences are not accepted yet, which is the first expected
  external blocker; Docker and the Supabase project come next.

### 2026-10-08 — Session 1

- Read the build specification (1,194 lines) and received add-ons 01–09 during the session; all recorded verbatim in
  `docs/source/` with an index.
- Owner decisions: keep every gate; test on the owner's phone; Docker + local Supabase for development and one hosted
  free project for production; a private GitHub repository; **Flutter + Dart** (add-on 04); the name **Finly** (add-on 07).
- Built and published the design system draft: tokens (45 colours in light and dark, 138 pairs WCAG-AA checked),
  brand book with six sections, 47 reference components including logo, splash and setup wizard, a cover; local
  render and contrast checks; a review harness.
- Wrote the documentation skeleton (PRD, SRS, RULES, SECURITY, TEST_PLAN, ARCHITECTURE, DESIGN, FLOWS, privacy
  inventory), the Stack Decision Record (researched) and the Accounting Model Record. Stopped at Gates 1 and 2.
- Noticed: the `claude-reflect` post-commit hook in the owner's global setup fails on every shell command (it breaks on
  the space in the Windows user path) — harmless to the project, worth fixing in the owner's Claude setup.

## 4. Open items

- Gate 1 owner decisions: [DECISIONS.md](DECISIONS.md) S11 (stack approval, minimum Android version and the oldest
  phone in use, backup storage, observability, distribution).
- Gate 2: approve or change A1–A9.
- With the owner's go-ahead each time: accept Android SDK licences if still needed; enable USB or Wi-Fi debugging on
  the phone; push to GitHub (`git push -u origin main` from the owner's account); create the backup storage account;
  generate and escrow the production KEK (docs/operations/key-recovery.md).
- Owner decisions still open: F8, F9.
- The owner may want to review Supabase dashboard AI opt-ins on the organisation (data-privacy setting; not changed).

## 5. Next steps

0. Apply migrations 0001–0010 to the Supabase project `finly` with the checksummed runner; check the security and
   performance advisors; CI workflow with a PostgreSQL 17 service; query benchmark on PostgreSQL 17.
1. Persistence: posting service (lock protocol of docs/database/06 §6.2, acknowledgement flow 06 §6.7), encryption
   and blind-index service (HKDF keys, D-026), audit and journal hash chains, Integrity Verifier.
2. Identity service (Argon2id, sessions, devices, M-PIN, TOTP) and the versioned HTTP API with the policy engine.
3. Flutter app: theme from tokens, startup and sign-in flows, quick entry, activity, balances, outstanding.
4. M2 design-system revision (add-ons 08, 09), UX blueprint, master edge-case matrix → Gate 4.
