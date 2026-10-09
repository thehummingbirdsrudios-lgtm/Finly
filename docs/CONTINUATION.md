# Continuation record

**A new session reads this file first**, then [PLAN.md](PLAN.md) (what and why), [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)
(how, in order) and [TASKS.md](../TASKS.md) (the checklist), and continues from "Next action". It does not repeat the
audit or re-read the sources unless they change. Items are ticked only with evidence.

Scope is frozen at ADDON-22 (D-041). The goal is the complete, deployable mobile app on the existing backend.

## State at the end of the last change

| Area | State | Evidence |
|---|---|---|
| Database | Migrations 0001–0017 deployed to Supabase; `finly_app` login live; migrator login off | [deployment.md](operations/deployment.md) §4: fingerprint `4b71e286…` on three channels; `app_login_check.ts` |
| Backend | Engine, posting, identity, books, activity, HTTP API v1; Edge Function bundle | `deno task verify` 185 passed / 7 ignored; `test:pg17` 106/106; `test:pg18` 106/106; local smoke of the bundle as `finly_app` |
| API hosting | `deno task edge:deploy` (pinned Supabase CLI 2.118.0) runs up to the sign-in check | Waiting for the owner's `supabase login` and function secrets |
| App | Core screens wired to the API; branding; signed release APK (52.4 MB, CN=Finly) | `flutter analyze` clean; `flutter test` 13/13; `apksigner verify` |
| Plans | PLAN.md, IMPLEMENTATION-PLAN.md, TASKS.md | Commit "docs: consolidated plan…" |

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## Waiting for the owner

1. `npx --yes supabase@2.118.0 login` once in a terminal; then `deno task edge:deploy` (deploy-api.md §3).
2. Production KEK: generate, keep two offline copies, then set the function secrets `FINLY_DATABASE_URL`,
   `FINLY_KEK_ACTIVE`, `FINLY_KEK_V1` (deploy-api.md §2, key-recovery.md §1).
3. Back up `%USERPROFILE%\.finly\finly-release.jks` and `app/android/key.properties` (release-signing.md).
4. Go-ahead to create the initial accounts (deploy-api.md §4) once the function answers `{"status":"ok"}`.
5. Install the release APK on the phones; push to GitHub (starts CI).
6. Supabase CA certificate download and "Enforce SSL".

## Next action

WP2.5 Reversal and correction (IMPLEMENTATION-PLAN.md, execution order step 4). The deployment steps above resume as
soon as the owner has done their part.
