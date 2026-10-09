/**
 * Migration 0014 (access model step 1; ADDON-17, ADDON-18): ownership, partnership and affiliation are independent
 * records with their own history; "owner" has one definition; the entity hierarchy has one structural parent and no
 * cycles; legacy rows are migrated without widening anything.
 */
import { assertEquals } from '@std/assert';
import { emptyDb, expectSqlError, MIGRATIONS_DIR } from './harness.ts';
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { as, dbWorld } from './world.ts';

const w = await dbWorld();
const { db, e } = w;
const su = <T>(fn: Parameters<typeof as<T>>[3]) => as(db, null, null, fn);

const lookup = (list: string, key: string) =>
  `(select id from finly.lookup_value where list_key = '${list}' and key = '${key}')`;

async function person(name: string): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into finly.entity (kind, entity_type_id, display_name)
     values ('person', (select id from finly.entity_type where key = 'individual'), $1) returning id`,
    [name],
  );
  return r.rows[0].id;
}

async function firm(name: string): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into finly.entity (kind, entity_type_id, display_name)
     values ('firm', (select id from finly.entity_type where key = 'company'), $1) returning id`,
    [name],
  );
  return r.rows[0].id;
}

const own = (entity: string, owner: string, bp: number | null, verification = 'verified') =>
  `insert into finly.entity_ownership (entity_id, owner_entity_id, share_basis, share_bp, ownership_type_id, verification)
   values ('${entity}', '${owner}', ${bp === null ? `'unspecified', null` : `'percent', ${bp}`},
           ${lookup('ownership_type', 'individual')}, '${verification}')`;
const partner = (entity: string, who: string) =>
  `insert into finly.entity_partnership (entity_id, partner_entity_id, partnership_type_id)
   values ('${entity}', '${who}', ${lookup('partnership_type', 'working')})`;

Deno.test('several owners with unequal shares; more than 100 % is refused at commit', async () => {
  const f = await firm('Three Owners Co');
  const [a, b, c] = [await person('Owner A'), await person('Owner B'), await person('Owner C')];
  await su(async (tx) => {
    await tx.exec(own(f, a, 6000) + ';' + own(f, b, 2500) + ';' + own(f, c, 1500));
    await tx.exec('set constraints all immediate');
  });
  await expectSqlError('F1007', () =>
    su(async (tx) => {
      await tx.exec(own(f, a, 6000) + ';' + own(f, b, 2500) + ';' + own(f, c, 2000));
      await tx.exec('set constraints all immediate');
    }));
});

Deno.test('the eight owner / partner / member combinations are all representable', async () => {
  const f = await firm('Combinations LLP');
  const people: Record<string, string> = {};
  for (const name of ['opm', 'op', 'om', 'o', 'pm', 'p', 'm', 'none']) people[name] = await person(`Person ${name}`);
  await su(async (tx) => {
    for (const k of ['opm', 'op', 'om', 'o']) await tx.exec(own(f, people[k], null));
    for (const k of ['opm', 'op', 'pm', 'p']) await tx.exec(partner(f, people[k]));
    await tx.exec('set constraints all immediate');
    const rows = await tx.query<{ k: string; owner: boolean; partner: boolean }>(
      `select p.k, finly.is_owner_of(p.id::uuid, $1::uuid) as owner,
              exists (select 1 from finly.entity_partnership x where x.entity_id = $1::uuid
                        and x.partner_entity_id = p.id::uuid
                        and x.valid_to is null) as partner
       from jsonb_each_text($2::text::jsonb) as p(k, id) order by p.k`,
      [f, JSON.stringify(people)],
    );
    const got = Object.fromEntries(rows.rows.map((r) => [r.k, [r.owner, r.partner]]));
    assertEquals(got, {
      m: [false, false],
      none: [false, false],
      o: [true, false],
      om: [true, false],
      op: [true, true],
      opm: [true, true],
      p: [false, true],
      pm: [false, true],
    });
  });
});

Deno.test('a partner, a disputed record or an ended record is not an owner', async () => {
  const f = await firm('Partner Only Firm');
  const [p, d, x] = [await person('Partner'), await person('Disputed'), await person('Former')];
  const owner = await su(async (tx) => {
    await tx.exec(partner(f, p));
    await tx.exec(own(f, d, 3000, 'disputed'));
    // A former owner: a period that ended yesterday.
    await tx.query(
      `insert into finly.entity_ownership (entity_id, owner_entity_id, share_basis, share_bp, ownership_type_id,
         verification, valid_from, valid_to)
       values ($1, $2, 'percent', 2000, ${lookup('ownership_type', 'individual')}, 'verified',
               current_date - 30, current_date - 1)`,
      [f, x],
    );
    return (await tx.query<{ p: boolean; d: boolean; x: boolean; was: boolean }>(
      `select finly.is_owner_of($1, $4) as p, finly.is_owner_of($2, $4) as d, finly.is_owner_of($3, $4) as x,
              finly.is_owner_of($3, $4, current_date - 10) as was`,
      [p, d, x, f],
    )).rows[0];
  });
  assertEquals(owner, { p: false, d: false, x: false, was: true });
});

Deno.test('ownership history is end-dated, never edited, overlapped or deleted', async () => {
  const f = await firm('History Co');
  const a = await person('Historic Owner');
  await su(async (tx) => {
    await tx.exec(own(f, a, 5000));
    await tx.exec('savepoint s');
    await expectSqlError(
      'F1001',
      () => tx.query(`update finly.entity_ownership set share_bp = 9000 where owner_entity_id = $1`, [a]),
    );
    await tx.exec('rollback to savepoint s');
    await expectSqlError('F1007', () => tx.exec(own(f, a, 1000)));
    await tx.exec('rollback to savepoint s');
    await expectSqlError('F1001', () => tx.query(`delete from finly.entity_ownership where owner_entity_id = $1`, [a]));
    await tx.exec('rollback to savepoint s');
    // Ending it is allowed, once; a new period may follow.
    await tx.query(`update finly.entity_ownership set valid_to = valid_from where owner_entity_id = $1`, [a]);
    await tx.exec('savepoint t');
    await expectSqlError(
      'F1001',
      () => tx.query(`update finly.entity_ownership set valid_to = valid_from + 5 where owner_entity_id = $1`, [a]),
    );
    await tx.exec('rollback to savepoint t');
    await tx.query(
      `insert into finly.entity_ownership (entity_id, owner_entity_id, share_basis, ownership_type_id, valid_from)
       values ($1, $2, 'unspecified', ${lookup('ownership_type', 'individual')}, current_date + 1)`,
      [f, a],
    );
  });
});

Deno.test('who can be owned and by whom: firms and pools are owned; anyone (even a firm or a party) may own', async () => {
  const p = await person('Not Ownable');
  await expectSqlError('F1012', () => su((tx) => tx.exec(own(p, e.krish, null))));
  await su(async (tx) => {
    await tx.exec(own(e.jsk, e.mint, null)); // corporate ownership: Mint owns part of JSK
    await tx.exec(own(e.jsk, e.hotel, null)); // a party may be an owner too
  });
});

Deno.test('hierarchy: one structural parent, links on top, no cycles, firms and pools only', async () => {
  const [parent, child, grandchild] = [await firm('Parent Co'), await firm('Child Co'), await firm('Grandchild Co')];
  const link = (p: string, c: string, kind: string) =>
    `insert into finly.entity_relationship (parent_entity_id, child_entity_id, kind) values ('${p}', '${c}', '${kind}')`;
  await su(async (tx) => {
    await tx.exec(link(parent, child, 'subsidiary') + ';' + link(child, grandchild, 'branch'));
    await tx.exec(link(e.mint, child, 'reporting')); // a non-structural link next to the structural parent
    await tx.exec('savepoint s');
    await expectSqlError('23505', () => tx.exec(link(e.mint, child, 'branch')));
    await tx.exec('rollback to savepoint s');
    await expectSqlError('F1007', () => tx.exec(link(grandchild, parent, 'business_unit')));
    await tx.exec('rollback to savepoint s');
    await expectSqlError('F1012', () => tx.exec(link(parent, e.krish, 'branch')));
  });
});

Deno.test('legacy owner and partner rows are migrated for review, never widened', async () => {
  const { sql, db: legacy, close } = await emptyDb();
  try {
    const all = await loadMigrations(MIGRATIONS_DIR);
    await migrate(sql, all.filter((m) => m.version <= '0013'));
    const id = async (q: string) => (await legacy.query<{ id: string }>(q)).rows[0].id;
    const f = await id(`insert into finly.entity (kind, entity_type_id, display_name)
                        values ('firm', (select id from finly.entity_type where key = 'company'), 'Legacy Firm') returning id`);
    const people = [];
    for (const n of ['Legacy Owner', 'Legacy Partner', 'Legacy Staff']) {
      people.push(
        await id(`insert into finly.entity (kind, entity_type_id, display_name)
                            values ('person', (select id from finly.entity_type where key = 'individual'), '${n}') returning id`),
      );
    }
    for (const [i, role] of ['owner', 'partner', 'staff'].entries()) {
      await legacy.query(
        `insert into finly.entity_membership (org_entity_id, member_entity_id, engine_role) values ($1, $2, $3)`,
        [f, people[i], role],
      );
    }
    await migrate(sql, all);
    const owners = (await legacy.query<{ owner_entity_id: string; share_basis: string; verification: string }>(
      `select owner_entity_id, share_basis, verification from finly.entity_ownership where entity_id = $1`,
      [f],
    )).rows;
    assertEquals(owners, [{ owner_entity_id: people[0], share_basis: 'unspecified', verification: 'unverified' }]);
    const partners = (await legacy.query<{ partner_entity_id: string }>(
      `select partner_entity_id from finly.entity_partnership where entity_id = $1`,
      [f],
    )).rows;
    assertEquals(partners, [{ partner_entity_id: people[1] }], 'the partner is a partner, not an owner');
    const current = (await legacy.query<{ member_entity_id: string; engine_role: string }>(
      `select member_entity_id, engine_role from finly.entity_affiliation where org_entity_id = $1 and valid_to is null`,
      [f],
    )).rows;
    assertEquals(current, [{ member_entity_id: people[2], engine_role: 'staff' }]);
  } finally {
    await close();
  }
});
