/**
 * The posting service against the real schema (PGlite by default; PostgreSQL 17/18 with FINLY_TEST_TARGET): every
 * effect of a posting in one transaction, idempotent resends, refusals recorded durably, authorisation by current
 * rights, acknowledgement of entries in someone else's personal books (D-029), and spends racing for the same money.
 */
import { assert, assertEquals, assertMatch, assertRejects } from '@std/assert';
import { BlindIndex } from '../../src/crypto/blind.ts';
import { HashChain } from '../../src/crypto/chain.ts';
import { Cipher, ctx } from '../../src/crypto/cipher.ts';
import { KeyRing, StaticKekSource } from '../../src/crypto/keys.ts';
import { PostingService, type SubmitCommand } from '../../src/app/posting/service.ts';
import type { Intent } from '../../src/domain/engine/intents.ts';
import { FinlyError } from '../../src/domain/errors.ts';
import { uuidv7 } from '../../src/domain/ids.ts';
import { as, type DbWorld, dbWorld } from '../db/world.ts';

function testKeys() {
  const ring = new KeyRing(new StaticKekSource(new Map([[1, crypto.getRandomValues(new Uint8Array(32))]]), 1));
  return { cipher: new Cipher(ring), blind: new BlindIndex(ring), chain: new HashChain(ring) };
}

async function setup() {
  const w = await dbWorld();
  const keys = testKeys();
  const svc = new PostingService(w.db.port!, keys);
  const [{ today }] = (await w.db.query<{ today: string }>(`select current_date::text as today`)).rows;
  const cmd = (actor: string, typeKey: string, intent: Intent, env: string, date = today): SubmitCommand => ({
    actorUserId: actor,
    idempotencyKey: uuidv7(),
    txnTypeKey: typeKey,
    intent,
    valueDate: date,
    primaryEnvId: env,
  });
  const open = (amount: bigint, locationId = w.l.tijori) =>
    svc.submit(
      cmd(w.u.krish, 'opening_balance', { type: 'opening_balance', entityId: w.e.mint, locationId, amount }, w.e.mint),
    );
  const transfer = (amount: bigint, from = w.l.tijori, to = w.l.savanBank, actor = w.u.krish, entity = w.e.mint) =>
    cmd(
      actor,
      'transfer',
      { type: 'transfer', entityId: entity, fromLocationId: from, toLocationId: to, amount },
      entity,
    );
  return { w, keys, svc, cmd, open, transfer, today };
}

/** Money of `entity` at `location` (Dr − Cr), decrypted from the snapshot the posting maintained. */
async function moneyAt(
  w: DbWorld,
  keys: ReturnType<typeof testKeys>,
  entity: string,
  location: string,
): Promise<bigint> {
  const rows = (await w.db.query<{ slice_id: string; balance_enc: Uint8Array }>(
    `select bc.slice_id, bc.balance_enc from finly.balance_current bc join finly.balance_slice s on s.id = bc.slice_id
     where s.entity_id = $1 and s.location_id = $2`,
    [entity, location],
  )).rows;
  let total = 0n;
  for (const r of rows) {
    total += await keys.cipher.decryptAmount(
      new Uint8Array(r.balance_enc),
      ctx('balance_current', 'balance_enc', r.slice_id),
    );
  }
  return total;
}

async function count(w: DbWorld, sql: string, params: unknown[] = []): Promise<number> {
  return (await w.db.query<{ n: number }>(`select count(*)::int as n from ${sql}`, params)).rows[0].n;
}

async function refusal(fn: () => Promise<unknown>): Promise<FinlyError> {
  const e = await assertRejects(fn);
  assert(e instanceof FinlyError, String(e));
  return e;
}

Deno.test('a transfer posts every effect in one transaction', async () => {
  const { w, keys, svc, open, transfer } = await setup();
  await open(100_000n);
  const r = await svc.submit(transfer(30_000n));
  assertEquals(r.status, 'posted');
  assertMatch(r.reference, /^TX-\d{8}-\d{6}$/);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 70_000n);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.savanBank), 30_000n);
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [r.txnId]), 1);
  assertEquals(
    await count(w, `finly.journal_line l join finly.journal j on j.id = l.journal_id where j.txn_id = $1`, [r.txnId]),
    2,
  );
  assertEquals(await count(w, `finly.txn_leg where txn_id = $1`, [r.txnId]), 2);
  assertEquals(
    await count(
      w,
      `finly.journal_line l join finly.journal j on j.id = l.journal_id
                              where j.txn_id = $1 and l.txn_leg_id is null`,
      [r.txnId],
    ),
    0,
  );
  assertEquals(await count(w, `finly.custody_event where txn_id = $1 and custody_status = 'recorded'`, [r.txnId]), 1);
  assertEquals(await count(w, `finly.audit_log where txn_id = $1`, [r.txnId]), 2); // drafted + posted
  assertEquals(await count(w, `finly.outbox_event where txn_id = $1 and topic = 'nudge.data_changed'`, [r.txnId]), 1);
  assertEquals(
    await count(w, `finly.idempotency_record where result_id = $1 and record_status = 'completed'`, [r.txnId]),
    1,
  );
  // The journal chain is contiguous and each link starts where the previous ended.
  const chain = (await w.db.query<{ chain_seq: string; prev_hash: Uint8Array; content_hash: Uint8Array }>(
    `select chain_seq, prev_hash, content_hash from finly.journal order by chain_seq`,
  )).rows;
  chain.forEach((j, i) => {
    assertEquals(Number(j.chain_seq), i + 1);
    if (i > 0) assertEquals(new Uint8Array(j.prev_hash), new Uint8Array(chain[i - 1].content_hash));
  });
  // Period totals match the current balance.
  const amounts =
    (await w.db.query<{ slice_id: string; period_id: string; debits_enc: Uint8Array; credits_enc: Uint8Array }>(
      `select bp.slice_id, bp.period_id, bp.debits_enc, bp.credits_enc from finly.balance_period bp
     join finly.balance_slice s on s.id = bp.slice_id where s.entity_id = $1 and s.location_id = $2`,
      [w.e.mint, w.l.tijori],
    )).rows[0];
  const k = `${amounts.slice_id}:${amounts.period_id}`;
  const dr = await keys.cipher.decryptAmount(
    new Uint8Array(amounts.debits_enc),
    ctx('balance_period', 'debits_enc', k),
  );
  const cr = await keys.cipher.decryptAmount(
    new Uint8Array(amounts.credits_enc),
    ctx('balance_period', 'credits_enc', k),
  );
  assertEquals([dr, cr], [100_000n, 30_000n]);
});

Deno.test('resending the same request returns the original result and writes nothing new', async () => {
  const { w, svc, open, transfer } = await setup();
  await open(100_000n);
  const request = transfer(10_000n);
  const first = await svc.submit(request);
  const journals = await count(w, `finly.journal`);
  const again = await svc.submit(request);
  assertEquals(again, { ...first, replayed: true });
  assertEquals(await count(w, `finly.journal`), journals);
  const reused = await refusal(() =>
    svc.submit({ ...request, intent: { ...request.intent, amount: 11_000n } as Intent })
  );
  assertEquals(reused.code, 'CONFLICT');
});

Deno.test('money that is not there cannot leave; the refusal is recorded and resent identically', async () => {
  const { w, keys, svc, open, transfer } = await setup();
  await open(100_000n);
  const request = transfer(150_000n);
  assertEquals((await refusal(() => svc.submit(request))).code, 'INSUFFICIENT_BALANCE');
  assertEquals((await refusal(() => svc.submit(request))).code, 'INSUFFICIENT_BALANCE');
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 100_000n);
  assertEquals(await count(w, `finly.txn where status = 'failed'`), 1);
  assertEquals(await count(w, `finly.audit_log where action = 'txn.failed'`), 1);
});

Deno.test('only someone with rights to the books can post; a Super Admin role alone is not enough', async () => {
  const { w, svc, open, transfer } = await setup();
  await open(100_000n);
  // Sujal may write in Mint only; Savan administers the system but owns nothing and has no posting permission.
  const intoJsk = transfer(1_000n, w.l.tijori, w.l.savanBank, w.u.sujal, w.e.jsk);
  assertEquals((await refusal(() => svc.submit(intoJsk))).code, 'FORBIDDEN');
  assertEquals(
    (await refusal(() => svc.submit(transfer(1_000n, w.l.tijori, w.l.savanBank, w.u.savan)))).code,
    'FORBIDDEN',
  );
  assertEquals(await count(w, `finly.txn where intent_type = 'transfer'`), 0);
  // The worker can post in Mint.
  assertEquals((await svc.submit(transfer(1_000n, w.l.tijori, w.l.savanBank, w.u.sujal))).status, 'posted');
});

function giftToSujal(s: Awaited<ReturnType<typeof setup>>, amount: bigint, giver = s.w.u.krish) {
  return s.cmd(giver, 'give', {
    type: 'give',
    giverId: s.w.e.mint,
    giverLocationId: s.w.l.tijori,
    giverSide: 'own',
    receiverId: s.w.e.sujal,
    receiverSide: 'own',
    receiverLocationId: s.w.l.cashSujal,
    purpose: 'loan',
    repayable: true,
    amount,
  }, s.w.e.mint);
}

Deno.test('an entry into someone else’s books waits, holds the money, and posts in full when acknowledged', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const r = await svc.submit(giftToSujal(s, 20_000n));
  assertEquals(r.status, 'pending_acknowledgement');
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [r.txnId]), 0);
  assertEquals(await count(w, `finly.balance_hold where txn_id = $1 and hold_status = 'active'`, [r.txnId]), 1);
  // The held ₹20,000 cannot be spent meanwhile: ₹90,000 of the ₹1,00,000 is more than is available.
  assertEquals((await refusal(() => svc.submit(s.transfer(90_000n)))).code, 'INSUFFICIENT_BALANCE');
  // Only Sujal can answer.
  assertEquals((await refusal(() => svc.acknowledge(w.u.krish, r.txnId))).code, 'NOT_FOUND');
  const done = await svc.acknowledge(w.u.sujal, r.txnId);
  assertEquals(done.status, 'posted');
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [r.txnId]), 2);
  assertEquals(await count(w, `finly.balance_hold where txn_id = $1 and hold_status = 'consumed'`, [r.txnId]), 1);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 80_000n);
  assertEquals(await moneyAt(w, keys, w.e.sujal, w.l.cashSujal), 20_000n);
});

Deno.test('if the giver loses access while the entry waits, the acknowledgement cannot post it', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  // Father's right to post in Mint comes only from his environment grant (Krish's would survive through admin.full).
  const r = await svc.submit(giftToSujal(s, 20_000n, w.u.father));
  await w.db.query(
    `update finly.env_access set revoked_at = now(), revoked_by = $2 where user_id = $1 and env_entity_id = $3`,
    [w.u.father, w.u.krish, w.e.mint],
  );
  assertEquals((await refusal(() => svc.acknowledge(w.u.sujal, r.txnId))).code, 'FORBIDDEN');
  // Nothing moved: the acknowledgement itself rolled back and the entry still waits.
  assertEquals(await count(w, `finly.txn_acknowledgement where txn_id = $1 and ack_status = 'pending'`, [r.txnId]), 1);
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [r.txnId]), 0);
});

Deno.test('a rejected entry releases its hold, posts nothing and keeps its history', async () => {
  const s = await setup();
  const { w, keys, svc } = s;
  await s.open(100_000n);
  const r = await svc.submit(giftToSujal(s, 20_000n));
  assertEquals((await svc.reject(w.u.sujal, r.txnId, 'Not received')).status, 'rejected');
  assertEquals(await count(w, `finly.balance_hold where txn_id = $1 and hold_status = 'released'`, [r.txnId]), 1);
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [r.txnId]), 0);
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 100_000n);
  assertEquals((await refusal(() => svc.acknowledge(w.u.sujal, r.txnId))).code, 'NOT_FOUND');
  assertEquals(await count(w, `finly.audit_log where txn_id = $1 and action = 'txn.rejected'`, [r.txnId]), 1);
});

Deno.test('a person who chose immediate posting gets the entry at once, with a notice', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  await as(
    w.db,
    'finly_api',
    w.u.sujal,
    (tx) =>
      tx.query(`insert into finly.personal_book_setting (entity_id, incoming_entries) values ($1, 'immediate')`, [
        w.e.sujal,
      ]),
    { commit: true },
  );
  const r = await svc.submit(giftToSujal(s, 5_000n));
  assertEquals(r.status, 'posted');
  assertEquals(
    await count(w, `finly.outbox_event where txn_id = $1 and topic = 'entry.added_to_your_books'`, [r.txnId]),
    1,
  );
});

Deno.test('F8 then F9 as two events: the second follows the first, posts only itself, each debt recorded once', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(100_000n);
  // Transaction 1: Mint → its owner Krish, owed back (F8 B). Krish's own books need no acknowledgement.
  const t1 = await svc.submit(s.cmd(w.u.krish, 'give', {
    type: 'give',
    giverId: w.e.mint,
    giverLocationId: w.l.tijori,
    giverSide: 'own',
    receiverId: w.e.krish,
    receiverSide: 'own',
    receiverLocationId: w.l.krishBank,
    purpose: 'loan',
    repayable: true,
    amount: 20_000n,
  }, w.e.mint));
  assertEquals(t1.status, 'posted');
  const t1Journals = await count(w, `finly.journal where txn_id = $1`, [t1.txnId]);
  // Transaction 2: Krish → Sujal ₹8,000, owed back to Krish (F9 C2), linked to Transaction 1.
  const t2 = await svc.submit({
    ...s.cmd(w.u.krish, 'give', {
      type: 'give',
      giverId: w.e.krish,
      giverLocationId: w.l.krishBank,
      giverSide: 'own',
      receiverId: w.e.sujal,
      receiverSide: 'own',
      receiverLocationId: w.l.cashSujal,
      purpose: 'loan',
      repayable: true,
      amount: 8_000n,
    }, w.e.krish),
    followsTxnId: t1.txnId,
  });
  assertEquals(t2.status, 'pending_acknowledgement', "Sujal's books wait for Sujal (D-029)");
  assertEquals((await svc.acknowledge(w.u.sujal, t2.txnId)).status, 'posted');
  assertEquals(
    await count(w, `finly.txn_link where from_txn_id = $1 and to_txn_id = $2 and kind = 'follows'`, [
      t2.txnId,
      t1.txnId,
    ]),
    1,
  );
  assertEquals(await count(w, `finly.journal where txn_id = $1`, [t1.txnId]), t1Journals, 'never re-posted');
  assertEquals(
    await count(w, `finly.open_item where debtor_entity_id = $1 and creditor_entity_id = $2`, [
      w.e.krish,
      w.e.mint,
    ]),
    1,
  );
  assertEquals(
    await count(w, `finly.open_item where debtor_entity_id = $1 and creditor_entity_id = $2`, [
      w.e.sujal,
      w.e.krish,
    ]),
    1,
  );
});

Deno.test('a classification that is missing or incoherent is refused before anything is drafted', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(10_000n);
  const missing = s.cmd(w.u.krish, 'give', {
    type: 'give',
    giverId: w.e.mint,
    giverLocationId: w.l.tijori,
    receiverId: w.e.krish,
    amount: 1_000n,
  }, w.e.mint);
  assertEquals((await refusal(() => svc.submit(missing))).code, 'CLASSIFICATION_REQUIRED');
  assertEquals(await count(w, `finly.txn where intent_type = 'give'`), 0);
});

Deno.test('drawings follow ownership records: a partner who does not own is refused, an owner is not', async () => {
  const s = await setup();
  const { w, svc } = s;
  await s.open(10_000n);
  await w.db.query(
    `insert into finly.entity_partnership (entity_id, partner_entity_id, partnership_type_id)
     values ($1, $2, (select id from finly.lookup_value where list_key = 'partnership_type' and key = 'working'))`,
    [w.e.mint, w.e.sujal],
  );
  const drawing = (receiverId: string) =>
    s.cmd(w.u.krish, 'give', {
      type: 'give',
      giverId: w.e.mint,
      giverLocationId: w.l.tijori,
      giverSide: 'own',
      receiverId,
      receiverSide: 'own',
      receiverLocationId: w.l.cashSujal,
      purpose: 'drawings',
      repayable: false,
      amount: 1_000n,
    }, w.e.mint);
  assertEquals((await refusal(() => svc.submit(drawing(w.e.sujal)))).code, 'NOT_AN_OWNER');
  // Father owns half of Mint: the drawing is valid (it waits for Father, whose personal books it changes).
  assertEquals((await svc.submit(drawing(w.e.father))).status, 'pending_acknowledgement');
});

Deno.test('two spends racing for the same money: exactly one posts', async () => {
  const { w, keys, svc, open, transfer } = await setup();
  await open(100_000n);
  const results = await Promise.allSettled([svc.submit(transfer(80_000n)), svc.submit(transfer(80_000n))]);
  const posted = results.filter((x) => x.status === 'fulfilled');
  const refused = results.filter((x) => x.status === 'rejected') as PromiseRejectedResult[];
  assertEquals(posted.length, 1);
  assertEquals((refused[0].reason as FinlyError).code, 'INSUFFICIENT_BALANCE');
  assertEquals(await moneyAt(w, keys, w.e.mint, w.l.tijori), 20_000n);
});

Deno.test('a date outside any open month is refused under lock and recorded', async () => {
  const { w, svc, open, transfer } = await setup();
  await open(100_000n);
  const old = { ...transfer(1_000n), valueDate: '2020-01-15' };
  assertEquals((await refusal(() => svc.submit(old))).code, 'PERIOD_CLOSED');
  assertEquals(await count(w, `finly.txn where status = 'failed' and value_date = '2020-01-15'`), 1);
  assertEquals((await refusal(() => svc.submit(old))).code, 'PERIOD_CLOSED');
});
