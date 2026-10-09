/**
 * The owner's decisions of 2026-10-09 as database rules (migration 0010): acknowledgement of entries in someone
 * else's books (D-029), activation by the person and consented support (D-030).
 */
import { assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { audit, commitChecks, postEvent } from './posting.ts';
import { as, dbWorld, fakeHash } from './world.ts';

const w = await dbWorld();
const { db, u, e, f, l, p } = w;

const setting = (actor: string, person: string, mode: string) =>
  as(db, 'finly_api', actor, (tx) =>
    tx.query(
      `insert into finly.personal_book_setting (entity_id, incoming_entries) values ($1, $2)
       on conflict (entity_id) do update set incoming_entries = excluded.incoming_entries`,
      [person, mode],
    ));

Deno.test('only the person decides how entries into their own books are accepted (Q1)', async () => {
  await setting(u.sujal, e.sujal, 'immediate');
  // Krish is a Super Admin, and still cannot. The guard runs before the policy's WITH CHECK, so it answers first.
  await expectSqlError('F1008', () => setting(u.krish, e.sujal, 'immediate'));
  await expectSqlError(
    'F1008',
    () =>
      as(
        db,
        null,
        u.savan,
        (tx) =>
          tx.query(`insert into finly.personal_book_setting (entity_id, incoming_entries) values ($1, 'immediate')`, [
            e.father,
          ]),
      ),
  );
});

/** Mint gives Sujal ₹20,000 as his own: Mint's journal and Sujal's journal, waiting for Sujal. */
async function pendingGift(tx: Parameters<Parameters<typeof as>[3]>[0]) {
  const t = await tx.query<{ id: string }>(
    `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id)
     values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'nonowner_payment'),
             'nonowner_payment', $1, current_date, $2) returning id`,
    [e.mint, u.krish],
  );
  const txnId = t.rows[0].id;
  await tx.query(`insert into finly.txn_acknowledgement (txn_id, entity_id) values ($1, $2)`, [txnId, e.sujal]);
  return txnId;
}

function post(tx: Parameters<Parameters<typeof as>[3]>[0], txnId: string) {
  return postEvent(tx, {
    actor: u.krish,
    primaryEnv: e.mint,
    txnId,
    journals: [
      {
        entity: e.mint,
        period: p.mint,
        lines: [
          { account: w.account(e.mint, '1300'), fund: f.mint, side: 'Dr', counterparty: e.sujal },
          { account: w.account(e.mint, '1100'), fund: f.mint, side: 'Cr', location: l.tijori },
        ],
      },
      {
        entity: e.sujal,
        period: p.sujal,
        lines: [
          { account: w.account(e.sujal, '1100'), fund: f.sujal, side: 'Dr', location: l.cashSujal },
          { account: w.account(e.sujal, '2100'), fund: f.sujal, side: 'Cr', counterparty: e.mint },
        ],
      },
    ],
  });
}

Deno.test('an entry waiting for acknowledgement cannot post; once acknowledged, every effect posts together', async () => {
  await expectSqlError('F1007', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      await post(tx, await pendingGift(tx));
      await commitChecks(tx);
    }));
  const posted = await as(db, null, null, async (tx) => {
    await tx.exec(`set local role finly_ledger`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    const txnId = await pendingGift(tx);
    // Sujal answers on his own phone (the API acts as Sujal).
    await tx.exec(`reset role`);
    await tx.exec(`set local role finly_api`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.sujal]);
    await tx.query(
      `update finly.txn_acknowledgement set ack_status = 'acknowledged', decided_by = $2, decided_at = now()
       where txn_id = $1`,
      [txnId, u.sujal],
    );
    await tx.exec(`reset role`);
    await tx.exec(`set local role finly_ledger`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await post(tx, txnId);
    await commitChecks(tx);
    // Nobody can attach a new acknowledgement request to an entry that has already posted.
    await tx.exec('savepoint late');
    await expectSqlError(
      'F1007',
      () => tx.query(`insert into finly.txn_acknowledgement (txn_id, entity_id) values ($1, $2)`, [txnId, e.father]),
    );
    await tx.exec('rollback to savepoint late');
    return (await tx.query<{ n: number }>(`select count(*)::int as n from finly.journal where txn_id = $1`, [txnId]))
      .rows[0].n;
  });
  assertEquals(posted, 2, 'both journals posted in the same transaction as the acknowledgement allowed it');
});

Deno.test('only the person can answer; nobody else can, and an answer is final (F1008, F1007)', async () => {
  await as(db, null, null, async (tx) => {
    await tx.exec(`set local role finly_ledger`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    const txnId = await pendingGift(tx);
    await tx.exec(`reset role`);
    // The giver tries to accept on Sujal's behalf.
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await tx.exec('savepoint s');
    await expectSqlError('F1008', () =>
      tx.query(
        `update finly.txn_acknowledgement set ack_status = 'acknowledged', decided_by = $2, decided_at = now()
         where txn_id = $1`,
        [txnId, u.krish],
      ));
    await tx.exec('rollback to savepoint s');
    // Through the API, Krish cannot even see a row to change.
    await tx.exec(`set local role finly_api`);
    const changed = await tx.query(
      `update finly.txn_acknowledgement set note = 'x' where txn_id = $1 returning txn_id`,
      [
        txnId,
      ],
    );
    assertEquals(changed.rows, []);
    await tx.exec(`reset role`);
    // Sujal answers; he cannot "withdraw" the giver's entry himself — only the posting service withdraws.
    await tx.exec(`set local role finly_api`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.sujal]);
    await tx.exec('savepoint w');
    await expectSqlError(
      '42501',
      () => tx.query(`update finly.txn_acknowledgement set ack_status = 'withdrawn' where txn_id = $1`, [txnId]),
    );
    await tx.exec('rollback to savepoint w');
    await tx.exec(`reset role`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.sujal]);
    await tx.query(
      `update finly.txn_acknowledgement set ack_status = 'rejected', decided_by = $2, decided_at = now(),
         note = 'I did not receive this' where txn_id = $1`,
      [txnId, u.sujal],
    );
    await expectSqlError('F1007', () =>
      tx.query(
        `update finly.txn_acknowledgement set ack_status = 'acknowledged', decided_by = $2, decided_at = now()
         where txn_id = $1`,
        [txnId, u.sujal],
      ));
  });
});

Deno.test('an activation code works once, never after it expires, and is never issued by the user themself', async () => {
  await as(db, null, null, async (tx) => {
    const code = await tx.query<{ id: string }>(
      `insert into finly.account_activation (user_id, code_hash, issued_by, expires_at)
       values ($1, $2, $3, now() + interval '24 hours') returning id`,
      [u.father, fakeHash(), u.krish],
    );
    const id = code.rows[0].id;
    const device = await tx.query<{ id: string }>(
      `insert into finly.device (user_id, platform) values ($1, 'android') returning id`,
      [u.father],
    );
    await tx.query(`update finly.account_activation set used_at = now(), used_device_id = $2 where id = $1`, [
      id,
      device.rows[0].id,
    ]);
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1001',
      () => tx.query(`update finly.account_activation set revoked_at = now() where id = $1`, [id]),
    );
    await tx.exec('rollback to savepoint s');
    const late = await tx.query<{ id: string }>(
      `insert into finly.account_activation (user_id, code_hash, issued_by, issued_at, expires_at)
       values ($1, $2, $3, now() - interval '2 days', now() - interval '1 day') returning id`,
      [u.sujal, fakeHash(), u.krish],
    );
    // An expired code is refused even when the caller backdates the time of use: the server's clock decides.
    for (const usedAt of ['now()', 'issued_at']) {
      await tx.exec('savepoint t');
      await expectSqlError(
        'F1007',
        () =>
          tx.query(`update finly.account_activation set used_at = ${usedAt}, used_device_id = $2 where id = $1`, [
            late.rows[0].id,
            device.rows[0].id,
          ]),
      );
      await tx.exec('rollback to savepoint t');
    }
    await expectSqlError('23514', () =>
      tx.query(
        `insert into finly.account_activation (user_id, code_hash, issued_by, expires_at)
         values ($1, $2, $1, now() + interval '1 hour')`,
        [u.savan, fakeHash()],
      ));
  });
});

Deno.test("support access starts only with the person's consent and is closed for good when it ends", async () => {
  await as(db, null, null, async (tx) => {
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    const s = await tx.query<{ id: string }>(
      `insert into finly.support_session (user_id, helper_user_id, scope, reason)
       values ($1, $2, 'account_settings', 'Help Father set up his M-PIN') returning id`,
      [u.father, u.krish],
    );
    const id = s.rows[0].id;
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1008',
      () =>
        tx.query(`update finly.support_session set session_status = 'active', consented_at = now() where id = $1`, [
          id,
        ]),
    );
    await tx.exec('rollback to savepoint s');
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.father]);
    await tx.query(
      `update finly.support_session set session_status = 'active', consented_at = now(), starts_at = now(),
         ends_at = now() + interval '1 hour' where id = $1`,
      [id],
    );
    await audit(tx, u.krish, 'support.action', 'support_session', id, null);
    // The helper cannot stretch the window the person agreed to.
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await tx.exec('savepoint x');
    await expectSqlError(
      'F1001',
      () => tx.query(`update finly.support_session set ends_at = starts_at + interval '4 hours' where id = $1`, [id]),
    );
    await tx.exec('rollback to savepoint x');
    await tx.query(`update finly.support_session set session_status = 'ended', ended_at = now() where id = $1`, [id]);
    await expectSqlError(
      'F1007',
      () => tx.query(`update finly.support_session set session_status = 'active' where id = $1`, [id]),
    );
  });
});
