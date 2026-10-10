-- 0019 — Money in paise (D-045). Encrypted amounts change unit in the application, not here: values written from now
-- on carry a paise marker, and the 8-byte values written before are read as whole rupees × 100 (src/crypto/cipher.ts),
-- so no stored amount, ciphertext or hash chain is rewritten. This migration moves the one plaintext amount — an
-- approval threshold, which is policy, not a financial record — to paise, and records the unit.

alter table finly.approval_rule drop constraint approval_rule_min_amount_check;
update finly.approval_rule set min_amount = min_amount * 100 where min_amount is not null;
alter table finly.approval_rule add constraint approval_rule_min_amount_check
  check (min_amount > 0 and min_amount <= 99999999999999);
comment on column finly.approval_rule.min_amount is
  'Threshold in paise (D-045) from which the rule applies; null = every amount. Policy, not a financial record, so plaintext.';

insert into finly.system_setting (key, value, description) values
  ('money_unit', '"paise"', 'Amounts are exact integer paise (D-045); text and the API use rupees with up to two decimals')
on conflict (key) do nothing;
