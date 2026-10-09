-- 0014 access model step 1 (docs/security/access-model.md §3; ADDON-17, ADDON-18; D-038):
--   * ownership and partnership become two independent, effective-dated records (entity_ownership,
--     entity_partnership) instead of one overloaded engine_role on entity_membership;
--   * legacy owner rows become ownership records with share `unspecified` and verification `unverified` (marked for
--     review, ADDON-18 §21); legacy partner rows become partnerships only — a partner is no longer an owner;
--   * what remains (staff, other) is entity_affiliation (the old table, renamed; migrated rows end-dated);
--   * one definition of "owner": finly.is_owner_of(person, entity, date), used by actor_owns_entity, the access-rule
--     guard and the posting engine;
--   * entity hierarchy: entity_relationship (structural parent–child kinds and non-structural links), one structural
--     parent per child, cycles refused. Hierarchy grants (who sees what across a link) come with roles in step 2.
-- Data impact: moves relationship rows as described; nothing is deleted. Recovery: forward fix.

set local role finly_owner;

-- Configurable lists ------------------------------------------------------------------------------------------------

alter table finly.lookup_value drop constraint lookup_value_list_key_check;
alter table finly.lookup_value add constraint lookup_value_list_key_check check (list_key in (
  'location_type', 'payment_method', 'fund_kind', 'event_kind', 'document_kind', 'worker_type', 'relation_label',
  'ownership_type', 'partnership_type'));
insert into finly.lookup_value (list_key, key, label, sort_order) values
  ('ownership_type', 'unspecified', 'Not yet specified', 0), ('ownership_type', 'individual', 'Individual', 10),
  ('ownership_type', 'corporate', 'Corporate', 20), ('ownership_type', 'beneficial', 'Beneficial', 30),
  ('ownership_type', 'nominee', 'Nominee', 40), ('ownership_type', 'other', 'Other', 90),
  ('partnership_type', 'unspecified', 'Not yet specified', 0), ('partnership_type', 'equity', 'Equity partner', 10),
  ('partnership_type', 'working', 'Working partner', 20), ('partnership_type', 'sleeping', 'Sleeping partner', 30),
  ('partnership_type', 'non_equity', 'Non-equity partner', 40), ('partnership_type', 'other', 'Other', 90);

-- Ownership ---------------------------------------------------------------------------------------------------------

create table finly.entity_ownership (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null references finly.entity (id),
  owner_entity_id uuid not null references finly.entity (id),
  share_basis text not null default 'unspecified' check (share_basis in ('percent', 'units', 'unspecified')),
  share_bp int check (share_bp between 1 and 10000),
  share_units numeric(20, 4) check (share_units > 0),
  ownership_type_id uuid not null,
  ownership_type_list text not null generated always as ('ownership_type') stored,
  verification text not null default 'unverified'
    check (verification in ('unverified', 'pending', 'verified', 'disputed')),
  valid_from date not null default current_date,
  valid_to date,
  recorded_by uuid references finly.app_user (id),
  approved_by uuid references finly.app_user (id),
  reason text check (length(reason) <= 500),
  created_at timestamptz not null default now(),
  version int not null default 1,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (ownership_type_list, ownership_type_id) references finly.lookup_value (list_key, id),
  check (entity_id <> owner_entity_id),
  check ((share_basis = 'percent') = (share_bp is not null)),
  check ((share_basis = 'units') = (share_units is not null)),
  check (valid_to is null or valid_to >= valid_from)
);
comment on table finly.entity_ownership is
  'Who owns a firm or pool, and how much: one row per owner and period. Ownership is a business fact, never an access right by itself (ADDON-18 §1.1, §4).';
comment on column finly.entity_ownership.share_bp is 'Share in basis points (1/100 of a percent; 10000 = 100 %) when share_basis = percent';
comment on column finly.entity_ownership.share_units is 'Number of units or shares when share_basis = units';
comment on column finly.entity_ownership.verification is
  'unverified (e.g. migrated, needs review), pending, verified, disputed — a disputed record does not count as ownership';
create index entity_ownership_entity_idx on finly.entity_ownership (entity_id) where valid_to is null;
create index entity_ownership_owner_idx on finly.entity_ownership (owner_entity_id) where valid_to is null;

-- Partnership -------------------------------------------------------------------------------------------------------

create table finly.entity_partnership (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null references finly.entity (id),
  partner_entity_id uuid not null references finly.entity (id),
  partnership_type_id uuid not null,
  partnership_type_list text not null generated always as ('partnership_type') stored,
  responsibilities text check (length(responsibilities) <= 500),
  profit_share_bp int check (profit_share_bp between 0 and 10000),
  valid_from date not null default current_date,
  valid_to date,
  recorded_by uuid references finly.app_user (id),
  approved_by uuid references finly.app_user (id),
  reason text check (length(reason) <= 500),
  created_at timestamptz not null default now(),
  version int not null default 1,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (partnership_type_list, partnership_type_id) references finly.lookup_value (list_key, id),
  check (entity_id <> partner_entity_id),
  check (valid_to is null or valid_to >= valid_from)
);
comment on table finly.entity_partnership is
  'In what capacity someone is a partner of a firm or pool, over time. Independent of ownership: a partner need not own, an owner need not be a partner (ADDON-18 §1.2).';
create index entity_partnership_entity_idx on finly.entity_partnership (entity_id) where valid_to is null;
create index entity_partnership_partner_idx on finly.entity_partnership (partner_entity_id) where valid_to is null;

-- Both relationship tables: who may appear, history kept, no overlapping periods for the same pair.
create function finly.tg_relationship_record_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  -- Read through jsonb: each table has only one of the two columns, and NEW.<missing> would fail even untaken.
  holder uuid := coalesce(to_jsonb(new) ->> 'owner_entity_id', to_jsonb(new) ->> 'partner_entity_id')::uuid;
  -- Generated columns are still NULL in a BEFORE trigger, so they are left out of the comparison too.
  frozen text[] := array['valid_to', 'verification', 'approved_by', 'version', 'change_xid', 'ownership_type_list',
    'partnership_type_list'];
begin
  if finly.entity_kind_of(new.entity_id) not in ('firm', 'pool') then
    raise exception using errcode = 'F1012', message = 'Only a firm or a pool has owners and partners.';
  end if;
  if tg_op = 'UPDATE' then
    -- History is end-dated, never rewritten: only the end, the verification and its approval may change.
    if (to_jsonb(new) - frozen) is distinct from (to_jsonb(old) - frozen)
       or (old.valid_to is not null and new.valid_to is distinct from old.valid_to) then
      raise exception using errcode = 'F1001', message = 'This record is history: end it and record a new one.';
    end if;
    new.version := old.version + 1;
    new.change_xid := pg_current_xact_id();
    return new;
  end if;
  if exists (
    select 1 from finly.entity_ownership o
    where tg_table_name = 'entity_ownership' and o.entity_id = new.entity_id and o.owner_entity_id = holder
      and o.valid_from <= coalesce(new.valid_to, 'infinity'::date) and coalesce(o.valid_to, 'infinity'::date) >= new.valid_from
    union all
    select 1 from finly.entity_partnership p
    where tg_table_name = 'entity_partnership' and p.entity_id = new.entity_id and p.partner_entity_id = holder
      and p.valid_from <= coalesce(new.valid_to, 'infinity'::date) and coalesce(p.valid_to, 'infinity'::date) >= new.valid_from
  ) then
    raise exception using errcode = 'F1007', message = 'This relationship already exists for an overlapping period.';
  end if;
  return new;
end
$$;
create trigger entity_ownership_guard before insert or update on finly.entity_ownership
  for each row execute function finly.tg_relationship_record_guard();
create trigger entity_partnership_guard before insert or update on finly.entity_partnership
  for each row execute function finly.tg_relationship_record_guard();
create trigger entity_ownership_no_delete before delete on finly.entity_ownership
  for each row execute function finly.tg_no_delete();
create trigger entity_partnership_no_delete before delete on finly.entity_partnership
  for each row execute function finly.tg_no_delete();

-- Current percentage shares of an entity never exceed 100 % (checked at commit, so shares can be rearranged).
create function finly.tg_ownership_share_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if (select coalesce(sum(share_bp), 0) from finly.entity_ownership
      where entity_id = new.entity_id and valid_to is null and verification <> 'disputed') > 10000 then
    raise exception using errcode = 'F1007', message = 'The ownership shares add up to more than 100 %.';
  end if;
  return null;
end
$$;
create constraint trigger entity_ownership_share_check after insert or update on finly.entity_ownership
  deferrable initially deferred for each row execute function finly.tg_ownership_share_check();

-- The one definition of "owner": an ownership record valid on the date and not disputed. Partnership does not count.
create function finly.is_owner_of(p_person uuid, p_entity uuid, p_on date default current_date) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  select exists (
    select 1 from finly.entity_ownership o
    where o.entity_id = p_entity and o.owner_entity_id = p_person and o.verification <> 'disputed'
      and o.valid_from <= p_on and (o.valid_to is null or o.valid_to >= p_on))
$$;
comment on function finly.is_owner_of(uuid, uuid, date) is
  'True when the person holds a current, undisputed ownership record of the entity on the date. A business fact, not a permission.';

-- Migrate the overloaded rows, then keep the old table for the remaining relations ---------------------------------

insert into finly.entity_ownership (entity_id, owner_entity_id, ownership_type_id, valid_from, valid_to, recorded_by,
  reason, created_at)
select m.org_entity_id, m.member_entity_id,
       (select id from finly.lookup_value where list_key = 'ownership_type' and key = 'unspecified'),
       m.valid_from, m.valid_to, m.created_by,
       'Migrated from the former membership record (role owner); share and verification to be reviewed', m.created_at
from finly.entity_membership m where m.engine_role = 'owner';

insert into finly.entity_partnership (entity_id, partner_entity_id, partnership_type_id, valid_from, valid_to,
  recorded_by, reason, created_at)
select m.org_entity_id, m.member_entity_id,
       (select id from finly.lookup_value where list_key = 'partnership_type' and key = 'unspecified'),
       m.valid_from, m.valid_to, m.created_by,
       'Migrated from the former membership record (role partner); a partner is no longer treated as an owner', m.created_at
from finly.entity_membership m where m.engine_role = 'partner';

-- Check the migrated shares now: a later ALTER TABLE in this migration may not run with pending trigger events.
set constraints finly.entity_ownership_share_check immediate;

update finly.entity_membership
set valid_to = greatest(valid_from, current_date), end_reason = 'Moved to entity_ownership / entity_partnership (0014)'
where engine_role in ('owner', 'partner') and valid_to is null;

alter table finly.entity_membership rename to entity_affiliation;
alter index finly.entity_membership_active_key rename to entity_affiliation_active_key;
alter index finly.entity_membership_org_idx rename to entity_affiliation_org_idx;
alter index finly.entity_membership_member_idx rename to entity_affiliation_member_idx;
alter table finly.entity_affiliation add constraint entity_affiliation_kind_check
  check (engine_role in ('staff', 'other') or valid_to is not null) not valid;
comment on table finly.entity_affiliation is
  'Other relations of a person to a firm or pool (staff, other), over time. Ownership and partnership have their own tables (0014).';
comment on column finly.entity_affiliation.engine_role is
  'staff or other (owner and partner rows before 0014 are history: they were moved and end-dated)';

-- Functions that read ownership --------------------------------------------------------------------------------------

create or replace function finly.actor_owns_entity(p_entity uuid) returns boolean
language sql stable security definer set search_path = finly, pg_temp
as $$
  select p_entity = finly.actor_person_id() or finly.is_owner_of(finly.actor_person_id(), p_entity)
$$;
comment on function finly.actor_owns_entity(uuid) is
  'The actor is this person, or a current undisputed owner of this firm or pool (partners do not count, 0014). Used only to relax owner-only confidentiality, never as a permission.';

create or replace function finly.tg_access_rule_guard() returns trigger
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
       grantor_person = resource_owner or finly.is_owner_of(grantor_person, resource_owner)) then
    raise exception using errcode = 'F1008', message = 'Only an owner can open an owner-only fund or location to others.';
  end if;
  return new;
end
$$;

-- People connected to a visible firm stay visible to its readers (owners and partners as well as affiliations).
drop policy entity_api_read on finly.entity;
create policy entity_api_read on finly.entity for select to finly_api
  using (id = any ((select finly.actor_env_ids('read'))::uuid[])
         or managed_in_env_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or exists (select 1 from finly.entity_affiliation m where m.member_entity_id = entity.id)
         or exists (select 1 from finly.entity_ownership o where o.owner_entity_id = entity.id)
         or exists (select 1 from finly.entity_partnership p where p.partner_entity_id = entity.id));

-- Hierarchy ---------------------------------------------------------------------------------------------------------

create table finly.entity_relationship (
  id uuid primary key default finly.uuid_v7(),
  parent_entity_id uuid not null references finly.entity (id),
  child_entity_id uuid not null references finly.entity (id),
  kind text not null check (kind in ('branch', 'subsidiary', 'business_unit', 'joint_venture', 'reporting', 'management')),
  structural boolean not null generated always as (kind in ('branch', 'subsidiary', 'business_unit', 'joint_venture')) stored,
  valid_from date not null default current_date,
  valid_to date,
  created_by uuid references finly.app_user (id),
  approved_by uuid references finly.app_user (id),
  reason text check (length(reason) <= 500),
  created_at timestamptz not null default now(),
  version int not null default 1,
  change_xid xid8 not null default pg_current_xact_id(),
  check (parent_entity_id <> child_entity_id),
  check (valid_to is null or valid_to >= valid_from)
);
comment on table finly.entity_relationship is
  'Parent–child structure (branch, subsidiary, business unit, joint venture) and non-structural links (reporting, management). A link gives no access by itself: hierarchy grants do (ADDON-17 §3.4).';
create unique index entity_relationship_one_parent on finly.entity_relationship (child_entity_id)
  where structural and valid_to is null;
create unique index entity_relationship_active_key on finly.entity_relationship (parent_entity_id, child_entity_id, kind)
  where valid_to is null;
create index entity_relationship_parent_idx on finly.entity_relationship (parent_entity_id) where valid_to is null;

create function finly.tg_entity_relationship_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if finly.entity_kind_of(new.parent_entity_id) not in ('firm', 'pool')
     or finly.entity_kind_of(new.child_entity_id) not in ('firm', 'pool') then
    raise exception using errcode = 'F1012', message = 'Only firms and pools take part in the entity hierarchy.';
  end if;
  if tg_op = 'UPDATE' then
    if (to_jsonb(new) - array['valid_to', 'approved_by', 'version', 'change_xid', 'structural'])
       is distinct from (to_jsonb(old) - array['valid_to', 'approved_by', 'version', 'change_xid', 'structural'])
       or (old.valid_to is not null and new.valid_to is distinct from old.valid_to) then
      raise exception using errcode = 'F1001', message = 'A relationship is history: end it and record a new one.';
    end if;
    new.version := old.version + 1;
    new.change_xid := pg_current_xact_id();
    return new;
  end if;
  -- No cycle: the new parent must not already sit below the new child in the structural tree.
  -- Generated columns are not computed yet in a BEFORE trigger: derive "structural" from the kind here.
  if new.kind in ('branch', 'subsidiary', 'business_unit', 'joint_venture') and exists (
    with recursive up(id, depth) as (
      select new.parent_entity_id, 0
      union all
      select r.parent_entity_id, up.depth + 1 from finly.entity_relationship r
      join up on r.child_entity_id = up.id
      where r.structural and r.valid_to is null and up.depth < 64
    )
    select 1 from up where id = new.child_entity_id
  ) then
    raise exception using errcode = 'F1007', message = 'This would make an entity its own ancestor.';
  end if;
  return new;
end
$$;
create trigger entity_relationship_guard before insert or update on finly.entity_relationship
  for each row execute function finly.tg_entity_relationship_guard();
create trigger entity_relationship_no_delete before delete on finly.entity_relationship
  for each row execute function finly.tg_no_delete();

-- Row-level security and privileges ---------------------------------------------------------------------------------

alter table finly.entity_ownership enable row level security;
alter table finly.entity_partnership enable row level security;
alter table finly.entity_relationship enable row level security;

grant select, insert, update on finly.entity_ownership, finly.entity_partnership, finly.entity_relationship to finly_api;
grant select on finly.entity_ownership, finly.entity_partnership, finly.entity_relationship to finly_ledger, finly_system;

create policy entity_ownership_api_read on finly.entity_ownership for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[]) or owner_entity_id = (select finly.actor_person_id()));
create policy entity_ownership_api_insert on finly.entity_ownership for insert to finly_api
  with check (finly.actor_can_manage(entity_id) and recorded_by = finly.actor_user_id());
create policy entity_ownership_api_update on finly.entity_ownership for update to finly_api
  using (finly.actor_can_manage(entity_id)) with check (finly.actor_can_manage(entity_id));
create policy entity_partnership_api_read on finly.entity_partnership for select to finly_api
  using (entity_id = any ((select finly.actor_env_ids('read'))::uuid[]) or partner_entity_id = (select finly.actor_person_id()));
create policy entity_partnership_api_insert on finly.entity_partnership for insert to finly_api
  with check (finly.actor_can_manage(entity_id) and recorded_by = finly.actor_user_id());
create policy entity_partnership_api_update on finly.entity_partnership for update to finly_api
  using (finly.actor_can_manage(entity_id)) with check (finly.actor_can_manage(entity_id));
create policy entity_relationship_api_read on finly.entity_relationship for select to finly_api
  using (parent_entity_id = any ((select finly.actor_env_ids('read'))::uuid[])
         or child_entity_id = any ((select finly.actor_env_ids('read'))::uuid[]));
create policy entity_relationship_api_insert on finly.entity_relationship for insert to finly_api
  with check (finly.actor_can_manage(parent_entity_id) and finly.actor_can_manage(child_entity_id)
              and created_by = finly.actor_user_id());
create policy entity_relationship_api_update on finly.entity_relationship for update to finly_api
  using (finly.actor_can_manage(parent_entity_id)) with check (finly.actor_can_manage(parent_entity_id));
create policy entity_ownership_svc on finly.entity_ownership for select to finly_ledger, finly_system
  using (finly.actor_user_id() is not null or current_user = 'finly_system');
create policy entity_partnership_svc on finly.entity_partnership for select to finly_ledger, finly_system
  using (finly.actor_user_id() is not null or current_user = 'finly_system');
create policy entity_relationship_svc on finly.entity_relationship for select to finly_ledger, finly_system
  using (finly.actor_user_id() is not null or current_user = 'finly_system');

grant execute on function finly.is_owner_of(uuid, uuid, date) to finly_api, finly_ledger, finly_system;

alter policy entity_membership_api_read on finly.entity_affiliation rename to entity_affiliation_api_read;
alter policy entity_membership_api_insert on finly.entity_affiliation rename to entity_affiliation_api_insert;
alter policy entity_membership_api_update on finly.entity_affiliation rename to entity_affiliation_api_update;
alter policy entity_membership_api_delete on finly.entity_affiliation rename to entity_affiliation_api_delete;
alter policy entity_membership_ledger on finly.entity_affiliation rename to entity_affiliation_ledger;
alter trigger entity_membership_guard on finly.entity_affiliation rename to entity_affiliation_guard;
alter trigger entity_membership_no_delete on finly.entity_affiliation rename to entity_affiliation_no_delete;
