# Project memory

Running context between sessions. Newest entries first in §3. Read with [TASKS.md](../TASKS.md) before any work.

## 1. Where we are

- **Milestone:** M0 complete except approval. **Waiting for Gate 1 (stack) and Gate 2 (accounting model)** —
  [DECISIONS.md](DECISIONS.md), sections "Stack Decision Record" and "Accounting Model Record".
- **Branch:** `chore/m0-foundation` (local only; nothing pushed; the private GitHub repository is created after the owner confirms).
- **Design system draft:** [Finly Design System artifact](https://claude.ai/artifact/TS2kABqmbQoASrgxM6r79J), source in
  `design-system/`. Revision for add-ons 08 and 09 is planned for M2, before Gate 4.
- **Machine:** Flutter 3.47.6 / Dart 3.13.5 at `D:\flutter\flutter` (the `C:\flutter` PATH entry is stale); Android SDK
  at `C:\Android\sdk` (platforms 34–36); JDK 21; Node 24; Deno 2.9. **Not yet:** Docker, Supabase CLI, an emulator, a
  connected phone, accepted Android SDK licences (the owner runs `flutter doctor --android-licenses`). D: has ~5.7 GB free.
- **Supabase:** the owner's free org has one active project ("vepari", Mumbai) → one free slot for Finly.

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
- Before M3, with the owner's go-ahead each time: install Docker Desktop and the Supabase CLI; accept Android SDK
  licences; enable USB or Wi-Fi debugging on the phone; create the hosted Supabase project `finly`; create the private
  GitHub repository and push; create the backup storage account.
- The owner may want to review Supabase dashboard AI opt-ins on the organisation (data-privacy setting; not changed).

## 5. Next steps after the gates

M1: threat model and data-flow diagrams, API contracts, encryption and key design, the full schema → Gate 3.
M2: design-system revision (add-ons 08, 09), UX blueprint with tap budgets, master Edge-Case Matrix → Gate 4.
