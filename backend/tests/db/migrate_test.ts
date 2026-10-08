import { assertEquals, assertRejects } from '@std/assert';
import { loadMigrations, migrate } from '../../src/db/migrate.ts';
import { openPglite } from '../../src/db/pglite.ts';
import { MIGRATIONS_DIR } from './harness.ts';

Deno.test('migrations apply in order on an empty database and a second run applies nothing', async () => {
  const { db, sql } = await openPglite();
  const migrations = await loadMigrations(MIGRATIONS_DIR);
  const first = await migrate(sql, migrations);
  assertEquals(first, migrations.map((m) => m.version));
  assertEquals(await migrate(sql, migrations), []);
  await db.close();
});

Deno.test('a migration changed after it was applied stops the run', async () => {
  const { db, sql } = await openPglite();
  const migrations = await loadMigrations(MIGRATIONS_DIR);
  await migrate(sql, migrations);
  const tampered = migrations.map((m, i) => i === 0 ? { ...m, checksum: 'x' } : m);
  await assertRejects(() => migrate(sql, tampered), Error, 'changed after it was applied');
  await db.close();
});

Deno.test('a failing migration leaves nothing behind', async () => {
  const { db, sql } = await openPglite();
  const migrations = await loadMigrations(MIGRATIONS_DIR);
  await migrate(sql, migrations);
  const bad = {
    version: '9999',
    name: '9999_bad.sql',
    sql: 'create table finly.half_done (id int); select 1/0;',
    checksum: 'b',
  };
  await assertRejects(() => migrate(sql, [...migrations, bad]));
  const rows = await sql.query(`select to_regclass('finly.half_done') as t`);
  assertEquals(rows, [{ t: null }]);
  await db.close();
});
