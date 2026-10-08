-- 0004 money structure: chart of accounts, funds, money locations and their owner / access / holder facts, holds.
-- Design: docs/database/03-schema.md "Money structure"; ACCOUNTING-ENGINE.md §3, §6; owner F5.
-- Data impact: new empty tables. Recovery: forward fix.

set local role finly_owner;

create table finly.coa_template_account (
  id uuid primary key default finly.uuid_v7(),
  entity_kind text not null check (entity_kind in ('firm', 'person', 'pool')),
  code text not null check (code ~ '^[0-9]{4}$'),
  name text not null check (length(name) between 1 and 80),
  class text not null check (class in (
    'asset', 'contra_asset', 'liability', 'equity', 'drawings', 'revenue', 'expense', 'cogs')),
  role text,
  requires_location boolean not null,
  requires_counterparty boolean not null,
  requires_category boolean not null,
  sort_order int not null default 0,
  unique (entity_kind, code)
);
comment on table finly.coa_template_account is
  'Chart-of-accounts templates per entity kind; seeded from backend/src/domain/ledger/coa.ts (a test keeps them equal).';

create table finly.ledger_account (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null references finly.entity (id),
  code text not null check (code ~ '^[0-9]{4}$'),
  name text not null check (length(name) between 1 and 80),
  class text not null check (class in (
    'asset', 'contra_asset', 'liability', 'equity', 'drawings', 'revenue', 'expense', 'cogs')),
  normal_side finly.side not null generated always as (
    case when class in ('asset', 'drawings', 'expense', 'cogs') then 'Dr' else 'Cr' end) stored,
  role text check (role in (
    'cash', 'bank', 'wallet', 'interentity_receivable', 'advances_given', 'loans_given', 'customer_receivable',
    'investment_in_firms', 'cash_in_transit', 'suspense', 'interentity_payable', 'supplier_payable', 'loans_taken',
    'advances_received', 'owner_capital', 'owner_drawings', 'opening_balance_equity', 'retained_earnings', 'revenue',
    'expense')),
  parent_id uuid,
  requires_location boolean not null default false,
  requires_counterparty boolean not null default false,
  requires_category boolean not null default false,
  is_system boolean not null default false,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (entity_id, code),
  unique (id, entity_id),
  foreign key (parent_id, entity_id) references finly.ledger_account (id, entity_id),
  check (parent_id is null or parent_id <> id),
  check (role is null or (role in ('revenue', 'expense')) = requires_category),
  check (not requires_location or role in ('cash', 'bank', 'wallet'))
);
comment on table finly.ledger_account is
  'Each entity''s chart of accounts. Renames are labels over stable ids; never deleted once referenced; inactive accounts take no new lines.';
comment on column finly.ledger_account.role is 'Engine role; one account per role per entity, except revenue and expense (one per category code).';
create unique index ledger_account_role_key on finly.ledger_account (entity_id, role)
  where role is not null and role not in ('revenue', 'expense');
create index ledger_account_change_xid_idx on finly.ledger_account (change_xid);

create table finly.fund (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null references finly.entity (id),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  name text not null check (length(name) between 1 and 80),
  kind_id uuid not null,
  kind_list text not null generated always as ('fund_kind') stored,
  is_default boolean not null default false,
  confidentiality_level_id uuid references finly.confidentiality_level (id),
  controller_entity_id uuid references finly.entity (id),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (id, entity_id),
  unique (entity_id, key),
  foreign key (kind_list, kind_id) references finly.lookup_value (list_key, id),
  check (not (is_default and status <> 'active'))
);
comment on table finly.fund is 'Funds (Hissa) of one entity: operating, owner, reserve, travel… Exactly one default per entity.';
create unique index fund_one_default on finly.fund (entity_id) where is_default;
create index fund_change_xid_idx on finly.fund (change_xid);

create table finly.location (
  id uuid primary key default finly.uuid_v7(),
  name text not null check (length(name) between 1 and 80),
  kind text not null check (kind in ('cash', 'bank', 'wallet')),
  type_id uuid not null,
  type_list text not null generated always as ('location_type') stored,
  custody_person_id uuid,
  person_kind text not null generated always as ('person') stored,
  managed_in_env_id uuid not null references finly.entity (id),
  confidentiality_level_id uuid references finly.confidentiality_level (id),
  disclosure text not null default 'name' check (disclosure in ('name', 'generic', 'hidden', 'owner_only')),
  negative_policy text not null default 'forbid' check (negative_policy in ('forbid', 'allow', 'approval')),
  overdraft_limit_enc finly.ciphertext,
  handover_confirmation text not null default 'inherit' check (handover_confirmation in ('inherit', 'required', 'off')),
  key_version int,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (type_list, type_id) references finly.lookup_value (list_key, id),
  foreign key (custody_person_id, person_kind) references finly.entity (id, kind),
  check (custody_person_id is null or kind = 'cash'),
  check (overdraft_limit_enc is null or (key_version is not null and negative_policy <> 'forbid'))
);
comment on table finly.location is
  'Money locations — the user-facing "Account / Khata": Tijori, Savan Bank, Office drawer, cash with a person. Ownership of the money is in the ledger, not here.';
comment on column finly.location.custody_person_id is 'Set for the "cash with <person>" location of that person (at most one per person).';
create unique index location_custody_person_key on finly.location (custody_person_id) where custody_person_id is not null;
create index location_managed_in_idx on finly.location (managed_in_env_id);
create index location_change_xid_idx on finly.location (change_xid);

create table finly.bank_account_detail (
  location_id uuid primary key references finly.location (id),
  bank_name text check (length(bank_name) <= 80),
  branch text check (length(branch) <= 80),
  ifsc text check (ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  account_holder text check (length(account_holder) <= 120),
  account_number_enc finly.ciphertext,
  account_number_last4 text check (account_number_last4 ~ '^[0-9]{4}$'),
  account_number_bidx finly.keyed_hash,
  account_type text check (account_type in ('savings', 'current', 'overdraft', 'cash_credit', 'wallet', 'upi', 'other')),
  key_version int,
  version int not null default 1,
  check ((account_number_enc is null) = (account_number_bidx is null)),
  check (account_number_enc is null or key_version is not null)
);
comment on table finly.bank_account_detail is 'Bank details of a bank or wallet location. The account number is encrypted; only the last four digits are plain.';
create unique index bank_account_number_key on finly.bank_account_detail (account_number_bidx)
  where account_number_bidx is not null;

create table finly.location_ownership (
  id uuid primary key default finly.uuid_v7(),
  location_id uuid not null references finly.location (id),
  owner_entity_id uuid references finly.entity (id),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  set_by uuid references finly.app_user (id),
  reason text,
  change_xid xid8 not null default pg_current_xact_id(),
  check (valid_to is null or valid_to > valid_from)
);
comment on table finly.location_ownership is 'Who owns the location (not the money in it), over time. Owner may be null: unowned.';
create unique index location_ownership_current on finly.location_ownership (location_id) where valid_to is null;

create table finly.location_access (
  id uuid primary key default finly.uuid_v7(),
  location_id uuid not null references finly.location (id),
  person_entity_id uuid not null,
  person_kind text not null generated always as ('person') stored,
  change_id uuid not null,
  change_kind text not null check (change_kind in ('initial', 'add', 'replace', 'revoke')),
  granted_at timestamptz not null default now(),
  granted_by uuid references finly.app_user (id),
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  revoke_change_id uuid,
  reason text,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (person_entity_id, person_kind) references finly.entity (id, kind),
  check ((revoked_at is null) = (revoke_change_id is null))
);
comment on table finly.location_access is
  'Who may access a location, over time. Add keeps existing access; Replace ends one person''s access and starts another''s under one change id (RULEBOOK-03 §14).';
create unique index location_access_current on finly.location_access (location_id, person_entity_id)
  where revoked_at is null;
create index location_access_person_idx on finly.location_access (person_entity_id) where revoked_at is null;

create table finly.location_holder (
  id uuid primary key default finly.uuid_v7(),
  location_id uuid not null references finly.location (id),
  person_entity_id uuid,
  person_kind text not null generated always as ('person') stored,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  set_by uuid references finly.app_user (id),
  reason text,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (person_entity_id, person_kind) references finly.entity (id, kind),
  check (valid_to is null or valid_to > valid_from)
);
comment on table finly.location_holder is
  'Who holds the key / control of a location, over time. person_entity_id null = unassigned. Changing the holder never changes access.';
create unique index location_holder_current on finly.location_holder (location_id) where valid_to is null;

-- History rows change only by being ended.
create function finly.tg_history_end_only() returns trigger
language plpgsql
as $$
declare
  -- person_kind is generated (not computed yet in a BEFORE trigger), so it is never compared.
  o jsonb := to_jsonb(old) - array['valid_to', 'revoked_at', 'revoked_by', 'revoke_change_id', 'change_xid', 'person_kind'];
  n jsonb := to_jsonb(new) - array['valid_to', 'revoked_at', 'revoked_by', 'revoke_change_id', 'change_xid', 'person_kind'];
begin
  if o <> n then
    raise exception using errcode = 'F1001', message = format('%s history rows can only be ended, not edited.', tg_table_name);
  end if;
  if (to_jsonb(old) ->> 'valid_to') is not null or (to_jsonb(old) ->> 'revoked_at') is not null then
    raise exception using errcode = 'F1001', message = format('%s: an ended row cannot change again.', tg_table_name);
  end if;
  new.change_xid := pg_current_xact_id();
  return new;
end
$$;
comment on function finly.tg_history_end_only() is 'Owner, access and holder history: rows are inserted, then ended once; never edited or deleted.';

create trigger location_ownership_end_only before update on finly.location_ownership
  for each row execute function finly.tg_history_end_only();
create trigger location_access_end_only before update on finly.location_access
  for each row execute function finly.tg_history_end_only();
create trigger location_holder_end_only before update on finly.location_holder
  for each row execute function finly.tg_history_end_only();
create trigger location_ownership_no_delete before delete on finly.location_ownership
  for each row execute function finly.tg_no_delete();
create trigger location_access_no_delete before delete on finly.location_access
  for each row execute function finly.tg_no_delete();
create trigger location_holder_no_delete before delete on finly.location_holder
  for each row execute function finly.tg_no_delete();

create table finly.balance_hold (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null,
  fund_id uuid not null,
  location_id uuid references finly.location (id),
  kind text not null check (kind in ('reservation', 'lock', 'pending_outgoing')),
  amount_enc finly.ciphertext not null,
  key_version int not null,
  reason text,
  txn_id uuid,
  hold_status text not null default 'active' check (hold_status in ('active', 'released', 'consumed')),
  created_by uuid references finly.app_user (id),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  released_by uuid references finly.app_user (id),
  version int not null default 1,
  foreign key (fund_id, entity_id) references finly.fund (id, entity_id),
  check ((kind = 'pending_outgoing') <= (txn_id is not null)),
  check ((hold_status = 'active') = (released_at is null))
);
comment on table finly.balance_hold is
  'Reserved, locked and pending-outgoing amounts (AC9). Available = current - active holds, computed by the engine under row locks.';
create index balance_hold_active_idx on finly.balance_hold (entity_id, fund_id, location_id) where hold_status = 'active';

-- Guards ------------------------------------------------------------------------------------------------------

create function finly.tg_books_entity_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if finly.entity_kind_of(new.entity_id) not in ('firm', 'person', 'pool') then
    raise exception using errcode = 'F1012', message = format('%s belongs to an entity with books (not a party).', tg_table_name);
  end if;
  return new;
end
$$;
create trigger ledger_account_books before insert or update of entity_id on finly.ledger_account
  for each row execute function finly.tg_books_entity_guard();
create trigger fund_books before insert or update of entity_id on finly.fund
  for each row execute function finly.tg_books_entity_guard();

create function finly.tg_bank_detail_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if (select kind from finly.location where id = new.location_id) not in ('bank', 'wallet') then
    raise exception using errcode = 'F1012', message = 'Bank details belong to a bank or wallet location.';
  end if;
  return new;
end
$$;
create trigger bank_account_detail_guard before insert or update on finly.bank_account_detail
  for each row execute function finly.tg_bank_detail_guard();

create trigger ledger_account_std before insert or update on finly.ledger_account for each row execute function finly.tg_std();
create trigger fund_std before insert or update on finly.fund for each row execute function finly.tg_std();
create trigger location_std before insert or update on finly.location for each row execute function finly.tg_std();
create trigger bank_account_detail_version before update on finly.bank_account_detail
  for each row execute function finly.tg_version();
create trigger balance_hold_version before update on finly.balance_hold for each row execute function finly.tg_version();
create trigger ledger_account_no_delete before delete on finly.ledger_account for each row execute function finly.tg_no_delete();
create trigger fund_no_delete before delete on finly.fund for each row execute function finly.tg_no_delete();
create trigger location_no_delete before delete on finly.location for each row execute function finly.tg_no_delete();
create trigger balance_hold_no_delete before delete on finly.balance_hold for each row execute function finly.tg_no_delete();
