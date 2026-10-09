# Runbook — database deployment (Supabase project `finly`)

Decision D-034 (dedicated project) and D-036 (how migrations reach production). Project: `finly`, id
`joidjmwfajbeivyffymb`, region ap-south-1 (Mumbai), PostgreSQL 17.11. The organisation's other project, `vepari`, is a
different application — nothing here ever touches it.

No password, connection string or key is ever written into Git, a document, a log, a chat or a screenshot. The only
place a database credential exists is the git-ignored `backend/.env.local` on the deploying computer (and, later, the
CI and Edge Function secret stores).

## 1. Paths and roles

| Who | Connects how | Can do |
|---|---|---|
| `postgres` (Supabase platform owner) | Supabase dashboard SQL editor or the Supabase MCP (HTTPS, verified) | Bootstrap (§2), enable/disable the migrator login, read the system catalogs. Has **no** rights on Finly's tables |
| `finly_migrator` | Session pooler `aws-0-ap-south-1.pooler.supabase.com:5432`, user `finly_migrator.joidjmwfajbeivyffymb`, TLS, SCRAM | Applies migrations (member of the five Finly roles). **Login disabled between deployments** |
| `finly_owner`, `finly_auth`, `finly_api`, `finly_ledger`, `finly_system` | NOLOGIN group roles | Owner and runtime roles (docs/database/05). Runtime login users are created when the API is deployed |

This computer has no IPv6, so the direct host `db.<ref>.supabase.co` (IPv6 only on the free plan) is unreachable; the
session pooler is used. Pooler cluster: `aws-0` (the project is unknown on `aws-1`).

## 2. One-time bootstrap (done 2026-10-09)

Run `backend/db/bootstrap/platform_roles.sql` as `postgres`. Idempotent: creates the five group roles and
`finly_migrator` (NOLOGIN, CREATEROLE), grants `CREATE` on the database to `finly_owner` and the migrator, and gives
the migrator the five roles with ADMIN OPTION.

## 3. Deploy migrations

```bash
cd backend
deno task verify                 # format, lint, types, all PGlite tests
deno task test:pg17              # real PostgreSQL 17.11, incl. concurrency and recovery drill
```

1. **Login on.** If `FINLY_SUPABASE_MIGRATOR_URL` is not in `backend/.env.local`, create it — this prints only a SCRAM
   verifier, never the password:
   ```bash
   deno task db:login finly_migrator FINLY_SUPABASE_MIGRATOR_URL aws-0-ap-south-1.pooler.supabase.com 5432 finly_migrator.joidjmwfajbeivyffymb
   ```
   As `postgres` run the printed `alter role finly_migrator with login password 'SCRAM-SHA-256$…'`. If the URL already
   exists, run `alter role finly_migrator login;`.
2. **Check, then apply:**
   ```bash
   deno task db:migrate FINLY_SUPABASE_MIGRATOR_URL --check
   deno task db:migrate FINLY_SUPABASE_MIGRATOR_URL
   ```
   Each migration runs in its own transaction; a changed applied file or an unknown applied version stops the run
   before anything is written.
3. **Verify through two channels.** Compare the catalog fingerprint of a fresh local build with production:
   ```bash
   deno task db:fingerprint --fresh FINLY_PG17_ADMIN_URL
   deno task db:fingerprint FINLY_SUPABASE_MIGRATOR_URL
   ```
   Then run the query in `backend/db/tools/fingerprint.sql` as `postgres` over the Supabase MCP or dashboard (HTTPS
   with a verified certificate). All three fingerprints and the migration checksums must be identical.
4. **Advisors.** Supabase security and performance advisors: no new WARN. The `schema_migration` "RLS enabled, no
   policy" INFO is intentional.
5. **Login off:** `alter role finly_migrator nologin;` as `postgres`.

## 4. Deployment log

| Date | Migrations | Fingerprint (fresh PG17 = production, three channels) | Advisors |
|---|---|---|---|
| 2026-10-09 | 0001–0010 (3.1 s) | `875116566578705a8ea4942c88a53cfa` | security: 18 functions with mutable search_path, 1 duplicate permissive policy → fixed by 0011 |
| 2026-10-09 | 0011 (0.3 s) | `16afa4016ae83becdc2b6d92515e0af8` | security: only the intentional INFO; performance: unindexed foreign keys (INFO, deliberate — docs/database/04 §4.2 rule 7) and unused indexes (empty database) |

## 5. Open items

- **Full TLS verification.** The pooler's certificate chains to Supabase's own root CA, which the public trust store
  does not hold, so the migrator currently uses `sslmode=require` (encrypted, SCRAM authentication — the password never
  crosses the wire — but the server certificate is not verified). The second-channel fingerprint check (§3.3) detects
  any tampering. To close it: the owner downloads `prod-ca-2021.crt` from Dashboard → Project Settings → Database →
  SSL Configuration and saves it as `backend/certs/supabase-prod-ca-2021.crt` (a public certificate, safe to commit);
  the tools then switch to `verify-full`.
- **SSL enforcement** (Dashboard → Database → SSL Configuration → "Enforce SSL") — a brief database restart; the owner
  enables it.
- **CI deployment** with the migrator URL as a GitHub Actions secret, after the repository is pushed.
