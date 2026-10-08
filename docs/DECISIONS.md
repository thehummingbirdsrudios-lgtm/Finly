# Decisions

Every architectural and product decision, with its reason. **Status** is `Decided` (by the product owner or a source
document), `Proposed` (waiting for a gate) or `Superseded`. Gates: 1 stack, 2 accounting model, 3 schema, 4 design/UX/edge cases.

## Decision log

| ID | Decision | Status | Reason / source |
|---|---|---|---|
| D-001 | The client is **Flutter + Dart**, Android first; iOS and web later on the same backend | Decided (2026-10-08) | Add-on 04 |
| D-002 | The product is named **Finly** (the repository folder stays `Finely`) | Decided (2026-10-08) | Add-on 07 |
| D-003 | Keep every approval gate of BUILD_PROMPT C6 | Decided (2026-10-08) | Product owner, first session |
| D-004 | Development and tests on a local Supabase stack in Docker; one hosted free project for production | Decided (2026-10-08), backend still under Gate 1 | Product owner, first session |
| D-005 | Build and test on the owner's own Android phone (USB / Wi-Fi debugging) | Decided (2026-10-08) | Product owner, first session |
| D-006 | A private GitHub repository; push only after the owner confirms | Decided (2026-10-08) | Product owner, first session |
| D-007 | One commit per verified change on short-lived branches; M0 on `chore/m0-foundation` | Decided (2026-10-08) | Add-on 05, BUILD_PROMPT E |
| D-008 | The design system is the single theme source: `palette.json` → `tokens.json` → generated Flutter theme; brand in `brand.json` | Decided (2026-10-08); content final at Gate 4 | BUILD_PROMPT K2, add-ons 07, 09 |
| D-009 | Icons are Flutter's built-in Material icons (Rounded); fonts Mukta + Mukta Vaani bundled (OFL 1.1), no runtime font download | Proposed (Gate 4) | Add-on 04 (built-ins first); offline and privacy |
| D-010 | Add-ons 06/07 reconciled with the spec: "Remove" a user archives anyone with history (H15); Super Admin gains no personal-finance visibility (A4); Krish's first temporary password comes from a one-time local bootstrap, only its hash is stored | Proposed (Gate 1) | Stricter reading wins (A6.2) |
| D-011 | Seed users are bootstrap input, not code or migrations | Proposed (Gate 1) | Add-ons 06/07, F3 |
| D-012 | No staging project on the free tier (the owner's second free project slot is used by another project); CI runs every test against a fresh local stack as the staging equivalent | Proposed (Gate 1) | Supabase free plan: 2 active projects |

---

## Stack Decision Record (Gate 1) — Proposed

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
| Offline database | `drift` 2.35 + `sqlite3` 3.x built as **SQLite3MultipleCiphers** (`hooks: user_defines: sqlite3: source: sqlite3mc`) | Typed queries and migrations; whole-file encryption with an MIT-licensed cipher build. The older `sqlcipher_flutter_libs` reached end of life in February 2026 |
| Background sync | `workmanager` 0.10 | Android WorkManager for retries that survive process death |
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

### Sources

- [Supabase pricing](https://supabase.com/pricing) · [Edge Function limits](https://supabase.com/docs/guides/functions/limits) · [pgsodium — pending deprecation, keep keys outside the database](https://supabase.com/docs/guides/database/extensions/pgsodium) · [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Neon pricing](https://neon.com/pricing) · [Oracle free tier cut, InfoQ, July 2026](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [sqlite3 hook options (SQLite3MultipleCiphers, SQLCipher)](https://github.com/simolus3/sqlite3.dart/blob/main/sqlite3/doc/hook.md) · [sqlcipher_flutter_libs end of life](https://pub.dev/packages/sqlcipher_flutter_libs)
- [LibPDF encryption guide](https://libpdf.documenso.com/docs/guides/encryption) · [@pdfsmaller/pdf-encrypt](https://www.jsdelivr.com/package/npm/@pdfsmaller/pdf-encrypt)
- Package versions from the pub.dev API on 2026-10-08; Flutter's default minimum Android version read from the installed Flutter 3.47.6 SDK (`FlutterExtension.kt`: minSdk 24, target and compile 36).
