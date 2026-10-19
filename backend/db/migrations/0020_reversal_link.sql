-- 0020 — Reversal and correction (docs/PLAN.md M3, RULEBOOK-01 §56–57, docs/architecture/operations.md §2.6).
--
-- A reversal or correction is an ordinary event that names the posted event it undoes. Naming it on the event itself
-- (not only in txn_link, which is written when it posts) lets the database refuse a second live attempt while the
-- first still waits — for someone's acknowledgement or approval — so an entry is never undone twice and never by two
-- requests racing. A refused, failed or cancelled attempt frees the entry again. A reversal into an account, fund or
-- place deactivated since the original stays refused until it is reactivated (08-open-questions Q10; the journal-line
-- guard of 0005 already says so). Data impact: one nullable column on txn, empty for every existing row (no reversal
-- has been recorded before). Recovery: forward fix.

set local role finly_owner;

alter table finly.txn add column reverses_txn_id uuid references finly.txn (id);
alter table finly.txn add constraint txn_reverses_matches_intent
  check ((intent_type in ('reversal', 'correction')) = (reverses_txn_id is not null));
alter table finly.txn add constraint txn_reverses_other check (reverses_txn_id <> id);
comment on column finly.txn.reverses_txn_id is
  'For a reversal or correction: the posted event it undoes. At most one live attempt per event (txn_one_live_reversal).';
create unique index txn_one_live_reversal on finly.txn (reverses_txn_id)
  where reverses_txn_id is not null and status not in ('rejected', 'failed', 'cancelled');
