/**
 * Two-connection concurrency (docs/database/06 §6.3–6.4; 07 rows 24, 25). Real PostgreSQL only — PGlite has a single
 * connection. Each test holds a lock on connection A and proves connection B waits for it (a short lock_timeout turns
 * the wait into SQLSTATE 55P03), then that B sees A's committed result instead of overwriting it.
 */
import { assertEquals } from '@std/assert';
import { expectSqlError, type TestDb, testTarget, type TestTx } from './harness.ts';
import { audit, postEvent } from './posting.ts';
import { dbWorld, fakeCipher } from './world.ts';

const realServer = testTarget() !== 'pglite';

/** Runs `fn` on a separate connection in its own transaction, as `role` with `actor`; resolves when it commits. */
function hold(
  conn: TestDb,
  role: string | null,
  actor: string | null,
  fn: (tx: TestTx) => Promise<void>,
  until: Promise<void>,
): Promise<void> {
  return conn.transaction(async (tx) => {
    if (role) await tx.exec(`set local role ${role}`);
    if (actor) await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
    await fn(tx);
    await until; // keep the transaction (and its locks) open until released
  });
}

function gate(): { open: () => void; wait: Promise<void> } {
  let open!: () => void;
  const wait = new Promise<void>((r) => (open = r));
  return { open, wait };
}

/** Starts work on connection A, waits until its locks are taken, and returns a release function. */
async function lockedBy(
  conn: TestDb,
  role: string | null,
  actor: string | null,
  fn: (tx: TestTx) => Promise<void>,
): Promise<{ release: () => Promise<void> }> {
  const g = gate();
  const ready = gate();
  const done = hold(conn, role, actor, async (tx) => {
    await fn(tx);
    ready.open();
  }, g.wait);
  await ready.wait;
  return {
    release: async () => {
      g.open();
      await done;
    },
  };
}

/** Runs `sql` on B with a short lock timeout inside a transaction that is rolled back. */
function tryOn(conn: TestDb, role: string | null, actor: string | null, sql: string, params: unknown[] = []) {
  return conn.transaction(async (tx) => {
    await tx.exec(`set local lock_timeout = '300ms'`);
    if (role) await tx.exec(`set local role ${role}`);
    if (actor) await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [actor]);
    return (await tx.query(sql, params)).rows;
  });
}

Deno.test({
  name: 'two postings on the same balance serialise: the second waits, then reads the committed version',
  ignore: !realServer,
  async fn() {
    const w = await dbWorld();
    const { db, e, f, l } = w;
    const slice = (await db.query<{ id: string }>(
      `insert into finly.balance_slice (entity_id, ledger_account_id, fund_id, location_id)
       values ($1, $2, $3, $4) returning id`,
      [e.mint, w.account(e.mint, '1100'), f.mint, l.tijori],
    )).rows[0].id;
    await db.query(
      `insert into finly.balance_current (slice_id, entity_id, balance_enc, key_version) values ($1, $2, $3, 1)`,
      [slice, e.mint, fakeCipher()],
    );
    const a = db.connect!();
    const b = db.connect!();
    const lock = await lockedBy(a, 'finly_ledger', w.u.krish, async (tx) => {
      await tx.query(`select version from finly.balance_current where slice_id = $1 for update`, [slice]);
      await tx.query(`update finly.balance_current set balance_enc = $2 where slice_id = $1`, [slice, fakeCipher()]);
    });
    await expectSqlError(
      '55P03',
      () =>
        tryOn(
          b,
          'finly_ledger',
          w.u.krish,
          `select version from finly.balance_current where slice_id = $1 for update`,
          [
            slice,
          ],
        ),
    );
    await lock.release();
    const after = await tryOn(
      b,
      'finly_ledger',
      w.u.krish,
      `select version from finly.balance_current
      where slice_id = $1 for update`,
      [slice],
    ) as { version: string }[];
    assertEquals(Number(after[0].version), 2, "B sees A's update (version 1 → 2), never the stale row");
    await Promise.all([a.close(), b.close(), db.close()]);
  },
});

Deno.test({
  name: 'a double-submitted request inserts one idempotency record: the duplicate waits, then finds the first',
  ignore: !realServer,
  async fn() {
    const w = await dbWorld();
    const { db, u } = w;
    const key = crypto.randomUUID();
    const insert = `insert into finly.idempotency_record (user_id, key, operation, request_hash)
                    values ($1, $2, 'txn.post', $3) on conflict (user_id, key) do nothing returning key`;
    const a = db.connect!();
    const b = db.connect!();
    const lock = await lockedBy(a, 'finly_api', u.krish, async (tx) => {
      await tx.query(insert, [u.krish, key, new Uint8Array(32)]);
    });
    await expectSqlError('55P03', () => tryOn(b, 'finly_api', u.krish, insert, [u.krish, key, new Uint8Array(32)]));
    await lock.release();
    const second = await tryOn(b, 'finly_api', u.krish, insert, [u.krish, key, new Uint8Array(32)]);
    assertEquals(second, [], 'the duplicate inserts nothing');
    const n = await db.query<{ n: number }>(`select count(*)::int as n from finly.idempotency_record where key = $1`, [
      key,
    ]);
    assertEquals(n.rows[0].n, 1);
    await Promise.all([a.close(), b.close(), db.close()]);
  },
});

Deno.test({
  name: 'a month cannot be closed while a posting into it is in flight (journal FOR SHARE vs close)',
  ignore: !realServer,
  async fn() {
    const w = await dbWorld();
    const { db, u, e, f, l, p } = w;
    const a = db.connect!();
    const b = db.connect!();
    const lock = await lockedBy(a, 'finly_ledger', u.krish, async (tx) => {
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: w.account(e.mint, '1100'), fund: f.mint, side: 'Dr', location: l.tijori },
            { account: w.account(e.mint, '1200'), fund: f.mint, side: 'Cr', location: l.savanBank },
          ],
        }],
      });
    });
    const close = `update finly.accounting_period set period_status = 'closed', closed_at = now() where id = $1`;
    await expectSqlError('55P03', () => tryOn(b, null, null, close, [p.mint]));
    await lock.release();
    const closed = await b.transaction(async (tx) => {
      await tx.query(close, [p.mint]);
      return (await tx.query<{ n: number }>(`select count(*)::int as n from finly.journal where period_id = $1`, [
        p.mint,
      ]))
        .rows[0].n;
    });
    assertEquals(closed, 1, 'the close happens after the posting, and sees it');
    await Promise.all([a.close(), b.close(), db.close()]);
  },
});

Deno.test({
  name: 'postings queue on the journal chain head; two approvers cannot both decide one step',
  ignore: !realServer,
  async fn() {
    const w = await dbWorld();
    const { db, u, e } = w;
    const a = db.connect!();
    const b = db.connect!();
    const head = `update finly.journal_chain_head set last_seq = last_seq + 1 where id = 1 returning last_seq`;
    const lock = await lockedBy(a, 'finly_ledger', u.krish, async (tx) => {
      await tx.query(head);
    });
    await expectSqlError('55P03', () => tryOn(b, 'finly_ledger', u.krish, head));
    await lock.release();

    const txn = (await db.query<{ id: string }>(
      `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id)
       values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
               'transfer', $1, current_date, $2) returning id`,
      [e.mint, u.sujal],
    )).rows[0].id;
    const step = (await db.query<{ id: string }>(
      `insert into finly.approval_request (target_type, txn_id, target_id, required_permission, requested_by)
       values ('txn', $1, $1, 'txn.approve', $2) returning id`,
      [txn, u.sujal],
    )).rows[0].id;
    const decide = (who: string) =>
      `update finly.approval_request set request_status = 'approved', decided_by = '${who}', decided_at = now()
       where id = '${step}'`;
    const first = await lockedBy(a, null, null, async (tx) => {
      await tx.exec(decide(u.krish));
      await audit(tx, u.krish, 'approval.decided', 'approval_request', step, e.mint, txn);
    });
    await expectSqlError('55P03', () => tryOn(b, null, null, decide(u.father)));
    await first.release();
    await expectSqlError('F1007', () => tryOn(b, null, null, decide(u.father)));
    await Promise.all([a.close(), b.close(), db.close()]);
  },
});

Deno.test({
  name: 'an offline entry synced twice at the same moment creates one transaction (client_ref)',
  ignore: !realServer,
  async fn() {
    const w = await dbWorld();
    const { db, u, e } = w;
    const ref = crypto.randomUUID();
    const insert = `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date,
                      created_by_user_id, client_ref)
                    values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
                            'transfer', $1, current_date, $2, $3) returning id`;
    const a = db.connect!();
    const b = db.connect!();
    const lock = await lockedBy(a, 'finly_api', u.krish, async (tx) => {
      await tx.query(insert, [e.mint, u.krish, ref]);
    });
    await expectSqlError('55P03', () => tryOn(b, 'finly_api', u.krish, insert, [e.mint, u.krish, ref]));
    await lock.release();
    await expectSqlError('23505', () => tryOn(b, 'finly_api', u.krish, insert, [e.mint, u.krish, ref]));
    await Promise.all([a.close(), b.close(), db.close()]);
  },
});
