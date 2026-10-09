# Runbook — encryption keys: create, escrow, rotate, recover

Design: [docs/security/encryption-architecture.md](../security/encryption-architecture.md). Whoever runs these steps
works on a trusted computer, never pastes a key into chat, email, an issue, a commit or a screenshot, and closes
terminals afterwards.

## 1. Create the production key-encryption key (owner, once)

1. Generate 32 random bytes as base64 on a trusted computer:
   ```bash
   deno eval "console.log(btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))))"
   ```
2. Store it as two function secrets of the production API: `FINLY_KEK_V1` = the value, `FINLY_KEK_ACTIVE` = `1`
   (Supabase dashboard → Edge Functions → Secrets, or `supabase secrets set`).
3. **Escrow:** write the value, its version (`v1`) and the date into two offline places kept apart from each other and
   from the backup `age` private key — e.g. a password manager entry the owner controls and a printed copy in a sealed
   envelope in a safe. Anyone holding a dump *and* this value can read every amount.
4. Delete the value from the clipboard and terminal history.

## 2. Rotate (yearly, or at once if a key may have leaked)

1. Generate a new value as in step 1.1; add `FINLY_KEK_V2`; then set `FINLY_KEK_ACTIVE=2`. Do not remove `FINLY_KEK_V1`.
2. Escrow v2 exactly like v1 (both copies), labelled with its version and date.
3. Run the re-encryption job (`finly_system`); it decrypts with the old version and writes the new one. A failure on any
   row stops the job for that row and raises a critical finding — nothing is skipped silently.
4. Keep v1 configured and escrowed until no row and **no retained backup** (7 yearly copies) still needs it. Only then
   retire it.
5. If a key leaked: rotate at once, re-encrypt everything, and treat older backups as readable by the attacker.

## 3. Recover after losing the database

1. Create the roles on the new PostgreSQL 17 server (migration `0001` creates them if missing; or restore
   `pg_dumpall --globals-only` output).
2. Create an empty database and restore the latest good backup:
   `age -d -i <owner's private key> finly-<date>.dump.age > finly.dump`, then
   `pg_restore -d <database> --exit-on-error finly.dump`.
3. Configure the API with the escrowed KEK versions that the backup's rows use (`FINLY_KEK_V<n>`, `FINLY_KEK_ACTIVE`).
4. Run the Integrity Verifier: every balance recomputed from lines, hash chains, reciprocity. Any finding stops
   go-live until explained.
5. Smoke-test sign-in, a balance screen and a test posting in a test entity.

## 4. Drill

Repeat section 3 against a scratch database **before production launch, yearly, and after every rotation**. The
automated local drill (`backend/tests/db/recovery_test.ts`, run by `deno task test:pg17`) proves the procedure on every
change; it does not replace the production drill.

## If the KEK is lost

Every encrypted amount, note and bank number written with that version is unreadable for good, including in
backups. Names, structure, references and dates remain. There is no recovery path — which is why section 1.3 keeps
two escrow copies and section 4 tests them.
