# 3. Table list and detailed schema

Add-on 11 §30 items 3 (table list), 4 (detailed schema) and 5 (data dictionary, design level). The migrations in
`backend/db/migrations/` implement exactly this; every table and column there carries a `COMMENT`, and
`deno task db:dictionary` generates [DATA-DICTIONARY.md](DATA-DICTIONARY.md) from the live catalog, so the
column-level dictionary can never drift from the schema.

**Conventions**

- All tables live in schema `finly`. Every primary key is `uuid` (UUIDv7) unless stated.
- Every master table carries `status` (`active | inactive | archived`), `version int` (optimistic concurrency,
  incremented on every update), `created_at`, `created_by`, `updated_at`, `change_seq bigint` (from the global
  `finly.change_seq` sequence, set by trigger on insert and update; drives mobile delta sync). These are written once
  here as **[std]** and not repeated per table.
- Sensitivity: **C** encrypted (AES-256-GCM, `*_enc bytea` + `key_version`), **H** one-way hashed or keyed index,
  **R** plaintext but row-level-security restricted, **P** non-sensitive configuration.
- RLS class (see [05-security-rls.md](05-security-rls.md)): **ENV** environment-scoped, **CFG** readable by every
  signed-in actor, writable with a manage permission, **OWN** the actor's own rows, **AUTH** identity service only,
  **LEDGER** written only by the posting service, **SYS** jobs only.
- `→ t` means a foreign key to table `t`; `→ t (a, b)` a composite foreign key.

## Table list

| # | Table | Module | Purpose | RLS |
|---|---|---|---|---|
| 1 | `schema_migration` | Platform | Applied migrations with checksums | SYS |
| 2 | `system_setting` | Platform | Key–value system settings | CFG |
| 3 | `label_override` | Platform | Custom labels and translations (en, hi, gu) | CFG |
| 4 | `lookup_value` | Platform | Simple configurable lists (location types, payment methods, fund kinds…) | CFG |
| 5 | `confidentiality_level` | Platform | Nameable confidentiality levels with a fixed strictness rank | CFG |
| 6 | `security_policy` | Platform | OFF / DEFAULT ON / MANDATORY controls per scope | CFG |
| 7 | `emergency_control` | Platform | Freeze writes, disable exports or sharing, force re-auth | CFG |
| 8 | `retention_policy` | Platform | How long each class of data is kept | CFG |
| 9 | `key_version` | Platform | Key version metadata only — never key material | SYS |
| 10 | `reference_counter` | Platform | Gapless daily counters for TX-/OI-/SH-/RC- references | LEDGER |
| 11 | `app_user` | Identity | A person who can sign in | AUTH (+ read view for API) |
| 12 | `user_credential` | Identity | Password hash and lockout state | AUTH |
| 13 | `mfa_factor` | Identity | TOTP factors (encrypted secret) | AUTH |
| 14 | `recovery_code` | Identity | Hashed single-use recovery codes | AUTH |
| 15 | `device` | Identity | Registered phones and their state | AUTH |
| 16 | `unlock_credential` | Identity | Per-device M-PIN verifier and biometric state | AUTH |
| 17 | `auth_session` | Identity | Remembered sessions | AUTH |
| 18 | `refresh_token` | Identity | Rotating refresh tokens (hashed) | AUTH |
| 19 | `security_event` | Identity | Login history and security events | AUTH |
| 20 | `role` | Authorisation | Configurable roles (baselines) | CFG |
| 21 | `permission` | Authorisation | Catalogue of permission keys the backend enforces | CFG |
| 22 | `role_permission` | Authorisation | Role → permission (allow / deny) | CFG |
| 23 | `user_role` | Authorisation | User → role, optionally scoped to one environment | CFG |
| 24 | `env_access` | Authorisation | Which environments (firm, pool, personal books) a user may enter | CFG |
| 25 | `access_rule` | Authorisation | Fine-grained allow/deny rules (L2–L9) | CFG |
| 26 | `break_glass` | Authorisation | Emergency access sessions | CFG |
| 27 | `entity_type` | Masters | Configurable entity sub-types over the four fixed kinds | CFG |
| 28 | `entity` | Masters | Firms, people, pools, outside parties | ENV |
| 29 | `person_profile` | Masters | Person details (encrypted phone) | ENV |
| 30 | `firm_profile` | Masters | Firm details (encrypted tax IDs) | ENV |
| 31 | `entity_membership` | Masters | Owner / partner / worker relationships over time | ENV |
| 32 | `contact` | Masters | Share recipients | ENV |
| 33 | `category` | Masters | Expense and income categories (mapped to account codes) | CFG |
| 34 | `txn_type` | Masters | Configurable transaction types over engine intents | CFG |
| 35 | `tag` | Masters | Tags | CFG / ENV |
| 36 | `place` | Masters | Places | CFG / ENV |
| 37 | `expense_event` | Masters | Trips, visits, projects that group expenses | ENV |
| 38 | `custom_field_def` | Masters | Custom field definitions | CFG |
| 39 | `custom_field_value` | Masters | Custom field values (encrypted when sensitive) | ENV |
| 40 | `form_definition` | Masters | Configurable forms and conditional rules | CFG |
| 41 | `approval_rule` | Masters | Who must approve what | CFG |
| 42 | `notification_rule` | Masters | Which events notify whom, in which content mode | CFG |
| 43 | `message_template` | Masters | Message / photo / PDF templates | CFG |
| 44 | `report_definition` | Masters | System and custom report definitions | OWN / CFG |
| 45 | `dashboard_config` | Masters | Dashboard layouts per user or role | OWN |
| 46 | `coa_template_account` | Money | Chart-of-accounts templates per entity kind | CFG |
| 47 | `ledger_account` | Money | Each entity's chart of accounts | ENV |
| 48 | `fund` | Money | Funds of an entity (one default) | ENV |
| 49 | `location` | Money | Money locations (Tijori, bank, wallet, cash with a person) | ENV |
| 50 | `bank_account_detail` | Money | Bank details of a bank location (encrypted number) | ENV |
| 51 | `location_ownership` | Money | Who owns a location, over time | ENV |
| 52 | `location_access` | Money | Who may access a location, over time (Add / Replace / Revoke) | ENV |
| 53 | `location_holder` | Money | Who holds the key or control, over time (or nobody) | ENV |
| 54 | `balance_hold` | Money | Reservations, locks, pending outgoing amounts | ENV |
| 55 | `txn_status_transition` | Ledger | Allowed master-transaction state changes | CFG |
| 56 | `txn` | Ledger | Master transaction: one real-world event | ENV |
| 57 | `txn_entity` | Ledger | Entities involved in a transaction and their role | ENV |
| 58 | `txn_leg` | Ledger | Business legs: sources, destinations, allocations | ENV |
| 59 | `txn_link` | Ledger | Reversal / correction / refund relationships | ENV |
| 60 | `txn_tag` | Ledger | Transaction ↔ tag | ENV |
| 61 | `posting_rule_version` | Ledger | Versioned posting rules (engine version + definition) | CFG |
| 62 | `accounting_period` | Ledger | Monthly periods per entity | ENV |
| 63 | `journal_chain_head` | Ledger | Head of the journal hash chain (one row) | LEDGER |
| 64 | `journal` | Ledger | One balanced journal per entity per step | ENV / LEDGER |
| 65 | `journal_line` | Ledger | Debit or credit lines with every dimension | ENV / LEDGER |
| 66 | `balance_slice` | Ledger | The dimension tuple a balance is kept for | ENV / LEDGER |
| 67 | `balance_current` | Ledger | Encrypted running balance per slice | ENV / LEDGER |
| 68 | `balance_period` | Ledger | Encrypted movement and closing per slice per period | ENV / LEDGER |
| 69 | `open_item` | Ledger | Receivables, payables, advances, loans, inter-entity dues | ENV / LEDGER |
| 70 | `settlement_allocation` | Ledger | Which settlement closed how much of which item | ENV / LEDGER |
| 71 | `custody_event` | Ledger | Handover steps and confirmation | ENV |
| 72 | `approval_request` | Ledger | Approval steps for transactions and sensitive changes | ENV |
| 73 | `period_close_run` | Ledger | Close and reopen runs with their checklist | ENV |
| 74 | `reconciliation` | Control | Expected vs actual, investigation, resolution | ENV |
| 75 | `bank_statement_import` | Control | Imported statement files | ENV |
| 76 | `bank_statement_line` | Control | Statement lines and their matching | ENV |
| 77 | `exception_finding` | Control | Deterministic exception and integrity findings | ENV / SYS |
| 78 | `integrity_run` | Control | Integrity Verifier runs | SYS |
| 79 | `attachment` | Files | Evidence files (metadata only) | ENV |
| 80 | `attachment_link` | Files | Attachment ↔ what it evidences | ENV |
| 81 | `document` | Files | Generated proof (message, photo, PDF, secure PDF) | ENV |
| 82 | `share_profile` | Sharing | Per-recipient share defaults and limits | OWN |
| 83 | `share_request` | Sharing | One share from preview to hand-off | OWN |
| 84 | `share_event` | Sharing | Every state change of a share | OWN |
| 85 | `secure_link` | Sharing | Secure Viewer links (token hash only) | OWN |
| 86 | `secure_link_access` | Sharing | Every Secure Viewer access attempt | OWN |
| 87 | `idempotency_record` | Operations | Exactly-once mutations (online and offline) | OWN |
| 88 | `sync_review` | Operations | Offline operations needing review | OWN |
| 89 | `notification` | Operations | In-app and push notifications (no amounts stored) | OWN |
| 90 | `audit_log` | Operations | Tamper-evident audit trail | ENV / OWN |
| 91 | `audit_chain_head` | Operations | Head of the audit hash chain (one row) | SYS |

### Coverage of BUILD_PROMPT I2

Every entity the specification lists maps to a table (or, where marked, to a column or a configuration row):

| I2 item | Where |
|---|---|
| Users · Roles · Permissions · Policy rules · Temporary access · Break-glass · Personal-finance owner grants | `app_user` · `role`, `user_role` · `permission`, `role_permission` · `access_rule` · `env_access.valid_until`, `access_rule.valid_until` · `break_glass` · `env_access` / `access_rule` with `source = 'owner_grant'` |
| Companies · Company memberships · People · Person/worker types · Customers · Vendors | `entity` (kind firm/person/party) · `entity_membership` · `entity`, `person_profile` · `lookup_value` (worker_type), `entity_type` · `entity` (party, types customer/supplier) |
| Funds · Fund ownership · Fund reservations/locks | `fund` (entity = owner; pools for joint ownership) · `balance_hold` |
| Accounts · Account ownership · Account types · Banks · Locations · Places | `ledger_account` and `location` (user-facing "Account" = location) · `location_ownership` · `lookup_value` (location_type) · `bank_account_detail` · `location` · `place` |
| Projects · Trips / Expense Events · Categories · Expense/Income types · Transaction types · Tags · Statuses · Confidentiality levels | `expense_event` (kinds include project) · `category` (kind) · `txn_type` · `tag`, `txn_tag` · CHECK constraints + `label_override` · `confidentiality_level` |
| Custom fields · Custom labels · Custom forms + conditional rules | `custom_field_def`, `custom_field_value` · `label_override` · `form_definition` |
| Master Transactions · Transaction lines · Ledger entries · Posting rules | `txn` · `txn_leg` · `journal`, `journal_line` · `posting_rule_version` |
| Fund allocations · Allocation adjustments · Expenses · Expense lines · Expense splits | `journal_line.fund_id` · an `allocation_adjustment` txn type with balanced journals (H5) · `txn` (intent expense) · `txn_leg` (allocation legs) · `txn_leg` amounts |
| Advances · Reimbursements · Outstanding · Settlements · Handovers · Opening balances | `open_item` (kind advance) · `open_item` (kind interentity) · `open_item` · `settlement_allocation` · `custody_event` · `txn` (intent opening_balance) + `journal.kind = 'opening'` |
| Periods · Approvals / workflows / thresholds · Workflow rules | `accounting_period`, `period_close_run` · `approval_rule`, `approval_request` · `approval_rule.steps` |
| Reconciliation records · Exception findings · Attachments | `reconciliation`, `bank_statement_*` · `exception_finding` · `attachment`, `attachment_link` |
| Reports · Dashboards · Documents · Document versions | `report_definition` · `dashboard_config` · `document` · `document.supersedes_document_id` |
| Share profiles · Share events / history · Share verifications · Secure-viewer links | `share_profile` · `share_request`, `share_event` · `share_request.verification_hash` · `secure_link`, `secure_link_access` |
| Message / photo / PDF templates · Security policies · Notification rules / events | `message_template` · `security_policy` · `notification_rule`, `notification` |
| Devices · Sessions / refresh tokens · M-PIN credentials · Biometric state · MFA factors · Recovery codes · Login history · Security events | `device` · `auth_session`, `refresh_token` · `unlock_credential` · `unlock_credential.biometric_*` · `mfa_factor` · `recovery_code` · `security_event` |
| Idempotency keys · Audit logs · Encryption key metadata · Retention policies · System settings · Emergency lock state · Offline sync records | `idempotency_record` · `audit_log` · `key_version` · `retention_policy` · `system_setting` · `emergency_control` · `idempotency_record` + `sync_review` |
| Accounting core: entities · chart of accounts · templates · location ↔ ledger mappings · journals · lines · snapshots · open items + matches · inter-entity due pairs · custody records · fund balances · periods, closes, closing journals · posting-rule templates · split records · integrity runs | `entity` · `ledger_account` · `coa_template_account` · `journal_line.location_id` on the entity's Cash/Bank/Wallet account (revision 3: one account per entity, place as dimension) · `journal` · `journal_line` · `balance_*` · `open_item`, `settlement_allocation` · `open_item` (kind interentity) with both sides' lines · `custody_event`, `location_holder` · `balance_*` by fund · `accounting_period`, `period_close_run`, `journal.kind = 'closing'` · `posting_rule_version` · `txn_leg` · `integrity_run`, `exception_finding` |

---

## Platform

### `schema_migration` (P, SYS)
| Column | Type | Null | Meaning |
|---|---|---|---|
| version | text | PK | `0001`… |
| name | text | no | file name |
| checksum | text | no | SHA-256 of the file; a changed applied file fails the run |
| applied_at | timestamptz | no | |

### `system_setting` (P, CFG)
`key text PK`, `value jsonb not null`, `description text`, `version`, `updated_at`, `updated_by → app_user`.
Examples: `default_handover_confirmation` (F2, false), `backdating_limit_days`, `max_attachment_bytes`.

### `label_override` (P, CFG)
`id`, `locale text check in ('en','hi','gu')`, `label_key text`, `text text`, [std]. Unique `(locale, label_key)`.
Labels never change behaviour (P8).

### `lookup_value` (P, CFG)
`id`, `list_key text check in ('location_type','payment_method','fund_kind','event_kind','document_kind','worker_type','relation_label')`,
`key text`, `label text`, `sort_order int`, [std]. Unique `(list_key, key)`, unique `(list_key, id)` — the target of
type-safe composite foreign keys: a referencing table stores `type_id` plus a generated constant
`type_list text generated always as ('location_type') stored` and references `lookup_value (list_key, id)`.

### `confidentiality_level` (P, CFG)
`id`, `key text unique`, `label`, `rank smallint unique` (higher = stricter; labels change, the engine compares
ranks — L7), `description`, `default_rules jsonb`, [std]. Seeded: public 10, internal 20, company_only 30,
family_only 40, restricted 50, confidential 60, highly_confidential 70, owner_only 80, private 90, secret 100.

### `security_policy` (P, CFG)
`id`, `control_key text` (password_protection, encryption, watermark, expiry, secure_viewer, revocable_access,
recipient_marking, download_allowed, print_allowed, require_user_verification, require_step_up, mpin_required,
auto_lock_seconds, mfa_required…), `scope_type text check in ('system','entity','fund','location','txn_type','report','role','contact','share_profile','user')`,
`scope_id uuid` (null exactly when scope is system), `mode text check in ('off','default_on','mandatory')`,
`user_may_change bool`, `value jsonb` (e.g. `{"hours": 24}`), [std]. Unique `NULLS NOT DISTINCT (control_key, scope_type, scope_id)`.
The API resolves the hierarchy System → … → one-time selection; stricter always wins (Q8).

### `emergency_control` (P, CFG)
`control_key text PK check in ('freeze_financial_writes','disable_exports','disable_sharing','require_reauth')`,
`active bool`, `reason text`, `activated_by`, `activated_at`, `deactivated_by`, `deactivated_at`, `version`.
**Database-enforced:** the journal insert trigger refuses every posting while `freeze_financial_writes` is active (T7).

### `retention_policy` (P, CFG)
`data_class text PK` (financial_records, audit_log, security_events, sessions, idempotency, generated_documents,
secure_link_access, notifications), `retain_days int check > 0`, `action text check in ('delete','anonymise','archive')`, `version`.

### `key_version` (P, SYS)
`purpose text check in ('data','blind_index','hash_chain','file','mpin_pepper')`, `version int`, PK `(purpose, version)`,
`algorithm text`, `status text check in ('active','decrypt_only','retired')`, `created_at`, `activated_at`, `retired_at`.
Partial unique: one `active` per purpose. **No key material** — keys are derived from the KEK in the secret store
(HKDF-SHA-256, info = purpose ‖ version).

### `reference_counter` (P, LEDGER)
`prefix text check in ('TX','OI','SH','RC')`, `day date`, `last_value int check ≥ 0`, PK `(prefix, day)`.
`INSERT … ON CONFLICT DO UPDATE SET last_value = last_value + 1 RETURNING` inside the posting transaction: a rollback
returns the number, so references are gapless (TX-20261008-000001…).

---

## Identity and security

### `app_user` (R, AUTH; a narrow read-only view `app_user_public` for the API)
| Column | Type | Null | Default | Meaning |
|---|---|---|---|---|
| id | uuid | PK | | |
| person_entity_id | uuid | no, unique | | → `entity (id, kind)` with generated `person_kind = 'person'` — every user is exactly one person |
| username | text | no | | sign-in name (add-on 06) |
| username_key | text | no, unique | generated `lower(username)` | case-insensitive uniqueness |
| display_name | text | no | | |
| status | text | no | `'invited'` | invited, active, suspended, disabled, archived |
| must_change_password | bool | no | true | temporary password must be changed at first login |
| mfa_required | bool | no | false | forced true for Super Admin (N13) |
| locale | text | no | `'en'` | en, hi, gu |
| [std] | | | | |

### `user_credential` (S, AUTH)
`user_id PK → app_user`, `password_hash text not null` (Argon2id PHC string), `is_temporary bool`,
`temporary_expires_at`, `set_at`, `failed_count int default 0`, `locked_until timestamptz`, `last_success_at`, `version`.
Never readable by `finly_api`. No column ever holds a recoverable password (A5, add-on 06).

### `mfa_factor` (C, AUTH)
`id`, `user_id → app_user`, `kind text check in ('totp')`, `secret_enc bytea` (TOTP secret must be recoverable to verify
codes, so it is encrypted, not hashed), `key_version`, `label`, `status text check in ('pending','active','revoked')`,
`last_used_step bigint` (refuses replay of a used code), `created_at`, `activated_at`, `revoked_at`.

### `recovery_code` (S, AUTH)
`id`, `user_id`, `batch_id uuid`, `code_hash bytea unique` (HMAC-SHA-256 of a 128-bit code), `created_at`, `used_at`.

### `device` (R, AUTH)
`id`, `user_id`, `label`, `platform text check in ('android','ios','web')`, `model`, `os_version`, `app_version`,
`public_key bytea` (Android Keystore public key of a biometric-bound key pair; step-up = a signed server challenge),
`push_token_enc bytea`, `key_version`, `status text check in ('pending','trusted','revoked','lost')`, `registered_at`,
`trusted_at`, `last_seen_at`, `revoked_at`, `revoked_by`, `revoke_reason`, `version`.

### `unlock_credential` (S, AUTH)
`device_id PK`, `user_id` — composite FK `(device_id, user_id) → device (id, user_id)` so a verifier can never belong to
another user's device; `mpin_hash text` (Argon2id of HMAC(pepper, PIN) — the pepper lives outside the database, so a
dump cannot be brute-forced offline, open question Q6), `mpin_set_at`, `mpin_failed_count`, `mpin_locked_until`,
`mpin_reset_required bool` (Super Admin force-reset, N5), `biometric_enabled bool`, `biometric_changed_at`,
`key_invalidated_at` (device-security change detected, N6), `version`. No biometric data, ever.

### `auth_session` (R, AUTH)
`id`, `user_id`, `device_id` — composite FK to `device (id, user_id)`, `auth_methods text[]`, `auth_strength smallint`
(1 password, 2 password+MFA, 3 + device step-up), `remember bool`, `created_at`, `last_used_at`, `idle_expires_at`,
`absolute_expires_at`, `revoked_at`, `revoke_reason text check in ('logout','logout_all','device_revoked','device_lost','password_changed','security_change','admin','token_reuse','expired')`,
`ip inet`, `user_agent text`. Check `absolute_expires_at > created_at`. No unlimited sessions (N3).

### `refresh_token` (S, AUTH)
`id`, `session_id → auth_session`, `token_hash bytea unique` (SHA-256 of 256 random bits), `issued_at`, `expires_at`,
`used_at`, `replaced_by_id → refresh_token`. Presenting a token whose `used_at` is set revokes the whole session
(reuse detection).

### `security_event` (R, AUTH)
`id bigint identity PK`, `occurred_at`, `user_id` (null when the username is unknown), `username_hash bytea` (HMAC of the
attempted username — never the plaintext of a failed attempt), `device_id`, `session_id`,
`event_type text` (login_succeeded, login_failed, logout, password_changed, password_reset, mpin_set, mpin_changed,
mpin_reset, mpin_failed, biometric_enabled, biometric_disabled, mfa_enabled, mfa_disabled, new_device, device_revoked,
session_revoked, token_reuse, lockout, step_up_succeeded, step_up_failed), `outcome text check in ('success','failure','blocked')`,
`reason_code text`, `ip inet`, `user_agent text`, `details jsonb` (never secrets). Login history = this table filtered.

---

## Authorisation

### `role` (P, CFG)
`id`, `key text unique` (super_admin, family_admin, finance_operator, worker, read_only, partner, auditor, or custom),
`name`, `description`, `is_system bool`, [std]. Roles grant baseline capability only (T4).

### `permission` (P, CFG — seeded by migration, not user-creatable)
`id`, `key text unique` (e.g. `txn.create`, `txn.approve`, `txn.reverse`, `report.export`, `share.pdf`,
`period.close`, `period.reopen`, `masters.manage`, `users.manage`, `access.manage`, `audit.view`, `admin.full`…),
`resource_type`, `action`, `description`, `step_up_default bool`.

### `role_permission` (P, CFG)
`role_id → role`, `permission_id → permission`, `effect text check in ('allow','deny') default 'allow'`, PK both.

### `user_role` (R, CFG)
`id`, `user_id → app_user`, `role_id → role`, `scope_entity_id → entity` (null = every environment the user may
enter), `granted_by`, `granted_at`, `revoked_at`, `revoked_by`, `reason`. Unique `NULLS NOT DISTINCT
(user_id, role_id, scope_entity_id) WHERE revoked_at IS NULL`.

### `env_access` (R, CFG) — which environments a user may enter
| Column | Type | Null | Meaning |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | no | → app_user |
| env_entity_id | uuid | no | → entity of kind firm, person or pool (trigger) |
| level | text | no | read, write, manage |
| source | text | no | self (own personal books), admin, owner_grant, temporary, break_glass |
| granted_by | uuid | yes | → app_user (null only for `self` rows created at user creation) |
| valid_from / valid_until | timestamptz | until nullable | temporary access ends by itself (L9) |
| break_glass_id | uuid | yes | → break_glass |
| revoked_at / revoked_by / reason | | yes | history, never deleted |

Constraints: unique `(user_id, env_entity_id, source) WHERE revoked_at IS NULL`; `valid_until > valid_from`.
**A4 trigger:** a row for a *person* environment is accepted only when `source = 'self'` and the user is that person,
or when `granted_by` is the user of that person (owner grant). Super Admin, admins and break-glass cannot open anyone
else's personal finance. Firm access never implies personal access (RULEBOOK-03 §4, §18).

### `access_rule` (R, CFG) — fine-grained rules (L2–L9)
`id`, `subject_type text check in ('user','role','everyone')`, `subject_user_id`, `subject_role_id`
(`num_nonnulls` consistent with the type), `env_entity_id` (scope; null = all), `resource_type text check in
('entity','fund','location','ledger_account','category','txn_type','confidentiality_level','field','report','txn')`,
`resource_id uuid`, `field_key text`, `actions text[] not null` (discover, view, view_amount, view_details, create,
edit, reverse, approve, reconcile, export, share_message, share_photo, share_pdf, share_secure, copy, download, print,
view_attachments, view_audit, manage), `effect text check in ('allow','deny')`, `amount_visibility text check in
('full','rounded','range','hidden','existence')`, `detail_level smallint check between 1 and 5`, `conditions jsonb`
(ABAC: transaction types, device trust, auth strength…), `valid_from`, `valid_until`, `source text check in
('role_default','admin','owner','temporary','share')`, `granted_by`, `reason`, `revoked_at`, `revoked_by`, [std].
Same A4 trigger for allow rules inside a person environment. Evaluation: explicit deny > explicit allow > role default
(L8), central in the API; deny rules on funds and locations are mirrored in RLS.

### `break_glass` (R, CFG)
`id`, `user_id`, `env_entity_id` (never a person environment — trigger), `reason text not null`, `auth_strength`,
`approved_by`, `started_at`, `ends_at not null check > started_at`, `ended_at`, `owner_notified_at`.

---

## Entities and masters

### `entity_type` (P, CFG)
`id`, `kind text check in ('firm','person','pool','party')`, `key text unique` (company, partnership,
proprietorship, individual, family_pool, customer, supplier, agent, angadiya, bank, other), `label`, [std].
Unique `(id, kind)`.

### `entity` (R, ENV)
| Column | Type | Null | Default | Meaning |
|---|---|---|---|---|
| id | uuid | PK | | stable identity; never the name |
| kind | text | no | | firm, person, pool, party — **immutable** (trigger): books depend on it |
| entity_type_id | uuid | no | | → `entity_type (id, kind)` — the sub-type must belong to the same kind |
| display_name | text | no | | Mint, JSK, Krish — editable label |
| legal_name | text | yes | | |
| short_code | text | yes | | unique case-insensitively when set (`MINT`) |
| managed_in_env_id | uuid | yes | | → entity: the environment this record was created in (a worker created by Partner 1 lives in Partner 1's environment, RULEBOOK-03 §6); null for top-level firms and for users' own person entities |
| confidentiality_level_id | uuid | yes | | → confidentiality_level |
| has_books | bool | no | generated `kind <> 'party'` | parties are counterparties only |
| archived_at / archived_by / archive_reason | | yes | | |
| [std] | | | | |

Unique `(id, kind)` — target of every type-safe composite foreign key. Archived entities keep all history; new
postings to them are refused by the engine (and by inactive accounts/funds).

### `person_profile` (C/R, ENV)
`entity_id PK` → `entity (id, kind='person')`, `phone_enc`, `phone_bidx bytea` (HMAC; duplicate detection and recipient
lookup), `email text`, `worker_type_id` → `lookup_value (worker_type)`, `notes_enc`, `key_version`, `version`.

### `firm_profile` (C/R, ENV)
`entity_id PK` → `entity (id, kind='firm')`, `legal_form text`, `gstin_enc`, `pan_enc`, `address text`,
`fy_start_month smallint default 4 check 1–12` (April, Q9), `key_version`, `version`.

### `entity_membership` (R, ENV)
`id`, `org_entity_id` → entity (firm or pool — trigger), `member_entity_id` → entity (person, or a firm inside a pool),
`engine_role text check in ('owner','partner','staff','other')` — the engine's "owner of the firm" means owner or
partner (F3, F8), `relation_label_id` → `lookup_value (relation_label)` (Owner, Partner, Worker, Employee, Family…),
`valid_from date not null`, `valid_to date check ≥ valid_from`, `created_by`, `created_at`, `ended_by`, `end_reason`.
Unique `(org_entity_id, member_entity_id, engine_role) WHERE valid_to IS NULL`; check `org_entity_id <> member_entity_id`.

### `contact` (C/R, ENV)
`id`, `managed_in_env_id`, `display_name`, `phone_enc`, `phone_bidx`, `linked_entity_id` → entity, `verified_at`,
`verified_by`, `key_version`, [std]. A share recipient (Q3, Q9).

### `category` (P, CFG)
`id`, `kind text check in ('expense','revenue')`, `key text unique`, `name`, `parent_id` → category (same kind —
composite FK `(parent_id, kind) → category (id, kind)`), `account_code text not null` (the ledger account code it posts
to in every entity's chart), `managed_in_env_id` (null = global), `sort_order`, [std]. Unique `(id, kind)`.

### `txn_type` (P, CFG)
`id`, `key text unique`, `label`, `intent_type text check in` the engine intents (`transfer`, `transit_confirm`,
`expense`, `bill`, `nonowner_payment`, `income`, `unidentified_receipt`, `advance_give`, `advance_account`, `loan`,
`loan_repayment`, `capital_contribution`, `withdrawal`, `interentity_transfer`, `settlement`, `offset`,
`opening_balance`, `cash_adjustment`, `allocation_adjustment`, `reversal`, `correction`), `requires_reason bool`,
`default_confidentiality_level_id`, `form_definition_id`, `sort_order`, [std]. Labels (Avak, Javak…) over fixed
intents; the intent decides the accounting (AC2, P8).

### `tag`, `place` (P, CFG/ENV)
`tag`: `id`, `managed_in_env_id`, `name`, `color_token`, [std]; unique `NULLS NOT DISTINCT (managed_in_env_id, lower(name))`.
`place`: `id`, `managed_in_env_id`, `name`, `address`, [std].

### `expense_event` (C/R, ENV)
`id`, `env_entity_id` (the environment owning the event), `kind_id` → `lookup_value (event_kind)` (trip, firm visit,
Angadiya visit, customer visit, exhibition, project, family event…), `name`, `starts_on`, `ends_on check ≥ starts_on`,
`place_id`, `status text check in ('planned','active','closed','archived')`, `notes_enc`, `key_version`, [std].

### `custom_field_def`, `custom_field_value` (P / C, CFG / ENV)
`custom_field_def`: `id`, `target text check in ('txn','txn_leg','entity','location','expense_event')`, `key`, `label`,
`data_type text check in ('text','number','amount','date','time','choice','multi_choice','person','entity','fund','location','boolean','file')`,
`options jsonb`, `is_sensitive bool`, `required_rule jsonb`, `txn_type_id`, [std]; unique `(target, key)`.
`custom_field_value`: `id`, `field_id`, one of `txn_id | txn_leg_id | entity_id | location_id | expense_event_id`
(`num_nonnulls = 1`), `value_text`, `value_number bigint`, `value_date`, `value_bool`, `value_ref uuid`,
`value_enc bytea`, `key_version`; a trigger requires sensitive fields (and every `amount` field) to use `value_enc` only.

### `form_definition`, `approval_rule`, `notification_rule`, `message_template` (P, CFG)
- `form_definition`: `id`, `key`, `version int`, `txn_type_id`, `schema jsonb` (fields, conditions — P3), [std];
  unique `(key, version)`.
- `approval_rule`: `id`, `name`, `env_entity_id`, `txn_type_id`, `location_id`, `min_amount bigint check > 0`
  (policy threshold in whole rupees — configuration, not a financial record), `steps jsonb` (ordered roles/permissions
  and counts: maker → checker → approver), `segregation bool default true` (the maker may not approve), `priority int`,
  [std].
- `notification_rule`: `id`, `event_key`, `scope_type`, `scope_id`, `channel text check in ('in_app','push')`,
  `content_mode text check in ('full','masked','generic')`, `conditions jsonb`, `enabled bool`, [std].
- `message_template`: `id`, `kind text check in ('message','photo','pdf')`, `key`, `locale`, `body text`,
  `template_version int`, [std]; unique `(kind, key, locale, template_version)`.

### `report_definition`, `dashboard_config` (P, OWN/CFG)
- `report_definition`: `id`, `owner_user_id`, `key`, `name`, `kind text check in ('system','custom')`, `definition jsonb`
  (columns, filters, grouping, totals), `visibility text check in ('private','role','shared')`, [std].
- `dashboard_config`: `id`, `user_id`, `role_id` (exactly one), `layout jsonb`, `version`.

---

## Money structure

### `coa_template_account` (P, CFG)
`id`, `entity_kind text check in ('firm','person','pool')`, `code`, `name`, `class`, `role`, `parent_code`,
`requires_location`, `requires_counterparty`, `requires_category bool`, `sort_order`. Unique `(entity_kind, code)`.
Seeded from `backend/src/domain/ledger/coa.ts` (one source: a test asserts the seed equals the code template).

### `ledger_account` (P/R, ENV)
| Column | Type | Null | Default | Meaning |
|---|---|---|---|---|
| id | uuid | PK | | |
| entity_id | uuid | no | | → entity; whose books |
| code | text | no | | 1100 Cash, 1300 Inter-entity receivable… |
| name | text | no | | label (renamable) |
| class | text | no | | asset, contra_asset, liability, equity, drawings, revenue, expense, cogs |
| normal_side | text | no | generated from class | Dr for asset, drawings, expense, cogs; Cr otherwise |
| role | text | yes | | engine role (cash, bank, wallet, interentity_receivable…); null for custom accounts |
| parent_id | uuid | yes | | → `ledger_account (id, entity_id)` — control/sub accounts in the same books only |
| requires_location / requires_counterparty / requires_category | bool | no | from role | dimension rules checked on every line |
| is_system | bool | no | false | created from the template |
| [std] | | | | |

Unique `(entity_id, code)`, unique `(id, entity_id)`, unique `(entity_id, role) WHERE role IS NOT NULL AND role NOT IN
('revenue','expense')`. Never deleted once referenced; deactivation blocks new lines (AC6.12).

### `fund` (R, ENV)
`id`, `entity_id`, `key`, `name` (Mint Operating Fund, Hissa…), `kind_id` → `lookup_value (fund_kind)` (operating,
owner, reserve, travel, emergency, project, restricted, private), `is_default bool`, `confidentiality_level_id`,
`controller_entity_id` → entity (person), [std]. Unique `(id, entity_id)`, unique `(entity_id, key)`, unique
`(entity_id) WHERE is_default` — exactly one default per entity (created with the entity).

### `location` (R, ENV) — the user-facing "Account / Khata"
| Column | Type | Null | Default | Meaning |
|---|---|---|---|---|
| id | uuid | PK | | |
| name | text | no | | Tijori, Savan Bank, Office drawer, Cash with Sujal |
| kind | text | no | | cash, bank, wallet — decides which ledger account role the engine uses |
| type_id | uuid | no | | → `lookup_value (location_type)`: vault, drawer, locker, wardrobe, hand cash, current account, savings, UPI… |
| custody_person_id | uuid | yes | | → `entity (id, kind='person')`; set for "cash with <person>" (one per person: unique where not null; requires `kind = 'cash'`) |
| managed_in_env_id | uuid | no | | → entity: the environment it belongs to (visibility) |
| confidentiality_level_id | uuid | yes | | |
| disclosure | text | no | `'name'` | name, generic, hidden, owner_only (L11) |
| negative_policy | text | no | `'forbid'` | forbid, allow, approval (J3) |
| overdraft_limit_enc | bytea | yes | | C |
| handover_confirmation | text | no | `'inherit'` | inherit, required, off (F2: system default off) |
| key_version | int | yes | | |
| [std] | | | | |

### `bank_account_detail` (C/R, ENV)
`location_id PK` → location (kind bank or wallet — trigger), `bank_name`, `branch`, `ifsc`, `account_holder`,
`account_number_enc`, `account_number_last4 char(4)`, `account_number_bidx bytea` (duplicate detection),
`account_type`, `key_version`, `version`.

### `location_ownership`, `location_access`, `location_holder` (R, ENV) — F5, RULEBOOK-03 §13–§15
- `location_ownership`: `id`, `location_id`, `owner_entity_id` (null = unowned), `valid_from timestamptz`, `valid_to`,
  `set_by`, `reason`. Unique `(location_id) WHERE valid_to IS NULL` — one current owner fact.
- `location_access`: `id`, `location_id`, `person_entity_id` → `entity (id, kind='person')`, `change_id uuid` (one
  user action; **Replace** = one revoke + one grant sharing a change id), `change_kind text check in
  ('initial','add','replace','revoke')`, `granted_at`, `granted_by`, `revoked_at`, `revoked_by`, `reason`.
  Unique `(location_id, person_entity_id) WHERE revoked_at IS NULL`.
- `location_holder`: `id`, `location_id`, `person_entity_id` (null = **unassigned**), `valid_from`, `valid_to check >
  valid_from`, `set_by`, `reason`. Unique `(location_id) WHERE valid_to IS NULL` — exactly one current holder fact,
  which may be "nobody". Changing the holder never changes access (RULEBOOK-03 §13).

### `balance_hold` (C/R, ENV) — AC9 reserved, locked, pending outgoing
`id`, `entity_id`, `fund_id` → `fund (id, entity_id)`, `location_id`, `kind text check in
('reservation','lock','pending_outgoing')`, `amount_enc`, `key_version`, `reason`, `txn_id` (required for
`pending_outgoing`), `status text check in ('active','released','consumed')`, `created_by`, `created_at`,
`released_at`, `released_by`, `version`. Available = current − active holds (computed under lock by the engine).

---

## Events and ledger

### `txn_status_transition` (P, CFG)
`from_status text`, `to_status text`, PK both. Seeded with the state machine in
[01-architecture.md §1.7](01-architecture.md#17-status-and-lifecycle-add-on-11-item-17). A trigger on `txn` refuses
any status change not listed.

### `txn` (C/R, ENV) — master transaction
| Column | Type | Null | Default | Meaning |
|---|---|---|---|---|
| id | uuid | PK | | assigned by the server |
| reference | text | no, unique | | `TX-YYYYMMDD-NNNNNN`, human, gapless |
| txn_type_id | uuid | no | | → txn_type |
| intent_type | text | no | | engine intent (copied from the type at creation; immutable once submitted) |
| status | text | no | `'draft'` | state machine (trigger) |
| primary_env_id | uuid | no | | → entity: the environment it was entered in (authorisation, lists) |
| value_date | date | no | | transaction date (period assignment) |
| value_time | time | yes | | |
| entered_at | timestamptz | no | now() | entry timestamp |
| submitted_at / approved_at / posted_at | timestamptz | yes | | AC8 separate dates; `posted_at` required when status is posted, reversed or corrected |
| currency | char(3) | no | `'INR'` | check `= 'INR'` |
| amount_enc | bytea | yes | | C — headline amount |
| amount_bidx | bytea | yes | | H — HMAC(entity-scoped key, amount): exact search "45000" |
| amount_bucket | bytea | yes | | H — HMAC of the amount band (range filters) |
| key_version | int | yes | | |
| reason | text | yes | | R — searchable; field-level visibility applied by the API (open question Q2) |
| search_tsv | tsvector | no | generated from reason + reference | full-text search, no extension |
| notes_enc | bytea | yes | | C — internal note |
| payment_method_id | uuid | yes | | → lookup_value (payment_method) |
| expense_event_id | uuid | yes | | → expense_event |
| options | jsonb | no | `'{}'` | non-sensitive engine options: route, treatment, via_transit |
| confidentiality_level_id | uuid | yes | | |
| created_by_user_id | uuid | no | | → app_user (the maker) |
| handled_by_entity_id | uuid | yes | | → entity (person who physically handled it) |
| client_ref | uuid | yes | | id the phone generated offline; unique per user (sync dedupe) |
| device_id | uuid | yes | | |
| version / change_seq | | no | | |

Unique `(id, value_date)` (target of `txn_entity`'s cascading copy). Index and search design in
[04-index-performance.md](04-index-performance.md).

### `txn_entity` (R, ENV)
`txn_id`, `entity_id`, `role text check in ('payer','owner','receiver','giver','holder','counterparty','lender',
'borrower','settler')`, `value_date` — FK `(txn_id, value_date) → txn (id, value_date) ON UPDATE CASCADE`,
`ack_status text check in ('not_required','pending','acknowledged','disputed') default 'not_required'` (counterparty
acknowledgement, open question Q1), `ack_by`, `ack_at`, `ack_note`. PK `(txn_id, entity_id, role)`.

### `txn_leg` (C/R, ENV)
`id`, `txn_id`, `seq smallint`, `leg_kind text check in ('source','destination','allocation')`, `entity_id`,
`location_id`, `fund_id` → `fund (id, entity_id)` when set, `category_id`, `counterparty_entity_id`,
`expense_event_id`, `amount_enc not null`, `key_version`, `treatment text check in ('withdrawal','owes')` (F8),
`attributes jsonb` (non-sensitive). Unique `(txn_id, leg_kind, seq)`. **Trigger:** legs can be inserted, changed or
removed only while the parent is `draft`; afterwards they are frozen (what was approved is what posts).

### `txn_link` (R, ENV)
`from_txn_id`, `to_txn_id`, `kind text check in ('reverses','corrects','partially_reverses','refunds','replaces',
'duplicate_of')`, `created_at`, `created_by`. PK `(from_txn_id, to_txn_id, kind)`; check `from_txn_id <> to_txn_id`;
unique `(to_txn_id) WHERE kind = 'reverses'` — a transaction is fully reversed at most once.

### `txn_tag` (R, ENV)
`txn_id`, `tag_id`, PK both.

### `posting_rule_version` (P, CFG)
`id`, `intent_type`, `rule_version int`, `engine_version text` (the backend build whose planner implements it),
`definition jsonb` (the line roles, classifications and validations, AC15), `status text check in
('draft','active','retired')`, `created_by`, `approved_by`, `created_at`. Unique `(intent_type, rule_version)`;
one active per intent.

### `accounting_period` (R, ENV)
`id`, `entity_id`, `period_start date`, `period_end date check > period_start`, `status text check in
('open','closed')`, `closed_at`, `closed_by`, `version`. Unique `(entity_id, period_start)`, unique `(id, entity_id)`;
a trigger refuses overlapping periods of one entity.

### `journal_chain_head` (P, LEDGER)
`id smallint PK check (id = 1)`, `last_seq bigint`, `last_hash bytea`, `updated_at`. Locked `FOR UPDATE` by every
posting: one global order of journals.

### `journal` (R, ENV/LEDGER)
| Column | Type | Null | Meaning |
|---|---|---|---|
| id | uuid | PK | |
| txn_id | uuid | no | → txn |
| entity_id | uuid | no | → entity (has books) — whose books |
| step | smallint | no | 1, 2 … (through-owner flows have two linked steps) |
| kind | text | no | standard, reversal, closing, opening, adjustment |
| period_id | uuid | no | → `accounting_period (id, entity_id)` — same entity |
| value_date | date | no | must fall inside the period |
| posted_at | timestamptz | no | |
| posted_by_user_id | uuid | no | → app_user |
| posting_rule_version_id | uuid | yes | → posting_rule_version |
| reversal_of_journal_id | uuid | yes | → `journal (id, entity_id)`; unique when set (a journal is reversed at most once) |
| chain_seq | bigint | no, unique | position in the global hash chain |
| prev_hash | bytea | no | previous journal's content hash |
| content_hash | bytea | no | HMAC-SHA-256 (hash-chain key) of the canonical content incl. plaintext amounts — rotation-safe |
| hash_key_version | int | no | |

Unique `(id, entity_id, value_date)` (target of the lines' composite FK), unique `(txn_id, entity_id, step)`.
**Insert trigger:** period open, value date inside it, no write freeze, entity active. **Update/delete:** refused.

### `journal_line` (C/R, ENV/LEDGER)
| Column | Type | Null | Meaning |
|---|---|---|---|
| id | uuid | PK | |
| journal_id, entity_id, value_date | uuid, uuid, date | no | FK `(journal_id, entity_id, value_date) → journal` — copies the database itself keeps equal |
| line_no | smallint | no | unique within the journal |
| ledger_account_id | uuid | no | FK `(ledger_account_id, entity_id) → ledger_account (id, entity_id)` — **the account must be in the same books** |
| fund_id | uuid | no | FK `(fund_id, entity_id) → fund (id, entity_id)` — **the fund must be the same entity's** |
| side | text | no | `Dr` or `Cr` |
| amount_enc | bytea | no | C — positive whole rupees |
| key_version | int | no | |
| location_id | uuid | yes | required on cash, bank and wallet lines (trigger against the account flags) |
| counterparty_entity_id | uuid | yes | required on party lines; check `<> entity_id` |
| category_id | uuid | yes | required on income and expense lines |
| expense_event_id | uuid | yes | project / trip / visit |
| holder_person_id | uuid | yes | who held the location at posting time (snapshot) |
| txn_leg_id | uuid | yes | → txn_leg that produced the line |
| memo_enc | bytea | yes | C |

**Deferred constraint trigger (at commit):** each new journal has ≥ 2 lines, at least one `Dr` and one `Cr`, and every
fund appearing in it has both sides. **Update/delete:** refused (one audited exception for key-rotation re-encryption by
`finly_system`, touching only `amount_enc` and `key_version`).

### `balance_slice`, `balance_current`, `balance_period` (C/R, ENV/LEDGER)
- `balance_slice`: `id`, `entity_id`, `ledger_account_id`, `fund_id` (composite FKs as on lines), `location_id`,
  `counterparty_entity_id`, `category_id`, `created_at`. Unique `NULLS NOT DISTINCT (entity_id, ledger_account_id,
  fund_id, location_id, counterparty_entity_id, category_id)`, unique `(id, entity_id)`.
- `balance_current`: `slice_id PK`, `entity_id` (FK `(slice_id, entity_id) → balance_slice`), `balance_enc` (signed,
  Dr − Cr), `line_count bigint`, `last_journal_id`, `key_version`, `version bigint`, `updated_at`.
- `balance_period`: `slice_id`, `period_id`, `entity_id` (FKs to slice and to `accounting_period (id, entity_id)`),
  `debits_enc`, `credits_enc`, `closing_enc` (fixed at close; null while open), `line_count`, `key_version`, `version`,
  `updated_at`. PK `(slice_id, period_id)`.

### `open_item` (C/R, ENV/LEDGER)
| Column | Type | Null | Meaning |
|---|---|---|---|
| id | uuid | PK | |
| reference | text | no, unique | `OI-YYYYMMDD-NNNNNN` |
| kind | text | no | interentity, supplier_payable, customer_receivable, advance, loan |
| debtor_entity_id / creditor_entity_id | uuid | no | explicit (RULEBOOK-01 §169); check different |
| debtor_role / creditor_role | text | yes | ledger role on each side (null where that side has no books) |
| debtor_fund_id / creditor_fund_id | uuid | yes | |
| origin_txn_id | uuid | no | → txn |
| origin_debtor_line_id / origin_creditor_line_id | uuid | yes | → journal_line on each side that has books |
| original_enc | bytea | no | C |
| remaining_enc | bytea | no | C — maintained; = original − Σ allocations (verifier) |
| status | text | no | open, partially_settled, settled, written_off, reversed |
| due_date | date | yes | aging |
| reason | text | no | R |
| settled_at | timestamptz | yes | |
| key_version, version, change_seq | | | |

### `settlement_allocation` (C/R, ENV/LEDGER)
`id`, `settlement_txn_id` → txn, `open_item_id` → open_item, `kind text check in ('payment','offset','write_off',
'advance_use','advance_return','reversal')`, `amount_enc`, `key_version`, `reversal_of_id` → settlement_allocation,
`created_at`. One payment → many items, one item → many payments (§32–§35); never updated.

### `custody_event` (C/R, ENV)
`id`, `txn_id`, `entity_id` (owner of the money), `fund_id` → `fund (id, entity_id)`, `from_location_id`,
`to_location_id` (check different), `from_holder_person_id`, `to_holder_person_id`, `amount_enc`, `key_version`,
`status text check in ('recorded','awaiting_confirmation','confirmed','disputed','cancelled')`, `initiated_by`,
`initiated_at`, `confirmed_by`, `confirmed_at`, `dispute_reason`, `version`.

### `approval_request` (R, ENV)
`id`, `target_type text check in ('txn','config_change','period_reopen','share','access_grant')`, `txn_id` (set when
the target is a transaction), `target_id uuid`, `approval_rule_id`, `step_no smallint`, `required_permission text`,
`status text check in ('pending','approved','rejected','withdrawn','superseded')`, `requested_by`, `requested_at`,
`decided_by`, `decided_at`, `comment`, `step_up_method`, `version`. Check: decided columns set exactly when not pending.
**Segregation trigger:** under a rule with `segregation`, `decided_by` may not be the maker (J6).

### `period_close_run` (R, ENV)
`id`, `period_id`, `kind text check in ('close','reopen')`, `outcome text check in ('clean','needs_review','critical',
'completed')`, `checklist jsonb` (each check and its result — no amounts), `closing_txn_id`, `reason` (required for
reopen), `performed_by`, `performed_at`, `step_up_method`.

---

## Control

### `reconciliation` (C/R, ENV)
`id`, `reference` (`RC-…`), `scope text check in ('location','bank','person','fund','open_items','inter_entity')`,
`entity_id`, `location_id`, `counterparty_entity_id`, `as_of timestamptz`, `expected_enc`, `actual_enc`,
`difference_enc`, `key_version`, `status`, `resolution text check in ('no_difference','found_entry','adjustment',
'suspense','write_off')`, `adjustment_txn_id` → txn, `notes_enc`, `created_by`, `approved_by`, `closed_at`, `version`.
Never edits a balance; an adjustment is a posted transaction linked here (S, AC10.11).

### `bank_statement_import`, `bank_statement_line` (C/R, ENV)
- import: `id`, `location_id`, `attachment_id`, `period_from`, `period_to`, `line_count`, `status text check in
  ('parsed','reviewed','committed','discarded')`, `imported_by`, `imported_at`.
- line: `id`, `import_id`, `line_no`, `value_date`, `direction text check in ('in','out')`, `amount_enc`,
  `amount_bidx`, `key_version`, `description`, `bank_reference`, `status text check in ('unmatched','matched',
  'ignored','duplicate')`, `matched_txn_id`, `matched_by`, `matched_at`. Unique `(import_id, line_no)`.

### `exception_finding` (C/R, ENV/SYS)
`id`, `rule_key` (duplicate_txn, aging_suspense, non_reciprocal_due, snapshot_mismatch, chain_broken, unsettled_advance,
personal_from_business…), `severity text check in ('info','warning','critical')`, `status`, `env_entity_id` (scope for
visibility), `txn_id`, `open_item_id`, `location_id`, `integrity_run_id`, `fingerprint text unique` (no duplicate
findings), `summary text` (never an amount), `details_enc`, `key_version`, `detected_at`, `acknowledged_by`,
`resolved_by`, `resolved_at`, `resolution_note`.

### `integrity_run` (P, SYS)
`id`, `kind text check in ('scheduled','on_demand','pre_close','restore_drill')`, `started_at`, `finished_at`,
`outcome text check in ('running','clean','findings','error')`, `journals_checked`, `lines_checked`, `slices_checked`,
`findings_count`, `chain_verified_to bigint`.

---

## Files and sharing

### `attachment` (R, ENV)
`id`, `env_entity_id`, `kind_id` → `lookup_value (document_kind)`, `storage_key text unique` (random object name),
`content_type`, `size_bytes bigint check > 0`, `sha256 bytea`, `is_encrypted bool` (file key derived from the KEK and
the attachment id — no key stored), `key_version`, `status text check in ('active','replaced','removed')`,
`replaced_by_id`, `scan_status text check in ('pending','clean','rejected','not_scanned')`, `uploaded_by`,
`uploaded_at`, `removed_by`, `removed_at`, `removal_reason`.

### `attachment_link` (R, ENV)
`id`, `attachment_id`, exactly one of `txn_id | reconciliation_id | custody_event_id | expense_event_id | entity_id`
(`CHECK (num_nonnulls(...) = 1)`), `created_by`, `created_at`.

### `document` (R, ENV)
`id`, `kind text check in ('message','photo_proof','pdf','secure_pdf')`, `source text check in ('txn','report')`,
`txn_id`, `report_definition_id`, `params jsonb`, `template_id`, `storage_key` (null for a message: its text is
regenerated, only its hash is kept), `content_hash bytea not null`, `generated_by`, `generated_at`,
`supersedes_document_id`, `expires_at`, `status text check in ('active','expired','revoked','superseded')`.

### `share_profile`, `share_request`, `share_event`, `secure_link`, `secure_link_access` (R, OWN)
- `share_profile`: `id`, `owner_user_id`, `contact_id`, `name`, `default_format`, `allowed_formats text[]`,
  `visible_fields text[]`, `hidden_fields text[]`, `security jsonb`, `require_recipient_verification bool`,
  `step_up_required bool`, [std].
- `share_request`: `id`, `reference` (`SH-…`), `initiated_by`, `source text check in ('txn','report')`, `txn_id`,
  `report_definition_id`, `report_params jsonb`, `contact_id`, `channel text check in ('whatsapp','share_sheet',
  'secure_viewer_link')`, `format text check in ('message','photo','pdf','secure_pdf','secure_viewer')`,
  `share_profile_id`, `document_id`, `visible_fields text[]`, `security_config jsonb`, `content_hash`,
  `verification_hash`, `status`, `step_up_method`, `expires_at`, `created_at`, `confirmed_at`, `handed_off_at`,
  `cancelled_at`, `failure_code`, `replaces_request_id`, `version`. Check: `confirmed` and later require
  `verification_hash`.
- `share_event`: `id bigint identity`, `share_request_id`, `event text check in ('created','previewed',
  'recipient_verified','user_verified','confirmed','handed_off','cancelled','failed','invalidated','revoked','expired')`,
  `actor_user_id`, `occurred_at`, `step_up_method`, `details jsonb` (no secrets, no amounts).
- `secure_link`: `id`, `share_request_id`, `token_hash bytea unique`, `watermark_text`, `expires_at not null`,
  `max_views int`, `view_count int default 0 check ≥ 0`, `revoked_at`, `revoked_by`, `created_at`.
- `secure_link_access`: `id bigint identity`, `secure_link_id`, `accessed_at`, `outcome text check in ('shown','expired',
  'revoked','limit_reached','invalid')`, `ip inet`, `user_agent`.

---

## Operations

### `idempotency_record` (R, OWN)
`user_id`, `key uuid` (the `Idempotency-Key` header, or the phone's operation id offline), PK `(user_id, key)`,
`device_id`, `operation text`, `request_hash bytea` (same key + different body = refused), `status text check in
('in_progress','completed','failed')`, `result_type text`, `result_id uuid`, `http_status smallint`, `error_code text`,
`created_at`, `completed_at`, `expires_at`. Stores **no response body**: a replay re-reads the result under the
caller's current permissions.

### `sync_review` (R, OWN)
`id`, `user_id`, `idempotency_key` — FK `(user_id, idempotency_key) → idempotency_record`, `reason text check in
('conflict','stale','permission_changed','master_inactive','validation_failed')`, `details jsonb`, `status text check
in ('open','resolved','discarded')`, `resolved_by`, `resolved_at`, `resolution_txn_id`.

### `notification` (R, OWN)
`id`, `user_id`, `event_key`, `severity`, `content_mode text check in ('full','masked','generic')`, `resource_type`,
`resource_id` — **no amounts or names stored**: content is rendered when opened, after a fresh permission check (R5),
`created_at`, `push_status text check in ('none','queued','sent','failed')`, `read_at`, `dismissed_at`.

### `audit_log` (C/R, ENV/OWN)
`id bigint identity PK`, `occurred_at`, `actor_user_id`, `actor_session_id`, `actor_device_id`, `auth_strength`,
`action text` (`txn.posted`, `access.granted`, `share.confirmed`, `resource.viewed`…), `object_type`, `object_id`,
`env_entity_id` (whose environment — visibility), `changes_enc` (before/after, encrypted), `key_version`, `reason`,
`txn_id`, `approval_request_id`, `share_request_id`, `request_id uuid`, `ip inet`, `prev_hash bytea`,
`row_hash bytea` (HMAC chain), `hash_key_version`. Append-only: no `UPDATE`/`DELETE` privilege, trigger refuses both.

### `audit_chain_head` (P, SYS)
`id smallint PK check (id = 1)`, `last_id bigint`, `last_hash bytea`.
