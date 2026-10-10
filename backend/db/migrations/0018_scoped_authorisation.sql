-- 0018 — Authorisation defects found by the master-plan-v3 audit (docs/PLAN.md M1, docs/REQUIREMENTS.md IAM-17,
-- ADM-05, ADM-06, APR-03).
--
-- 1. Permissions held through a role scoped to one firm or pool now count in that firm's own grant, approval and audit
--    policies. Before, those policies asked `actor_has_permission(key)` with no environment, so only global roles
--    counted: an entity owner (D-038) could not grant access to, approve in, or read the audit of their own firm.
-- 2. Nobody grants themselves access, roles or allow-rules; the platform's super_admin role comes only from the
--    one-time bootstrap tool (a transaction with no signed-in actor), never through the API.
-- 3. Access to a firm's books is granted only by someone who manages those books (D-038): a platform-wide
--    access.manage alone opens no firm.
-- 4. The API role marks an entry approved only when its approval was decided; only the maker cancels an entry.
-- 5. Months are opened only inside a signed-in person's posting.

-- The environment of an entry and whether its approval is complete, read past the caller's row filters (these helpers
-- reveal one id or one boolean about a row the policy is already deciding about).
create function finly.txn_env(p_txn uuid) returns uuid
language sql stable security definer set search_path = finly, pg_temp
as $$ select primary_env_id from finly.txn where id = p_txn $$;
comment on function finly.txn_env(uuid) is 'The books an entry was recorded from; null for no entry. Used by approval policies to scope permissions.';

create function finly.txn_approval_complete(p_txn uuid) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  select exists (select 1 from finly.approval_request where txn_id = p_txn and request_status = 'approved')
     and not exists (select 1 from finly.approval_request
                     where txn_id = p_txn and request_status in ('pending', 'rejected'))
$$;
comment on function finly.txn_approval_complete(uuid) is 'At least one approval step of the entry was approved and none is still pending or was rejected (withdrawn and superseded steps no longer count).';

revoke all on function finly.txn_env(uuid) from public;
revoke all on function finly.txn_approval_complete(uuid) from public;
grant execute on function finly.txn_env(uuid) to finly_api, finly_ledger, finly_system;
grant execute on function finly.txn_approval_complete(uuid) to finly_api, finly_ledger, finly_system;

-- Roles -----------------------------------------------------------------------------------------------------------
drop policy user_role_api_read on finly.user_role;
create policy user_role_api_read on finly.user_role for select to finly_api
  using (user_id = finly.actor_user_id() or finly.actor_has_permission('access.manage', scope_entity_id));

drop policy user_role_api_write on finly.user_role;
create policy user_role_api_write on finly.user_role for insert to finly_api
  with check (
    granted_by = finly.actor_user_id()
    and user_id <> finly.actor_user_id()
    and finly.actor_has_permission('access.manage', scope_entity_id)
    and (scope_entity_id is null or scope_entity_id = any ((select finly.actor_env_ids('manage'))::uuid[]))
    and not exists (select 1 from finly.role r where r.id = role_id and r.key = 'super_admin')
  );

drop policy user_role_api_revoke on finly.user_role;
create policy user_role_api_revoke on finly.user_role for update to finly_api
  using (finly.actor_has_permission('access.manage', scope_entity_id))
  with check (revoked_by = finly.actor_user_id());

-- The identity role reads roles and creates them only for the bootstrap tool, which runs with no signed-in actor.
drop policy user_role_auth on finly.user_role;
create policy user_role_auth_read on finly.user_role for select to finly_auth using (true);
create policy user_role_auth_bootstrap on finly.user_role for insert to finly_auth
  with check (finly.actor_user_id() is null);

-- Access to books ------------------------------------------------------------------------------------------------
drop policy env_access_api_read on finly.env_access;
create policy env_access_api_read on finly.env_access for select to finly_api
  using (user_id = finly.actor_user_id() or env_entity_id = finly.actor_person_id()
         or finly.actor_has_permission('access.manage', env_entity_id));

drop policy env_access_api_grant on finly.env_access;
create policy env_access_api_grant on finly.env_access for insert to finly_api
  with check (
    granted_by = finly.actor_user_id()
    and user_id <> finly.actor_user_id()
    and (env_entity_id = finly.actor_person_id()
         or (finly.actor_has_permission('access.manage', env_entity_id)
             and env_entity_id = any ((select finly.actor_env_ids('manage'))::uuid[])))
  );

drop policy env_access_api_revoke on finly.env_access;
create policy env_access_api_revoke on finly.env_access for update to finly_api
  using (env_entity_id = finly.actor_person_id() or user_id = finly.actor_user_id()
         or (finly.actor_has_permission('access.manage', env_entity_id)
             and env_entity_id = any ((select finly.actor_env_ids('manage'))::uuid[])))
  with check (revoked_by = finly.actor_user_id());

-- Access rules ---------------------------------------------------------------------------------------------------
drop policy access_rule_api_read on finly.access_rule;
create policy access_rule_api_read on finly.access_rule for select to finly_api
  using (subject_user_id = finly.actor_user_id() or granted_by = finly.actor_user_id()
         or finly.actor_has_permission('access.manage', env_entity_id));

drop policy access_rule_api_write on finly.access_rule;
create policy access_rule_api_write on finly.access_rule for insert to finly_api
  with check (
    granted_by = finly.actor_user_id()
    and not (effect = 'allow' and subject_user_id is not distinct from finly.actor_user_id())
    and (finly.actor_has_permission('access.manage', env_entity_id) or source = 'owner')
  );

drop policy access_rule_api_update on finly.access_rule;
create policy access_rule_api_update on finly.access_rule for update to finly_api
  using (granted_by = finly.actor_user_id() or finly.actor_has_permission('access.manage', env_entity_id))
  with check (
    (granted_by = finly.actor_user_id() or finly.actor_has_permission('access.manage', env_entity_id))
    and not (effect = 'allow' and subject_user_id is not distinct from finly.actor_user_id())
  );

-- Approvals ------------------------------------------------------------------------------------------------------
drop policy approval_rule_api on finly.approval_rule;
create policy approval_rule_api on finly.approval_rule to finly_api
  using (finly.actor_has_permission('approvals.manage', env_entity_id))
  with check (finly.actor_has_permission('approvals.manage', env_entity_id));

drop policy approval_request_api_read on finly.approval_request;
create policy approval_request_api_read on finly.approval_request for select to finly_api
  using (requested_by = finly.actor_user_id()
         or finly.actor_has_permission(required_permission, finly.txn_env(txn_id))
         or (txn_id is not null and exists (select 1 from finly.txn t where t.id = approval_request.txn_id)));

drop policy approval_request_api_decide on finly.approval_request;
create policy approval_request_api_decide on finly.approval_request for update to finly_api
  using (finly.actor_has_permission(required_permission, finly.txn_env(txn_id))
         and requested_by <> finly.actor_user_id())
  with check (decided_by = finly.actor_user_id());

-- Entries: approved only through a decided approval; cancelled only by their maker.
drop policy txn_api_update on finly.txn;
create policy txn_api_update on finly.txn for update to finly_api
  using (primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[]))
  with check (
    primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[])
    and (status in ('draft', 'pending_approval', 'rejected')
         or (status = 'approved' and finly.txn_approval_complete(id))
         or (status = 'cancelled' and created_by_user_id = finly.actor_user_id()))
  );

-- Audit ----------------------------------------------------------------------------------------------------------
drop policy audit_log_read on finly.audit_log;
create policy audit_log_read on finly.audit_log for select to finly_api, finly_ledger
  using (actor_user_id = finly.actor_user_id()
         or (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
             and finly.actor_has_permission('audit.view', env_entity_id))
         or (env_entity_id is null and finly.actor_has_permission('audit.view_system')));

-- Periods --------------------------------------------------------------------------------------------------------
create or replace function finly.ensure_periods(p_entity uuid, p_date date) returns void
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  first_start date;
  last_start date;
  m date;
begin
  if finly.actor_user_id() is null then
    raise exception using errcode = 'F1008', message = 'Months are opened only by a signed-in person''s entry.';
  end if;
  select min(period_start), max(period_start) into first_start, last_start
  from finly.accounting_period where entity_id = p_entity;
  -- Books that are not set up, dates before the books start, and dates more than a year ahead get nothing.
  if first_start is null or p_date < first_start or p_date > current_date + 366 then
    return;
  end if;
  m := (last_start + interval '1 month')::date;
  while m <= date_trunc('month', p_date)::date loop
    insert into finly.accounting_period (entity_id, period_start, period_end)
    values (p_entity, m, (m + interval '1 month - 1 day')::date)
    on conflict do nothing;
    m := (m + interval '1 month')::date;
  end loop;
end
$$;
comment on function finly.ensure_periods(uuid, date) is
  'Opens the monthly periods after the latest one up to the month of p_date, inside a signed-in person''s posting (never before the books start, never more than a year ahead). Closed periods stay closed.';
