# Continuation record

**A new session reads this file first**, then [PLAN.md](PLAN.md) (revision 3: decisions and milestones),
[REQUIREMENTS.md](REQUIREMENTS.md) (every requirement with status and proof) and [TASKS.md](../TASKS.md) (the
milestone checklist), and continues from "Next action". Items are ticked only with evidence.

## State at the end of the last change

| Area | State | Evidence |
|---|---|---|
| Sources | BUILD_PROMPT, ADDON-01…24, GATE-RESPONSE-01…06, RULEBOOK-01…03 | `docs/source/README.md` |
| Plan | Revision 3 after a full reassessment (ADDON-24); decisions D-044…D-052 | PLAN.md, DECISIONS.md |
| Database | 0001–0019 deployed (fingerprint `290d19ef…`); 0020 (reversal link) written and tested, not yet deployed; `finly_app` live; migrator login off | deployment.md §4 |
| API | Live as Edge Function `api` with paise (`/v1/health` ok); reversal routes not yet deployed | deployment.md §4 |
| Backend | M0–M3 done: scoped authorisation, paise, reversal and correction (D-052) | `verify` 223 / 7 ignored; `test:pg17` 133; `test:pg18` 133; hosted-like smoke not yet re-run (dev API did not start) |
| App | M0–M3: en/hi/gu, paise input, reverse and correct on the entry screen | `flutter analyze` clean; `flutter test` 27/27 |

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## Waiting for the owner

1. `krish` is active and has set his own password (checked 2026-10-19; delete `backend/.first-login.txt`).
   The other six: `cd backend` → `deno task user:create FINLY_SUPABASE_APP_URL <username> "<Name>" <role>` —
   `shaileshbhai`, `savan` with `family_admin`; `sujal`, `devanshu`, `heet`, `sagar` with `worker`.
2. Escrow `%USERPROFILE%\.finly\finly-kek-v1.txt` in two offline places; back up `finly-release.jks` and
   `app/android/key.properties`.
3. Push to GitHub; Supabase CA certificate + "Enforce SSL".
4. Later: R2 credentials (backups, M16), Firebase project (push), a phone for device verification, review of the
   Hindi/Gujarati text.

## Next action

Deploy 0020 and the API (reversal routes), then M4: reports and ledgers (`src/app/reports/service.ts`, routes
`/v1/books/:id/reports/*`, app Reports hub).
