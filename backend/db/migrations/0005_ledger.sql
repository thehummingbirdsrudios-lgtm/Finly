-- 0005 events and ledger: master transactions, legs, journals, lines, snapshots, open items, settlements, custody,
-- approvals, periods. Design: docs/database/01-architecture.md §1.6-1.9, 03-schema.md "Events and ledger",
-- 06-transactions-concurrency-sync.md. Data impact: new empty tables. Recovery: forward fix.

set local role finly_owner;

-- State machine ---------------------------------------------------------------------------------------------------

create table finly.txn_status_transition (
  from_status text not null,
  to_status text not null,
  primary key (from_status, to_status)
);
comment on table finly.txn_status_transition is 'Allowed master-transaction status changes (J5). Validating and Posting happen inside one database transaction and are never stored.';

insert into finly.txn_status_transition (from_status, to_status) values
  ('draft', 'pending_approval'), ('draft', 'posted'), ('draft', 'cancelled'),
  ('pending_approval', 'approved'), ('pending_approval', 'rejected'), ('pending_approval', 'draft'),
  ('pending_approval', 'cancelled'),
  ('approved', 'posted'), ('approved', 'failed'), ('approved', 'cancelled'),
  ('failed', 'draft'), ('failed', 'posted'), ('failed', 'cancelled'),
  ('posted', 'reversed'), ('posted', 'corrected');

create table finly.posting_rule_version (
  id uuid primary key default finly.uuid_v7(),
  intent_type text not null,
  rule_version int not null check (rule_version > 0),
  engine_version text not null,
  definition jsonb not null,
  rule_status text not null default 'active' check (rule_status in ('draft', 'active', 'retired')),
  created_by uuid references finly.app_user (id),
  approved_by uuid references finly.app_user (id),
  created_at timestamptz not null default now(),
  unique (intent_type, rule_version)
);
comment on table finly.posting_rule_version is 'Versioned posting rules (AC15): which engine version posts each intent, and how. Every journal records the version used.';
create unique index posting_rule_one_active on finly.posting_rule_version (intent_type) where rule_status = 'active';

-- Master transaction --------------------------------------------------------------------------------------------

create table finly.txn (
  id uuid primary key default finly.uuid_v7(),
  reference text collate "C" not null unique check (reference ~ '^TX-[0-9]{8}-[0-9]{6}$'),
  txn_type_id uuid not null references finly.txn_type (id),
  intent_type text not null,
  status text not null default 'draft' check (status in (
    'draft', 'pending_approval', 'approved', 'posted', 'rejected', 'failed', 'cancelled', 'reversed', 'corrected')),
  primary_env_id uuid not null references finly.entity (id),
  value_date date not null,
  value_time time,
  entered_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  posted_at timestamptz,
  currency char(3) not null default 'INR' check (currency = 'INR'),
  reason text check (length(reason) <= 500),
  search_tsv tsvector generated always as (
    to_tsvector('simple', coalesce(reason, '') || ' ' || reference)) stored,
  payment_method_id uuid,
  payment_method_list text not null generated always as ('payment_method') stored,
  expense_event_id uuid references finly.expense_event (id),
  options jsonb not null default '{}',
  confidentiality_level_id uuid references finly.confidentiality_level (id),
  created_by_user_id uuid not null references finly.app_user (id),
  handled_by_entity_id uuid references finly.entity (id),
  client_ref uuid,
  device_id uuid references finly.device (id),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id(),
  unique (id, value_date),
  foreign key (payment_method_list, payment_method_id) references finly.lookup_value (list_key, id),
  check ((status in ('posted', 'reversed', 'corrected')) <= (posted_at is not null)),
  check (status <> 'approved' or approved_at is not null)
);
comment on table finly.txn is 'Master transaction: one real-world event (H7). Its accounting is in journal/journal_line, produced only when posted.';
comment on column finly.txn.reason is
  'The shared description of the event, visible to every participant environment; private remarks belong in txn_note.';
comment on column finly.txn.client_ref is 'The phone''s local id for an offline entry; unique per user so a re-sync never duplicates.';
create unique index txn_client_ref_key on finly.txn (created_by_user_id, client_ref) where client_ref is not null;
create index txn_pending_idx on finly.txn (primary_env_id, status, value_date desc)
  where status in ('draft', 'pending_approval', 'approved', 'failed');
create index txn_search_idx on finly.txn using gin (search_tsv);
create index txn_change_xid_idx on finly.txn (change_xid);

create table finly.txn_entity (
  txn_id uuid not null,
  entity_id uuid not null references finly.entity (id),
  role text not null check (role in (
    'payer', 'owner', 'receiver', 'giver', 'holder', 'counterparty', 'lender', 'borrower', 'settler')),
  value_date date not null,
  ack_status text not null default 'not_required' check (ack_status in (
    'not_required', 'pending', 'acknowledged', 'disputed')),
  ack_by uuid references finly.app_user (id),
  ack_at timestamptz,
  ack_note text check (length(ack_note) <= 500),
  primary key (txn_id, entity_id, role),
  foreign key (txn_id, value_date) references finly.txn (id, value_date) on update cascade,
  check ((ack_status in ('acknowledged', 'disputed')) = (ack_at is not null))
);
comment on table finly.txn_entity is
  'Entities involved in an event and how. Drives visibility: a viewer sees an event through the participations of environments they may enter.';
create index txn_entity_env_date_idx on finly.txn_entity (entity_id, value_date desc, txn_id desc);

create table finly.txn_leg (
  id uuid primary key default finly.uuid_v7(),
  txn_id uuid not null references finly.txn (id),
  seq smallint not null check (seq between 1 and 999),
  leg_kind text not null check (leg_kind in ('source', 'destination', 'allocation')),
  entity_id uuid not null references finly.entity (id),
  location_id uuid references finly.location (id),
  fund_id uuid,
  category_id uuid references finly.category (id),
  counterparty_entity_id uuid references finly.entity (id),
  expense_event_id uuid references finly.expense_event (id),
  amount_enc finly.ciphertext not null,
  amount_bidx finly.keyed_hash not null,
  amount_bucket finly.keyed_hash not null,
  key_version int not null,
  treatment text check (treatment in ('withdrawal', 'owes')),
  attributes jsonb not null default '{}',
  unique (txn_id, leg_kind, seq),
  foreign key (fund_id, entity_id) references finly.fund (id, entity_id)
);
comment on table finly.txn_leg is
  'The business description of an event: sources (whose money, from where), destinations, and allocations (whose expense, which category). Frozen once submitted.';
create index txn_leg_txn_idx on finly.txn_leg (txn_id);
create index txn_leg_amount_idx on finly.txn_leg (amount_bidx);
create index txn_leg_amount_band_idx on finly.txn_leg (amount_bucket);
comment on column finly.txn_leg.amount_bidx is
  'HMAC of the amount with a per-environment key: exact-amount search over the legs a viewer may see, never the event total.';

create table finly.txn_note (
  id uuid primary key default finly.uuid_v7(),
  txn_id uuid not null references finly.txn (id),
  env_entity_id uuid not null references finly.entity (id),
  note_enc finly.ciphertext not null,
  key_version int not null,
  created_by uuid not null references finly.app_user (id),
  created_at timestamptz not null default now()
);
comment on table finly.txn_note is 'Private notes on an event, one environment at a time: a Mint note is never shown to someone who sees only Krish''s side.';
create index txn_note_txn_idx on finly.txn_note (txn_id);

create table finly.txn_link (
  from_txn_id uuid not null references finly.txn (id),
  to_txn_id uuid not null references finly.txn (id),
  kind text not null check (kind in (
    'reverses', 'corrects', 'partially_reverses', 'refunds', 'replaces', 'duplicate_of', 'confirms')),
  created_at timestamptz not null default now(),
  created_by uuid not null references finly.app_user (id),
  primary key (from_txn_id, to_txn_id, kind),
  check (from_txn_id <> to_txn_id)
);
comment on table finly.txn_link is 'Relationships between events: reversal, correction, partial reversal, refund, replacement.';
create unique index txn_link_reversed_once on finly.txn_link (to_txn_id) where kind = 'reverses';
create index txn_link_to_idx on finly.txn_link (to_txn_id, kind);

create table finly.txn_tag (
  txn_id uuid not null references finly.txn (id),
  tag_id uuid not null references finly.tag (id),
  primary key (txn_id, tag_id)
);
comment on table finly.txn_tag is 'Transaction tags.';

create table finly.custom_field_value (
  id uuid primary key default finly.uuid_v7(),
  field_id uuid not null references finly.custom_field_def (id),
  txn_id uuid references finly.txn (id),
  txn_leg_id uuid references finly.txn_leg (id),
  entity_id uuid references finly.entity (id),
  location_id uuid references finly.location (id),
  expense_event_id uuid references finly.expense_event (id),
  value_text text check (length(value_text) <= 2000),
  value_number bigint,
  value_date date,
  value_bool boolean,
  value_ref uuid,
  value_enc finly.ciphertext,
  key_version int,
  version int not null default 1,
  check (num_nonnulls(txn_id, txn_leg_id, entity_id, location_id, expense_event_id) = 1),
  check (num_nonnulls(value_text, value_number, value_date, value_bool, value_ref, value_enc) <= 1),
  check ((value_enc is null) = (key_version is null))
);
comment on table finly.custom_field_value is 'Custom field values; sensitive fields (and every amount field) are stored only encrypted.';
create unique index custom_field_value_key on finly.custom_field_value (
  field_id, coalesce(txn_id, txn_leg_id, entity_id, location_id, expense_event_id));

create table finly.approval_rule (
  id uuid primary key default finly.uuid_v7(),
  name text not null check (length(name) between 1 and 120),
  env_entity_id uuid references finly.entity (id),
  txn_type_id uuid references finly.txn_type (id),
  location_id uuid references finly.location (id),
  min_amount bigint check (min_amount > 0 and min_amount <= 999999999999),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) >= 1),
  segregation boolean not null default true,
  priority int not null default 0,
  status finly.lifecycle not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  created_by uuid references finly.app_user (id),
  updated_at timestamptz not null default now(),
  change_xid xid8 not null default pg_current_xact_id()
);
comment on table finly.approval_rule is
  'Who must approve what (J6): scope, threshold in whole rupees (policy, not a financial record), ordered steps, segregation of duties.';

-- Periods and the hash-chain head -------------------------------------------------------------------------------

create table finly.accounting_period (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null references finly.entity (id),
  period_start date not null,
  period_end date not null,
  period_status text not null default 'open' check (period_status in ('open', 'closed')),
  closed_at timestamptz,
  closed_by uuid references finly.app_user (id),
  version int not null default 1,
  updated_at timestamptz not null default now(),
  unique (entity_id, period_start),
  unique (id, entity_id),
  check (period_end >= period_start),
  check ((period_status = 'closed') = (closed_at is not null))
);
comment on table finly.accounting_period is 'Monthly accounting periods per entity (AC12). Journals post only into open periods.';

create table finly.journal_chain_head (
  id smallint primary key check (id = 1),
  last_seq bigint not null default 0,
  last_hash bytea not null default '\x'::bytea,
  updated_at timestamptz not null default now()
);
comment on table finly.journal_chain_head is 'Head of the global journal hash chain; locked by every posting for a few milliseconds.';
insert into finly.journal_chain_head (id) values (1);

-- Journals and lines --------------------------------------------------------------------------------------------

create table finly.journal (
  id uuid primary key default finly.uuid_v7(),
  txn_id uuid not null references finly.txn (id),
  entity_id uuid not null references finly.entity (id),
  step smallint not null check (step between 1 and 99),
  kind text not null check (kind in (
    'standard', 'transfer', 'settlement', 'opening', 'adjusting', 'closing', 'reversal', 'correction')),
  period_id uuid not null,
  value_date date not null,
  posted_at timestamptz not null default now(),
  posted_by_user_id uuid not null references finly.app_user (id),
  posting_rule_version_id uuid references finly.posting_rule_version (id),
  reversal_of_journal_id uuid,
  chain_seq bigint not null unique check (chain_seq > 0),
  prev_hash bytea not null,
  content_hash bytea not null check (octet_length(content_hash) = 32),
  hash_key_version int not null,
  unique (id, entity_id, value_date),
  unique (id, entity_id),
  unique (txn_id, entity_id, step),
  foreign key (period_id, entity_id) references finly.accounting_period (id, entity_id),
  foreign key (reversal_of_journal_id, entity_id) references finly.journal (id, entity_id),
  check ((kind = 'reversal') = (reversal_of_journal_id is not null))
);
comment on table finly.journal is
  'One balanced journal per entity per step of an event (AC0). Immutable; hash-chained; reversed only by a linked mirror.';
create unique index journal_reversed_once on finly.journal (reversal_of_journal_id) where reversal_of_journal_id is not null;

create table finly.journal_line (
  id uuid primary key default finly.uuid_v7(),
  journal_id uuid not null,
  entity_id uuid not null,
  value_date date not null,
  line_no smallint not null check (line_no between 1 and 999),
  ledger_account_id uuid not null,
  fund_id uuid not null,
  side finly.side not null,
  amount_enc finly.ciphertext not null,
  key_version int not null,
  location_id uuid references finly.location (id),
  counterparty_entity_id uuid references finly.entity (id),
  category_id uuid references finly.category (id),
  expense_event_id uuid references finly.expense_event (id),
  holder_person_id uuid references finly.entity (id),
  txn_leg_id uuid references finly.txn_leg (id),
  memo_enc finly.ciphertext,
  unique (journal_id, line_no),
  foreign key (journal_id, entity_id, value_date) references finly.journal (id, entity_id, value_date),
  foreign key (ledger_account_id, entity_id) references finly.ledger_account (id, entity_id),
  foreign key (fund_id, entity_id) references finly.fund (id, entity_id),
  check (counterparty_entity_id is null or counterparty_entity_id <> entity_id)
);
comment on table finly.journal_line is
  'One debit or credit with every dimension (AC5). The account and the fund must belong to the line''s own entity (composite keys). Amount: encrypted positive whole rupees.';
create index journal_line_location_idx on finly.journal_line (location_id, value_date desc, journal_id)
  where location_id is not null;
create index journal_line_account_idx on finly.journal_line (entity_id, ledger_account_id, value_date desc);
create index journal_line_counterparty_idx on finly.journal_line (entity_id, counterparty_entity_id, value_date desc)
  where counterparty_entity_id is not null;
create index journal_line_leg_idx on finly.journal_line (txn_leg_id) where txn_leg_id is not null;

-- Balance snapshots ---------------------------------------------------------------------------------------------

create table finly.balance_slice (
  id uuid primary key default finly.uuid_v7(),
  entity_id uuid not null,
  ledger_account_id uuid not null,
  fund_id uuid not null,
  location_id uuid references finly.location (id),
  counterparty_entity_id uuid references finly.entity (id),
  category_id uuid references finly.category (id),
  created_at timestamptz not null default now(),
  unique nulls not distinct (entity_id, ledger_account_id, fund_id, location_id, counterparty_entity_id, category_id),
  unique (id, entity_id),
  foreign key (ledger_account_id, entity_id) references finly.ledger_account (id, entity_id),
  foreign key (fund_id, entity_id) references finly.fund (id, entity_id)
);
comment on table finly.balance_slice is 'The dimension tuple a balance is kept for (entity, account, fund, location, counterparty, category).';
create index balance_slice_location_idx on finly.balance_slice (location_id) where location_id is not null;

create table finly.balance_current (
  slice_id uuid primary key,
  entity_id uuid not null,
  balance_enc finly.ciphertext not null,
  line_count bigint not null default 0 check (line_count >= 0),
  last_journal_id uuid references finly.journal (id),
  key_version int not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  foreign key (slice_id, entity_id) references finly.balance_slice (id, entity_id)
);
comment on table finly.balance_current is
  'Encrypted running balance (Dr - Cr) per slice. Updated only in the posting transaction under a row lock; recomputed by the Integrity Verifier.';

create table finly.balance_period (
  slice_id uuid not null,
  period_id uuid not null,
  entity_id uuid not null,
  debits_enc finly.ciphertext not null,
  credits_enc finly.ciphertext not null,
  closing_enc finly.ciphertext,
  line_count bigint not null default 0 check (line_count >= 0),
  key_version int not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (slice_id, period_id),
  foreign key (slice_id, entity_id) references finly.balance_slice (id, entity_id),
  foreign key (period_id, entity_id) references finly.accounting_period (id, entity_id)
);
comment on table finly.balance_period is
  'Encrypted movement per slice per period; closing fixed at close and used as the next opening (Explain Balance).';
create index balance_period_entity_idx on finly.balance_period (entity_id, period_id);

-- Open items and settlements ------------------------------------------------------------------------------------

create table finly.open_item (
  id uuid primary key default finly.uuid_v7(),
  reference text collate "C" not null unique check (reference ~ '^OI-[0-9]{8}-[0-9]{6}$'),
  kind text not null check (kind in ('interentity', 'supplier_payable', 'customer_receivable', 'advance', 'loan')),
  debtor_entity_id uuid not null references finly.entity (id),
  creditor_entity_id uuid not null references finly.entity (id),
  debtor_role text,
  creditor_role text,
  debtor_fund_id uuid,
  creditor_fund_id uuid,
  origin_txn_id uuid not null references finly.txn (id),
  original_enc finly.ciphertext not null,
  remaining_enc finly.ciphertext not null,
  key_version int not null,
  item_status text not null default 'open' check (item_status in (
    'open', 'partially_settled', 'settled', 'written_off', 'reversed')),
  due_date date,
  reason text not null check (length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  version int not null default 1,
  change_xid xid8 not null default pg_current_xact_id(),
  foreign key (debtor_fund_id, debtor_entity_id) references finly.fund (id, entity_id),
  foreign key (creditor_fund_id, creditor_entity_id) references finly.fund (id, entity_id),
  check (debtor_entity_id <> creditor_entity_id),
  check ((item_status in ('settled', 'written_off')) = (settled_at is not null))
);
comment on table finly.open_item is
  'An obligation with explicit direction: the debtor owes the creditor (AC11). Remaining = original - settlement allocations, maintained under lock and verified.';
create index open_item_creditor_idx on finly.open_item (creditor_entity_id, due_date)
  where item_status in ('open', 'partially_settled');
create index open_item_debtor_idx on finly.open_item (debtor_entity_id, due_date)
  where item_status in ('open', 'partially_settled');
create index open_item_origin_idx on finly.open_item (origin_txn_id);

create table finly.open_item_origin (
  open_item_id uuid not null references finly.open_item (id),
  journal_line_id uuid not null references finly.journal_line (id),
  side text not null check (side in ('debtor', 'creditor')),
  primary key (open_item_id, journal_line_id)
);
comment on table finly.open_item_origin is
  'The journal lines an open item came from, on each side that keeps books (AC11); an expense paid from two sources has two per side.';
create trigger open_item_origin_immutable before update or delete on finly.open_item_origin
  for each row execute function finly.tg_immutable();

create table finly.settlement_allocation (
  id uuid primary key default finly.uuid_v7(),
  settlement_txn_id uuid not null references finly.txn (id),
  open_item_id uuid not null references finly.open_item (id),
  kind text not null check (kind in ('payment', 'offset', 'write_off', 'advance_use', 'advance_return', 'reversal')),
  amount_enc finly.ciphertext not null,
  key_version int not null,
  reversal_of_id uuid references finly.settlement_allocation (id),
  created_at timestamptz not null default now(),
  check ((kind = 'reversal') = (reversal_of_id is not null))
);
comment on table finly.settlement_allocation is
  'Which settlement closed how much of which open item: one payment many items, one item many payments (RULEBOOK-01 §32-35). Never updated.';
create index settlement_allocation_item_idx on finly.settlement_allocation (open_item_id);
create index settlement_allocation_txn_idx on finly.settlement_allocation (settlement_txn_id);
create unique index settlement_allocation_reversed_once on finly.settlement_allocation (reversal_of_id)
  where reversal_of_id is not null;

-- Custody, approvals, period closes -----------------------------------------------------------------------------

create table finly.custody_event (
  id uuid primary key default finly.uuid_v7(),
  txn_id uuid not null references finly.txn (id),
  entity_id uuid not null references finly.entity (id),
  fund_id uuid not null,
  from_location_id uuid not null references finly.location (id),
  to_location_id uuid not null references finly.location (id),
  from_holder_person_id uuid references finly.entity (id),
  to_holder_person_id uuid references finly.entity (id),
  amount_enc finly.ciphertext not null,
  key_version int not null,
  custody_status text not null check (custody_status in (
    'recorded', 'awaiting_confirmation', 'confirmed', 'disputed', 'cancelled')),
  initiated_by uuid not null references finly.app_user (id),
  initiated_at timestamptz not null default now(),
  confirmed_by uuid references finly.app_user (id),
  confirmed_at timestamptz,
  dispute_reason text check (length(dispute_reason) <= 500),
  version int not null default 1,
  foreign key (fund_id, entity_id) references finly.fund (id, entity_id),
  check (from_location_id <> to_location_id),
  check ((custody_status = 'confirmed') = (confirmed_at is not null)),
  check ((custody_status = 'disputed') <= (dispute_reason is not null))
);
comment on table finly.custody_event is
  'A handover step: from holder/location to holder/location, owner and fund unchanged (H10). Confirmation is an optional policy, off by default (F2).';
create index custody_event_awaiting_idx on finly.custody_event (to_holder_person_id)
  where custody_status = 'awaiting_confirmation';
create index custody_event_txn_idx on finly.custody_event (txn_id);

create table finly.approval_request (
  id uuid primary key default finly.uuid_v7(),
  target_type text not null check (target_type in ('txn', 'config_change', 'period_reopen', 'share', 'access_grant')),
  txn_id uuid references finly.txn (id),
  target_id uuid not null,
  approval_rule_id uuid references finly.approval_rule (id),
  step_no smallint not null default 1 check (step_no between 1 and 20),
  required_permission text not null,
  request_status text not null default 'pending' check (request_status in (
    'pending', 'approved', 'rejected', 'withdrawn', 'superseded')),
  requested_by uuid not null references finly.app_user (id),
  requested_at timestamptz not null default now(),
  decided_by uuid references finly.app_user (id),
  decided_at timestamptz,
  comment text check (length(comment) <= 1000),
  step_up_method text check (step_up_method in ('biometric', 'mpin', 'password', 'mfa')),
  version int not null default 1,
  check ((target_type = 'txn') = (txn_id is not null)),
  check (txn_id is null or txn_id = target_id),
  check ((request_status in ('approved', 'rejected')) = (decided_by is not null and decided_at is not null))
);
comment on table finly.approval_request is 'One approval step for a transaction or a sensitive change (J6). The maker never approves their own request under segregation.';
create index approval_request_inbox_idx on finly.approval_request (required_permission, requested_at)
  where request_status = 'pending';
create index approval_request_txn_idx on finly.approval_request (txn_id) where txn_id is not null;

create table finly.period_close_run (
  id uuid primary key default finly.uuid_v7(),
  period_id uuid not null references finly.accounting_period (id),
  kind text not null check (kind in ('close', 'reopen')),
  outcome text not null check (outcome in ('clean', 'needs_review', 'critical', 'completed')),
  checklist jsonb not null default '{}',
  closing_txn_id uuid references finly.txn (id),
  reason text check (length(reason) <= 1000),
  performed_by uuid not null references finly.app_user (id),
  performed_at timestamptz not null default now(),
  step_up_method text check (step_up_method in ('biometric', 'mpin', 'password', 'mfa')),
  check (kind <> 'reopen' or reason is not null)
);
comment on table finly.period_close_run is 'Month Close Assistant runs and reopenings, with their checklist results (no amounts).';
create index period_close_run_period_idx on finly.period_close_run (period_id);

-- Reference numbers --------------------------------------------------------------------------------------------

create function finly.next_reference(p_prefix text, p_day date) returns text
language sql volatile security definer set search_path = finly, pg_temp
as $$
  insert into finly.reference_counter as c (prefix, day, last_value) values (p_prefix, p_day, 1)
  on conflict (prefix, day) do update set last_value = c.last_value + 1
  returning p_prefix || '-' || to_char(p_day, 'YYYYMMDD') || '-' || lpad(c.last_value::text, 6, '0')
$$;
comment on function finly.next_reference(text, date) is
  'Next human reference (TX-20261008-000001). The counter row is locked until commit, so a rollback returns the number: no gaps.';

-- Guards ------------------------------------------------------------------------------------------------------

create function finly.tg_txn_guard() returns trigger
language plpgsql
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
  if old.status <> 'draft' then
    -- After submission only the lifecycle may move; what was submitted is what posts (J5, H15).
    if (to_jsonb(new) - movable) is distinct from (to_jsonb(old) - movable) then
      raise exception using errcode = 'F1010', message = 'A submitted transaction cannot be edited; withdraw it to draft or correct it.';
    end if;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  new.change_xid := pg_current_xact_id();
  return new;
end
$$;
create trigger txn_guard before update on finly.txn for each row execute function finly.tg_txn_guard();
create trigger txn_no_delete before delete on finly.txn for each row execute function finly.tg_no_delete();

create function finly.tg_txn_child_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  parent_status text;
begin
  select status into parent_status from finly.txn
  where id = case when tg_op = 'DELETE' then old.txn_id else new.txn_id end;
  if tg_table_name = 'txn_entity' and tg_op = 'UPDATE' then
    -- Acknowledgement columns may change at any time; value_date follows the draft's date (cascade).
    if (to_jsonb(new) - array['ack_status', 'ack_by', 'ack_at', 'ack_note', 'value_date'])
       is distinct from (to_jsonb(old) - array['ack_status', 'ack_by', 'ack_at', 'ack_note', 'value_date'])
       or (new.value_date is distinct from old.value_date and parent_status <> 'draft') then
      raise exception using errcode = 'F1010', message = 'Participants of a submitted transaction cannot change.';
    end if;
    return new;
  end if;
  if tg_table_name = 'txn_entity' and tg_op = 'INSERT' and parent_status in ('draft', 'approved', 'failed') then
    return new;
  end if;
  if tg_table_name = 'txn_leg' and tg_op <> 'DELETE' and new.fund_id is null
     and finly.entity_kind_of(new.entity_id) <> 'party' then
    -- The fund decides who may see the leg (hidden funds, L9); it is always resolved, never left implicit.
    raise exception using errcode = 'F1006', message = 'Say which fund this money belongs to.';
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
create trigger txn_leg_guard before insert or update or delete on finly.txn_leg
  for each row execute function finly.tg_txn_child_guard();
create trigger txn_entity_guard before insert or update or delete on finly.txn_entity
  for each row execute function finly.tg_txn_child_guard();
create trigger txn_link_immutable before update or delete on finly.txn_link
  for each row execute function finly.tg_immutable();

create function finly.tg_period_guard() returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from finly.accounting_period p
             where p.entity_id = new.entity_id and p.id <> new.id
               and p.period_start <= new.period_end and new.period_start <= p.period_end) then
    raise exception using errcode = 'F1002', message = 'Accounting periods of one entity cannot overlap.';
  end if;
  if tg_op = 'UPDATE' then
    if (new.period_start, new.period_end) is distinct from (old.period_start, old.period_end) then
      raise exception using errcode = 'F1001', message = 'The dates of an accounting period cannot change.';
    end if;
    -- Months close in order and reopen in reverse order, so "closing = next opening" always holds.
    if new.period_status = 'closed' and old.period_status = 'open'
       and exists (select 1 from finly.accounting_period p where p.entity_id = new.entity_id
                   and p.period_start < new.period_start and p.period_status = 'open') then
      raise exception using errcode = 'F1002', message = 'Close the earlier months first.';
    end if;
    if new.period_status = 'open' and old.period_status = 'closed'
       and exists (select 1 from finly.accounting_period p where p.entity_id = new.entity_id
                   and p.period_start > new.period_start and p.period_status = 'closed') then
      raise exception using errcode = 'F1002', message = 'Reopen the later months first.';
    end if;
    new.version := old.version + 1;
    new.updated_at := now();
  end if;
  return new;
end
$$;
create trigger accounting_period_guard before insert or update on finly.accounting_period
  for each row execute function finly.tg_period_guard();
create trigger accounting_period_no_delete before delete on finly.accounting_period
  for each row execute function finly.tg_no_delete();

create function finly.tg_journal_insert_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  p record;
  e record;
begin
  if exists (select 1 from finly.emergency_control where control_key = 'freeze_financial_writes' and active) then
    raise exception using errcode = 'F1003', message = 'Financial writes are paused by an administrator.';
  end if;
  select kind, status into e from finly.entity where id = new.entity_id;
  if e.kind = 'party' then
    raise exception using errcode = 'F1012', message = 'Outside parties keep no books; no journal can be posted for them.';
  end if;
  if e.status <> 'active' and new.kind <> 'reversal' then
    raise exception using errcode = 'F1004', message = 'This entity is inactive or archived and takes no new postings.';
  end if;
  -- FOR SHARE: a posting and a period close on the same month serialise (06 §6.3).
  select period_start, period_end, period_status into p from finly.accounting_period where id = new.period_id for share;
  if p.period_status <> 'open' then
    raise exception using errcode = 'F1002', message = 'This period is closed. Record the correction in the open period.';
  end if;
  if new.value_date not between p.period_start and p.period_end then
    raise exception using errcode = 'F1002', message = 'The journal date is outside its accounting period.';
  end if;
  return new;
end
$$;
create trigger journal_insert_guard before insert on finly.journal
  for each row execute function finly.tg_journal_insert_guard();
create trigger journal_immutable before update or delete on finly.journal
  for each row execute function finly.tg_immutable();

create function finly.tg_journal_line_insert_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  a record;
begin
  select status, requires_location, requires_counterparty, requires_category, name into a
  from finly.ledger_account where id = new.ledger_account_id;
  if a.status <> 'active' then
    raise exception using errcode = 'F1004', message = format('The account "%s" is inactive and takes no new lines.', a.name);
  end if;
  if (select status from finly.fund where id = new.fund_id) <> 'active' then
    raise exception using errcode = 'F1004', message = 'This fund is inactive and takes no new lines.';
  end if;
  if a.requires_location <> (new.location_id is not null) then
    raise exception using errcode = 'F1006', message = case when a.requires_location
      then 'A cash, bank or wallet line needs its location.' else 'Only cash, bank and wallet lines carry a location.' end;
  end if;
  if new.location_id is not null and (select status from finly.location where id = new.location_id) <> 'active' then
    raise exception using errcode = 'F1004', message = 'This location is inactive and takes no new money.';
  end if;
  if a.requires_counterparty and new.counterparty_entity_id is null then
    raise exception using errcode = 'F1006', message = 'This line needs the other party (who owes or is owed).';
  end if;
  if a.requires_category and new.category_id is null then
    raise exception using errcode = 'F1006', message = 'An income or expense line needs a category.';
  end if;
  return new;
end
$$;
create trigger journal_line_insert_guard before insert on finly.journal_line
  for each row execute function finly.tg_journal_line_insert_guard();

create function finly.tg_journal_line_immutable() returns trigger
language plpgsql
as $$
begin
  -- The one exception (05 §5.7): key-rotation re-encryption by the system role, ciphertext and key version only.
  if tg_op = 'UPDATE' and finly.is_key_rotation(to_jsonb(old), to_jsonb(new)) then
    return new;
  end if;
  raise exception using errcode = 'F1001', message = 'Journal lines are immutable history.',
    hint = 'Record a reversal, correction or adjustment instead.';
end
$$;
create trigger journal_line_immutable before update or delete on finly.journal_line
  for each row execute function finly.tg_journal_line_immutable();

-- The id of the current transaction as a 32-bit xid (comparable with xmin).
create function finly.current_xid() returns xid
language sql stable
as $$ select ((pg_current_xact_id()::text::bigint) % 4294967296)::text::xid $$;

create function finly.tg_journal_structure_check() returns trigger
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
                 where txn_id = new.txn_id and xmin = finly.current_xid()) then
    raise exception using errcode = 'F1009', message = 'A posting must write its audit record in the same transaction.';
  end if;
  return null;
end
$$;

create function finly.tg_txn_legs_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  -- Checked at commit, however the event got its status: a submitted event says where the money came from and went.
  if new.status not in ('draft', 'cancelled') and not exists (select 1 from finly.txn_leg where txn_id = new.id) then
    raise exception using errcode = 'F1005', message = 'Say where the money came from and where it went before submitting.';
  end if;
  return null;
end
$$;
create constraint trigger txn_legs_check after insert or update of status on finly.txn
  deferrable initially deferred
  for each row execute function finly.tg_txn_legs_check();

create function finly.tg_txn_audit_check() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and not exists (select 1 from finly.audit_log
                     where txn_id = new.id and xmin = finly.current_xid()) then
    raise exception using errcode = 'F1009',
      message = 'A change of transaction status must write its audit record in the same transaction.';
  end if;
  return null;
end
$$;

create function finly.tg_balance_period_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
begin
  if (select period_status from finly.accounting_period where id = old.period_id) = 'closed' then
    raise exception using errcode = 'F1002', message = 'The balances of a closed period cannot change.';
  end if;
  if old.closing_enc is not null then
    raise exception using errcode = 'F1001', message = 'A fixed closing balance cannot change.';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end
$$;
create trigger balance_period_guard before update on finly.balance_period
  for each row execute function finly.tg_balance_period_guard();

create function finly.tg_balance_current_stamp() returns trigger
language plpgsql
as $$
begin
  if (new.slice_id, new.entity_id) is distinct from (old.slice_id, old.entity_id) then
    raise exception using errcode = 'F1001', message = 'A balance belongs to one slice for ever.';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end
$$;
create trigger balance_current_stamp before update on finly.balance_current
  for each row execute function finly.tg_balance_current_stamp();
create trigger balance_current_no_delete before delete on finly.balance_current
  for each row execute function finly.tg_no_delete();
create trigger balance_period_no_delete before delete on finly.balance_period
  for each row execute function finly.tg_no_delete();
create trigger balance_slice_immutable before update or delete on finly.balance_slice
  for each row execute function finly.tg_immutable();

create function finly.tg_open_item_guard() returns trigger
language plpgsql
as $$
declare
  movable text[] := array['remaining_enc', 'key_version', 'item_status', 'settled_at', 'version', 'change_xid'];
begin
  if finly.is_key_rotation(to_jsonb(old), to_jsonb(new)) then
    return new;
  end if;
  if (to_jsonb(new) - movable) is distinct from (to_jsonb(old) - movable) then
    raise exception using errcode = 'F1001', message = 'Only the remaining amount and status of an open item can change.';
  end if;
  if old.item_status in ('written_off', 'reversed') then
    raise exception using errcode = 'F1007', message = 'A written-off or reversed open item cannot change.';
  end if;
  new.version := old.version + 1;
  new.change_xid := pg_current_xact_id();
  return new;
end
$$;
create trigger open_item_guard before update on finly.open_item for each row execute function finly.tg_open_item_guard();
create trigger open_item_no_delete before delete on finly.open_item for each row execute function finly.tg_no_delete();
create trigger settlement_allocation_immutable before update or delete on finly.settlement_allocation
  for each row execute function finly.tg_immutable();

create function finly.tg_custody_guard() returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array['custody_status', 'confirmed_by', 'confirmed_at', 'dispute_reason', 'version'])
     is distinct from (to_jsonb(old) - array['custody_status', 'confirmed_by', 'confirmed_at', 'dispute_reason', 'version']) then
    raise exception using errcode = 'F1001', message = 'A handover''s amount, people and places cannot change.';
  end if;
  if new.custody_status is distinct from old.custody_status and not (
       (old.custody_status = 'awaiting_confirmation' and new.custody_status in ('confirmed', 'disputed', 'cancelled'))
    or (old.custody_status = 'disputed' and new.custody_status in ('confirmed', 'cancelled'))) then
    raise exception using errcode = 'F1007',
      message = format('A handover cannot go from %s to %s.', old.custody_status, new.custody_status);
  end if;
  new.version := old.version + 1;
  return new;
end
$$;
create trigger custody_event_guard before update on finly.custody_event
  for each row execute function finly.tg_custody_guard();
create trigger custody_event_no_delete before delete on finly.custody_event
  for each row execute function finly.tg_no_delete();

create function finly.tg_approval_guard() returns trigger
language plpgsql security definer set search_path = finly, pg_temp
as $$
declare
  maker uuid;
  segregate boolean;
begin
  if old.request_status <> 'pending' then
    raise exception using errcode = 'F1007', message = 'This approval step is already decided.';
  end if;
  if (to_jsonb(new) - array['request_status', 'decided_by', 'decided_at', 'comment', 'step_up_method', 'version'])
     is distinct from (to_jsonb(old) - array['request_status', 'decided_by', 'decided_at', 'comment', 'step_up_method', 'version']) then
    raise exception using errcode = 'F1001', message = 'Only the decision of an approval step can be recorded.';
  end if;
  if new.request_status in ('approved', 'rejected') then
    segregate := coalesce((select segregation from finly.approval_rule where id = new.approval_rule_id), true);
    maker := coalesce((select created_by_user_id from finly.txn where id = new.txn_id), new.requested_by);
    if segregate and new.decided_by in (maker, new.requested_by) then
      raise exception using errcode = 'F1011', message = 'The person who made a request cannot approve it.';
    end if;
  end if;
  new.version := old.version + 1;
  return new;
end
$$;
create trigger approval_request_guard before update on finly.approval_request
  for each row execute function finly.tg_approval_guard();
create trigger approval_request_no_delete before delete on finly.approval_request
  for each row execute function finly.tg_no_delete();
create trigger period_close_run_immutable before update or delete on finly.period_close_run
  for each row execute function finly.tg_immutable();

create trigger approval_rule_std before insert or update on finly.approval_rule for each row execute function finly.tg_std();
create trigger custom_field_value_version before update on finly.custom_field_value
  for each row execute function finly.tg_version();
alter table finly.balance_hold add foreign key (txn_id) references finly.txn (id);
