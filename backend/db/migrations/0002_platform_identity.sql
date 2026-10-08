-- 0002 platform, core entities and identity.
-- Design: docs/database/03-schema.md "Platform", "Identity and security", entity_type/entity.
-- Data impact: new empty tables. Recovery: forward fix; on an empty database drop the tables.

set local role finly_owner;

-- Platform -----------------------------------------------------------------------------------------------------

create table finly.lookup_value (
  id uuid primary key default finly.uuid_v7(),
  list_key text not null check (list_key in (
    'location_type', 'payment_method', 'fund_kind', 'event_kind', 'document_kind', 'worker_type', 'relation_label')),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (length(label) between 1 and 80),
  sort_order int not null default 0,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (list_key, key),
  unique (list_key, id)
);
comment on table finly.lookup_value is
  'Simple configurable lists. Referencing tables use a generated constant list column and a composite FK to (list_key, id), so a value from the wrong list is refused.';

create table finly.confidentiality_level (
  id uuid primary key default finly.uuid_v7(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (length(label) between 1 and 80),
  rank smallint not null unique check (rank between 0 and 1000),
  description text,
  default_rules jsonb not null default '{}',
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.confidentiality_level is
  'Nameable confidentiality levels (L7). Labels change; the engine compares the fixed rank (higher = stricter).';

create table finly.entity_type (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('firm', 'person', 'pool', 'party')),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (length(label) between 1 and 80),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (id, kind)
);
comment on table finly.entity_type is 'Configurable sub-types (company, partnership, customer, supplier, Angadiya…) over the four fixed kinds.';

create table finly.entity (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('firm', 'person', 'pool', 'party')),
  entity_type_id uuid not null,
  display_name text not null check (length(display_name) between 1 and 120),
  legal_name text check (length(legal_name) between 1 and 200),
  short_code text check (short_code ~ '^[A-Za-z0-9_-]{1,16}$'),
  managed_in_env_id uuid references finly.entity (id),
  confidentiality_level_id uuid references finly.confidentiality_level (id),
  has_books boolean generated always as (kind <> 'party') stored,
  archived_at timestamptz,
  archived_by uuid,
  archive_reason text,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid,
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (id, kind),
  foreign key (entity_type_id, kind) references finly.entity_type (id, kind),
  check (managed_in_env_id is null or managed_in_env_id <> id),
  check ((status = 'archived') = (archived_at is not null))
);
comment on table finly.entity is
  'Firms, people, pools (own books) and outside parties (no books). The id is the identity; names are editable labels.';
comment on column finly.entity.kind is 'firm | person | pool | party. Immutable: the chart of accounts and the engine depend on it.';
comment on column finly.entity.managed_in_env_id is
  'The environment this record was created in (RULEBOOK-03 §6): a worker created by Partner 1 lives in Partner 1''s environment.';
create unique index entity_short_code_key on finly.entity (lower(short_code)) where short_code is not null;
create index entity_name_prefix_idx on finly.entity (lower(display_name) text_pattern_ops);
create index entity_managed_in_idx on finly.entity (managed_in_env_id) where managed_in_env_id is not null;
create index entity_change_xid_idx on finly.entity (change_xid);

create function finly.tg_entity_kind_immutable() returns trigger
language plpgsql
as $$
begin
  if new.kind <> old.kind then
    raise exception using errcode = 'F1012', message = 'The kind of an entity cannot change; create a new entity instead.';
  end if;
  return new;
end
$$;
create trigger entity_kind_immutable before update of kind on finly.entity
  for each row execute function finly.tg_entity_kind_immutable();

create function finly.tg_user_person_immutable() returns trigger
language plpgsql
as $$
begin
  if new.person_entity_id <> old.person_entity_id then
    raise exception using errcode = 'F1008',
      message = 'A user is always the same person; their personal books cannot be re-pointed to someone else.';
  end if;
  return new;
end
$$;

-- Identity ---------------------------------------------------------------------------------------------------

create table finly.app_user (
  id uuid primary key default finly.uuid_v7(),
  person_entity_id uuid not null unique,
  person_kind text not null generated always as ('person') stored,
  username text not null check (username ~ '^[A-Za-z0-9._-]{3,40}$'),
  username_key text not null generated always as (lower(username)) stored unique,
  display_name text not null check (length(display_name) between 1 and 120),
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended', 'disabled', 'archived')),
  must_change_password boolean not null default true,
  mfa_required boolean not null default false,
  locale text not null default 'en' check (locale in ('en', 'hi', 'gu')),
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (person_entity_id, person_kind) references finly.entity (id, kind)
);
comment on table finly.app_user is 'A person who can sign in. Credentials live in separate tables the API role cannot read.';
comment on column finly.app_user.person_entity_id is 'Every user is exactly one person entity; that person''s books are the user''s private environment.';

-- Creation facts on earlier tables can now point at users.
alter table finly.lookup_value add foreign key (created_by) references finly.app_user (id);
alter table finly.confidentiality_level add foreign key (created_by) references finly.app_user (id);
alter table finly.entity_type add foreign key (created_by) references finly.app_user (id);
alter table finly.entity add foreign key (created_by) references finly.app_user (id);
alter table finly.entity add foreign key (archived_by) references finly.app_user (id);

create view finly.app_user_public with (security_barrier = true) as
  select id, person_entity_id, username, display_name, status, locale
  from finly.app_user;
comment on view finly.app_user_public is 'The only window the API role has onto users: no credential or security state.';

create table finly.system_setting (
  key text primary key check (key ~ '^[a-z][a-z0-9_.]{0,80}$'),
  value jsonb not null,
  description text,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references finly.app_user (id)
);
comment on table finly.system_setting is 'Key-value system settings (e.g. default_handover_confirmation, backdating_limit_days).';

create table finly.label_override (
  id uuid primary key default finly.uuid_v7(),
  locale text not null check (locale in ('en', 'hi', 'gu')),
  label_key text not null check (length(label_key) between 1 and 120),
  text text not null check (length(text) between 1 and 200),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (locale, label_key)
);
comment on table finly.label_override is 'Custom display labels and translations (Avak, Javak, Tijori, Hissa…). Never change behaviour (P8).';

create table finly.security_policy (
  id uuid primary key default finly.uuid_v7(),
  control_key text not null check (control_key ~ '^[a-z][a-z0-9_]{0,62}$'),
  scope_type text not null check (scope_type in (
    'system', 'entity', 'fund', 'location', 'txn_type', 'report', 'role', 'contact', 'share_profile', 'user')),
  scope_id uuid,
  mode text not null check (mode in ('off', 'default_on', 'mandatory')),
  user_may_change boolean not null default true,
  value jsonb not null default '{}',
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check ((scope_type = 'system') = (scope_id is null)),
  unique nulls not distinct (control_key, scope_type, scope_id)
);
comment on table finly.security_policy is 'OFF / DEFAULT ON / MANDATORY per control and scope (Q8, N). The API resolves the hierarchy; stricter wins.';

create table finly.emergency_control (
  control_key text primary key check (control_key in (
    'freeze_financial_writes', 'disable_exports', 'disable_sharing', 'require_reauth')),
  active boolean not null default false,
  reason text,
  activated_by uuid references finly.app_user (id),
  activated_at timestamptz,
  deactivated_by uuid references finly.app_user (id),
  deactivated_at timestamptz,
  version int not null default 1,
  check (not active or (reason is not null and activated_at is not null))
);
comment on table finly.emergency_control is 'Emergency switches (T7). freeze_financial_writes is enforced by the journal insert trigger.';

create table finly.retention_policy (
  data_class text primary key check (data_class ~ '^[a-z][a-z0-9_]{0,62}$'),
  retain_days int not null check (retain_days > 0),
  action text not null check (action in ('delete', 'anonymise', 'archive')),
  description text,
  version int not null default 1
);
comment on table finly.retention_policy is 'How long each class of data is kept (proposed values; open question Q8).';

create table finly.key_version (
  purpose text not null check (purpose in ('data', 'blind_index', 'hash_chain', 'file', 'mpin_pepper')),
  version int not null check (version > 0),
  algorithm text not null,
  status text not null check (status in ('active', 'decrypt_only', 'retired')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz,
  primary key (purpose, version)
);
comment on table finly.key_version is
  'Key version metadata only. No key material: keys are derived with HKDF from KEKs held in the function secret store (D-026).';
create unique index key_version_one_active on finly.key_version (purpose) where status = 'active';

create table finly.reference_counter (
  prefix text not null check (prefix in ('TX', 'OI', 'SH', 'RC')),
  day date not null,
  last_value int not null check (last_value between 0 and 999999),
  primary key (prefix, day)
);
comment on table finly.reference_counter is
  'Daily counters for human references (TX-YYYYMMDD-NNNNNN). Incremented inside the posting transaction, so numbers have no gaps.';

-- Credentials and sessions (role finly_auth only) ----------------------------------------------------------------

create table finly.user_credential (
  user_id uuid primary key references finly.app_user (id),
  password_hash text not null check (password_hash like '$argon2id$%'),
  is_temporary boolean not null default true,
  temporary_expires_at timestamptz,
  set_at timestamptz not null default now(),
  failed_count int not null default 0 check (failed_count >= 0),
  locked_until timestamptz,
  last_success_at timestamptz,
  version int not null default 1,
  check (not is_temporary or temporary_expires_at is not null)
);
comment on table finly.user_credential is 'Argon2id password hash and lockout state. Never readable by the API role; never a recoverable password.';

create table finly.mfa_factor (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  kind text not null check (kind in ('totp')),
  secret_enc finly.ciphertext not null,
  key_version int not null,
  label text check (length(label) <= 60),
  status text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  last_used_step bigint,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  revoked_at timestamptz
);
comment on table finly.mfa_factor is 'TOTP factors. The secret must be recoverable to verify codes, so it is encrypted (not hashed).';
comment on column finly.mfa_factor.last_used_step is 'Last accepted TOTP time step; a code from that step or earlier is refused (no replay).';
create index mfa_factor_user_idx on finly.mfa_factor (user_id) where status <> 'revoked';

create table finly.recovery_code (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  batch_id uuid not null,
  code_hash finly.keyed_hash not null unique,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
comment on table finly.recovery_code is 'Single-use recovery codes, stored only as keyed hashes.';
create index recovery_code_user_idx on finly.recovery_code (user_id) where used_at is null;

create table finly.device (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  label text check (length(label) <= 80),
  platform text not null check (platform in ('android', 'ios', 'web')),
  model text check (length(model) <= 80),
  os_version text check (length(os_version) <= 40),
  app_version text check (length(app_version) <= 40),
  public_key bytea check (octet_length(public_key) between 32 and 1024),
  push_token_enc finly.ciphertext,
  key_version int,
  status text not null default 'pending' check (status in ('pending', 'trusted', 'revoked', 'lost')),
  registered_at timestamptz not null default now(),
  trusted_at timestamptz,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  revoke_reason text,
  version int not null default 1,
  unique (id, user_id),
  check ((status in ('revoked', 'lost')) = (revoked_at is not null))
);
comment on table finly.device is 'Registered phones. public_key is the Android Keystore key used to sign step-up challenges.';
create index device_user_idx on finly.device (user_id);

create table finly.unlock_credential (
  device_id uuid primary key,
  user_id uuid not null,
  mpin_hash text check (mpin_hash like '$argon2id$%'),
  mpin_set_at timestamptz,
  mpin_failed_count int not null default 0 check (mpin_failed_count >= 0),
  mpin_locked_until timestamptz,
  mpin_reset_required boolean not null default false,
  biometric_enabled boolean not null default false,
  biometric_changed_at timestamptz,
  key_invalidated_at timestamptz,
  version int not null default 1,
  foreign key (device_id, user_id) references finly.device (id, user_id)
);
comment on table finly.unlock_credential is
  'Per-device app-unlock state. mpin_hash = Argon2id of HMAC(pepper, PIN); the pepper is outside the database. No biometric data, ever.';

create table finly.auth_session (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null,
  device_id uuid not null,
  auth_methods text[] not null check (cardinality(auth_methods) >= 1),
  auth_strength smallint not null check (auth_strength between 1 and 3),
  remember boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  idle_expires_at timestamptz not null,
  absolute_expires_at timestamptz not null,
  revoked_at timestamptz,
  revoke_reason text check (revoke_reason in (
    'logout', 'logout_all', 'device_revoked', 'device_lost', 'password_changed', 'security_change', 'admin',
    'token_reuse', 'expired')),
  ip inet,
  user_agent text check (length(user_agent) <= 300),
  foreign key (device_id, user_id) references finly.device (id, user_id),
  check (absolute_expires_at > created_at),
  check (idle_expires_at <= absolute_expires_at),
  check ((revoked_at is null) = (revoke_reason is null))
);
comment on table finly.auth_session is 'Remembered sessions. Always expirable and revocable; never unlimited (N3).';
create index auth_session_user_idx on finly.auth_session (user_id) where revoked_at is null;

create table finly.refresh_token (
  id uuid primary key default finly.uuid_v7(),
  session_id uuid not null references finly.auth_session (id),
  token_hash finly.keyed_hash not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  replaced_by_id uuid references finly.refresh_token (id),
  check (expires_at > issued_at),
  check (replaced_by_id is null or used_at is not null)
);
comment on table finly.refresh_token is 'Rotating refresh tokens (SHA-256 of 256 random bits). Reuse of a used token revokes the session.';
create index refresh_token_session_idx on finly.refresh_token (session_id);

create table finly.security_event (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid references finly.app_user (id),
  username_hash finly.keyed_hash,
  device_id uuid references finly.device (id),
  session_id uuid references finly.auth_session (id),
  event_type text not null check (event_type in (
    'login_succeeded', 'login_failed', 'logout', 'password_changed', 'password_reset', 'mpin_set', 'mpin_changed',
    'mpin_reset', 'mpin_failed', 'biometric_enabled', 'biometric_disabled', 'mfa_enabled', 'mfa_disabled',
    'new_device', 'device_revoked', 'session_revoked', 'token_reuse', 'lockout', 'step_up_succeeded',
    'step_up_failed')),
  outcome text not null check (outcome in ('success', 'failure', 'blocked')),
  reason_code text check (length(reason_code) <= 60),
  ip inet,
  user_agent text check (length(user_agent) <= 300),
  details jsonb not null default '{}'
);
comment on table finly.security_event is 'Login history and security events. A failed attempt for an unknown username stores only a keyed hash of it.';
create index security_event_user_idx on finly.security_event (user_id, occurred_at desc);

create trigger security_event_immutable before update or delete on finly.security_event
  for each row execute function finly.tg_immutable();

-- Standard-column triggers.
create trigger lookup_value_std before insert or update on finly.lookup_value for each row execute function finly.tg_std();
create trigger confidentiality_level_std before insert or update on finly.confidentiality_level
  for each row execute function finly.tg_std();
create trigger entity_type_std before insert or update on finly.entity_type for each row execute function finly.tg_std();
create trigger entity_std before insert or update on finly.entity for each row execute function finly.tg_std();
create trigger app_user_std before insert or update on finly.app_user for each row execute function finly.tg_std();
create trigger app_user_person_immutable before update of person_entity_id on finly.app_user
  for each row execute function finly.tg_user_person_immutable();
create trigger label_override_std before insert or update on finly.label_override for each row execute function finly.tg_std();
create trigger security_policy_std before insert or update on finly.security_policy
  for each row execute function finly.tg_std();
create trigger system_setting_version before update on finly.system_setting for each row execute function finly.tg_version();
create trigger emergency_control_version before update on finly.emergency_control
  for each row execute function finly.tg_version();
create trigger user_credential_version before update on finly.user_credential for each row execute function finly.tg_version();
create trigger device_version before update on finly.device for each row execute function finly.tg_version();
create trigger unlock_credential_version before update on finly.unlock_credential
  for each row execute function finly.tg_version();
