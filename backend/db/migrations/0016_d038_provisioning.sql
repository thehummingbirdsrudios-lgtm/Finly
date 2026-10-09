-- 0016 D-038 enforced, and books provisioned by the database (GATE-RESPONSE-05 §1; access-model.md §3 step 3 part).
--   * Platform administration no longer opens any firm's books: actor_env_ids loses the `admin.full` branch. A Super
--     Admin who needs a firm gets an explicit grant there (or the consented support process).
--   * Two entity role templates, `entity_owner` and `entity_admin`, always assigned scoped to one firm or pool.
--     Recorded owners who have accounts receive `entity_owner` in their firms and an access grant with the new source
--     `ownership`, marked for review — so nobody loses access they had except through the Super Admin rule.
--   * The posting policy no longer treats ownership as a permission (backend change in the same commit): owners post
--     through their explicit role.
--   * finly.provision_books: a new person, firm or pool receives its chart of accounts, its default fund and its
--     monthly periods from the opening month, once. finly.ensure_periods opens later months as entries reach them.
-- Data impact: grants added for recorded owners with accounts; none removed except the implicit Super Admin access.
-- Recovery: forward fix.

set local role finly_owner;

-- Access grants may come from a recorded ownership ---------------------------------------------------------------

alter table finly.env_access drop constraint env_access_source_check;
alter table finly.env_access add constraint env_access_source_check
  check (source in ('self', 'admin', 'owner_grant', 'temporary', 'break_glass', 'ownership'));
alter table finly.env_access drop constraint env_access_check1;
alter table finly.env_access add constraint env_access_granted_by_check
  check ((source = 'self' and granted_by is null) or (source = 'ownership') or (source not in ('self', 'ownership') and granted_by is not null));
comment on column finly.env_access.source is
  'self (own personal books) · admin · owner_grant (personal books, by their owner) · temporary · break_glass · ownership (a recorded owner of a firm or pool, D-038)';

create or replace function finly.tg_env_access_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  env_kind text := finly.entity_kind_of(new.env_entity_id);
begin
  -- Attribution: when an actor is set (every API transaction), the grantor must be that actor.
  if finly.actor_user_id() is not null and new.granted_by is distinct from finly.actor_user_id()
     and tg_op = 'INSERT' and new.source <> 'self' then
    raise exception using errcode = 'F1008', message = 'An access grant is recorded in the name of the person granting it.';
  end if;
  if tg_op = 'UPDATE' and (new.user_id, new.env_entity_id, new.level, new.source, new.granted_by, new.granted_at,
      new.valid_from, new.valid_until, new.break_glass_id)
      is distinct from (old.user_id, old.env_entity_id, old.level, old.source, old.granted_by, old.granted_at,
      old.valid_from, old.valid_until, old.break_glass_id) then
    raise exception using errcode = 'F1001',
      message = 'An access grant cannot be changed; revoke it and grant again so the history stays complete.';
  end if;
  if env_kind is null or env_kind not in ('firm', 'person', 'pool') then
    raise exception using errcode = 'F1012', message = 'Only firms, pools and personal books are environments.';
  end if;
  if env_kind = 'person' then
    if new.source = 'self' then
      if finly.person_of_user(new.user_id) is distinct from new.env_entity_id then
        raise exception using errcode = 'F1008', message = 'Self access is only to one''s own personal books.';
      end if;
    elsif new.source <> 'owner_grant' or finly.actor_user_id() is null
          or finly.person_of_user(finly.actor_user_id()) is distinct from new.env_entity_id then
      raise exception using errcode = 'F1008',
        message = 'Only the owner of personal finances can grant access to them.';
    end if;
  elsif new.source in ('self', 'owner_grant') then
    raise exception using errcode = 'F1012', message = 'Self and owner grants apply only to personal books.';
  elsif new.source = 'ownership' and tg_op = 'INSERT'
        and not finly.is_owner_of(finly.person_of_user(new.user_id), new.env_entity_id) then
    raise exception using errcode = 'F1008', message = 'An ownership grant needs a recorded, undisputed owner.';
  end if;
  return new;
end
$$;

-- D-038: no implicit platform access to firms ----------------------------------------------------------------------

create or replace function finly.actor_env_ids(p_min_level text) returns uuid[]
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
  'Environments the actor may enter at read / write / manage level: own personal books and active explicit grants, minus explicit denies. Platform roles open no firm (D-038).';

update finly.permission set description = 'Platform administration (users, configuration, security). Opens no firm''s books (D-038)'
where key = 'admin.full';
update finly.role set description = 'Platform administration. No access to any firm''s books or anyone''s personal finances without an explicit grant (D-038, A4).'
where key = 'super_admin';

-- Entity role templates, always scoped to one firm or pool -------------------------------------------------------

insert into finly.role (key, name, description, is_system) values
  ('entity_owner', 'Entity owner', 'Assigned in one firm or pool to a recorded owner: full use of its books (D-038).', true),
  ('entity_admin', 'Entity administrator', 'Assigned in one firm or pool: runs its books and people, without ownership.', true);

insert into finly.role_permission (role_id, permission_id)
select r.id, p.id
from finly.role r
join finly.permission p on p.key = any (case r.key
  when 'entity_owner' then array['txn.view', 'txn.create', 'txn.submit', 'txn.approve', 'txn.reverse',
    'settlement.create', 'reconcile.perform', 'reconcile.approve', 'period.close', 'report.view', 'report.export',
    'share.message', 'share.photo', 'share.pdf', 'share.secure', 'attachment.upload', 'attachment.view', 'audit.view',
    'masters.manage', 'access.manage', 'approvals.manage']
  when 'entity_admin' then array['txn.view', 'txn.create', 'txn.submit', 'txn.approve', 'txn.reverse',
    'settlement.create', 'reconcile.perform', 'period.close', 'report.view', 'report.export', 'share.message',
    'share.photo', 'share.pdf', 'attachment.upload', 'attachment.view', 'audit.view', 'masters.manage']
end)
where r.key in ('entity_owner', 'entity_admin');

-- Existing recorded owners with accounts keep their firms, now explicitly (marked for review).
insert into finly.env_access (user_id, env_entity_id, level, source, reason)
select u.id, o.entity_id, 'manage', 'ownership', 'D-038 migration: recorded owner — review'
from finly.entity_ownership o
join finly.app_user u on u.person_entity_id = o.owner_entity_id
where o.valid_to is null and o.verification <> 'disputed'
  and not exists (select 1 from finly.env_access ea where ea.user_id = u.id and ea.env_entity_id = o.entity_id
                    and ea.source = 'ownership' and ea.revoked_at is null);
insert into finly.user_role (user_id, role_id, scope_entity_id, reason)
select u.id, (select id from finly.role where key = 'entity_owner'), o.entity_id,
       'D-038 migration: recorded owner — review'
from finly.entity_ownership o
join finly.app_user u on u.person_entity_id = o.owner_entity_id
where o.valid_to is null and o.verification <> 'disputed'
on conflict do nothing;

-- Books provisioned by the database ---------------------------------------------------------------------------

create function finly.provision_books(p_entity uuid, p_opening date) returns void
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  k text;
  m date;
begin
  select kind into k from finly.entity where id = p_entity;
  if k is null or k not in ('firm', 'person', 'pool') then
    raise exception using errcode = 'F1012', message = 'Only people, firms and pools keep books.';
  end if;
  -- Through the API, only for one's own books or books one manages.
  if finly.actor_user_id() is not null and p_entity is distinct from finly.actor_person_id()
     and not (p_entity = any (finly.actor_env_ids('manage'))) then
    raise exception using errcode = 'F1008', message = 'You cannot set up these books.';
  end if;
  -- Once only: an existing chart means the books are set up, and their start date never moves.
  if exists (select 1 from finly.ledger_account where entity_id = p_entity) then
    return;
  end if;
  if p_opening is null or p_opening > current_date or p_opening < date '2000-01-01' then
    raise exception using errcode = 'F1007', message = 'Choose an opening date on or before today.';
  end if;
  insert into finly.ledger_account (entity_id, code, name, class, role, requires_location, requires_counterparty,
    requires_category, is_system)
  select p_entity, code, name, class, role, requires_location, requires_counterparty, requires_category, true
  from finly.coa_template_account where entity_kind = k;
  if not exists (select 1 from finly.fund where entity_id = p_entity and is_default) then
    insert into finly.fund (entity_id, key, name, kind_id, is_default, created_by)
    values (p_entity, case k when 'person' then 'personal' else 'operating' end,
            case k when 'person' then 'Personal' else 'Operating' end,
            (select id from finly.lookup_value where list_key = 'fund_kind' and key = 'general'), true,
            finly.actor_user_id());
  end if;
  m := date_trunc('month', p_opening)::date;
  while m <= date_trunc('month', current_date)::date loop
    insert into finly.accounting_period (entity_id, period_start, period_end)
    values (p_entity, m, (m + interval '1 month - 1 day')::date)
    on conflict do nothing;
    m := (m + interval '1 month')::date;
  end loop;
end
$$;
comment on function finly.provision_books(uuid, date) is
  'Sets up books once: chart of accounts from the template of the entity''s kind, a default fund, and monthly periods from the opening month to this month. Through the API only for one''s own or managed books.';

create function finly.ensure_periods(p_entity uuid, p_date date) returns void
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  first_start date;
  last_start date;
  m date;
begin
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
  'Opens the monthly periods after the latest one up to the month of p_date (never before the books start, never more than a year ahead). Closed periods stay closed.';

revoke all on function finly.provision_books(uuid, date) from public;
revoke all on function finly.ensure_periods(uuid, date) from public;
grant execute on function finly.provision_books(uuid, date) to finly_auth, finly_api;
grant execute on function finly.ensure_periods(uuid, date) to finly_ledger;
