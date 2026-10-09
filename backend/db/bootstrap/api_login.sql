-- The API's own database login — run once per database by its owner (Supabase: the `postgres` role via the SQL editor
-- or MCP), after platform_roles.sql. Idempotent. Runbook: docs/operations/deploy-api.md.
--
-- `finly_app` has no privileges of its own (NOINHERIT): every service transaction starts with `set local role` to the
-- one role it needs (finly_api for reads and administration, finly_auth for credentials, finly_ledger for posting), so
-- a bug that forgets the role fails closed instead of running with the union of all rights. No password here: it is
-- set from a SCRAM verifier made by `deno task db:login finly_app …`, so it never appears in SQL, Git, logs or chat.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'finly_app') then
    create role finly_app nologin noinherit;
  end if;
end
$$;

alter role finly_app noinherit nosuperuser nocreatedb nocreaterole noreplication;
grant finly_api, finly_auth, finly_ledger to finly_app;
alter role finly_app set statement_timeout = '15s';
alter role finly_app set lock_timeout = '5s';
alter role finly_app set idle_in_transaction_session_timeout = '30s';
comment on role finly_app is
  'Finly API login: no rights of its own; switches to finly_api / finly_auth / finly_ledger per transaction.';
