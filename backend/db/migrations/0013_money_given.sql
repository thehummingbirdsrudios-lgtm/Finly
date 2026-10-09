-- 0013 F8/F9 as the owner decided them (GATE-RESPONSE-04, D-037; docs/accounting/F8-F9-model.md):
--   * a new event type `give` — money given from one entity to another with each side's treatment (Own/Expense)
--     and the repayment arrangement chosen explicitly;
--   * `nonowner_payment` and `interentity_transfer` are retired: both assumed a debt the moment money moved, which
--     the decision forbids. They stay for history and are no longer offered (inactive);
--   * txn_link kind `follows`: Transaction 2 (owner → anyone) may point at Transaction 1 (firm → owner) for
--     traceability, without re-posting it.
-- Data impact: none (nothing has been posted with the retired types in production). Recovery: forward fix.

set local role finly_owner;

alter table finly.txn_type drop constraint txn_type_intent_type_check;
alter table finly.txn_type add constraint txn_type_intent_type_check check (intent_type in (
  'transfer', 'transit_confirm', 'expense', 'bill', 'nonowner_payment', 'give', 'income', 'unidentified_receipt',
  'advance_give', 'advance_account', 'loan', 'loan_repayment', 'capital_contribution', 'withdrawal',
  'interentity_transfer', 'settlement', 'offset', 'opening_balance', 'cash_adjustment', 'allocation_adjustment',
  'reversal', 'correction'));

insert into finly.txn_type (key, label, intent_type, sort_order) values ('give', 'Money given', 'give', 30);
update finly.txn_type set status = 'inactive' where key in ('nonowner_payment', 'interentity_transfer');

insert into finly.posting_rule_version (intent_type, rule_version, engine_version, definition)
values ('give', 1, '0.2.0', jsonb_build_object(
  'planner', 'backend/src/domain/engine/plan.ts#give', 'spec', 'docs/accounting/F8-F9-model.md'));

alter table finly.txn_link drop constraint txn_link_kind_check;
alter table finly.txn_link add constraint txn_link_kind_check check (kind in (
  'reverses', 'corrects', 'partially_reverses', 'refunds', 'replaces', 'duplicate_of', 'confirms', 'follows'));
comment on column finly.txn_link.kind is
  'reverses / corrects / partially_reverses / refunds / replaces / duplicate_of / confirms / follows (a later event that continues an earlier one, e.g. F9 after F8; never a re-posting)';
