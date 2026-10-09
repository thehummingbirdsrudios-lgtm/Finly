/**
 * Migration 0016: D-038 (platform administration opens no firm; owners act through explicit, scoped roles) and books
 * provisioned by the database (chart, default fund and periods once; later months as entries reach them).
 */
import { assertEquals } from '@std/assert';
import { emptyDb, expectSqlError, MIGRATIONS_DIR } from './harness.ts';
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { as, dbWorld } from './world.ts';

const w = await dbWorld();
const { db, u, e } = w;

async function newEntity(kind: 'firm' | 'person', name: string): Promise<string> {
  const r = await db.query<{ id: string }>(
    `insert into finly.entity (kind, entity_type_id, display_name)
     values ($1, (select id from finly.entity_type where key = $2), $3) returning id`,
    [kind, kind === 'firm' ? 'company' : 'individual', name],
  );
  return r.rows[0].id;
}

Deno.test('a Super Admin without a grant sees no firm, its money places or its accounts (D-038)', async () => {
  const seen = await as(db, 'finly_api', u.savan, async (tx) => ({
    envs: (await tx.query<{ ids: string[] }>(`select finly.actor_env_ids('read') as ids`)).rows[0].ids,
    firms: (await tx.query(`select id from finly.entity where kind = 'firm'`)).rows,
    places: (await tx.query(`select id from finly.location where managed_in_env_id = $1`, [e.mint])).rows,
    accounts: (await tx.query(`select id from finly.ledger_account where entity_id = $1`, [e.mint])).rows,
  }));
  assertEquals(seen.envs, [e.savan], 'only his own personal books');
  assertEquals(seen.firms, []);
  assertEquals(seen.places, []);
  assertEquals(seen.accounts, []);
});

Deno.test('the same Super Admin with an explicit grant sees that firm, and only that one', async () => {
  const envs = await as(db, null, null, async (tx) => {
    await tx.query(
      `insert into finly.env_access (user_id, env_entity_id, level, source, granted_by, reason)
       values ($1, $2, 'read', 'admin', $3, 'Asked to help with the March accounts')`,
      [u.savan, e.jsk, u.krish],
    );
    await tx.query(`select set_config('finly.actor_user_id', $1, true)`, [u.savan]);
    await tx.exec('set local role finly_api');
    return (await tx.query<{ ids: string[] }>(`select finly.actor_env_ids('read') as ids`)).rows[0].ids;
  });
  assertEquals(envs.sort(), [e.jsk, e.savan].sort());
});

Deno.test('an ownership grant needs a recorded, undisputed owner', async () => {
  // Sujal works in Mint but owns nothing.
  await expectSqlError('F1008', () =>
    as(db, null, null, (tx) =>
      tx.query(
        `insert into finly.env_access (user_id, env_entity_id, level, source) values ($1, $2, 'manage', 'ownership')`,
        [u.sujal, e.mint],
      )));
  // Father owns half of Mint: accepted.
  await as(db, null, null, (tx) =>
    tx.query(
      `insert into finly.env_access (user_id, env_entity_id, level, source) values ($1, $2, 'manage', 'ownership')`,
      [u.father, e.mint],
    ));
});

Deno.test('provision_books sets up a chart, a default fund and periods once; the start date never moves', async () => {
  const shop = await newEntity('firm', 'New Shop');
  await as(db, null, null, async (tx) => {
    await tx.query(
      `select finly.provision_books($1, (date_trunc('month', current_date) - interval '2 months')::date)`,
      [
        shop,
      ],
    );
    const count = async (sql: string) =>
      (await tx.query<{ n: number }>(`select count(*)::int as n from ${sql}`, [shop])).rows[0].n;
    const template = (await tx.query<{ n: number }>(
      `select count(*)::int as n from finly.coa_template_account where entity_kind = 'firm'`,
    )).rows[0].n;
    assertEquals(await count(`finly.ledger_account where entity_id = $1`), template);
    assertEquals(await count(`finly.fund where entity_id = $1 and is_default`), 1);
    assertEquals(await count(`finly.accounting_period where entity_id = $1`), 3, 'two months back to this month');
    // A second call changes nothing, even with another date.
    await tx.query(`select finly.provision_books($1, current_date - 400)`, [shop]);
    assertEquals(await count(`finly.accounting_period where entity_id = $1`), 3);
    assertEquals(await count(`finly.ledger_account where entity_id = $1`), template);
  }, { commit: true });
  // No starting before the year 2000, none in the future.
  const later = await newEntity('firm', 'Future Shop');
  await expectSqlError(
    'F1007',
    () => as(db, null, null, (tx) => tx.query(`select finly.provision_books($1, current_date + 1)`, [later])),
  );
});

Deno.test('through the API, books are set up only for oneself or books one manages', async () => {
  const other = await newEntity('firm', 'Someone Else Ltd');
  await expectSqlError(
    'F1008',
    () => as(db, 'finly_api', u.sujal, (tx) => tx.query(`select finly.provision_books($1, current_date)`, [other])),
  );
  // Parties keep no books at all.
  await expectSqlError(
    'F1012',
    () => as(db, null, null, (tx) => tx.query(`select finly.provision_books($1, current_date)`, [e.hotel])),
  );
});

Deno.test('ensure_periods opens later months only: never before the books start, never a year ahead', async () => {
  const shop = await newEntity('firm', 'Periods Shop');
  await as(db, null, null, async (tx) => {
    await tx.query(`select finly.provision_books($1, current_date)`, [shop]);
    const months = async () =>
      (await tx.query<{ m: string }>(
        `select period_start::text as m from finly.accounting_period where entity_id = $1 order by 1`,
        [shop],
      )).rows.map((r) => r.m);
    const start = await months();
    assertEquals(start.length, 1);
    // As the posting role, which may only call the function (it cannot read other books' periods).
    const ensure = async (date: string) => {
      await tx.exec('set local role finly_ledger');
      await tx.query(`select finly.ensure_periods($1, ${date})`, [shop]);
      await tx.exec('reset role');
    };
    await ensure('current_date - 60');
    assertEquals(await months(), start, 'before the books start: nothing');
    await ensure('current_date + 400');
    assertEquals(await months(), start, 'more than a year ahead: nothing');
    await ensure(`(current_date + interval '2 months')::date`);
    assertEquals((await months()).length, 3, 'this month and the next two');
  });
});

Deno.test('the migration gives recorded owners with accounts an explicit owner role and grant, for review', async () => {
  const { sql, db: legacy, close } = await emptyDb();
  try {
    const all = await loadMigrations(MIGRATIONS_DIR);
    await migrate(sql, all.filter((m) => m.version <= '0015'));
    const id = async (q: string, p: unknown[] = []) => (await legacy.query<{ id: string }>(q, p)).rows[0].id;
    const firm = await id(`insert into finly.entity (kind, entity_type_id, display_name)
                           values ('firm', (select id from finly.entity_type where key = 'company'), 'Old Firm') returning id`);
    const person = await id(`insert into finly.entity (kind, entity_type_id, display_name)
                             values ('person', (select id from finly.entity_type where key = 'individual'), 'Old Owner')
                             returning id`);
    const user = await id(
      `insert into finly.app_user (person_entity_id, username, display_name, status, must_change_password, activated_at)
       values ($1, 'oldowner', 'Old Owner', 'active', false, now()) returning id`,
      [person],
    );
    await legacy.query(
      `insert into finly.entity_ownership (entity_id, owner_entity_id, share_basis, ownership_type_id)
       values ($1, $2, 'unspecified', (select id from finly.lookup_value where list_key = 'ownership_type'
                                       and key = 'individual'))`,
      [firm, person],
    );
    await migrate(sql, all);
    const grant = (await legacy.query<{ level: string; source: string; reason: string }>(
      `select level, source, reason from finly.env_access where user_id = $1 and env_entity_id = $2`,
      [user, firm],
    )).rows;
    assertEquals(grant.map((g) => [g.level, g.source]), [['manage', 'ownership']]);
    assertEquals(grant[0].reason.includes('review'), true);
    const roles = (await legacy.query<{ key: string; scope: string }>(
      `select r.key, ur.scope_entity_id as scope from finly.user_role ur join finly.role r on r.id = ur.role_id
       where ur.user_id = $1`,
      [user],
    )).rows;
    assertEquals(roles, [{ key: 'entity_owner', scope: firm }]);
  } finally {
    await close();
  }
});
