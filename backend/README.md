# Finly backend

Client-independent API and accounting engine (Deno + TypeScript). It runs as a Supabase Edge Function in production
and on any Deno host elsewhere, so the backend is not tied to one vendor (Stack Decision Record S12).

## Layout

| Path                    | What lives there                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `src/domain/money.ts`   | Whole-rupee amounts (`bigint`), parsing and Indian formatting                                       |
| `src/domain/ledger/`    | Account classes and roles, chart-of-accounts templates, journal invariants, in-memory reference ledger |
| `src/domain/engine/`    | Intents (what the user asked for) and the pure posting planner that turns them into balanced journals |
| `tests/engine/`         | Scenario tests named after `docs/ACCOUNTING-ENGINE.md` §5 and RULEBOOK-03 §72                        |
| `tests/support/`        | The spec's example world (seed and test data only)                                                  |

The planner never touches a database. It reads facts through `EngineContext` and returns a `PostingPlan`. The
persistence layer applies the plan inside one database transaction.

## Commands

```bash
deno task verify
```

`verify` runs format check, lint, type check and the tests. Run a single file with
`deno test --allow-read --allow-env tests/engine/expense_test.ts`.
