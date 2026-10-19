/**
 * Reversal and correction through the posting service against the real schema (docs/PLAN.md M3; RULEBOOK-01 §56–57):
 * the mirror posts with every effect, once; the original is kept, marked and linked; rights, reason and date are
 * checked; settled obligations block it; entries in someone else's books wait for them; handovers are cancelled or,
 * once confirmed, refused.
 */
import { assert, assertEquals } from '@std/assert';
import type { Intent } from '../../src/domain/engine/intents.ts';
import { uuidv7 } from '../../src/domain/ids.ts';
import { as } from '../db/world.ts';
import { count, giftToSujal, moneyAt, refusal, setup } from './posting_support.ts';

type Setup = Awaited<ReturnType<typeof setup>>;

function reverse(s: Setup, txnId: string, actor = s.w.u.krish, reason: string | undefined = 'Entered twice') {
  return { ...s.cmd(actor, 'reversal', { type: 'reversal', txnId }, s.w.e.mint), reason };
}

function correct(s: Setup, txnId: string, replacement: Intent, actor = s.w.u.krish) {
  return {
    ...s.cmd(actor, 'correction', { type: 'correction', txnId, replacement }, s.w.e.mint),
    reason: 'Wrong amount',
  };
}

async function categoryId(s: Setup, key: string): Promise<string> {
  return (await s.w.db.query<{ id: string }>(`select id from finly.category where key = $1`, [key])).rows[0].id;
}

Deno.test('a reversal posts the mirror with every effect, keeps and links the original, and happens once', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const original = await svc.submit(s.transfer(30_000n));
  const request = reverse(s, original.txnId);
  const r = await svc.submit(request);
  assertEquals(r.status, 'posted');
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 100_000n);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.savanBank), 0n);
  assertEquals(await count(w, `finly.txn where id = $1 and status = 'reversed'`, [original.txnId]), 1);
  assertEquals(await count(w, `finly.txn where id = $1 and reverses_txn_id = $2`, [r.txnId, original.txnId]), 1);
  assertEquals(
    await count(w, `finly.txn_link where from_txn_id = $1 and to_txn_id = $2 and kind = 'reverses'`, [
      r.txnId,
      original.txnId,
    ]),
    1,
  );
  assertEquals(
    await count(
      w,
      `finly.journal j join finly.journal o on o.id = j.reversal_of_journal_id
       where j.txn_id = $1 and j.kind = 'reversal' and o.txn_id = $2`,
      [r.txnId, original.txnId],
    ),
    1,
  );
  assertEquals(await count(w, `finly.audit_log where txn_id = $1 and action = 'txn.reversed'`, [original.txnId]), 1);
  // The original's own rows are untouched history.
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [original.txnId]), 1);

  assertEquals((await svc.submit(request)).replayed, true, 'a resend answers with the same reversal');
  assertEquals((await refusal(() => svc.submit(reverse(s, original.txnId)))).code, 'ALREADY_REVERSED');
  assertEquals((await refusal(() => svc.submit(reverse(s, r.txnId)))).code, 'VALIDATION', 'never a reversal');
});

Deno.test('a reversal needs the reverse permission, a reason, and a date on or after the entry', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  // The worker may record entries in Mint, but entering entries never brings the right to reverse them.
  const own = await svc.submit(s.transfer(1_000n, w.l.tijori, w.l.savanBank, w.u.sujal));
  assertEquals((await refusal(() => svc.submit(reverse(s, own.txnId, w.u.sujal)))).code, 'FORBIDDEN');
  assertEquals((await refusal(() => svc.submit(reverse(s, own.txnId, w.u.krish, ' ')))).code, 'VALIDATION');
  const early = { ...reverse(s, own.txnId), valueDate: '2000-01-01' };
  assertEquals((await refusal(() => svc.submit(early))).code, 'VALIDATION');
  // Someone who cannot see the entry at all is told it does not exist.
  assertEquals((await refusal(() => svc.submit(reverse(s, own.txnId, w.u.savan)))).code, 'NOT_FOUND');
  assertEquals(await count(w, `finly.txn where intent_type = 'reversal' and status = 'posted'`), 0);
  assertEquals((await svc.submit(reverse(s, own.txnId))).status, 'posted');
});

Deno.test('an entry whose obligation was settled is reversed only after its settlement', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const bill = await svc.submit(s.cmd(w.u.krish, 'bill', {
    type: 'bill',
    ownerId: w.e.mint,
    supplierId: w.e.hotel,
    lines: [{ categoryId: await categoryId(s, 'hotel'), amount: 10_000n }],
  }, w.e.mint));
  const [{ id: item }] = (await w.db.query<{ id: string }>(
    `select id from finly.open_item where origin_txn_id = $1`,
    [bill.txnId],
  )).rows;
  const paid = await svc.submit(s.cmd(w.u.krish, 'settlement', {
    type: 'settlement',
    payerId: w.e.mint,
    payeeId: w.e.hotel,
    payerLocationId: w.l.tijori,
    allocations: [{ openItemId: item, amount: 10_000n }],
  }, w.e.mint));
  assertEquals((await refusal(() => svc.submit(reverse(s, bill.txnId)))).code, 'REVERSAL_BLOCKED_BY_SETTLEMENT');

  assertEquals((await svc.submit(reverse(s, paid.txnId))).status, 'posted');
  assertEquals(
    await count(w, `finly.open_item where id = $1 and item_status = 'open' and settled_at is null`, [item]),
    1,
  );
  assertEquals(
    await count(
      w,
      `finly.settlement_allocation where open_item_id = $1 and kind = 'reversal' and reversal_of_id is not null`,
      [
        item,
      ],
    ),
    1,
  );
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 100_000n);

  assertEquals((await svc.submit(reverse(s, bill.txnId))).status, 'posted');
  assertEquals(await count(w, `finly.open_item where id = $1 and item_status = 'reversed'`, [item]), 1);
});

Deno.test('a correction posts the reversal and the right entry as one event', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const wrong = await svc.submit(s.transfer(30_000n));
  const fix = await svc.submit(correct(s, wrong.txnId, {
    type: 'transfer',
    entityId: w.e.mint,
    fromLocationId: w.l.tijori,
    toLocationId: w.l.savanBank,
    amount: 20_000n,
  }));
  assertEquals(fix.status, 'posted');
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 80_000n);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.savanBank), 20_000n);
  assertEquals(await count(w, `finly.txn where id = $1 and status = 'corrected'`, [wrong.txnId]), 1);
  assertEquals(await count(w, `finly.txn_link where from_txn_id = $1 and kind = 'corrects'`, [fix.txnId]), 1);
  const kinds = (await w.db.query<{ kind: string; step: number }>(
    `select kind, step from finly.journal where txn_id = $1 order by step`,
    [fix.txnId],
  )).rows.map((j) => `${j.kind}:${j.step}`);
  assertEquals(kinds, ['reversal:1', 'transfer:2']);
  // The replacement records its own handover; the corrected one stays as history.
  assertEquals(await count(w, `finly.custody_event where txn_id = $1`, [fix.txnId]), 1);
});

Deno.test('a reversal of an entry in someone else’s books waits for them, and only one waits at a time', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const gift = await svc.submit(giftToSujal(s, 20_000n));
  await svc.acknowledge(w.u.sujal, gift.txnId);

  const first = await svc.submit(reverse(s, gift.txnId));
  assertEquals(first.status, 'pending_acknowledgement');
  assertEquals((await refusal(() => svc.submit(reverse(s, gift.txnId)))).code, 'CONFLICT', 'one live attempt');
  assertEquals((await svc.reject(w.u.sujal, first.txnId, 'I did receive it')).status, 'rejected');
  assertEquals(await count(w, `finly.txn where id = $1 and status = 'posted'`, [gift.txnId]), 1);

  const second = await svc.submit(reverse(s, gift.txnId));
  assertEquals(second.status, 'pending_acknowledgement');
  assertEquals((await svc.acknowledge(w.u.sujal, second.txnId)).status, 'posted');
  assertEquals(await count(w, `finly.txn where id = $1 and status = 'reversed'`, [gift.txnId]), 1);
  assertEquals(await moneyAt(w, keys, w.e.sujal, w.l.cashSujal), 0n);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 100_000n);
});

Deno.test('a handover still waiting is cancelled by its reversal; a confirmed one cannot be reversed', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(50_000n);
  await w.db.query(`insert into finly.location_holder (location_id, person_entity_id, reason) values ($1, $2, 't')`, [
    w.l.cashSujal,
    w.e.sujal,
  ]);
  await w.db.query(`update finly.location set handover_confirmation = 'required' where id = $1`, [w.l.cashSujal]);
  const waiting = await svc.submit(s.transfer(10_000n, w.l.tijori, w.l.cashSujal));
  assertEquals((await svc.submit(reverse(s, waiting.txnId))).status, 'posted');
  assertEquals(
    await count(w, `finly.custody_event where txn_id = $1 and custody_status = 'cancelled'`, [waiting.txnId]),
    1,
  );
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 50_000n);

  const sent = await svc.submit(s.transfer(5_000n, w.l.tijori, w.l.cashSujal));
  const [ev] = (await w.db.query<{ id: string }>(
    `select id from finly.custody_event where txn_id = $1`,
    [sent.txnId],
  )).rows;
  await svc.submit(s.cmd(w.u.sujal, 'transit_confirm', {
    type: 'transit_confirm',
    custodyEventId: ev.id,
    entityId: w.e.mint,
    toLocationId: w.l.cashSujal,
    amount: 5_000n,
  }, w.e.mint));
  assertEquals((await refusal(() => svc.submit(reverse(s, sent.txnId)))).code, 'VALIDATION');
});

Deno.test('the undo check answers as a reversal would, without writing anything', async () => {
  const s = await setup();
  const { w, svc, today } = s;
  await s.open(100_000n);
  const t = await svc.submit(s.transfer(1_000n));
  const before = await count(w, `finly.txn`);
  const krish = await svc.undoCheck(w.u.krish, t.txnId, today);
  assertEquals(krish.allowed, true);
  assertEquals(krish.intent?.type, 'transfer', 'all its books are visible: the entry comes back to start a correction');
  const sujal = await svc.undoCheck(w.u.sujal, t.txnId, today);
  assertEquals(sujal.allowed, false);
  assertEquals(sujal.problem?.code, 'FORBIDDEN');
  assertEquals((await refusal(() => svc.undoCheck(w.u.savan, t.txnId, today))).code, 'NOT_FOUND');
  assertEquals((await refusal(() => svc.undoCheck(w.u.krish, uuidv7(), today))).code, 'NOT_FOUND');
  assertEquals(await count(w, `finly.txn`), before);
  // Money moved into an owner-only place: the worker sees the entry's other leg, never the entry to correct from.
  const hidden = await svc.submit(s.transfer(1_000n, w.l.tijori, w.l.wardrobe));
  assertEquals((await svc.undoCheck(w.u.sujal, hidden.txnId, today)).intent, undefined);
  assertEquals((await svc.undoCheck(w.u.krish, hidden.txnId, today)).intent?.type, 'transfer');
  await svc.submit(reverse(s, t.txnId));
  const again = await svc.undoCheck(w.u.krish, t.txnId, today);
  assert(!again.allowed);
  assertEquals(again.problem?.code, 'ALREADY_REVERSED');
});

Deno.test('an entry partly hidden from someone is never undone by them, and no hidden name leaks', async () => {
  const s = await setup();
  const { w, svc, today } = s;
  await s.open(100_000n);
  // Into an owner-only place: the worker sees only the Tijori side; the place is then closed.
  const hidden = await svc.submit(s.transfer(1_000n, w.l.tijori, w.l.wardrobe));
  await w.db.query(`update finly.location set status = 'inactive' where id = $1`, [w.l.wardrobe]);
  const check = await svc.undoCheck(w.u.sujal, hidden.txnId, today);
  assertEquals(check.problem?.code, 'FORBIDDEN');
  assert(!check.problem?.message.includes('Wardrobe'), 'the hidden place is never named');
  assertEquals((await refusal(() => svc.submit(reverse(s, hidden.txnId, w.u.sujal)))).code, 'FORBIDDEN');
  // The owner sees all of it and is told what to do.
  assertEquals((await svc.undoCheck(w.u.krish, hidden.txnId, today)).problem?.code, 'LOCATION_INACTIVE');
});

Deno.test('an attempt stuck as a draft frees the entry after a while', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  const t = await svc.submit(s.transfer(1_000n));
  const stuck = async (minutesAgo: number) => {
    const id = uuidv7();
    await w.db.query(
      `insert into finly.txn (id, reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id,
         reverses_txn_id, entered_at)
       values ($1, finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'reversal'),
               'reversal', $2, current_date, $3, $4, now() - make_interval(mins => $5))`,
      [id, w.e.mint, w.u.krish, t.txnId, minutesAgo],
    );
    return id;
  };
  const fresh = await stuck(1);
  assertEquals((await refusal(() => svc.submit(reverse(s, t.txnId)))).code, 'CONFLICT', 'a live attempt waits');
  await w.db.query(`update finly.txn set entered_at = now() - interval '1 hour' where id = $1`, [fresh]);
  assertEquals((await svc.submit(reverse(s, t.txnId))).status, 'posted');
  assertEquals(await count(w, `finly.txn where id = $1 and status = 'cancelled'`, [fresh]), 1);
  assertEquals(await count(w, `finly.audit_log where txn_id = $1 and action = 'txn.cancelled'`, [fresh]), 1);
});

Deno.test('write access to someone’s personal books is not a right to undo their entries', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  // Sujal himself lets Krish write in his personal books (only the owner of personal books can, A4).
  await as(
    w.db,
    'finly_api',
    w.u.sujal,
    (tx) =>
      tx.query(
        `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by)
         values ($1, $2, 'write', 'owner_grant', $3)`,
        [w.u.krish, w.e.sujal, w.u.sujal],
      ),
    { commit: true },
  );
  const gift = await svc.submit(giftToSujal(s, 5_000n));
  assertEquals(gift.status, 'posted', 'delegated write: the entry posts at once');
  const undo = await svc.submit(reverse(s, gift.txnId));
  assertEquals(undo.status, 'pending_acknowledgement', 'but undoing it waits for Sujal');
  assertEquals((await svc.acknowledge(w.u.sujal, undo.txnId)).status, 'posted');
});
