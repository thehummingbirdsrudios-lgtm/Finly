/**
 * Writes a checked plan into the ledger tables (docs/database/06 §6.2 steps 11–14): journals and lines on the global
 * journal hash chain, open items with the lines that created them, settlement allocations against locked items, and
 * custody events for money moved between places. Every amount is encrypted with its row's own context. Callers hold
 * the period, open-item and slice locks already; this module takes the reference counter and then the chain head,
 * in that order (06 §6.3).
 */
import { type Cipher, ctx } from '../../crypto/cipher.ts';
import type { HashChain } from '../../crypto/chain.ts';
import type { Sql } from '../../db/sql.ts';
import type { Intent } from '../../domain/engine/intents.ts';
import { legsOf } from '../../domain/engine/legs.ts';
import { fail } from '../../domain/errors.ts';
import { type Id, uuidv7 } from '../../domain/ids.ts';
import type { PlannedLine, PostingPlan } from '../../domain/ledger/types.ts';
import type { DbContext } from './context.ts';
import { sliceKey } from './balances.ts';

export interface WriteInput {
  txnId: Id;
  actorUserId: Id;
  valueDate: string;
  intent: Intent;
  plan: PostingPlan;
  periodOf: (entityId: Id) => Id;
}

/** The hashed content of a journal: exactly what is stored, with plaintext amounts (rotation never breaks it). */
export function journalContent(j: {
  id: Id;
  txnId: Id;
  entityId: Id;
  step: number;
  kind: string;
  periodId: Id;
  valueDate: string;
  lines: { id: Id; lineNo: number; line: PlannedLine }[];
}): Record<string, unknown> {
  return {
    id: j.id,
    txn: j.txnId,
    entity: j.entityId,
    step: j.step,
    kind: j.kind,
    period: j.periodId,
    date: j.valueDate,
    lines: j.lines.map(({ id, lineNo, line }) => ({
      id,
      no: lineNo,
      account: line.accountId,
      fund: line.fundId,
      side: line.side,
      amount: line.amount,
      location: line.locationId ?? null,
      counterparty: line.counterpartyId ?? null,
      category: line.categoryId ?? null,
      holder: line.holderPersonId ?? null,
    })),
  };
}

export interface Written {
  /** Last journal id per slice key (for balance_current.last_journal_id). */
  lastJournal: Map<string, Id>;
  openItemIds: Id[];
}

export async function writeLedger(
  tx: Sql,
  keys: { cipher: Cipher; chain: HashChain },
  c: DbContext,
  input: WriteInput,
): Promise<Written> {
  const { cipher, chain } = keys;
  const { txnId, plan, valueDate } = input;
  const version = cipher.activeVersion();

  // Open-item references come from the reference counter, which is locked before the chain head (06 §6.3).
  const itemRefs: string[] = [];
  for (const _ of plan.openItems) {
    const [{ ref }] = await tx.query<{ ref: string }>(`select finly.next_reference('OI', $1::date) as ref`, [
      valueDate,
    ]);
    itemRefs.push(ref);
  }

  // Lines point at the legs recorded when the request was prepared (same derivation, same order).
  const legRows = await tx.query<{ id: string; leg_kind: string; seq: number }>(
    `select id, leg_kind, seq from finly.txn_leg where txn_id = $1`,
    [txnId],
  );
  const legId = new Map(legRows.map((r) => [`${r.leg_kind}:${r.seq}`, r.id]));
  const { legs, lineLeg } = legsOf(plan);

  const [head] = await tx.query<{ last_seq: string; last_hash: Uint8Array }>(
    `select last_seq, last_hash from finly.journal_chain_head where id = 1 for update`,
  );
  let seq = BigInt(head.last_seq);
  let prev: Uint8Array = new Uint8Array(head.last_hash);
  const lastJournal = new Map<string, Id>();
  const lineIds = new Map<PlannedLine, Id>();

  for (const j of plan.journals) {
    const journalId = uuidv7();
    const periodId = input.periodOf(j.entityId);
    const lines = j.lines.map((line, i) => ({ id: uuidv7(), lineNo: i + 1, line }));
    const content = journalContent({ ...j, id: journalId, txnId, periodId, valueDate, lines });
    const hash = await chain.link(prev, content, version);
    seq += 1n;
    await tx.query(
      `insert into finly.journal (id, txn_id, entity_id, step, kind, period_id, value_date, posted_by_user_id,
         chain_seq, prev_hash, content_hash, hash_key_version)
       values ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12)`,
      [
        journalId,
        txnId,
        j.entityId,
        j.step,
        j.kind,
        periodId,
        valueDate,
        input.actorUserId,
        seq.toString(),
        prev,
        hash,
        version,
      ],
    );
    for (const { id, lineNo, line } of lines) {
      const leg = lineLeg.get(line);
      const legRowId = leg === undefined ? null : legId.get(`${legs[leg].kind}:${legs[leg].seq}`) ?? null;
      if (leg !== undefined && !legRowId) fail('INTEGRITY', 'The entry changed after it was prepared.');
      await tx.query(
        `insert into finly.journal_line (id, journal_id, entity_id, value_date, line_no, ledger_account_id, fund_id,
           side, amount_enc, key_version, location_id, counterparty_entity_id, category_id, holder_person_id,
           txn_leg_id)
         values ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          id,
          journalId,
          j.entityId,
          valueDate,
          lineNo,
          line.accountId,
          line.fundId,
          line.side,
          await cipher.encryptAmount(line.amount, ctx('journal_line', 'amount_enc', id)),
          version,
          line.locationId ?? null,
          line.counterpartyId ?? null,
          line.categoryId ?? null,
          line.holderPersonId ?? null,
          legRowId,
        ],
      );
      lineIds.set(line, id);
      lastJournal.set(sliceKey(line), journalId);
    }
    prev = hash;
  }
  await tx.query(`update finly.journal_chain_head set last_seq = $1, last_hash = $2, updated_at = now() where id = 1`, [
    seq.toString(),
    prev,
  ]);

  const openItemIds: Id[] = [];
  for (const [i, o] of plan.openItems.entries()) {
    const id = uuidv7();
    await tx.query(
      `insert into finly.open_item (id, reference, kind, debtor_entity_id, creditor_entity_id, debtor_role,
         creditor_role, debtor_fund_id, creditor_fund_id, origin_txn_id, original_enc, remaining_enc, key_version,
         reason)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        itemRefs[i],
        o.kind,
        o.debtorId,
        o.creditorId,
        o.debtorRole ?? null,
        o.creditorRole ?? null,
        o.debtorFundId ?? null,
        o.creditorFundId ?? null,
        txnId,
        await cipher.encryptAmount(o.amount, ctx('open_item', 'original_enc', id)),
        await cipher.encryptAmount(o.amount, ctx('open_item', 'remaining_enc', id)),
        version,
        o.reason.slice(0, 500),
      ],
    );
    // The lines that carry the obligation on each side: the debtor's payable to the creditor, the creditor's
    // receivable from the debtor. A party keeps no books, so only one side may exist — but never neither.
    let origins = 0;
    for (const j of plan.journals) {
      for (const line of j.lines) {
        const role = c.account(line.accountId).role;
        const side = j.entityId === o.debtorId && line.counterpartyId === o.creditorId && role === o.debtorRole
          ? 'debtor'
          : j.entityId === o.creditorId && line.counterpartyId === o.debtorId && role === o.creditorRole
          ? 'creditor'
          : null;
        if (!side) continue;
        await tx.query(
          `insert into finly.open_item_origin (open_item_id, journal_line_id, side) values ($1, $2, $3)
           on conflict do nothing`,
          [id, lineIds.get(line), side],
        );
        origins++;
      }
    }
    if (origins === 0) fail('INTEGRITY', 'An outstanding item has no journal line behind it.');
    openItemIds.push(id);
  }

  const settled = new Map<Id, bigint>();
  for (const s of plan.settlements) {
    const id = uuidv7();
    await tx.query(
      `insert into finly.settlement_allocation (id, settlement_txn_id, open_item_id, kind, amount_enc, key_version)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        txnId,
        s.openItemId,
        s.kind,
        await cipher.encryptAmount(s.amount, ctx('settlement_allocation', 'amount_enc', id)),
        version,
      ],
    );
    settled.set(s.openItemId, (settled.get(s.openItemId) ?? 0n) + s.amount);
  }
  for (const [itemId, amount] of settled) {
    const item = c.openItem(itemId); // locked FOR UPDATE when the context was loaded
    if (amount > item.remaining) fail('SETTLEMENT_EXCEEDS_REMAINING', 'This settles more than is still outstanding.');
    const remaining = item.remaining - amount;
    await tx.query(
      `update finly.open_item set remaining_enc = $2, key_version = $3, item_status = $4,
         settled_at = case when $4 = 'settled' then now() end, version = version + 1
       where id = $1`,
      [
        itemId,
        await cipher.encryptAmount(remaining, ctx('open_item', 'remaining_enc', itemId)),
        version,
        remaining === 0n ? 'settled' : 'partially_settled',
      ],
    );
  }

  if (input.intent.type === 'transfer') {
    const t = input.intent;
    const id = uuidv7();
    await tx.query(
      `insert into finly.custody_event (id, txn_id, entity_id, fund_id, from_location_id, to_location_id,
         from_holder_person_id, to_holder_person_id, amount_enc, key_version, custody_status, initiated_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        txnId,
        t.entityId,
        t.fundId ?? c.entity(t.entityId).defaultFundId,
        t.fromLocationId,
        t.toLocationId,
        c.location(t.fromLocationId).currentHolderId ?? null,
        c.location(t.toLocationId).currentHolderId ?? null,
        await cipher.encryptAmount(t.amount, ctx('custody_event', 'amount_enc', id)),
        version,
        t.viaTransit ? 'awaiting_confirmation' : 'recorded',
        input.actorUserId,
      ],
    );
  }
  return { lastJournal, openItemIds };
}
