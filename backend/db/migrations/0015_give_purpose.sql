-- 0015 F8/F9 rules as modified by the owner (GATE-RESPONSE-05 §2–§3, D-039; docs/accounting/F8-F9-model.md §6):
--   * money given carries its actual purpose and, separately, whether it is repayable; the posting rule for `give`
--     moves to version 2 (purpose-validated) and version 1 is retired;
--   * a firm's distribution of profit is equity, not an expense: new firm account 3160 "Profit distributions"
--     (role owner_distributions, a drawings-class contra-equity account with the owner as counterparty);
--   * the receiver's side is an income category the user chooses, never a mirror of the giver's expense: new
--     accounts 4700 "Profit share and distributions received", 4800 "Gifts received", 5850 "Gifts and donations"
--     and the categories that post to them.
-- Data impact: entities that already have a chart receive the new accounts (no balances change). Recovery: forward
-- fix; the new accounts are unused until something posts to them.

set local role finly_owner;

alter table finly.ledger_account drop constraint ledger_account_role_check;
alter table finly.ledger_account add constraint ledger_account_role_check check (role in (
  'cash', 'bank', 'wallet', 'interentity_receivable', 'advances_given', 'loans_given', 'customer_receivable',
  'investment_in_firms', 'cash_in_transit', 'suspense', 'interentity_payable', 'supplier_payable', 'loans_taken',
  'advances_received', 'owner_capital', 'owner_drawings', 'owner_distributions', 'opening_balance_equity',
  'retained_earnings', 'revenue', 'expense'));

insert into finly.coa_template_account
  (entity_kind, code, name, class, role, requires_location, requires_counterparty, requires_category, sort_order) values
  ('firm', '3160', 'Profit distributions', 'drawings', 'owner_distributions', false, true, false, 435),
  ('firm', '4700', 'Profit share and distributions received', 'revenue', 'revenue', false, false, true, 662),
  ('person', '4700', 'Profit share and distributions received', 'revenue', 'revenue', false, false, true, 663),
  ('pool', '4700', 'Profit share and distributions received', 'revenue', 'revenue', false, false, true, 664),
  ('firm', '4800', 'Gifts received', 'revenue', 'revenue', false, false, true, 665),
  ('person', '4800', 'Gifts received', 'revenue', 'revenue', false, false, true, 666),
  ('pool', '4800', 'Gifts received', 'revenue', 'revenue', false, false, true, 667),
  ('firm', '5850', 'Gifts and donations', 'expense', 'expense', false, false, true, 1112),
  ('person', '5850', 'Gifts and donations', 'expense', 'expense', false, false, true, 1113),
  ('pool', '5850', 'Gifts and donations', 'expense', 'expense', false, false, true, 1114);

insert into finly.category (kind, key, name, account_code, sort_order) values
  ('expense', 'gifts_given', 'Gifts given', '5850', 205),
  ('expense', 'donations', 'Donations', '5850', 206),
  ('income', 'distribution_received', 'Profit share received', '4700', 305),
  ('income', 'gift_received', 'Gift received', '4800', 306);

-- Every entity that already keeps a chart gets the new template accounts of its kind.
insert into finly.ledger_account (entity_id, code, name, class, role, requires_location, requires_counterparty,
  requires_category, is_system)
select e.id, t.code, t.name, t.class, t.role, t.requires_location, t.requires_counterparty, t.requires_category, true
from finly.coa_template_account t
join finly.entity e on e.kind = t.entity_kind
where t.code in ('3160', '4700', '4800', '5850')
  and exists (select 1 from finly.ledger_account a where a.entity_id = e.id)
  and not exists (select 1 from finly.ledger_account a where a.entity_id = e.id and a.code = t.code);

update finly.posting_rule_version set rule_status = 'retired' where intent_type = 'give' and rule_version = 1;
insert into finly.posting_rule_version (intent_type, rule_version, engine_version, definition)
values ('give', 2, '0.3.0', jsonb_build_object(
  'planner', 'backend/src/domain/engine/plan.ts#give',
  'spec', 'docs/accounting/F8-F9-model.md#6',
  'decision', 'D-039'));
