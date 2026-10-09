-- 0010 owner decisions of 2026-10-09 (gate response 03, add-on 12):
--   Q1  entries in someone else's personal books wait for that person's acknowledgement by default (D-029);
--   Q3  accounts are activated by the person with a one-time credential; support is consented and time-limited (D-030);
--   online only: no offline queue, so the offline review table and client reference go (D-031).
-- Data impact: new tables; drops sync_review and txn.client_ref (never used in production: nothing is deployed yet).
-- Recovery: forward fix.

set local role finly_owner;

-- Q1: the receiving person's preference ---------------------------------------------------------------------------

create table finly.personal_book_setting (
  entity_id uuid primary key,
  person_kind text not null generated always as ('person') stored,
  incoming_entries text not null default 'acknowledge' check (incoming_entries in ('acknowledge', 'immediate')),
  updated_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  version int not null default 1,
  foreign key (entity_id, person_kind) references finly.entity (id, kind)
);
comment on table finly.personal_book_setting is
  'Settings of a person''s own books. incoming_entries: acknowledge (default, D-029) or immediate with notification. Only that person may change it.';
comment on column finly.personal_book_setting.incoming_entries is
  'acknowledge: entries others make in these books wait for this person; immediate: they post at once and the person is notified';

create function finly.tg_personal_book_setting_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  -- Only the person may set their own preference; the giver can never override it (Q1).
  if finly.actor_user_id() is null or finly.person_of_user(finly.actor_user_id()) is distinct from new.entity_id then
    raise exception using errcode = 'F1008', message = 'Only the owner of these books can change how entries into them are accepted.';
  end if;
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  new.updated_by := finly.actor_user_id();
  new.updated_at := now();
  return new;
end
$$;
create trigger personal_book_setting_guard before insert or update on finly.personal_book_setting
  for each row execute function finly.tg_personal_book_setting_guard();
create trigger personal_book_setting_no_delete before delete on finly.personal_book_setting
  for each row execute function finly.tg_no_delete();

-- Q1: a pending state and one acknowledgement per affected person ---------------------------------------------------

alter table finly.txn drop constraint txn_status_check;
alter table finly.txn add constraint txn_status_check check (status in (
  'draft', 'pending_approval', 'approved', 'pending_acknowledgement', 'posted', 'rejected', 'failed', 'cancelled',
  'reversed', 'corrected'));

insert into finly.txn_status_transition (from_status, to_status) values
  ('draft', 'pending_acknowledgement'), ('approved', 'pending_acknowledgement'),
  ('pending_acknowledgement', 'posted'), ('pending_acknowledgement', 'rejected'),
  ('pending_acknowledgement', 'cancelled'), ('pending_acknowledgement', 'failed');

create table finly.txn_acknowledgement (
  txn_id uuid not null references finly.txn (id),
  entity_id uuid not null,
  person_kind text not null generated always as ('person') stored,
  ack_status text not null default 'pending' check (ack_status in ('pending', 'acknowledged', 'rejected', 'withdrawn')),
  requested_at timestamptz not null default now(),
  decided_by uuid references finly.app_user (id),
  decided_at timestamptz,
  note text check (length(note) <= 500),
  version int not null default 1,
  primary key (txn_id, entity_id),
  foreign key (entity_id, person_kind) references finly.entity (id, kind),
  check ((ack_status in ('acknowledged', 'rejected')) = (decided_by is not null and decided_at is not null))
);
comment on table finly.txn_acknowledgement is
  'One acknowledgement per person whose personal books an event would change (D-029). While any is pending the event cannot post; on acknowledgement every effect posts atomically.';

create function finly.tg_txn_acknowledgement_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  event_status text;
begin
  if tg_op = 'INSERT' then
    select status into event_status from finly.txn where id = new.txn_id;
    if new.ack_status <> 'pending'
       or event_status not in ('draft', 'pending_approval', 'approved', 'pending_acknowledgement') then
      raise exception using errcode = 'F1007', message = 'An acknowledgement starts as pending, before the entry posts.';
    end if;
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.ack_status <> 'pending' then
      raise exception using errcode = 'F1007', message = 'This entry has already been answered.';
    end if;
    if (new.txn_id, new.entity_id, new.requested_at) is distinct from (old.txn_id, old.entity_id, old.requested_at) then
      raise exception using errcode = 'F1001', message = 'An acknowledgement request cannot be re-pointed.';
    end if;
    -- Only the person whose books change may accept or reject; a withdrawal comes from the posting service.
    if new.ack_status in ('acknowledged', 'rejected')
       and (finly.person_of_user(new.decided_by) is distinct from new.entity_id
            or new.decided_by is distinct from finly.actor_user_id()) then
      raise exception using errcode = 'F1008', message = 'Only the owner of these books can accept or reject this entry.';
    end if;
    new.version := old.version + 1;
  end if;
  return new;
end
$$;
create trigger txn_acknowledgement_guard before insert or update on finly.txn_acknowledgement
  for each row execute function finly.tg_txn_acknowledgement_guard();
create trigger txn_acknowledgement_no_delete before delete on finly.txn_acknowledgement
  for each row execute function finly.tg_no_delete();
create index txn_acknowledgement_inbox_idx on finly.txn_acknowledgement (entity_id) where ack_status = 'pending';

create function finly.tg_txn_ack_posting_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if new.status = 'posted' and exists (select 1 from finly.txn_acknowledgement
                                       where txn_id = new.id and ack_status <> 'acknowledged') then
    raise exception using errcode = 'F1007',
      message = 'This entry is waiting for acknowledgement and cannot be posted yet.';
  end if;
  return null;
end
$$;
create constraint trigger txn_ack_posting_check after insert or update of status on finly.txn
  deferrable initially deferred
  for each row execute function finly.tg_txn_ack_posting_check();

-- The acknowledgement table replaces the per-participation columns.
alter table finly.txn_entity drop column ack_status, drop column ack_by, drop column ack_at, drop column ack_note;
create or replace function finly.tg_txn_child_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  parent_status text;
begin
  select status into parent_status from finly.txn
  where id = case when tg_op = 'DELETE' then old.txn_id else new.txn_id end;
  if tg_table_name = 'txn_leg' and tg_op <> 'DELETE' then
    -- Nested so that NEW.fund_id is read only for legs (txn_entity rows have no such field).
    if new.fund_id is null and finly.entity_kind_of(new.entity_id) <> 'party' then
      raise exception using errcode = 'F1006', message = 'Say which fund this money belongs to.';
    end if;
  end if;
  if tg_table_name = 'txn_entity' and tg_op = 'UPDATE' then
    -- Only the value date follows the draft's date (cascade); participants never change otherwise.
    if (to_jsonb(new) - 'value_date') is distinct from (to_jsonb(old) - 'value_date')
       or (new.value_date is distinct from old.value_date and parent_status <> 'draft') then
      raise exception using errcode = 'F1010', message = 'Participants of a submitted transaction cannot change.';
    end if;
    return new;
  end if;
  if tg_table_name = 'txn_entity' and tg_op = 'INSERT' and parent_status in ('draft', 'approved', 'failed') then
    return new;
  end if;
  if parent_status <> 'draft'
     and not (tg_op = 'UPDATE' and finly.is_key_rotation(to_jsonb(old), to_jsonb(new))) then
    raise exception using errcode = 'F1010',
      message = format('%s of a submitted transaction cannot change.', tg_table_name);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$$;

-- Q3: activation by the person, consented support -----------------------------------------------------------------

alter table finly.app_user add column activated_at timestamptz;
alter table finly.app_user add constraint app_user_activation_check
  check (status not in ('active', 'suspended') or activated_at is not null);
comment on column finly.app_user.activated_at is
  'When the person activated the account on their own device (D-030); an administrator can never set it.';

create table finly.account_activation (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  code_hash finly.keyed_hash not null unique,
  issued_by uuid not null references finly.app_user (id),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_device_id uuid references finly.device (id),
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  check (expires_at > issued_at and expires_at <= issued_at + interval '7 days'),
  check (num_nonnulls(used_at, revoked_at) <= 1),
  check ((used_at is null) = (used_device_id is null)),
  check (issued_by <> user_id)
);
comment on table finly.account_activation is
  'One-time activation credentials (D-030): stored only as a keyed hash, expire, die on first use or revocation. The person sets their own password and M-PIN on their own device.';
create unique index account_activation_live on finly.account_activation (user_id)
  where used_at is null and revoked_at is null;

create function finly.tg_account_activation_guard() returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array['used_at', 'used_device_id', 'revoked_at', 'revoked_by'])
     is distinct from (to_jsonb(old) - array['used_at', 'used_device_id', 'revoked_at', 'revoked_by'])
     or old.used_at is not null or old.revoked_at is not null then
    raise exception using errcode = 'F1001', message = 'An activation code can only be used or revoked, once.';
  end if;
  if new.used_at is not null then
    -- The server's clock decides, never a time supplied by the caller.
    if clock_timestamp() > old.expires_at then
      raise exception using errcode = 'F1007', message = 'This activation code has expired.';
    end if;
    new.used_at := clock_timestamp();
  end if;
  if new.revoked_at is not null then
    new.revoked_at := clock_timestamp();
  end if;
  return new;
end
$$;
create trigger account_activation_guard before update on finly.account_activation
  for each row execute function finly.tg_account_activation_guard();
create trigger account_activation_no_delete before delete on finly.account_activation
  for each row execute function finly.tg_no_delete();

create table finly.support_session (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  helper_user_id uuid not null references finly.app_user (id),
  scope text not null check (scope in ('account_settings', 'view_books')),
  reason text not null check (length(reason) between 10 and 500),
  requested_at timestamptz not null default now(),
  session_status text not null default 'requested' check (session_status in (
    'requested', 'active', 'declined', 'ended', 'expired')),
  consented_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  ended_at timestamptz,
  env_access_id uuid references finly.env_access (id),
  version int not null default 1,
  check (user_id <> helper_user_id),
  check ((session_status in ('active', 'ended', 'expired')) = (consented_at is not null)),
  check (ends_at is null or (starts_at is not null and ends_at > starts_at and ends_at <= starts_at + interval '4 hours')),
  check (not (scope = 'view_books' and session_status = 'active' and env_access_id is null))
);
comment on table finly.support_session is
  'Help with someone''s account (D-030): requested by the helper, consented by the person, time-limited (max 4 hours), audited. Book access, if any, is a temporary owner grant the person gives.';
create index support_session_user_idx on finly.support_session (user_id, requested_at desc);

create function finly.tg_support_session_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.session_status <> 'requested' or new.helper_user_id is distinct from finly.actor_user_id() then
      raise exception using errcode = 'F1008', message = 'Support is requested by the helper, in their own name.';
    end if;
    return new;
  end if;
  if (new.user_id, new.helper_user_id, new.scope, new.reason, new.requested_at)
     is distinct from (old.user_id, old.helper_user_id, old.scope, old.reason, old.requested_at) then
    raise exception using errcode = 'F1001', message = 'A support request cannot be changed; make a new one.';
  end if;
  -- Consent (or refusal) comes only from the person being helped.
  if old.session_status = 'requested' and new.session_status in ('active', 'declined')
     and finly.actor_user_id() is distinct from new.user_id then
    raise exception using errcode = 'F1008', message = 'Only the account''s owner can allow support access.';
  end if;
  if old.session_status in ('declined', 'ended', 'expired') then
    raise exception using errcode = 'F1007', message = 'This support session is closed.';
  end if;
  -- What the person agreed to (when, how long, which access) is fixed once given; it can only end early.
  if old.session_status = 'active'
     and (new.consented_at, new.starts_at, new.ends_at, new.env_access_id)
         is distinct from (old.consented_at, old.starts_at, old.ends_at, old.env_access_id) then
    raise exception using errcode = 'F1001', message = 'Support access cannot be extended or changed; ask again.';
  end if;
  new.version := old.version + 1;
  return new;
end
$$;
create trigger support_session_guard before insert or update on finly.support_session
  for each row execute function finly.tg_support_session_guard();
create trigger support_session_no_delete before delete on finly.support_session
  for each row execute function finly.tg_no_delete();

-- Online only: no offline queue ---------------------------------------------------------------------------------------

drop table finly.sync_review;
drop index finly.txn_client_ref_key;
alter table finly.txn drop column client_ref;

-- Row-level security and privileges for the new tables ---------------------------------------------------------------

alter table finly.personal_book_setting enable row level security;
alter table finly.txn_acknowledgement enable row level security;
alter table finly.account_activation enable row level security;
alter table finly.support_session enable row level security;

grant select, insert, update on finly.personal_book_setting to finly_api;
grant select on finly.personal_book_setting to finly_ledger, finly_system;
create policy personal_book_setting_own on finly.personal_book_setting to finly_api
  using (entity_id = finly.actor_person_id()) with check (entity_id = finly.actor_person_id());
create policy personal_book_setting_svc on finly.personal_book_setting for select to finly_ledger, finly_system
  using (true);

grant select, update on finly.txn_acknowledgement to finly_api;
grant select, insert, update on finly.txn_acknowledgement to finly_ledger;
grant select on finly.txn_acknowledgement to finly_system;
create policy txn_acknowledgement_api_read on finly.txn_acknowledgement for select to finly_api
  using (entity_id = finly.actor_person_id()
         or exists (select 1 from finly.txn t where t.id = txn_acknowledgement.txn_id));
create policy txn_acknowledgement_api_decide on finly.txn_acknowledgement for update to finly_api
  using (entity_id = finly.actor_person_id())
  with check (entity_id = finly.actor_person_id() and ack_status in ('acknowledged', 'rejected'));
create policy txn_acknowledgement_ledger on finly.txn_acknowledgement to finly_ledger
  using (finly.actor_user_id() is not null) with check (finly.actor_user_id() is not null);
create policy txn_acknowledgement_system on finly.txn_acknowledgement for select to finly_system using (true);

grant select, insert, update on finly.account_activation to finly_auth;
create policy account_activation_auth on finly.account_activation to finly_auth using (true) with check (true);

grant select, insert, update on finly.support_session to finly_api;
grant select on finly.support_session to finly_system;
create policy support_session_api on finly.support_session to finly_api
  using (user_id = finly.actor_user_id() or helper_user_id = finly.actor_user_id()
         or finly.actor_has_permission('users.manage'))
  with check (user_id = finly.actor_user_id() or helper_user_id = finly.actor_user_id());
create policy support_session_system on finly.support_session for select to finly_system using (true);

-- Comments: online only (D-031), and examples that name no real person, firm or place (everything is data).
comment on table finly.idempotency_record is
  'Exactly-once mutations: a request retried after a network failure carries the same key and posts once. Stores no response body: a replay re-reads the result under current permissions.';
comment on table finly.label_override is 'Custom display labels and translations of built-in terms. Never change behaviour (P8).';
comment on table finly.location is
  'Money locations — the user-facing "Account / Khata": a vault, a bank account, an office drawer, cash with a person. Ownership of the money is in the ledger, not here.';
comment on table finly.txn_note is 'Private notes on an event, one environment at a time: a note in one environment is never shown to someone who sees only another environment''s side.';
comment on column finly.location.name is 'Display label, chosen by the user; renamable, never identity';
comment on column finly.entity.display_name is 'Display label, chosen by the user; editable, never identity';
