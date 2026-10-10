# Runbook — deploy the Finly API and connect the app

The API runs as the Supabase Edge Function `api` on the project `finly` (`joidjmwfajbeivyffymb`). It is one bundled
file built from `backend/src/main/edge.ts`; it holds no secrets. Its database login is `finly_app`, which has no rights
of its own and switches per transaction to `finly_api`, `finly_auth` or `finly_ledger`. Encryption keys exist only in
the function's secrets and the owner's escrow — never in Git, the database, the APK, logs or chat.

Who does what: **[C]** = done from this repository with the connected tools; **[O]** = only the owner.

## 1. Database (once, then per migration)

1. **[C]** Apply new migrations with the checksummed runner and verify the catalog fingerprint
   ([deployment.md](deployment.md) §3–§4).
2. **[C]** Run `backend/db/bootstrap/api_login.sql` as `postgres` (idempotent).
3. **[C]** Create the login without the password ever being shown:
   ```bash
   deno task db:login finly_app FINLY_SUPABASE_APP_URL aws-0-ap-south-1.pooler.supabase.com 6543 finly_app.joidjmwfajbeivyffymb postgres
   ```
   This writes `FINLY_SUPABASE_APP_URL` (transaction pooler, port 6543) into the git-ignored `backend/.env.local` and
   prints only an `alter role … password 'SCRAM-SHA-256$…'` statement, which is run as `postgres`.

## 2. Function secrets — [O] sign in once, then one command

| Name | Value |
|---|---|
| `FINLY_DATABASE_URL` | `FINLY_SUPABASE_APP_URL` from `backend/.env.local` |
| `FINLY_KEK_ACTIVE` | `1` |
| `FINLY_KEK_V1` | the production key-encryption key ([key-recovery.md](key-recovery.md) §1) |

After the one-time `npx --yes supabase@2.118.0 login` (§3):

```bash
cd backend && deno task edge:secrets
```

The tool creates the key once in `%USERPROFILE%\.finly\finly-kek-v1.txt` (outside the repository), passes the three
values to the CLI through a temporary git-ignored file that it deletes at once, and prints only names. It reuses the
key file on later runs and refuses to create a second key when the function already has one. **The owner escrows the
key file in two offline places before the first real entry** (key-recovery.md §1.3). Setting the same values by hand
in the dashboard (Edge Functions → Secrets) is equivalent.

Until these exist, the function answers every request with 503 "not configured" and `/v1/health` lists what is missing
(names only).

Steps 1–3 were done on 2026-10-09 ([deployment.md](deployment.md) §4). Sections 2 and 3 were done on 2026-10-10:
secrets set by `deno task edge:secrets`, function deployed, `/v1/health` → `{"status":"ok"}`.

## 3. Function code — [O] sign in once, then [C]

The bundle (230 KB) is uploaded with the official Supabase CLI, pinned in `backend/deno.json`. It needs the owner's
Supabase sign-in once per computer — in a terminal, not in chat:

```bash
npx --yes supabase@2.118.0 login
```

Then, every deploy:

```bash
cd backend && deno task edge:deploy
```

This bundles `src/main/edge.ts` into `build/edge/index.js` (one minified file, no secrets), stages it with
`deploy/supabase/config.toml` under `build/edge-deploy/`, and deploys it as function `api` with **JWT verification
off**: Finly authenticates every request itself, and the app carries no Supabase key. Then check:

- `GET https://joidjmwfajbeivyffymb.supabase.co/functions/v1/api/v1/health` → `{"status":"ok"}` (or `not_configured`
  with the missing secret names before step 2);
- `GET …/v1/books` without a token → 401.

Before every deploy, the same bundle is proven locally: `deno task dev:setup`, `deno task dev:api`, then
`deno task smoke http://127.0.0.1:8000 FINLY_DEV_ADMIN_URL` (a full sign-in → firm → place → entries → balances run).
`dev:api` runs the bundle the way the hosted runtime does — without Node's `Buffer`, `process`, `setImmediate`,
`clearImmediate` and `global` (`db/tools/edge_hosted_like.ts`) — because local Deno defines them and the hosted
runtime does not; the database driver's need for them is met by `src/db/node_globals.ts`.

## 4. First accounts — [C] with the owner's go-ahead

Account creation runs entirely as `finly_auth`, so it uses the API's own login; the migrator stays off. For each
initial person:

```bash
deno task user:create FINLY_SUPABASE_APP_URL <username> "<Display name>" <role>
```

Roles: `super_admin` for the owner; `family_admin` for administrators; `worker` for workers. The tool needs no
encryption key. Each temporary password is appended to the git-ignored `backend/.first-login.txt` on this computer;
the owner hands each one over in person, and every person sets their own password at first sign-in. Delete the file
afterwards.

## 5. The app — [C] build, [O] install

```bash
cd app && flutter build apk --release --dart-define=FINLY_API_URL=https://joidjmwfajbeivyffymb.supabase.co/functions/v1/api
```

The release build refuses to start without an `https://` API address. Signing: see
[release-signing.md](release-signing.md). Install the APK on each phone (USB, or copy the file and open it).

## Rollback

- **Function:** redeploy the previous bundle (`git checkout <tag> -- backend && deno task edge:deploy`).
- **Database:** forward fixes only ([deployment.md](deployment.md)).
- **Access:** remove the function secret `FINLY_DATABASE_URL` to stop all API access at once, or run
  `alter role finly_app nologin` to cut the login.
