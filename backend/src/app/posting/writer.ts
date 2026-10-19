/**
 * Writes a checked plan into the ledger tables (docs/database/06 §6.2 steps 11–14): journals and lines on the global
 * journal hash chain, open items with the lines that created them, settlement allocations against locked items, and
 * custody events for money moved between places. A reversal or correction also gives back what the undone event
 * settled, closes the open items it created, cancels its waiting handovers, and moves it to `reversed` or `corrected`
 * with a link — nothing posted is edited. Every amount is encrypted with its row's own context. Callers hold the
 * period, open-item and slice locks already; this module takes the reference counter and then the chain head, in
 * that order (06 §6.3).
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
  reversalOfJournalId?: Id;
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
    // Only reversals carry it, so the content of every other journal hashes exactly as before.
    ...(j.reversalOfJournalId ? { reverses: j.reversalOfJournalId } : {}),
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
         chain_seq, prev_hash, content_hash, hash_key_version, reversal_of_journal_id)
       values ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13)`,
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
        j.reversalOfJournalId ?? null,
      ],
    );
    for (const { id, lineNo, line } of lines) {
      const leg = lineLeg.get(line);
      const legRowId = leg === undefined ? null : legId.get(`${legs[leg].kind}:${legs[leg].seq}`) ?? null;
      if (leg !== undefined && !legRowId) fail('INTEGRITY', 'The entry changed after it was prepared.');
      await tx.query(
        `insert into finly.journal_line (id, journal_id, entity_id, value_date, line_no, ledger_account_id, fund_id,
           side, amount_enc, key_version, location_id, counterparty_entity_id, category_id, holder_person_id,
           txn_leg_id, expense_event_id)
         values ($1, $2, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
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
          // The project, trip or event an expense line belongs to (BUILD_PROMPT H9); planned, now also kept.
          line.projectId ?? null,
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

  // What is still owed on each item touched: an unwind gives back what the undone event settled first, then this
  // event's own settlements apply — so a correction may settle again what the corrected payment settled. Every item
  // was locked FOR UPDATE when the context was loaded and is written once.
  const remaining = new Map<Id, bigint>();
  const owedNow = (itemId: Id) => remaining.get(itemId) ?? c.openItem(itemId).remaining;
  const unwind = plan.unwind;
  for (const a of unwind?.restoredAllocations ?? []) {
    const id = uuidv7();
    await tx.query(
      `insert into finly.settlement_allocation (id, settlement_txn_id, open_item_id, kind, amount_enc, key_version,
         reversal_of_id)
       values ($1, $2, $3, 'reversal', $4, $5, $6)`,
      [
        id,
        txnId,
        a.openItemId,
        await cipher.encryptAmount(a.amount, ctx('settlement_allocation', 'amount_enc', id)),
        version,
        a.allocationId,
      ],
    );
    remaining.set(a.openItemId, owedNow(a.openItemId) + a.amount);
  }
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
    remaining.set(s.openItemId, owedNow(s.openItemId) - s.amount);
  }
  for (const [itemId, left] of remaining) {
    const item = c.openItem(itemId);
    if (left < 0n) fail('SETTLEMENT_EXCEEDS_REMAINING', 'This settles more than is still outstanding.');
    if (left > item.original) fail('INTEGRITY', 'An outstanding item would be owed more than it started with.');
    await tx.query(
      `update finly.open_item set remaining_enc = $2, key_version = $3, item_status = $4,
         settled_at = case when $4 = 'settled' then now() end, version = version + 1
       where id = $1`,
      [
        itemId,
        await cipher.encryptAmount(left, ctx('open_item', 'remaining_enc', itemId)),
        version,
        left === 0n ? 'settled' : left === item.original ? 'open' : 'partially_settled',
      ],
    );
  }

  if (unwind) {
    for (const itemId of unwind.reversedOpenItems) {
      const closed = await tx.query(
        `update finly.open_item set item_status = 'reversed', version = version + 1
         where id = $1 and item_status = 'open' returning id`,
        [itemId],
      );
      if (closed.length === 0) {
        fail('REVERSAL_BLOCKED_BY_SETTLEMENT', 'Part of what this entry left owing has been settled meanwhile.');
      }
    }
    if (unwind.cancelledHandovers.length > 0) {
      // Conditional, after the chain head: a confirmation of the same handover writes here too, so one of them wins.
      const cancelled = await tx.query(
        `update finly.custody_event set custody_status = 'cancelled'
         where id = any($1::uuid[]) and custody_status in ('awaiting_confirmation', 'disputed') returning id`,
        [unwind.cancelledHandovers],
      );
      if (cancelled.length !== unwind.cancelledHandovers.length) {
        fail('CONFLICT', 'The handover was confirmed meanwhile. Record a transfer back instead.');
      }
    }
    const corrected = input.intent.type === 'correction';
    const moved = await tx.query(
      `update finly.txn set status = $2 where id = $1 and status = 'posted' returning id`,
      [unwind.txnId, corrected ? 'corrected' : 'reversed'],
    );
    if (moved.length === 0) fail('ALREADY_REVERSED', 'This entry was already reversed or corrected.');
    await tx.query(
      `insert into finly.txn_link (from_txn_id, to_txn_id, kind, created_by) values ($1, $2, $3, $4)`,
      [txnId, unwind.txnId, corrected ? 'corrects' : 'reverses', input.actorUserId],
    );
  }

  // A correction's own effect is its replacement: a replacement transfer records its handover like any transfer.
  const effect = input.intent.type === 'correction' ? input.intent.replacement : input.intent;
  if (effect.type === 'transfer') {
    const t = effect;
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
  if (input.intent.type === 'transit_confirm') {
    // Confirmed once: the update only matches a handover still waiting, and the confirmation links to its handover.
    const confirmed = await tx.query<{ txn_id: string }>(
      `update finly.custody_event
       set custody_status = 'confirmed', confirmed_by = $2, confirmed_at = now()
       where id = $1 and custody_status = 'awaiting_confirmation'
       returning txn_id`,
      [input.intent.custodyEventId, input.actorUserId],
    );
    if (confirmed.length === 0) fail('CONFLICT', 'This handover is not waiting for confirmation.');
    await tx.query(
      `insert into finly.txn_link (from_txn_id, to_txn_id, kind, created_by) values ($1, $2, 'confirms', $3)`,
      [txnId, confirmed[0].txn_id, input.actorUserId],
    );
  }
  return { lastJournal, openItemIds };
}
