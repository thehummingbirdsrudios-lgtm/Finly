# Encryption architecture — investigation and decision

Owner's request: [gate response 03](../source/GATE-RESPONSE-03-decisions-q1-q3-postgres.md), Q2. Specification: BUILD_PROMPT
A5, AC7, I1, Part M. Decision recorded as D-033.

## Decision

**Keep application-level encryption of amounts.** Investigation found it secure, correct and fast enough by a wide
margin, so the authorised fallback (removing amount-level encryption) is **not** used. Amounts, balances and other
sensitive values are encrypted in the Finly API with AES-256-GCM before they reach PostgreSQL; the database never
sees a key or a plaintext amount.

**Not yet production-ready**, by the owner's own rule: production keys must be generated and escrowed by the owner,
and the backup-and-restore drill must pass against production with the escrowed key (see "What remains" below).

## What the options protect against

| Threat | Storage / volume encryption (Supabase at rest) | pgcrypto column encryption | **Application-level (chosen)** |
|---|---|---|---|
| Stolen disk or provider backup media | protected | protected | protected |
| Leaked database dump, read-only credential, SQL injection that reads rows | **exposed** (data is decrypted for any reader) | protected only if the key is not in the same query path | **protected** — rows hold ciphertext |
| Someone with database admin or dashboard SQL access | **exposed** | **exposed** — PostgreSQL's docs say the key and decrypted data are briefly present on the server, where a system administrator could intercept them | **protected** — keys are outside the database |
| Someone with both the API's secrets and the database (the hosting account) | exposed | exposed | exposed — mitigated by MFA on the accounts, few people, key rotation, escrow kept offline |

PostgreSQL's own guidance ([Encryption Options](https://www.postgresql.org/docs/17/encryption-options.html)): when the
server's system administrator cannot be trusted, the client must encrypt so that unencrypted data never appears on the
database server. The Finly API is that client. Storage encryption is kept as well (Supabase encrypts storage at rest),
but it is **not** equivalent and is not counted as meeting the requirement.

### Why not pgcrypto

The [pgcrypto documentation](https://www.postgresql.org/docs/17/pgcrypto.html) says all its functions run inside the
server, data and keys move between pgcrypto and clients in clear, the implementation does not resist side-channel
attacks, and its raw `encrypt()` functions provide no integrity checking (CBC/ECB). Its own recommendation for an
untrusted administrator is to do crypto inside the client application. Keys sent in SQL can also appear in logs and
statistics. Rejected.

### Why not plaintext amounts with only RLS and storage encryption (the fallback)

It would let PostgreSQL `SUM` and `CHECK` amounts directly, but it leaves every amount readable to anyone who obtains
a dump or database credentials, and it would not meet A5/AC7. The investigation did not find the impracticality the
fallback requires, so it is not taken.

## How financial correctness is kept with encrypted amounts

| Need | How |
|---|---|
| Arithmetic | In the API: decrypt in memory → exact `bigint` arithmetic → encrypt. No floating point anywhere |
| Balances fast without summing ciphertext | Encrypted snapshots per slice, updated in the posting transaction under row locks (06 §6.2) |
| Atomic posting | One database transaction; any decryption failure throws `INTEGRITY` and the whole posting rolls back — nothing partial is ever written |
| No silent corruption | AES-GCM authenticates every value; the associated data binds table, column and row, and the key-version header — a swapped, edited or relabelled ciphertext fails, it is never "read as something" |
| Lost or retired key version | Loud `INTEGRITY` failure naming the version; never a default or skipped value |
| Invariants the database cannot check (Σ Dr = Σ Cr, snapshots = lines) | Posting engine before commit; Integrity Verifier afterwards (scheduled and before every month close); journal hash chain |
| Search over amounts | Keyed blind indexes per environment (exact amount) and per band (ranges) on legs; exact filtering after decrypting one page |

## Measured cost (Deno 2.9.7 on the owner's Windows machine, `deno task bench:crypto`, 2026-10-09)

| Workload | Time |
|---|---|
| One amount: encrypt / decrypt | 22 µs / 20 µs |
| One posting: 3 journals, 8 lines, 8 snapshot updates, 2 open items, 4 leg indexes, chain link | **0.31 ms** |
| Dashboard: decrypt 500 balance slices | **3.3 ms** |
| Statement page: 50 lines | 0.31 ms |
| Yearly report: 300 slices × 12 months | 27 ms |

Supabase Edge Functions allow 2 s of CPU per request; the heaviest case uses about 1.4 % of it. Encryption is not a
performance constraint for Finly's workload (≤ 100 postings a day, about 10 users).

## Construction

- **Algorithm:** AES-256-GCM (WebCrypto), 96-bit random nonce, 128-bit tag. Amounts are a fixed-width signed 64-bit
  integer, so every amount ciphertext is 39 bytes and length reveals nothing.
- **Format v1:** `format(1) ‖ key version(2) ‖ nonce(12) ‖ ciphertext ‖ tag`. Associated data =
  `format ‖ key version ‖ "finly:v1:" ‖ table.column:row-id`.
- **Keys:** derived with HKDF-SHA-256 from a versioned 256-bit key-encryption key (KEK): `info = "finly/<purpose>/<version>"`,
  purposes `data`, `blind_index`, `hash_chain`, `file`, `mpin_pepper`. Derived keys are non-extractable. **No key
  material is stored in the database** (D-026); `key_version` rows are metadata only.
- **Blind indexes:** HMAC-SHA-256 truncated to 16 bytes, keyed per environment for amounts.
- **Hash chains:** HMAC-SHA-256 over the previous hash and canonical content including plaintext amounts, so key
  rotation (re-encryption) never breaks the chain.
- Code: `backend/src/crypto/` (keys, cipher, blind index, chain); tests: `backend/tests/crypto/`, the recovery drill
  `backend/tests/db/recovery_test.ts`.

## Key management

| Option | Assessment |
|---|---|
| **KEK in the platform's function secret store, versioned, with an offline escrow (chosen now)** | Free; keys never in the database, APK, source, Git or ordinary config; rotation by adding a version; works on Supabase and any host. Limitation: key *use* is not audited per call — the API audits key-ring start-up, rotation and re-encryption; the platform audits secret changes |
| AWS KMS / Google Cloud KMS / Azure Key Vault (envelope encryption) | Reputable, non-exportable keys, per-call audit logs, managed rotation. Requires a paid cloud account (small monthly cost) and becomes a new external dependency at start-up. **Supported by design:** `KekSource` is an interface — a KMS-backed source unwraps the KEK once per cold start, with no data migration. Recommended when the owner opens such an account |
| Supabase Vault / pgsodium | Keys in the same database as the data; Supabase itself advises against it and documents pgsodium as pending deprecation. Rejected |

## Rotation, recovery and backups

- **Rotation:** add `FINLY_KEK_V<n+1>`, set `FINLY_KEK_ACTIVE=<n+1>`; new writes use the new version at once; a
  `finly_system` job re-encrypts old rows (the only permitted change to immutable history, D-026, tested); the old
  version stays configured (decrypt-only) until no row **and no retained backup** needs it.
- **Backups:** nightly `pg_dump`, encrypted with `age` to the owner's public key, stored in Cloudflare R2. A dump holds
  only ciphertext for amounts; the KEK is never in the dump.
- **Recovery** is the runbook in [docs/operations/key-recovery.md](../operations/key-recovery.md). **Proven locally on
  PostgreSQL 17.11 on 2026-10-09:** 200 encrypted amounts and the migrated books were dumped, the database destroyed,
  restored into a new database, and read back exactly with the KEK taken only from an escrow file; a wrong key failed
  loudly (`deno task test:pg17`, `recovery_test.ts`).

## What remains before production

1. The owner generates the production KEK and stores **two offline escrow copies**, separate from the backup's `age`
   private key (runbook step 1).
2. The production restore drill: restore the latest production backup into a scratch database and run the Integrity
   Verifier with the escrowed key. Until it passes, the encryption architecture is **not** declared production-ready.
3. Optional upgrade: a cloud KMS key source, when the owner decides to open such an account.
