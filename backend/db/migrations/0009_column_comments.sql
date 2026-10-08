-- 0009 column meanings for the data dictionary (add-on 11 item 26): the columns of the financial and security tables
-- whose meaning is not obvious from their name or their foreign key. Standard columns (id, version, created_*,
-- updated_at, change_xid, key_version, status) and plain foreign keys are explained by the dictionary generator.
-- Data impact: none (comments only). Recovery: none needed.

set local role finly_owner;

-- Master transaction
comment on column finly.txn.reference is 'Human reference TX-YYYYMMDD-NNNNNN, allocated when the draft is created; gapless per day';
comment on column finly.txn.txn_type_id is 'Configurable type (its label, e.g. Javak) over the engine intent';
comment on column finly.txn.intent_type is 'Engine intent that decides the accounting; copied from the type and frozen on submission';
comment on column finly.txn.status is 'draft, pending_approval, approved, posted, rejected, failed, cancelled, reversed, corrected (state machine)';
comment on column finly.txn.primary_env_id is 'Environment the event was entered in: who may edit the draft and where it is listed first';
comment on column finly.txn.value_date is 'Transaction date: decides the accounting period (AC8)';
comment on column finly.txn.value_time is 'Time of the event, when known';
comment on column finly.txn.entered_at is 'When it was entered (may be later than the value date)';
comment on column finly.txn.submitted_at is 'When it left draft';
comment on column finly.txn.approved_at is 'When the last approval step was given';
comment on column finly.txn.posted_at is 'When its journals were posted';
comment on column finly.txn.currency is 'INR only (whole rupees); foreign currency is a later module';
comment on column finly.txn.options is 'Non-sensitive engine options (route, treatment, via_transit); never amounts';
comment on column finly.txn.created_by_user_id is 'The maker (J6); may not approve under segregation of duties';
comment on column finly.txn.handled_by_entity_id is 'Person who physically handled the money (H3)';
comment on column finly.txn.payment_method_id is 'Cash, bank, UPI, card, cheque, wallet…';
comment on column finly.txn.confidentiality_level_id is 'Confidentiality of the event as a whole';
comment on column finly.txn.device_id is 'Device it was entered on';

comment on column finly.txn_leg.seq is 'Order of the leg within its kind (sources[n], allocations[n]) — the engine''s LegRef index';
comment on column finly.txn_leg.leg_kind is 'source (whose money, from where), destination (where it went), allocation (whose expense)';
comment on column finly.txn_leg.entity_id is 'Owner of this leg: the payer for a source, the expense owner for an allocation';
comment on column finly.txn_leg.location_id is 'Where the money was or went (sources and destinations)';
comment on column finly.txn_leg.fund_id is 'Fund of the leg''s entity; required for entities with books (decides visibility)';
comment on column finly.txn_leg.category_id is 'Expense or income category (allocations)';
comment on column finly.txn_leg.counterparty_entity_id is 'The other party where the leg concerns one';
comment on column finly.txn_leg.amount_enc is 'The leg amount: encrypted positive whole rupees';
comment on column finly.txn_leg.amount_bucket is 'HMAC of the amount band (range filters)';
comment on column finly.txn_leg.treatment is 'F8: withdrawal or owes, when firm money pays its owner''s personal expense';
comment on column finly.txn_leg.attributes is 'Non-sensitive extra engine attributes';

comment on column finly.txn_entity.role is 'How the entity takes part: payer, owner, receiver, giver, holder, counterparty, lender, borrower, settler';
comment on column finly.txn_entity.value_date is 'Copy of txn.value_date for one-index activity lists (kept equal by a cascading key)';
comment on column finly.txn_entity.ack_status is 'Acknowledgement by that environment''s owner, when policy asks for it (Q1)';
comment on column finly.txn_note.env_entity_id is 'Whose side of the event the note belongs to; only that environment can read it';
comment on column finly.txn_note.note_enc is 'The note, encrypted';
comment on column finly.txn_link.kind is 'reverses, corrects, partially_reverses, refunds, replaces, duplicate_of, confirms';

-- Journals and lines
comment on column finly.journal.step is 'Order inside the event; through-owner flows post two linked steps';
comment on column finly.journal.kind is 'standard, transfer, settlement, opening, adjusting, closing, reversal, correction (engine JOURNAL_KINDS)';
comment on column finly.journal.period_id is 'Open accounting period of the same entity that contains the value date';
comment on column finly.journal.posted_by_user_id is 'Who posted it';
comment on column finly.journal.posting_rule_version_id is 'Posting rule (engine version) that produced it (AC15)';
comment on column finly.journal.reversal_of_journal_id is 'The journal this one mirrors; a journal is reversed at most once';
comment on column finly.journal.chain_seq is 'Position in the global journal hash chain';
comment on column finly.journal.prev_hash is 'content_hash of the previous journal in the chain';
comment on column finly.journal.content_hash is 'HMAC-SHA-256 of the canonical content including plaintext amounts (tamper evidence)';
comment on column finly.journal.hash_key_version is 'Version of the hash-chain key';
comment on column finly.journal_line.line_no is 'Order of the line in its journal';
comment on column finly.journal_line.ledger_account_id is 'Ledger account of the same entity (composite key)';
comment on column finly.journal_line.fund_id is 'Fund of the same entity (composite key); every fund in a journal balances';
comment on column finly.journal_line.side is 'Dr or Cr; direction is never a negative amount';
comment on column finly.journal_line.amount_enc is 'Encrypted positive whole rupees';
comment on column finly.journal_line.location_id is 'Money location, on cash, bank and wallet lines only';
comment on column finly.journal_line.counterparty_entity_id is 'Who owes or is owed, on receivable, payable, advance, loan and capital lines';
comment on column finly.journal_line.category_id is 'Category, on income and expense lines';
comment on column finly.journal_line.expense_event_id is 'Trip, visit or project the line belongs to';
comment on column finly.journal_line.holder_person_id is 'Who held the location when posted (custody snapshot)';
comment on column finly.journal_line.txn_leg_id is 'Business leg that produced the line (drill-down)';
comment on column finly.journal_line.memo_enc is 'Optional line note, encrypted';

-- Balances
comment on column finly.balance_slice.location_id is 'Dimension: money location (money accounts)';
comment on column finly.balance_slice.counterparty_entity_id is 'Dimension: the other party (party accounts)';
comment on column finly.balance_slice.category_id is 'Dimension: category (income and expense accounts)';
comment on column finly.balance_current.balance_enc is 'Encrypted signed running balance, Dr minus Cr';
comment on column finly.balance_current.line_count is 'Lines included so far (a cheap first check for the verifier)';
comment on column finly.balance_current.last_journal_id is 'Last journal that changed this balance';
comment on column finly.balance_period.debits_enc is 'Encrypted total of debits in the period';
comment on column finly.balance_period.credits_enc is 'Encrypted total of credits in the period';
comment on column finly.balance_period.closing_enc is 'Encrypted closing balance, fixed when the period closes; the next opening';

-- Obligations
comment on column finly.open_item.reference is 'Human reference OI-YYYYMMDD-NNNNNN';
comment on column finly.open_item.kind is 'interentity, supplier_payable, customer_receivable, advance, loan';
comment on column finly.open_item.debtor_entity_id is 'Who owes';
comment on column finly.open_item.creditor_entity_id is 'Who is owed';
comment on column finly.open_item.debtor_role is 'Ledger role the debtor carries it on (null when the debtor keeps no books)';
comment on column finly.open_item.creditor_role is 'Ledger role the creditor carries it on (null when the creditor keeps no books)';
comment on column finly.open_item.debtor_fund_id is 'Fund the debtor carries it in; a settlement clears it there';
comment on column finly.open_item.creditor_fund_id is 'Fund the creditor carries it in; a settlement clears it there';
comment on column finly.open_item.origin_txn_id is 'Event that created the obligation';
comment on column finly.open_item.original_enc is 'Original amount, encrypted';
comment on column finly.open_item.due_date is 'When it is due (aging)';
comment on column finly.open_item.settled_at is 'When it was fully settled or written off';
comment on column finly.open_item_origin.side is 'Which side''s line: debtor or creditor';
comment on column finly.settlement_allocation.settlement_txn_id is 'The settling event (payment, set-off, advance accounting, write-off)';
comment on column finly.settlement_allocation.kind is 'payment, offset, advance_use, advance_return, write_off, reversal';
comment on column finly.settlement_allocation.amount_enc is 'Amount of the item this settled, encrypted';
comment on column finly.settlement_allocation.reversal_of_id is 'The allocation a reversal undoes (at most once)';
comment on column finly.balance_hold.kind is 'reservation, lock, or pending_outgoing (counts against available balance from submission, AC9)';
comment on column finly.balance_hold.amount_enc is 'Held amount, encrypted';
comment on column finly.balance_hold.hold_status is 'active, released, consumed';

-- Custody and locations
comment on column finly.custody_event.entity_id is 'Owner of the money; unchanged by a handover';
comment on column finly.custody_event.from_holder_person_id is 'Who handed it over';
comment on column finly.custody_event.to_holder_person_id is 'Who received it (and confirms, when confirmation is on)';
comment on column finly.custody_event.custody_status is 'recorded, awaiting_confirmation, confirmed, disputed, cancelled';
comment on column finly.custody_event.amount_enc is 'Amount handed over, encrypted';
comment on column finly.location.name is 'Label (Tijori, Savan Bank); renamable';
comment on column finly.location.kind is 'cash, bank or wallet: which ledger account role the engine uses';
comment on column finly.location.type_id is 'Configurable type: vault, drawer, locker, wardrobe, hand cash, bank account, UPI…';
comment on column finly.location.managed_in_env_id is 'Environment it belongs to (who manages it, who sees it by default)';
comment on column finly.location.disclosure is 'How its name is shown: name, generic, hidden, owner_only (L11)';
comment on column finly.location.negative_policy is 'forbid, allow, or allow with approval (J3)';
comment on column finly.location.overdraft_limit_enc is 'Overdraft limit, encrypted';
comment on column finly.location.handover_confirmation is 'inherit the system default (OFF, F2), required, or off';
comment on column finly.location_access.change_id is 'One user action: Replace = one revoke and one grant sharing this id';
comment on column finly.location_access.change_kind is 'initial, add, replace, revoke';
comment on column finly.location_access.revoke_change_id is 'Change that ended this access';
comment on column finly.location_holder.person_entity_id is 'Who holds the key or control; null = unassigned';
comment on column finly.location_holder.valid_from is 'From when';
comment on column finly.location_holder.valid_to is 'Until when; null = current';
comment on column finly.location_ownership.owner_entity_id is 'Owner of the location itself (not the money in it); null = unowned';
comment on column finly.fund.key is 'Stable key within the entity';
comment on column finly.fund.kind_id is 'Operating, owner, reserve, travel, emergency, project, restricted, private';
comment on column finly.fund.is_default is 'The fund used when none is chosen; exactly one per entity';
comment on column finly.fund.controller_entity_id is 'Person who controls the fund';
comment on column finly.ledger_account.code is 'Account code within the entity (1100 Cash …); stable identifier in the chart';
comment on column finly.ledger_account.class is 'asset, contra_asset, liability, equity, drawings, revenue, expense, cogs';
comment on column finly.ledger_account.normal_side is 'Dr or Cr, derived from the class';
comment on column finly.ledger_account.requires_location is 'Lines need a location (cash, bank, wallet)';
comment on column finly.ledger_account.requires_counterparty is 'Lines need a counterparty (party accounts)';
comment on column finly.ledger_account.requires_category is 'Lines need a category (income and expense accounts)';
comment on column finly.ledger_account.is_system is 'Created from the chart template';

-- Entities and access
comment on column finly.entity.entity_type_id is 'Sub-type of the same kind (company, customer, Angadiya…)';
comment on column finly.entity.display_name is 'Label (Mint, Krish); editable, never identity';
comment on column finly.entity.short_code is 'Optional short business code, unique case-insensitively';
comment on column finly.entity.has_books is 'True for firms, people and pools; outside parties keep no books';
comment on column finly.entity_membership.org_entity_id is 'The firm or pool';
comment on column finly.entity_membership.member_entity_id is 'The person (or a firm inside a pool)';
comment on column finly.entity_membership.engine_role is 'owner, partner, staff, other — owner or partner counts as an owner for the engine (F3, F8)';
comment on column finly.entity_membership.relation_label_id is 'Displayed relation (Owner, Partner, Worker, Family…)';
comment on column finly.env_access.level is 'read, write, manage';
comment on column finly.env_access.source is 'self, admin, owner_grant, temporary, break_glass';
comment on column finly.env_access.granted_by is 'The actor who granted it (null only for self access)';
comment on column finly.env_access.valid_until is 'End of temporary access; access ends by itself';
comment on column finly.access_rule.subject_type is 'user, role, or everyone';
comment on column finly.access_rule.env_entity_id is 'Environment the rule is scoped to; null = all';
comment on column finly.access_rule.resource_type is 'entity, fund, location, ledger_account, category, txn_type, confidentiality_level, field, report, txn';
comment on column finly.access_rule.actions is 'Independent actions (L2): discover, view, view_amount, create, approve, export, share_* …';
comment on column finly.access_rule.effect is 'allow or deny; deny wins (L8)';
comment on column finly.access_rule.amount_visibility is 'full, rounded, range, hidden, existence (L4)';
comment on column finly.access_rule.detail_level is 'Transaction detail level 1-5 (L5)';
comment on column finly.access_rule.conditions is 'ABAC conditions (transaction type, device trust, authentication strength…)';
comment on column finly.access_rule.source is 'role_default, admin, owner, temporary, share';
comment on column finly.approval_request.target_type is 'txn, config_change, period_reopen, share, access_grant';
comment on column finly.approval_request.required_permission is 'Permission an approver needs for this step';
comment on column finly.approval_request.request_status is 'pending, approved, rejected, withdrawn, superseded';
comment on column finly.approval_request.step_up_method is 'How the approver confirmed it: biometric, M-PIN, password, MFA';
comment on column finly.accounting_period.period_status is 'open or closed; months close in order and reopen in reverse order';

-- Sharing, audit, operations
comment on column finly.share_request.content_hash is 'SHA-256 of exactly what was previewed';
comment on column finly.share_request.verification_hash is 'Hash binding content, recipient, fields, security and expiry; any change invalidates it (Q3)';
comment on column finly.share_request.share_status is 'draft, previewed, recipient_verified, confirmed, handed_off, cancelled, failed, invalidated';
comment on column finly.share_request.channel is 'whatsapp, share_sheet, secure_viewer_link; hand-off is never called "sent"';
comment on column finly.secure_link.token_hash is 'Hash of the viewer token; the token itself is never stored';
comment on column finly.audit_log.action is 'What happened (txn.posted, access.granted, share.confirmed, resource.viewed…)';
comment on column finly.audit_log.object_type is 'Kind of object acted on';
comment on column finly.audit_log.env_entity_id is 'Whose environment the row belongs to (decides who may read it)';
comment on column finly.audit_log.changes_enc is 'Before and after values, encrypted';
comment on column finly.audit_log.auth_strength is 'How strongly the actor was authenticated (1 password, 2 + MFA, 3 + device step-up)';
comment on column finly.audit_log.request_id is 'Correlation id of the API request';
comment on column finly.audit_log.prev_hash is 'row_hash of the previous audit row';
comment on column finly.audit_log.row_hash is 'HMAC chain link over this row (tamper evidence)';
comment on column finly.idempotency_record.key is 'The Idempotency-Key of the request, or the phone''s offline operation id';
comment on column finly.idempotency_record.request_hash is 'Hash of the request body: the same key with a different body is refused';
comment on column finly.idempotency_record.record_status is 'in_progress, completed, failed (a failure is recorded in its own short transaction)';
comment on column finly.idempotency_record.result_id is 'What the request produced; a replay re-reads it under current permissions';
comment on column finly.user_credential.is_temporary is 'A temporary password that must be changed at first sign-in';
comment on column finly.user_credential.failed_count is 'Consecutive failed sign-ins (throttling and lockout)';
comment on column finly.unlock_credential.mpin_reset_required is 'Set by a Super Admin force-reset (N5)';
comment on column finly.unlock_credential.key_invalidated_at is 'When a device-security change invalidated local unlock (N6)';
comment on column finly.auth_session.auth_strength is '1 password, 2 + MFA, 3 + device step-up';
comment on column finly.auth_session.idle_expires_at is 'Ends after this much inactivity';
comment on column finly.auth_session.absolute_expires_at is 'Ends at this time whatever happens (N3)';
comment on column finly.device.public_key is 'Android Keystore public key of a biometric-bound key pair (step-up signatures)';
comment on column finly.app_user.username_key is 'Lower-case username, unique';
comment on column finly.app_user.must_change_password is 'True until the temporary password is replaced';
