-- 0003 authorisation and master data.
-- Design: docs/database/03-schema.md "Authorisation", "Entities and masters"; 05-security-rls.md §5.5 (A4 guards).
-- Data impact: new empty tables. Recovery: forward fix.

set local role finly_owner;

-- Roles and permissions ----------------------------------------------------------------------------------------

create table finly.role (
  id uuid primary key default finly.uuid_v7(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  name text not null check (length(name) between 1 and 80),
  description text,
  is_system boolean not null default false,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.role is 'Configurable roles. A role grants baseline capability only; environments are entered through env_access (T4, A4).';

create table finly.permission (
  id uuid primary key default finly.uuid_v7(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  resource_type text not null,
  action text not null,
  description text not null,
  step_up_default boolean not null default false
);
comment on table finly.permission is 'The permission keys the backend enforces. Seeded by migrations; roles combine them.';

create table finly.role_permission (
  role_id uuid not null references finly.role (id),
  permission_id uuid not null references finly.permission (id),
  effect text not null default 'allow' check (effect in ('allow', 'deny')),
  primary key (role_id, permission_id)
);
comment on table finly.role_permission is 'Role -> permission with explicit allow or deny (deny wins, L8).';

create table finly.user_role (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  role_id uuid not null references finly.role (id),
  scope_entity_id uuid references finly.entity (id),
  granted_by uuid references finly.app_user (id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  reason text,
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.user_role is 'User -> role, optionally scoped to one firm or pool. Never opens anyone''s personal books.';
create unique index user_role_active_key on finly.user_role (user_id, role_id, scope_entity_id) nulls not distinct
  where revoked_at is null;
create index user_role_user_idx on finly.user_role (user_id) where revoked_at is null;

create table finly.break_glass (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  env_entity_id uuid not null references finly.entity (id),
  reason text not null check (length(reason) between 10 and 500),
  auth_strength smallint not null check (auth_strength between 1 and 3),
  approved_by uuid references finly.app_user (id),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  ended_at timestamptz,
  owner_notified_at timestamptz,
  check (ends_at > started_at)
);
comment on table finly.break_glass is 'Emergency access sessions (L9): reason, strong authentication, time limit, owner notified. Never into personal books.';

create table finly.env_access (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  env_entity_id uuid not null references finly.entity (id),
  level text not null check (level in ('read', 'write', 'manage')),
  source text not null check (source in ('self', 'admin', 'owner_grant', 'temporary', 'break_glass')),
  granted_by uuid references finly.app_user (id),
  granted_at timestamptz not null default now(),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  break_glass_id uuid references finly.break_glass (id),
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  reason text,
  change_xid xid8 not null default pg_current_xact_id(),
  check (valid_until is null or valid_until > valid_from),
  check ((source = 'self') = (granted_by is null)),
  check ((source = 'temporary') <= (valid_until is not null)),
  check ((source = 'break_glass') = (break_glass_id is not null))
);
comment on table finly.env_access is
  'Which environments (firm, pool, personal books) a user may enter. Personal books open only to their owner and the owner''s grants (A4).';
create unique index env_access_active_key on finly.env_access (user_id, env_entity_id, source) where revoked_at is null;
create index env_access_user_idx on finly.env_access (user_id) where revoked_at is null;
create index env_access_change_xid_idx on finly.env_access (change_xid);

create table finly.access_rule (
  id uuid primary key default finly.uuid_v7(),
  subject_type text not null check (subject_type in ('user', 'role', 'everyone')),
  subject_user_id uuid references finly.app_user (id),
  subject_role_id uuid references finly.role (id),
  env_entity_id uuid references finly.entity (id),
  resource_type text not null check (resource_type in (
    'entity', 'fund', 'location', 'ledger_account', 'category', 'txn_type', 'confidentiality_level', 'field', 'report',
    'txn')),
  resource_id uuid,
  field_key text check (field_key ~ '^[a-z][a-z0-9_.]{0,80}$'),
  actions text[] not null check (cardinality(actions) >= 1 and actions <@ array[
    'discover', 'view', 'view_amount', 'view_details', 'create', 'edit', 'reverse', 'approve', 'reconcile', 'export',
    'share_message', 'share_photo', 'share_pdf', 'share_secure', 'copy', 'download', 'print', 'view_attachments',
    'view_audit', 'manage']::text[]),
  effect text not null check (effect in ('allow', 'deny')),
  amount_visibility text check (amount_visibility in ('full', 'rounded', 'range', 'hidden', 'existence')),
  detail_level smallint check (detail_level between 1 and 5),
  conditions jsonb not null default '{}',
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  source text not null check (source in ('role_default', 'admin', 'owner', 'temporary', 'share')),
  granted_by uuid references finly.app_user (id),
  reason text,
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check (num_nonnulls(subject_user_id, subject_role_id) = case subject_type when 'everyone' then 0 else 1 end),
  check ((subject_type = 'user') = (subject_user_id is not null)),
  check ((resource_type = 'field') = (field_key is not null)),
  check (valid_until is null or valid_until > valid_from)
);
comment on table finly.access_rule is
  'Fine-grained allow/deny rules (L2-L9): per resource, action, field, amount visibility and detail level. Deny wins.';
create index access_rule_user_idx on finly.access_rule (subject_user_id) where revoked_at is null;
create index access_rule_role_idx on finly.access_rule (subject_role_id) where revoked_at is null;
create index access_rule_change_xid_idx on finly.access_rule (change_xid);

-- People, firms, memberships, contacts -------------------------------------------------------------------------

create table finly.person_profile (
  entity_id uuid primary key,
  person_kind text not null generated always as ('person') stored,
  phone_enc finly.ciphertext,
  phone_bidx finly.keyed_hash,
  email text check (email ~ '^[^@\s]+@[^@\s]+$'),
  worker_type_id uuid,
  worker_type_list text not null generated always as ('worker_type') stored,
  notes_enc finly.ciphertext,
  key_version int,
  version int not null default 1,
  foreign key (entity_id, person_kind) references finly.entity (id, kind),
  foreign key (worker_type_list, worker_type_id) references finly.lookup_value (list_key, id),
  check ((phone_enc is null) = (phone_bidx is null)),
  check (num_nonnulls(phone_enc, notes_enc) = 0 or key_version is not null)
);
comment on table finly.person_profile is 'Person details. Phone numbers are encrypted, with a keyed index for lookup and duplicate detection.';
create index person_profile_phone_idx on finly.person_profile (phone_bidx) where phone_bidx is not null;

create table finly.firm_profile (
  entity_id uuid primary key,
  firm_kind text not null generated always as ('firm') stored,
  legal_form text check (length(legal_form) <= 60),
  gstin_enc finly.ciphertext,
  pan_enc finly.ciphertext,
  address text check (length(address) <= 400),
  fy_start_month smallint not null default 4 check (fy_start_month between 1 and 12),
  key_version int,
  version int not null default 1,
  foreign key (entity_id, firm_kind) references finly.entity (id, kind),
  check (num_nonnulls(gstin_enc, pan_enc) = 0 or key_version is not null)
);
comment on table finly.firm_profile is 'Firm details. Tax identifiers are encrypted. Financial year starts in April by default (Q9).';

create table finly.entity_membership (
  id uuid primary key default finly.uuid_v7(),
  org_entity_id uuid not null references finly.entity (id),
  member_entity_id uuid not null references finly.entity (id),
  engine_role text not null check (engine_role in ('owner', 'partner', 'staff', 'other')),
  relation_label_id uuid,
  relation_list text not null generated always as ('relation_label') stored,
  valid_from date not null default current_date,
  valid_to date,
  created_by uuid references finly.app_user (id),
  created_at timestamptz not null default now(),
  ended_by uuid references finly.app_user (id),
  end_reason text,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (relation_list, relation_label_id) references finly.lookup_value (list_key, id),
  check (org_entity_id <> member_entity_id),
  check (valid_to is null or valid_to >= valid_from)
);
comment on table finly.entity_membership is
  'Owner / partner / staff relationships over time. The engine''s "owner of the firm" = engine_role owner or partner.';
create unique index entity_membership_active_key on finly.entity_membership (org_entity_id, member_entity_id, engine_role)
  where valid_to is null;
create index entity_membership_org_idx on finly.entity_membership (org_entity_id) where valid_to is null;
create index entity_membership_member_idx on finly.entity_membership (member_entity_id) where valid_to is null;

create table finly.contact (
  id uuid primary key default finly.uuid_v7(),
  managed_in_env_id uuid not null references finly.entity (id),
  display_name text not null check (length(display_name) between 1 and 120),
  phone_enc finly.ciphertext,
  phone_bidx finly.keyed_hash,
  linked_entity_id uuid references finly.entity (id),
  verified_at timestamptz,
  verified_by uuid references finly.app_user (id),
  key_version int,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check ((phone_enc is null) = (phone_bidx is null)),
  check (phone_enc is null or key_version is not null)
);
comment on table finly.contact is 'Share recipients (Q3, Q9).';

-- Configurable masters ----------------------------------------------------------------------------------------

create table finly.category (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('expense', 'income')),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  name text not null check (length(name) between 1 and 80),
  parent_id uuid,
  account_code text not null check (account_code ~ '^[0-9]{4}$'),
  managed_in_env_id uuid references finly.entity (id),
  sort_order int not null default 0,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (id, kind),
  foreign key (parent_id, kind) references finly.category (id, kind),
  check (parent_id is null or parent_id <> id)
);
comment on table finly.category is 'Expense and income categories; account_code is the ledger account they post to in every entity''s chart.';
create index category_change_xid_idx on finly.category (change_xid);

create table finly.txn_type (
  id uuid primary key default finly.uuid_v7(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (length(label) between 1 and 80),
  intent_type text not null check (intent_type in (
    'transfer', 'transit_confirm', 'expense', 'bill', 'nonowner_payment', 'income', 'unidentified_receipt',
    'advance_give', 'advance_account', 'loan', 'loan_repayment', 'capital_contribution', 'withdrawal',
    'interentity_transfer', 'settlement', 'offset', 'opening_balance', 'cash_adjustment', 'allocation_adjustment',
    'reversal', 'correction')),
  requires_reason boolean not null default true,
  default_confidentiality_level_id uuid references finly.confidentiality_level (id),
  sort_order int not null default 0,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.txn_type is 'Configurable transaction types (labels such as Avak/Javak) over fixed engine intents; the intent decides the accounting.';
create index txn_type_change_xid_idx on finly.txn_type (change_xid);

create table finly.tag (
  id uuid primary key default finly.uuid_v7(),
  managed_in_env_id uuid references finly.entity (id),
  name text not null check (length(name) between 1 and 40),
  color_token text check (color_token ~ '^[a-z][a-z0-9_.-]{0,40}$'),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.tag is 'Tags, global or per environment.';
create unique index tag_name_key on finly.tag (managed_in_env_id, lower(name)) nulls not distinct;

create table finly.place (
  id uuid primary key default finly.uuid_v7(),
  managed_in_env_id uuid references finly.entity (id),
  name text not null check (length(name) between 1 and 120),
  address text check (length(address) <= 400),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.place is 'Places where things happened (vendor town, office, market).';

create table finly.expense_event (
  id uuid primary key default finly.uuid_v7(),
  env_entity_id uuid not null references finly.entity (id),
  kind_id uuid not null,
  kind_list text not null generated always as ('event_kind') stored,
  name text not null check (length(name) between 1 and 120),
  starts_on date,
  ends_on date,
  place_id uuid references finly.place (id),
  event_status text not null default 'active' check (event_status in ('planned', 'active', 'closed')),
  notes_enc finly.ciphertext,
  key_version int,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (kind_list, kind_id) references finly.lookup_value (list_key, id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on),
  check (notes_enc is null or key_version is not null)
);
comment on table finly.expense_event is 'Trips, visits (Angadiya, firm, customer), exhibitions and projects that group many expense lines (H9).';
create index expense_event_env_idx on finly.expense_event (env_entity_id);

create table finly.custom_field_def (
  id uuid primary key default finly.uuid_v7(),
  target text not null check (target in ('txn', 'txn_leg', 'entity', 'location', 'expense_event')),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null check (length(label) between 1 and 80),
  data_type text not null check (data_type in (
    'text', 'number', 'amount', 'date', 'time', 'choice', 'multi_choice', 'person', 'entity', 'fund', 'location',
    'boolean', 'file')),
  options jsonb not null default '{}',
  is_sensitive boolean not null default false,
  required_rule jsonb not null default '{}',
  txn_type_id uuid references finly.txn_type (id),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (target, key),
  check (data_type <> 'amount' or is_sensitive)
);
comment on table finly.custom_field_def is 'Custom field definitions (T5). Amount fields are always sensitive (encrypted).';

create table finly.form_definition (
  id uuid primary key default finly.uuid_v7(),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  form_version int not null check (form_version > 0),
  txn_type_id uuid references finly.txn_type (id),
  schema jsonb not null,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (key, form_version)
);
comment on table finly.form_definition is 'Configurable forms with conditional rules (P3). Versioned; old versions stay for history.';

create table finly.notification_rule (
  id uuid primary key default finly.uuid_v7(),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_.]{0,80}$'),
  scope_type text not null check (scope_type in ('system', 'entity', 'role', 'user')),
  scope_id uuid,
  channel text not null check (channel in ('in_app', 'push')),
  content_mode text not null check (content_mode in ('full', 'masked', 'generic')),
  conditions jsonb not null default '{}',
  enabled boolean not null default true,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check ((scope_type = 'system') = (scope_id is null))
);
comment on table finly.notification_rule is 'Which events notify whom, on which channel, in Full / Masked / Generic mode (R5).';

create table finly.message_template (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('message', 'photo', 'pdf')),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  locale text not null check (locale in ('en', 'hi', 'gu')),
  template_version int not null check (template_version > 0),
  body text not null,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (kind, key, locale, template_version)
);
comment on table finly.message_template is 'Admin-configurable message, photo-proof and PDF templates (Q5-Q7).';

create table finly.report_definition (
  id uuid primary key default finly.uuid_v7(),
  owner_user_id uuid references finly.app_user (id),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  name text not null check (length(name) between 1 and 120),
  kind text not null check (kind in ('system', 'custom')),
  definition jsonb not null,
  visibility text not null default 'private' check (visibility in ('private', 'role', 'shared')),
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check ((kind = 'system') = (owner_user_id is null))
);
comment on table finly.report_definition is 'System and custom report definitions. Reports obey the same privacy model as the app (R3).';
create unique index report_definition_key on finly.report_definition (owner_user_id, key) nulls not distinct;

create table finly.dashboard_config (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid references finly.app_user (id),
  role_id uuid references finly.role (id),
  layout jsonb not null,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  check (num_nonnulls(user_id, role_id) = 1)
);
comment on table finly.dashboard_config is 'Dashboard layouts per user, or per role as a default.';
create unique index dashboard_config_user_key on finly.dashboard_config (user_id) where user_id is not null;
create unique index dashboard_config_role_key on finly.dashboard_config (role_id) where role_id is not null;

-- Guards -----------------------------------------------------------------------------------------------------

create function finly.entity_kind_of(p_id uuid) returns text
language sql stable security definer set search_path = finly, pg_temp
as $$ select kind from finly.entity where id = p_id $$;
comment on function finly.entity_kind_of(uuid) is 'Kind of an entity, readable by guards regardless of the caller''s row visibility.';

create function finly.person_of_user(p_user uuid) returns uuid
language sql stable security definer set search_path = finly, pg_temp
as $$ select person_entity_id from finly.app_user where id = p_user $$;
comment on function finly.person_of_user(uuid) is 'The person entity of a user.';

create function finly.tg_env_access_guard() returns trigger
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
  end if;
  return new;
end
$$;
create trigger env_access_guard before insert or update on finly.env_access
  for each row execute function finly.tg_env_access_guard();

create function finly.tg_break_glass_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if finly.entity_kind_of(new.env_entity_id) is distinct from 'firm'
     and finly.entity_kind_of(new.env_entity_id) is distinct from 'pool' then
    raise exception using errcode = 'F1008', message = 'Break-glass access never reaches personal books (A4).';
  end if;
  return new;
end
$$;
create trigger break_glass_guard before insert or update on finly.break_glass
  for each row execute function finly.tg_break_glass_guard();

create function finly.tg_scoped_role_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if new.scope_entity_id is not null and finly.entity_kind_of(new.scope_entity_id) not in ('firm', 'pool') then
    raise exception using errcode = 'F1012', message = 'A role can be scoped to a firm or a pool only.';
  end if;
  return new;
end
$$;
create trigger user_role_guard before insert or update on finly.user_role
  for each row execute function finly.tg_scoped_role_guard();

create function finly.tg_membership_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  org_kind text := finly.entity_kind_of(new.org_entity_id);
  member_kind text := finly.entity_kind_of(new.member_entity_id);
begin
  if org_kind not in ('firm', 'pool') then
    raise exception using errcode = 'F1012', message = 'Members belong to a firm or a pool.';
  end if;
  if member_kind = 'person' or (org_kind = 'pool' and member_kind = 'firm') then
    return new;
  end if;
  raise exception using errcode = 'F1012', message = 'A member is a person (or a firm inside a pool).';
end
$$;
create trigger entity_membership_guard before insert or update on finly.entity_membership
  for each row execute function finly.tg_membership_guard();

-- Standard-column triggers.
create trigger role_std before insert or update on finly.role for each row execute function finly.tg_std();
create trigger access_rule_std before insert or update on finly.access_rule for each row execute function finly.tg_std();
create trigger contact_std before insert or update on finly.contact for each row execute function finly.tg_std();
create trigger category_std before insert or update on finly.category for each row execute function finly.tg_std();
create trigger txn_type_std before insert or update on finly.txn_type for each row execute function finly.tg_std();
create trigger tag_std before insert or update on finly.tag for each row execute function finly.tg_std();
create trigger place_std before insert or update on finly.place for each row execute function finly.tg_std();
create trigger expense_event_std before insert or update on finly.expense_event for each row execute function finly.tg_std();
create trigger custom_field_def_std before insert or update on finly.custom_field_def
  for each row execute function finly.tg_std();
create trigger form_definition_std before insert or update on finly.form_definition
  for each row execute function finly.tg_std();
create trigger notification_rule_std before insert or update on finly.notification_rule
  for each row execute function finly.tg_std();
create trigger message_template_std before insert or update on finly.message_template
  for each row execute function finly.tg_std();
create trigger report_definition_std before insert or update on finly.report_definition
  for each row execute function finly.tg_std();
create trigger person_profile_version before update on finly.person_profile for each row execute function finly.tg_version();
create trigger firm_profile_version before update on finly.firm_profile for each row execute function finly.tg_version();
create trigger dashboard_config_version before update on finly.dashboard_config
  for each row execute function finly.tg_version();
create trigger env_access_no_delete before delete on finly.env_access for each row execute function finly.tg_no_delete();
create trigger user_role_no_delete before delete on finly.user_role for each row execute function finly.tg_no_delete();
create trigger entity_no_delete before delete on finly.entity for each row execute function finly.tg_no_delete();
create trigger entity_membership_no_delete before delete on finly.entity_membership
  for each row execute function finly.tg_no_delete();
