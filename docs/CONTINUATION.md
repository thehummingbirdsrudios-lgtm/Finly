# Continuation record

**A new session reads this file first**, then [PLAN.md](PLAN.md) (revision 3: decisions and milestones),
[REQUIREMENTS.md](REQUIREMENTS.md) (every requirement with status and proof) and [TASKS.md](../TASKS.md) (the
milestone checklist), and continues from "Next action". Items are ticked only with evidence.

## State at the end of the last change

| Area | State | Evidence |
|---|---|---|
| Sources | BUILD_PROMPT, ADDON-01…24, GATE-RESPONSE-01…06, RULEBOOK-01…03 | `docs/source/README.md` |
| Plan | Revision 3 after a full reassessment (ADDON-24); decisions D-044…D-051 | PLAN.md, DECISIONS.md (dd82c33) |
| Database | 0001–0017 deployed; `finly_app` live; migrator login off | deployment.md §4, fingerprint `4b71e286…` |
| API | Live as Edge Function `api` (`/v1/health` ok, 401 without token) | deployment.md §4 (2026-10-10) |
| Backend | `deno task verify` 186 passed / 7 ignored | commit 0c89369 |
| App | Core screens; `flutter analyze` clean, 13 tests (last run before revision 3) | — |

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## Waiting for the owner

1. Create the seven accounts (the permission system blocks Claude):
   `cd backend` → `deno task user:create FINLY_SUPABASE_APP_URL krish "Krish" super_admin`, then `shaileshbhai`,
   `savan` with `family_admin`, and `sujal`, `devanshu`, `heet`, `sagar` with `worker`. Temporary passwords land in the
   git-ignored `backend/.first-login.txt`.
2. Escrow `%USERPROFILE%\.finly\finly-kek-v1.txt` in two offline places; back up `finly-release.jks` and
   `app/android/key.properties`.
3. Push to GitHub; Supabase CA certificate + "Enforce SSL".
4. Later: R2 credentials (backups, M16), Firebase project (push), a phone for device verification, review of the
   Hindi/Gujarati text.

## Next action

M0: the app fixes (H1, M1–M7) and the l10n infrastructure, then M1.
