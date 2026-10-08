-- 0006 control, files and sharing, operations, audit; commit-time ledger checks.
-- Design: docs/database/03-schema.md "Control", "Files and sharing", "Operations"; 05-security-rls.md §5.8.
-- Data impact: new empty tables. Recovery: forward fix.

set local role finly_owner;

-- Files --------------------------------------------------------------------------------------------------------

create table finly.attachment (
  id uuid primary key default finly.uuid_v7(),
  env_entity_id uuid not null references finly.entity (id),
  kind_id uuid not null,
  kind_list text not null generated always as ('document_kind') stored,
  storage_key text not null unique check (storage_key ~ '^[A-Za-z0-9/_.-]{16,200}$'),
  content_type text not null check (content_type in (
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256 bytea not null check (octet_length(sha256) = 32),
  is_encrypted boolean not null default true,
  key_version int,
  attachment_status text not null default 'active' check (attachment_status in ('active', 'replaced', 'removed')),
  replaced_by_id uuid references finly.attachment (id),
  scan_status text not null default 'not_scanned' check (scan_status in ('pending', 'clean', 'rejected', 'not_scanned')),
  uploaded_by uuid not null references finly.app_user (id),
  uploaded_at timestamptz not null default now(),
  removed_by uuid references finly.app_user (id),
  removed_at timestamptz,
  removal_reason text,
  version int not null default 1,
  foreign key (kind_list, kind_id) references finly.lookup_value (list_key, id),
  check (is_encrypted = (key_version is not null)),
  check ((attachment_status = 'replaced') = (replaced_by_id is not null)),
  check ((attachment_status = 'removed') = (removed_at is not null and removal_reason is not null))
);
comment on table finly.attachment is
  'Evidence files (receipts, bills, statements). Metadata only: the file lives in object storage, encrypted with a key derived from the KEK and this id.';

create table finly.attachment_link (
  id uuid primary key default finly.uuid_v7(),
  attachment_id uuid not null references finly.attachment (id),
  txn_id uuid references finly.txn (id),
  reconciliation_id uuid,
  custody_event_id uuid references finly.custody_event (id),
  expense_event_id uuid references finly.expense_event (id),
  entity_id uuid references finly.entity (id),
  created_by uuid not null references finly.app_user (id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(txn_id, reconciliation_id, custody_event_id, expense_event_id, entity_id) = 1)
);
comment on table finly.attachment_link is 'Attachment -> what it evidences, with one real foreign key per target type (exactly one set).';
create index attachment_link_attachment_idx on finly.attachment_link (attachment_id);
create index attachment_link_txn_idx on finly.attachment_link (txn_id) where txn_id is not null;

-- Control -----------------------------------------------------------------------------------------------------

create table finly.reconciliation (
  id uuid primary key default finly.uuid_v7(),
  reference text collate "C" not null unique check (reference ~ '^RC-[0-9]{8}-[0-9]{6}$'),
  scope text not null check (scope in ('location', 'bank', 'person', 'fund', 'open_items', 'inter_entity')),
  entity_id uuid references finly.entity (id),
  location_id uuid references finly.location (id),
  counterparty_entity_id uuid references finly.entity (id),
  slice_version bigint,
  as_of timestamptz not null,
  expected_enc finly.ciphertext not null,
  actual_enc finly.ciphertext,
  difference_enc finly.ciphertext,
  key_version int not null,
  recon_status text not null default 'draft' check (recon_status in (
    'draft', 'investigating', 'resolved', 'adjustment_pending', 'adjusted', 'closed')),
  resolution text check (resolution in ('no_difference', 'found_entry', 'adjustment', 'suspense', 'write_off')),
  adjustment_txn_id uuid references finly.txn (id),
  notes_enc finly.ciphertext,
  created_by uuid not null references finly.app_user (id),
  created_at timestamptz not null default now(),
  approved_by uuid references finly.app_user (id),
  closed_at timestamptz,
  version int not null default 1,
  check (scope not in ('location', 'bank') or location_id is not null),
  check ((actual_enc is null) = (difference_enc is null)),
  check (recon_status <> 'adjusted' or adjustment_txn_id is not null),
  check ((recon_status = 'closed') = (closed_at is not null))
);
comment on table finly.reconciliation is
  'Expected vs actual, investigation and resolution (Part S). Never edits a balance: any adjustment is a posted, linked transaction.';
comment on column finly.reconciliation.slice_version is 'balance_current.version read for "expected"; an adjustment is accepted only if it is unchanged.';
alter table finly.attachment_link add foreign key (reconciliation_id) references finly.reconciliation (id);

create table finly.bank_statement_import (
  id uuid primary key default finly.uuid_v7(),
  location_id uuid not null references finly.location (id),
  attachment_id uuid references finly.attachment (id),
  period_from date,
  period_to date,
  line_count int not null default 0 check (line_count >= 0),
  import_status text not null default 'parsed' check (import_status in ('parsed', 'reviewed', 'committed', 'discarded')),
  imported_by uuid not null references finly.app_user (id),
  imported_at timestamptz not null default now(),
  version int not null default 1,
  check (period_to is null or period_from is null or period_to >= period_from)
);
comment on table finly.bank_statement_import is 'Imported bank statements (R4, S).';

create table finly.bank_statement_line (
  id uuid primary key default finly.uuid_v7(),
  import_id uuid not null references finly.bank_statement_import (id),
  line_no int not null check (line_no > 0),
  value_date date not null,
  direction text not null check (direction in ('in', 'out')),
  amount_enc finly.ciphertext not null,
  amount_bidx finly.keyed_hash not null,
  key_version int not null,
  description text check (length(description) <= 500),
  bank_reference text check (length(bank_reference) <= 100),
  line_status text not null default 'unmatched' check (line_status in ('unmatched', 'matched', 'ignored', 'duplicate')),
  matched_txn_id uuid references finly.txn (id),
  matched_by uuid references finly.app_user (id),
  matched_at timestamptz,
  version int not null default 1,
  unique (import_id, line_no),
  check ((line_status = 'matched') = (matched_txn_id is not null))
);
comment on table finly.bank_statement_line is 'Statement lines and their matching to transactions (matched, unmatched, duplicate).';
create index bank_statement_line_amount_idx on finly.bank_statement_line (amount_bidx, value_date);

create table finly.integrity_run (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('scheduled', 'on_demand', 'pre_close', 'restore_drill')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text not null default 'running' check (outcome in ('running', 'clean', 'findings', 'error')),
  journals_checked bigint not null default 0,
  lines_checked bigint not null default 0,
  slices_checked bigint not null default 0,
  findings_count int not null default 0,
  chain_verified_to bigint,
  check ((outcome = 'running') = (finished_at is null))
);
comment on table finly.integrity_run is 'Integrity Verifier runs (AC7): balances recomputed from lines, invariants, hash chains. Never auto-fixes.';

create table finly.exception_finding (
  id uuid primary key default finly.uuid_v7(),
  rule_key text not null check (rule_key ~ '^[a-z][a-z0-9_.]{0,80}$'),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  finding_status text not null default 'open' check (finding_status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  env_entity_id uuid references finly.entity (id),
  txn_id uuid references finly.txn (id),
  open_item_id uuid references finly.open_item (id),
  location_id uuid references finly.location (id),
  integrity_run_id uuid references finly.integrity_run (id),
  fingerprint text not null unique check (length(fingerprint) between 8 and 200),
  summary text not null check (length(summary) <= 300),
  details_enc finly.ciphertext,
  key_version int,
  detected_at timestamptz not null default now(),
  acknowledged_by uuid references finly.app_user (id),
  resolved_by uuid references finly.app_user (id),
  resolved_at timestamptz,
  resolution_note text,
  version int not null default 1,
  check ((details_enc is null) = (key_version is null)),
  check ((finding_status in ('resolved', 'dismissed')) = (resolved_at is not null))
);
comment on table finly.exception_finding is
  'Deterministic exceptions (J8, AC17) and integrity findings. The summary never contains an amount; details are encrypted.';
create index exception_finding_open_idx on finly.exception_finding (env_entity_id, severity)
  where finding_status in ('open', 'acknowledged');

-- Generated documents and sharing ------------------------------------------------------------------------------

create table finly.document (
  id uuid primary key default finly.uuid_v7(),
  kind text not null check (kind in ('message', 'photo_proof', 'pdf', 'secure_pdf')),
  source text not null check (source in ('txn', 'report')),
  txn_id uuid references finly.txn (id),
  report_definition_id uuid references finly.report_definition (id),
  params jsonb not null default '{}',
  template_id uuid references finly.message_template (id),
  storage_key text unique check (storage_key ~ '^[A-Za-z0-9/_.-]{16,200}$'),
  content_hash bytea not null check (octet_length(content_hash) = 32),
  key_version int,
  generated_by uuid not null references finly.app_user (id),
  generated_at timestamptz not null default now(),
  supersedes_document_id uuid references finly.document (id),
  expires_at timestamptz,
  document_status text not null default 'active' check (document_status in ('active', 'expired', 'revoked', 'superseded')),
  check ((source = 'txn') = (txn_id is not null)),
  check ((source = 'report') = (report_definition_id is not null)),
  check ((kind = 'message') = (storage_key is null)),
  check ((storage_key is null) = (key_version is null))
);
comment on table finly.document is
  'Generated proof from authorised data (A3): message, photo proof, PDF, secure PDF. Regeneration creates a new row; a message keeps only its hash.';
create index document_txn_idx on finly.document (txn_id) where txn_id is not null;

create table finly.share_profile (
  id uuid primary key default finly.uuid_v7(),
  owner_user_id uuid not null references finly.app_user (id),
  contact_id uuid not null references finly.contact (id),
  name text not null check (length(name) between 1 and 80),
  default_format text not null check (default_format in ('message', 'photo', 'pdf', 'secure_pdf', 'secure_viewer')),
  allowed_formats text[] not null check (cardinality(allowed_formats) >= 1),
  visible_fields text[] not null default '{}',
  hidden_fields text[] not null default '{}',
  security jsonb not null default '{}',
  require_recipient_verification boolean not null default true,
  step_up_required boolean not null default false,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  check (default_format = any (allowed_formats)),
  check (not (visible_fields && hidden_fields))
);
comment on table finly.share_profile is 'Per-recipient share defaults and limits (Q9).';

create table finly.share_request (
  id uuid primary key default finly.uuid_v7(),
  reference text collate "C" not null unique check (reference ~ '^SH-[0-9]{8}-[0-9]{6}$'),
  initiated_by uuid not null references finly.app_user (id),
  source text not null check (source in ('txn', 'report')),
  txn_id uuid references finly.txn (id),
  report_definition_id uuid references finly.report_definition (id),
  report_params jsonb not null default '{}',
  contact_id uuid not null references finly.contact (id),
  channel text not null check (channel in ('whatsapp', 'share_sheet', 'secure_viewer_link')),
  format text not null check (format in ('message', 'photo', 'pdf', 'secure_pdf', 'secure_viewer')),
  share_profile_id uuid references finly.share_profile (id),
  document_id uuid references finly.document (id),
  visible_fields text[] not null default '{}',
  security_config jsonb not null default '{}',
  content_hash bytea check (octet_length(content_hash) = 32),
  verification_hash bytea check (octet_length(verification_hash) = 32),
  share_status text not null default 'draft' check (share_status in (
    'draft', 'previewed', 'recipient_verified', 'confirmed', 'handed_off', 'cancelled', 'failed', 'invalidated')),
  step_up_method text check (step_up_method in ('biometric', 'mpin', 'password', 'mfa')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  handed_off_at timestamptz,
  cancelled_at timestamptz,
  failure_code text,
  replaces_request_id uuid references finly.share_request (id),
  version int not null default 1,
  check ((source = 'txn') = (txn_id is not null)),
  check ((source = 'report') = (report_definition_id is not null)),
  check (share_status in ('draft', 'cancelled', 'failed', 'invalidated') or content_hash is not null),
  check (share_status not in ('confirmed', 'handed_off') or (verification_hash is not null and confirmed_at is not null)),
  check ((share_status = 'handed_off') = (handed_off_at is not null))
);
comment on table finly.share_request is
  'One share from preview to hand-off (Q2-Q3). The verification is bound to verification_hash; any change invalidates it. WhatsApp hand-off is never called "sent".';
create index share_request_mine_idx on finly.share_request (initiated_by, created_at desc);
create index share_request_txn_idx on finly.share_request (txn_id) where txn_id is not null;

create table finly.share_event (
  id bigint generated always as identity primary key,
  share_request_id uuid not null references finly.share_request (id),
  event text not null check (event in (
    'created', 'previewed', 'recipient_verified', 'user_verified', 'confirmed', 'handed_off', 'cancelled', 'failed',
    'invalidated', 'revoked', 'expired')),
  actor_user_id uuid references finly.app_user (id),
  occurred_at timestamptz not null default now(),
  step_up_method text check (step_up_method in ('biometric', 'mpin', 'password', 'mfa')),
  details jsonb not null default '{}'
);
comment on table finly.share_event is 'Every state change of a share, for share history and audit (Q11). No secrets, no amounts.';
create index share_event_request_idx on finly.share_event (share_request_id);

create table finly.secure_link (
  id uuid primary key default finly.uuid_v7(),
  share_request_id uuid not null references finly.share_request (id),
  token_hash finly.keyed_hash not null unique,
  watermark_text text check (length(watermark_text) <= 200),
  expires_at timestamptz not null,
  max_views int check (max_views > 0),
  view_count int not null default 0 check (view_count >= 0),
  revoked_at timestamptz,
  revoked_by uuid references finly.app_user (id),
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (max_views is null or view_count <= max_views)
);
comment on table finly.secure_link is 'Secure Viewer links: only the token hash is stored; expiry and revocation are enforced on every view.';

create table finly.secure_link_access (
  id bigint generated always as identity primary key,
  secure_link_id uuid not null references finly.secure_link (id),
  accessed_at timestamptz not null default now(),
  outcome text not null check (outcome in ('shown', 'expired', 'revoked', 'limit_reached', 'invalid')),
  ip inet,
  user_agent text check (length(user_agent) <= 300)
);
comment on table finly.secure_link_access is 'Every Secure Viewer access attempt.';
create index secure_link_access_link_idx on finly.secure_link_access (secure_link_id, accessed_at);

-- Operations ------------------------------------------------------------------------------------------------

create table finly.idempotency_record (
  user_id uuid not null references finly.app_user (id),
  key uuid not null,
  device_id uuid references finly.device (id),
  operation text not null check (length(operation) between 1 and 80),
  request_hash bytea not null check (octet_length(request_hash) = 32),
  record_status text not null default 'in_progress' check (record_status in ('in_progress', 'completed', 'failed')),
  result_type text,
  result_id uuid,
  http_status smallint,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days',
  primary key (user_id, key),
  check ((record_status = 'in_progress') = (completed_at is null))
);
comment on table finly.idempotency_record is
  'Exactly-once mutations, online and offline. Stores no response body: a replay re-reads the result under current permissions.';
create index idempotency_record_expiry_idx on finly.idempotency_record (expires_at);

create table finly.sync_review (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null,
  idempotency_key uuid not null,
  reason text not null check (reason in ('conflict', 'stale', 'permission_changed', 'master_inactive', 'validation_failed')),
  details jsonb not null default '{}',
  review_status text not null default 'open' check (review_status in ('open', 'resolved', 'discarded')),
  resolved_by uuid references finly.app_user (id),
  resolved_at timestamptz,
  resolution_txn_id uuid references finly.txn (id),
  created_at timestamptz not null default now(),
  foreign key (user_id, idempotency_key) references finly.idempotency_record (user_id, key),
  check ((review_status = 'open') = (resolved_at is null))
);
comment on table finly.sync_review is 'Offline operations the server could not post as they were: shown to the user for review, never silently dropped (P7).';
create index sync_review_open_idx on finly.sync_review (user_id) where review_status = 'open';

create table finly.notification (
  id uuid primary key default finly.uuid_v7(),
  user_id uuid not null references finly.app_user (id),
  event_key text not null check (event_key ~ '^[a-z][a-z0-9_.]{0,80}$'),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  content_mode text not null check (content_mode in ('full', 'masked', 'generic')),
  resource_type text check (resource_type ~ '^[a-z_]{1,40}$'),
  resource_id uuid,
  created_at timestamptz not null default now(),
  push_status text not null default 'none' check (push_status in ('none', 'queued', 'sent', 'failed')),
  read_at timestamptz,
  dismissed_at timestamptz
);
comment on table finly.notification is
  'Notifications store no amounts or names: the content is rendered when opened, after a fresh permission check (R5).';
create index notification_inbox_idx on finly.notification (user_id, created_at desc) where dismissed_at is null;
create index notification_unread_idx on finly.notification (user_id) where read_at is null;

create table finly.audit_chain_head (
  id smallint primary key check (id = 1),
  last_id bigint not null default 0,
  last_hash bytea not null default '\x'::bytea,
  updated_at timestamptz not null default now()
);
comment on table finly.audit_chain_head is 'Head of the audit hash chain; locked when an audit row is appended.';
insert into finly.audit_chain_head (id) values (1);

create table finly.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references finly.app_user (id),
  actor_session_id uuid references finly.auth_session (id),
  actor_device_id uuid references finly.device (id),
  auth_strength smallint check (auth_strength between 1 and 3),
  action text not null check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  object_type text not null check (object_type ~ '^[a-z_]{1,40}$'),
  object_id uuid,
  env_entity_id uuid references finly.entity (id),
  changes_enc finly.ciphertext,
  key_version int,
  reason text check (length(reason) <= 1000),
  txn_id uuid references finly.txn (id),
  approval_request_id uuid references finly.approval_request (id),
  share_request_id uuid references finly.share_request (id),
  request_id uuid,
  ip inet,
  prev_hash bytea not null,
  row_hash bytea not null check (octet_length(row_hash) = 32),
  hash_key_version int not null,
  check ((changes_enc is null) = (key_version is null))
);
comment on table finly.audit_log is
  'Tamper-evident audit trail (U2): who, what, when, before/after (encrypted), why, from which session and device. Append-only, HMAC-chained.';
create index audit_log_object_idx on finly.audit_log (object_id, occurred_at) where object_id is not null;
create index audit_log_env_idx on finly.audit_log (env_entity_id, occurred_at desc) where env_entity_id is not null;
create index audit_log_actor_idx on finly.audit_log (actor_user_id, occurred_at desc);
create index audit_log_txn_idx on finly.audit_log (txn_id) where txn_id is not null;

create trigger audit_log_immutable before update or delete on finly.audit_log
  for each row execute function finly.tg_immutable();
create trigger share_event_immutable before update or delete on finly.share_event
  for each row execute function finly.tg_immutable();
create trigger secure_link_access_immutable before update or delete on finly.secure_link_access
  for each row execute function finly.tg_immutable();
create trigger share_request_no_delete before delete on finly.share_request for each row execute function finly.tg_no_delete();
create trigger document_no_delete before delete on finly.document for each row execute function finly.tg_no_delete();
create trigger attachment_no_delete before delete on finly.attachment for each row execute function finly.tg_no_delete();
create trigger attachment_link_no_delete before delete on finly.attachment_link
  for each row execute function finly.tg_no_delete();
create trigger reconciliation_no_delete before delete on finly.reconciliation for each row execute function finly.tg_no_delete();
create trigger exception_finding_no_delete before delete on finly.exception_finding
  for each row execute function finly.tg_no_delete();

create trigger attachment_version before update on finly.attachment for each row execute function finly.tg_version();
create trigger reconciliation_version before update on finly.reconciliation for each row execute function finly.tg_version();
create trigger bank_statement_import_version before update on finly.bank_statement_import
  for each row execute function finly.tg_version();
create trigger bank_statement_line_version before update on finly.bank_statement_line
  for each row execute function finly.tg_version();
create trigger exception_finding_version before update on finly.exception_finding
  for each row execute function finly.tg_version();
create trigger share_request_version before update on finly.share_request for each row execute function finly.tg_version();
create trigger share_profile_std before insert or update on finly.share_profile for each row execute function finly.tg_std();

-- Commit-time ledger checks (functions in 0005) — they need audit_log, so they are created here.
create constraint trigger journal_structure_check after insert on finly.journal
  deferrable initially deferred
  for each row execute function finly.tg_journal_structure_check();
create constraint trigger txn_status_audit_check after update of status on finly.txn
  deferrable initially deferred
  for each row execute function finly.tg_txn_audit_check();
