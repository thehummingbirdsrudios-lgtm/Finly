# Continuation record

**A new session reads this file first**, then [PLAN.md](PLAN.md) (what and why), [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)
(how, in order) and [TASKS.md](../TASKS.md) (the checklist), and continues from "Next action". It does not repeat the
audit or re-read the sources unless they change. Items are ticked only with evidence.

Scope is frozen at ADDON-22 (D-041). The goal is the complete, deployable mobile app on the existing backend.

## State at the end of the last change

| Area | State | Evidence |
|---|---|---|
| Database | Migrations 0001–0017 local; 0001–0014 deployed to Supabase | Deployment log; 0015–0017 tested locally |
| Backend | Engine, posting, identity, books, activity, HTTP API v1 | `deno task verify` 182 passed / 7 ignored; `test:pg17` 103/103; `test:pg18` 103/103 |
| App | Core screens wired to the API | `flutter analyze` clean; `flutter test` 11/11 |
| Plans | PLAN.md, IMPLEMENTATION-PLAN.md, TASKS.md rewritten after reading every source | Commit "docs: consolidated plan…" |

## Git

Branch `feat/database`; nothing pushed (the owner pushes: `git push -u origin feat/database`).

## Waiting for the owner

- Push to GitHub (starts CI).
- Production KEK: generate, keep two offline copies, set as function secrets (key-recovery.md).
- Go-ahead to deploy migrations 0015–0017 and the API (Supabase Edge Function).
- Supabase CA certificate download and "Enforce SSL".
- A phone with USB debugging for on-device testing.

## Next action

WP1.1 Branding and startup (IMPLEMENTATION-PLAN.md), then WP1.2.
