-- 0007 security: actor functions, privileges per role, row-level security on every table, owner-only guards.
-- Design: docs/database/05-security-rls.md. Data impact: none (privileges and policies).
-- Recovery: forward fix. A catalog test asserts RLS on every table and no privileges for client roles.

set local role finly_owner;

-- The actor ---------------------------------------------------------------------------------------------------

create function finly.actor_user_id() returns uuid
language sql stable
as $$ select nullif(current_setting('finly.actor_user_id', true), '')::uuid $$;
comment on function finly.actor_user_id() is 'The signed-in user of this database transaction (set transaction-locally by the API), or null: deny by default.';

create function finly.actor_person_id() returns uuid
language sql stable security definer set search_path = finly, pg_temp
as $$ select person_entity_id from finly.app_user where id = finly.actor_user_id() and status = 'active' $$;
comment on function finly.actor_person_id() is 'The actor''s own person entity, only while the user is active.';

create function finly.actor_role_ids() returns uuid[]
language sql stable security definer set search_path = finly, pg_temp
as $$
  select coalesce(array_agg(distinct ur.role_id), '{}')
  from finly.user_role ur join finly.role r on r.id = ur.role_id and r.status = 'active'
  where ur.user_id = finly.actor_user_id() and ur.revoked_at is null
$$;

create function finly.actor_has_permission(p_key text, p_env uuid default null) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  with grants as (
    select rp.effect
    from finly.user_role ur
    join finly.role r on r.id = ur.role_id and r.status = 'active'
    join finly.role_permission rp on rp.role_id = ur.role_id
    join finly.permission p on p.id = rp.permission_id
    where ur.user_id = finly.actor_user_id() and ur.revoked_at is null and p.key = p_key
      and (ur.scope_entity_id is null or ur.scope_entity_id = p_env)
  )
  select finly.actor_person_id() is not null
     and exists (select 1 from grants where effect = 'allow')
     and not exists (select 1 from grants where effect = 'deny')
$$;
comment on function finly.actor_has_permission(text, uuid) is 'True when an active role (global, or scoped to p_env) allows the permission and none denies it (L8).';

create function finly.actor_owns_entity(p_entity uuid) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  select p_entity = finly.actor_person_id()
      or exists (select 1 from finly.entity_membership m
                 where m.org_entity_id = p_entity and m.member_entity_id = finly.actor_person_id()
                   and m.engine_role in ('owner', 'partner') and m.valid_to is null)
$$;
comment on function finly.actor_owns_entity(uuid) is 'The actor is this person, or an owner or partner of this firm or pool.';

create function finly.actor_env_ids(p_min_level text) returns uuid[]
language sql stable security definer set search_path = finly, pg_temp
as $$
  with need as (
    select case p_min_level when 'read' then 1 when 'write' then 2 when 'manage' then 3 end as lvl
  ),
  granted as (
    select finly.actor_person_id() as env
    union all
    select ea.env_entity_id
    from finly.env_access ea
    where ea.user_id = finly.actor_user_id() and finly.actor_person_id() is not null
      and ea.revoked_at is null and ea.valid_from <= now() and (ea.valid_until is null or ea.valid_until > now())
      and (case ea.level when 'read' then 1 when 'write' then 2 else 3 end) >= (select lvl from need)
    union all
    -- Full admin covers every firm — never anyone's personal books (A4, RULEBOOK-03 §7). Pools such as a family
    -- fund are entered only by explicit grant (open question Q13).
    select e.id from finly.entity e
    where e.kind = 'firm' and finly.actor_has_permission('admin.full')
  ),
  denied as (
    select ar.resource_id
    from finly.access_rule ar
    where ar.resource_type = 'entity' and ar.effect = 'deny' and ar.revoked_at is null and ar.status = 'active'
      and ar.valid_from <= now() and (ar.valid_until is null or ar.valid_until > now())
      and ar.actions && array['discover', 'view']
      and (ar.subject_type = 'everyone' or ar.subject_user_id = finly.actor_user_id()
           or ar.subject_role_id = any (finly.actor_role_ids()))
  )
  select coalesce(array_agg(distinct env), '{}')
  from granted
  where env is not null and env not in (select resource_id from denied where resource_id is not null)
$$;
comment on function finly.actor_env_ids(text) is
  'Environments the actor may enter at read / write / manage level: own personal books, active grants, all firms for full admins; minus explicit denies.';

create function finly.actor_can_manage(p_env uuid) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  select case
    when p_env is null then finly.actor_has_permission('masters.manage')
    else p_env = finly.actor_person_id()
      or (p_env = any (finly.actor_env_ids('write')) and finly.actor_has_permission('masters.manage', p_env))
      or (p_env = any (finly.actor_env_ids('write')) and finly.actor_has_permission('masters.manage'))
  end
$$;
comment on function finly.actor_can_manage(uuid) is
  'May the actor create or change master data in this environment (null = global masters)? Everyone manages their own personal environment (RULEBOOK-03 §6).';

create function finly.actor_access_location_ids() returns uuid[]
language sql stable security definer set search_path = finly, pg_temp
as $$
  select coalesce(array_agg(location_id), '{}') from finly.location_access
  where person_entity_id = finly.actor_person_id() and revoked_at is null
$$;
comment on function finly.actor_access_location_ids() is
  'Locations the actor currently has authorised access to (F5). A function, so location''s policy never loops through location_access''s.';

create function finly.actor_hidden_ids(p_type text) returns uuid[]
language sql stable security definer set search_path = finly, pg_temp
as $$
  with owner_only as (select rank from finly.confidentiality_level where key = 'owner_only'),
  rules as (
    select ar.resource_id, ar.effect
    from finly.access_rule ar
    where ar.resource_type = p_type and ar.resource_id is not null and ar.revoked_at is null and ar.status = 'active'
      and ar.valid_from <= now() and (ar.valid_until is null or ar.valid_until > now())
      and ar.actions && array['discover', 'view']
      and (ar.subject_type = 'everyone' or ar.subject_user_id = finly.actor_user_id()
           or ar.subject_role_id = any (finly.actor_role_ids()))
  ),
  restricted as (
    select f.id, f.entity_id as owner_id
    from finly.fund f join finly.confidentiality_level cl on cl.id = f.confidentiality_level_id
    where p_type = 'fund' and cl.rank >= (select rank from owner_only)
    union all
    select l.id, coalesce(lo.owner_entity_id, l.managed_in_env_id)
    from finly.location l
    left join finly.confidentiality_level cl on cl.id = l.confidentiality_level_id
    left join finly.location_ownership lo on lo.location_id = l.id and lo.valid_to is null
    where p_type = 'location' and (l.disclosure = 'owner_only' or cl.rank >= (select rank from owner_only))
  )
  select coalesce(array_agg(distinct id), '{}') from (
    select resource_id as id from rules where effect = 'deny'
    union all
    select r.id from restricted r
    where not finly.actor_owns_entity(r.owner_id)
      and not exists (select 1 from rules where effect = 'allow' and resource_id = r.id)
  ) hidden
$$;
comment on function finly.actor_hidden_ids(text) is
  'Funds or locations the actor must not see: explicit denies, and owner-only resources of entities the actor does not own unless explicitly allowed (L8, L9, L11).';

grant execute on function
  finly.actor_user_id(), finly.actor_person_id(), finly.actor_role_ids(), finly.actor_has_permission(text, uuid),
  finly.actor_owns_entity(uuid), finly.actor_env_ids(text), finly.actor_can_manage(uuid), finly.actor_hidden_ids(text),
  finly.actor_access_location_ids()
  to finly_api, finly_ledger, finly_system, finly_auth;
grant execute on function finly.next_reference(text, date) to finly_api, finly_ledger, finly_system;

-- Owner-only grants (A4 for access rules; L9 for owner-only resources) -------------------------------------------

create function finly.tg_access_rule_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  resource_env uuid;
  resource_owner uuid;
  -- The grantor is the actor of this transaction; the granted_by column must agree with it.
  grantor_person uuid := finly.person_of_user(coalesce(finly.actor_user_id(), new.granted_by));
begin
  if tg_op = 'UPDATE' then
    -- A rule is never re-pointed: only its revocation (and lifecycle bookkeeping) may change.
    if (to_jsonb(new) - array['revoked_at', 'revoked_by', 'status', 'version', 'updated_at', 'change_xid'])
       is distinct from (to_jsonb(old) - array['revoked_at', 'revoked_by', 'status', 'version', 'updated_at', 'change_xid']) then
      raise exception using errcode = 'F1001', message = 'An access rule cannot be changed; revoke it and create a new one.';
    end if;
    return new;
  end if;
  if finly.actor_user_id() is not null and new.granted_by is distinct from finly.actor_user_id() then
    raise exception using errcode = 'F1008', message = 'An access rule is recorded in the name of the person creating it.';
  end if;
  if new.effect <> 'allow' then
    return new;
  end if;
  resource_env := case new.resource_type
    when 'entity' then new.resource_id
    when 'fund' then (select entity_id from finly.fund where id = new.resource_id)
    when 'ledger_account' then (select entity_id from finly.ledger_account where id = new.resource_id)
    when 'location' then (select managed_in_env_id from finly.location where id = new.resource_id)
  end;
  -- Both the stated scope and the resource's own environment are checked, so neither can be used to slip past.
  if (finly.entity_kind_of(new.env_entity_id) = 'person' and grantor_person is distinct from new.env_entity_id)
     or (finly.entity_kind_of(resource_env) = 'person' and grantor_person is distinct from resource_env) then
    raise exception using errcode = 'F1008', message = 'Only the owner of personal finances can grant access to them.';
  end if;
  -- An owner-only fund or location can be opened to someone else only by an owner of it.
  resource_owner := case new.resource_type
    when 'fund' then (select f.entity_id from finly.fund f
                      join finly.confidentiality_level cl on cl.id = f.confidentiality_level_id
                      where f.id = new.resource_id
                        and cl.rank >= (select rank from finly.confidentiality_level where key = 'owner_only'))
    when 'location' then (select coalesce(lo.owner_entity_id, l.managed_in_env_id) from finly.location l
                          left join finly.confidentiality_level cl on cl.id = l.confidentiality_level_id
                          left join finly.location_ownership lo on lo.location_id = l.id and lo.valid_to is null
                          where l.id = new.resource_id
                            and (l.disclosure = 'owner_only'
                                 or cl.rank >= (select rank from finly.confidentiality_level where key = 'owner_only')))
  end;
  if resource_owner is not null and not (
       grantor_person = resource_owner
       or exists (select 1 from finly.entity_membership m
                  where m.org_entity_id = resource_owner and m.member_entity_id = grantor_person
                    and m.engine_role in ('owner', 'partner') and m.valid_to is null)) then
    raise exception using errcode = 'F1008', message = 'Only an owner can open an owner-only fund or location to others.';
  end if;
  return new;
end
$$;
create trigger access_rule_guard before insert or update on finly.access_rule
  for each row execute function finly.tg_access_rule_guard();

-- Row-level security on every table -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'finly' and c.relkind = 'r' loop
    execute format('alter table finly.%I enable row level security', t);
  end loop;
end
$$;

-- Configuration readable by every signed-in actor; writable with the named permission (null = nobody via the API).
do $$
declare
  cfg record;
begin
  for cfg in select * from (values
      ('lookup_value', 'masters.manage'), ('confidentiality_level', 'security.manage'), ('entity_type', 'masters.manage'),
      ('system_setting', 'settings.manage'), ('label_override', 'masters.manage'), ('security_policy', 'security.manage'),
      ('emergency_control', 'security.emergency'), ('retention_policy', 'security.manage'), ('role', 'access.manage'),
      ('permission', null), ('role_permission', 'access.manage'), ('txn_type', 'masters.manage'),
      ('custom_field_def', 'masters.manage'), ('form_definition', 'masters.manage'),
      ('notification_rule', 'masters.manage'), ('message_template', 'masters.manage'),
      ('coa_template_account', 'masters.manage'),
      ('txn_status_transition', null), ('posting_rule_version', 'posting_rules.manage'), ('key_version', null)
    ) as v(tbl, perm) loop
    execute format('grant select on finly.%I to finly_api, finly_ledger, finly_system', cfg.tbl);
    execute format('create policy %I on finly.%I for select to finly_api, finly_ledger, finly_system using (true)',
      cfg.tbl || '_read', cfg.tbl);
    if cfg.perm is not null then
      execute format('grant insert, update on finly.%I to finly_api', cfg.tbl);
      execute format('create policy %I on finly.%I for insert to finly_api with check (finly.actor_has_permission(%L))',
        cfg.tbl || '_insert', cfg.tbl, cfg.perm);
      execute format('create policy %I on finly.%I for update to finly_api using (finly.actor_has_permission(%L)) with check (finly.actor_has_permission(%L))',
        cfg.tbl || '_update', cfg.tbl, cfg.perm, cfg.perm);
    end if;
  end loop;
end
$$;

-- Approval rules reveal thresholds and scopes: approval managers only; the posting service evaluates them.
grant select, insert, update on finly.approval_rule to finly_api;
grant select on finly.approval_rule to finly_ledger, finly_system;
create policy approval_rule_api on finly.approval_rule to finly_api
  using (finly.actor_has_permission('approvals.manage')) with check (finly.actor_has_permission('approvals.manage'));
create policy approval_rule_svc on finly.approval_rule for select to finly_ledger, finly_system using (true);

-- Identity: the identity service only (credentials never reach the API role).
do $$
declare
  t text;
begin
  foreach t in array array['app_user', 'user_credential', 'mfa_factor', 'recovery_code', 'device', 'unlock_credential',
                           'auth_session', 'refresh_token'] loop
    execute format('grant select, insert, update on finly.%I to finly_auth', t);
    execute format('create policy %I on finly.%I to finly_auth using (true) with check (true)', t || '_auth', t);
  end loop;
end
$$;
grant select, insert on finly.security_event to finly_auth;
create policy security_event_auth on finly.security_event to finly_auth using (true) with check (true);
grant select on finly.app_user_public to finly_api, finly_ledger, finly_system;
grant select on finly.app_user, finly.device, finly.auth_session, finly.security_event to finly_system;
create policy app_user_system on finly.app_user for select to finly_system using (true);
create policy device_system on finly.device for select to finly_system using (true);
create policy auth_session_system on finly.auth_session for select to finly_system using (true);
create policy security_event_system on finly.security_event for select to finly_system using (true);
-- Creating a user creates the person entity, its self access and its roles in the same transaction.
grant select, insert on finly.entity, finly.env_access, finly.user_role to finly_auth;
grant select on finly.entity_type, finly.role, finly.permission, finly.role_permission, finly.system_setting,
  finly.security_policy, finly.emergency_control, finly.key_version to finly_auth;
create policy entity_auth_read on finly.entity for select to finly_auth using (kind = 'person');
create policy entity_auth_insert on finly.entity for insert to finly_auth with check (kind = 'person');
create policy env_access_auth on finly.env_access to finly_auth using (true) with check (source = 'self');
create policy user_role_auth on finly.user_role to finly_auth using (true) with check (true);
do $$
declare
  t text;
begin
  foreach t in array array['entity_type', 'role', 'permission', 'role_permission', 'system_setting', 'security_policy',
                           'emergency_control', 'key_version'] loop
    execute format('create policy %I on finly.%I for select to finly_auth using (true)', t || '_auth_read', t);
  end loop;
end
$$;

-- Authorisation configuration: own rows, the owner of the environment, or access managers.
grant select, insert, update on finly.user_role, finly.env_access, finly.access_rule, finly.break_glass to finly_api;
create policy user_role_api_read on finly.user_role for select to finly_api
  using (user_id = finly.actor_user_id() or finly.actor_has_permission('access.manage'));
create policy user_role_api_write on finly.user_role for insert to finly_api
  with check (finly.actor_has_permission('access.manage') and granted_by = finly.actor_user_id());
create policy user_role_api_revoke on finly.user_role for update to finly_api
  using (finly.actor_has_permission('access.manage')) with check (revoked_by = finly.actor_user_id());
create policy env_access_api_read on finly.env_access for select to finly_api
  using (user_id = finly.actor_user_id() or env_entity_id = finly.actor_person_id()
         or finly.actor_has_permission('access.manage'));
create policy env_access_api_grant on finly.env_access for insert to finly_api
  with check (granted_by = finly.actor_user_id()
              and (env_entity_id = finly.actor_person_id() or finly.actor_has_permission('access.manage')));
create policy env_access_api_revoke on finly.env_access for update to finly_api
  using (env_entity_id = finly.actor_person_id() or user_id = finly.actor_user_id()
         or finly.actor_has_permission('access.manage'))
  with check (revoked_by = finly.actor_user_id());
create policy access_rule_api_read on finly.access_rule for select to finly_api
  using (subject_user_id = finly.actor_user_id() or granted_by = finly.actor_user_id()
         or finly.actor_has_permission('access.manage'));
create policy access_rule_api_write on finly.access_rule for insert to finly_api
  with check (granted_by = finly.actor_user_id()
              and (finly.actor_has_permission('access.manage') or source = 'owner'));
create policy access_rule_api_update on finly.access_rule for update to finly_api
  using (granted_by = finly.actor_user_id() or finly.actor_has_permission('access.manage'))
  with check (granted_by = finly.actor_user_id() or finly.actor_has_permission('access.manage'));
create policy break_glass_api on finly.break_glass to finly_api
  using (user_id = finly.actor_user_id() or finly.actor_has_permission('access.manage'))
  with check (user_id = finly.actor_user_id() and finly.actor_has_permission('access.break_glass'));
grant select on finly.user_role, finly.env_access, finly.access_rule, finly.break_glass,
  finly.entity_membership to finly_system, finly_ledger;
create policy user_role_svc on finly.user_role for select to finly_system, finly_ledger using (true);
create policy env_access_svc on finly.env_access for select to finly_system, finly_ledger using (true);
create policy access_rule_svc on finly.access_rule for select to finly_system, finly_ledger using (true);
create policy break_glass_svc on finly.break_glass for select to finly_system, finly_ledger using (true);

-- Entities and environment-scoped masters ------------------------------------------------------------------------

grant select, insert, update on finly.entity, finly.person_profile, finly.firm_profile, finly.entity_membership,
  finly.contact, finly.category, finly.tag, finly.place, finly.expense_event, finly.custom_field_value,
  finly.report_definition, finly.dashboard_config, finly.ledger_account, finly.fund, finly.location,
  finly.bank_account_detail, finly.location_ownership, finly.location_access, finly.location_holder,
  finly.balance_hold to finly_api;

create policy entity_api_read on finly.entity for select to finly_api
  using (id = any ((select finly.actor_env_ids('read'))::uuid[])
         or managed_in_env_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or exists (select 1 from finly.entity_membership m where m.member_entity_id = entity.id));
create policy entity_api_insert on finly.entity for insert to finly_api
  with check (finly.actor_can_manage(managed_in_env_id) and created_by = finly.actor_user_id());
create policy entity_api_update on finly.entity for update to finly_api
  using (finly.actor_can_manage(coalesce(managed_in_env_id, id)))
  with check (finly.actor_can_manage(coalesce(managed_in_env_id, id)));

create policy entity_membership_api_read on finly.entity_membership for select to finly_api
  using (org_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or member_entity_id = any ((select finly.actor_env_ids('read'))::uuid[]));
create policy entity_membership_api_write on finly.entity_membership to finly_api
  using (finly.actor_can_manage(org_entity_id)) with check (finly.actor_can_manage(org_entity_id));

create policy person_profile_api on finly.person_profile to finly_api
  using (exists (select 1 from finly.entity e where e.id = person_profile.entity_id))
  with check (exists (select 1 from finly.entity e where e.id = person_profile.entity_id
                       and finly.actor_can_manage(coalesce(e.managed_in_env_id, e.id))));
create policy firm_profile_api on finly.firm_profile to finly_api
  using (exists (select 1 from finly.entity e where e.id = firm_profile.entity_id))
  with check (finly.actor_can_manage(entity_id));

create policy contact_api on finly.contact to finly_api
  using (managed_in_env_id = any ((select finly.actor_env_ids('read'))::uuid[]))
  with check (finly.actor_can_manage(managed_in_env_id));
create policy expense_event_api on finly.expense_event to finly_api
  using (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[]))
  with check (env_entity_id = any ((select finly.actor_env_ids('write'))::uuid[]));

do $$
declare
  t text;
begin
  foreach t in array array['category', 'tag', 'place'] loop
    execute format('create policy %I on finly.%I for select to finly_api using (
        managed_in_env_id is null or managed_in_env_id = any ((select finly.actor_env_ids(''read''))::uuid[])
      )', t || '_api_read', t);
    execute format('create policy %I on finly.%I for insert to finly_api with check (finly.actor_can_manage(managed_in_env_id))',
      t || '_api_insert', t);
    execute format('create policy %I on finly.%I for update to finly_api using (finly.actor_can_manage(managed_in_env_id)) with check (finly.actor_can_manage(managed_in_env_id))',
      t || '_api_update', t);
  end loop;
end
$$;

create policy report_definition_api on finly.report_definition to finly_api
  using (kind = 'system' or owner_user_id = finly.actor_user_id() or visibility <> 'private')
  with check ((kind = 'custom' and owner_user_id = finly.actor_user_id())
              or (kind = 'system' and finly.actor_has_permission('masters.manage')));
create policy dashboard_config_api on finly.dashboard_config to finly_api
  using (user_id = finly.actor_user_id() or role_id = any (finly.actor_role_ids()))
  with check (user_id = finly.actor_user_id() or finly.actor_has_permission('masters.manage'));

create policy ledger_account_api on finly.ledger_account to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[]))
  with check (finly.actor_can_manage(entity_id));
create policy fund_api on finly.fund to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[]) and id <> all ((select finly.actor_hidden_ids('fund'))::uuid[]))
  with check (finly.actor_can_manage(entity_id));

create policy location_api_read on finly.location for select to finly_api
  using (id <> all ((select finly.actor_hidden_ids('location'))::uuid[])
         and (managed_in_env_id = any ((select finly.actor_env_ids('read'))::uuid[])
              or custody_person_id = finly.actor_person_id()
              or id = any ((select finly.actor_access_location_ids())::uuid[])
              or exists (select 1 from finly.balance_slice s
                         where s.location_id = location.id
                           and s.entity_id = any ((select finly.actor_env_ids('read'))::uuid[]))));
create policy location_api_insert on finly.location for insert to finly_api
  with check (finly.actor_can_manage(managed_in_env_id));
create policy location_api_update on finly.location for update to finly_api
  using (finly.actor_can_manage(managed_in_env_id)) with check (finly.actor_can_manage(managed_in_env_id));

do $$
declare
  t text;
begin
  foreach t in array array['bank_account_detail', 'location_ownership', 'location_access', 'location_holder'] loop
    execute format('create policy %I on finly.%I to finly_api
        using (exists (select 1 from finly.location l where l.id = %I.location_id))
        with check (exists (select 1 from finly.location l where l.id = %I.location_id
                            and finly.actor_can_manage(l.managed_in_env_id)))', t || '_api', t, t, t);
  end loop;
end
$$;

create policy balance_hold_api on finly.balance_hold to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[])
         and (location_id is null or location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[])))
  with check (entity_id = any ((select finly.actor_env_ids('write'))::uuid[]) and created_by = finly.actor_user_id());

-- Events and ledger (read side for the API; drafts writable) -------------------------------------------------------

grant select, insert, update on finly.txn, finly.txn_entity, finly.custom_field_value to finly_api;
-- The only DELETE privileges in Finly: legs and tags of the actor's own drafts (the leg trigger refuses others).
grant select, insert, update, delete on finly.txn_leg, finly.txn_tag to finly_api;
grant select, insert on finly.txn_note to finly_api;
grant select on finly.txn_link, finly.accounting_period, finly.journal, finly.journal_line, finly.balance_slice,
  finly.balance_current, finly.balance_period, finly.open_item, finly.open_item_origin, finly.settlement_allocation,
  finly.period_close_run to finly_api;
grant select, update on finly.custody_event to finly_api;
grant select, insert, update on finly.approval_request to finly_api;

-- An event is visible through a leg the actor may see (so events wholly inside a hidden fund or location stay
-- hidden), or to its maker while it is a draft in an environment they may still write to.
create policy txn_api_read on finly.txn for select to finly_api
  using ((created_by_user_id = finly.actor_user_id() and status = 'draft'
          and primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[]))
         or exists (select 1 from finly.txn_leg l where l.txn_id = txn.id));
create policy txn_api_insert on finly.txn for insert to finly_api
  with check (status = 'draft' and created_by_user_id = finly.actor_user_id()
              and primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[]));
create policy txn_api_update on finly.txn for update to finly_api
  using (primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[]))
  with check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled')
              and primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[]));

create policy txn_entity_api_read on finly.txn_entity for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and exists (select 1 from finly.txn t where t.id = txn_entity.txn_id));
create policy txn_note_api_read on finly.txn_note for select to finly_api
  using (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and exists (select 1 from finly.txn t where t.id = txn_note.txn_id));
create policy txn_note_api_insert on finly.txn_note for insert to finly_api
  with check (created_by = finly.actor_user_id() and env_entity_id = any ((select finly.actor_env_ids('write'))::uuid[])
              and exists (select 1 from finly.txn t where t.id = txn_note.txn_id));
create policy txn_entity_api_insert on finly.txn_entity for insert to finly_api
  with check (exists (select 1 from finly.txn t where t.id = txn_entity.txn_id
                       and t.primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[])));
create policy txn_entity_api_ack on finly.txn_entity for update to finly_api
  using (entity_id = any ((select finly.actor_env_ids('write'))::uuid[]))
  with check (entity_id = any ((select finly.actor_env_ids('write'))::uuid[]));

create policy txn_leg_api_read on finly.txn_leg for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and (fund_id is null or fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[]))
         and (location_id is null or location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[])));
-- Write-only policies (a FOR ALL policy would also govern reads and loop back through txn's read policy).
create policy txn_leg_api_insert on finly.txn_leg for insert to finly_api
  with check (exists (select 1 from finly.txn t where t.id = txn_leg.txn_id
                       and t.created_by_user_id = finly.actor_user_id()
                       and t.primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[])));
create policy txn_leg_api_update on finly.txn_leg for update to finly_api
  using (exists (select 1 from finly.txn t where t.id = txn_leg.txn_id
                  and t.created_by_user_id = finly.actor_user_id()))
  with check (exists (select 1 from finly.txn t where t.id = txn_leg.txn_id
                       and t.created_by_user_id = finly.actor_user_id()));
create policy txn_leg_api_delete on finly.txn_leg for delete to finly_api
  using (exists (select 1 from finly.txn t where t.id = txn_leg.txn_id
                  and t.created_by_user_id = finly.actor_user_id()));
create policy txn_tag_api on finly.txn_tag to finly_api
  using (exists (select 1 from finly.txn t where t.id = txn_tag.txn_id))
  with check (exists (select 1 from finly.txn t where t.id = txn_tag.txn_id
                       and t.primary_env_id = any ((select finly.actor_env_ids('write'))::uuid[])));
create policy txn_link_api on finly.txn_link for select to finly_api
  using (exists (select 1 from finly.txn t where t.id = txn_link.from_txn_id)
         or exists (select 1 from finly.txn t where t.id = txn_link.to_txn_id));
create policy custom_field_value_api on finly.custom_field_value to finly_api
  using ((txn_id is not null and exists (select 1 from finly.txn t where t.id = custom_field_value.txn_id))
      or (txn_leg_id is not null and exists (select 1 from finly.txn_leg l where l.id = custom_field_value.txn_leg_id))
      or (entity_id is not null and exists (select 1 from finly.entity e where e.id = custom_field_value.entity_id))
      or (location_id is not null and exists (select 1 from finly.location l where l.id = custom_field_value.location_id))
      or (expense_event_id is not null
          and exists (select 1 from finly.expense_event x where x.id = custom_field_value.expense_event_id)));

do $$
declare
  t text;
begin
  foreach t in array array['accounting_period', 'journal'] loop
    execute format('create policy %I on finly.%I for select to finly_api
        using (entity_id = any ((select finly.actor_env_ids(''read''))::uuid[]))', t || '_api', t);
  end loop;
end
$$;
create policy journal_line_api on finly.journal_line for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[])
         and (location_id is null or location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[])));
create policy balance_slice_api on finly.balance_slice for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         and fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[])
         and (location_id is null or location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[])));
-- Balances inherit the slice's visibility, including hidden funds and locations.
create policy balance_current_api on finly.balance_current for select to finly_api
  using (exists (select 1 from finly.balance_slice s where s.id = balance_current.slice_id));
create policy balance_period_api on finly.balance_period for select to finly_api
  using (exists (select 1 from finly.balance_slice s where s.id = balance_period.slice_id));
-- An open item is visible through a side the actor may see, carried in a fund they may see.
create policy open_item_api on finly.open_item for select to finly_api
  using ((debtor_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
          and (debtor_fund_id is null or debtor_fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[])))
      or (creditor_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
          and (creditor_fund_id is null or creditor_fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[]))));
create policy open_item_origin_api on finly.open_item_origin for select to finly_api
  using (exists (select 1 from finly.journal_line l where l.id = open_item_origin.journal_line_id));
create policy settlement_allocation_api on finly.settlement_allocation for select to finly_api
  using (exists (select 1 from finly.open_item o where o.id = settlement_allocation.open_item_id));
create policy custody_event_api_read on finly.custody_event for select to finly_api
  using ((entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
          or to_holder_person_id = finly.actor_person_id() or from_holder_person_id = finly.actor_person_id())
         and fund_id <> all ((select finly.actor_hidden_ids('fund'))::uuid[])
         and from_location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[])
         and to_location_id <> all ((select finly.actor_hidden_ids('location'))::uuid[]));
create policy custody_event_api_confirm on finly.custody_event for update to finly_api
  using (to_holder_person_id = finly.actor_person_id())
  with check (to_holder_person_id = finly.actor_person_id() and confirmed_by = finly.actor_user_id());
create policy approval_request_api_read on finly.approval_request for select to finly_api
  using (requested_by = finly.actor_user_id() or finly.actor_has_permission(required_permission)
         or (txn_id is not null and exists (select 1 from finly.txn t where t.id = approval_request.txn_id)));
create policy approval_request_api_insert on finly.approval_request for insert to finly_api
  with check (requested_by = finly.actor_user_id());
create policy approval_request_api_decide on finly.approval_request for update to finly_api
  using (finly.actor_has_permission(required_permission))
  with check (decided_by = finly.actor_user_id());
create policy period_close_run_api on finly.period_close_run for select to finly_api
  using (exists (select 1 from finly.accounting_period p where p.id = period_close_run.period_id));

-- The posting service: everything an authorised posting touches, always attributable to an actor.
grant select on finly.entity, finly.ledger_account, finly.fund, finly.location, finly.location_holder,
  finly.location_ownership, finly.category, finly.custom_field_value, finly.expense_event
  to finly_ledger;
-- Reversal and correction events are created by the posting service as complete events (header, legs, notes).
grant select, insert on finly.txn_leg, finly.txn_note, finly.open_item_origin to finly_ledger;
grant select, insert, update on finly.txn, finly.txn_entity, finly.accounting_period, finly.balance_current,
  finly.balance_period, finly.open_item, finly.custody_event, finly.balance_hold, finly.approval_request,
  finly.idempotency_record, finly.reconciliation to finly_ledger;
grant select, insert on finly.txn_link, finly.journal, finly.journal_line, finly.balance_slice,
  finly.settlement_allocation, finly.period_close_run, finly.exception_finding, finly.notification to finly_ledger;
grant select, update on finly.journal_chain_head to finly_ledger;
do $$
declare
  t text;
begin
  foreach t in array array['entity', 'ledger_account', 'fund', 'location', 'location_holder', 'location_ownership',
      'category', 'txn_leg', 'custom_field_value', 'expense_event', 'txn', 'txn_entity', 'accounting_period',
      'balance_current', 'balance_period', 'open_item', 'custody_event', 'balance_hold', 'approval_request',
      'reconciliation', 'txn_link', 'journal', 'journal_line', 'balance_slice', 'settlement_allocation',
      'period_close_run', 'exception_finding', 'journal_chain_head', 'txn_note', 'open_item_origin'] loop
    execute format('create policy %I on finly.%I to finly_ledger
        using (finly.actor_user_id() is not null) with check (finly.actor_user_id() is not null)', t || '_ledger', t);
  end loop;
end
$$;
create policy idempotency_record_ledger on finly.idempotency_record to finly_ledger
  using (user_id = finly.actor_user_id()) with check (user_id = finly.actor_user_id());
create policy notification_ledger on finly.notification for insert to finly_ledger
  with check (finly.actor_user_id() is not null);

-- Control, files, sharing ----------------------------------------------------------------------------------------

grant select, insert, update on finly.reconciliation, finly.bank_statement_import, finly.bank_statement_line,
  finly.attachment, finly.attachment_link, finly.document, finly.share_profile, finly.share_request,
  finly.secure_link to finly_api;
grant select, update on finly.exception_finding to finly_api;
grant select on finly.integrity_run, finly.secure_link_access to finly_api;
grant select, insert on finly.share_event to finly_api;

create policy reconciliation_api on finly.reconciliation to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or (location_id is not null and exists (select 1 from finly.location l where l.id = reconciliation.location_id)))
  with check (created_by = finly.actor_user_id() or approved_by = finly.actor_user_id());
create policy bank_statement_import_api on finly.bank_statement_import to finly_api
  using (exists (select 1 from finly.location l where l.id = bank_statement_import.location_id))
  with check (exists (select 1 from finly.location l where l.id = bank_statement_import.location_id));
create policy bank_statement_line_api on finly.bank_statement_line to finly_api
  using (exists (select 1 from finly.bank_statement_import i where i.id = bank_statement_line.import_id))
  with check (exists (select 1 from finly.bank_statement_import i where i.id = bank_statement_line.import_id));
create policy exception_finding_api on finly.exception_finding to finly_api
  using (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or (env_entity_id is null and finly.actor_has_permission('exceptions.view_system')))
  with check (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
              or (env_entity_id is null and finly.actor_has_permission('exceptions.view_system')));
create policy integrity_run_api on finly.integrity_run for select to finly_api
  using (finly.actor_has_permission('integrity.view'));
create policy attachment_api_read on finly.attachment for select to finly_api
  using (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[]));
create policy attachment_api_insert on finly.attachment for insert to finly_api
  with check (uploaded_by = finly.actor_user_id() and env_entity_id = any ((select finly.actor_env_ids('write'))::uuid[]));
create policy attachment_api_update on finly.attachment for update to finly_api
  using (env_entity_id = any ((select finly.actor_env_ids('write'))::uuid[]))
  with check (env_entity_id = any ((select finly.actor_env_ids('write'))::uuid[]));
create policy attachment_link_api on finly.attachment_link to finly_api
  using (exists (select 1 from finly.attachment a where a.id = attachment_link.attachment_id))
  with check (created_by = finly.actor_user_id()
              and exists (select 1 from finly.attachment a where a.id = attachment_link.attachment_id));
create policy document_api on finly.document to finly_api
  using (generated_by = finly.actor_user_id()
         or (txn_id is not null and exists (select 1 from finly.txn t where t.id = document.txn_id)))
  with check (generated_by = finly.actor_user_id());
create policy share_profile_api on finly.share_profile to finly_api
  using (owner_user_id = finly.actor_user_id()) with check (owner_user_id = finly.actor_user_id());
create policy share_request_api on finly.share_request to finly_api
  using (initiated_by = finly.actor_user_id() or finly.actor_has_permission('share.audit'))
  with check (initiated_by = finly.actor_user_id());
create policy share_event_api on finly.share_event to finly_api
  using (exists (select 1 from finly.share_request r where r.id = share_event.share_request_id))
  with check (actor_user_id = finly.actor_user_id()
              and exists (select 1 from finly.share_request r where r.id = share_event.share_request_id
                          and r.initiated_by = finly.actor_user_id()));
create policy secure_link_api on finly.secure_link to finly_api
  using (exists (select 1 from finly.share_request r where r.id = secure_link.share_request_id))
  with check (exists (select 1 from finly.share_request r where r.id = secure_link.share_request_id
                      and r.initiated_by = finly.actor_user_id()));
create policy secure_link_access_api on finly.secure_link_access for select to finly_api
  using (exists (select 1 from finly.secure_link s where s.id = secure_link_access.secure_link_id));

-- Operations and audit ----------------------------------------------------------------------------------------

grant select, insert, update on finly.idempotency_record, finly.sync_review, finly.notification to finly_api;
grant select, insert on finly.audit_log to finly_api, finly_ledger, finly_auth;
grant select, update on finly.audit_chain_head to finly_api, finly_ledger, finly_auth, finly_system;

create policy idempotency_record_api on finly.idempotency_record to finly_api
  using (user_id = finly.actor_user_id()) with check (user_id = finly.actor_user_id());
create policy sync_review_api on finly.sync_review to finly_api
  using (user_id = finly.actor_user_id()) with check (user_id = finly.actor_user_id());
create policy notification_api_read on finly.notification for select to finly_api
  using (user_id = finly.actor_user_id());
create policy notification_api_insert on finly.notification for insert to finly_api
  with check (finly.actor_user_id() is not null);
create policy notification_api_update on finly.notification for update to finly_api
  using (user_id = finly.actor_user_id()) with check (user_id = finly.actor_user_id());
create policy audit_log_read on finly.audit_log for select to finly_api, finly_ledger
  using (actor_user_id = finly.actor_user_id()
         or (env_entity_id = any ((select finly.actor_env_ids('read'))::uuid[]) and finly.actor_has_permission('audit.view'))
         or (env_entity_id is null and finly.actor_has_permission('audit.view_system')));
create policy audit_log_append on finly.audit_log for insert to finly_api, finly_ledger
  with check (actor_user_id = finly.actor_user_id());
create policy audit_log_auth on finly.audit_log to finly_auth using (true) with check (true);
create policy audit_chain_head_append on finly.audit_chain_head to finly_api, finly_ledger, finly_auth, finly_system
  using (true) with check (true);

-- The system role: read everything but credentials; write runs, findings, notifications, periods, audit.
do $$
declare
  t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'finly' and c.relkind = 'r'
             and c.relname not in ('user_credential', 'mfa_factor', 'recovery_code', 'unlock_credential',
                                   'refresh_token', 'app_user', 'device', 'auth_session', 'security_event',
                                   'schema_migration', 'user_role', 'env_access', 'access_rule', 'break_glass')
             and not exists (select 1 from pg_policies p where p.schemaname = 'finly' and p.tablename = c.relname
                             and 'finly_system' = any (p.roles) and p.cmd in ('SELECT', 'ALL')) loop
    execute format('grant select on finly.%I to finly_system', t);
    execute format('create policy %I on finly.%I for select to finly_system using (true)', t || '_system_read', t);
  end loop;
end
$$;
grant insert, update on finly.integrity_run, finly.exception_finding, finly.notification, finly.accounting_period
  to finly_system;
grant insert on finly.period_close_run, finly.audit_log to finly_system;
grant update on finly.journal_line to finly_system;
grant delete on finly.idempotency_record to finly_system;
create policy integrity_run_system_write on finly.integrity_run for insert to finly_system with check (true);
create policy integrity_run_system_update on finly.integrity_run for update to finly_system using (true) with check (true);
create policy exception_finding_system_write on finly.exception_finding for insert to finly_system with check (true);
create policy exception_finding_system_update on finly.exception_finding for update to finly_system
  using (true) with check (true);
create policy notification_system_write on finly.notification for insert to finly_system with check (true);
create policy notification_system_update on finly.notification for update to finly_system using (true) with check (true);
create policy accounting_period_system_write on finly.accounting_period for insert to finly_system with check (true);
create policy accounting_period_system_update on finly.accounting_period for update to finly_system
  using (true) with check (true);
create policy period_close_run_system on finly.period_close_run for insert to finly_system with check (true);
create policy audit_log_system on finly.audit_log for insert to finly_system with check (true);
create policy journal_line_system_rotation on finly.journal_line for update to finly_system using (true) with check (true);
create policy idempotency_record_system_cleanup on finly.idempotency_record for delete to finly_system
  using (expires_at < now());
