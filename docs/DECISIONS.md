# Decisions

Every architectural and product decision, with its reason. **Status** is `Decided` (by the product owner or a source
document), `Proposed` (waiting for a gate) or `Superseded`. Gates: 1 stack, 2 accounting model, 3 schema, 4 design/UX/edge cases.

## Decision log

| ID | Decision | Status | Reason / source |
|---|---|---|---|
| D-001 | The client is **Flutter + Dart**, Android first; iOS and web later on the same backend | Decided (2026-10-08) | Add-on 04 |
| D-002 | The product is named **Finly** (the repository folder stays `Finely`) | Decided (2026-10-08) | Add-on 07 |
| D-003 | Keep every approval gate of BUILD_PROMPT C6 | Superseded by D-019 | Product owner, first session |
| D-004 | Development and tests on a local Supabase stack in Docker; one hosted free project for production | Decided (2026-10-08), backend still under Gate 1 | Product owner, first session |
| D-005 | Build and test on the owner's own Android phone (USB / Wi-Fi debugging) | Decided (2026-10-08) | Product owner, first session |
| D-006 | A private GitHub repository; push only after the owner confirms | Decided (2026-10-08) | Product owner, first session |
| D-007 | One commit per verified change on short-lived branches; M0 on `chore/m0-foundation` | Decided (2026-10-08) | Add-on 05, BUILD_PROMPT E |
| D-008 | The design system is the single theme source: `palette.json` → `tokens.json` → generated Flutter theme; brand in `brand.json` | Decided (2026-10-08); content final at Gate 4 | BUILD_PROMPT K2, add-ons 07, 09 |
| D-009 | Icons are Flutter's built-in Material icons (Rounded); fonts Mukta + Mukta Vaani bundled (OFL 1.1), no runtime font download | Proposed (Gate 4) | Add-on 04 (built-ins first); offline and privacy |
| D-010 | Add-ons 06/07 reconciled with the spec: "Remove" a user archives anyone with history (H15); Super Admin gains no personal-finance visibility (A4); Krish's first temporary password comes from a one-time local bootstrap, only its hash is stored | Decided (Gate 1, 2026-10-08) | Stricter reading wins (A6.2) |
| D-011 | Seed users are bootstrap input, not code or migrations | Decided (Gate 1, 2026-10-08) | Add-ons 06/07, F3 |
| D-012 | No staging project on the free tier (the owner's second free project slot is used by another project); CI runs every test against a fresh local stack as the staging equivalent | Decided (Gate 1, 2026-10-08) | Supabase free plan: 2 active projects |
| D-013 | **Gate 1 approved** with conditions: Supabase free plan first, **designed for portability** (plain-Postgres schema in our own `finly` schema, API in portable TypeScript behind interfaces for identity, storage and secrets — see S12) | Decided (2026-10-08) | [Gate response 01](source/GATE-RESPONSE-01-gates-1-2.md) |
| D-014 | Minimum Android 7.0 (API 24), target API 36; low-end devices kept practical (lazy lists, small APK, no heavy animation runtimes) | Decided (2026-10-08) | Gate response 01 |
| D-015 | Encrypted backups go to the owner's **existing Cloudflare R2**, configured through the connected Cloudflare tools; the owner is not asked to create or connect Cloudflare again | Decided (2026-10-08) | Gate response 01 |
| D-016 | Own secure error and diagnostic reporting first; never passwords, keys, tokens, financial values or decrypted private data in error logs; Sentry only after its advantage is explained and accepted | Decided (2026-10-08) | Gate response 01 |
| D-017 | Distribution by a release-signed APK installed directly on each phone | Decided (2026-10-08) | Gate response 01 |
| D-018 | **Gate 2 not yet approved.** Custody is redesigned as full historical tracking; the Angadiya category split stays undecided until the owner chooses; every other accounting choice follows professional double-entry practice and is flagged where it changes financial behaviour — see "Accounting Model Record — revision 2" | Decided (2026-10-08) | Gate response 01 |
| D-019 | Development continues without stopping at internal gates; Gate 3 (schema) and Gate 4 (design/UX/edge cases) are delivered as reviewable documents and flagged, and work stops only at a genuine external blocker (SDK licences, device, Docker, Supabase project, new accounts, GitHub) with exact steps for the owner | Decided (2026-10-08) | [Add-on 10](source/ADDON-10-continue-to-full-completion.md), Gate response 01 |
| D-020 | Remote `origin` = github.com/thehummingbirdsrudios-lgtm/Finly (made public by the owner on 2026-10-08). `main` carries verified work; pushing needs the owner's GitHub sign-in on this PC | Decided (2026-10-08) | [Gate response 02](source/GATE-RESPONSE-02-f1-f7.md) |
| D-021 | **Accounting Model Record revision 3** (below) replaces revision 2: the owner's F1–F7 answers and RULEBOOK-01..03 are applied; F8 and F9 are new interpretations, flagged | Decided (2026-10-08) | Gate response 02, rulebooks |
| D-022 | Android application id `app.finly`, Flutter project in `app/` | Decided (2026-10-08) | Package names must avoid Kotlin keywords |
| D-023 | **Finly runs its own identity service** inside the Finly API (Argon2id passwords, rotating refresh tokens bound to devices, TOTP MFA) instead of Supabase Auth. Supabase still hosts the database, the API and file storage | Decided (2026-10-08), owner informed | S12 portability (D-013); usernames, temporary passwords and Super Admin resets (add-ons 06/07) fit naturally; testable without Docker |
| D-024 | Backend tests run against PGlite (PostgreSQL compiled to WebAssembly, an npm dev dependency) when no Postgres server is available; CI also runs them against a real PostgreSQL 17 service | Decided (2026-10-08); version updated by D-028 | Docker is not installed; no system software installed |
| D-025 | **Database design (Gate 3, add-on 11)** in [docs/database/](database/README.md): 93 tables in schema `finly`; five least-privilege roles (`finly_owner`, `finly_auth`, `finly_api`, `finly_ledger`, `finly_system`) with client roles denied; RLS by a transaction-local actor; encrypted amounts with balance snapshots per slice; composite foreign keys keep each line's account and fund in its own entity's books; global HMAC hash chains for journals and audit | Decided (2026-10-08); open questions Q1–Q14 flagged to the owner; independent review findings applied | Add-on 11; AC6, AC7, A4; delivered under D-019 |
| D-026 | **No key material in the database.** Data, blind-index, hash-chain, file and M-PIN-pepper keys are derived with HKDF-SHA-256 from versioned KEKs in the function secret store; `key_version` stores version numbers only. Supersedes the wrapped-DEK plan in S3 | Decided (2026-10-08) | Part M ("never in ordinary DB tables"), stricter reading (A6.2) |
| D-028 | Tests use **PGlite 0.5.8** (PostgreSQL 18.3, Apache-2.0, published 2026-08-26). PGlite 0.3.3 crashed the whole database on any error raised inside PL/pgSQL, which every database guard relies on. Migrations use nothing PostgreSQL 18-only; production and CI stay on PostgreSQL 17 | Decided (2026-10-09) | Reproduced in isolation; open question Q14 |
| D-029 | **Entries in someone else's personal books wait for that person's acknowledgement by default**; only the receiving person may switch their own books to immediate posting with notification. Pending events hold the giver's available balance (AC9) and post every effect atomically on acknowledgement | Decided by the owner (2026-10-09, Q1) | [Gate response 03](source/GATE-RESPONSE-03-decisions-q1-q3-postgres.md) |
| D-030 | **Accounts are invited by the Super Admin and activated by the person**: one-time activation credential (24 h, single use), own password and M-PIN set on the person's own phone, existing books linked not duplicated, no impersonation path, admin actions under the admin's identity, consented time-limited support access, all audited | Decided by the owner (2026-10-09, Q3) | Gate response 03 |
| D-031 | **Online only.** No local database, no offline mode, no offline queue: the phone keeps no copy of financial data and every change is saved centrally. Network failures are retried with the same idempotency key; other users see changes through push nudges plus a fetch of what changed. Supersedes the offline cache and sync queue in S5 and BUILD_PROMPT P7 | Decided by the owner (2026-10-09) | [Add-on 12](source/ADDON-12-complete-the-app-online-only.md) |
| D-032 | **Database tests run on the owner's local PostgreSQL 17.11** (the production version, port 5435) and 18.6, besides in-process PGlite; connection details live only in the git-ignored `backend/.env.local`. CI will run PostgreSQL 17 | Decided (2026-10-09) | Gate response 03 |
| D-033 | **Amount-level encryption is kept** (the authorised fallback is not used): AES-256-GCM in the API with HKDF-derived keys from a versioned KEK outside the database; measured cost 0.31 ms per posting and 3.3 ms per 500-balance dashboard; recovery from an escrowed key proven on PostgreSQL 17.11. Not production-ready until the owner escrows the production KEK and the production restore drill passes. A cloud KMS key source is a supported later upgrade | Decided (2026-10-09) | [encryption-architecture.md](security/encryption-architecture.md); gate response 03 Q2 |
| D-034 | **Finly gets its own Supabase project `finly`** (id `joidjmwfajbeivyffymb`, ap-south-1 Mumbai, PostgreSQL 17, free plan, $0/month). The account's only other project, `vepari`, runs a different application with live users and orders; sharing it would share sign-ins, connection limits, backups and point-in-time restore between two apps | Decided by the owner (2026-10-09) | [Add-on 13](source/ADDON-13-final-master-production-grade.md) |
| D-035 | **Everything is data** (add-on 14): no person, firm, account, fund, location or role assignment in application logic; relationships and permissions by id; names are renamable labels; the seed holds generic configuration only; specification names appear only in docs and test fixtures | Decided (2026-10-09) | [Add-on 14](source/ADDON-14-fully-dynamic-configurable.md) |
| D-036 | **Production migrations run through our own checksummed runner** (`deno task db:migrate`) as a dedicated `finly_migrator` login over the Supabase session pooler (IPv4), created from a SCRAM verifier so no password passes through SQL, chat or logs; the login is disabled between deployments; every deployment is verified by an identical catalog fingerprint on a fresh local PostgreSQL 17 build, over the migrator connection and over the Supabase MCP (verified HTTPS). First deployment 2026-10-09: migrations 0001–0011 | Decided (2026-10-09) | [deployment.md](operations/deployment.md) |
| D-027 | Migrations are plain SQL in `backend/db/migrations/`, applied by our own checksummed runner (portable to any PostgreSQL 17 and PGlite); not tied to the Supabase CLI | Decided (2026-10-08) | S12 portability, D-024 |

---

## Stack Decision Record (Gate 1) — Approved 2026-10-08 with conditions (D-013 … D-017)

Research done on 2026-10-08. Each layer: **one recommendation**, at most one alternative, and why. Sources at the end.

### S1. Backend platform

**Recommendation: Supabase (free plan), Mumbai region (ap-south-1).** Postgres 17, Auth, Storage, Edge Functions
(Deno/TypeScript) and pg_cron in one managed service, with a local Docker stack for development.

Facts that shape the design (official pricing and limits pages):

| Free plan fact | Consequence for Finly |
|---|---|
| 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users, 500,000 Edge Function invocations | Ample for one family and its firms for years; compress attachments; monitor size |
| 2 active free projects | One for Finly production (the other slot holds the owner's "vepari" project); no hosted staging — see D-012 |
| **Projects pause after 7 days of inactivity**; pg_cron stops while paused | Daily use keeps it active; the daily backup job also connects; an alert if the project pauses; documented one-click restore |
| **No automatic backups, no point-in-time recovery** | **We run our own** encrypted daily `pg_dump` (see S9) — a hard requirement, not optional |
| Edge Functions: 256 MB memory, **2 s CPU per request** (I/O excluded), 150 s wall clock | Posting one transaction is well within budget; the Integrity Verifier runs in batches |
| Logs kept 1 day | Our own audit log and error reports live in our database |
| Supabase documents pgsodium as pending deprecation and warns not to keep encryption keys in the same database as the data | Application-level encryption happens in Edge Functions with keys outside the database (S3) |

Why Supabase over the alternatives:

| Option | Verdict |
|---|---|
| **Supabase** | Real Postgres (ACID, row locks, constraints, migrations), managed auth with TOTP MFA, server functions on the free plan, local dev parity, a Flutter SDK, data in India. Weak points — no backups, pausing, 2 s CPU — are handled by design above. |
| Neon (free) + a separate API host | Excellent Postgres with 6-hour history on free, but no auth, storage or functions: we would need a second free host for the API, which is where free tiers are weakest. *Alternative if Supabase ever becomes unsuitable* — the schema and SQL move over unchanged. |
| Firebase (Spark) | Firestore is a document store without SQL constraints for double-entry, and server-side Cloud Functions need the paid Blaze plan, so the backend could not be the authority. Rejected. |
| Self-hosting on Oracle Cloud Always Free | Full control and free software keys in OCI Vault, but the Ampere allowance was cut in half in mid-2026 with inconsistent enforcement, and we would operate Postgres, patching and backups ourselves. Rejected for reliability. |
| Cloudflare D1 / Workers, PocketBase, Appwrite | SQLite-class databases without the row-level locking and constraint depth the ledger needs, or a smaller free tier for server code. Rejected. |

### S2. Backend code and API

**Recommendation: one versioned HTTP API (`/v1/...`) implemented as Supabase Edge Functions in TypeScript (Deno), with
a direct Postgres connection that holds each financial operation in a single database transaction.**

- The Android app talks only to this API (plus Supabase Auth for sign-in). Every financial table denies all access
  to client roles through row-level security; the API's service role is the only writer.
- Each mutation: authenticate → session/device checks → authorize → validate → idempotency check → `BEGIN` → lock the
  affected balance-snapshot rows (`SELECT … FOR UPDATE`) → decrypt in memory → build journals from the posting-rule
  template → check every AC6 invariant → encrypt → insert journal, lines, snapshots, open items, audit → `COMMIT`.
- Database-side guards back this up: foreign keys, `CHECK` constraints, and triggers that forbid updating or deleting
  posted journals and lines.
- **The contract is an OpenAPI 3.1 file in the repository**; Dart client types and TypeScript request/response types
  are generated from it, so the future web and iOS clients use the same contract.
- *Alternative:* a Dart backend (Serverpod or Dart Frog) sharing models with the app — rejected for now because it
  needs its own always-on host, which no reliable free tier offers.

### S3. Encryption and keys

**Recommendation: AES-256-GCM envelope encryption in the Edge Functions (WebCrypto).** A key-encryption key (KEK) lives
only in the Edge Functions' secret store; it wraps versioned data-encryption keys stored in the database; each
encrypted value records its key version. Passwords use Supabase Auth's bcrypt; M-PINs and recovery codes use Argon2id
in our own tables.

- What this protects against: a stolen database dump or backup, a leaked read-only database credential, anyone with
  dashboard SQL access but not the function secrets, and the phone (which never holds a key).
- What it does not: an attacker who controls both the function secrets and the database — i.e. the Supabase account
  itself. Mitigation: MFA on the Supabase and GitHub accounts, few people with access, key rotation, audit of key use.
- Searchable encrypted fields use keyed HMAC indexes (exact match) and bucketed indexes for amount ranges; designed at M1.
- *Alternative:* keys in Supabase Vault — rejected, because Supabase itself advises against keeping keys in the same
  database as the data.

### S4. Authentication

*Superseded by D-023: Finly runs its own identity service; Supabase Auth is not used.*

**Recommendation: Supabase Auth for passwords, sessions, refresh-token rotation and TOTP MFA; our own tables and API for
devices, M-PINs, step-up, lockouts and recovery codes.**

- Usernames (add-on 06) map to an internal, non-deliverable email address in Supabase Auth, so people sign in with a
  username; nobody needs a real email account.
- Forgot password without email or SMS: recovery codes plus MFA, or a Super Admin reset that issues a new temporary
  password (never retrieval). SMS OTP is not used — it costs money.
- The Supabase Flutter client stores its session in a custom storage backed by the Android Keystore
  (`flutter_secure_storage`), never in plain shared preferences.

### S5. Android client

- **Flutter 3.47 / Dart 3.13 (stable).**
- **Minimum Android: 7.0 (API 24)** — Flutter 3.47's own floor — targeting API 36. Recommended because workers may use
  older phones (add-on 01). Security-sensitive roles can be held to a higher minimum by device policy (L10): for example,
  Super Admin and Admins on Android 10+. *Alternative:* API 26 (Android 8.0) for every user.
- Architecture: feature-first clean layers (ARCHITECTURE §3).

| Need | Recommendation | Why (vs built-ins) |
|---|---|---|
| State management | `flutter_riverpod` 3.4 | Compile-safe dependency graph, async state, easy to test; Flutter has no built-in equivalent at this scale |
| Navigation | `go_router` 18 | Maintained by the Flutter team; deep links and auth redirects |
| HTTP | `dio` 5 | Interceptors (auth, idempotency keys, correlation IDs), timeouts, cancellation |
| Auth client | `supabase_flutter` 2.18 (auth only, custom secure storage) | Session refresh and MFA against Supabase Auth |
| Secure storage | `flutter_secure_storage` 11 | Keystore-backed; holds session and database keys |
| ~~Offline database~~ (superseded by D-031: online only, no local database) | `drift` 2.35 + `sqlite3` 3.x built as **SQLite3MultipleCiphers** (`hooks: user_defines: sqlite3: source: sqlite3mc`) | Typed queries and migrations; whole-file encryption with an MIT-licensed cipher build. The older `sqlcipher_flutter_libs` reached end of life in February 2026 |
| ~~Background sync~~ (superseded by D-031) | `workmanager` 0.10 | Android WorkManager for retries that survive process death |
| Connectivity | `connectivity_plus` 7 | Network-state signals (the server remains the truth) |
| Models / JSON | `freezed` 4 + `json_serializable` 6 (dev, code generation) | Immutable value types and exhaustive unions without hand-written boilerplate |
| Formatting, i18n | `intl` + Flutter's built-in `gen-l10n` (ARB) | Official; Indian grouping and three languages |
| Charts | `fl_chart` 1.2 for charts; `CustomPainter` for allocation bars | Mature and light; simple bars need no package |
| Motion | Built-in animations + `animations` 3 (Flutter team: fade-through, shared axis, container transform) | Covers add-on 08's patterns without heavy runtimes; no Lottie or Rive unless a specific illustration needs it |
| Skeletons, splash, launcher icon | Built-in widgets; hand-written Android resources (adaptive icon vector, Android 12 splash theme) | Our own SVG paths convert to vector drawables; no generator package needed |
| Biometric unlock, secure screens, WhatsApp hand-off, device-security changes | **A small in-app Kotlin platform channel** using `androidx.biometric` with a Keystore `CryptoObject`, `FLAG_SECURE`, a targeted share `Intent`, and key-invalidation detection | `local_auth` returns only yes/no and cannot bind unlock to a Keystore key; doing this ourselves is a few hundred lines and removes three packages |
| Sharing (generic) | `share_plus` 13 | The Android share sheet for files and text |
| Tests | `flutter_test`, `integration_test`, `mocktail`, golden tests; `patrol` 4 for on-device E2E (system dialogs such as the biometric prompt) | Official tools first; Patrol only where native dialogs must be driven |

Every package above is actively maintained (published within the last year, most within the last two months). Each is
re-checked for licence, maintenance and size when it is first added.

### S6. Documents and sharing

- **PDFs are generated on the server** from authorised data (TypeScript, `pdf-lib`, MIT). **Real AES-256 encryption is a
  spike at M9**: candidates are `@libpdf/core` (Documenso) and `@pdfsmaller/pdf-encrypt`. Neither is proven in our
  runtime yet; the chosen one must produce files that `qpdf --show-encryption` reports as AES-256 (revision 6). If
  neither passes, the Secure Viewer carries confidential documents and plain PDFs are not offered for those levels.
- Photo Proof cards are drawn in the app from server-authorised data (Flutter renders the card off-screen to an image).
- **Secure Viewer:** a small server-rendered page from an Edge Function, behind an expiring, revocable token — not a web app.
- **WhatsApp:** Android share intent only. Delivery cannot be confirmed by this route, so the app records "Handed to
  WhatsApp", never "Sent". The WhatsApp Business API is rejected: it is paid per message.

### S7. Notifications

Firebase Cloud Messaging (free) for push, with masked or generic text per policy; the Firebase project is used for
messaging only.

### S8. Observability

No third-party crash service at first. The app sends scrubbed error reports (no financial values, no personal data)
to our own API, kept 30 days; the backend writes structured logs and the audit log. *Alternative:* Sentry's free plan
with strict scrubbing, if the owner prefers its tooling.

### S9. Backups and CI

- **Daily encrypted backup:** a scheduled GitHub Actions job runs `pg_dump`, encrypts it with `age` to a public key whose
  private key the owner keeps offline, and uploads it to free object storage — **Cloudflare R2 (10 GB free) is
  recommended; the owner must create that account.** A monthly restore drill rebuilds a local stack from the latest
  backup and runs the Integrity Verifier.
- **CI:** GitHub Actions on every push — Flutter analyze and tests, Deno lint and tests, a local Supabase stack with
  database tests, a debug APK build, secret scanning. GitHub Free includes 2,000 minutes a month for private repositories.

### S10. Distribution

A release-signed APK, installed directly on family and worker phones, with in-app update checks against our own API.
*Alternative:* Firebase App Distribution (free) for testers. Google Play is not needed for a private app; its developer
account also costs money.

### S11. Decisions needed from the owner at Gate 1

1. Approve Supabase (S1–S4) and the Flutter package set (S5).
2. Minimum Android version: **API 24 (recommended)** or API 26 — and the oldest phone in the family or among the workers.
3. Backup storage: create a free Cloudflare R2 account (recommended), or name another place.
4. Observability: our own error reports (recommended) or Sentry.
5. Distribution: direct APK (recommended) or Firebase App Distribution.

### S12. Staying portable (owner condition, D-013)

Supabase is used for what it does well, behind seams that let Finly move to plain Postgres plus any Deno/Node host:

| Concern | How it stays portable |
|---|---|
| Database | All Finly tables, functions and triggers live in our own `finly` schema in plain PostgreSQL (no Supabase-only types or extensions in the ledger). Migrations are ordinary SQL files run in order. Row-level security only denies client roles; the authority is the API. |
| API | One versioned HTTP API in TypeScript. Request handling is a plain `(Request) → Response` function with its dependencies injected; the Supabase Edge Function entry point is a thin adapter. The same code runs on Deno, Deno Deploy or a container. |
| Identity | Behind an `IdentityProvider` interface (sign-in, refresh, sign-out, admin create/reset/revoke, MFA). Supabase Auth is the first implementation; password hashes are bcrypt and exportable. Every Finly table refers to our own `finly.users.id`, never directly to `auth.users`. |
| Secrets and keys | Behind a `KeyProvider` interface (current key-encryption key and versions). First implementation reads function secrets; a cloud KMS can replace it. |
| Files | Behind a `BlobStore` interface (put, get, signed URL, delete). Supabase Storage first; R2 or S3 later. |
| Backups | Plain `pg_dump` custom-format archives, encrypted, in R2 — restorable into any Postgres 17. |
| Client | The Flutter app talks only to the Finly API and the identity endpoints, through one `ApiClient`; nothing in the app knows table names. |

### Sources

- [Supabase pricing](https://supabase.com/pricing) · [Edge Function limits](https://supabase.com/docs/guides/functions/limits) · [pgsodium — pending deprecation, keep keys outside the database](https://supabase.com/docs/guides/database/extensions/pgsodium) · [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Neon pricing](https://neon.com/pricing) · [Oracle free tier cut, InfoQ, July 2026](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [sqlite3 hook options (SQLite3MultipleCiphers, SQLCipher)](https://github.com/simolus3/sqlite3.dart/blob/main/sqlite3/doc/hook.md) · [sqlcipher_flutter_libs end of life](https://pub.dev/packages/sqlcipher_flutter_libs)
- [LibPDF encryption guide](https://libpdf.documenso.com/docs/guides/encryption) · [@pdfsmaller/pdf-encrypt](https://www.jsdelivr.com/package/npm/@pdfsmaller/pdf-encrypt)
- Package versions from the pub.dev API on 2026-10-08; Flutter's default minimum Android version read from the installed Flutter 3.47.6 SDK (`FlutterExtension.kt`: minSdk 24, target and compile 36).

---

## Accounting Model Record — revision 3 (applied 2026-10-08)

Supersedes revision 2. Sources: [gate response 02](source/GATE-RESPONSE-02-f1-f7.md) (owner's answers F1–F7) and
RULEBOOK-01..03. The exact posting rules, intent by intent, are in [ACCOUNTING-ENGINE.md](ACCOUNTING-ENGINE.md).

| Item | Decision | Status |
|---|---|---|
| Basis | Accrual: bills recorded when they arrive, before payment | Owner-approved (F4) |
| Fund balancing | Every journal balances per entity and per fund | Owner-approved (F4) |
| Period close | Monthly per entity with closing journals; closing balance = next opening | Owner-approved (F4) |
| Expense ownership | Personal / one Firm / Common (several entities, exact manual amounts). Σ allocations must equal the total or posting is refused; never split automatically; category per expense line or share | Owner-approved (F1, RULEBOOK-01 §31, §107) |
| Source ≠ owner | Payer and expense owner are separate fields; when they differ the owner records the expense and an inter-entity payable, the payer an inter-entity receivable, with an open item between them | Owner-approved (additional expense rule) |
| Non-owner payments | Asked every time: Directly from firm / Through owner × Own-personal / Expense; Own is an immediate deduction settled later, Expense is final; Through owner posts two linked journals | Owner-approved (F3) |
| Handovers | Recorded directly; receiver confirmation is an optional policy, OFF by default | Owner-approved (F2) |
| Locations | Owner, authorised access (Add keeps existing, Replace swaps one person) and current key/control holder are three separate facts, each with history; locations may be unassigned | Owner-approved (F5) |
| Account vs location | One Cash / Bank / Wallet account per entity; the place is the location dimension; a person carrying cash is the location *cash with <person>* | Rulebooks §98–§101 |
| Personal books | Every individual is a person entity with private personal books; outside customers, suppliers and agents are parties without books | RULEBOOK-03 §2–§3 |
| Money | INR whole rupees as exact integers; tax and foreign-currency differences go to explicit rounding or exchange lines | H14, RULEBOOK-01 §49–§50 |
| **F8** (flag) | When firm money pays a personal expense **of that firm's owner**, the app asks every time: *withdrawal* (owner drawings, nothing owed back) or *owner owes the firm* (open item, settled later). No default | Interpretation, owner to confirm |
| **F9** (flag) | *Through owner + Own*: the firm's claim is on the owner (owner owes firm) and the owner's claim is on the non-owner (non-owner owes owner) — two linked journals | Interpretation, owner to confirm |

### Revision 2 (superseded)



Revision 1 (session 1) is superseded. The owner's corrections ([gate response 01](source/GATE-RESPONSE-01-gates-1-2.md)):
custody must be full historical tracking, not a tag; the Angadiya split must not be decided by a new rule; every other
choice follows professional double-entry practice and is **flagged** where it changes financial behaviour. The
glossary is [SRS.md](SRS.md) §2.

Status keys: **Spec** — required by the build specification, applied. **Practice** — standard double-entry practice,
applied, flagged for confirmation. **Open** — not implemented until the owner decides.

### A1. Accounting basis — Practice, flagged (F4)

**Accrual.** Expenses, income, receivables, payables, reimbursements and advances are recognised when they happen, not
when cash moves; the outstanding, reimbursement and advance modules need this (AC19.1). For an expense paid on the spot
nothing changes for the user. **What it changes:** a vendor bill entered before it is paid creates a payable and
an expense on the bill date; the cash leaves only when the payment is entered.

### A2. Chart-of-accounts templates — Practice

Three templates, created with each entity; Super Admin can add, rename (labels over stable IDs) and disable accounts,
never delete referenced ones.

| Class (normal side) | Company (Mint, JSK…) | Person (Krish…) | Pool (Family Fund…) |
|---|---|---|---|
| Assets (Dr) | Cash – <each place> · **Cash in custody – <each person>** · **Cash in transit** · Bank – <each> · Wallet – <each> · Receivable – <party> · Due from – <entity> · Advance to – <person> · Reimbursement receivable – <entity> · Deposits | Same pattern for the person's own money | Cash – <each place> · Cash in custody – <person> · Bank – <each> · Due from – <entity> |
| Liabilities (Cr) | Payable – <party> · Due to – <entity> · Reimbursement payable – <person> · Advance received · Loans | Payable – <party> · Due to – <entity> · Reimbursement payable – <person> · Loans | Due to – <entity> |
| Equity / net assets (Cr) | Owner capital – <owner> · Drawings – <owner> (contra) · Opening balance equity · Accumulated surplus · Fund balances | Net worth · Opening balance equity · Accumulated surplus · Fund balances | Pool balance · Opening balance equity · Accumulated surplus |
| Income (Cr) | By configured category | Salary · Owner distributions received · configured categories | Contributions (if configured) |
| Expenses (Dr) | By configured category · Cash over/short · Write-offs | Personal categories · Cash over/short | By configured category |
| Control | Suspense (must be cleared) | Suspense | Suspense |

An asset account exists per (entity, money location): a Tijori holding Mint, JSK, Krish and Father money is four
accounts, one in each entity's books (AC4).

### A3. Custody — redesigned (owner correction), Spec + Practice, flagged (F2, F7)

Five separate concepts, each stored separately and each with its own history:

| Concept | Example | Where it lives |
|---|---|---|
| Owner (entity) | Mint | Which entity's books the asset is in |
| Fund | Mint Operating Fund | Fund dimension on every journal line |
| Location / account | Savan Bank, Krish's hand, Tijori | The asset ledger account (one per entity × location) |
| Holder / custodian | Krish, then Sujal, then the Tijori's custodian | **Person-custody locations** for cash carried by a person, and a **custodian history** for places; snapshot on every cash line |
| Handler | Who entered or performed the step | On the master transaction and on each custody event |

**Model.**

1. **A person carrying cash is a money location.** Each person who may hold cash gets a custody location ("Cash in
   custody – Sujal"); each entity whose money they hold gets an asset account for it. So "how much Mint money is Sujal
   holding right now" is a ledger balance, provable by the same invariants as every other balance.
2. **Places have custodian history.** A place such as the Tijori has a controller over time (who holds the key):
   `location_custodians(location, person, from, to)`. Every cash line at a place records the custodian at posting time.
3. **Every handover is a custody event** with its own record: from holder, to holder, from location, to location,
   owner, fund, amount, handler, time, evidence, and a status — initiated → awaiting receiver confirmation →
   confirmed, or disputed / cancelled — with who confirmed and when. It links to the master transaction and journals.
4. **Unconfirmed money is in transit, not lost.** When confirmation is required, initiating a handover moves the money
   to *Cash in transit*; the receiver's confirmation moves it into their custody. A dispute leaves it in transit and
   raises an exception, so nothing silently changes hands.
5. **Ownership and fund never change in a handover.** Custody movements are transfers within one entity's books.

**The owner's example, as journals** (₹50,000 of Mint Operating Fund money):

| Step | [Mint] Dr | [Mint] Cr | Custody record |
|---|---|---|---|
| 1. Krish draws cash from Mint's Savan Bank account | Cash in custody – Krish 50,000 (holder Krish) | Bank – Savan 50,000 | Location Savan Bank → Krish; handler Krish |
| 2a. Krish hands it to Sujal (initiated) | Cash in transit 50,000 (Krish → Sujal) | Cash in custody – Krish 50,000 | CE-1 initiated by Krish, awaiting Sujal |
| 2b. Sujal confirms receipt | Cash in custody – Sujal 50,000 (holder Sujal) | Cash in transit 50,000 | CE-1 confirmed by Sujal at 10:40 |
| 3. Sujal puts it in the Tijori | Cash – Tijori 50,000 (custodian at that time, e.g. Father) | Cash in custody – Sujal 50,000 | Location Sujal → Tijori; handler Sujal |

Every journal balances; Mint's total and fund are unchanged throughout; the location chain (Savan Bank → Krish →
in transit → Sujal → Tijori), the holder chain and the handler of each step are all queryable, dated and audited.

**Flags:** F2 — should every person-to-person handover require the receiver's confirmation (recommended), or only above
an amount? F7 — who is the custodian of each place today (Tijori, Wardrobe, office drawer, locker)?

### A4. Fund balancing inside an entity — Practice, flagged (F5)

Every journal balances per entity **and** per fund. Moving value between two funds of the same entity uses explicit
inter-fund transfer lines (AC10 example 7). **What it changes:** a single entry can never move money between funds
without saying so; an entity's total is unchanged by an inter-fund transfer.

### A5. Cross-entity classification — Spec, flagged (F3)

No silent default (AC3). Any value crossing entities requires the person to choose a classification — inter-entity
loan (Due from / Due to), settlement of a matched open item, capital contribution, drawing or distribution, expense of
the payer / income of the receiver, or gift / family support if configured. The form offers only the classifications
valid for that pair; it pre-selects nothing unless **the owner** has configured a default for that pair.
Reciprocity is an invariant: A's *Due from B* always equals B's *Due to A*.

**Flag F3:** a personal expense paid from a business account can be recorded as *Due from <person>* (the business
expects it back; it stays an open item) or *Drawing* (an owner's withdrawal; nothing is owed back). Both follow AC10
example 8. Should Finly ask every time (recommended until decided), or should each owner set a default?

### A6. Period close — Practice, flagged (F6)

Monthly periods per entity, closed with closing journals that roll income and expense into accumulated surplus per
fund; closing balances become the next opening automatically; reopening needs high privilege, a reason, step-up and
audit (AC12). **What it changes:** entries dated in a closed month are refused; corrections post in the open month
with a reference (AC8).

### A7. Balances under application-level encryption — Spec

Amounts are encrypted per line (AES-256-GCM, S3). The posting engine keeps encrypted, versioned balance snapshots per
entity × ledger account × fund (and per holder for custody), updated in the same database transaction as the journal
under row locks; the Integrity Verifier recomputes them from lines, checks the hash chain, and never auto-fixes (AC7).
No plaintext copy of any amount is stored. This is technical and changes no financial behaviour.

### A8. Splits — Spec for one-way splits; **Open** for the Angadiya category split (F1)

- **One-way splits** (one amount across entities, funds or people by percentage or ratio): the specification itself
  requires the largest-remainder method with a documented tie-break (AC10). Tie-break: the part listed first. The
  review sheet shows the final rupee amounts before saving.
- **The Angadiya category split is Open.** See F1 below; nothing is implemented until the owner chooses. The research
  prototype in `docs/research/` stays a prototype only.

### A9. Advances held by persons — Spec

An accountable-advance receivable in the giver's books ("Advance to <person>"), held in the person's custody location
(A3). Not an expense when given; never part of the holder's personal net worth; settled by the expense report and any
return or carry-forward (AC10 example 5).

---

### F1. The ₹45,000 Angadiya example — the exact issue and the options

**The allocation stays exactly as intended:** total expense ₹45,000 = Mint ₹30,000 + JSK ₹5,000 + Personal ₹10,000.
Both totals in the specification agree (the item lines also add to ₹45,000), so **there is no arithmetic
inconsistency**. The gap is narrower: AC10 example 4 posts each entity's share to "Expenses (by category)", but the
specification gives the categories only for the whole ₹45,000, never per entity. Mint's journal must say *which*
expense accounts its ₹30,000 goes to, and the specification does not say. Three ways to close the gap:

**Option 1 — The person assigns items to entities (item-level assignment).** Example with one possible assignment the
person might choose:

| Entity | Dr | Cr |
|---|---|---|
| Mint | Travel 10,000 · Hotel 12,000 · Firm charges 8,000 (= 30,000) | Reimbursement payable – Krish 30,000 |
| JSK | Local 3,000 · Other 2,000 (= 5,000) | Reimbursement payable – Krish 5,000 |
| Krish | Food 5,000 · Other 5,000 (personal) · Reimbursement receivable – Mint 30,000 · Reimbursement receivable – JSK 5,000 | Bank or Cash – Krish (the account actually used) 45,000 |

Exact, no rounding, categories real. Costs one extra step when the person knows who each item was for.

**Option 2 — Every category split in the same proportion (30 : 5 : 10).** Mint's Travel share would be ₹6,666.67 —
not whole rupees, so a rounding rule is unavoidable, and the per-category figures are estimates rather than facts.
This is the rule I prototyped in revision 1; per the owner's instruction it is **not** adopted.

**Option 3 — Entity shares posted to one expense account for the event.** The category detail stays on the expense
event (₹45,000 by item, visible to anyone who may see the event), and each entity's books carry its share once:

| Entity | Dr | Cr |
|---|---|---|
| Mint | Business visits – Angadiya visit 30,000 | Reimbursement payable – Krish 30,000 |
| JSK | Business visits – Angadiya visit 5,000 | Reimbursement payable – Krish 5,000 |
| Krish | Personal – Angadiya visit 10,000 · Reimbursement receivable – Mint 30,000 · Reimbursement receivable – JSK 5,000 | Bank or Cash – Krish 45,000 |

Exact, no invented numbers; Mint's expense report shows "Business visits" rather than Hotel vs Travel for this event.

In every option the open items are identical — Mint owes Krish ₹30,000, JSK owes Krish ₹5,000 — and the settlement
entries are identical (AC10 example 4). **Recommendation for the owner to confirm:** Option 1 whenever the person knows
which items were for whom; Option 3 when only the entity totals are known. Expense events are built in M7; until the
owner decides, that module is not started.

### Flags waiting for the owner

| Flag | Question | Applied meanwhile |
|---|---|---|
| F1 | Angadiya / multi-entity expense events: Option 1, 3, or both? | Nothing — expense events not built |
| F2 | Handover confirmation: always required between people, or only above an amount? | Always required (safest) |
| F3 | Personal expense paid by a business: ask every time, or an owner-set default? | Ask every time |
| F4 | Accrual basis (bills create payables before payment) | Applied |
| F5 | Every journal balances per fund | Applied |
| F6 | Monthly close with closing journals | Applied |
| F7 | Who is the custodian of each place today? | Asked in the setup wizard |
