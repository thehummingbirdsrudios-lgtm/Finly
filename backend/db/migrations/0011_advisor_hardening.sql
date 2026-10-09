-- 0011 hardening from Supabase's database advisors on the first deployment (2026-10-09):
--   * 18 functions had a role-mutable search_path (lint 0011): every function in schema finly now pins
--     search_path = finly, pg_temp, so no object placed earlier on a caller's path can shadow what a function uses;
--   * entity_membership had two permissive policies for finly_api SELECT (lint 0006): the FOR ALL write policy is
--     split by command, so reads are checked by the read policy alone (managing an environment implies reading it,
--     so no visibility changes);
--   * schema_migration keeps RLS on with no policy on purpose: only its owner reads it.
-- Guarded by tests/db/catalog_test.ts. Data impact: none. Recovery: forward fix.

set local role finly_owner;

do $$
declare
  f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = 'finly'::regnamespace
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = finly, pg_temp', f);
  end loop;
end
$$;

drop policy entity_membership_api_write on finly.entity_membership;
create policy entity_membership_api_insert on finly.entity_membership for insert to finly_api
  with check (finly.actor_can_manage(org_entity_id));
create policy entity_membership_api_update on finly.entity_membership for update to finly_api
  using (finly.actor_can_manage(org_entity_id)) with check (finly.actor_can_manage(org_entity_id));
create policy entity_membership_api_delete on finly.entity_membership for delete to finly_api
  using (finly.actor_can_manage(org_entity_id));

comment on table finly.schema_migration is
  'Applied migrations with their checksums (D-027). Row-level security is on with no policy on purpose: only the owner role reads it.';
