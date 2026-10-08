/**
 * Row-level security and personal-finance privacy (A4, L3, L12; docs/database/05; 07 rows 5, 8, 27, 28, 29).
 * The world is posted once (committed), then each test reads it as one of Finly's users through role finly_api.
 */
import { assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { postEvent } from './posting.ts';
import { as, dbWorld, fakeCipher } from './world.ts';

const w = await dbWorld();
const { db, u, e, f, l, p } = w;

// The ₹45,000 Angadiya expense paid by Krish: Mint 30,000 + JSK 5,000 + Krish personal 10,000.
const angadiya = await as(db, 'finly_ledger', u.krish, async (tx) => {
  const r = await postEvent(tx, {
    actor: u.krish,
    primaryEnv: e.krish,
    journals: [
      {
        entity: e.mint,
        period: p.mint,
        lines: [
          { account: w.account(e.mint, '5150'), fund: f.mint, side: 'Dr', category: w.cat('hotel') },
          { account: w.account(e.mint, '2100'), fund: f.mint, side: 'Cr', counterparty: e.krish },
        ],
      },
      {
        entity: e.jsk,
        period: p.jsk,
        lines: [
          { account: w.account(e.jsk, '5100'), fund: f.jsk, side: 'Dr', category: w.cat('travel') },
          { account: w.account(e.jsk, '2100'), fund: f.jsk, side: 'Cr', counterparty: e.krish },
        ],
      },
      {
        entity: e.krish,
        period: p.krish,
        lines: [
          { account: w.account(e.krish, '5200'), fund: f.krish, side: 'Dr', category: w.cat('food') },
          { account: w.account(e.krish, '1300'), fund: f.krish, side: 'Dr', counterparty: e.mint },
          { account: w.account(e.krish, '1300'), fund: f.krish, side: 'Dr', counterparty: e.jsk },
          { account: w.account(e.krish, '1200'), fund: f.krish, side: 'Cr', location: l.krishBank },
        ],
      },
    ],
  });
  await tx.query(
    `insert into finly.txn_note (txn_id, env_entity_id, note_enc, key_version, created_by) values ($1, $2, $3, 1, $4)`,
    [r.txnId, e.krish, fakeCipher(), u.krish],
  );
  return r.txnId;
}, { commit: true });

// Mint money moved into the owner-only private fund, kept in the owner-only wardrobe.
const privateMove = await as(db, 'finly_ledger', u.krish, async (tx) => {
  const r = await postEvent(tx, {
    actor: u.krish,
    primaryEnv: e.mint,
    journals: [{
      entity: e.mint,
      period: p.mint,
      lines: [
        { account: w.account(e.mint, '1100'), fund: f.mintPrivate, side: 'Dr', location: l.wardrobe },
        { account: w.account(e.mint, '3200'), fund: f.mintPrivate, side: 'Cr' },
      ],
    }],
  });
  for (const fund of [f.mintPrivate, f.mint]) {
    await tx.query(
      `insert into finly.balance_slice (entity_id, ledger_account_id, fund_id, location_id) values ($1, $2, $3, $4)`,
      [e.mint, w.account(e.mint, '1100'), fund, fund === f.mintPrivate ? l.wardrobe : l.tijori],
    );
  }
  return r.txnId;
}, { commit: true });

async function visible(actor: string | null, sql: string, params: unknown[] = []): Promise<unknown[]> {
  return await as(db, 'finly_api', actor, async (tx) => (await tx.query(sql, params)).rows);
}

const journalEntities = (actor: string) =>
  visible(actor, `select entity_id from finly.journal where txn_id = $1 order by entity_id`, [angadiya]).then((r) =>
    (r as { entity_id: string }[]).map((x) => x.entity_id).sort()
  );

Deno.test('no actor, no data: every query returns nothing', async () => {
  assertEquals(await visible(null, `select id from finly.entity`), []);
  assertEquals(await visible(null, `select id from finly.journal`), []);
  assertEquals(await visible(null, `select id from finly.txn`), []);
});

Deno.test('a mixed event is split by environment: each viewer sees only their own side', async () => {
  assertEquals(await journalEntities(u.krish), [e.jsk, e.krish, e.mint].sort());
  assertEquals(await journalEntities(u.father), [e.mint]);
  // Savan is a Super Admin with full admin: every firm, never Krish's personal books.
  assertEquals(await journalEntities(u.savan), [e.jsk, e.mint].sort());
  const legs = await visible(u.father, `select entity_id from finly.txn_leg where txn_id = $1`, [angadiya]);
  assertEquals(legs, [{ entity_id: e.mint }]);
  const parts = await visible(u.father, `select entity_id from finly.txn_entity where txn_id = $1`, [angadiya]);
  assertEquals(parts, [{ entity_id: e.mint }]);
  assertEquals(await visible(u.father, `select id from finly.txn_note where txn_id = $1`, [angadiya]), []);
  assertEquals((await visible(u.krish, `select id from finly.txn_note where txn_id = $1`, [angadiya])).length, 1);
});

Deno.test('nobody but the owner can open personal books — not even a Super Admin (F1008)', async () => {
  await expectSqlError('F1008', () =>
    as(db, 'finly_api', u.savan, (tx) =>
      tx.query(
        `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by)
         values ($1, $2, 'read', 'owner_grant', $1)`,
        [u.savan, e.krish],
      )));
  // Recording the grant in Krish's name does not help: the grantor is the actor of the transaction.
  await expectSqlError('F1008', () =>
    as(db, 'finly_api', u.savan, (tx) =>
      tx.query(
        `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by)
         values ($1, $2, 'read', 'owner_grant', $3)`,
        [u.savan, e.krish, u.krish],
      )));
  await expectSqlError('F1008', () =>
    as(db, 'finly_api', u.savan, (tx) =>
      tx.query(
        `insert into finly.access_rule (subject_type, subject_user_id, resource_type, resource_id, actions, effect,
           source, granted_by)
         values ('user', $1, 'fund', $2, array['view'], 'allow', 'admin', $1)`,
        [u.savan, f.krish],
      )));
  await expectSqlError(
    'F1008',
    () =>
      as(db, null, null, (tx) =>
        tx.query(
          `insert into finly.break_glass (user_id, env_entity_id, reason, auth_strength, ends_at)
                values ($1, $2, 'testing the emergency path', 3, now() + interval '1 hour')`,
          [u.savan, e.krish],
        )),
  );
});

Deno.test('the owner may grant access to their own books; the grantee then sees them', async () => {
  const seen = await as(db, null, null, async (tx) => {
    await tx.exec(`set local role finly_api`);
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
    await tx.query(
      `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by)
       values ($1, $2, 'read', 'owner_grant', $3)`,
      [u.father, e.krish, u.krish],
    );
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.father]);
    return (await tx.query<{ entity_id: string }>(`select entity_id from finly.journal where txn_id = $1`, [angadiya]))
      .rows.map((r) => r.entity_id).sort();
  });
  assertEquals(seen, [e.krish, e.mint].sort());
});

Deno.test('owner-only funds and places are hidden from non-owners, in rows and in balances', async () => {
  const lines = (actor: string) =>
    visible(
      actor,
      `select fund_id from finly.journal_line where journal_id in
      (select id from finly.journal where txn_id = $1)`,
      [privateMove],
    );
  assertEquals((await lines(u.sujal)).length, 0, 'the worker sees none of the private lines');
  assertEquals((await lines(u.father)).length, 2, 'an owner of Mint sees them');
  const slices = (actor: string) =>
    visible(actor, `select fund_id from finly.balance_slice where entity_id = $1 order by fund_id`, [e.mint]);
  assertEquals(await slices(u.sujal), [{ fund_id: f.mint }]);
  assertEquals((await slices(u.krish)).length, 2);
  assertEquals(await visible(u.sujal, `select id from finly.location where id = $1`, [l.wardrobe]), []);
  assertEquals((await visible(u.father, `select id from finly.location where id = $1`, [l.wardrobe])).length, 1);
  assertEquals(await visible(u.sujal, `select id from finly.txn where id = $1`, [privateMove]), []);
});

Deno.test('credentials never reach the API role; posted history cannot be deleted by it', async () => {
  await expectSqlError('42501', () => visible(u.krish, `select password_hash from finly.user_credential`));
  await expectSqlError('42501', () => visible(u.krish, `delete from finly.journal where txn_id = $1`, [angadiya]));
  await expectSqlError('42501', () => visible(u.krish, `update finly.journal_line set side = 'Cr'`));
});

Deno.test('authorisation details are not public: a worker sees only their own grants and no approval rules', async () => {
  const grants = await visible(u.sujal, `select user_id from finly.env_access`) as { user_id: string }[];
  assertEquals(grants.every((g) => g.user_id === u.sujal), true);
  assertEquals(await visible(u.sujal, `select id from finly.approval_rule`), []);
  assertEquals(await visible(u.sujal, `select id from finly.access_rule`), []);
});

Deno.test('a user is always the same person: their personal books cannot be re-pointed (F1008)', async () => {
  await expectSqlError(
    'F1008',
    () =>
      as(
        db,
        null,
        null,
        (tx) => tx.query(`update finly.app_user set person_entity_id = $1 where id = $2`, [e.father, u.krish]),
      ),
  );
});
