# Working rules

How every change to Finly is made, by any developer or coding agent. Read [MEMORY.md](MEMORY.md) and
[TASKS.md](../TASKS.md) at the start of every session; update them at the end of every change.

## 1. Rules that override convenience

1. Part A of the [build specification](source/BUILD_PROMPT.md) overrides everything; between two sources the stricter
   security, privacy and integrity reading wins; true ambiguity → the safest architecture, recorded in
   [DECISIONS.md](DECISIONS.md) and raised with the product owner (A6).
2. **No AI** in the product. **No screenshot as proof.** **No external share without verification.** **Android only** for now (Y26).
3. Finance is never CRUD: every movement is a balanced double-entry journal; balances are derived; posted history is
   immutable; one real-world event = one master transaction (A7, Y22).
4. The backend is the only authority for money, permissions, decryption and audit. Hiding something on the phone is
   never security (A5, Y11).
5. When financial truth, permission, recipient identity or security state is uncertain: **stop, deny, or require
   review — never guess** (A5, U5).
6. No fake anything: no mock balances, placeholder logic, dummy buttons, hard-coded permissions or companies,
   disconnected screens, or features presented as finished when they are not (C5, add-on 01).

## 2. Stop-and-ask gates

Stop for the product owner's explicit approval before: the technology stack; the Accounting Model Record; the final
database schema; the design system together with the UX blueprint and the master Edge-Case Matrix; any irreversible
migration; any change to posting-rule templates after go-live; anything that changes a Part A rule (C6). Also ask
before anything outward-facing or hard to undo: pushing, merging, deploying, deleting data or branches, creating
cloud projects, installing software, spending money, or changing account and security settings.

## 3. The loop for every change

**READ → UNDERSTAND → INSPECT → MAP DEPENDENCIES → FLOW MAP + EDGE-CASE ROWS → PLAN → IMPLEMENT → BUILD → RUN →
TEST → PROFILE → REVIEW DIFF → FIX → REGRESSION TEST → DOCUMENT (MD + MEMORY) → COMMIT**

- Before code: the feature's [flow map](FLOWS/README.md) and its rows in the [Edge-Case Matrix](TEST_PLAN.md).
- Answer the C4 questions for every feature: why it exists, who uses it, which data, permissions and security level,
  what happens offline, on failure, on expiry, on concurrency, which audit events, reports, notifications and shares
  change, and how a future web client would use it.
- Implement across UI, state, domain, data, API, database, security, authorization, financial logic, impact and
  conflict, audit, offline, errors, recovery, sharing, tests and documentation — never one layer alone.
- Compiling is not correctness. "The screen opens" is not done. Done is [TEST_PLAN.md](TEST_PLAN.md)'s definition.
- On any failure: find what failed, why, in which layer and rule, then the smallest safe fix and its test (C3).

## 4. Git

- Short-lived branches named `type/short-description`; never commit straight to `main` after the initial commit;
  merge only with approval.
- **One focused commit per verified change, no matter how small** (add-on 05). Never batch unrelated changes; never
  start the next change from an unverified or uncommitted one.
- Before every commit: `git status` → `git diff --staged` → tests → secret scan of staged files → review → commit.
- Conventional Commits (`feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`):
  imperative subject under ~72 characters, a body that says why, and the co-author trailer when an agent wrote it.
- Never commit secrets, credentials, keys, `.env` files, keystores, real financial data or generated junk.

## 5. Engineering standards (add-ons 02 and 03)

- Clean architecture with one-way dependencies: UI → presentation/state → domain → data → API/backend → database.
  Business rules live once, in the domain or the backend, never per screen.
- KISS, DRY, SOLID, YAGNI, composition over inheritance, explicit dependencies, fail fast, defensive programming at
  boundaries, immutability where it helps.
- Mobile: nothing heavy on the UI thread; lifecycle-safe; survives rotation, process death, low memory, network
  changes and session expiry; lazy lists, pagination, debouncing, caching with permission scope; profile before optimising.
- Every new dependency is justified against Flutter's or the platform's built-ins, its maintenance, licence,
  security and size, and recorded in [DECISIONS.md](DECISIONS.md) (add-on 04).
- No magic numbers, dead code, commented-out code, giant functions, hidden side effects or fragile hacks.
- Logs never contain passwords, PINs, tokens, keys, private financial values or personal data beyond what is needed.

## 6. Data used in development

Only seed and fixture data from the build specification's examples (Mint, JSK, Tijori, Krish Patel…). Never real
financial data outside production; never production data in development (E, F3).
