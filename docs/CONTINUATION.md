# Continuation record

**A new session reads this file first**, then [PLAN.md](PLAN.md) (revision 3: decisions and milestones),
[REQUIREMENTS.md](REQUIREMENTS.md) (every requirement with status and proof) and [TASKS.md](../TASKS.md) (the
milestone checklist), and continues from "Next action". Items are ticked only with evidence.

## State at the end of the last change

| Area | State | Evidence |
|---|---|---|
| Sources | BUILD_PROMPT, ADDON-01…24, GATE-RESPONSE-01…06, RULEBOOK-01…03 | `docs/source/README.md` |
| Plan | Revision 3 after a full reassessment (ADDON-24); decisions D-044…D-051 | PLAN.md, DECISIONS.md (dd82c33) |
| Database | 0001–0018 deployed; `finly_app` live; migrator login off | deployment.md §4, fingerprint `ec6af2ea…` |
| API | Live as Edge Function `api` (`/v1/health` ok, 401 without token) | deployment.md §4 (2026-10-10) |
| Backend | M1 done: scoped authorisation, throttles, handover policy | `verify` 201 / 7 ignored; `test:pg17` 121; `test:pg18` 121 |
| App | M0 fixes, en/hi/gu; release APK 2026-10-10 (arm64 sent to the owner) | `flutter analyze` clean; `flutter test` 21/21 |

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## Waiting for the owner

1. `krish` exists (2026-10-10; temporary password in the git-ignored `backend/.first-login.txt`, valid to 17 Oct).
   The other six: `cd backend` → `deno task user:create FINLY_SUPABASE_APP_URL <username> "<Name>" <role>` —
   `shaileshbhai`, `savan` with `family_admin`; `sujal`, `devanshu`, `heet`, `sagar` with `worker`.
2. Escrow `%USERPROFILE%\.finly\finly-kek-v1.txt` in two offline places; back up `finly-release.jks` and
   `app/android/key.properties`.
3. Push to GitHub; Supabase CA certificate + "Enforce SSL".
4. Later: R2 credentials (backups, M16), Firebase project (push), a phone for device verification, review of the
   Hindi/Gujarati text.

## Next action

M2: money in paise (migration 0019 guard, domain money, wire format, app input and display).
