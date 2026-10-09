/**
 * Migration 0012: the transactional outbox, the stored request of an event (txn.intent_enc) and draft -> failed.
 */
import { assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { audit, commitChecks, postEvent } from './posting.ts';
import { as, dbWorld, fakeCipher } from './world.ts';

const w = await dbWorld();
const { db, u, e, f, l, p } = w;

// No RETURNING: the writing roles may add events but never read the queue.
const emit = (key: string) =>
  `insert into finly.outbox_event (topic, dedupe_key, payload, created_by)
   values ('nudge.data_changed', '${key}', '{"entity": "x"}', finly.actor_user_id())`;

Deno.test('an outbox event is written once per key, by an actor, and the API cannot read the queue', async () => {
  await as(db, 'finly_ledger', u.krish, async (tx) => {
    await tx.query(emit('k1'));
    await tx.exec('savepoint s');
    await expectSqlError('23505', () => tx.query(emit('k1')));
    await tx.exec('rollback to savepoint s');
  });
  await expectSqlError(
    '42501',
    () => as(db, 'finly_api', u.krish, (tx) => tx.query(`select * from finly.outbox_event`)),
  );
  // Someone else's name as the creator is refused.
  await expectSqlError(
    '42501',
    () =>
      as(db, 'finly_ledger', u.krish, (tx) =>
        tx.query(
          `insert into finly.outbox_event (topic, dedupe_key, created_by) values ('nudge.data_changed', 'k2', $1)`,
          [
            u.father,
          ],
        )),
  );
});

Deno.test('delivery moves only forward, keeps the content, and a delivered event is final', async () => {
  await as(db, null, null, async (tx) => {
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await tx.query(emit('k3'));
    const [{ id }] = (await tx.query<{ id: number }>(`select id from finly.outbox_event where dedupe_key = 'k3'`)).rows;
    await tx.exec('set local role finly_system');
    await tx.query(
      `update finly.outbox_event set event_status = 'processing', locked_until = now() + interval '1 minute',
         attempts = attempts + 1 where id = $1`,
      [id],
    );
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1001',
      () => tx.query(`update finly.outbox_event set payload = '{"amount": "5000"}' where id = $1`, [id]),
    );
    await tx.exec('rollback to savepoint s');
    await tx.query(
      `update finly.outbox_event set event_status = 'done', locked_until = null, done_at = now() where id = $1`,
      [id],
    );
    await expectSqlError(
      'F1007',
      () => tx.query(`update finly.outbox_event set event_status = 'pending', done_at = null where id = $1`, [id]),
    );
  });
});

// Also the regression test for 0012's savepoint fix: the posting below happens after a savepoint was used, and the
// audit commit checks must still find its audit row.
Deno.test('the stored request is frozen once the event is submitted; a refused draft can be marked failed', async () => {
  await as(db, 'finly_ledger', u.krish, async (tx) => {
    const [{ id }] = (await tx.query<{ id: string }>(
      `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id,
         intent_enc, key_version)
       values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
               'transfer', $1, current_date, $2, $3, 1) returning id`,
      [e.mint, u.krish, fakeCipher()],
    )).rows;
    // A draft may still change what it asks for.
    await tx.query(`update finly.txn set intent_enc = $2 where id = $1`, [id, fakeCipher()]);
    await tx.exec('savepoint s');
    await expectSqlError('23514', () => tx.query(`update finly.txn set key_version = null where id = $1`, [id]));
    await tx.exec('rollback to savepoint s');
    await postEvent(tx, {
      actor: u.krish,
      primaryEnv: e.mint,
      txnId: id,
      journals: [{
        entity: e.mint,
        period: p.mint,
        lines: [
          { account: w.account(e.mint, '1100'), fund: f.mint, side: 'Dr', location: l.tijori },
          { account: w.account(e.mint, '1100'), fund: f.mint, side: 'Cr', location: l.savanBank },
        ],
      }],
    });
    await commitChecks(tx);
    await expectSqlError(
      'F1010',
      () => tx.query(`update finly.txn set intent_enc = $2 where id = $1`, [id, fakeCipher()]),
    );
  });
  const status = await as(db, 'finly_ledger', u.krish, async (tx) => {
    const [{ id }] = (await tx.query<{ id: string }>(
      `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id)
       values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
               'transfer', $1, current_date, $2) returning id`,
      [e.mint, u.krish],
    )).rows;
    await tx.query(`update finly.txn set status = 'failed' where id = $1`, [id]);
    await audit(tx, u.krish, 'txn.failed', 'txn', id, e.mint, id);
    return (await tx.query<{ status: string }>(`select status from finly.txn where id = $1`, [id])).rows[0].status;
  });
  assertEquals(status, 'failed');
});
