/**
 * What the database itself refuses in the ledger (docs/database/07 rows 1, 4, 6, 33, 34, 36, 37; 01 §1.6).
 * Each test acts as the posting service (role finly_ledger) with an actor set.
 */
import { assertEquals } from '@std/assert';
import { expectSqlError } from './harness.ts';
import { commitChecks, type LineSpec, postEvent } from './posting.ts';
import { as, dbWorld } from './world.ts';

const w = await dbWorld();
const { db, u, e, f, l, p } = w;
const cash = (entity: string) => w.account(entity, '1100');
const bank = (entity: string) => w.account(entity, '1200');

function transfer(entity: string, fund: string, from: string, to: string): LineSpec[] {
  return [
    { account: cash(entity), fund, side: 'Dr', location: to },
    { account: bank(entity), fund, side: 'Cr', location: from },
  ];
}

Deno.test('a balanced ₹50,000 transfer (Savan Bank → Tijori) commits with its audit row', async () => {
  const n = await as(db, 'finly_ledger', u.krish, async (tx) => {
    await postEvent(tx, {
      actor: u.krish,
      primaryEnv: e.mint,
      journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.mint, l.savanBank, l.tijori) }],
    });
    await commitChecks(tx);
    return (await tx.query(`select count(*)::int as n from finly.journal_line`)).rows[0];
  });
  assertEquals(n, { n: 2 });
});

Deno.test('a one-sided journal is refused at commit (F1005)', async () => {
  await expectSqlError('F1005', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: cash(e.mint), fund: f.mint, side: 'Dr', location: l.tijori },
            { account: bank(e.mint), fund: f.mint, side: 'Dr', location: l.savanBank },
          ],
        }],
      });
      await commitChecks(tx);
    }));
});

Deno.test('every fund in a journal needs both sides (F1005)', async () => {
  await expectSqlError('F1005', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: cash(e.mint), fund: f.mint, side: 'Dr', location: l.tijori },
            { account: bank(e.mint), fund: f.mintPrivate, side: 'Cr', location: l.savanBank },
          ],
        }],
      });
      await commitChecks(tx);
    }));
});

Deno.test("a line in another entity's account or fund is refused by the composite keys (23503)", async () => {
  await expectSqlError('23503', () =>
    as(db, 'finly_ledger', u.krish, (tx) =>
      postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: cash(e.jsk), fund: f.mint, side: 'Dr', location: l.tijori },
            { account: bank(e.mint), fund: f.mint, side: 'Cr', location: l.savanBank },
          ],
        }],
      })));
  await expectSqlError('23503', () =>
    as(db, 'finly_ledger', u.krish, (tx) =>
      postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.jsk, l.savanBank, l.tijori) }],
      })));
});

Deno.test('dimension rules: money lines need a place, income and expense lines a category (F1006)', async () => {
  await expectSqlError('F1006', () =>
    as(db, 'finly_ledger', u.krish, (tx) =>
      postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: cash(e.mint), fund: f.mint, side: 'Dr' },
            { account: bank(e.mint), fund: f.mint, side: 'Cr', location: l.savanBank },
          ],
        }],
      })));
  await expectSqlError('F1006', () =>
    as(db, 'finly_ledger', u.krish, (tx) =>
      postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{
          entity: e.mint,
          period: p.mint,
          lines: [
            { account: w.account(e.mint, '5150'), fund: f.mint, side: 'Dr' },
            { account: cash(e.mint), fund: f.mint, side: 'Cr', location: l.tijori },
          ],
        }],
      })));
});

Deno.test('a posting without its audit row in the same transaction is refused (F1009)', async () => {
  await expectSqlError('F1009', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        skipAudit: true,
        journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.mint, l.savanBank, l.tijori) }],
      });
      await commitChecks(tx);
    }));
});

Deno.test('an entity whose books change must take part in the event (F1005)', async () => {
  await expectSqlError('F1005', () =>
    as(db, 'finly_ledger', u.krish, async (tx) => {
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        participants: [e.jsk],
        journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.mint, l.savanBank, l.tijori) }],
      });
      await commitChecks(tx);
    }));
});

Deno.test('no journal for an outside party; no posting to an inactive account or while writes are frozen', async () => {
  await expectSqlError('F1004', () =>
    as(db, null, null, async (tx) => {
      await tx.query(`update finly.ledger_account set status = 'inactive' where id = $1`, [cash(e.mint)]);
      await tx.exec(`set local role finly_ledger`);
      await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.mint, l.savanBank, l.tijori) }],
      });
    }));
  await expectSqlError('F1003', () =>
    as(db, null, null, async (tx) => {
      await tx.query(`update finly.emergency_control set active = true, reason = 'drill', activated_at = now()
                      where control_key = 'freeze_financial_writes'`);
      await tx.exec(`set local role finly_ledger`);
      await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.krish]);
      await postEvent(tx, {
        actor: u.krish,
        primaryEnv: e.mint,
        journals: [{ entity: e.mint, period: p.mint, lines: transfer(e.mint, f.mint, l.savanBank, l.tijori) }],
      });
    }));
});

Deno.test('the posting service cannot act without an actor (RLS denies every row)', async () => {
  const rows = await as(db, 'finly_ledger', null, async (tx) => (await tx.query(`select id from finly.entity`)).rows);
  assertEquals(rows, []);
});

Deno.test('a ₹45,000 three-entity expense posts three journals in one event', async () => {
  const count = await as(db, 'finly_ledger', u.krish, async (tx) => {
    await postEvent(tx, {
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
    await commitChecks(tx);
    return (await tx.query<{ n: number }>(`select count(*)::int as n from finly.journal`)).rows[0].n;
  });
  assertEquals(count, 3);
});
