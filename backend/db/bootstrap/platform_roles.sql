-- Platform bootstrap — run ONCE per database by its owner (on Supabase: the `postgres` role, from the SQL editor or the
-- Supabase MCP) before the first migration. Idempotent. Not a migration: it needs owner rights the migrations do not.
-- Runbook: docs/operations/deployment.md §2.
--
-- 1. The five group roles (migration 0001 also creates them when the migrator may).
-- 2. `finly_migrator`: the only login that applies migrations. No password here — it is set from a SCRAM verifier
--    made by `deno task db:login finly_migrator …`, so no password ever appears in SQL, Git, logs or chat.
-- 3. The rights the migrations need and nothing else: create the `finly` schema, hand it to `finly_owner`, manage the
--    five roles' settings.

do $$
declare
  r text;
begin
  foreach r in array array['finly_owner', 'finly_auth', 'finly_api', 'finly_ledger', 'finly_system'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
  if not exists (select 1 from pg_roles where rolname = 'finly_migrator') then
    create role finly_migrator nologin createrole;
  end if;
  execute format('grant create on database %I to finly_owner, finly_migrator', current_database());
end
$$;

grant finly_owner, finly_auth, finly_api, finly_ledger, finly_system to finly_migrator with admin option;
alter role finly_migrator set statement_timeout = '10min';
alter role finly_migrator set lock_timeout = '30s';
comment on role finly_migrator is 'Finly: applies migrations (db/tools/migrate.ts). Login enabled only while deploying.';
