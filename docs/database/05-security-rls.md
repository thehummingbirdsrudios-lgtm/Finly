# 5. Security, row-level security, privacy and audit

Add-on 11 items 14 (security and RLS), 15 (personal-finance privacy), 16 (audit) and §30 item 9. Requirements:
BUILD_PROMPT A4, A5, L, M, N, U2; RULEBOOK-03 §3–§9; [SECURITY.md](../SECURITY.md).

## 5.1 Layers

```text
phone (untrusted) ─TLS─► API: authenticate → session/device → policy engine (RBAC + ABAC + resource + field + amount
                         visibility + discovery) → handler
                              │ sets finly.actor_user_id / session / device / request (transaction-local)
                              ▼
                         PostgreSQL: role privileges → row-level security → constraints and triggers
                              ▼
                         ciphertext at rest (keys outside the database) → encrypted backups
```

A request that slips past the policy engine through a bug still meets privileges and RLS. A stolen dump meets
ciphertext. A stolen dump *and* the backup key still meets ciphertext without the KEK.

## 5.2 Database roles and privileges

| Role | Tables (privileges) |
|---|---|
| `finly_owner` | owns everything; used only by migrations |
| `finly_auth` | identity tables: `SELECT, INSERT, UPDATE` on `app_user`, `user_credential`, `mfa_factor`, `recovery_code`, `device`, `unlock_credential`, `auth_session`, `refresh_token`; `INSERT, SELECT` on `security_event`; `SELECT` on `role`, `permission`, `role_permission`, `user_role`, `system_setting`, `security_policy`, `emergency_control`; `INSERT` on `audit_log` |
| `finly_api` | `SELECT` through RLS on business tables; `INSERT/UPDATE` on drafts (`txn` in draft, `txn_leg`, `txn_entity`, `txn_tag`), master data, access configuration, shares, attachments metadata, notifications, idempotency, sync review; `INSERT` on `audit_log`; **no** `DELETE` on any table; **no** access to credential tables (it reads users through the `app_user_public` view: id, person, display name, status) |
| `finly_ledger` | every financial command in one transaction: `SELECT` on structural, balance and approval-rule tables; `INSERT` on `txn`, `txn_entity`, `txn_leg`, `txn_note`, `txn_link`, `journal`, `journal_line`, `balance_slice`, `balance_current`, `balance_period`, `open_item`, `open_item_origin`, `settlement_allocation`, `custody_event`, `balance_hold`, `approval_request`, `period_close_run`, `accounting_period`, `idempotency_record`, `exception_finding`, `notification`, `audit_log`; `INSERT`/`UPDATE` on `txn_acknowledgement` (requests, withdrawals); `UPDATE` on `txn` (status), `balance_current`, `balance_period`, `open_item`, `custody_event`, `balance_hold`, `approval_request`, `accounting_period`, `reconciliation`, `idempotency_record`, `journal_chain_head`, `audit_chain_head`; reference numbers through `finly.next_reference()` |
| `finly_system` | `SELECT` on everything except credential tables; `INSERT/UPDATE` on `integrity_run`, `exception_finding`, `period_close_run`, `notification`; retention deletes on expired sessions, refresh tokens and idempotency records only |
| `anon`, `authenticated`, `service_role`, `PUBLIC` | **nothing** on schema `finly` (revoked explicitly; a catalog test asserts it) |

Per-role safety settings (migration): `statement_timeout = '15s'`, `lock_timeout = '5s'`,
`idle_in_transaction_session_timeout = '30s'` for the API roles, so a stuck request can never hold money locks.

## 5.3 The actor and the visibility sets

Every API transaction starts with:

```sql
select set_config('finly.actor_user_id', $1, true),
       set_config('finly.actor_session_id', $2, true),
       set_config('finly.request_id', $3, true);
```

`true` makes the settings transaction-local. If they are missing, every policy below evaluates to false: **deny by
default**.

Helper functions (`SECURITY DEFINER`, `STABLE`, owned by `finly_owner`, `search_path` pinned to `finly, pg_temp`):

| Function | Returns |
|---|---|
| `finly.actor_user_id()` | the actor's user id or null |
| `finly.actor_person_id()` | the actor's person entity (only while the user is `active`) |
| `finly.actor_env_ids(min_level)` | environments the actor may enter at `read`, `write` or `manage` level: their own person entity; active, unexpired `env_access` rows; every firm if the actor holds `admin.full` (RULEBOOK-03 §7) — **never** another person's environment except through an owner grant, and pools only by explicit grant (Q13) |
| `finly.actor_hidden_ids(resource_type)` | funds or locations the actor must not see: explicit deny rules for the actor or the actor's roles, plus `owner_only` and stricter confidentiality on resources of entities the actor does not own |
| `finly.actor_has_permission(key, env)` | true when an active role (global or scoped to `env`) allows the permission and none denies it |

Policies call them as `(select finly.actor_env_ids('read'))::uuid[]` — a scalar subquery cast to an array, so
PostgreSQL evaluates each once per statement (an InitPlan), not once per row. Policies only look "down" to tables whose
own policies do not look back (tested: PostgreSQL refuses a policy loop); where a loop would arise, a definer helper
such as `finly.actor_access_location_ids()` reads the fact instead.

## 5.4 Policy classes

| Class | `SELECT` policy (role `finly_api`) | Write policy |
|---|---|---|
| **ENV** — entity-scoped financial and master rows (`ledger_account`, `fund`, `accounting_period`, `journal`, `journal_line`, `balance_*`, `custody_event`, `balance_hold`, `expense_event`, `attachment`, `reconciliation`…) | `entity_id = any(actor_env_ids('read'))` and, where the row has them, `fund_id <> all(actor_hidden_ids('fund'))`, `location_id is null or location_id <> all(actor_hidden_ids('location'))` | `with check` the same at `write` level; posted ledger rows are written only by `finly_ledger` |
| `entity` | its own id, its `managed_in_env_id`, or an organisation it belongs to is in the visible set; or it is a member of a visible organisation | `masters.manage` in the target environment |
| `location` | managed in a visible environment, or the actor currently has access to it, or it is the actor's own hand-cash location — and not hidden | `masters.manage` |
| `txn` | **a leg of it is visible** (so an event wholly inside a hidden fund or location stays hidden), or it is the actor's own draft in an environment they may still write to | drafts: `primary_env_id` at `write` level |
| `txn_entity`, `txn_leg`, `txn_note` | **their own `entity_id`** is visible (legs: and their fund and location are not hidden) — so the Mint side of an event is visible to a Mint user while Krish's personal leg, role and notes in the same event are not | drafts only |
| `open_item` | the debtor or creditor side is visible **and** that side's fund is not hidden | `finly_ledger` only |
| `settlement_allocation` | its open item is visible | `finly_ledger` only |
| **CFG** (categories, types, lookups, labels, roles, permissions, policies, templates…) | every signed-in actor | `masters.manage` (or the specific permission: `access.manage`, `security.manage`) |
| **OWN** (`notification`, `idempotency_record`, `personal_book_setting` (the person only), `support_session` (the person and the helper), `share_*`, `dashboard_config`, private `report_definition`) | `user_id`/`initiated_by`/`owner_user_id` = actor; share history also for holders of `share.audit` | same |
| `audit_log` | the actor's own actions; plus rows of visible environments for holders of `audit.view`; rows without an environment for holders of `audit.view_system` | `INSERT` only |
| **AUTH** | not granted to `finly_api` at all | — |

`finly_ledger` policies require only that an actor is set (`finly.actor_user_id() is not null`): the posting service
reads the counterpart side of an authorised event (Krish's books when Mint pays Krish's expense) without that reach
ever being available to a query handler. `finly_system` policies are `using (true)` on the tables it may read.

## 5.5 Personal-finance privacy (A4, RULEBOOK-03 §3–§6, §18)

1. Every person has private books (`entity` of kind person). The only automatic access is `env_access` with
   `source = 'self'` for that person's own user.
2. **No one else gets in without the owner.** A trigger on `env_access`, `access_rule` and `break_glass` refuses any
   allow/grant on a person's environment unless **the actor of the transaction** is that person — a `granted_by`
   value written by the caller proves nothing and must equal the actor. Grants and rules are never edited, only
   revoked, and a user's person can never be re-pointed (tested in `tests/db/rls_privacy_test.ts`). Super Admin, admins and break-glass
   are refused at the database, not only in the UI (A4, T2: "Cannot grant themselves access to someone's personal
   finance").
3. `admin.full` covers firms only (pools by explicit grant, Q13).
4. Firm membership grants nothing personal (RULEBOOK-03 §4): partners of Firm A each see Firm A and their own books.
5. Mixed events stay split: Krish paying ₹45,000 of which ₹10,000 is personal produces a Krish journal and a Krish
   allocation leg that only Krish (and his grantees) can read; Mint users see Mint's ₹30,000 and that Mint owes Krish.
6. Every grant and revoke is audited (`access.granted`, `access.revoked`) with the owner as actor.

## 5.6 Preventing indirect leakage (L3, L12)

| Leak path | Protection |
|---|---|
| Totals, averages, charts, trends, rankings | computed in the API from rows RLS already narrowed (authorised dataset → aggregate); a hidden slice never enters a sum |
| Counts, "no results", pagination totals | counts run over the same RLS-narrowed query; hidden rows are indistinguishable from non-existent rows |
| Search and autocomplete | the search query runs as `finly_api` under RLS; reason text is matched only where the policy engine grants detail level ≥ L3 for that environment |
| Location totals (Tijori = four owners) | sum of the *visible* entities' slices only (L12 example: Krish ₹12L, Father ₹8L, worker ₹3L) |
| Consolidated views and eliminations | only across entities fully visible to the viewer (AC14) |
| Reports, exports, PDFs, WhatsApp messages | generated from the same authorised query (Q2: filter before generating); export and share permissions are separate actions |
| Notifications | rows store no amounts or names; content is rendered when opened, after a fresh check; push text follows Full / Masked / Generic (R5) |
| Error messages | stable codes; "insufficient available balance" never reveals the balance (J3) |
| Logs and audit | no amounts or secrets in plaintext; `changes_enc` is encrypted; audit visibility follows environments |
| Timing / existence | discovery-denied resources return the same response as non-existent ones |

## 5.7 Encryption map

| Data | Treatment | Key |
|---|---|---|
| Every amount and balance (`*_amount_enc`, `balance_enc`, `debits_enc`, `credits_enc`, `closing_enc`, `original_enc`, `remaining_enc`, `expected/actual/difference_enc`, `overdraft_limit_enc`) | AES-256-GCM, fixed-width int64, AAD = table.column:row-id | `data` vN |
| Bank account numbers, GSTIN, PAN, phone numbers, push tokens, internal notes, memos, sensitive custom fields, audit before/after, finding details | AES-256-GCM | `data` vN |
| TOTP secrets | AES-256-GCM | `data` vN |
| Exact-amount search, phone lookup, account-number duplicate check | HMAC-SHA-256 truncated to 16 bytes, keyed per environment for amounts | `blind_index` vN |
| Amount bands for range filters | HMAC of the band id (₹0–1k, 1k–5k, 5k–10k, 10k–25k, 25k–50k, 50k–1L, 1L–5L, 5L–10L, 10L–1Cr, > 1Cr) | `blind_index` vN |
| Journal and audit hash chains | HMAC-SHA-256 over canonical content (plaintext amounts included) | `hash_chain` vN |
| Passwords | Argon2id (PHC string) | — |
| M-PIN | Argon2id of HMAC(pepper, PIN) | `mpin_pepper` vN |
| Refresh tokens, Secure Viewer tokens, recovery codes | SHA-256 / HMAC-SHA-256 of high-entropy random values | — / `blind_index` |
| Attachments and generated files | AES-256-GCM before upload; key = HKDF(KEK, "file" ‖ file id) | `file` vN |
| Names, reasons, dates, statuses, references, IDs | plaintext, RLS-restricted (reason: open question Q2) | — |

**Keys never live in the database** (Part M, S3): `key_version` holds version numbers only. Each purpose's key is
derived as `HKDF-SHA-256(KEK_v, info = "finly/" ‖ purpose ‖ "/v" ‖ n)` inside the API. Rotation adds `KEK_v+1`;
old versions stay `decrypt_only` until a `finly_system` re-encryption job (the one audited exception to line
immutability, touching only ciphertext and key version) moves the data forward.

**What the blind indexes reveal** to someone holding a dump: that two transactions of the same environment have the
same amount, or amounts in the same band. They do not reveal the amount. Accepted as the cost of searchable encrypted
amounts (I1, M); the alternative is no amount search at all.

## 5.8 Audit architecture (U2, add-on 11 item 16)

- **What:** every U2 event — sign-ins and failures (in `security_event`), and in `audit_log`: transaction create,
  submit, approve, reject, post, reverse, correct; allocation changes; access, role, visibility and confidentiality
  changes; owner grants; temporary access and break-glass; private-resource views (`resource.viewed` — "Krish viewed
  Mint Private Fund … Biometric"); master and configuration changes; reconciliation, close and reopen; exports,
  report and document generation; every share step; secure-link creation, access and revocation; attachment upload,
  replacement and removal; emergency controls; key rotation.
- **Fields:** who (`actor_user_id`, session, device, `auth_strength`), what (`action`, `object_type`, `object_id`),
  when, before/after (`changes_enc`), why (`reason`), related transaction, approval and share, request id, IP.
- **One row per environment for a mixed event**, each holding only that environment's part, so the audit trail of
  Mint never contains Krish's personal side.
- **Written by the API in the same database transaction** as the change it records (the HMAC chain key is outside the
  database, so triggers cannot compute it). A deferred constraint trigger on `journal` and on status changes of `txn`
  refuses to commit unless an `audit_log` row for that object was written in the same transaction — an audit entry
  cannot be forgotten.
- **Tamper evidence:** `row_hash = HMAC(prev_hash ‖ canonical row)`, serialised through `audit_chain_head`; the
  Integrity Verifier walks the chain. No role has `UPDATE` or `DELETE`; triggers refuse both anyway.
- **Who can read:** see 5.4. Super Admin reads system audit; personal-environment audit stays with its owner.
- **Retention:** `retention_policy` (proposed 8 years for financial records and their audit, Q8). Users and entities
  are archived, never deleted, so historical audit always resolves to a name (RULEBOOK-03 §59).
