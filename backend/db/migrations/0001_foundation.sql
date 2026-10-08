-- 0001 foundation — roles, schema ownership, shared types and trigger functions.
-- Design: docs/database/01-architecture.md §1.4, 05-security-rls.md §5.2.
-- Data impact: none (roles and empty objects only).
-- Recovery: on an empty database, `drop schema finly cascade` and drop the five roles.
--
-- Error codes raised by Finly's database guards (SQLSTATE class F1, mapped to safe messages by the API):
--   F1001 immutable history          F1002 period closed or missing     F1003 financial writes frozen
--   F1004 inactive or archived master F1005 journal structure invalid    F1006 required dimension missing
--   F1007 status transition refused  F1008 personal-finance grant refused F1009 audit row missing
--   F1010 transaction legs frozen    F1011 segregation of duties        F1012 wrong kind of entity

-- Group roles (NOLOGIN). Deployment creates separate LOGIN users that are members of one role each.
do $$
declare
  r text;
begin
  foreach r in array array['finly_owner', 'finly_auth', 'finly_api', 'finly_ledger', 'finly_system'] loop
    if not exists (select 1 from pg_roles where rolname = r) then
      execute format('create role %I nologin', r);
    end if;
  end loop;
end
$$;

grant finly_owner to current_user;
alter schema finly owner to finly_owner;
alter table finly.schema_migration owner to finly_owner;

revoke all on schema finly from public;
grant usage on schema finly to finly_auth, finly_api, finly_ledger, finly_system;

-- Supabase's client roles (present only on Supabase) get nothing at all.
do $$
declare
  r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema finly from %I', r);
      execute format('revoke all on all tables in schema finly from %I', r);
    end if;
  end loop;
end
$$;

-- Bounded waits for the request roles: a stuck request never holds money locks for long.
alter role finly_api set statement_timeout = '15s';
alter role finly_api set lock_timeout = '5s';
alter role finly_api set idle_in_transaction_session_timeout = '30s';
alter role finly_ledger set statement_timeout = '15s';
alter role finly_ledger set lock_timeout = '5s';
alter role finly_ledger set idle_in_transaction_session_timeout = '30s';
alter role finly_auth set statement_timeout = '10s';

set local role finly_owner;

alter default privileges in schema finly revoke all on tables from public;
alter default privileges in schema finly revoke all on sequences from public;
alter default privileges in schema finly revoke execute on functions from public;

comment on schema finly is 'Finly: the authoritative financial and business data of every client. See docs/database/.';

-- Shared types ------------------------------------------------------------------------------------------------

create domain finly.lifecycle as text check (value in ('active', 'inactive', 'archived'));
comment on domain finly.lifecycle is 'Master data lifecycle: active -> inactive (no new use) -> archived; never deleted once referenced.';

create domain finly.side as text check (value in ('Dr', 'Cr'));
comment on domain finly.side is 'Accounting side of a journal line. Direction is never a negative amount.';

create domain finly.ciphertext as bytea check (octet_length(value) between 29 and 4096);
comment on domain finly.ciphertext is
  'AES-256-GCM output: 1-byte format + 12-byte nonce + ciphertext + 16-byte tag. Keys never live in the database.';

create domain finly.keyed_hash as bytea check (octet_length(value) between 16 and 64);
comment on domain finly.keyed_hash is 'HMAC-SHA-256 blind index or keyed hash (truncated to at least 16 bytes).';

-- Mobile delta sync (docs/database/06 §6.6): every synced row records change_xid, the id of the transaction that
-- last wrote it. A sync page returns rows with change_xid >= the client's cursor and hands back the snapshot's
-- xmin as the next cursor; transactions below it had all committed, so out-of-order commits are never skipped.

-- Functions ---------------------------------------------------------------------------------------------------

create function finly.uuid_v7() returns uuid
language sql volatile parallel safe
as $$
  -- RFC 9562 version 7: 48-bit Unix milliseconds, then randomness from gen_random_uuid() (built in, no extension).
  select encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid())
          placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6),
        52, 1),
      53, 1),
    'hex')::uuid
$$;
comment on function finly.uuid_v7() is 'Time-ordered UUID (v7) for keys created in SQL; the API generates the same format.';
grant execute on function finly.uuid_v7() to finly_auth, finly_api, finly_ledger, finly_system;

create function finly.tg_std() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  new.updated_at := now();
  new.change_xid := pg_current_xact_id();
  return new;
end
$$;
comment on function finly.tg_std() is
  'Standard columns: bump version (optimistic concurrency), keep creation facts, stamp updated_at and change_xid.';

create function finly.is_key_rotation(p_old jsonb, p_new jsonb) returns boolean
language sql stable
as $$
  -- The only permitted change to immutable history (05 §5.7): the system role re-encrypting ciphertext under a newer
  -- key version. Every changed column must be ciphertext (*_enc) or the key version, and the version must rise.
  select pg_has_role(session_user, 'finly_system', 'member')
     and (p_new ->> 'key_version')::int > (p_old ->> 'key_version')::int
     and not exists (
       select 1 from jsonb_each(p_new) n
       where n.value is distinct from p_old -> n.key and n.key <> 'key_version' and n.key not like '%\_enc')
$$;
comment on function finly.is_key_rotation(jsonb, jsonb) is 'True only for a key-rotation re-encryption by the system role.';

create function finly.tg_version() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  return new;
end
$$;
comment on function finly.tg_version() is 'Bump version on update (tables without the full standard columns).';

create function finly.tg_immutable() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and finly.is_key_rotation(to_jsonb(old), to_jsonb(new)) then
    return new;
  end if;
  raise exception using
    errcode = 'F1001',
    message = format('%s rows are immutable history and cannot be %s.', tg_table_name, lower(tg_op) || 'd'),
    hint = 'Record a reversal, correction or adjustment instead.';
end
$$;
comment on function finly.tg_immutable() is 'Refuses UPDATE and DELETE on append-only history (F1001).';

create function finly.tg_no_delete() returns trigger
language plpgsql
as $$
begin
  raise exception using
    errcode = 'F1001',
    message = format('%s rows are never deleted; archive or end them instead.', tg_table_name);
end
$$;
comment on function finly.tg_no_delete() is 'Refuses DELETE on rows that history may reference (F1001).';
