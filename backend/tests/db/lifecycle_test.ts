/**
 * Lifecycles the database enforces by itself: immutable history, the transaction state machine, frozen legs,
 * ordered period closes, owner / access / holder history, approvals and handovers (docs/database/07).
 */
import { assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { audit, commitChecks, postEvent } from './posting.ts';
import { as, dbWorld, fakeCipher } from './world.ts';

const w = await dbWorld();
const { db, u, e, f, l, p } = w;
const transferLines = [
  { account: w.account(e.mint, '1100'), fund: f.mint, side: 'Dr' as const, location: l.tijori },
  { account: w.account(e.mint, '1200'), fund: f.mint, side: 'Cr' as const, location: l.savanBank },
];
const posted = await as(db, 'finly_ledger', u.krish, (tx) =>
  postEvent(tx, {
    actor: u.krish,
    primaryEnv: e.mint,
    journals: [{ entity: e.mint, period: p.mint, lines: transferLines }],
  }), { commit: true });

const su = <T>(fn: Parameters<typeof as<T>>[3]) => as<T>(db, null, null, fn);

Deno.test('posted journals, lines, links and the audit trail cannot be changed or deleted (F1001)', async () => {
  const [journal] = posted.journalIds;
  await expectSqlError(
    'F1001',
    () => su((tx) => tx.query(`update finly.journal set step = 2 where id = $1`, [journal])),
  );
  await expectSqlError(
    'F1001',
    () => su((tx) => tx.query(`delete from finly.journal_line where journal_id = $1`, [journal])),
  );
  await expectSqlError(
    'F1001',
    () => su((tx) => tx.query(`update finly.journal_line set side = 'Cr' where journal_id = $1`, [journal])),
  );
  await expectSqlError('F1001', () => su((tx) => tx.query(`update finly.audit_log set reason = 'edited'`)));
  await expectSqlError('F1001', () => su((tx) => tx.query(`delete from finly.audit_log`)));
  await expectSqlError('F1001', () => su((tx) => tx.query(`delete from finly.txn where id = $1`, [posted.txnId])));
});

Deno.test('the only change to a posted line: the system role re-encrypting it under a newer key', async () => {
  const [journal] = posted.journalIds;
  await su(async (tx) => {
    await tx.query(`update finly.journal_line set amount_enc = $1, key_version = 2 where journal_id = $2`, [
      fakeCipher(),
      journal,
    ]);
  });
  await expectSqlError(
    'F1001',
    () =>
      su((tx) =>
        tx.query(`update finly.journal_line set amount_enc = $1, key_version = 1 where journal_id = $2`, [
          fakeCipher(),
          journal,
        ])
      ),
  );
});

Deno.test('the transaction state machine refuses impossible moves (F1007)', async () => {
  await expectSqlError(
    'F1007',
    () => su((tx) => tx.query(`update finly.txn set status = 'draft' where id = $1`, [posted.txnId])),
  );
  await expectSqlError(
    'F1007',
    () =>
      su((tx) =>
        tx.query(`update finly.txn set status = 'approved', approved_at = now() where id = $1`, [posted.txnId])
      ),
  );
});

Deno.test('a submitted transaction is frozen: header and legs cannot change (F1010)', async () => {
  await expectSqlError(
    'F1010',
    () => su((tx) => tx.query(`update finly.txn set reason = 'edited later' where id = $1`, [posted.txnId])),
  );
  await expectSqlError(
    'F1010',
    () =>
      su((tx) => tx.query(`update finly.txn_leg set amount_enc = $1 where txn_id = $2`, [fakeCipher(), posted.txnId])),
  );
  await expectSqlError(
    'F1010',
    () => su((tx) => tx.query(`delete from finly.txn_leg where txn_id = $1`, [posted.txnId])),
  );
});

Deno.test('an event cannot be submitted without legs (F1005 at commit)', async () => {
  await expectSqlError('F1005', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      const t = await tx.query<{ id: string }>(
        `insert into finly.txn (reference, txn_type_id, intent_type, primary_env_id, value_date, created_by_user_id)
         values (finly.next_reference('TX', current_date), (select id from finly.txn_type where key = 'transfer'),
                 'transfer', $1, current_date, $2) returning id`,
        [e.mint, u.krish],
      );
      await tx.query(`update finly.txn set status = 'posted', posted_at = now() where id = $1`, [t.rows[0].id]);
      await audit(tx, u.krish, 'txn.posted', 'txn', t.rows[0].id, e.mint, t.rows[0].id);
      await commitChecks(tx);
    }));
});

Deno.test('a journal is reversed at most once (23505)', async () => {
  const [original] = posted.journalIds;
  const mirror = [
    { ...transferLines[0], side: 'Cr' as const },
    { ...transferLines[1], side: 'Dr' as const },
  ];
  await expectSqlError('23505', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      for (let i = 0; i < 2; i++) {
        await postEvent(tx, {
          actor: u.krish,
          primaryEnv: e.mint,
          journals: [{ entity: e.mint, period: p.mint, lines: mirror, kind: 'reversal', reversalOf: original }],
        });
      }
    }));
});

Deno.test('months close in order, reopen in reverse, and a closed month takes no postings (F1002)', async () => {
  await su(async (tx) => {
    const next = await tx.query<{ id: string }>(
      `insert into finly.accounting_period (entity_id, period_start, period_end)
       values ($1, (date_trunc('month', current_date) + interval '1 month')::date,
               (date_trunc('month', current_date) + interval '2 months - 1 day')::date) returning id`,
      [e.mint],
    );
    const close = (id: string) =>
      tx.query(`update finly.accounting_period set period_status = 'closed', closed_at = now() where id = $1`, [id]);
    await tx.exec('savepoint s');
    await expectSqlError('F1002', () => close(next.rows[0].id));
    await tx.exec('rollback to savepoint s');
    await close(p.mint);
    await close(next.rows[0].id);
    await tx.exec('savepoint t');
    await expectSqlError(
      'F1002',
      () =>
        tx.query(`update finly.accounting_period set period_status = 'open', closed_at = null where id = $1`, [p.mint]),
    );
    await tx.exec('rollback to savepoint t');
    await tx.exec(`set local role finly_ledger`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await expectSqlError('F1002', () =>
      postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{ entity: e.mint, period: p.mint, lines: transferLines }],
      }));
  });
});

Deno.test('a location has exactly one current holder, which may be nobody; access history survives a Replace', async () => {
  await expectSqlError(
    '23505',
    () =>
      su((tx) =>
        tx.query(`insert into finly.location_holder (location_id, person_entity_id) values ($1, $2)`, [
          l.tijori,
          e.krish,
        ])
      ),
  );
  const access = await su(async (tx) => {
    const add = crypto.randomUUID();
    await tx.query(
      `insert into finly.location_access (location_id, person_entity_id, change_id, change_kind)
       values ($1, $2, $4, 'initial'), ($1, $3, $4, 'initial')`,
      [l.tijori, e.krish, e.father, add],
    );
    // Replace Krish by Sujal: one revoke and one grant under the same change id (RULEBOOK-03 §14).
    const replace = crypto.randomUUID();
    await tx.query(
      `update finly.location_access set revoked_at = now(), revoke_change_id = $3
       where location_id = $1 and person_entity_id = $2 and revoked_at is null`,
      [l.tijori, e.krish, replace],
    );
    await tx.query(
      `insert into finly.location_access (location_id, person_entity_id, change_id, change_kind)
       values ($1, $2, $3, 'replace')`,
      [l.tijori, e.sujal, replace],
    );
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1001',
      () =>
        tx.query(`update finly.location_access set person_entity_id = $1 where person_entity_id = $2`, [
          e.jsk,
          e.father,
        ]),
    );
    await tx.exec('rollback to savepoint s');
    return (await tx.query<{ person_entity_id: string; current: boolean }>(
      `select person_entity_id, revoked_at is null as current from finly.location_access where location_id = $1`,
      [l.tijori],
    )).rows;
  });
  const current = access.filter((a) => a.current).map((a) => a.person_entity_id).sort();
  assertEquals(current, [e.father, e.sujal].sort());
  assertEquals(access.length, 3, "Krish's ended access is kept as history");
});

Deno.test('the maker of a request cannot approve it; a decision is final (F1011, F1007)', async () => {
  await su(async (tx) => {
    const r = await tx.query<{ id: string }>(
      `insert into finly.approval_request (target_type, txn_id, target_id, required_permission, requested_by)
       values ('txn', $1, $1, 'txn.approve', $2) returning id`,
      [posted.txnId, u.father],
    );
    const id = r.rows[0].id;
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1011',
      () =>
        tx.query(
          `update finly.approval_request set request_status = 'approved', decided_by = $1, decided_at = now()
                where id = $2`,
          [u.krish, id],
        ),
    );
    await tx.exec('rollback to savepoint s');
    await tx.query(
      `update finly.approval_request set request_status = 'approved', decided_by = $1, decided_at = now()
                    where id = $2`,
      [u.savan, id],
    );
    await expectSqlError(
      'F1007',
      () => tx.query(`update finly.approval_request set request_status = 'rejected' where id = $1`, [id]),
    );
  });
});

Deno.test('kinds are enforced: an entity keeps its kind; a firm cannot be a member of a firm (F1012)', async () => {
  await expectSqlError(
    'F1012',
    () => su((tx) => tx.query(`update finly.entity set kind = 'pool' where id = $1`, [e.mint])),
  );
  await expectSqlError(
    'F1012',
    () =>
      su((tx) =>
        tx.query(
          `insert into finly.entity_membership (org_entity_id, member_entity_id, engine_role) values ($1, $2, 'owner')`,
          [
            e.mint,
            e.jsk,
          ],
        )
      ),
  );
  await expectSqlError(
    'F1001',
    () => su((tx) => tx.query(`update finly.env_access set level = 'manage' where user_id = $1`, [u.sujal])),
  );
});
