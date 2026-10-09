-- 0012 what the posting service needs (docs/architecture/operations.md, docs/database/06 §6.1–6.2):
--   * txn.intent_enc: the request an event was created from, encrypted and bound to the event's id. Approval,
--     acknowledgement and a resumed request re-plan from exactly what the user asked; it is frozen after submission
--     like every other submitted field, except for key rotation;
--   * draft -> failed: a posting refused under lock records its outcome on the draft (the user may edit and retry);
--   * outbox_event: transactional outbox for after-commit effects (push, data-changed nudges, verifier runs) —
--     written in the same transaction as the change, delivered by finly_system with idempotent consumers;
--   * finly_ledger may read entity_membership (owners of a firm, for the engine's owner checks).
-- Data impact: new nullable column, new table. Recovery: forward fix.

set local role finly_owner;

alter table finly.txn add column intent_enc finly.ciphertext;
alter table finly.txn add column key_version int;
alter table finly.txn add constraint txn_intent_key_check check ((intent_enc is null) = (key_version is null));
comment on column finly.txn.intent_enc is
  'The request this event was created from (AES-256-GCM, bound to txn.intent_enc:<id>). Re-planned under lock at posting; frozen after submission.';
comment on column finly.txn.key_version is 'Key version of intent_enc (rotation)';

-- Same guard as 0005, now letting the system role re-encrypt intent_enc of a submitted event (key rotation only).
create or replace function finly.tg_txn_guard() returns trigger
language plpgsql
set search_path = finly, pg_temp
as $$
declare
  -- Generated columns (search_tsv, payment_method_list) are not computed yet inside a BEFORE trigger: never compared.
  movable text[] := array['status', 'submitted_at', 'approved_at', 'posted_at', 'version', 'updated_at', 'change_xid',
    'search_tsv', 'payment_method_list'];
begin
  if new.status is distinct from old.status
     and not exists (select 1 from finly.txn_status_transition
                     where from_status = old.status and to_status = new.status) then
    raise exception using errcode = 'F1007',
      message = format('A transaction cannot go from %s to %s.', old.status, new.status);
  end if;
  if old.status <> 'draft'
     and (to_jsonb(new) - movable) is distinct from (to_jsonb(old) - movable)
     and not finly.is_key_rotation(to_jsonb(old) - movable, to_jsonb(new) - movable) then
    -- After submission only the lifecycle may move; what was submitted is what posts (J5, H15).
    raise exception using errcode = 'F1010', message = 'A submitted transaction cannot be edited; withdraw it to draft or correct it.';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  new.change_xid := pg_current_xact_id();
  return new;
end
$$;

insert into finly.txn_status_transition (from_status, to_status) values ('draft', 'failed');

-- Transactional outbox -------------------------------------------------------------------------------------------

create table finly.outbox_event (
  id bigint generated always as identity primary key,
  topic text not null check (topic ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  dedupe_key text not null check (length(dedupe_key) between 1 and 200),
  payload jsonb not null default '{}' check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2000),
  txn_id uuid references finly.txn (id),
  created_by uuid references finly.app_user (id),
  created_at timestamptz not null default now(),
  event_status text not null default 'pending' check (event_status in ('pending', 'processing', 'done', 'dead')),
  attempts smallint not null default 0 check (attempts between 0 and 20),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error_code text check (last_error_code ~ '^[a-z0-9_.:-]{1,80}$'),
  done_at timestamptz,
  unique (topic, dedupe_key),
  check ((event_status = 'done') = (done_at is not null)),
  check ((event_status = 'processing') = (locked_until is not null))
);
comment on table finly.outbox_event is
  'After-commit effects, written in the same transaction as the change (transactional outbox). Payloads hold ids only — never amounts, names or other confidential values. Delivered by finly_system; (topic, dedupe_key) makes redelivery harmless.';
create index outbox_event_due_idx on finly.outbox_event (available_at) where event_status = 'pending';
create index outbox_event_stuck_idx on finly.outbox_event (locked_until) where event_status = 'processing';
create index outbox_event_txn_idx on finly.outbox_event (txn_id) where txn_id is not null;

create function finly.tg_outbox_event_guard() returns trigger
language plpgsql
set search_path = finly, pg_temp
as $$
begin
  if (new.topic, new.dedupe_key, new.payload, new.txn_id, new.created_by, new.created_at)
     is distinct from (old.topic, old.dedupe_key, old.payload, old.txn_id, old.created_by, old.created_at) then
    raise exception using errcode = 'F1001', message = 'An outbox event cannot be changed, only delivered.';
  end if;
  if old.event_status = 'done'
     or (old.event_status, new.event_status) not in (
       ('pending', 'processing'), ('processing', 'done'), ('processing', 'pending'), ('processing', 'dead'),
       ('dead', 'pending'), ('pending', 'pending'), ('processing', 'processing')) then
    raise exception using errcode = 'F1007',
      message = format('An outbox event cannot go from %s to %s.', old.event_status, new.event_status);
  end if;
  return new;
end
$$;
create trigger outbox_event_guard before update on finly.outbox_event
  for each row execute function finly.tg_outbox_event_guard();

alter table finly.outbox_event enable row level security;
grant insert on finly.outbox_event to finly_ledger, finly_api;
grant select, update, delete on finly.outbox_event to finly_system;
create policy outbox_event_write on finly.outbox_event for insert to finly_ledger, finly_api
  with check (finly.actor_user_id() is not null and created_by = finly.actor_user_id());
create policy outbox_event_system on finly.outbox_event for select to finly_system using (true);
create policy outbox_event_system_deliver on finly.outbox_event for update to finly_system using (true) with check (true);
create policy outbox_event_system_cleanup on finly.outbox_event for delete to finly_system
  using (event_status = 'done' and done_at < now() - interval '30 days');

-- The engine asks whether a person owns a firm on the posting date.
grant select on finly.entity_membership to finly_ledger;
create policy entity_membership_ledger on finly.entity_membership for select to finly_ledger
  using (finly.actor_user_id() is not null);

-- Audit rows in savepoints ----------------------------------------------------------------------------------------
-- The commit checks used to look for "an audit row whose xmin is this transaction". A row written inside a
-- savepoint carries the subtransaction's id as xmin, so a correct posting that used a savepoint was refused. Each
-- audit row now records the top-level transaction id (pg_current_xact_id() returns it even inside a subtransaction),
-- stamped by trigger so it cannot be supplied, and the checks compare that.

alter table finly.audit_log add column written_xid xid8 not null default pg_current_xact_id();
comment on column finly.audit_log.written_xid is
  'Top-level transaction that wrote the row (savepoint-safe); lets commit checks find the audit row of this transaction';
create index audit_log_txn_written_idx on finly.audit_log (txn_id, written_xid) where txn_id is not null;

create function finly.tg_audit_log_stamp() returns trigger
language plpgsql
set search_path = finly, pg_temp
as $$
begin
  new.written_xid := pg_current_xact_id();
  return new;
end
$$;
create trigger audit_log_stamp before insert on finly.audit_log for each row execute function finly.tg_audit_log_stamp();

create or replace function finly.tg_journal_structure_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  n int;
  has_dr boolean;
  has_cr boolean;
  bad_fund uuid;
begin
  select count(*), bool_or(side = 'Dr'), bool_or(side = 'Cr') into n, has_dr, has_cr
  from finly.journal_line where journal_id = new.id;
  if n < 2 or not has_dr or not has_cr then
    raise exception using errcode = 'F1005',
      message = 'A journal needs at least two lines with both a debit and a credit.';
  end if;
  select fund_id into bad_fund from finly.journal_line where journal_id = new.id
  group by fund_id having not (bool_or(side = 'Dr') and bool_or(side = 'Cr')) limit 1;
  if bad_fund is not null then
    raise exception using errcode = 'F1005', message = 'Every fund in a journal must have both a debit and a credit.';
  end if;
  if not exists (select 1 from finly.txn_entity where txn_id = new.txn_id and entity_id = new.entity_id) then
    raise exception using errcode = 'F1005', message = 'Every entity whose books change takes part in the event.';
  end if;
  if not exists (select 1 from finly.audit_log
                 where txn_id = new.txn_id and written_xid = pg_current_xact_id()) then
    raise exception using errcode = 'F1009', message = 'A posting must write its audit record in the same transaction.';
  end if;
  return null;
end
$$;

create or replace function finly.tg_txn_audit_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and not exists (select 1 from finly.audit_log
                     where txn_id = new.id and written_xid = pg_current_xact_id()) then
    raise exception using errcode = 'F1009',
      message = 'A change of transaction status must write its audit record in the same transaction.';
  end if;
  return null;
end
$$;

drop function finly.current_xid();
